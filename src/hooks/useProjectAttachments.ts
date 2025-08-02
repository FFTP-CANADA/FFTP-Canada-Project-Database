
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
  await LocalStorageManager.setItem('project-attachments', attachments);
  console.log('✅ Attachments saved to localStorage');
  
  // Verify the data was actually saved
  const verified = LocalStorageManager.getItem('project-attachments', []);
  console.log('🔍 Verification: Read back', verified.length, 'attachments from storage');
  
  notifyAttachmentListeners(attachments);
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
    console.log('📎 Adding new attachment:', attachment.fileName, 'for project:', attachment.projectId);
    console.log('📎 Current global attachments count:', globalAttachments.length);
    console.log('📎 Attachment data received:', {
      projectId: attachment.projectId,
      fileName: attachment.fileName,
      fileSize: attachment.fileSize,
      fileType: attachment.fileType,
      hasFileUrl: !!attachment.fileUrl,
      fileUrlLength: attachment.fileUrl?.length
    });
    
    const newAttachment: ProjectAttachment = {
      ...attachment,
      id: Date.now().toString(),
    };
    
    console.log('📎 New attachment created with ID:', newAttachment.id);
    const updatedAttachments = [...globalAttachments, newAttachment];
    console.log('📎 Updated attachments array length:', updatedAttachments.length);
    console.log('📎 About to save attachments...');
    
    await saveAttachments(updatedAttachments);
    console.log('📎 Attachment save completed - final count:', updatedAttachments.length);
  }, []);

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
