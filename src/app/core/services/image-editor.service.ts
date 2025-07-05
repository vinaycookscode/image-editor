import { Injectable } from '@angular/core';
import { fabric } from 'fabric';
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
  private canvas: fabric.Canvas | null = null;
  private originalImage: fabric.Image | null = null;

  constructor(private loggingService: LoggingService) {}

  initializeCanvas(canvasElement: HTMLCanvasElement): void {
    try {
      this.canvas = new fabric.Canvas(canvasElement, {
        preserveObjectStacking: true,
        selection: true
      });
      
      this.loggingService.info('Canvas initialized successfully');
    } catch (error) {
      this.loggingService.error('Failed to initialize canvas', error as Error);
      throw error;
    }
  }

  loadImage(imageUrl: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.canvas) {
        reject(new Error('Canvas not initialized'));
        return;
      }

      fabric.Image.fromURL(imageUrl, (img) => {
        try {
          // Clear existing content
          this.canvas!.clear();
          
          // Scale image to fit canvas
          const canvasWidth = this.canvas!.getWidth();
          const canvasHeight = this.canvas!.getHeight();
          const scale = Math.min(
            canvasWidth / img.width!,
            canvasHeight / img.height!
          );

          img.scale(scale);
          img.set({
            left: (canvasWidth - img.width! * scale) / 2,
            top: (canvasHeight - img.height! * scale) / 2
          });

          this.originalImage = img;
          this.canvas!.add(img);
          this.canvas!.renderAll();

          this.loggingService.info('Image loaded successfully', { imageUrl });
          resolve();
        } catch (error) {
          this.loggingService.error('Failed to load image', error as Error);
          reject(error);
        }
      }, { crossOrigin: 'anonymous' });
    });
  }

  cropImage(cropRect: { left: number; top: number; width: number; height: number }): void {
    if (!this.canvas) {
      throw new Error('Canvas not initialized');
    }

    try {
      const objects = this.canvas.getObjects();
      const image = objects.find(obj => obj instanceof fabric.Image) as fabric.Image;
      
      if (image) {
        // Create a new canvas for cropping
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        
        if (tempCtx) {
          tempCanvas.width = cropRect.width;
          tempCanvas.height = cropRect.height;
          
          // Draw the cropped portion
          tempCtx.drawImage(
            image.getElement(),
            cropRect.left,
            cropRect.top,
            cropRect.width,
            cropRect.height,
            0,
            0,
            cropRect.width,
            cropRect.height
          );

          // Create new fabric image from cropped canvas
          fabric.Image.fromURL(tempCanvas.toDataURL(), (croppedImg) => {
            this.canvas!.clear();
            this.canvas!.add(croppedImg);
            this.canvas!.renderAll();
            this.originalImage = croppedImg;
          });
        }
      }

      this.loggingService.info('Image cropped successfully', cropRect);
    } catch (error) {
      this.loggingService.error('Failed to crop image', error as Error);
      throw error;
    }
  }

  rotateImage(angle: number): void {
    if (!this.canvas) {
      throw new Error('Canvas not initialized');
    }

    try {
      const objects = this.canvas.getObjects();
      objects.forEach(obj => {
        obj.rotate!((obj.angle || 0) + angle);
      });
      
      this.canvas.renderAll();
      this.loggingService.info('Image rotated successfully', { angle });
    } catch (error) {
      this.loggingService.error('Failed to rotate image', error as Error);
      throw error;
    }
  }

  flipImage(direction: 'horizontal' | 'vertical'): void {
    if (!this.canvas) {
      throw new Error('Canvas not initialized');
    }

    try {
      const objects = this.canvas.getObjects();
      objects.forEach(obj => {
        if (direction === 'horizontal') {
          obj.flipX = !obj.flipX;
        } else {
          obj.flipY = !obj.flipY;
        }
      });
      
      this.canvas.renderAll();
      this.loggingService.info('Image flipped successfully', { direction });
    } catch (error) {
      this.loggingService.error('Failed to flip image', error as Error);
      throw error;
    }
  }

  zoomImage(zoomLevel: number): void {
    if (!this.canvas) {
      throw new Error('Canvas not initialized');
    }

    try {
      this.canvas.setZoom(zoomLevel);
      this.canvas.renderAll();
      this.loggingService.info('Image zoomed successfully', { zoomLevel });
    } catch (error) {
      this.loggingService.error('Failed to zoom image', error as Error);
      throw error;
    }
  }

  addText(text: string, options: { left: number; top: number; fontSize?: number; color?: string }): void {
    if (!this.canvas) {
      throw new Error('Canvas not initialized');
    }

    try {
      const textObject = new fabric.Text(text, {
        left: options.left,
        top: options.top,
        fontSize: options.fontSize || 20,
        fill: options.color || '#000000',
        fontFamily: 'Arial'
      });

      this.canvas.add(textObject);
      this.canvas.renderAll();
      this.loggingService.info('Text added successfully', { text, options });
    } catch (error) {
      this.loggingService.error('Failed to add text', error as Error);
      throw error;
    }
  }

  addShape(type: 'rect' | 'circle' | 'line', options: any): void {
    if (!this.canvas) {
      throw new Error('Canvas not initialized');
    }

    try {
      let shape: fabric.Object;

      switch (type) {
        case 'rect':
          shape = new fabric.Rect({
            left: options.left,
            top: options.top,
            width: options.width,
            height: options.height,
            fill: 'transparent',
            stroke: options.color || '#000000',
            strokeWidth: options.strokeWidth || 2
          });
          break;
        case 'circle':
          shape = new fabric.Circle({
            left: options.left,
            top: options.top,
            radius: options.radius,
            fill: 'transparent',
            stroke: options.color || '#000000',
            strokeWidth: options.strokeWidth || 2
          });
          break;
        case 'line':
          shape = new fabric.Line([options.x1, options.y1, options.x2, options.y2], {
            stroke: options.color || '#000000',
            strokeWidth: options.strokeWidth || 2
          });
          break;
        default:
          throw new Error(`Unsupported shape type: ${type}`);
      }

      this.canvas.add(shape);
      this.canvas.renderAll();
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
        dataUrl = this.canvas.toSVG();
      } else {
        dataUrl = this.canvas.toDataURL({
          format: format,
          quality: quality
        });
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
    if (this.canvas) {
      this.canvas.clear();
      this.canvas.renderAll();
      this.loggingService.info('Canvas cleared');
    }
  }

  destroy(): void {
    if (this.canvas) {
      this.canvas.dispose();
      this.canvas = null;
      this.originalImage = null;
      this.loggingService.info('Canvas destroyed');
    }
  }
} 