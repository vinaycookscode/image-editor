import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { of } from 'rxjs';
import { map, mergeMap, catchError } from 'rxjs/operators';
import * as ImageEditorActions from '../actions/image-editor.actions';

@Injectable()
export class ImageEditorEffects {

  constructor(
    private actions$: Actions,
    private store: Store
  ) {}

  loadImage$ = createEffect(() => {
    return this.actions$.pipe(
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
    );
  });

  exportImage$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(ImageEditorActions.exportImage),
      mergeMap(({ format }) => {
        // For now, just dispatch success without complex export logic
        return of(ImageEditorActions.exportImageSuccess({ downloadUrl: 'data:image/png;base64,' }));
      })
    );
  });
} 