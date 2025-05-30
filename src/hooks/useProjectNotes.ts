
import { useState, useEffect } from "react";
import { ProjectNote } from "@/types/project";

export const useProjectNotes = () => {
  const [notes, setNotes] = useState<ProjectNote[]>([]);

  // Load notes from localStorage on component mount
  useEffect(() => {
    const savedNotes = localStorage.getItem("project-notes");
    if (savedNotes) {
      try {
        const parsedNotes = JSON.parse(savedNotes);
        setNotes(parsedNotes);
      } catch (error) {
        console.error("Error loading notes from localStorage:", error);
      }
    }
  }, []);

  // Save notes to localStorage whenever notes change
  useEffect(() => {
    localStorage.setItem("project-notes", JSON.stringify(notes));
  }, [notes]);

  const addNote = (note: Omit<ProjectNote, "id">) => {
    const newNote: ProjectNote = {
      ...note,
      id: Date.now().toString(),
    };
    setNotes(prev => [...prev, newNote]);
  };

  const getNotesForProject = (projectId: string) => {
    return notes.filter(note => note.projectId === projectId);
  };

  return {
    notes,
    addNote,
    getNotesForProject,
  };
};
