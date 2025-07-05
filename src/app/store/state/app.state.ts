export interface AppState {
  imageEditor: ImageEditorState;
}

export interface ImageEditorState {
  currentImage: string | null;
  imageHistory: string[];
  currentHistoryIndex: number;
  isEditing: boolean;
  selectedTool: string | null;
  zoomLevel: number;
  rotation: number;
  annotations: Annotation[];
  error: string | null;
  loading: boolean;
}

export interface Annotation {
  id: string;
  type: 'text' | 'shape' | 'drawing' | 'arrow';
  data: any;
  position: { x: number; y: number };
  size?: { width: number; height: number };
  style?: any;
} 