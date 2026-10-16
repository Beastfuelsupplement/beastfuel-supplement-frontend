// Session management with auto-logout after 1 hour of inactivity 
// and session cleanup on browser close when "Remember Me" is not selected.

const INACTIVITY_TIMEOUT_MS = 60 * 60 * 1000; // 1 hour in milliseconds
const ACTIVITY_THROTTLE_MS = 10 * 1000; // Throttle activity updates to once every 10s
const CHECK_INTERVAL_MS = 15 * 1000; // Check inactivity every 15 seconds

export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  AUTH_REMEMBER: 'auth_remember',
  LAST_ACTIVITY: 'auth_last_activity',
  SESSION_COOKIE: 'beastfuel_session_active',
  SESSION_STORAGE_ACTIVE: 'beastfuel_tab_session_active',
} as const;

export type SessionInvalidReason = 'inactivity' | 'browser_closed' | 'unauthorized' | 'no_token';

/**
 * Sets a session cookie that expires when the browser/session is closed.
 */
export const setSessionCookie = () => {
  if (typeof document === 'undefined') return;
  document.cookie = `${STORAGE_KEYS.SESSION_COOKIE}=1; path=/; SameSite=Lax`;
  try {
    sessionStorage.setItem(STORAGE_KEYS.SESSION_STORAGE_ACTIVE, '1');
  } catch (e) {
    // ignore sessionStorage errors
  }
};

/**
 * Clears the session cookie.
 */
