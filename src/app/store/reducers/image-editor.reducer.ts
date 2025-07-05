import { createReducer, on } from '@ngrx/store';
import { ImageEditorState, Annotation } from '../state/app.state';
import * as ImageEditorActions from '../actions/image-editor.actions';

export const initialState: ImageEditorState = {
  currentImage: null,
  imageHistory: [],
  currentHistoryIndex: -1,
  isEditing: false,
  selectedTool: null,
  zoomLevel: 1,
  rotation: 0,
  annotations: [],
  error: null,
  loading: false
};

export const imageEditorReducer = createReducer(
  initialState,
  
  // Load Image
  on(ImageEditorActions.loadImage, (state) => ({
    ...state,
    loading: true,
    error: null
  })),
  
  on(ImageEditorActions.loadImageSuccess, (state, { imageUrl }) => ({
    ...state,
    currentImage: imageUrl,
    imageHistory: [imageUrl],
    currentHistoryIndex: 0,
    loading: false,
    isEditing: true
  })),
  
  on(ImageEditorActions.loadImageFailure, (state, { error }) => ({
    ...state,
    error,
    loading: false
  })),
  
  // Image Editing
  on(ImageEditorActions.cropImage, (state, { cropData }) => ({
    ...state,
    isEditing: true
  })),
  
  on(ImageEditorActions.rotateImage, (state, { angle }) => ({
    ...state,
    rotation: (state.rotation + angle) % 360,
    isEditing: true
  })),
  
  on(ImageEditorActions.flipImage, (state) => ({
    ...state,
    isEditing: true
  })),
  
  on(ImageEditorActions.zoomImage, (state, { zoomLevel }) => ({
    ...state,
    zoomLevel,
    isEditing: true
  })),
  
  on(ImageEditorActions.resizeImage, (state) => ({
    ...state,
    isEditing: true
  })),
  
  // History
  on(ImageEditorActions.saveToHistory, (state, { imageData }) => {
    const newHistory = [...state.imageHistory.slice(0, state.currentHistoryIndex + 1), imageData];
    return {
      ...state,
      imageHistory: newHistory,
      currentHistoryIndex: newHistory.length - 1
    };
  }),
  
  on(ImageEditorActions.undo, (state) => ({
    ...state,
    currentHistoryIndex: Math.max(0, state.currentHistoryIndex - 1)
  })),
  
  on(ImageEditorActions.redo, (state) => ({
    ...state,
    currentHistoryIndex: Math.min(state.imageHistory.length - 1, state.currentHistoryIndex + 1)
  })),
  
  // Tool Selection
  on(ImageEditorActions.selectTool, (state, { tool }) => ({
    ...state,
    selectedTool: tool
  })),
  
  // Annotations
  on(ImageEditorActions.addAnnotation, (state, { annotation }) => ({
    ...state,
    annotations: [...state.annotations, annotation]
  })),
  
  on(ImageEditorActions.updateAnnotation, (state, { id, changes }) => ({
    ...state,
    annotations: state.annotations.map(ann => 
      ann.id === id ? { ...ann, ...changes } : ann
    )
  })),
  
  on(ImageEditorActions.removeAnnotation, (state, { id }) => ({
    ...state,
    annotations: state.annotations.filter(ann => ann.id !== id)
  })),
  
  // Export
  on(ImageEditorActions.exportImage, (state) => ({
    ...state,
    loading: true
  })),
  
  on(ImageEditorActions.exportImageSuccess, (state) => ({
    ...state,
    loading: false
  })),
  
  on(ImageEditorActions.exportImageFailure, (state, { error }) => ({
    ...state,
    error,
    loading: false
  })),
  
  // Reset
  on(ImageEditorActions.resetEditor, () => initialState)
); 