
import { useState } from "react";
import { ProjectAttachment } from "@/types/project";

export const useProjectAttachments = () => {
  const [attachments, setAttachments] = useState<ProjectAttachment[]>([]);

  const addAttachment = (attachment: Omit<ProjectAttachment, "id">) => {
    const newAttachment: ProjectAttachment = {
      ...attachment,
      id: Date.now().toString(),
    };
    setAttachments(prev => [...prev, newAttachment]);
  };

  const getAttachmentsForProject = (projectId: string) => {
    return attachments.filter(attachment => attachment.projectId === projectId);
  };

  return {
    attachments,
    addAttachment,
    getAttachmentsForProject,
  };
};
