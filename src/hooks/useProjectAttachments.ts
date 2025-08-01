
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
  await LocalStorageManager.setItem('project-attachments', attachments);
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
    const newAttachment: ProjectAttachment = {
      ...attachment,
      id: Date.now().toString(),
    };
    
    const updatedAttachments = [...globalAttachments, newAttachment];
    await saveAttachments(updatedAttachments);
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
