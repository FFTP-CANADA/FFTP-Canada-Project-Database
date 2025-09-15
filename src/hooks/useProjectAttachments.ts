
import { useState, useEffect, useCallback } from "react";
import { ProjectAttachment } from "@/types/project";
import { IndexedDBManager } from "@/utils/indexedDBManager";

let globalAttachments: ProjectAttachment[] = [];
let attachmentListeners: Array<(attachments: ProjectAttachment[]) => void> = [];

const notifyAttachmentListeners = (attachments: ProjectAttachment[]) => {
  globalAttachments = attachments;
  attachmentListeners.forEach(listener => {
    try {
      listener(attachments);
    } catch (error) {
      console.error('Error in attachment listener:', error);
    }
  });
};

const saveAttachments = async (attachments: ProjectAttachment[]) => {
  try {
    console.log('💾 Saving attachments to IndexedDB:', attachments.length);
    
    // Save all attachments individually to IndexedDB
    for (const attachment of attachments) {
      if (!attachment || !attachment.id) {
        console.warn('Skipping invalid attachment:', attachment);
        continue;
      }
      
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
    try {
      const previousAttachments = await IndexedDBManager.getAllAttachments();
      globalAttachments = previousAttachments || [];
      notifyAttachmentListeners(globalAttachments);
    } catch (recoveryError) {
      console.error('Failed to recover attachments:', recoveryError);
      globalAttachments = [];
      notifyAttachmentListeners([]);
    }
    return false;
  }
};

export const useProjectAttachments = () => {
  const [attachments, setAttachments] = useState<ProjectAttachment[]>([]);

  // Load attachments from IndexedDB on initialization
  useEffect(() => {
    const loadAttachments = async () => {
      try {
        const saved = await IndexedDBManager.getAllAttachments();
        console.log('INITIALIZING ATTACHMENTS FROM INDEXEDDB:', saved?.length || 0);
        const validAttachments = Array.isArray(saved) ? saved.filter(a => a && a.id) : [];
        globalAttachments = validAttachments;
        setAttachments(validAttachments);
      } catch (error) {
        console.error('Failed to load attachments on init:', error);
        globalAttachments = [];
        setAttachments([]);
      }
    };
    loadAttachments();
  }, []);

  useEffect(() => {
    const listener = (newAttachments: ProjectAttachment[]) => {
      try {
        const validAttachments = Array.isArray(newAttachments) ? newAttachments : [];
        setAttachments(validAttachments);
      } catch (error) {
        console.error('Error updating attachment state:', error);
        setAttachments([]);
      }
    };
    attachmentListeners.push(listener);
    
    return () => {
      attachmentListeners = attachmentListeners.filter(l => l !== listener);
    };
  }, []);

  const addAttachment = useCallback(async (attachment: Omit<ProjectAttachment, "id">) => {
    console.log('=== HOOK: ADD ATTACHMENT ===');
    
    try {
      if (!attachment || !attachment.projectId) {
        throw new Error('Invalid attachment data: missing projectId');
      }
      
      console.log('A1. Received attachment:', {
        projectId: attachment.projectId,
        fileName: attachment.fileName,
        hasFileUrl: !!attachment.fileUrl,
        currentGlobalCount: globalAttachments.length
      });
      
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
        throw new Error('Failed to save attachment to storage');
      }
      
      console.log('A7. Attachment successfully added');
    } catch (error) {
      console.error('ADD ATTACHMENT ERROR:', error);
      throw error; // Re-throw to be caught by caller
    }
  }, []);

  const deleteAttachment = useCallback(async (id: string) => {
    try {
      if (!id) {
        throw new Error('Invalid attachment ID');
      }
      
      await IndexedDBManager.deleteAttachment(id);
      const updatedAttachments = globalAttachments.filter(attachment => attachment.id !== id);
      globalAttachments = updatedAttachments;
      notifyAttachmentListeners(updatedAttachments);
    } catch (error) {
      console.error('DELETE ATTACHMENT ERROR:', error);
      throw error;
    }
  }, []);

  const getAttachmentsForProject = useCallback((projectId: string) => {
    try {
      if (!projectId) {
        console.warn('getAttachmentsForProject called with empty projectId');
        return [];
      }
      
      // Use IndexedDB consistently - filter from global state
      const validAttachments = Array.isArray(globalAttachments) ? globalAttachments : [];
      const projectAttachments = validAttachments.filter(attachment => 
        attachment && attachment.projectId === projectId
      );
      
      console.log('GET ATTACHMENTS FOR PROJECT:', {
        projectId,
        totalInMemory: validAttachments.length,
        forThisProject: projectAttachments.length,
        attachmentDetails: projectAttachments.map(a => ({ id: a?.id, fileName: a?.fileName }))
      });
      
      return projectAttachments;
    } catch (error) {
      console.error('GET ATTACHMENTS ERROR:', error);
      return [];
    }
  }, []);

  return {
    attachments: Array.isArray(attachments) ? attachments : [],
    addAttachment,
    deleteAttachment,
    getAttachmentsForProject,
  };
};
