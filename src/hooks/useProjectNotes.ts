
import { useState } from "react";
import { ProjectNote } from "@/types/project";

export const useProjectNotes = () => {
  const [notes, setNotes] = useState<ProjectNote[]>([]);

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
