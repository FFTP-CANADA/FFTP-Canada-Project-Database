import { ErrorBoundary } from "@/components/ErrorBoundary";
import ProjectAttachments from "@/components/ProjectAttachments";
import { ProjectAttachment } from "@/types/project";

interface SafeProjectAttachmentsProps {
  projectId: string;
  projectName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  attachments: ProjectAttachment[];
  onAddAttachment: (attachment: Omit<ProjectAttachment, "id">) => void;
  onDeleteAttachment: (id: string) => void;
}

export const SafeProjectAttachments = (props: SafeProjectAttachmentsProps) => {
  return (
    <ErrorBoundary fallback={
      <div className="p-4 text-center">
        <h3 className="text-lg font-semibold text-red-600 mb-2">File System Error</h3>
        <p className="text-sm text-gray-600 mb-4">
          There was an issue loading the file attachments. This might be due to browser storage limitations or a corrupted file.
        </p>
        <button 
          onClick={() => props.onOpenChange(false)}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Close and Try Again
        </button>
      </div>
    }>
      <ProjectAttachments {...props} />
    </ErrorBoundary>
  );
};