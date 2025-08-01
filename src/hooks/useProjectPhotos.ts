
import { useState, useEffect, useCallback } from "react";
import { ProjectPhoto } from "@/types/project";
import { LocalStorageManager } from "@/utils/localStorageManager";

let globalPhotos: ProjectPhoto[] = [];
let photoListeners: Array<(photos: ProjectPhoto[]) => void> = [];

const notifyPhotoListeners = (photos: ProjectPhoto[]) => {
  globalPhotos = photos;
  photoListeners.forEach(listener => listener(photos));
};

const savePhotos = async (photos: ProjectPhoto[]) => {
  await LocalStorageManager.setItem('project-photos', photos);
  notifyPhotoListeners(photos);
};

export const useProjectPhotos = () => {
  const [photos, setPhotos] = useState<ProjectPhoto[]>(() => {
    if (globalPhotos.length > 0) return globalPhotos;
    const saved = LocalStorageManager.getItem('project-photos', []);
    globalPhotos = saved;
    return saved;
  });

  useEffect(() => {
    const listener = (newPhotos: ProjectPhoto[]) => {
      setPhotos(newPhotos);
    };
    photoListeners.push(listener);
    
    return () => {
      photoListeners = photoListeners.filter(l => l !== listener);
    };
  }, []);

  const addPhoto = useCallback(async (photo: Omit<ProjectPhoto, "id">) => {
    const newPhoto: ProjectPhoto = {
      ...photo,
      id: Date.now().toString(),
    };
    
    const updatedPhotos = [...globalPhotos, newPhoto];
    await savePhotos(updatedPhotos);
  }, []);

  const deletePhoto = useCallback(async (id: string) => {
    const updatedPhotos = globalPhotos.filter(photo => photo.id !== id);
    await savePhotos(updatedPhotos);
  }, []);

  const getPhotosForProject = useCallback((projectId: string) => {
    return globalPhotos.filter(photo => photo.projectId === projectId);
  }, []);

  return {
    photos,
    addPhoto,
    deletePhoto,
    getPhotosForProject,
  };
};