export const clearSessionCookie = () => {
  if (typeof document === 'undefined') return;
  document.cookie = `${STORAGE_KEYS.SESSION_COOKIE}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
  try {
    sessionStorage.removeItem(STORAGE_KEYS.SESSION_STORAGE_ACTIVE);
  } catch (e) {
    // ignore
  }
};

/**
 * Checks if the browser-session cookie or tab session is still alive.
 */
export const hasActiveSessionCookie = (): boolean => {
  if (typeof document === 'undefined') return false;
  const hasCookie = document.cookie
    .split(';')
    .some((item) => item.trim().startsWith(`${STORAGE_KEYS.SESSION_COOKIE}=`));
  
  let hasSessionStorage = false;
  try {
    hasSessionStorage = sessionStorage.getItem(STORAGE_KEYS.SESSION_STORAGE_ACTIVE) === '1';
  } catch (e) {
    // ignore
  }

  return hasCookie || hasSessionStorage;
};

/**
 * Checks if the user checked "Remember Me".
 */
export const isRememberMe = (): boolean => {
  if (typeof localStorage === 'undefined') return false;
  return localStorage.getItem(STORAGE_KEYS.AUTH_REMEMBER) === 'true';
};

/**
 * Gets the timestamp of last user activity.
 */
export const getLastActivityTime = (): number => {
  if (typeof localStorage === 'undefined') return Date.now();
  const raw = localStorage.getItem(STORAGE_KEYS.LAST_ACTIVITY);
  if (!raw) return Date.now();
  const parsed = parseInt(raw, 10);
  return isNaN(parsed) ? Date.now() : parsed;
};

/**
 * Records user activity timestamp in localStorage.
 */
let lastRecordedTime = 0;
export const recordActivity = (force: boolean = false) => {
  const now = Date.now();
  if (force || now - lastRecordedTime >= ACTIVITY_THROTTLE_MS) {
    lastRecordedTime = now;
    try {
      localStorage.setItem(STORAGE_KEYS.LAST_ACTIVITY, now.toString());
    } catch (e) {
      // Ignore storage errors
    }
  }
};

/**
 * Saves auth credentials and establishes session state.
 */
export const setAuthSession = (token: string, remember: boolean = false) => {
  if (typeof localStorage === 'undefined') return;

  if (remember) {
    localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
    localStorage.setItem(STORAGE_KEYS.AUTH_REMEMBER, 'true');
    clearSessionCookie();
  } else {
    // When "Remember Me" is not checked, user wants session to end when browser closes.
    // We store token and mark with a browser session cookie.
    localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
    localStorage.removeItem(STORAGE_KEYS.AUTH_REMEMBER);
    setSessionCookie();
  }

  recordActivity(true);
};

/**
 * Completely clears auth session credentials and storage.
 */
export const clearAuthSession = () => {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.AUTH_REMEMBER);
    localStorage.removeItem(STORAGE_KEYS.LAST_ACTIVITY);
    sessionStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    sessionStorage.removeItem(STORAGE_KEYS.SESSION_STORAGE_ACTIVE);
    clearSessionCookie();
  } catch (e) {
    // Ignore
  }
};

/**
 * Checks if the current session is valid.
 * Validates:
 * 1. Token existence
 * 2. Browser close without Remember Me
 * 3. 1-hour inactivity timeout
 */
export const checkSessionValidity = (): { valid: boolean; reason?: SessionInvalidReason } => {
  if (typeof localStorage === 'undefined') return { valid: true };

  const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN) || 
                (typeof sessionStorage !== 'undefined' ? sessionStorage.getItem(STORAGE_KEYS.AUTH_TOKEN) : null);
  
  if (!token) {
    return { valid: false, reason: 'no_token' };
  }

  // If user did NOT check Remember Me, verify if browser session is still active
  if (!isRememberMe()) {
    if (!hasActiveSessionCookie()) {
      // User closed browser without logging out and reopened later
      return { valid: false, reason: 'browser_closed' };
    }
  }

  // Check 1-hour inactivity
  const lastActivity = getLastActivityTime();
  const elapsed = Date.now() - lastActivity;
  if (elapsed >= INACTIVITY_TIMEOUT_MS) {
    return { valid: false, reason: 'inactivity' };
  }

  return { valid: true };
};

/**
 * Returns remaining milliseconds before inactivity timeout.
 */
export const getRemainingInactivityTime = (): number => {
  const lastActivity = getLastActivityTime();
  const elapsed = Date.now() - lastActivity;
  return Math.max(0, INACTIVITY_TIMEOUT_MS - elapsed);
};

/**
 * Initializes listeners for user activity and sets up the 1-hour inactivity timer.
 */
export const initInactivityTracker = (
  onTimeout: (reason: SessionInvalidReason) => void
): (() => void) => {
  if (typeof window === 'undefined') return () => {};

  // Record activity on user interactions
  const handleUserActivity = () => {
    recordActivity();
  };

  const activityEvents: (keyof WindowEventMap)[] = [
    'mousemove',
    'mousedown',
    'keydown',
    'touchstart',
    'scroll',
    'wheel',
  ];

  activityEvents.forEach((event) => {
    window.addEventListener(event, handleUserActivity, { passive: true });
  });

  // Check validity periodically
  const intervalId = window.setInterval(() => {
    const status = checkSessionValidity();
    if (!status.valid && status.reason) {
      onTimeout(status.reason);
    }
  }, CHECK_INTERVAL_MS);

  // Check immediately when tab gains focus or user switches back
  const handleVisibilityOrFocus = () => {
    if (document.visibilityState === 'visible') {
      const status = checkSessionValidity();
      if (!status.valid && status.reason) {
        onTimeout(status.reason);
      } else {
        recordActivity();
      }
    }
  };

  window.addEventListener('focus', handleVisibilityOrFocus);
  document.addEventListener('visibilitychange', handleVisibilityOrFocus);

  // Multi-tab synchronization via storage event
  const handleStorageChange = (e: StorageEvent) => {
    if (e.key === STORAGE_KEYS.AUTH_TOKEN && !e.newValue) {
      // User logged out in another tab
      onTimeout('unauthorized');
    }
  };
  window.addEventListener('storage', handleStorageChange);

  // Return cleanup function
  return () => {
    activityEvents.forEach((event) => {
      window.removeEventListener(event, handleUserActivity);
    });
    window.clearInterval(intervalId);
    window.removeEventListener('focus', handleVisibilityOrFocus);
    document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
    window.removeEventListener('storage', handleStorageChange);
  };
};
