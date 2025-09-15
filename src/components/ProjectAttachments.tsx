import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
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

  // Debug when dialog opens
  console.log('ATTACHMENT DIALOG RENDERED:', {
    projectId,
    projectName,
    attachmentsCount: attachments.length,
    open,
    uploadFilesCount: uploadFiles.length
  });

  const handleFileUpload = (files: FileList | null) => {
    console.log('📁 handleFileUpload called with:', files);
    if (!files) {
      console.log('❌ No files provided to handleFileUpload');
      return;
    }
    
    console.log('📁 Files count:', files.length);
    const fileArray = Array.from(files);
    console.log('📁 File array:', fileArray.map(f => ({ name: f.name, size: f.size })));
    setUploadFiles(prev => {
      const newFiles = [...prev, ...fileArray];
      console.log('📁 Updated uploadFiles, new count:', newFiles.length);
      return newFiles;
    });
  };

  const removeUploadFile = (index: number) => {
    setUploadFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSaveAttachments = async () => {
    console.log('=== DEBUGGING FILE UPLOAD ===');
    console.log('1. Upload started with:', {
      projectId,
      projectName,
      filesCount: uploadFiles.length,
      currentAttachmentsCount: attachments.length
    });

    if (!projectId || uploadFiles.length === 0) {
      console.log('ERROR: Missing projectId or no files');
      toast({
        title: "Error",
        description: "No project selected or no files to upload",
        variant: "destructive"
      });
      return;
    }

    try {
      // Process files one by one to prevent memory overload
      for (const file of uploadFiles) {
        console.log('2. Processing file:', file.name, 'Size:', Math.round(file.size / 1024), 'KB');
        
        // Reduced file size limit to prevent crashes (20MB)
        if (file.size > 20 * 1024 * 1024) {
          throw new Error(`File "${file.name}" is too large. Maximum size is 20MB to prevent system issues.`);
        }

        // Add memory check before processing large files
        if (file.size > 5 * 1024 * 1024) { // 5MB+
          console.log('⚠️ Processing large file, monitoring memory usage');
          
          // Force garbage collection if available (development)
          if (window.gc) {
            window.gc();
          }
        }
        
        const base64Data = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          
          reader.onload = () => {
            try {
              const result = reader.result as string;
              console.log('3. File converted to base64, size:', Math.round(result.length / 1024), 'KB');
              resolve(result);
            } catch (error) {
              console.error('Error processing file result:', error);
              reject(new Error(`Failed to process ${file.name}`));
            }
          };
          
          reader.onerror = () => {
            console.error('FileReader error for file:', file.name, reader.error);
            reject(new Error(`Failed to read ${file.name}: ${reader.error || 'Unknown error'}`));
          };
          
          reader.onabort = () => {
            console.error('FileReader aborted for file:', file.name);
            reject(new Error(`File reading was aborted for ${file.name}`));
          };
          
          try {
            reader.readAsDataURL(file);
          } catch (error) {
            console.error('Failed to start reading file:', file.name, error);
            reject(new Error(`Failed to start reading ${file.name}`));
          }
        });

        const attachment = {
          projectId,
          fileName: file.name,
          fileUrl: base64Data,
          fileSize: file.size,
          uploadDate: getCurrentESTTimestamp(),
          fileType: file.type || "application/octet-stream"
        };
        
        console.log('4. Calling onAddAttachment with:', {
          projectId: attachment.projectId,
          fileName: attachment.fileName
        });
        
        await onAddAttachment(attachment);
        console.log('5. onAddAttachment completed for:', file.name);
        
        // Small delay between files to prevent overwhelming the system
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      console.log('6. All files processed, clearing upload list');
      setUploadFiles([]);
      
      toast({
        title: "Upload Complete",
        description: `${uploadFiles.length} file(s) uploaded successfully`,
      });
      
    } catch (error) {
      console.error('8. ERROR during upload:', error);
      
      // Clear upload files on error to prevent retry loops
      setUploadFiles([]);
      
      toast({
        title: "Upload Failed",
        description: `Error: ${error instanceof Error ? error.message : 'Unknown error'}. Please try with smaller files or refresh the page.`,
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
    console.log('=== DOWNLOAD DEBUG START ===');
    console.log('Attachment:', attachment);
    console.log('File URL exists:', !!attachment.fileUrl);
    console.log('File URL length:', attachment.fileUrl?.length);
    console.log('File URL starts with data:', attachment.fileUrl?.startsWith('data:'));
    
    try {
      if (!attachment.fileUrl) {
        console.log('ERROR: No file URL');
        throw new Error('No file data available');
      }

      if (!attachment.fileUrl.startsWith('data:')) {
        console.log('ERROR: Invalid data URL format');
        throw new Error('Invalid file format');
      }

      console.log('Splitting data URL...');
      const parts = attachment.fileUrl.split(',');
      if (parts.length !== 2) {
        console.log('ERROR: Data URL split failed, parts:', parts.length);
        throw new Error('Invalid data URL structure');
      }

      console.log('Converting base64...');
      const base64Data = parts[1];
      console.log('Base64 data length:', base64Data.length);
      
      const byteCharacters = atob(base64Data);
      console.log('Decoded bytes length:', byteCharacters.length);
      
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: attachment.fileType });
      console.log('Created blob size:', blob.size);
      
      // Create download link
      const url = URL.createObjectURL(blob);
      console.log('Created blob URL:', url);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = attachment.fileName;
      link.style.display = 'none';
      document.body.appendChild(link);
      
      console.log('Triggering download...');
      link.click();
      
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      console.log('=== DOWNLOAD SUCCESS ===');
      
      toast({
        title: "Download Started",
        description: `Downloading ${attachment.fileName}`,
      });
    } catch (error) {
      console.log('=== DOWNLOAD ERROR ===');
      console.error('Download error details:', error);
      console.log('Error message:', error instanceof Error ? error.message : 'Unknown error');
      
      toast({
        title: "Download Failed", 
        description: `Unable to download ${attachment.fileName}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive"
      });
    }
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
                <div className="flex flex-col items-center">
                  <Upload className="w-12 h-12 text-blue-400 mb-4" />
                  <span className="text-lg text-blue-600 mb-2">Upload Documents</span>
                  <span className="text-sm text-blue-500 mb-4">PDF, DOC, XLS, TXT files supported (Max 20MB each)</span>
                  <Button
                    type="button"
                    onClick={(e) => {
                      console.log('🔘 Add Files button clicked - event:', e);
                      console.log('🔘 Button element:', e.currentTarget);
                      try {
                        const input = document.createElement('input');
                        input.type = 'file';
                        input.multiple = true;
                        input.accept = '.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv';
                        console.log('🔘 Created file input:', input);
                        
                        input.onchange = (event) => {
                          console.log('📁 File input change event:', event);
                          const target = event.target as HTMLInputElement;
                          console.log('📁 Files selected:', target.files?.length || 0);
                          if (target.files && target.files.length > 0) {
                            handleFileUpload(target.files);
                          } else {
                            console.log('❌ No files selected');
                          }
                        };
                        
                        console.log('🔘 About to click input');
                        input.click();
                        console.log('🔘 Input click completed');
                      } catch (error) {
                        console.error('❌ Error in button click handler:', error);
                      }
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2"
                  >
                    Choose Files
                  </Button>
                </div>
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
                          <span>Uploaded: {formatDateForDisplay(attachment.uploadDate)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-blue-300 text-blue-600 hover:bg-blue-50"
                        onClick={() => handleDownload(attachment)}
                      >
                        <Download className="w-4 h-4 mr-1" />
                        Download
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-red-300 text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete File</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete "{attachment.fileName}"? 
                              This action cannot be undone and the file will be permanently removed.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              className="bg-red-600 hover:bg-red-700"
                              onClick={() => {
                                onDeleteAttachment(attachment.id);
                                toast({
                                  title: "File Deleted",
                                  description: `${attachment.fileName} has been permanently deleted`,
                                });
                              }}
                            >
                              Delete File
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
