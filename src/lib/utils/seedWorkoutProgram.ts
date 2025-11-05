import { workoutProgramsService } from "../services/workoutProgramsService";

// Seed the current workout program to Firebase
export const seedWorkoutProgram = async () => {
  try {
    // Load the current program from the static file
    const response = await fetch("/workout-program.json");
    if (!response.ok) {
      throw new Error("Failed to load workout program from static file");
    }

    const programData = await response.json();

    // Save to Firebase
    const programId = await workoutProgramsService.saveProgram({
      title: programData.program.title,
      subtitle: programData.program.subtitle,
      weeks: programData.program.weeks,
      guidelines: programData.guidelines,
    });

    console.log("✅ Workout program seeded to Firebase with ID:", programId);
    return programId;
  } catch (error) {
    console.error("❌ Failed to seed workout program:", error);
    throw error;
  }
};

// Utility to check if programs exist and seed if needed
export const ensureWorkoutProgramsExist = async () => {
  try {
    const programs = await workoutProgramsService.getAllPrograms();

    // Check if we already have the default program (avoid duplicates)
    const defaultProgramExists = programs.some(
      (p) => p.title === "8-Week Calisthenics Hybrid Program"
    );

    if (!defaultProgramExists) {
      console.log("Default workout program not found. Seeding...");
      await seedWorkoutProgram();
      console.log("✅ Default workout program seeded successfully!");

      // Return updated list
      return await workoutProgramsService.getAllPrograms();
    } else {
      console.log(
        `✅ Found ${programs.length} workout program(s) including default`
      );
    }

    return programs;
  } catch (error) {
    console.error("❌ Failed to check/seed workout programs:", error);
    throw error;
  }
};
