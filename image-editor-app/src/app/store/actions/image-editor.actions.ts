import { createAction, props } from '@ngrx/store';
import { Annotation } from '../state/app.state';

// Load Image Actions
export const loadImage = createAction(
  '[Image Editor] Load Image',
  props<{ imageUrl: string }>()
);

export const loadImageSuccess = createAction(
  '[Image Editor] Load Image Success',
  props<{ imageUrl: string }>()
);

export const loadImageFailure = createAction(
  '[Image Editor] Load Image Failure',
  props<{ error: string }>()
);

// Image Editing Actions
export const cropImage = createAction(
  '[Image Editor] Crop Image',
  props<{ cropData: any }>()
);

export const rotateImage = createAction(
  '[Image Editor] Rotate Image',
  props<{ angle: number }>()
);

export const flipImage = createAction(
  '[Image Editor] Flip Image',
  props<{ direction: 'horizontal' | 'vertical' }>()
);

export const zoomImage = createAction(
  '[Image Editor] Zoom Image',
  props<{ zoomLevel: number }>()
);

export const resizeImage = createAction(
  '[Image Editor] Resize Image',
  props<{ width: number; height: number }>()
);

// History Actions
export const saveToHistory = createAction(
  '[Image Editor] Save To History',
  props<{ imageData: string }>()
);

export const undo = createAction('[Image Editor] Undo');
export const redo = createAction('[Image Editor] Redo');

// Tool Selection Actions
export const selectTool = createAction(
  '[Image Editor] Select Tool',
  props<{ tool: string }>()
);

// Annotation Actions
export const addAnnotation = createAction(
  '[Image Editor] Add Annotation',
  props<{ annotation: Annotation }>()
);

export const updateAnnotation = createAction(
  '[Image Editor] Update Annotation',
  props<{ id: string; changes: Partial<Annotation> }>()
);

export const removeAnnotation = createAction(
  '[Image Editor] Remove Annotation',
  props<{ id: string }>()
);

// Export Actions
export const exportImage = createAction(
  '[Image Editor] Export Image',
  props<{ format: 'jpeg' | 'png' | 'svg' }>()
);

export const exportImageSuccess = createAction(
  '[Image Editor] Export Image Success',
  props<{ downloadUrl: string }>()
);

export const exportImageFailure = createAction(
  '[Image Editor] Export Image Failure',
  props<{ error: string }>()
);

// Reset Actions
export const resetEditor = createAction('[Image Editor] Reset Editor'); 