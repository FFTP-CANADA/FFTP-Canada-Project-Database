import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Upload, Download, Trash2, File, X } from "lucide-react";
import { ProjectAttachment } from "@/types/project";
import { useToast } from "@/hooks/use-toast";
import { formatDateForDisplay, getCurrentESTTimestamp } from "@/utils/dateUtils";

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

  const handleSaveAttachments = async () => {
    if (!projectId || uploadFiles.length === 0) {
      toast({
        title: "Error", 
        description: "No files selected",
        variant: "destructive"
      });
      return;
    }

    try {
      for (const file of uploadFiles) {
        if (file.size > 10 * 1024 * 1024) { // 10MB limit
          throw new Error(`File "${file.name}" is too large. Maximum size is 10MB.`);
        }
        
        const base64Data = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = () => reject(new Error(`Failed to read ${file.name}`));
          reader.readAsDataURL(file);
        });

        const attachment = {
          projectId,
          fileName: file.name,
          fileUrl: base64Data,
          fileSize: file.size,
          uploadDate: getCurrentESTTimestamp(),
          fileType: file.type || "application/octet-stream"
        };
        
        onAddAttachment(attachment);
      }

      setUploadFiles([]);
      toast({
        title: "Success",
        description: `${uploadFiles.length} file(s) uploaded successfully`,
      });
      
    } catch (error) {
      setUploadFiles([]);
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: "destructive"
      });
    }
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

  const handleDownload = (attachment: ProjectAttachment) => {
    try {
      if (!attachment.fileUrl?.startsWith('data:')) {
        throw new Error('Invalid file format');
      }

      const [, base64Data] = attachment.fileUrl.split(',');
      const byteCharacters = atob(base64Data);
      const byteArray = new Uint8Array(byteCharacters.length);
      
      for (let i = 0; i < byteCharacters.length; i++) {
        byteArray[i] = byteCharacters.charCodeAt(i);
      }
      
      const blob = new Blob([byteArray], { type: attachment.fileType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = attachment.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
    } catch (error) {
      toast({
        title: "Download Failed", 
        description: "Unable to download file",
        variant: "destructive"
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Project Files</DialogTitle>
          <DialogDescription>
            Manage files for: {projectName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Upload Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Upload New Files</h3>
            <div className="border-2 border-dashed border-gray-200 rounded-lg p-6">
              <div className="flex items-center justify-center">
                <label className="cursor-pointer flex flex-col items-center">
                  <Upload className="w-12 h-12 text-gray-400 mb-4" />
                  <span className="text-lg mb-2">Upload Files</span>
                  <span className="text-sm text-gray-500">PDF, DOC, XLS, TXT files (Max 10MB)</span>
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
              <div className="space-y-4">
                <h4 className="font-medium">Files to Upload</h4>
                {uploadFiles.map((file, index) => (
                  <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{getFileIcon(file.type)}</span>
                      <div>
                        <p className="font-medium">{file.name}</p>
                        <p className="text-sm text-gray-600">{formatFileSize(file.size)}</p>
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
                  className="w-full"
                >
                  Save {uploadFiles.length} File(s)
                </Button>
              </div>
            )}
          </div>

          {/* Existing Files */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Existing Files ({attachments.length})</h3>
            {attachments.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <File className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p>No files uploaded yet</p>
              </div>
            ) : (
              <div className="grid gap-3">
                {attachments.map((attachment) => (
                  <div key={attachment.id} className="flex items-center justify-between bg-white border p-4 rounded-lg">
                    <div className="flex items-center gap-4">
                      <span className="text-3xl">{getFileIcon(attachment.fileType)}</span>
                      <div>
                        <p className="font-medium">{attachment.fileName}</p>
                        <div className="flex gap-4 text-sm text-gray-600">
                          <span>{formatFileSize(attachment.fileSize)}</span>
                          <span>Uploaded: {formatDateForDisplay(attachment.uploadDate)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownload(attachment)}
                      >
                        <Download className="w-4 h-4 mr-1" />
                        Download
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete File</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete "{attachment.fileName}"?
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => {
                                onDeleteAttachment(attachment.id);
                                toast({
                                  title: "File Deleted",
                                  description: `${attachment.fileName} has been deleted`,
                                });
                              }}
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
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
