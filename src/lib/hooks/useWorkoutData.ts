import { useState, useEffect } from "react";

interface WorkoutProgram {
  program: {
    title: string;
    subtitle: string;
    weeks: Record<string, WeekData>;
  };
  guidelines: string[];
}

interface WeekData {
  phase: string;
  description: string;
  days: Record<string, DayData>;
}

interface DayData {
  name: string;
  skill?: Exercise[];
  strength?: Exercise[];
  core?: Exercise[];
  conditioning?: Exercise[];
}

interface Exercise {
  name: string;
  sets: number;
  reps: string | number;
  rest: string;
}

export const useWorkoutData = () => {
  const [data, setData] = useState<WorkoutProgram | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadWorkoutData = async () => {
      try {
        const response = await fetch("/workout-program.json");
        if (!response.ok) {
          throw new Error("Failed to load workout data");
        }
        const workoutData: WorkoutProgram = await response.json();
        setData(workoutData);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Unknown error";
        setError(errorMessage);
        console.error("Error loading workout data:", err);
      } finally {
        setLoading(false);
      }
    };

    loadWorkoutData();
  }, []);

  return { data, loading, error };
};
