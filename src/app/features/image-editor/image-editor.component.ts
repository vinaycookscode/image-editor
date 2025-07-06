import { Component, OnInit, OnDestroy, ViewChild, ElementRef, ChangeDetectionStrategy, Renderer2, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Store } from '@ngrx/store';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { FormsModule } from '@angular/forms';
import { NgStyle, NgForOf, NgIf } from '@angular/common';
import { ClarityModule } from '@clr/angular';

import { AppState } from '../../store/state/app.state';
import * as ImageEditorActions from '../../store/actions/image-editor.actions';
import * as ImageEditorSelectors from '../../store/selectors/image-editor.selectors';
import { ImageEditorService } from '../../core/services/image-editor.service';
import { LoggingService } from '../../core/services/logging.service';

@Component({
  selector: 'app-image-editor',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NgStyle,
    NgForOf,
    NgIf,
    ClarityModule
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './image-editor.component.html',
  styleUrls: ['./image-editor.component.scss']
})
export class ImageEditorComponent implements OnInit, OnDestroy {
  @ViewChild('canvasElement', { static: true }) canvasElement!: ElementRef<HTMLCanvasElement>;

  // Observables from store
  currentImage$: Observable<string | null>;
  loading$: Observable<boolean>;
  error$: Observable<string | null>;

  // Local state
  selectedTool: string | null = null;
  zoomLevel = 1;
  rotation = 0;
  flipH = false;
  flipV = false;
  canUndo = false;
  canRedo = false;
  textValue = '';
  textColor = '#000000';
  textSize = 20;
  private destroy$ = new Subject<void>();
  private imageHistory: string[] = [];
  private currentHistoryIndex = -1;
  private lastImageData: string | null = null;
  cropRect: { x: number; y: number; w: number; h: number } | null = null;
  overlays: any[] = [];
  isDraggingOverlay = false;
  dragOffset = { x: 0, y: 0 };
  draggingOverlayIndex: number | null = null;
  isDrawing = false;
  lastDrawPoint: { x: number; y: number } | null = null;
  isDraggingCanvas = false;
  canvasDragStart = { x: 0, y: 0 };
  canvasOffset = { x: 0, y: 0 };
  cropHandles = Array(8).fill(0);

  showMoreMenu = false;

  constructor(
    private store: Store<AppState>,
    private imageEditorService: ImageEditorService,
    private loggingService: LoggingService,
    private renderer: Renderer2
  ) {
    this.currentImage$ = this.store.select(ImageEditorSelectors.selectCurrentImage);
    this.loading$ = this.store.select(ImageEditorSelectors.selectLoading);
    this.error$ = this.store.select(ImageEditorSelectors.selectError);
  }

  ngOnInit(): void {
    this.initializeCanvas();
    this.setupSubscriptions();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.imageEditorService.destroy();
  }

  private initializeCanvas(): void {
    try {
      this.imageEditorService.initializeCanvas(this.canvasElement.nativeElement);
      this.loggingService.info('Canvas initialized in component');
    } catch (error) {
      this.loggingService.error('Failed to initialize canvas in component', error as Error);
    }
  }

  private setupSubscriptions(): void {
    this.currentImage$.pipe(takeUntil(this.destroy$)).subscribe(imageUrl => {
      if (imageUrl) {
        this.loadImageToCanvas(imageUrl);
      }
    });
  }

  private loadImageToCanvas(imageUrl: string): void {
    const canvas = this.canvasElement.nativeElement;
    const ctx = canvas.getContext('2d');
    const img = new window.Image();
    img.onload = () => {
      // Resize canvas to fit image, but limit to max 900x600 for usability
      const maxW = 900, maxH = 600;
      let w = img.width, h = img.height;
      if (w > maxW) { h = h * (maxW / w); w = maxW; }
      if (h > maxH) { w = w * (maxH / h); h = maxH; }
      canvas.width = w;
      canvas.height = h;
      ctx?.clearRect(0, 0, w, h);
      ctx?.drawImage(img, 0, 0, w, h);
      this.saveHistory();
      this.resetTransforms();
      // Reset canvas offset when new image is loaded
      this.canvasOffset = { x: 0, y: 0 };
      this.canvasElement.nativeElement.style.transform = '';
    };
    img.src = imageUrl;
  }

