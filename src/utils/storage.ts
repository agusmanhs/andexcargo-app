import AsyncStorage from '@react-native-async-storage/async-storage';

const RECENT_TRACKING_KEY = '@andexcargo_recent_tracking';

export const StorageService = {
  async getRecentTracking(): Promise<string[]> {
    try {
      const data = await AsyncStorage.getItem(RECENT_TRACKING_KEY);
      if (!data) return [];
      return JSON.parse(data);
    } catch {
      return [];
    }
  },

  async addRecentTracking(resi: string): Promise<string[]> {
    try {
      const clean = resi.trim().toUpperCase();
      if (!clean) return [];
      const current = await StorageService.getRecentTracking();
      // Remove if exists and prepend to top (max 8 items)
      const filtered = current.filter(item => item !== clean);
      const updated = [clean, ...filtered].slice(0, 8);
      await AsyncStorage.setItem(RECENT_TRACKING_KEY, JSON.stringify(updated));
      return updated;
    } catch {
      return [];
    }
  },

  async removeRecentTracking(resi: string): Promise<string[]> {
    try {
      const current = await StorageService.getRecentTracking();
      const updated = current.filter(item => item !== resi);
      await AsyncStorage.setItem(RECENT_TRACKING_KEY, JSON.stringify(updated));
      return updated;
    } catch {
      return [];
    }
  },

  async clearRecentTracking(): Promise<void> {
    try {
      await AsyncStorage.removeItem(RECENT_TRACKING_KEY);
    } catch {
      // ignore
    }
  },
};
