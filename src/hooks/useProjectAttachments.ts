
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
  console.log('🔧 Saving attachments to storage:', attachments.length, 'attachments');
  console.log('🔧 Attachment data preview:', attachments.map(a => ({ id: a.id, fileName: a.fileName, projectId: a.projectId })));
  
  try {
    await LocalStorageManager.setItem('project-attachments', attachments);
    console.log('✅ Attachments saved to localStorage');
    
    // Verify the data was actually saved
    const verified = LocalStorageManager.getItem('project-attachments', []);
    console.log('🔍 Verification: Read back', verified.length, 'attachments from storage');
    
    // Update global state and notify all listeners
    globalAttachments = attachments;
    notifyAttachmentListeners(attachments);
    
    return true;
  } catch (error) {
    console.error('❌ Failed to save attachments:', error);
    return false;
  }
};

export const useProjectAttachments = () => {
  const [attachments, setAttachments] = useState<ProjectAttachment[]>(() => {
    if (globalAttachments.length > 0) return globalAttachments;
    const saved = LocalStorageManager.getItem('project-attachments', []);
    globalAttachments = saved;
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
    console.log('📎 Hook: Adding new attachment:', attachment.fileName, 'for project:', attachment.projectId);
    console.log('📎 Hook: Current global attachments count:', globalAttachments.length);
    console.log('📎 Hook: Current local state count:', attachments.length);
    
    if (!attachment.projectId) {
      console.error('❌ Hook: No projectId in attachment data');
      throw new Error('ProjectId is required for attachment');
    }
    
    const newAttachment: ProjectAttachment = {
      ...attachment,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };
    
    console.log('📎 Hook: New attachment created:', {
      id: newAttachment.id,
      projectId: newAttachment.projectId,
      fileName: newAttachment.fileName,
      fileSize: newAttachment.fileSize
    });
    
    const updatedAttachments = [...globalAttachments, newAttachment];
    console.log('📎 Hook: Updated attachments array:', {
      oldCount: globalAttachments.length,
      newCount: updatedAttachments.length,
      newAttachmentIndex: updatedAttachments.length - 1
    });
    
    // Save immediately and wait for completion
    const success = await saveAttachments(updatedAttachments);
    console.log('📎 Hook: Save result:', success);
    
    if (!success) {
      throw new Error('Failed to save attachment to storage');
    }
    
    // Verify the attachment was saved by checking if it exists in the updated list
    const savedAttachment = updatedAttachments.find(a => a.id === newAttachment.id);
    console.log('📎 Hook: Verification - attachment exists in list:', !!savedAttachment);
  }, [attachments.length]);

  const deleteAttachment = useCallback(async (id: string) => {
    const updatedAttachments = globalAttachments.filter(attachment => attachment.id !== id);
    await saveAttachments(updatedAttachments);
  }, []);

  const getAttachmentsForProject = useCallback((projectId: string) => {
    return globalAttachments.filter(attachment => attachment.projectId === projectId);
  }, []);

  return {
    attachments,
    addAttachment,
    deleteAttachment,
    getAttachmentsForProject,
  };
};
