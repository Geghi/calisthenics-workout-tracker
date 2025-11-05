import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase/config";

export interface UserNotes {
  [key: string]: string;
}

export class NotesService {
  private static instance: NotesService;
  private userId: string | null = null;

  static getInstance(): NotesService {
    if (!NotesService.instance) {
      NotesService.instance = new NotesService();
    }
    return NotesService.instance;
  }

  setUserId(userId: string) {
    this.userId = userId;
  }

  private getUserDocRef() {
    if (!this.userId) {
      throw new Error("User ID not set. Call setUserId() first.");
    }
    if (!db) {
      throw new Error("Firebase not configured");
    }
    return doc(db, "userNotes", this.userId);
  }

  async saveNotes(notes: UserNotes): Promise<void> {
    // If Firebase is not configured, skip cloud save
    if (!db) {
      console.log("Firebase not configured - skipping cloud save");
      return;
    }

    try {
      const docRef = this.getUserDocRef();
      await setDoc(
        docRef,
        {
          notes,
          lastUpdated: serverTimestamp(),
        },
        { merge: true }
      );
    } catch (error) {
      console.error("Error saving notes:", error);
      throw new Error("Failed to save notes to cloud");
    }
  }

  async loadNotes(): Promise<UserNotes> {
    // If Firebase is not configured, return empty notes
    if (!db) {
      console.log("Firebase not configured - using local storage only");
      return {};
    }

    try {
      const docRef = this.getUserDocRef();
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        return data.notes || {};
      }

      // Return empty notes if no document exists
      return {};
    } catch (error) {
      console.error("Error loading notes:", error);
      throw new Error("Failed to load notes from cloud");
    }
  }

  async updateNote(noteKey: string, value: string): Promise<void> {
    // If Firebase is not configured, skip cloud update
    if (!db) {
      console.log("Firebase not configured - skipping cloud update");
      return;
    }

    try {
      const docRef = this.getUserDocRef();
      const updateData: any = {
        [`notes.${noteKey}`]: value,
        lastUpdated: serverTimestamp(),
      };

      await updateDoc(docRef, updateData);
    } catch (error) {
      console.error("Error updating note:", error);
      throw new Error("Failed to update note in cloud");
    }
  }
}

export const notesService = NotesService.getInstance();
