import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X, File, Image as ImageIcon } from "lucide-react";

interface ProjectFilePreviewProps {
  attachments: File[];
  photos: File[];
  onRemoveAttachment: (index: number) => void;
  onRemovePhoto: (index: number) => void;
}

export const ProjectFilePreview = ({ 
  attachments, 
  photos, 
  onRemoveAttachment, 
  onRemovePhoto 
}: ProjectFilePreviewProps) => {
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

  if (attachments.length === 0 && photos.length === 0) {
    return null;
  }

  return (
    <Card className="border-green-200 bg-green-50">
      <CardHeader className="pb-4">
        <CardTitle className="text-green-800 flex items-center gap-2">
          <File className="w-5 h-5" />
          Files to Upload ({attachments.length + photos.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Attachments */}
        {attachments.length > 0 && (
          <div>
            <h4 className="font-medium text-green-800 mb-2 flex items-center gap-2">
              <File className="w-4 h-4" />
              Documents ({attachments.length})
            </h4>
            <div className="space-y-2">
              {attachments.map((file, index) => (
                <div key={index} className="flex items-center justify-between bg-white p-3 rounded-lg border border-green-200">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{getFileIcon(file.type)}</span>
                    <div>
                      <p className="font-medium text-green-900 text-sm">{file.name}</p>
                      <p className="text-xs text-green-600">{formatFileSize(file.size)}</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onRemoveAttachment(index)}
                    className="text-green-600 hover:text-green-800 hover:bg-green-100"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Photos */}
        {photos.length > 0 && (
          <div>
            <h4 className="font-medium text-green-800 mb-2 flex items-center gap-2">
              <ImageIcon className="w-4 h-4" />
              Photos ({photos.length})
            </h4>
            <div className="space-y-2">
              {photos.map((file, index) => (
                <div key={index} className="flex items-center justify-between bg-white p-3 rounded-lg border border-green-200">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">📸</span>
                    <div>
                      <p className="font-medium text-green-900 text-sm">{file.name}</p>
                      <p className="text-xs text-green-600">{formatFileSize(file.size)}</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onRemovePhoto(index)}
                    className="text-green-600 hover:text-green-800 hover:bg-green-100"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="text-xs text-green-700 bg-green-100 p-2 rounded">
          <strong>Note:</strong> These files will be attached to your project after it's created. 
          Make sure all files are under 20MB each to prevent upload issues.
        </div>
      </CardContent>
    </Card>
  );
};