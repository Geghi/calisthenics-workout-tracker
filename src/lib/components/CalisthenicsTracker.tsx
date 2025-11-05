import React, { useState, useEffect, useRef } from "react";
import { Save, Download, Cloud, CloudOff, BookOpen } from "lucide-react";
import { useWorkoutPrograms } from "../hooks/useWorkoutPrograms";
import { useAuth } from "../hooks/useAuth";
import { useUserPreferences } from "../hooks/useUserPreferences";
import { notesService, UserNotes } from "../services/notesService";
import WorkoutSelector from "./WorkoutSelector";
import ExerciseTable from "./ExerciseTable";
import WorkoutTimer, { WorkoutTimerRef } from "./WorkoutTimer";

const CalisthenicsTracker: React.FC = () => {
  const {
    programs,
    selectedProgram,
    loading: programsLoading,
    error: programsError,
    selectProgram,
  } = useWorkoutPrograms();
  const { user, loading: authLoading, error: authError } = useAuth();
  const {
    preferences,
    loaded: preferencesLoaded,
    updateProgram,
    updateWeek,
    updateDay,
  } = useUserPreferences();
  const [selectedWeek, setSelectedWeek] = useState(1);
  const [selectedDay, setSelectedDay] = useState(1);
  const [initialized, setInitialized] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [notes, setNotes] = useState<UserNotes>({});
  const [syncStatus, setSyncStatus] = useState<
    "synced" | "syncing" | "offline"
  >("offline");
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const workoutTimerRef = useRef<WorkoutTimerRef>(null);

  // Set user ID for notes service when user is authenticated
  useEffect(() => {
    if (user) {
      notesService.setUserId(user.uid);
      loadNotesFromCloud();
    }
  }, [user]);

  // Initialize with user preferences when programs and preferences are loaded
  useEffect(() => {
    if (programs.length > 0 && preferencesLoaded && !initialized) {
      // Set program based on preferences or default to first program
      const preferredProgramId = preferences.lastSelectedProgramId;
      const preferredProgram = preferredProgramId
        ? programs.find((p) => p.id === preferredProgramId)
        : null;

      if (preferredProgram) {
        selectProgram(preferredProgramId!);
      } else if (programs.length > 0) {
        // If preferred program doesn't exist, use first available
        selectProgram(programs[0].id);
        updateProgram(programs[0].id);
      }

      // Set week and day from preferences
      setSelectedWeek(preferences.lastSelectedWeek);
      setSelectedDay(preferences.lastSelectedDay);

      setInitialized(true);
    }
  }, [
    programs,
    preferencesLoaded,
    initialized,
    preferences,
    selectProgram,
    updateProgram,
  ]);

  // Update preferences when program changes (with delay to prevent loops)
  useEffect(() => {
    if (initialized && selectedProgram) {
      const timeoutId = setTimeout(() => {
        updateProgram(selectedProgram.id);
      }, 100);
      return () => clearTimeout(timeoutId);
    }
  }, [selectedProgram?.id, initialized]);

  // Update preferences when week changes (with delay to prevent loops)
  useEffect(() => {
    if (initialized) {
      const timeoutId = setTimeout(() => {
        updateWeek(selectedWeek);
      }, 100);
      return () => clearTimeout(timeoutId);
    }
  }, [selectedWeek, initialized]);

  // Update preferences when day changes (with delay to prevent loops)
  useEffect(() => {
    if (initialized) {
      const timeoutId = setTimeout(() => {
        updateDay(selectedDay);
      }, 100);
      return () => clearTimeout(timeoutId);
    }
  }, [selectedDay, initialized]);

  const loadNotesFromCloud = async () => {
    if (!user) return;

    try {
      setSyncStatus("syncing");
      const cloudNotes = await notesService.loadNotes();
      setNotes(cloudNotes);
      setSyncStatus("synced");
      setLastSynced(new Date());
    } catch (error) {
      console.error("Failed to load notes from cloud:", error);
      setSyncStatus("offline");
      // Fall back to localStorage if cloud fails
      const localNotes = localStorage.getItem("workout-notes");
      if (localNotes) {
        try {
          setNotes(JSON.parse(localNotes));
        } catch (parseError) {
          console.log("Error parsing local notes:", parseError);
        }
      }
    }
  };

  // Auto-save notes with debounce
  useEffect(() => {
    if (!user) return; // Don't save until authenticated

    const timeoutId = setTimeout(async () => {
      try {
        setSyncStatus("syncing");
        await notesService.saveNotes(notes);
        setSyncStatus("synced");
        setLastSynced(new Date());
        // Also save to localStorage as backup
        localStorage.setItem("workout-notes", JSON.stringify(notes));
      } catch (error) {
        console.error("Failed to auto-save to cloud:", error);
        setSyncStatus("offline");
        // Fall back to localStorage
        try {
          localStorage.setItem("workout-notes", JSON.stringify(notes));
        } catch (localError) {
          console.error("Failed to save locally:", localError);
        }
      }
    }, 1000); // Save after 1 second of inactivity

    return () => clearTimeout(timeoutId);
  }, [notes, user]);

  const updateNote = (
    week: number,
    day: number,
    exerciseId: string,
    value: string
  ) => {
    const key = `w${week}-d${day}-${exerciseId}`;
    setNotes((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const exportData = () => {
    const dataStr = JSON.stringify(notes, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "calisthenics-progress.json";
    link.click();
  };

  // Helper function to find current week data
  const getCurrentWeekData = () => {
    if (!selectedProgram) return null;

    const weekKeys = Object.keys(selectedProgram.weeks);
    const matchingKey = weekKeys.find((key) => {
      if (key.includes("-")) {
        const [start, end] = key.split("-").map(Number);
        return selectedWeek >= start && selectedWeek <= end;
      }
      return Number(key) === selectedWeek;
    });

    return matchingKey ? selectedProgram.weeks[matchingKey] : null;
  };

  const currentWeekData = getCurrentWeekData();
  const currentDayData = currentWeekData?.days[selectedDay.toString()];

  // Show loading if either programs or auth is loading
  if (programsLoading || authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-400">
            {authLoading
              ? "Connecting to cloud..."
              : "Loading workout programs..."}
          </p>
        </div>
      </div>
    );
  }

  // Show error if either programs or auth failed
  const error = programsError || authError;
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-gray-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">Error loading application</p>
          <p className="text-gray-400 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-gray-100 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
            🏋️‍♂️ {selectedProgram?.title}
          </h1>
          <p className="text-gray-400 text-sm mb-4">
            {selectedProgram?.subtitle}
          </p>

          {/* Program Selector */}
          {programs.length > 1 && (
            <div className="mb-4">
              <label className="block text-sm font-semibold mb-2 text-orange-400">
                Select Workout Program
              </label>
              <select
                value={selectedProgram?.id || ""}
                onChange={(e) => selectProgram(e.target.value)}
                className="mx-auto block bg-gray-900 border border-gray-700 rounded px-4 py-2 focus:outline-none focus:border-orange-500 text-center"
              >
                {programs.map((program) => (
                  <option key={program.id} value={program.id}>
                    {program.title}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Sync Status */}
          <div className="flex items-center justify-center gap-2 text-sm">
            {syncStatus === "synced" && (
              <>
                <Cloud size={16} className="text-green-400" />
                <span className="text-green-400">Synced to cloud</span>
                {lastSynced && (
                  <span className="text-gray-500">
                    {lastSynced.toLocaleTimeString()}
                  </span>
                )}
              </>
            )}
            {syncStatus === "syncing" && (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-500"></div>
                <span className="text-orange-400">Syncing...</span>
              </>
            )}
            {syncStatus === "offline" && (
              <>
                <CloudOff size={16} className="text-gray-500" />
                <span className="text-gray-500">
                  Offline - using local backup
                </span>
              </>
            )}
          </div>
        </div>

        {/* Week & Day Selector */}
        <WorkoutSelector
          selectedWeek={selectedWeek}
          selectedDay={selectedDay}
          onWeekChange={setSelectedWeek}
          onDayChange={setSelectedDay}
          currentWeekData={currentWeekData}
        />

        {/* Workout Timer */}
        {currentDayData && (
          <WorkoutTimer
            ref={workoutTimerRef}
            workoutData={currentDayData}
            onStartExercise={(exerciseId) => {
              // This callback will be triggered from ExerciseTable buttons
              console.log("Exercise start requested:", exerciseId);
            }}
          />
        )}

        {/* Workout Content */}
        {currentDayData && (
          <div className="bg-gray-800/50 rounded-lg p-4 mb-6 backdrop-blur">
            <h2 className="text-2xl font-bold mb-4 text-center text-orange-400">
              {currentDayData.name}
            </h2>

            <ExerciseTable
              exercises={currentDayData.skill || []}
              type="skill"
              selectedWeek={selectedWeek}
              selectedDay={selectedDay}
              notes={notes}
              onNoteChange={updateNote}
              onStartExercise={(exerciseId) =>
                workoutTimerRef.current?.startExercise(exerciseId)
              }
            />
            <ExerciseTable
              exercises={currentDayData.strength || []}
              type="strength"
              selectedWeek={selectedWeek}
              selectedDay={selectedDay}
              notes={notes}
              onNoteChange={updateNote}
              onStartExercise={(exerciseId) =>
                workoutTimerRef.current?.startExercise(exerciseId)
              }
            />
            <ExerciseTable
              exercises={currentDayData.core || []}
              type="core"
              selectedWeek={selectedWeek}
              selectedDay={selectedDay}
              notes={notes}
              onNoteChange={updateNote}
              onStartExercise={(exerciseId) =>
                workoutTimerRef.current?.startExercise(exerciseId)
              }
            />
            <ExerciseTable
              exercises={currentDayData.conditioning || []}
              type="conditioning"
              selectedWeek={selectedWeek}
              selectedDay={selectedDay}
              notes={notes}
              onNoteChange={updateNote}
              onStartExercise={(exerciseId) =>
                workoutTimerRef.current?.startExercise(exerciseId)
              }
            />
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 justify-center flex-wrap">
          <button
            onClick={exportData}
            className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            <Download size={20} />
            Export Data
          </button>
        </div>

        {/* Footer Notes */}
        <div className="mt-8 bg-gray-800/30 rounded-lg p-4 text-sm text-gray-400">
          <h3 className="font-bold text-orange-400 mb-2">
            💡 Program Guidelines
          </h3>
          <ul className="space-y-1">
            {selectedProgram?.guidelines.map(
              (guideline: string, index: number) => (
                <li key={index}>• {guideline}</li>
              )
            )}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default CalisthenicsTracker;
