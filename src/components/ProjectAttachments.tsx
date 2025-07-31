import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Upload, Download, Trash2, File, X } from "lucide-react";
import { ProjectAttachment } from "@/hooks/useProjectData";
import { useToast } from "@/hooks/use-toast";

interface ProjectAttachmentsProps {
  projectId: string;
  projectName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  attachments: ProjectAttachment[];
  onAddAttachment: (attachment: Omit<ProjectAttachment, "id">) => void;
  onDeleteAttachment: (id: string) => void;
}

const ProjectAttachments = ({ 
  projectId, 
  projectName, 
  open, 
  onOpenChange, 
  attachments, 
  onAddAttachment,
  onDeleteAttachment
}: ProjectAttachmentsProps) => {
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const { toast } = useToast();

  const handleFileUpload = (files: FileList | null) => {
    if (!files) return;
    
    const fileArray = Array.from(files);
    setUploadFiles(prev => [...prev, ...fileArray]);
  };

  const removeUploadFile = (index: number) => {
    setUploadFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSaveAttachments = () => {
    uploadFiles.forEach(file => {
      const attachment: Omit<ProjectAttachment, "id"> = {
        projectId,
        fileName: file.name,
        fileUrl: URL.createObjectURL(file), // In real app, upload to server first
        fileSize: file.size,
        uploadDate: new Date().toISOString(),
        fileType: file.type || "application/octet-stream"
      };
      onAddAttachment(attachment);
    });

    setUploadFiles([]);
    toast({
      title: "Success",
      description: `${uploadFiles.length} file(s) uploaded successfully`,
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.includes('pdf')) return '📄';
    if (fileType.includes('word') || fileType.includes('document')) return '📝';
    if (fileType.includes('excel') || fileType.includes('spreadsheet')) return '📊';
    if (fileType.includes('image')) return '🖼️';
    return '📎';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-blue-900">Project Attachments</DialogTitle>
          <DialogDescription className="text-blue-600">
            Manage documents and files for: {projectName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Upload Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-blue-900">Upload New Files</h3>
            <div className="border-2 border-dashed border-blue-200 rounded-lg p-6">
              <div className="flex items-center justify-center">
                <label className="cursor-pointer flex flex-col items-center">
                  <Upload className="w-12 h-12 text-blue-400 mb-4" />
                  <span className="text-lg text-blue-600 mb-2">Upload Documents</span>
                  <span className="text-sm text-blue-500">PDF, DOC, XLS, TXT files supported</span>
                  <input
                    type="file"
                    multiple
                    className="hidden"
                    onChange={(e) => handleFileUpload(e.target.files)}
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.csv"
                  />
                </label>
              </div>
            </div>

            {uploadFiles.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-blue-900">Files to Upload</h4>
                {uploadFiles.map((file, index) => (
                  <div key={index} className="flex items-center justify-between bg-blue-50 p-3 rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{getFileIcon(file.type)}</span>
                      <div>
                        <p className="font-medium text-blue-900">{file.name}</p>
                        <p className="text-sm text-blue-600">{formatFileSize(file.size)}</p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeUploadFile(index)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                <Button 
                  onClick={handleSaveAttachments}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Save {uploadFiles.length} File(s)
                </Button>
              </div>
            )}
          </div>

          {/* Existing Attachments */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-blue-900">Existing Files ({attachments.length})</h3>
            {attachments.length === 0 ? (
              <div className="text-center py-8 text-blue-500">
                No files uploaded yet
              </div>
            ) : (
              <div className="grid gap-3">
                {attachments.map((attachment) => (
                  <div key={attachment.id} className="flex items-center justify-between bg-white border border-blue-200 p-4 rounded-lg">
                    <div className="flex items-center gap-4">
                      <span className="text-3xl">{getFileIcon(attachment.fileType)}</span>
                      <div>
                        <p className="font-medium text-blue-900">{attachment.fileName}</p>
                        <div className="flex gap-4 text-sm text-blue-600">
                          <span>{formatFileSize(attachment.fileSize)}</span>
                          <span>Uploaded: {new Date(attachment.uploadDate).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-blue-300 text-blue-600 hover:bg-blue-50"
                      >
                        <Download className="w-4 h-4 mr-1" />
                        Download
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-red-300 text-red-600 hover:bg-red-50"
                        onClick={() => {
                          onDeleteAttachment(attachment.id);
                          toast({
                            title: "File Deleted",
                            description: `${attachment.fileName} has been deleted`,
                          });
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProjectAttachments;
