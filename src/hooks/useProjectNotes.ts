
import { useState, useEffect } from "react";
import { ProjectNote } from "@/types/project";
import { LocalStorageManager } from "@/utils/localStorageManager";

type StorageKey = "project-notes";

export const useProjectNotes = () => {
  const [notes, setNotes] = useState<ProjectNote[]>([]);

  // Load notes from storage on component mount
  useEffect(() => {
    const loadNotes = async () => {
      try {
        const savedNotes = LocalStorageManager.getItem<ProjectNote[]>("project-notes" as StorageKey, []);
        // Sort notes by date and time (newest first)
        const sortedNotes = savedNotes.sort((a, b) => {
          const dateA = new Date(`${a.dateOfNote} ${a.id}`);
          const dateB = new Date(`${b.dateOfNote} ${b.id}`);
          return dateB.getTime() - dateA.getTime();
        });
        setNotes(sortedNotes);
        console.log("📝 Loaded project notes:", sortedNotes.length);
      } catch (error) {
        console.error("❌ Error loading notes from storage:", error);
        setNotes([]);
      }
    };
    
    loadNotes();
  }, []);

  // Save notes to storage whenever notes change
  useEffect(() => {
    if (notes.length > 0 || localStorage.getItem("project-notes")) {
      const saveNotes = async () => {
        try {
          const success = await LocalStorageManager.setItem("project-notes" as StorageKey, notes);
          if (success) {
            console.log("✅ Saved project notes:", notes.length);
          } else {
            console.error("❌ Failed to save project notes");
          }
        } catch (error) {
          console.error("❌ Error saving notes to storage:", error);
        }
      };
      
      saveNotes();
    }
  }, [notes]);

  const addNote = (note: Omit<ProjectNote, "id">) => {
    const newNote: ProjectNote = {
      ...note,
      id: Date.now().toString(),
    };
    setNotes(prev => {
      const updated = [...prev, newNote];
      // Sort notes by date and time (newest first)
      return updated.sort((a, b) => {
        const dateA = new Date(`${a.dateOfNote} ${a.id}`);
        const dateB = new Date(`${b.dateOfNote} ${b.id}`);
        return dateB.getTime() - dateA.getTime();
      });
    });
    console.log("📝 Added new note for project:", note.projectId);
  };

  const getNotesForProject = (projectId: string) => {
    return notes.filter(note => note.projectId === projectId)
      .sort((a, b) => {
        const dateA = new Date(`${a.dateOfNote} ${a.id}`);
        const dateB = new Date(`${b.dateOfNote} ${b.id}`);
        return dateB.getTime() - dateA.getTime();
      });
  };

  return {
    notes,
    addNote,
    getNotesForProject,
  };
};
