
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
      try {
        console.log("Saving attachments to localStorage:", attachments.length);
        const data = JSON.stringify(attachments);
        
        // Check if data would exceed localStorage quota (roughly 5-10MB)
        if (data.length > 5 * 1024 * 1024) { // 5MB limit
          console.warn("Attachments data exceeds recommended localStorage size");
          // Keep only most recent 50 attachments to prevent quota issues
          const recentAttachments = attachments.slice(-50);
          localStorage.setItem("project-attachments", JSON.stringify(recentAttachments));
          console.log("Saved reduced attachments to localStorage:", recentAttachments.length);
        } else {
          localStorage.setItem("project-attachments", data);
          console.log("Successfully saved all attachments to localStorage");
        }
      } catch (error) {
        console.error("Failed to save attachments to localStorage:", error);
        // Try to clear space and save again
        try {
          const reducedAttachments = attachments.slice(-20); // Keep only 20 most recent
          localStorage.setItem("project-attachments", JSON.stringify(reducedAttachments));
          console.log("Saved reduced attachments after error:", reducedAttachments.length);
        } catch (secondError) {
          console.error("Failed to save even reduced attachments:", secondError);
          // If all else fails, clear the localStorage and start fresh
          localStorage.removeItem("project-attachments");
          console.log("Cleared localStorage due to persistent errors");
        }
      }
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
