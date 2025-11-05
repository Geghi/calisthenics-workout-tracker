import { useState, useEffect, useCallback, useRef } from "react";

export interface WorkoutExercise {
  name: string;
  sets: number;
  reps: string | number;
  rest: string;
}

export interface WorkoutSection {
  skill?: WorkoutExercise[];
  strength?: WorkoutExercise[];
  core?: WorkoutExercise[];
  conditioning?: WorkoutExercise[];
}

export type TimerPhase = "idle" | "working" | "resting";

export interface WorkoutTimerState {
  isActive: boolean;
  phase: TimerPhase;
  currentSection: keyof WorkoutSection;
  currentExerciseIndex: number;
  currentSet: number;
  timeRemaining: number;
  totalWorkoutTime: number;
  workoutStartTime: number | null;
  isSingleExercise: boolean;
}

const parseRestTime = (rest: string): number => {
  console.log("Rest time:", rest);
  if (rest === "-" || rest === "") return 0;

  // Handle formats like "2 min", "90s", "60s"
  const minMatch = rest.match(/(\d+)\s*min/i);
  if (minMatch) return parseInt(minMatch[1]) * 60;

  const secMatch = rest.match(/(\d+)\s*s/i);
  if (secMatch) return parseInt(secMatch[1]);

  // Default to 60 seconds if parsing fails
  return 60;
};

const parseWorkTime = (reps: string | number): number => {
  console.log("Work time:", reps);

  // Check if reps is a number - if so, treat as reps and multiply by 4
  if (typeof reps === "number") {
    return reps * 4; // 4 seconds per rep
  }

  if (typeof reps !== "string") return 30; // fallback

  // Check if the primary number is followed by 's' (time-based)
  // Look for patterns like "45s" or "30-40s" where the main number indicates seconds
  const timePattern = /^(\d+)\s*-\s*\d+\s*s|^(\d+)\s*s\b/;
  const timeMatch = reps.match(timePattern);

  if (timeMatch) {
    // It's time-based, use the first number found
    return parseInt(timeMatch[1] || timeMatch[2]);
  }

  // It's rep-based, extract the first number and multiply by 4 seconds per rep
  const repMatch = reps.match(/^(\d+)/);
  if (repMatch) {
    return parseInt(repMatch[1]) * 4; // 4 seconds per rep
  }

  // Fallback
  return 30;
};

