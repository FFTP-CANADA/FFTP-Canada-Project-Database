
import { useState, useEffect, useCallback } from "react";
import { ProjectAttachment } from "@/types/project";
import { LocalStorageManager } from "@/utils/localStorageManager";

let globalAttachments: ProjectAttachment[] = [];
let attachmentListeners: Array<(attachments: ProjectAttachment[]) => void> = [];

const notifyAttachmentListeners = (attachments: ProjectAttachment[]) => {
  globalAttachments = attachments;
  attachmentListeners.forEach(listener => listener(attachments));
};

const saveAttachments = async (attachments: ProjectAttachment[]) => {
  try {
    await LocalStorageManager.setItem('project-attachments', attachments);
    
    // Update global state and notify all listeners
    globalAttachments = attachments;
    notifyAttachmentListeners(attachments);
    
    return true;
  } catch (error) {
    console.error('SAVE ERROR:', error);
    return false;
  }
};

export const useProjectAttachments = () => {
  const [attachments, setAttachments] = useState<ProjectAttachment[]>(() => {
    // Always load from localStorage first, don't rely on global state
    const saved = LocalStorageManager.getItem('project-attachments', []);
    console.log('INITIALIZING ATTACHMENTS:', {
      savedCount: saved.length,
      globalCount: globalAttachments.length,
      savedData: saved.map(a => ({ id: a.id, fileName: a.fileName, projectId: a.projectId }))
    });
    
    globalAttachments = saved; // Update global state
    return saved;
  });

  useEffect(() => {
    const listener = (newAttachments: ProjectAttachment[]) => {
      setAttachments(newAttachments);
    };
    attachmentListeners.push(listener);
    
    return () => {
      attachmentListeners = attachmentListeners.filter(l => l !== listener);
    };
  }, []);

  const addAttachment = useCallback(async (attachment: Omit<ProjectAttachment, "id">) => {
    console.log('=== HOOK: ADD ATTACHMENT ===');
    console.log('A1. Received attachment:', {
      projectId: attachment.projectId,
      fileName: attachment.fileName,
      hasFileUrl: !!attachment.fileUrl,
      currentGlobalCount: globalAttachments.length
    });
    
    if (!attachment.projectId) {
      console.log('A2. ERROR: No projectId');
      throw new Error('ProjectId is required for attachment');
    }
    
    const newAttachment: ProjectAttachment = {
      ...attachment,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };
    
    console.log('A3. Created new attachment with ID:', newAttachment.id);
    
    const updatedAttachments = [...globalAttachments, newAttachment];
    console.log('A4. Updated array length:', updatedAttachments.length);
    
    const success = await saveAttachments(updatedAttachments);
    console.log('A5. Save result:', success);
    
    if (!success) {
      console.log('A6. ERROR: Save failed');
      throw new Error('Failed to save attachment to storage');
    }
    
    console.log('A7. Attachment successfully added');
  }, []);

  const deleteAttachment = useCallback(async (id: string) => {
    const updatedAttachments = globalAttachments.filter(attachment => attachment.id !== id);
    await saveAttachments(updatedAttachments);
  }, []);

  const getAttachmentsForProject = useCallback((projectId: string) => {
    // Always get fresh data from localStorage to ensure we have the latest
    const freshAttachments = LocalStorageManager.getItem('project-attachments', []);
    globalAttachments = freshAttachments; // Update global state
    
    const projectAttachments = freshAttachments.filter(attachment => attachment.projectId === projectId);
    console.log('GET ATTACHMENTS (FRESH):', {
      projectId,
      totalInStorage: freshAttachments.length,
      forThisProject: projectAttachments.length,
      attachmentDetails: projectAttachments.map(a => ({ id: a.id, fileName: a.fileName }))
    });
    return projectAttachments;
  }, []);

  return {
    attachments,
    addAttachment,
    deleteAttachment,
    getAttachmentsForProject,
  };
};
