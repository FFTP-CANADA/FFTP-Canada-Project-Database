
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, X, Camera, Trash2, Edit } from "lucide-react";
import { ProjectPhoto } from "@/hooks/useProjectData";
import { useToast } from "@/hooks/use-toast";
import { formatDateForDisplay, getCurrentESTTimestamp } from "@/utils/dateUtils";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";

interface ProjectGalleryProps {
  projectId: string;
  projectName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  photos: ProjectPhoto[];
  onAddPhoto: (photo: Omit<ProjectPhoto, "id">) => void;
}

const ProjectGallery = ({ 
  projectId, 
  projectName, 
  open, 
  onOpenChange, 
  photos, 
  onAddPhoto 
}: ProjectGalleryProps) => {
  const [uploadPhotos, setUploadPhotos] = useState<{ file: File; caption: string }[]>([]);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const { toast } = useToast();

  const handlePhotoUpload = (files: FileList | null) => {
    if (!files) return;
    
    const fileArray = Array.from(files);
    const newPhotos = fileArray.map(file => ({ file, caption: "" }));
    setUploadPhotos(prev => [...prev, ...newPhotos]);
  };

  const updateCaption = (index: number, caption: string) => {
    setUploadPhotos(prev => 
      prev.map((photo, i) => i === index ? { ...photo, caption } : photo)
    );
  };

  const removeUploadPhoto = (index: number) => {
    setUploadPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const handleSavePhotos = () => {
    uploadPhotos.forEach(({ file, caption }) => {
      const photo: Omit<ProjectPhoto, "id"> = {
        projectId,
        photoUrl: URL.createObjectURL(file), // In real app, upload to server first
        caption: caption || undefined,
        uploadDate: getCurrentESTTimestamp()
      };
      onAddPhoto(photo);
    });

    setUploadPhotos([]);
    toast({
      title: "Success",
      description: `${uploadPhotos.length} photo(s) uploaded successfully`,
    });
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-blue-900">Project Photo Gallery</DialogTitle>
            <DialogDescription className="text-blue-600">
              Manage photos for: {projectName}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Upload Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-blue-900">Upload New Photos</h3>
              <div className="border-2 border-dashed border-blue-200 rounded-lg p-6">
                <div className="flex items-center justify-center">
                  <label className="cursor-pointer flex flex-col items-center">
                    <Camera className="w-12 h-12 text-blue-400 mb-4" />
                    <span className="text-lg text-blue-600 mb-2">Upload Photos</span>
                    <span className="text-sm text-blue-500">JPG, PNG, GIF files supported</span>
                    <input
                      type="file"
                      multiple
                      className="hidden"
                      onChange={(e) => handlePhotoUpload(e.target.files)}
                      accept="image/*"
                    />
                  </label>
                </div>
              </div>

              {uploadPhotos.length > 0 && (
                <div className="space-y-4">
                  <h4 className="font-medium text-blue-900">Photos to Upload</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {uploadPhotos.map((photo, index) => (
                      <div key={index} className="space-y-2">
                        <div className="relative">
                          <img
                            src={URL.createObjectURL(photo.file)}
                            alt={photo.file.name}
                            className="w-full h-48 object-cover rounded-lg"
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            className="absolute top-2 right-2 h-8 w-8 p-0 bg-red-500 hover:bg-red-600 text-white"
                            onClick={() => removeUploadPhoto(index)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-sm font-medium text-blue-900">Caption (optional)</Label>
                          <Input
                            placeholder="Add a caption..."
                            value={photo.caption}
                            onChange={(e) => updateCaption(index, e.target.value)}
                            className="border-blue-200 focus:border-blue-400"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                  <Button 
                    onClick={handleSavePhotos}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Save {uploadPhotos.length} Photo(s)
                  </Button>
                </div>
              )}
            </div>

            {/* Existing Photos Gallery */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-blue-900">Photo Gallery ({photos.length})</h3>
              {photos.length === 0 ? (
                <div className="text-center py-12 text-blue-500">
                  <Camera className="w-16 h-16 mx-auto mb-4 text-blue-300" />
                  <p>No photos uploaded yet</p>
                  <p className="text-sm">Upload some photos to showcase your project</p>
                </div>
              ) : (
                <div className="relative px-12">
                  <Carousel className="w-full">
                    <CarouselContent>
                      {photos.map((photo) => (
                        <CarouselItem key={photo.id} className="md:basis-1/2 lg:basis-1/3">
                          <div className="group relative">
                            <div 
                              className="relative cursor-pointer"
                              onClick={() => setSelectedPhoto(photo.photoUrl)}
                            >
                              <img
                                src={photo.photoUrl}
                                alt={photo.caption || "Project photo"}
                                className="w-full h-64 object-cover rounded-lg hover:opacity-90 transition-opacity"
                              />
                              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all rounded-lg" />
                            </div>
                            {photo.caption && (
                              <p className="mt-2 text-sm text-blue-700 line-clamp-2">{photo.caption}</p>
                            )}
                            <p className="text-xs text-blue-500 mt-1">
                              {formatDateForDisplay(photo.uploadDate)}
                            </p>
                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 bg-blue-500 hover:bg-blue-600 text-white"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 bg-red-500 hover:bg-red-600 text-white"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </CarouselItem>
                      ))}
                    </CarouselContent>
                    <CarouselPrevious />
                    <CarouselNext />
                  </Carousel>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Photo Lightbox */}
      {selectedPhoto && (
        <Dialog open={!!selectedPhoto} onOpenChange={() => setSelectedPhoto(null)}>
          <DialogContent className="max-w-4xl">
            <div className="relative">
              <img
                src={selectedPhoto}
                alt="Full size view"
                className="w-full max-h-[80vh] object-contain rounded-lg"
              />
              <Button
                variant="ghost"
                size="sm"
                className="absolute top-2 right-2 h-8 w-8 p-0 bg-black bg-opacity-50 hover:bg-opacity-70 text-white"
                onClick={() => setSelectedPhoto(null)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};

export default ProjectGallery;
