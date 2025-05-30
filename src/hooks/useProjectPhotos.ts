
import { useState } from "react";
import { ProjectPhoto } from "@/types/project";

export const useProjectPhotos = () => {
  const [photos, setPhotos] = useState<ProjectPhoto[]>([]);

  const addPhoto = (photo: Omit<ProjectPhoto, "id">) => {
    const newPhoto: ProjectPhoto = {
      ...photo,
      id: Date.now().toString(),
    };
    setPhotos(prev => [...prev, newPhoto]);
  };

  const getPhotosForProject = (projectId: string) => {
    return photos.filter(photo => photo.projectId === projectId);
  };

  return {
    photos,
    addPhoto,
    getPhotosForProject,
  };
};
