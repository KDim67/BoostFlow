'use client';

import { useState, useCallback, useRef } from 'react';
import Cropper from 'react-easy-crop';
import { Button } from '@/components/ui/button';
import { X, RotateCw, ZoomIn, ZoomOut } from 'lucide-react';

// Represents a rectangular area with position and dimensions
interface Area {
  x: number;
  y: number;
  width: number;
  height: number;
}

// Props for the ImageCropper component
interface ImageCropperProps {
  image: string; // Base64 or URL of the image to crop
  onCropComplete: (croppedAreaPixels: Area) => void; // Callback when cropping is finished
  onCancel: () => void; // Callback when user cancels cropping
  aspectRatio?: number; // Desired aspect ratio (width/height), defaults to 1 (square)
  cropShape?: 'rect' | 'round'; // Shape of the crop area
  title?: string; // Modal title text
}

/**
 * Creates an HTMLImageElement from a URL with cross-origin support
 * @param url - Image URL or base64 data
 * @returns Promise that resolves to loaded image element
 */
const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    // Enable cross-origin requests for external images
    image.setAttribute('crossOrigin', 'anonymous');
    image.src = url;
  });

/**
 * Crops and rotates an image using HTML5 Canvas
 * @param imageSrc - Source image URL or base64
 * @param pixelCrop - Crop area in pixels
 * @param rotation - Rotation angle in degrees (default: 0)
 * @returns Promise that resolves to cropped image as Blob
 */
const getCroppedImg = async (
  imageSrc: string,
  pixelCrop: Area,
  rotation = 0
): Promise<Blob> => {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('No 2d context');
  }

  // Calculate safe area to accommodate rotation without clipping
  const maxSize = Math.max(image.width, image.height);
  const safeArea = 2 * ((maxSize / 2) * Math.sqrt(2));

  // Set canvas to safe area size for rotation
  canvas.width = safeArea;
  canvas.height = safeArea;

  // Apply rotation transformation around center
  ctx.translate(safeArea / 2, safeArea / 2);
  ctx.rotate((rotation * Math.PI) / 180);
  ctx.translate(-safeArea / 2, -safeArea / 2);

  // Draw the rotated image centered in the safe area
  ctx.drawImage(
    image,
    safeArea / 2 - image.width * 0.5,
    safeArea / 2 - image.height * 0.5
  );

  // Extract image data from the rotated canvas
  const data = ctx.getImageData(0, 0, safeArea, safeArea);

  // Resize canvas to final crop dimensions
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  // Place the cropped portion on the final canvas
  ctx.putImageData(
    data,
    Math.round(0 - safeArea / 2 + image.width * 0.5 - pixelCrop.x),
    Math.round(0 - safeArea / 2 + image.height * 0.5 - pixelCrop.y)
  );

  // Convert canvas to blob with JPEG compression (95% quality)
  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
      }
    }, 'image/jpeg', 0.95);
  });
};

/**
 * ImageCropper component provides a modal interface for cropping images
 * with zoom, rotation, and aspect ratio controls
 */
export default function ImageCropper({
  image,
  onCropComplete,
  onCancel,
  aspectRatio = 1, // Default to square crop
  cropShape = 'round', // Default to circular crop
  title = 'Crop Image'
}: ImageCropperProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Callback fired when crop area changes - stores pixel coordinates for final processing
  const handleCropComplete = useCallback((croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  // Processes the final crop and calls parent callback
  const handleSave = async () => {
    if (!croppedAreaPixels) return;
    
    setIsProcessing(true);
    try {
      // Generate the cropped image blob (not used here but validates the crop)
      const croppedImage = await getCroppedImg(image, croppedAreaPixels, rotation);
      // Pass crop coordinates back to parent component
      onCropComplete(croppedAreaPixels);
    } catch (error) {
      console.error('Error cropping image:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  // Zoom controls with bounds (100% to 300%)
  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.1, 3));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.1, 1));
  // Rotate in 90-degree increments, wrapping at 360
  const handleRotate = () => setRotation(prev => (prev + 90) % 360);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">{title}</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={onCancel}
            className="p-2"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="relative w-full h-96 mb-4">
          <Cropper
            image={image}
            crop={crop}
            zoom={zoom}
            rotation={rotation}
            aspect={aspectRatio}
            cropShape={cropShape}
            onCropChange={setCrop}
            onCropComplete={handleCropComplete}
            onZoomChange={setZoom}
            onRotationChange={setRotation}
            showGrid={false}
          />
        </div>

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleZoomOut}
              disabled={zoom <= 1}
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-sm text-gray-600 min-w-[60px] text-center">
              {Math.round(zoom * 100)}%
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleZoomIn}
              disabled={zoom >= 3}
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleRotate}
          >
            <RotateCw className="h-4 w-4 mr-2" />
            Rotate
          </Button>
        </div>

        <div className="flex justify-end space-x-3">
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={isProcessing}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!croppedAreaPixels || isProcessing}
          >
            {isProcessing ? 'Processing...' : 'Save'}
          </Button>
        </div>
      </div>
    </div>
  );
}

export { getCroppedImg };