export const useWorkoutTimer = (workoutData: WorkoutSection) => {
  const [state, setState] = useState<WorkoutTimerState>({
    isActive: false,
    phase: "idle",
    currentSection: "skill",
    currentExerciseIndex: 0,
    currentSet: 1,
    timeRemaining: 0,
    totalWorkoutTime: 0,
    workoutStartTime: null,
    isSingleExercise: false,
  });

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Initialize audio context
  useEffect(() => {
    audioContextRef.current = new (window.AudioContext ||
      (window as any).webkitAudioContext)();
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  const playAudioCue = useCallback(
    async (type: "start" | "rest" | "complete") => {
      if (!audioContextRef.current) return;

      try {
        const context = audioContextRef.current;
        const oscillator = context.createOscillator();
        const gainNode = context.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(context.destination);

        // Different frequencies for different cues
        const frequencies = {
          start: 800, // High pitch for start
          rest: 600, // Medium pitch for rest
          complete: 400, // Low pitch for complete
        };

        oscillator.frequency.setValueAtTime(
          frequencies[type],
          context.currentTime
        );
        gainNode.gain.setValueAtTime(0.3, context.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(
          0.01,
          context.currentTime + 0.5
        );

        oscillator.start(context.currentTime);
        oscillator.stop(context.currentTime + 0.5);
      } catch (error) {
        console.warn("Audio playback failed:", error);
      }
    },
    []
  );

  const getCurrentExercise = useCallback((): WorkoutExercise | null => {
    const section = workoutData[state.currentSection];
    if (!section) return null;
    return section[state.currentExerciseIndex] || null;
  }, [workoutData, state.currentSection, state.currentExerciseIndex]);

  const getNextExercise = useCallback((): {
    section: keyof WorkoutSection;
    index: number;
  } | null => {
    const sections: (keyof WorkoutSection)[] = [
      "skill",
      "strength",
      "core",
      "conditioning",
    ];
    const currentSectionIndex = sections.indexOf(state.currentSection);

    // Try next exercise in current section
    const currentSection = workoutData[state.currentSection];
    if (
      currentSection &&
      state.currentExerciseIndex < currentSection.length - 1
    ) {
      return {
        section: state.currentSection,
        index: state.currentExerciseIndex + 1,
      };
    }

    // Try next section
    for (let i = currentSectionIndex + 1; i < sections.length; i++) {
      const nextSection = workoutData[sections[i]];
      if (nextSection && nextSection.length > 0) {
        return { section: sections[i], index: 0 };
      }
    }

    return null; // No more exercises
  }, [workoutData, state.currentSection, state.currentExerciseIndex]);

  const startWorkout = useCallback(() => {
    const firstSection: keyof WorkoutSection = "skill";
    const firstSectionData = workoutData[firstSection];

    if (!firstSectionData || firstSectionData.length === 0) {
      console.warn("No exercises found to start workout");
      return;
    }

    const firstExercise = firstSectionData[0];
    console.log("Starting workout with first exercise:", firstExercise);
    console.log("Exercise object:", firstExercise);
    const workTime = parseWorkTime(firstExercise.reps);

    setState({
      isActive: true,
      phase: "working",
      currentSection: firstSection,
      currentExerciseIndex: 0,
      currentSet: 1,
      timeRemaining: workTime,
      totalWorkoutTime: 0,
      workoutStartTime: Date.now(),
      isSingleExercise: false,
    });

    playAudioCue("start");
  }, [workoutData, playAudioCue]);

  const startExercise = useCallback(
    (exerciseId: string) => {
      // Parse exercise ID to get section and index
      const [sectionType, exerciseIndexStr] = exerciseId.split("-");
      const exerciseIndex = parseInt(exerciseIndexStr);

      const sectionData = workoutData[sectionType as keyof WorkoutSection];
      if (!sectionData || !sectionData[exerciseIndex]) {
        console.warn("Exercise not found:", exerciseId);
        return;
      }

      const exercise = sectionData[exerciseIndex];
      console.log("Starting single exercise:", exercise);
      console.log("Exercise object:", exercise);
      const workTime = parseWorkTime(exercise.reps);

      setState({
        isActive: true,
        phase: "working",
        currentSection: sectionType as keyof WorkoutSection,
        currentExerciseIndex: exerciseIndex,
        currentSet: 1,
        timeRemaining: workTime,
        totalWorkoutTime: 0,
        workoutStartTime: Date.now(),
        isSingleExercise: true,
      });

      playAudioCue("start");
    },
    [workoutData, playAudioCue]
  );

  const pauseWorkout = useCallback(() => {
    setState((prev) => ({ ...prev, isActive: false }));
  }, []);

  const resumeWorkout = useCallback(() => {
    setState((prev) => ({ ...prev, isActive: true }));
  }, []);

  const stopWorkout = useCallback(() => {
    setState({
      isActive: false,
      phase: "idle",
      currentSection: "skill",
      currentExerciseIndex: 0,
      currentSet: 1,
      timeRemaining: 0,
      totalWorkoutTime: 0,
      workoutStartTime: null,
      isSingleExercise: false,
    });

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const addTime = useCallback((seconds: number) => {
    setState((prev) => ({
      ...prev,
      timeRemaining: Math.max(0, prev.timeRemaining + seconds),
    }));
  }, []);

  const handlePhaseTransition = useCallback(() => {
    setState((prev) => {
      const newTotalTime = prev.workoutStartTime
        ? Math.floor((Date.now() - prev.workoutStartTime) / 1000)
        : prev.totalWorkoutTime;

      // Phase transition
      const currentExercise = getCurrentExercise();
      if (!currentExercise) return prev;

      if (prev.phase === "working") {
        // Move to rest phase
        const restTime = parseRestTime(currentExercise.rest);
        if (restTime > 0) {
          playAudioCue("rest");
          return {
            ...prev,
            phase: "resting",
            timeRemaining: restTime,
            totalWorkoutTime: newTotalTime,
          };
        } else {
          // No rest, move to next set
          return handleSetTransition(prev, currentExercise, newTotalTime);
        }
      } else if (prev.phase === "resting") {
        // Move to next set
        return handleSetTransition(prev, currentExercise, newTotalTime);
      }

      return prev;
    });
  }, [getCurrentExercise, playAudioCue]);

  const skipSet = useCallback(() => {
    // Directly trigger the next phase transition
    handlePhaseTransition();
  }, [handlePhaseTransition]);

  const skipExercise = useCallback(() => {
    const nextExercise = getNextExercise();
    if (nextExercise) {
      const nextSectionData = workoutData[nextExercise.section];
      if (nextSectionData && nextSectionData[nextExercise.index]) {
        const nextExerciseData = nextSectionData[nextExercise.index];
        const workTime = parseWorkTime(nextExerciseData.reps);
        setState((prev) => ({
          ...prev,
          currentSection: nextExercise.section,
          currentExerciseIndex: nextExercise.index,
          currentSet: 1,
          phase: "working" as TimerPhase,
          timeRemaining: workTime,
        }));
        playAudioCue("start");
      }
    } else {
      // Workout complete
      stopWorkout();
      playAudioCue("complete");
    }
  }, [getNextExercise, workoutData, playAudioCue, stopWorkout]);

  // Timer countdown logic
  useEffect(() => {
    if (!state.isActive || state.phase === "idle") {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    console.log(
      `Timer started for phase: ${state.currentExerciseIndex}, time remaining: ${state.timeRemaining}s`
    );
    intervalRef.current = setInterval(() => {
      setState((prev) => {
        const newTimeRemaining = prev.timeRemaining - 1;
        const newTotalTime = prev.workoutStartTime
          ? Math.floor((Date.now() - prev.workoutStartTime) / 1000)
          : prev.totalWorkoutTime;

        if (newTimeRemaining <= 0) {
          // Phase transition
          const currentExercise = getCurrentExercise();
          if (!currentExercise) return prev;

          if (prev.phase === "working") {
            // Move to rest phase
            const restTime = parseRestTime(currentExercise.rest);
            if (restTime > 0) {
              playAudioCue("rest");
              return {
                ...prev,
                phase: "resting",
                timeRemaining: restTime,
                totalWorkoutTime: newTotalTime,
              };
            } else {
              // No rest, move to next set
              return handleSetTransition(prev, currentExercise, newTotalTime);
            }
          } else if (prev.phase === "resting") {
            // Move to next set
            return handleSetTransition(prev, currentExercise, newTotalTime);
          }
        }

        return {
          ...prev,
          timeRemaining: newTimeRemaining,
          totalWorkoutTime: newTotalTime,
        };
      });
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [state.isActive, state.phase, getCurrentExercise, playAudioCue]);

  const handleSetTransition = (
    prev: WorkoutTimerState,
    currentExercise: WorkoutExercise,
    totalTime: number
  ): WorkoutTimerState => {
    const nextSet = prev.currentSet + 1;
    if (nextSet <= currentExercise.sets) {
      // Move to next set
      console.log(
        `Auto-advancing to next set: ${nextSet}/${currentExercise.sets} for ${currentExercise.name}`
      );
      const workTime = parseWorkTime(currentExercise.reps);
      playAudioCue("start");
      return {
        ...prev,
        currentSet: nextSet,
        phase: "working" as TimerPhase,
        timeRemaining: workTime,
        totalWorkoutTime: totalTime,
      };
    } else {
      // All sets completed for current exercise
      if (prev.isSingleExercise) {
        // Single exercise mode - stop after completing all sets
        console.log(`Single exercise completed: ${currentExercise.name}`);
        playAudioCue("complete");
        return {
          ...prev,
          isActive: false,
          phase: "idle" as TimerPhase,
          timeRemaining: 0,
          totalWorkoutTime: totalTime,
        };
      } else {
        // Full workout mode - move to next exercise
        const nextExercise = getNextExercise();
        if (nextExercise) {
          const nextSectionData = workoutData[nextExercise.section];
          if (nextSectionData && nextSectionData[nextExercise.index]) {
            const nextExerciseData = nextSectionData[nextExercise.index];
            console.log(
              `Auto-advancing to next exercise: ${nextExerciseData.name} (${nextExercise.section})`
            );
            console.log("Next exercise object:", nextExerciseData);
            const workTime = parseWorkTime(nextExerciseData.reps);
            playAudioCue("start");
            return {
              ...prev,
              currentSection: nextExercise.section,
              currentExerciseIndex: nextExercise.index,
              currentSet: 1,
              phase: "working" as TimerPhase,
              timeRemaining: workTime,
              totalWorkoutTime: totalTime,
            };
          }
        }
        // Workout complete (fallback if no next exercise or data not found)
        console.log("Workout auto-completed!");
        playAudioCue("complete");
        return {
          ...prev,
          isActive: false,
          phase: "idle" as TimerPhase,
          timeRemaining: 0,
          totalWorkoutTime: totalTime,
        };
      }
    }
  };

  return {
    state,
    startWorkout,
    startExercise,
    pauseWorkout,
    resumeWorkout,
    stopWorkout,
    addTime,
    skipSet,
    skipExercise,
    getCurrentExercise,
  };
};
