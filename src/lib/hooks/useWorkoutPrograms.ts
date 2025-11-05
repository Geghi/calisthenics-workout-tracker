import { useState, useEffect } from "react";
import {
  workoutProgramsService,
  WorkoutProgram,
} from "../services/workoutProgramsService";
import { ensureWorkoutProgramsExist } from "../utils/seedWorkoutProgram";

export const useWorkoutPrograms = () => {
  const [programs, setPrograms] = useState<WorkoutProgram[]>([]);
  const [selectedProgramId, setSelectedProgramId] = useState<string | null>(
    null
  );
  const [selectedProgram, setSelectedProgram] = useState<WorkoutProgram | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load all available programs
  const loadPrograms = async () => {
    try {
      setLoading(true);
      setError(null);

      // Ensure programs exist (will seed if needed)
      const allPrograms = await ensureWorkoutProgramsExist();
      setPrograms(allPrograms);

      // Auto-select the first program if none selected
      if (allPrograms.length > 0 && !selectedProgramId) {
        setSelectedProgramId(allPrograms[0].id);
        setSelectedProgram(allPrograms[0]);
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to load programs";
      setError(errorMessage);
      console.error("Error loading workout programs:", err);
    } finally {
      setLoading(false);
    }
  };

  // Load a specific program
  const loadProgram = async (programId: string) => {
    try {
      setLoading(true);
      setError(null);
      const program = await workoutProgramsService.getProgram(programId);
      if (program) {
        setSelectedProgramId(programId);
        setSelectedProgram(program);
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to load program";
      setError(errorMessage);
      console.error("Error loading workout program:", err);
    } finally {
      setLoading(false);
    }
  };

  // Select a program
  const selectProgram = (programId: string) => {
    const program = programs.find((p) => p.id === programId);
    if (program) {
      setSelectedProgramId(programId);
      setSelectedProgram(program);
    }
  };

  // Refresh programs list
  const refreshPrograms = () => {
    loadPrograms();
  };

  useEffect(() => {
    loadPrograms();
  }, []);

  return {
    programs,
    selectedProgramId,
    selectedProgram,
    loading,
    error,
    selectProgram,
    loadProgram,
    refreshPrograms,
  };
};
