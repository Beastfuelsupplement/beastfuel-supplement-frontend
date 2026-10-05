// Activity logging - simplified for Node.js backend
// Activity logging can be extended to call a backend endpoint when needed

export type ActivityEventType =
  | 'login'
  | 'logout'
  | 'password_change'
  | 'password_reset_request'
  | 'email_change'
  | '2fa_enabled'
  | '2fa_disabled'
  | 'backup_codes_regenerated'
  | 'backup_code_used'
  | 'login_failed';

interface LogActivityParams {
  eventType: ActivityEventType;
  description: string;
  metadata?: Record<string, any>;
}

export const logActivity = async ({ eventType, description, metadata = {} }: LogActivityParams): Promise<void> => {
  try {
    // Log to console for now - can be extended to send to backend
    console.log(`[Activity] ${eventType}: ${description}`, metadata);
  } catch (err) {
    console.error('Error logging activity:', err);
  }
};
