import { Component, OnInit, OnDestroy, ViewChild, ElementRef, ChangeDetectionStrategy, Renderer2 } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Store } from '@ngrx/store';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSliderModule } from '@angular/material/slider';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FormsModule } from '@angular/forms';
import { NgStyle, NgForOf, NgIf } from '@angular/common';

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
    MatButtonModule,
    MatIconModule,
    MatSliderModule,
    MatToolbarModule,
    MatTooltipModule,
    MatSnackBarModule,
    MatProgressSpinnerModule
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="editor-root">
      <!-- Dark/Light Mode Toggle Floating Button -->
      <button class="mode-toggle-btn" mat-fab (click)="toggleDarkMode()" [attr.aria-label]="isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'">
        <mat-icon>{{ isDarkMode ? 'dark_mode' : 'light_mode' }}</mat-icon>
      </button>
      <!-- Top Toolbar -->
      <div class="editor-toolbar">
        <div class="toolbar-icons">
          <button mat-icon-button class="upload-btn" (click)="loadImage()" matTooltip="Upload Image">
            <mat-icon>folder_open</mat-icon>
          </button>
          <button mat-icon-button (click)="undo()" [disabled]="!canUndo" matTooltip="Undo">
            <mat-icon>undo</mat-icon>
          </button>
          <button mat-icon-button (click)="redo()" [disabled]="!canRedo" matTooltip="Redo">
            <mat-icon>redo</mat-icon>
          </button>
          <button mat-icon-button (click)="flipImage('horizontal')" matTooltip="Flip Horizontal"><mat-icon>flip</mat-icon></button>
          <button mat-icon-button (click)="rotateImage(-90)" matTooltip="Rotate Left"><mat-icon>rotate_left</mat-icon></button>
          <button mat-icon-button (click)="rotateImage(90)" matTooltip="Rotate Right"><mat-icon>rotate_right</mat-icon></button>
          <button mat-icon-button (click)="flipImage('vertical')" matTooltip="Flip Vertical"><mat-icon>flip_camera_android</mat-icon></button>
          <button mat-icon-button (click)="toggleTool('aspect', $event)" matTooltip="Aspect Ratio"><mat-icon>aspect_ratio</mat-icon></button>
          <button mat-icon-button (click)="toggleTool('grid', $event)" matTooltip="Grid"><mat-icon>grid_on</mat-icon></button>
          <button mat-icon-button (click)="zoomImage(zoomLevel - 0.1)" [disabled]="zoomLevel <= 0.2" matTooltip="Zoom Out"><mat-icon>zoom_out</mat-icon></button>
          <button mat-icon-button (click)="zoomImage(zoomLevel + 0.1)" [disabled]="zoomLevel >= 5" matTooltip="Zoom In"><mat-icon>zoom_in</mat-icon></button>
        </div>
        <div class="toolbar-spacer"></div>
        <button class="export-btn" (click)="exportImage('png')">Export</button>
      </div>
      <div class="editor-content">
        <div class="editor-center">
          <div class="canvas-container-outer">
            <div class="canvas-container"
                 [class.dragging]="isDraggingCanvas"
                 (mousedown)="onCanvasMouseDown($event)"
                 (mousemove)="onCanvasMouseMove($event)"
                 (mouseup)="onCanvasMouseUp($event)"
                 (mouseleave)="onCanvasMouseUp($event)">
              <canvas #canvasElement class="editor-canvas" [class.dragging]="isDraggingCanvas"></canvas>
              <!-- Crop rectangle overlay -->
              <div *ngIf="cropRect && currentImage$ | async" class="crop-rect-overlay"
                   [ngStyle]="{ left: (cropRect?.x || 0) + 'px', top: (cropRect?.y || 0) + 'px', width: (cropRect?.w || 0) + 'px', height: (cropRect?.h || 0) + 'px' }">
                <div *ngFor="let handle of cropHandles; let i = index"
                     class="crop-handle"
                     [ngStyle]="getCropHandleStyle(i)"></div>
              </div>
              <!-- Draggable overlays for text/shapes -->
              <ng-container *ngFor="let overlay of overlays; let i = index">
                <div *ngIf="overlay.type === 'text' || overlay.type === 'shape'"
                     class="draggable-overlay"
                     [ngStyle]="{ left: overlay.x + 'px', top: overlay.y + 'px' }"
                     (mousedown)="startDragOverlay($event, overlay, i)">
                  <span *ngIf="overlay.type === 'text'" [style.fontSize.px]="overlay.size" [style.color]="overlay.color">{{ overlay.text }}</span>
                  <ng-container *ngIf="overlay.type === 'shape'">
                    <svg *ngIf="overlay.shape === 'rect'" [attr.width]="overlay.w" [attr.height]="overlay.h">
                      <rect width="100%" height="100%" stroke="#1976d2" fill="none" stroke-width="2" />
                    </svg>
                    <svg *ngIf="overlay.shape === 'circle'" [attr.width]="overlay.r*2" [attr.height]="overlay.r*2">
                      <ellipse [attr.cx]="overlay.r" [attr.cy]="overlay.r" [attr.rx]="overlay.r" [attr.ry]="overlay.r" stroke="#1976d2" fill="none" stroke-width="2" />
                    </svg>
                    <svg *ngIf="overlay.shape === 'line'" width="100" height="2">
                      <line x1="0" y1="1" x2="100" y2="1" stroke="#1976d2" stroke-width="2" />
                    </svg>
                  </ng-container>
                  <button mat-mini-fab color="primary" class="confirm-btn" (click)="confirmOverlay(overlay, $event)"><mat-icon>check</mat-icon></button>
                </div>
              </ng-container>
            </div>
            <!-- Tool Panels -->
            <div *ngIf="selectedTool === 'text'" class="tool-panel" (click)="$event.stopPropagation()">
              <div class="text-tool-panel">
                <input #textInput type="text" placeholder="Enter text..." [(ngModel)]="textValue">
                <input #colorInput type="color" [(ngModel)]="textColor">
                <input #sizeInput type="number" placeholder="Size" min="8" max="72" [(ngModel)]="textSize">
                <button class="add-text-btn" (click)="addTextOverlay()" [disabled]="!textValue.trim()">
                  <mat-icon>add</mat-icon>
                  Add Text
                </button>
              </div>
            </div>
          </div>
        </div>
        <div class="editor-sidebar">
          <div class="sidebar-title">Image Editor</div>
          <div class="sidebar-tools">
            <button class="sidebar-tool" (click)="toggleTool('crop', $event)" [class.active]="selectedTool === 'crop'"><mat-icon>crop</mat-icon> Crop</button>
            <button class="sidebar-tool" (click)="toggleTool('text', $event)" [class.active]="selectedTool === 'text'"><mat-icon>text_fields</mat-icon> Text</button>
            <button class="sidebar-tool" (click)="toggleTool('draw', $event)" [class.active]="selectedTool === 'draw'"><mat-icon>edit</mat-icon> Draw</button>
            <button class="sidebar-tool" (click)="addShapeOverlay('line')"><mat-icon>show_chart</mat-icon> Line</button>
            <button class="sidebar-tool" (click)="addShapeOverlay('rect')"><mat-icon>rectangle</mat-icon> Rectangle</button>
            <button class="sidebar-tool" (click)="addShapeOverlay('circle')"><mat-icon>circle</mat-icon> Ellipse</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :root.light-mode {
      --bg-main: #f8f9fa;
      --bg-panel: #fff;
      --text-main: #222;
      --text-secondary: #555;
      --border-main: #e0e0e0;
      --shadow-main: 0 4px 24px rgba(0,0,0,0.06);
      --toolbar-bg: #fff;
      --toolbar-icon: #222;
      --toolbar-icon-active: #2563eb;
      --sidebar-bg: #fff;
      --sidebar-title: #222;
      --sidebar-hover: #f3f4f6;
      --crop-border: #bdbdbd;
      --handle-bg: #fff;
      --handle-border: #bdbdbd;
      --handle-shadow: 0 1px 4px rgba(0,0,0,0.10);
    }
    :root.dark-mode {
      --bg-main: #181a1b;
      --bg-panel: #23272b;
      --text-main: #f1f3f4;
      --text-secondary: #b0b3b8;
      --border-main: #333a40;
      --shadow-main: 0 4px 24px rgba(0,0,0,0.32);
      --toolbar-bg: #23272b;
      --toolbar-icon: #f1f3f4;
      --toolbar-icon-active: #90caf9;
      --sidebar-bg: #23272b;
      --sidebar-title: #f1f3f4;
      --sidebar-hover: #23272b;
      --crop-border: #90caf9;
      --handle-bg: #23272b;
      --handle-border: #90caf9;
      --handle-shadow: 0 2px 8px rgba(144,202,249,0.18);
    }
    .editor-root {
      min-height: 100vh;
      background: var(--bg-main);
      display: flex;
      flex-direction: column;
    }
    .editor-toolbar {
      display: flex;
      align-items: center;
      background: var(--toolbar-bg);
      border-radius: 8px 8px 0 0;
      box-shadow: 0 2px 8px rgba(0,0,0,0.04);
      padding: 0 32px;
      min-height: 64px;
      margin: 24px 24px 0 24px;
    }
    .toolbar-icons {
      display: flex;
      gap: 8px;
    }
    .toolbar-icons button.mat-icon-button {
      color: var(--toolbar-icon);
      transition: color 0.2s, background 0.2s;
    }
    .toolbar-icons button.mat-icon-button.active, .toolbar-icons button.mat-icon-button:hover {
      color: var(--toolbar-icon-active);
      background: rgba(37,99,235,0.08);
    }
    .upload-btn {
      color: #2563eb;
      background: #e8f0fe;
      border-radius: 6px;
      margin-right: 8px;
      box-shadow: 0 1px 4px rgba(37,99,235,0.08);
      transition: background 0.2s, color 0.2s;
    }
    .upload-btn:hover {
      background: #dbeafe;
      color: #1d4ed8;
    }
    .toolbar-spacer {
      flex: 1 1 auto;
    }
    .export-btn {
      background: #2563eb;
      color: #fff;
      border: none;
      border-radius: 6px;
      font-weight: 600;
      font-size: 16px;
      padding: 10px 28px;
      box-shadow: 0 2px 8px rgba(37,99,235,0.08);
      cursor: pointer;
      transition: background 0.2s;
    }
    .export-btn:hover {
      background: #1d4ed8;
    }
    .editor-content {
      display: flex;
      flex: 1;
      margin: 0 24px 24px 24px;
      gap: 32px;
    }
    .editor-center {
      flex: 1 1 auto;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    }
    .canvas-container-outer {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background: var(--bg-panel);
      border-radius: 8px;
      box-shadow: var(--shadow-main);
      padding: 40px 40px 80px 40px;
      position: relative;
      min-width: 600px;
      min-height: 400px;
      max-width: 100vw;
      max-height: 80vh;
      overflow: auto;
    }
    .canvas-container {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--bg-panel);
      border-radius: 6px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.04);
      min-width: 320px;
      min-height: 200px;
      max-width: 90vw;
      max-height: 60vh;
      overflow: auto;
    }
    .editor-canvas {
      border-radius: 4px;
      background: var(--bg-panel);
      box-shadow: none;
      max-width: 100%;
      max-height: 60vh;
      width: 100%;
      height: auto;
      display: block;
    }
    .crop-rect-overlay {
      position: absolute;
      border: 1.5px solid var(--crop-border);
      border-radius: 6px;
      background: transparent;
      z-index: 3;
      pointer-events: none;
    }
    .crop-handle {
      width: 14px;
      height: 14px;
      background: var(--handle-bg);
      border: 1.5px solid var(--handle-border);
      border-radius: 50%;
      position: absolute;
      z-index: 4;
      box-shadow: var(--handle-shadow);
      pointer-events: auto;
      transition: box-shadow 0.15s, border-color 0.15s;
    }
    .crop-handle:hover {
      box-shadow: 0 2px 8px rgba(37,99,235,0.18);
      border-color: #2563eb;
    }
    .editor-sidebar {
      width: 260px;
      background: var(--sidebar-bg);
      box-shadow: var(--shadow-main);
      padding: 32px 24px;
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      min-width: 180px;
      max-width: 100vw;
      box-sizing: border-box;
      border: none;
    }
    .sidebar-title {
      font-size: 1.4rem;
      font-weight: 700;
      margin-bottom: 32px;
      color: var(--sidebar-title);
    }
    .sidebar-tools {
      display: flex;
      flex-direction: column;
      gap: 16px;
      width: 100%;
    }
    .sidebar-tool {
      display: flex;
      align-items: center;
      gap: 16px;
      font-size: 1.1rem;
      color: var(--text-main);
      background: none;
      border: none;
      border-radius: 6px;
      padding: 10px 12px;
      cursor: pointer;
      transition: background 0.15s;
      width: 100%;
      text-align: left;
      min-height: 44px;
    }
    .sidebar-tool:hover, .sidebar-tool.active {
      background: var(--sidebar-hover);
    }
    .tool-panel {
      position: absolute;
      top: 80px;
      right: 16px;
      background-color: var(--bg-panel);
      border: 1px solid var(--border-main);
      border-radius: 4px;
      padding: 16px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      z-index: 5;
      min-width: 220px;
      max-width: 90vw;
    }
    .text-tool-panel, .shape-tool-panel {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .text-tool-panel input {
      padding: 8px;
      border: 1px solid var(--border-main);
      border-radius: 4px;
      font-size: 1rem;
      background: var(--bg-panel);
      color: var(--text-main);
    }
    .add-text-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 12px 16px;
      background: linear-gradient(135deg, #1976d2, #1565c0);
      color: white;
      border: 2px solid #1976d2;
      border-radius: 6px;
      font-weight: 600;
      font-size: 14px;
      cursor: pointer;
      transition: all 0.2s ease;
      box-shadow: 0 2px 4px rgba(25, 118, 210, 0.3);
      min-height: 44px;
    }
    .add-text-btn:hover:not(:disabled) {
      background: linear-gradient(135deg, #1565c0, #0d47a1);
      border-color: #1565c0;
      box-shadow: 0 4px 8px rgba(25, 118, 210, 0.4);
      transform: translateY(-1px);
    }
    .add-text-btn:active:not(:disabled) {
      transform: translateY(0);
      box-shadow: 0 2px 4px rgba(25, 118, 210, 0.3);
    }
    .add-text-btn:disabled {
      background: #ccc;
      border-color: #ccc;
      color: #666;
      cursor: not-allowed;
      box-shadow: none;
    }
    .draggable-overlay {
      position: absolute;
      cursor: move;
      user-select: none;
      z-index: 10;
      background: rgba(255, 255, 255, 0.9);
      border: 1.5px solid #1976d2;
      border-radius: 4px;
      padding: 4px;
      min-width: 50px;
      min-height: 30px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1rem;
      max-width: 90vw;
      box-sizing: border-box;
      box-shadow: none;
    }
    .draggable-overlay:hover {
      border-color: #1565c0;
      background: rgba(255, 255, 255, 0.95);
    }
    .confirm-btn {
      position: absolute;
      top: -8px;
      right: -8px;
      width: 24px;
      height: 24px;
      min-width: 24px;
      padding: 0;
      border-radius: 50%;
      background: #4caf50;
      color: white;
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.2);
    }
    .confirm-btn:hover {
      background: #45a049;
      transform: scale(1.1);
    }
    .mode-toggle-btn {
      position: fixed;
      top: 24px;
      right: 32px;
      z-index: 100;
      background: var(--toolbar-bg) !important;
      color: var(--toolbar-icon) !important;
      box-shadow: 0 2px 8px rgba(0,0,0,0.10);
      border-radius: 50%;
      width: 48px;
      height: 48px;
      min-width: 48px;
      min-height: 48px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.2s, color 0.2s;
    }
    .mode-toggle-btn:hover {
      background: #e8f0fe !important;
      color: #2563eb !important;
    }
    @media (max-width: 1200px) {
      .editor-content {
        flex-direction: column;
        gap: 16px;
      }
      .editor-sidebar {
        width: 100%;
        min-width: 0;
        border-radius: 8px;
        margin-top: 24px;
        max-width: 100vw;
      }
      .canvas-container-outer {
        min-width: 0;
        padding: 16px;
        max-width: 100vw;
      }
    }
    @media (max-width: 900px) {
      .editor-toolbar {
        flex-wrap: wrap;
        padding: 8px;
        min-height: 56px;
        margin: 12px 8px 0 8px;
      }
      .editor-content {
        flex-direction: column;
        gap: 12px;
        margin: 0 8px 8px 8px;
      }
      .editor-sidebar {
        width: 100%;
        min-width: 0;
        border-radius: 8px;
        margin-top: 16px;
        padding: 20px 8px;
      }
      .canvas-container-outer {
        min-width: 0;
        padding: 8px;
        max-width: 100vw;
      }
      .canvas-container {
        min-width: 180px;
        min-height: 120px;
        max-width: 100vw;
        max-height: 40vh;
        border-radius: 6px;
      }
      .editor-canvas {
        max-width: 100vw;
        max-height: 40vh;
        border-radius: 4px;
      }
      .tool-panel {
        min-width: 120px;
        max-width: 98vw;
        right: 4px;
        top: 60px;
      }
    }
    @media (max-width: 600px) {
      .editor-toolbar {
        flex-wrap: wrap;
        padding: 4px;
        min-height: 44px;
        margin: 4px 0 0 0;
        border-radius: 0;
      }
      .editor-content {
        flex-direction: column;
        gap: 6px;
        margin: 0 0 4px 0;
      }
      .editor-sidebar {
        width: 100%;
        min-width: 0;
        border-radius: 0;
        margin-top: 4px;
        padding: 10px 2px;
      }
      .canvas-container-outer {
        min-width: 0;
        padding: 2px;
        max-width: 100vw;
        border-radius: 0;
      }
      .canvas-container {
        min-width: 80px;
        min-height: 60px;
        max-width: 100vw;
        max-height: 30vh;
        border-radius: 0;
      }
      .editor-canvas {
        max-width: 100vw;
        max-height: 30vh;
        border-radius: 0;
      }
      .tool-panel {
        min-width: 80px;
        max-width: 99vw;
        right: 2px;
        top: 44px;
        border-radius: 0;
        padding: 8px 2px;
      }
      .sidebar-tool {
        font-size: 0.95rem;
        min-height: 36px;
        padding: 6px 4px;
        border-radius: 4px;
      }
      .add-text-btn {
        font-size: 12px;
        min-height: 36px;
        padding: 8px 8px;
        border-radius: 4px;
      }
    }
  `]
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
  isDarkMode = false;

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
    // Ensure light mode is set by default on html
    const html = this.renderer.selectRootElement('html', true);
    this.renderer.addClass(html, 'light-mode');
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
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
      ctx?.save();
      ctx?.translate(canvas.width / 2, canvas.height / 2);
      ctx?.scale(this.flipH ? -1 : 1, this.flipV ? -1 : 1);
      ctx?.rotate((this.rotation * Math.PI) / 180);
      const scale = this.zoomLevel;
      ctx?.scale(scale, scale);
      ctx?.drawImage(img, -img.width / 2, -img.height / 2);
      ctx?.restore();
      
      // Apply canvas positioning for dragging
      if (this.zoomLevel > 1) {
        canvas.style.transform = `translate(${this.canvasOffset.x}px, ${this.canvasOffset.y}px) scale(${this.zoomLevel})`;
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
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (event: any) => {
      const file = event.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e: any) => {
          this.store.dispatch(ImageEditorActions.loadImageSuccess({ imageUrl: e.target.result }));
        };
        reader.onerror = () => {
          this.store.dispatch(ImageEditorActions.loadImageFailure({ error: 'Failed to read file' }));
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
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
    } else if (this.zoomLevel > 1) {
      // Enable canvas dragging when zoomed
      this.isDraggingCanvas = true;
      this.canvasDragStart = { x: event.clientX, y: event.clientY };
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
      
      // Apply transform to canvas
      canvas.style.transform = `translate(${this.canvasOffset.x}px, ${this.canvasOffset.y}px) scale(${this.zoomLevel})`;
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

  toggleDarkMode() {
    this.isDarkMode = !this.isDarkMode;
    const html = this.renderer.selectRootElement('html', true);
    if (this.isDarkMode) {
      this.renderer.removeClass(html, 'light-mode');
      this.renderer.addClass(html, 'dark-mode');
    } else {
      this.renderer.removeClass(html, 'dark-mode');
      this.renderer.addClass(html, 'light-mode');
    }
  }
} 