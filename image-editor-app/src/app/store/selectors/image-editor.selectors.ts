import { createFeatureSelector, createSelector } from '@ngrx/store';
import { ImageEditorState } from '../state/app.state';

export const selectImageEditorState = createFeatureSelector<ImageEditorState>('imageEditor');

export const selectCurrentImage = createSelector(
  selectImageEditorState,
  (state) => state.currentImage
);

export const selectImageHistory = createSelector(
  selectImageEditorState,
  (state) => state.imageHistory
);

export const selectCurrentHistoryIndex = createSelector(
  selectImageEditorState,
  (state) => state.currentHistoryIndex
);

export const selectIsEditing = createSelector(
  selectImageEditorState,
  (state) => state.isEditing
);

export const selectSelectedTool = createSelector(
  selectImageEditorState,
  (state) => state.selectedTool
);

export const selectZoomLevel = createSelector(
  selectImageEditorState,
  (state) => state.zoomLevel
);

export const selectRotation = createSelector(
  selectImageEditorState,
  (state) => state.rotation
);

export const selectAnnotations = createSelector(
  selectImageEditorState,
  (state) => state.annotations
);

export const selectError = createSelector(
  selectImageEditorState,
  (state) => state.error
);

export const selectLoading = createSelector(
  selectImageEditorState,
  (state) => state.loading
);

export const selectCanUndo = createSelector(
  selectImageEditorState,
  (state) => state.currentHistoryIndex > 0
);

export const selectCanRedo = createSelector(
  selectImageEditorState,
  (state) => state.currentHistoryIndex < state.imageHistory.length - 1
);

export const selectCurrentImageFromHistory = createSelector(
  selectImageEditorState,
  (state) => state.imageHistory[state.currentHistoryIndex] || null
); 