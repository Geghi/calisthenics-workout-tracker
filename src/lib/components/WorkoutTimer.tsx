import React, { forwardRef, useImperativeHandle } from "react";
import {
  Play,
  Pause,
  Square,
  SkipForward,
  FastForward,
  Plus,
  Minus,
} from "lucide-react";
import { useWorkoutTimer, WorkoutSection } from "../hooks/useWorkoutTimer";

interface WorkoutTimerProps {
  workoutData: WorkoutSection;
  onStartExercise?: (exerciseId: string) => void;
}

export interface WorkoutTimerRef {
  startExercise: (exerciseId: string) => void;
}

const WorkoutTimer = forwardRef<WorkoutTimerRef, WorkoutTimerProps>(
  ({ workoutData, onStartExercise }, ref) => {
    const {
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
    } = useWorkoutTimer(workoutData);

    useImperativeHandle(ref, () => ({
      startExercise: (exerciseId: string) => {
        startExercise(exerciseId);
        onStartExercise?.(exerciseId);
      },
    }));

    const formatTime = (seconds: number): string => {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins}:${secs.toString().padStart(2, "0")}`;
    };

    const getPhaseColor = (phase: string): string => {
      switch (phase) {
        case "working":
          return "text-green-400 bg-green-400/20";
        case "resting":
          return "text-orange-400 bg-orange-400/20";
        default:
          return "text-gray-400 bg-gray-400/20";
      }
    };

    const currentExercise = getCurrentExercise();

    if (state.phase === "idle" && !state.isActive) {
      return (
        <div className="bg-gray-800/50 rounded-lg p-6 mb-6 text-center">
          <h2 className="text-xl font-bold mb-4 text-orange-400">
            🏃‍♂️ Workout Timer
          </h2>
          <button
            onClick={startWorkout}
            className="bg-green-600 hover:bg-green-700 px-8 py-4 rounded-lg font-bold text-lg transition-colors flex items-center gap-2 mx-auto"
          >
            <Play size={24} />
            Start Workout
          </button>
        </div>
      );
    }

    return (
      <>
        {/* Floating Timer */}
        <div className="fixed top-4 left-4 right-4 z-50 bg-gray-900/95 backdrop-blur-md rounded-lg border border-gray-700 shadow-lg">
          <div className="p-4">
            {/* Compact Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-orange-400">⏱️</span>
                <span className="text-sm font-semibold text-orange-400">
                  {state.currentSection} • Set {state.currentSet}
                </span>
              </div>
              <div className="text-xs text-gray-400">
                {formatTime(state.totalWorkoutTime)}
              </div>
            </div>

            {/* Current Exercise Name */}
            {currentExercise && (
              <div className="mb-3">
                <h3 className="text-sm font-bold text-white truncate">
                  {currentExercise.name}
                </h3>
              </div>
            )}

            {/* Timer and Controls in Single Row */}
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div
                className={`px-4 py-2 rounded-lg ${getPhaseColor(state.phase)}`}
              >
                <div className="text-2xl font-bold">
                  {formatTime(state.timeRemaining)}
                </div>
                <div className="text-xs uppercase tracking-wide">
                  {state.phase === "working" ? "WORK" : "REST"}
                </div>
              </div>

              {/* Time Adjustment */}
              <div className="flex gap-1">
                <button
                  onClick={() => addTime(-15)}
                  className="bg-gray-700 hover:bg-gray-600 px-3 py-1 rounded text-xs font-semibold transition-colors"
                >
                  -15s
                </button>
                <button
                  onClick={() => addTime(15)}
                  className="bg-gray-700 hover:bg-gray-600 px-3 py-1 rounded text-xs font-semibold transition-colors"
                >
                  +15s
                </button>
              </div>

              {/* Start/Stop Controls */}
              <div className="flex gap-1">
                {state.isActive ? (
                  <button
                    onClick={pauseWorkout}
                    className="bg-yellow-600 hover:bg-yellow-700 px-4 py-1 rounded text-xs font-semibold transition-colors"
                  >
                    <Pause size={14} className="inline mr-1" />
                    Pause
                  </button>
                ) : (
                  <button
                    onClick={resumeWorkout}
                    className="bg-green-600 hover:bg-green-700 px-4 py-1 rounded text-xs font-semibold transition-colors"
                  >
                    <Play size={14} className="inline mr-1" />
                    Resume
                  </button>
                )}
                <button
                  onClick={stopWorkout}
                  className="bg-red-600 hover:bg-red-700 px-4 py-1 rounded text-xs font-semibold transition-colors"
                >
                  <Square size={14} className="inline mr-1" />
                  Stop
                </button>
              </div>

              {/* Skip Controls */}
              <div className="flex gap-1">
                <button
                  onClick={skipSet}
                  className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-xs font-semibold transition-colors"
                  title="Skip Set"
                >
                  <SkipForward size={14} className="inline mr-1" />
                  Skip Set
                </button>
                <button
                  onClick={skipExercise}
                  className="bg-purple-600 hover:bg-purple-700 px-3 py-1 rounded text-xs font-semibold transition-colors"
                  title="Skip Exercise"
                >
                  <FastForward size={14} className="inline mr-1" />
                  Skip Exercise
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Spacer for floating timer */}
        <div className="h-32"></div>
      </>
    );
  }
);

WorkoutTimer.displayName = "WorkoutTimer";

export default WorkoutTimer;