  private saveHistory(): void {
    const canvas = this.canvasElement.nativeElement;
    this.imageHistory = this.imageHistory.slice(0, this.currentHistoryIndex + 1);
    this.imageHistory.push(canvas.toDataURL());
    this.currentHistoryIndex = this.imageHistory.length - 1;
    this.updateUndoRedoState();
  }

  private updateUndoRedoState(): void {
    this.canUndo = this.currentHistoryIndex > 0;
    this.canRedo = this.currentHistoryIndex < this.imageHistory.length - 1;
  }

  undo(): void {
    if (this.canUndo) {
      this.currentHistoryIndex--;
      this.restoreFromHistory();
    }
  }

  redo(): void {
    if (this.canRedo) {
      this.currentHistoryIndex++;
      this.restoreFromHistory();
    }
  }

  private restoreFromHistory(): void {
    const canvas = this.canvasElement.nativeElement;
    const ctx = canvas.getContext('2d');
    const img = new window.Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.clearRect(0, 0, img.width, img.height);
      ctx?.drawImage(img, 0, 0, img.width, img.height);
    };
    img.src = this.imageHistory[this.currentHistoryIndex];
    this.updateUndoRedoState();
    this.resetTransforms();
  }

  rotateImage(angle: number): void {
    this.rotation = (this.rotation + angle) % 360;
    this.applyTransforms();
    this.saveHistory();
  }

  flipImage(direction: 'horizontal' | 'vertical'): void {
    if (direction === 'horizontal') this.flipH = !this.flipH;
    if (direction === 'vertical') this.flipV = !this.flipV;
    this.applyTransforms();
    this.saveHistory();
  }

  zoomImage(zoom: number): void {
    this.zoomLevel = Math.max(0.1, Math.min(5, zoom));
    // Reset canvas position when zoom changes
    this.canvasOffset = { x: 0, y: 0 };
    this.applyTransforms();
  }

  private applyTransforms(): void {
    const canvas = this.canvasElement.nativeElement;
    const ctx = canvas.getContext('2d');
    const img = new window.Image();
    img.onload = () => {
      // Calculate if we need to swap dimensions for 90° or 270° rotation
      const isRotated90or270 = Math.abs(this.rotation % 180) === 90;
      const originalWidth = img.width;
      const originalHeight = img.height;
      
      // Set canvas dimensions based on rotation
      if (isRotated90or270) {
        canvas.width = originalHeight;
        canvas.height = originalWidth;
      } else {
        canvas.width = originalWidth;
        canvas.height = originalHeight;
      }
      
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
      ctx?.save();
      ctx?.translate(canvas.width / 2, canvas.height / 2);
      ctx?.scale(this.flipH ? -1 : 1, this.flipV ? -1 : 1);
      ctx?.rotate((this.rotation * Math.PI) / 180);
      const scale = this.zoomLevel;
      ctx?.scale(scale, scale);
      ctx?.drawImage(img, -originalWidth / 2, -originalHeight / 2, originalWidth, originalHeight);
      ctx?.restore();
      
      // Apply only translation for dragging, not scaling
      if (this.zoomLevel > 1) {
        canvas.style.transform = `translate(${this.canvasOffset.x}px, ${this.canvasOffset.y}px)`;
      } else {
        canvas.style.transform = '';
      }
    };
    img.src = this.imageHistory[this.currentHistoryIndex];
  }

  private resetTransforms(): void {
    this.rotation = 0;
    this.flipH = false;
    this.flipV = false;
    this.zoomLevel = 1;
    this.canvasOffset = { x: 0, y: 0 };
    const canvas = this.canvasElement.nativeElement;
    canvas.style.transform = '';
  }

  // Tool panel logic
  toggleTool(tool: string, event: MouseEvent): void {
    event.stopPropagation();
    this.selectedTool = this.selectedTool === tool ? null : tool;
  }

  onBackgroundClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('image-editor-container')) {
      this.selectedTool = null;
    }
  }

  // Add text logic
  addTextOverlay(): void {
    if (!this.textValue.trim()) return;
    this.overlays.push({
      type: 'text',
      x: 100,
      y: 100,
      text: this.textValue,
      color: this.textColor,
      size: this.textSize
    });
    this.selectedTool = null;
    this.textValue = '';
  }

  // Add shape logic
  addShapeOverlay(type: 'rect' | 'circle' | 'line'): void {
    if (type === 'rect') {
      this.overlays.push({ type: 'shape', shape: 'rect', x: 100, y: 100, w: 100, h: 60 });
    } else if (type === 'circle') {
      this.overlays.push({ type: 'shape', shape: 'circle', x: 100, y: 100, r: 30 });
    } else if (type === 'line') {
      this.overlays.push({ type: 'shape', shape: 'line', x: 100, y: 100 });
    }
    this.selectedTool = null;
  }

  exportImage(format: 'jpeg' | 'png' | 'svg'): void {
    const canvas = this.canvasElement.nativeElement;
    let dataUrl: string;
    switch (format) {
      case 'jpeg':
        dataUrl = canvas.toDataURL('image/jpeg', 0.9);
        break;
      case 'png':
        dataUrl = canvas.toDataURL('image/png');
        break;
      case 'svg':
        dataUrl = canvas.toDataURL('image/svg+xml');
        break;
      default:
        dataUrl = canvas.toDataURL('image/png');
    }
    const link = document.createElement('a');
    link.download = `image-editor-export.${format}`;
    link.href = dataUrl;
    link.click();
  }

  loadImage(): void {
    // Create file input element
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.multiple = false;
    input.capture = 'environment'; // Enable camera on mobile
    
    // Handle file selection
    input.onchange = (event: any) => {
      const file = event.target.files[0];
      if (file) {
        // Validate file type
        if (!file.type.startsWith('image/')) {
          this.store.dispatch(ImageEditorActions.loadImageFailure({ error: 'Please select an image file' }));
          return;
        }
        
        // Validate file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
          this.store.dispatch(ImageEditorActions.loadImageFailure({ error: 'File size too large. Please select an image under 10MB' }));
          return;
        }
        
        const reader = new FileReader();
        reader.onload = (e: any) => {
          this.store.dispatch(ImageEditorActions.loadImageSuccess({ imageUrl: e.target.result }));
        };
        reader.onerror = () => {
          this.store.dispatch(ImageEditorActions.loadImageFailure({ error: 'Failed to read file' }));
        };
        reader.readAsDataURL(file);
      }
      
      // Clean up the input element
      input.remove();
    };
    
    // Handle cancellation
    input.oncancel = () => {
      input.remove();
    };
    
    // Trigger file selection
    try {
      input.click();
    } catch (error) {
      this.store.dispatch(ImageEditorActions.loadImageFailure({ error: 'Failed to open file picker' }));
      input.remove();
    }
  }

  onCanvasMouseDown(event: MouseEvent): void {
    const canvas = this.canvasElement.nativeElement;
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    // Check if we're clicking on an overlay first
    const overlayElement = (event.target as HTMLElement).closest('.draggable-overlay');
    if (overlayElement) {
      return; // Let the overlay handle its own drag
    }
    
    if (this.selectedTool === 'crop') {
      this.cropRect = { x, y, w: 0, h: 0 };
      this.isDraggingOverlay = true;
    } else if (this.selectedTool === 'draw') {
      this.isDrawing = true;
      this.lastDrawPoint = { x, y };
    } else if (this.selectedTool === 'text' || this.selectedTool === 'shape') {
      // handled by overlay drag
    } else if (this.zoomLevel > 1.1) {
      // Enable canvas dragging when zoomed in significantly
      this.isDraggingCanvas = true;
      this.canvasDragStart = { x: event.clientX, y: event.clientY };
      const canvasContainer = canvas.closest('.canvas-container') as HTMLElement;
      if (canvasContainer) {
        canvasContainer.classList.add('dragging');
      }
      event.preventDefault();
    }
  }

  onCanvasMouseMove(event: MouseEvent): void {
    const canvas = this.canvasElement.nativeElement;
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    if (this.selectedTool === 'crop' && this.isDraggingOverlay && this.cropRect) {
      this.cropRect.w = x - this.cropRect.x;
      this.cropRect.h = y - this.cropRect.y;
    } else if (this.selectedTool === 'draw' && this.isDrawing && this.lastDrawPoint) {
      const ctx = canvas.getContext('2d');
      ctx!.beginPath();
      ctx!.moveTo(this.lastDrawPoint.x, this.lastDrawPoint.y);
      ctx!.lineTo(x, y);
      ctx!.strokeStyle = '#000';
      ctx!.lineWidth = 2;
      ctx!.stroke();
      this.lastDrawPoint = { x, y };
    } else if (this.isDraggingOverlay && this.draggingOverlayIndex !== null) {
      const overlay = this.overlays[this.draggingOverlayIndex];
      overlay.x = x - this.dragOffset.x;
      overlay.y = y - this.dragOffset.y;
    } else if (this.isDraggingCanvas) {
      // Handle canvas dragging when zoomed
      const deltaX = event.clientX - this.canvasDragStart.x;
      const deltaY = event.clientY - this.canvasDragStart.y;
      
      this.canvasOffset.x += deltaX;
      this.canvasOffset.y += deltaY;
      this.canvasDragStart = { x: event.clientX, y: event.clientY };
      
      // Apply only translation transform to canvas
      canvas.style.transform = `translate(${this.canvasOffset.x}px, ${this.canvasOffset.y}px)`;
    }
  }

  onCanvasMouseUp(event: MouseEvent): void {
    if (this.selectedTool === 'crop' && this.isDraggingOverlay) {
      this.isDraggingOverlay = false;
      // Optionally, show a confirm button to crop
      this.confirmCrop();
    } else if (this.selectedTool === 'draw' && this.isDrawing) {
      this.isDrawing = false;
      this.lastDrawPoint = null;
      this.saveHistory();
    } else if (this.isDraggingOverlay) {
      this.isDraggingOverlay = false;
      this.draggingOverlayIndex = null;
      this.saveHistory();
    } else if (this.isDraggingCanvas) {
      this.isDraggingCanvas = false;
      const canvas = this.canvasElement.nativeElement;
      const canvasContainer = canvas.closest('.canvas-container') as HTMLElement;
      if (canvasContainer) {
        canvasContainer.classList.remove('dragging');
      }
    }
  }

  startDragOverlay(event: MouseEvent, overlay: any, index: number): void {
    event.stopPropagation();
    this.isDraggingOverlay = true;
    this.draggingOverlayIndex = index;
    this.dragOffset = {
      x: event.offsetX,
      y: event.offsetY
    };
  }

  confirmOverlay(overlay: any, event: MouseEvent): void {
    event.stopPropagation();
    this.selectedTool = null;
    // Draw overlay to canvas and remove from overlays array
    const canvas = this.canvasElement.nativeElement;
    const ctx = canvas.getContext('2d');
    if (overlay.type === 'text') {
      ctx!.font = `${overlay.size || 20}px Arial`;
      ctx!.fillStyle = overlay.color || '#000000';
      ctx!.fillText(overlay.text, overlay.x, overlay.y);
    } else if (overlay.type === 'shape') {
      ctx!.strokeStyle = '#000000';
      ctx!.lineWidth = 2;
      if (overlay.shape === 'rect') {
        ctx!.strokeRect(overlay.x, overlay.y, overlay.w, overlay.h);
      } else if (overlay.shape === 'circle') {
        ctx!.beginPath();
        ctx!.arc(overlay.x + overlay.r, overlay.y + overlay.r, overlay.r, 0, 2 * Math.PI);
        ctx!.stroke();
      } else if (overlay.shape === 'line') {
        ctx!.beginPath();
        ctx!.moveTo(overlay.x, overlay.y);
        ctx!.lineTo(overlay.x + 100, overlay.y);
        ctx!.stroke();
      }
    }
    this.overlays = this.overlays.filter(o => o !== overlay);
    this.saveHistory();
  }

  confirmCrop(): void {
    if (!this.cropRect) return;
    const canvas = this.canvasElement.nativeElement;
    const ctx = canvas.getContext('2d');
    const { x, y, w, h } = this.cropRect;
    const imageData = ctx!.getImageData(x, y, w, h);
    canvas.width = w;
    canvas.height = h;
    ctx!.putImageData(imageData, 0, 0);
    this.cropRect = null;
    this.saveHistory();
  }

  getCropHandleStyle(i: number) {
    // Returns style for each handle (corners/sides)
    if (!this.cropRect) return {};
    const { x, y, w, h } = this.cropRect;
    const size = 12;
    const positions = [
      { left: 0, top: 0 }, // top-left
      { left: w / 2 - size / 2, top: 0 }, // top-center
      { left: w - size, top: 0 }, // top-right
      { left: w - size, top: h / 2 - size / 2 }, // right-center
      { left: w - size, top: h - size }, // bottom-right
      { left: w / 2 - size / 2, top: h - size }, // bottom-center
      { left: 0, top: h - size }, // bottom-left
      { left: 0, top: h / 2 - size / 2 }, // left-center
    ];
    return {
      position: 'absolute',
      left: positions[i].left + 'px',
      top: positions[i].top + 'px',
      width: size + 'px',
      height: size + 'px',
      cursor: 'pointer',
      background: '#fff',
      border: '2px solid #1976d2',
      borderRadius: '50%'
    };
  }

  resetCanvasPosition(): void {
    this.canvasOffset = { x: 0, y: 0 };
    const canvas = this.canvasElement.nativeElement;
    canvas.style.transform = '';
  }

  toggleMoreMenu(): void {
    this.showMoreMenu = !this.showMoreMenu;
  }

  mobileToggleTool(tool: string, event: MouseEvent): void {
    // Check if image is loaded before executing
    this.currentImage$.subscribe(imageUrl => {
      if (imageUrl) {
        this.toggleTool(tool, event);
        this.showMoreMenu = false;
      }
    }).unsubscribe();
  }

  mobileAddShapeOverlay(type: 'rect' | 'circle' | 'line'): void {
    // Check if image is loaded before executing
    this.currentImage$.subscribe(imageUrl => {
      if (imageUrl) {
        this.addShapeOverlay(type);
        this.showMoreMenu = false;
      }
    }).unsubscribe();
  }

  mobileLoadImage(): void {
    // Mobile-specific upload method with better error handling
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.multiple = false;
    
    // For mobile, don't use capture attribute as it might cause issues
    // input.capture = 'environment';
    
    input.onchange = (event: any) => {
      const file = event.target.files[0];
      if (file) {
        // Validate file type
        if (!file.type.startsWith('image/')) {
          alert('Please select an image file');
          return;
        }
        
        // Validate file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
          alert('File size too large. Please select an image under 10MB');
          return;
        }
        
        const reader = new FileReader();
        reader.onload = (e: any) => {
          this.store.dispatch(ImageEditorActions.loadImageSuccess({ imageUrl: e.target.result }));
        };
        reader.onerror = () => {
          alert('Failed to read file');
        };
        reader.readAsDataURL(file);
      }
      input.remove();
    };
    
    input.oncancel = () => {
      input.remove();
    };
    
    // Use a small delay to ensure the input is properly created
    setTimeout(() => {
      try {
        input.click();
      } catch (error) {
        alert('Failed to open file picker');
        input.remove();
      }
    }, 100);
  }
} 