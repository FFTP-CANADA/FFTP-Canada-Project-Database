
import { useState, useEffect } from "react";
import { ProjectAttachment } from "@/types/project";

export const useProjectAttachments = () => {
  const [attachments, setAttachments] = useState<ProjectAttachment[]>([]);

  // Load attachments from localStorage on component mount
  useEffect(() => {
    console.log("Loading attachments from localStorage...");
    const savedAttachments = localStorage.getItem("project-attachments");
    console.log("Raw saved attachments:", savedAttachments);
    
    if (savedAttachments) {
      try {
        const parsedAttachments = JSON.parse(savedAttachments);
        console.log("Parsed attachments:", parsedAttachments);
        setAttachments(parsedAttachments);
      } catch (error) {
        console.error("Error loading attachments from localStorage:", error);
      }
    } else {
      console.log("No saved attachments found in localStorage");
    }
  }, []);

  // Save attachments to localStorage whenever attachments change
  useEffect(() => {
    if (attachments.length > 0) {
      console.log("Saving attachments to localStorage:", attachments);
      localStorage.setItem("project-attachments", JSON.stringify(attachments));
    }
  }, [attachments]);

  const addAttachment = (attachment: Omit<ProjectAttachment, "id">) => {
    console.log("Adding attachment:", attachment);
    const newAttachment: ProjectAttachment = {
      ...attachment,
      id: Date.now().toString(),
    };
    console.log("New attachment with ID:", newAttachment);
    setAttachments(prev => {
      const updated = [...prev, newAttachment];
      console.log("Updated attachments array:", updated);
      return updated;
    });
  };

  const deleteAttachment = (id: string) => {
    console.log("Deleting attachment:", id);
    setAttachments(prev => {
      const updated = prev.filter(attachment => attachment.id !== id);
      console.log("Updated attachments after deletion:", updated);
      // Update localStorage immediately when deleting
      if (updated.length === 0) {
        localStorage.removeItem("project-attachments");
      } else {
        localStorage.setItem("project-attachments", JSON.stringify(updated));
      }
      return updated;
    });
  };

  const getAttachmentsForProject = (projectId: string) => {
    const projectAttachments = attachments.filter(attachment => attachment.projectId === projectId);
    console.log(`Attachments for project ${projectId}:`, projectAttachments);
    return projectAttachments;
  };

  return {
    attachments,
    addAttachment,
    deleteAttachment,
    getAttachmentsForProject,
  };
};
