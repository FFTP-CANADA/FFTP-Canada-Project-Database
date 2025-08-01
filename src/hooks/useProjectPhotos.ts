
import { useState, useEffect } from "react";
import { ProjectPhoto } from "@/types/project";

export const useProjectPhotos = () => {
  const [photos, setPhotos] = useState<ProjectPhoto[]>([]);

  // Load photos from localStorage on component mount
  useEffect(() => {
    console.log("Loading photos from localStorage...");
    const savedPhotos = localStorage.getItem("project-photos");
    console.log("Raw saved photos:", savedPhotos);
    
    if (savedPhotos) {
      try {
        const parsedPhotos = JSON.parse(savedPhotos);
        console.log("Parsed photos:", parsedPhotos);
        setPhotos(parsedPhotos);
      } catch (error) {
        console.error("Error loading photos from localStorage:", error);
      }
    } else {
      console.log("No saved photos found in localStorage");
    }
  }, []);

  // Save photos to localStorage whenever photos change
  useEffect(() => {
    try {
      if (photos.length > 0) {
        console.log("Saving photos to localStorage:", photos);
        localStorage.setItem("project-photos", JSON.stringify(photos));
      } else {
        console.log("Removing photos from localStorage (empty array)");
        localStorage.removeItem("project-photos");
      }
    } catch (error) {
      console.error("Failed to save photos to localStorage:", error);
    }
  }, [photos]);

  const addPhoto = (photo: Omit<ProjectPhoto, "id">) => {
    console.log("Adding photo:", photo);
    const newPhoto: ProjectPhoto = {
      ...photo,
      id: Date.now().toString(),
    };
    console.log("New photo with ID:", newPhoto);
    setPhotos(prev => {
      const updated = [...prev, newPhoto];
      console.log("Updated photos array:", updated);
      return updated;
    });
  };

  const deletePhoto = (id: string) => {
    console.log("Deleting photo:", id);
    setPhotos(prev => {
      const updated = prev.filter(photo => photo.id !== id);
      console.log("Updated photos after deletion:", updated);
      return updated;
    });
  };

  const getPhotosForProject = (projectId: string) => {
    const projectPhotos = photos.filter(photo => photo.projectId === projectId);
    console.log(`Photos for project ${projectId}:`, projectPhotos);
    return projectPhotos;
  };

  return {
    photos,
    addPhoto,
    deletePhoto,
    getPhotosForProject,
  };
};
