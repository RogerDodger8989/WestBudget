import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, ZoomIn, ZoomOut, RotateCw } from 'lucide-react';

const ImageLightbox = ({ images, currentIndex, onClose }) => {
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [currentImgIndex, setCurrentImgIndex] = useState(currentIndex || 0);
  const imageRef = useRef(null);
  const containerRef = useRef(null);

  const currentImage = images[currentImgIndex];
  const imageUrl = currentImage?.startsWith('http') 
    ? currentImage 
    : currentImage?.includes(':\\') || currentImage?.startsWith('/')
    ? `http://192.168.1.232:5000/api/files/${encodeURIComponent(currentImage.replace(/\\/g, '/'))}`
    : `http://192.168.1.232:5000/uploads/${currentImage?.replace(/\\/g, '/')}`;

  useEffect(() => {
    // Reset zoom and position when image changes
    setZoom(1);
    setPosition({ x: 0, y: 0 });
  }, [currentImgIndex]);

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.25, 5));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.25, 0.5));
  };

  const handleReset = () => {
    setZoom(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleMouseDown = (e) => {
    // Allow panning when zoomed in
    if (zoom > 1) {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(true);
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y
      });
    }
  };

  // Global mouse move handler for panning
  useEffect(() => {
    const handleGlobalMouseMove = (e) => {
      if (isDragging && zoom > 1) {
        e.preventDefault();
        const newX = e.clientX - dragStart.x;
        const newY = e.clientY - dragStart.y;
        
        // Constrain panning to keep image visible
        if (imageRef.current && containerRef.current) {
          const imgRect = imageRef.current.getBoundingClientRect();
          const containerRect = containerRef.current.getBoundingClientRect();
          
          // Calculate max pan distance based on zoomed image size
          const scaledWidth = imgRect.width;
          const scaledHeight = imgRect.height;
          const maxX = Math.max(0, (scaledWidth - containerRect.width) / 2);
          const maxY = Math.max(0, (scaledHeight - containerRect.height) / 2);
          
          setPosition({
            x: Math.max(-maxX, Math.min(maxX, newX)),
            y: Math.max(-maxY, Math.min(maxY, newY))
          });
        } else {
          setPosition({ x: newX, y: newY });
        }
      }
    };

    const handleGlobalMouseUp = (e) => {
      if (isDragging) {
        e.preventDefault();
        setIsDragging(false);
      }
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleGlobalMouseMove);
      window.addEventListener('mouseup', handleGlobalMouseUp);
      document.body.style.cursor = 'grabbing';
      document.body.style.userSelect = 'none';
    }

    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('mouseup', handleGlobalMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isDragging, dragStart, zoom]);

  const handleWheel = (e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.15 : 0.15;
    const newZoom = Math.max(0.5, Math.min(5, zoom + delta));
    
    // Zoom towards mouse position
    if (imageRef.current && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const mouseX = e.clientX - rect.left - rect.width / 2;
      const mouseY = e.clientY - rect.top - rect.height / 2;
      
      const zoomFactor = newZoom / zoom;
      setPosition({
        x: position.x * zoomFactor - mouseX * (zoomFactor - 1),
        y: position.y * zoomFactor - mouseY * (zoomFactor - 1)
      });
    }
    
    setZoom(newZoom);
  };
  
  const handleDoubleClick = (e) => {
    e.stopPropagation();
    if (zoom === 1) {
      // Zoom in to 2x at click position
      if (imageRef.current && containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const mouseX = e.clientX - rect.left - rect.width / 2;
        const mouseY = e.clientY - rect.top - rect.height / 2;
        
        setZoom(2);
        setPosition({
          x: -mouseX,
          y: -mouseY
        });
      } else {
        setZoom(2);
      }
    } else {
      // Reset zoom
      handleReset();
    }
  };

  const goToPrevious = () => {
    setCurrentImgIndex(prev => (prev > 0 ? prev - 1 : images.length - 1));
  };

  const goToNext = () => {
    setCurrentImgIndex(prev => (prev < images.length - 1 ? prev + 1 : 0));
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' || e.key === 'Esc') {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        goToPrevious();
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        goToNext();
      }
      if (e.key === '+' || e.key === '=') {
        e.preventDefault();
        handleZoomIn();
      }
      if (e.key === '-') {
        e.preventDefault();
        handleZoomOut();
      }
      if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        handleReset();
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [onClose]);

  if (!images || images.length === 0) return null;

  // Prevent body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const modalContent = (
    <div 
      className="fixed inset-0 bg-black/95 backdrop-blur-md flex items-center justify-center"
      style={{ 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        right: 0, 
        bottom: 0,
        zIndex: 99999,
        isolation: 'isolate'
      }}
      onClick={onClose}
      onWheel={handleWheel}
    >
      {/* Close Button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        className="absolute top-4 right-4 z-[10000] p-3 bg-black/80 hover:bg-black text-white rounded-full transition-colors shadow-lg"
      >
        <X size={24} />
      </button>

      {/* Controls */}
      <div className="absolute top-4 left-4 z-[10000] flex gap-2">
        <button
          onClick={(e) => { e.stopPropagation(); handleZoomIn(); }}
          className="p-3 bg-black/80 hover:bg-black text-white rounded-lg transition-colors shadow-lg"
          title="Zooma in (+)"
        >
          <ZoomIn size={20} />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); handleZoomOut(); }}
          className="p-3 bg-black/80 hover:bg-black text-white rounded-lg transition-colors shadow-lg"
          title="Zooma ut (-)"
        >
          <ZoomOut size={20} />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); handleReset(); }}
          className="p-3 bg-black/80 hover:bg-black text-white rounded-lg transition-colors shadow-lg"
          title="Återställ (R)"
        >
          <RotateCw size={20} />
        </button>
      </div>

      {/* Image Counter */}
      {images.length > 1 && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[10000] px-4 py-2 bg-black/80 text-white rounded-lg text-sm font-medium shadow-lg">
          {currentImgIndex + 1} / {images.length}
        </div>
      )}

      {/* Image Container */}
      <div
        ref={containerRef}
        className="relative w-full h-full flex items-center justify-center p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          ref={imageRef}
          src={imageUrl}
          alt={`Bild ${currentImgIndex + 1}`}
          className="max-w-full max-h-full object-contain select-none"
          style={{
            transform: `scale(${zoom}) translate(${position.x}px, ${position.y}px)`,
            cursor: zoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'zoom-in',
            transition: isDragging ? 'none' : 'transform 0.1s ease-out',
            userSelect: 'none',
            pointerEvents: 'auto'
          }}
          onMouseDown={handleMouseDown}
          onDoubleClick={handleDoubleClick}
          draggable={false}
          onError={(e) => {
            e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%23333" width="400" height="300"/%3E%3Ctext fill="%23999" x="50%" y="50%" text-anchor="middle" dy=".3em" font-size="16"%3EBild kunde inte laddas%3C/text%3E%3C/svg%3E';
          }}
        />
      </div>

      {/* Navigation Arrows */}
      {images.length > 1 && (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); goToPrevious(); }}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-[10000] p-4 bg-black/80 hover:bg-black text-white rounded-full transition-colors shadow-lg text-2xl font-bold"
            title="Föregående (←)"
          >
            ←
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); goToNext(); }}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-[10000] p-4 bg-black/80 hover:bg-black text-white rounded-full transition-colors shadow-lg text-2xl font-bold"
            title="Nästa (→)"
          >
            →
          </button>
        </>
      )}

      {/* Zoom Indicator */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[10000] px-4 py-2 bg-black/80 text-white rounded-lg text-sm font-medium shadow-lg">
        {Math.round(zoom * 100)}%
      </div>
    </div>
  );
  
  // Render using portal to ensure it's on top of everything
  return createPortal(modalContent, document.body);
};

export default ImageLightbox;

