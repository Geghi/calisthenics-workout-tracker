import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase/config";

export interface WorkoutProgram {
  id: string;
  title: string;
  subtitle: string;
  weeks: Record<string, WeekData>;
  guidelines: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface WeekData {
  phase: string;
  description: string;
  days: Record<string, DayData>;
}

export interface DayData {
  name: string;
  skill?: Exercise[];
  strength?: Exercise[];
  core?: Exercise[];
  conditioning?: Exercise[];
}

export interface Exercise {
  name: string;
  sets: number;
  reps: string | number;
  rest: string;
}

export class WorkoutProgramsService {
  private static instance: WorkoutProgramsService;

  static getInstance(): WorkoutProgramsService {
    if (!WorkoutProgramsService.instance) {
      WorkoutProgramsService.instance = new WorkoutProgramsService();
    }
    return WorkoutProgramsService.instance;
  }

  private getProgramsCollection() {
    if (!db) {
      throw new Error("Firebase not available");
    }
    return collection(db, "workoutPrograms");
  }

  async saveProgram(
    program: Omit<WorkoutProgram, "id" | "createdAt" | "updatedAt">
  ): Promise<string> {
    if (!db) {
      throw new Error("Firebase not available");
    }

    try {
      const docRef = doc(this.getProgramsCollection());
      const programData = {
        ...program,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await setDoc(docRef, programData);
      return docRef.id;
    } catch (error) {
      console.error("Error saving program:", error);
      throw new Error("Failed to save workout program");
    }
  }

  async getProgram(programId: string): Promise<WorkoutProgram | null> {
    if (!db) {
      throw new Error("Firebase not available");
    }

    try {
      const docRef = doc(this.getProgramsCollection(), programId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        } as WorkoutProgram;
      }

      return null;
    } catch (error) {
      console.error("Error loading program:", error);
      throw new Error("Failed to load workout program");
    }
  }

  async getAllPrograms(): Promise<WorkoutProgram[]> {
    if (!db) {
      throw new Error("Firebase not available");
    }

    try {
      const querySnapshot = await getDocs(this.getProgramsCollection());
      const programs: WorkoutProgram[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        programs.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        } as WorkoutProgram);
      });

      return programs.sort(
        (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()
      );
    } catch (error) {
      console.error("Error loading programs:", error);
      throw new Error("Failed to load workout programs");
    }
  }

  async updateProgram(
    programId: string,
    updates: Partial<Omit<WorkoutProgram, "id" | "createdAt">>
  ): Promise<void> {
    if (!db) {
      throw new Error("Firebase not available");
    }

    try {
      const docRef = doc(this.getProgramsCollection(), programId);
      await setDoc(
        docRef,
        {
          ...updates,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    } catch (error) {
      console.error("Error updating program:", error);
      throw new Error("Failed to update workout program");
    }
  }
}

export const workoutProgramsService = WorkoutProgramsService.getInstance();
