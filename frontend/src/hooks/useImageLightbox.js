import { useState } from 'react';

export const useImageLightbox = () => {
  const [lightboxImages, setLightboxImages] = useState(null);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const openLightbox = (images, index = 0) => {
    setLightboxImages(images);
    setLightboxIndex(index);
  };

  const closeLightbox = () => {
    setLightboxImages(null);
    setLightboxIndex(0);
  };

  return {
    lightboxImages,
    lightboxIndex,
    openLightbox,
    closeLightbox,
    setLightboxIndex
  };
};

