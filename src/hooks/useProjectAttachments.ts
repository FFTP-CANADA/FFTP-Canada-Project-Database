
import { useState, useEffect, useCallback } from "react";
import { ProjectAttachment } from "@/types/project";
import { LocalStorageManager } from "@/utils/localStorageManager";
import { IndexedDBManager } from "@/utils/indexedDBManager";

let globalAttachments: ProjectAttachment[] = [];
let attachmentListeners: Array<(attachments: ProjectAttachment[]) => void> = [];

const notifyAttachmentListeners = (attachments: ProjectAttachment[]) => {
  globalAttachments = attachments;
  attachmentListeners.forEach(listener => listener(attachments));
};

const saveAttachments = async (attachments: ProjectAttachment[]) => {
  try {
    console.log('💾 Saving attachments to IndexedDB:', attachments.length);
    
    // Save all attachments individually to IndexedDB
    for (const attachment of attachments) {
      const success = await IndexedDBManager.saveAttachment(attachment);
      if (!success) {
        throw new Error(`Failed to save ${attachment.fileName} to IndexedDB`);
      }
    }
    
    // Update global state and notify listeners
    globalAttachments = attachments;
    notifyAttachmentListeners(attachments);
    
    console.log('✅ All attachments saved successfully');
    return true;
  } catch (error) {
    console.error('❌ SAVE ERROR:', error);
    // Try to recover by reverting to previous state
    const previousAttachments = await IndexedDBManager.getAllAttachments();
    globalAttachments = previousAttachments;
    notifyAttachmentListeners(previousAttachments);
    return false;
  }
};

export const useProjectAttachments = () => {
  const [attachments, setAttachments] = useState<ProjectAttachment[]>([]);

  // Load attachments from IndexedDB on initialization
  useEffect(() => {
    const loadAttachments = async () => {
      const saved = await IndexedDBManager.getAllAttachments();
      console.log('INITIALIZING ATTACHMENTS FROM INDEXEDDB:', saved.length);
      globalAttachments = saved;
      setAttachments(saved);
    };
    loadAttachments();
  }, []);

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
    await IndexedDBManager.deleteAttachment(id);
    const updatedAttachments = globalAttachments.filter(attachment => attachment.id !== id);
    globalAttachments = updatedAttachments;
    notifyAttachmentListeners(updatedAttachments);
  }, []);

  const getAttachmentsForProject = useCallback((projectId: string) => {
    // Use IndexedDB consistently - filter from global state
    const projectAttachments = globalAttachments.filter(attachment => attachment.projectId === projectId);
    console.log('GET ATTACHMENTS FOR PROJECT:', {
      projectId,
      totalInMemory: globalAttachments.length,
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
