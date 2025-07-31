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

  const handleSaveAttachments = async () => {
    console.log('=== SAVE ATTACHMENTS START ===');
    console.log('Number of files to upload:', uploadFiles.length);
    
    // Check file sizes first
    const maxFileSize = 10 * 1024 * 1024; // 10MB limit
    const oversizedFiles = uploadFiles.filter(file => file.size > maxFileSize);
    
    if (oversizedFiles.length > 0) {
      toast({
        title: "File Size Error",
        description: `Some files are too large (max 10MB): ${oversizedFiles.map(f => f.name).join(', ')}`,
        variant: "destructive"
      });
      return;
    }

    try {
      for (const file of uploadFiles) {
        console.log(`Processing file: ${file.name}, size: ${file.size}`);
        
        try {
          // Convert file to base64 for persistent storage
          const base64Data = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
              console.log(`File ${file.name} converted to base64`);
              resolve(reader.result as string);
            };
            reader.onerror = (error) => {
              console.error(`FileReader error for ${file.name}:`, error);
              reject(error);
            };
            reader.readAsDataURL(file);
          });

          const attachment: Omit<ProjectAttachment, "id"> = {
            projectId,
            fileName: file.name,
            fileUrl: base64Data,
            fileSize: file.size,
            uploadDate: new Date().toISOString(),
            fileType: file.type || "application/octet-stream"
          };
          
          console.log(`Adding attachment for file: ${file.name}`);
          onAddAttachment(attachment);
          console.log(`Successfully added attachment for file: ${file.name}`);
          
        } catch (error) {
          console.error('Failed to process file:', file.name, error);
          toast({
            title: "Upload Error",
            description: `Failed to upload ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`,
            variant: "destructive"
          });
          return; // Stop processing if any file fails
        }
      }

      console.log('All files processed successfully');
      setUploadFiles([]);
      toast({
        title: "Success",
        description: `${uploadFiles.length} file(s) uploaded successfully`,
      });
      console.log('=== SAVE ATTACHMENTS SUCCESS ===');
      
    } catch (error) {
      console.error('=== SAVE ATTACHMENTS ERROR ===', error);
      toast({
        title: "Upload Failed",
        description: `Failed to save attachments: ${error instanceof Error ? error.message : 'Unknown error'}`,
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
                        onClick={() => handleDownload(attachment)}
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
