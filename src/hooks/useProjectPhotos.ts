
import { useState, useEffect, useCallback } from "react";
import { ProjectPhoto } from "@/types/project";
import { LocalStorageManager } from "@/utils/localStorageManager";

let globalPhotos: ProjectPhoto[] = [];
let photoListeners: Array<(photos: ProjectPhoto[]) => void> = [];

const notifyPhotoListeners = (photos: ProjectPhoto[]) => {
  globalPhotos = photos;
  photoListeners.forEach(listener => {
    try {
      listener(photos);
    } catch (error) {
      console.error('Error in photo listener:', error);
    }
  });
};

const savePhotos = async (photos: ProjectPhoto[]) => {
  try {
    await LocalStorageManager.setItem('project-photos', photos);
    notifyPhotoListeners(photos);
  } catch (error) {
    console.error('Failed to save photos:', error);
    // Try to recover
    const existingPhotos = LocalStorageManager.getItem('project-photos', []);
    globalPhotos = Array.isArray(existingPhotos) ? existingPhotos : [];
    notifyPhotoListeners(globalPhotos);
  }
};

export const useProjectPhotos = () => {
  const [photos, setPhotos] = useState<ProjectPhoto[]>(() => {
    if (globalPhotos.length > 0) return globalPhotos;
    const saved = LocalStorageManager.getItem('project-photos', []);
    const validPhotos = Array.isArray(saved) ? saved.filter(p => p && p.id) : [];
    globalPhotos = validPhotos;
    return validPhotos;
  });

  useEffect(() => {
    const listener = (newPhotos: ProjectPhoto[]) => {
      try {
        const validPhotos = Array.isArray(newPhotos) ? newPhotos : [];
        setPhotos(validPhotos);
      } catch (error) {
        console.error('Error updating photo state:', error);
        setPhotos([]);
      }
    };
    photoListeners.push(listener);
    
    return () => {
      photoListeners = photoListeners.filter(l => l !== listener);
    };
  }, []);

  const addPhoto = useCallback(async (photo: Omit<ProjectPhoto, "id">) => {
    try {
      if (!photo || !photo.projectId) {
        throw new Error('Invalid photo data: missing projectId');
      }

      const newPhoto: ProjectPhoto = {
        ...photo,
        id: Date.now().toString(),
      };
      
      const updatedPhotos = [...globalPhotos, newPhoto];
      await savePhotos(updatedPhotos);
    } catch (error) {
      console.error('ADD PHOTO ERROR:', error);
      throw error;
    }
  }, []);

  const deletePhoto = useCallback(async (id: string) => {
    try {
      if (!id) {
        throw new Error('Invalid photo ID');
      }
      
      const updatedPhotos = globalPhotos.filter(photo => photo.id !== id);
      await savePhotos(updatedPhotos);
    } catch (error) {
      console.error('DELETE PHOTO ERROR:', error);
      throw error;
    }
  }, []);

  const getPhotosForProject = useCallback((projectId: string) => {
    try {
      if (!projectId) {
        console.warn('getPhotosForProject called with empty projectId');
        return [];
      }
      
      const validPhotos = Array.isArray(globalPhotos) ? globalPhotos : [];
      return validPhotos.filter(photo => photo && photo.projectId === projectId);
    } catch (error) {
      console.error('GET PHOTOS ERROR:', error);
      return [];
    }
  }, []);

  return {
    photos: Array.isArray(photos) ? photos : [],
    addPhoto,
    deletePhoto,
    getPhotosForProject,
  };
};
