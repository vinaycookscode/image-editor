import { Injectable } from '@angular/core';
import { LoggingService } from './logging.service';

export interface ImageEditOptions {
  quality?: number;
  format?: 'jpeg' | 'png' | 'svg';
  width?: number;
  height?: number;
}

@Injectable({
  providedIn: 'root'
})
export class ImageEditorService {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private originalImage: HTMLImageElement | null = null;

  constructor(private loggingService: LoggingService) {}

  initializeCanvas(canvasElement: HTMLCanvasElement): void {
    try {
      this.canvas = canvasElement;
      this.ctx = canvasElement.getContext('2d');
      
      if (!this.ctx) {
        throw new Error('Could not get 2D context');
      }
      
      this.loggingService.info('Canvas initialized successfully');
    } catch (error) {
      this.loggingService.error('Failed to initialize canvas', error as Error);
      throw error;
    }
  }

  loadImage(imageUrl: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.canvas || !this.ctx) {
        reject(new Error('Canvas not initialized'));
        return;
      }

      const img = new Image();
      img.onload = () => {
        try {
          // Clear canvas
          this.ctx!.clearRect(0, 0, this.canvas!.width, this.canvas!.height);
          
          // Scale image to fit canvas
          const canvasWidth = this.canvas!.width;
          const canvasHeight = this.canvas!.height;
          const scale = Math.min(
            canvasWidth / img.width,
            canvasHeight / img.height
          );

          const scaledWidth = img.width * scale;
          const scaledHeight = img.height * scale;
          const x = (canvasWidth - scaledWidth) / 2;
          const y = (canvasHeight - scaledHeight) / 2;

          this.ctx!.drawImage(img, x, y, scaledWidth, scaledHeight);
          this.originalImage = img;

          this.loggingService.info('Image loaded successfully', { imageUrl });
          resolve();
        } catch (error) {
          this.loggingService.error('Failed to load image', error as Error);
          reject(error);
        }
      };
      
      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };
      
      img.src = imageUrl;
    });
  }

  cropImage(cropRect: { left: number; top: number; width: number; height: number }): void {
    if (!this.canvas || !this.ctx || !this.originalImage) {
      throw new Error('Canvas or image not initialized');
    }

    try {
      // Create a temporary canvas for cropping
      const tempCanvas = document.createElement('canvas');
      const tempCtx = tempCanvas.getContext('2d');
      
      if (!tempCtx) {
        throw new Error('Could not get temporary canvas context');
      }
      
      tempCanvas.width = cropRect.width;
      tempCanvas.height = cropRect.height;
      
      // Draw the cropped portion to the temporary canvas
      tempCtx.drawImage(
        this.canvas,
        cropRect.left,
        cropRect.top,
        cropRect.width,
        cropRect.height,
        0,
        0,
        cropRect.width,
        cropRect.height
      );
      
      // Clear the main canvas
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      
      // Draw the cropped image back to the main canvas
      this.ctx.drawImage(tempCanvas, 0, 0);
      
      this.loggingService.info('Image cropped successfully', cropRect);
    } catch (error) {
      this.loggingService.error('Failed to crop image', error as Error);
      throw error;
    }
  }

  rotateImage(angle: number): void {
    if (!this.canvas || !this.ctx || !this.originalImage) {
      throw new Error('Canvas or image not initialized');
    }

    try {
      const canvasWidth = this.canvas.width;
      const canvasHeight = this.canvas.height;
      
      // Clear canvas
      this.ctx.clearRect(0, 0, canvasWidth, canvasHeight);
      
      // Save context
      this.ctx.save();
      
      // Move to center of canvas
      this.ctx.translate(canvasWidth / 2, canvasHeight / 2);
      
      // Rotate
      this.ctx.rotate((angle * Math.PI) / 180);
      
      // Draw image centered
      const scale = Math.min(
        canvasWidth / this.originalImage.width,
        canvasHeight / this.originalImage.height
      );
      const scaledWidth = this.originalImage.width * scale;
      const scaledHeight = this.originalImage.height * scale;
      
      this.ctx.drawImage(
        this.originalImage,
        -scaledWidth / 2,
        -scaledHeight / 2,
        scaledWidth,
        scaledHeight
      );
      
      // Restore context
      this.ctx.restore();
      
      this.loggingService.info('Image rotated successfully', { angle });
    } catch (error) {
      this.loggingService.error('Failed to rotate image', error as Error);
      throw error;
    }
  }

  flipImage(direction: 'horizontal' | 'vertical'): void {
    if (!this.canvas || !this.ctx || !this.originalImage) {
      throw new Error('Canvas or image not initialized');
    }

    try {
      const canvasWidth = this.canvas.width;
      const canvasHeight = this.canvas.height;
      
      // Clear canvas
      this.ctx.clearRect(0, 0, canvasWidth, canvasHeight);
      
      // Save context
      this.ctx.save();
      
      if (direction === 'horizontal') {
        this.ctx.scale(-1, 1);
        this.ctx.translate(-canvasWidth, 0);
      } else {
        this.ctx.scale(1, -1);
        this.ctx.translate(0, -canvasHeight);
      }
      
      // Draw image
      const scale = Math.min(
        canvasWidth / this.originalImage.width,
        canvasHeight / this.originalImage.height
      );
      const scaledWidth = this.originalImage.width * scale;
      const scaledHeight = this.originalImage.height * scale;
      const x = (canvasWidth - scaledWidth) / 2;
      const y = (canvasHeight - scaledHeight) / 2;
      
      this.ctx.drawImage(this.originalImage, x, y, scaledWidth, scaledHeight);
      
      // Restore context
      this.ctx.restore();
      
      this.loggingService.info('Image flipped successfully', { direction });
    } catch (error) {
      this.loggingService.error('Failed to flip image', error as Error);
      throw error;
    }
  }

  zoomImage(zoomLevel: number): void {
    if (!this.canvas || !this.ctx || !this.originalImage) {
      throw new Error('Canvas or image not initialized');
    }

    try {
      const canvasWidth = this.canvas.width;
      const canvasHeight = this.canvas.height;
      
      // Clear canvas
      this.ctx.clearRect(0, 0, canvasWidth, canvasHeight);
      
      // Calculate scaled dimensions
      const baseScale = Math.min(
        canvasWidth / this.originalImage.width,
        canvasHeight / this.originalImage.height
      );
      const finalScale = baseScale * zoomLevel;
      const scaledWidth = this.originalImage.width * finalScale;
      const scaledHeight = this.originalImage.height * finalScale;
      const x = (canvasWidth - scaledWidth) / 2;
      const y = (canvasHeight - scaledHeight) / 2;
      
      this.ctx.drawImage(this.originalImage, x, y, scaledWidth, scaledHeight);
      
      this.loggingService.info('Image zoomed successfully', { zoomLevel });
    } catch (error) {
      this.loggingService.error('Failed to zoom image', error as Error);
      throw error;
    }
  }

  addText(text: string, options: { left: number; top: number; fontSize?: number; color?: string }): void {
    if (!this.canvas || !this.ctx) {
      throw new Error('Canvas not initialized');
    }

    try {
      this.ctx.font = `${options.fontSize || 20}px Arial`;
      this.ctx.fillStyle = options.color || '#000000';
      this.ctx.fillText(text, options.left, options.top);
      
      this.loggingService.info('Text added successfully', { text, options });
    } catch (error) {
      this.loggingService.error('Failed to add text', error as Error);
      throw error;
    }
  }

  addShape(type: 'rect' | 'circle' | 'line', options: any): void {
    if (!this.canvas || !this.ctx) {
      throw new Error('Canvas not initialized');
    }

    try {
      this.ctx.strokeStyle = options.color || '#000000';
      this.ctx.lineWidth = options.strokeWidth || 2;

      switch (type) {
        case 'rect':
          this.ctx.strokeRect(options.left, options.top, options.width, options.height);
          break;
        case 'circle':
          this.ctx.beginPath();
          this.ctx.arc(options.left, options.top, options.radius, 0, 2 * Math.PI);
          this.ctx.stroke();
          break;
        case 'line':
          this.ctx.beginPath();
          this.ctx.moveTo(options.x1, options.y1);
          this.ctx.lineTo(options.x2, options.y2);
          this.ctx.stroke();
          break;
        default:
          throw new Error(`Unsupported shape type: ${type}`);
      }
      
      this.loggingService.info('Shape added successfully', { type, options });
    } catch (error) {
      this.loggingService.error('Failed to add shape', error as Error);
      throw error;
    }
  }

  exportImage(options: ImageEditOptions = {}): string {
    if (!this.canvas) {
      throw new Error('Canvas not initialized');
    }

    try {
      const format = options.format || 'png';
      const quality = options.quality || 1;
      
      let dataUrl: string;
      
      if (format === 'svg') {
        // For SVG, we'd need a more complex implementation
        dataUrl = this.canvas.toDataURL('image/svg+xml');
      } else {
        dataUrl = this.canvas.toDataURL(`image/${format}`, quality);
      }

      this.loggingService.info('Image exported successfully', { format, quality });
      return dataUrl;
    } catch (error) {
      this.loggingService.error('Failed to export image', error as Error);
      throw error;
    }
  }

  undo(): void {
    // Implementation for undo functionality
    this.loggingService.info('Undo operation requested');
  }

  redo(): void {
    // Implementation for redo functionality
    this.loggingService.info('Redo operation requested');
  }

  clearCanvas(): void {
    if (this.canvas && this.ctx) {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      this.loggingService.info('Canvas cleared');
    }
  }

  destroy(): void {
    this.canvas = null;
    this.ctx = null;
    this.originalImage = null;
    this.loggingService.info('Canvas destroyed');
  }
} 