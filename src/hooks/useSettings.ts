import { useState, useEffect, useCallback } from 'react';

export interface SocialMediaAccount {
  id: string;
  platform: 'instagram' | 'twitter' | 'youtube' | 'facebook' | 'whatsapp' | 'tiktok' | 'linkedin' | 'discord' | 'telegram' | 'website' | string;
  label: string;
  url: string;
  enabled: boolean;
}

export interface SocialLinks {
  instagram: string;
  twitter: string;
  youtube: string;
  facebook: string;
  whatsapp?: string;
  tiktok?: string;
}

export interface SiteSettings {
  storeName: string;
  tagline: string;
  country?: string;
  storeEmail: string;
  storePhone: string;
  storeAddress: string;
  workingHours: string;
  weekendHours: string;
  contactSubtext: string;
  socialMediaAccounts: SocialMediaAccount[];
  socialLinks: SocialLinks;
  currency: string;
  timezone: string;
  adminEmail: string;
  lowStockThreshold: number;
}

export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  storeName: 'BEASTFUEL Supplements',
  tagline: 'Fuel Your Ascent. Premium supplements for peak performance and optimal recovery.',
  country: 'Sri Lanka',
  storeEmail: 'support@beastfuel.com',
  storePhone: '+1 (555) 123-4567',
  storeAddress: '123 Fitness Street, Gym City, GC 12345',
  workingHours: 'Mon - Fri: 9AM - 6PM',
  weekendHours: 'Sat - Sun: Closed',
  contactSubtext: 'We reply within 24 hours',
  socialMediaAccounts: [
    { id: 'soc-1', platform: 'instagram', label: 'Instagram', url: 'https://instagram.com/beastfuel', enabled: true },
    { id: 'soc-2', platform: 'twitter', label: 'Twitter / X', url: 'https://twitter.com/beastfuel', enabled: true },
    { id: 'soc-3', platform: 'youtube', label: 'YouTube', url: 'https://youtube.com/@beastfuel', enabled: true },
    { id: 'soc-4', platform: 'facebook', label: 'Facebook', url: 'https://facebook.com/beastfuel', enabled: true },
  ],
  socialLinks: {
    instagram: 'https://instagram.com/beastfuel',
    twitter: 'https://twitter.com/beastfuel',
    youtube: 'https://youtube.com/@beastfuel',
    facebook: 'https://facebook.com/beastfuel',
    whatsapp: '',
    tiktok: '',
  },
  currency: 'LKR',
  timezone: 'Asia/Colombo',
  adminEmail: 'admin@beastfuel.com',
  lowStockThreshold: 10,
};

const SETTINGS_STORAGE_KEY = 'beastfuel_site_settings';
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export function useSettings() {
  const [settings, setSettings] = useState<SiteSettings>(() => {
    try {
      const cached = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        return {
          ...DEFAULT_SITE_SETTINGS,
          ...parsed,
          socialMediaAccounts: Array.isArray(parsed.socialMediaAccounts) && parsed.socialMediaAccounts.length > 0
            ? parsed.socialMediaAccounts
            : DEFAULT_SITE_SETTINGS.socialMediaAccounts,
          socialLinks: {
            ...DEFAULT_SITE_SETTINGS.socialLinks,
            ...(parsed.socialLinks || {}),
          },
        };
      }
    } catch {
      // Ignore JSON error
    }
    return DEFAULT_SITE_SETTINGS;
  });

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`${API_BASE_URL}/settings`);
      if (!res.ok) {
        throw new Error(`Failed to load settings: ${res.statusText}`);
      }
      const data = await res.json();
      
      // Auto-reconstruct socialMediaAccounts if only legacy socialLinks existed
      let accounts = data.socialMediaAccounts;
      if (!Array.isArray(accounts) || accounts.length === 0) {
        const fallbackList: SocialMediaAccount[] = [];
        if (data.socialLinks?.instagram) fallbackList.push({ id: 'soc-1', platform: 'instagram', label: 'Instagram', url: data.socialLinks.instagram, enabled: true });
        if (data.socialLinks?.twitter) fallbackList.push({ id: 'soc-2', platform: 'twitter', label: 'Twitter / X', url: data.socialLinks.twitter, enabled: true });
        if (data.socialLinks?.youtube) fallbackList.push({ id: 'soc-3', platform: 'youtube', label: 'YouTube', url: data.socialLinks.youtube, enabled: true });
        if (data.socialLinks?.facebook) fallbackList.push({ id: 'soc-4', platform: 'facebook', label: 'Facebook', url: data.socialLinks.facebook, enabled: true });
        if (data.socialLinks?.whatsapp) fallbackList.push({ id: 'soc-5', platform: 'whatsapp', label: 'WhatsApp', url: data.socialLinks.whatsapp, enabled: true });
        if (data.socialLinks?.tiktok) fallbackList.push({ id: 'soc-6', platform: 'tiktok', label: 'TikTok', url: data.socialLinks.tiktok, enabled: true });
        accounts = fallbackList.length > 0 ? fallbackList : DEFAULT_SITE_SETTINGS.socialMediaAccounts;
      }

      const merged: SiteSettings = {
        ...DEFAULT_SITE_SETTINGS,
        ...data,
        socialMediaAccounts: accounts,
        socialLinks: {
          ...DEFAULT_SITE_SETTINGS.socialLinks,
          ...(data.socialLinks || {}),
        },
      };
      setSettings(merged);
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(merged));
    } catch (err: any) {
      console.warn('Could not fetch settings from API, using cached/defaults:', err.message);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateSettings = async (updates: Partial<SiteSettings>): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      // Optimistic local update
      const newMerged: SiteSettings = {
        ...settings,
        ...updates,
        socialMediaAccounts: updates.socialMediaAccounts || settings.socialMediaAccounts,
        socialLinks: {
          ...settings.socialLinks,
          ...(updates.socialLinks || {}),
        },
      };
      setSettings(newMerged);
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(newMerged));

      // Get auth token if available
      const token = localStorage.getItem('auth_token') || localStorage.getItem('token') || '';
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch(`${API_BASE_URL}/settings`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(newMerged),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Server returned ${res.status}`);
      }

      const savedData = await res.json();
      const finalSettings: SiteSettings = {
        ...DEFAULT_SITE_SETTINGS,
        ...savedData,
        socialMediaAccounts: Array.isArray(savedData.socialMediaAccounts) ? savedData.socialMediaAccounts : newMerged.socialMediaAccounts,
        socialLinks: {
          ...DEFAULT_SITE_SETTINGS.socialLinks,
          ...(savedData.socialLinks || {}),
        },
      };
      setSettings(finalSettings);
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(finalSettings));

      window.dispatchEvent(new CustomEvent('settings:updated', { detail: finalSettings }));
      return true;
    } catch (err: any) {
      console.error('Failed to update settings on server:', err);
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();

    const handleSettingsUpdated = (e: Event) => {
      const customEvent = e as CustomEvent<SiteSettings>;
      if (customEvent.detail) {
        setSettings(customEvent.detail);
      }
    };

    window.addEventListener('settings:updated', handleSettingsUpdated);
    return () => {
      window.removeEventListener('settings:updated', handleSettingsUpdated);
    };
  }, [fetchSettings]);

  return {
    settings,
    loading,
    error,
    updateSettings,
    refreshSettings: fetchSettings,
  };
}
