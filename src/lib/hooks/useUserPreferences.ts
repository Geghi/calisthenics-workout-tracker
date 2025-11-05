import { useState, useEffect } from "react";

export interface UserPreferences {
  lastSelectedProgramId: string | null;
  lastSelectedWeek: number;
  lastSelectedDay: number;
}

const PREFERENCES_KEY = "workout-user-preferences";

const DEFAULT_PREFERENCES: UserPreferences = {
  lastSelectedProgramId: null,
  lastSelectedWeek: 1,
  lastSelectedDay: 1,
};

export const useUserPreferences = () => {
  const [preferences, setPreferences] =
    useState<UserPreferences>(DEFAULT_PREFERENCES);
  const [loaded, setLoaded] = useState(false);

  // Load preferences from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(PREFERENCES_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setPreferences({ ...DEFAULT_PREFERENCES, ...parsed });
      }
    } catch (error) {
      console.error("Error loading user preferences:", error);
    } finally {
      setLoaded(true);
    }
  }, []);

  // Save preferences to localStorage whenever they change
  useEffect(() => {
    if (loaded) {
      try {
        localStorage.setItem(PREFERENCES_KEY, JSON.stringify(preferences));
      } catch (error) {
        console.error("Error saving user preferences:", error);
      }
    }
  }, [
    preferences.lastSelectedProgramId,
    preferences.lastSelectedWeek,
    preferences.lastSelectedDay,
    loaded,
  ]);

  const updateProgram = (programId: string) => {
    setPreferences((prev) => ({
      ...prev,
      lastSelectedProgramId: programId,
    }));
  };

  const updateWeek = (week: number) => {
    setPreferences((prev) => ({
      ...prev,
      lastSelectedWeek: week,
    }));
  };

  const updateDay = (day: number) => {
    setPreferences((prev) => ({
      ...prev,
      lastSelectedDay: day,
    }));
  };

  const updateProgramAndWeek = (programId: string, week: number) => {
    setPreferences((prev) => ({
      ...prev,
      lastSelectedProgramId: programId,
      lastSelectedWeek: week,
    }));
  };

  const resetToDefaults = () => {
    setPreferences(DEFAULT_PREFERENCES);
  };

  return {
    preferences,
    loaded,
    updateProgram,
    updateWeek,
    updateDay,
    updateProgramAndWeek,
    resetToDefaults,
  };
};
