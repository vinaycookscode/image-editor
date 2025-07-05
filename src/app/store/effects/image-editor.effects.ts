import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { of } from 'rxjs';
import { map, mergeMap, catchError, withLatestFrom } from 'rxjs/operators';
import * as ImageEditorActions from '../actions/image-editor.actions';
import { selectCurrentImage, selectAnnotations } from '../selectors/image-editor.selectors';

@Injectable()
export class ImageEditorEffects {

  loadImage$ = createEffect(() => this.actions$.pipe(
    ofType(ImageEditorActions.loadImage),
    mergeMap(({ imageUrl }) => {
      return new Promise<string>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(imageUrl);
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = imageUrl;
      }).then(
        (url) => ImageEditorActions.loadImageSuccess({ imageUrl: url }),
        (error) => ImageEditorActions.loadImageFailure({ error: error.message })
      );
    })
  ));

  exportImage$ = createEffect(() => this.actions$.pipe(
    ofType(ImageEditorActions.exportImage),
    withLatestFrom(this.store.select(selectCurrentImage), this.store.select(selectAnnotations)),
    mergeMap(([{ format }, currentImage, annotations]) => {
      if (!currentImage) {
        return of(ImageEditorActions.exportImageFailure({ error: 'No image to export' }));
      }

      return new Promise<string>((resolve, reject) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        
        img.onload = () => {
          canvas.width = img.width;
          canvas.height = img.height;
          
          if (ctx) {
            // Draw the base image
            ctx.drawImage(img, 0, 0);
            
            // Draw annotations
            annotations.forEach(annotation => {
              this.drawAnnotation(ctx, annotation);
            });
            
            // Export based on format
            let dataUrl: string;
            switch (format) {
              case 'jpeg':
                dataUrl = canvas.toDataURL('image/jpeg', 0.9);
                break;
              case 'png':
                dataUrl = canvas.toDataURL('image/png');
                break;
              case 'svg':
                // For SVG, we'd need a more complex implementation
                dataUrl = canvas.toDataURL('image/svg+xml');
                break;
              default:
                dataUrl = canvas.toDataURL('image/png');
            }
            
            resolve(dataUrl);
          } else {
            reject(new Error('Failed to get canvas context'));
          }
        };
        
        img.onerror = () => reject(new Error('Failed to load image for export'));
        img.src = currentImage;
      }).then(
        (downloadUrl) => {
          // Create download link
          const link = document.createElement('a');
          link.download = `image-editor-export.${format}`;
          link.href = downloadUrl;
          link.click();
          return ImageEditorActions.exportImageSuccess({ downloadUrl });
        },
        (error) => ImageEditorActions.exportImageFailure({ error: error.message })
      );
    })
  ));

  private drawAnnotation(ctx: CanvasRenderingContext2D, annotation: any): void {
    switch (annotation.type) {
      case 'text':
        if (ctx && annotation.data.text) {
          ctx.font = annotation.style?.font || '16px Arial';
          ctx.fillStyle = annotation.style?.color || '#000';
          ctx.fillText(annotation.data.text, annotation.position.x, annotation.position.y);
        }
        break;
      case 'shape':
        if (ctx && annotation.size) {
          ctx.strokeStyle = annotation.style?.color || '#000';
          ctx.lineWidth = annotation.style?.lineWidth || 2;
          ctx.strokeRect(
            annotation.position.x,
            annotation.position.y,
            annotation.size.width,
            annotation.size.height
          );
        }
        break;
      // Add more annotation types as needed
    }
  }

  constructor(
    private actions$: Actions,
    private store: Store
  ) {}
} 