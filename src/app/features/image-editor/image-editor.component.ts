import { Component, OnInit, OnDestroy, ViewChild, ElementRef, ChangeDetectionStrategy } from '@angular/core';
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
    MatButtonModule,
    MatIconModule,
    MatSliderModule,
    MatToolbarModule,
    MatTooltipModule,
    MatSnackBarModule
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="image-editor-container">
      <!-- Toolbar -->
      <mat-toolbar class="editor-toolbar">
        <div class="toolbar-section">
          <button mat-icon-button (click)="loadImage()" matTooltip="Load Image">
            <mat-icon>folder_open</mat-icon>
          </button>
          
          <button mat-icon-button (click)="undo()" [disabled]="!(canUndo$ | async)" matTooltip="Undo">
            <mat-icon>undo</mat-icon>
          </button>
          
          <button mat-icon-button (click)="redo()" [disabled]="!(canRedo$ | async)" matTooltip="Redo">
            <mat-icon>redo</mat-icon>
          </button>
        </div>

        <div class="toolbar-section">
          <button mat-icon-button (click)="selectTool('crop')" [class.active]="(selectedTool$ | async) === 'crop'" matTooltip="Crop">
            <mat-icon>crop</mat-icon>
          </button>
          
          <button mat-icon-button (click)="rotateImage(90)" matTooltip="Rotate 90°">
            <mat-icon>rotate_right</mat-icon>
          </button>
          
          <button mat-icon-button (click)="flipImage('horizontal')" matTooltip="Flip Horizontal">
            <mat-icon>flip</mat-icon>
          </button>
          
          <button mat-icon-button (click)="flipImage('vertical')" matTooltip="Flip Vertical">
            <mat-icon>flip_camera_android</mat-icon>
          </button>
        </div>

        <div class="toolbar-section">
          <button mat-icon-button (click)="selectTool('text')" [class.active]="(selectedTool$ | async) === 'text'" matTooltip="Add Text">
            <mat-icon>text_fields</mat-icon>
          </button>
          
          <button mat-icon-button (click)="selectTool('shape')" [class.active]="(selectedTool$ | async) === 'shape'" matTooltip="Add Shape">
            <mat-icon>shapes</mat-icon>
          </button>
          
          <button mat-icon-button (click)="selectTool('draw')" [class.active]="(selectedTool$ | async) === 'draw'" matTooltip="Draw">
            <mat-icon>edit</mat-icon>
          </button>
        </div>

        <div class="toolbar-section">
          <mat-slider 
            [value]="zoomLevel$ | async" 
            (valueChange)="zoomImage($event)"
            min="0.1" 
            max="3" 
            step="0.1"
            class="zoom-slider">
          </mat-slider>
          <span class="zoom-label">{{ (zoomLevel$ | async) | number:'1.1-1' }}x</span>
        </div>

        <div class="toolbar-section">
          <button mat-icon-button (click)="exportImage('jpeg')" matTooltip="Export as JPEG">
            <mat-icon>file_download</mat-icon>
          </button>
          
          <button mat-icon-button (click)="exportImage('png')" matTooltip="Export as PNG">
            <mat-icon>image</mat-icon>
          </button>
          
          <button mat-icon-button (click)="exportImage('svg')" matTooltip="Export as SVG">
            <mat-icon>code</mat-icon>
          </button>
        </div>
      </mat-toolbar>

      <!-- Canvas Container -->
      <div class="canvas-container" [class.loading]="loading$ | async">
        <canvas #canvasElement class="editor-canvas"></canvas>
        
        <div *ngIf="loading$ | async" class="loading-overlay">
          <mat-spinner diameter="50"></mat-spinner>
          <p>Loading image...</p>
        </div>
        
        <div *ngIf="error$ | async as error" class="error-message">
          {{ error }}
        </div>
      </div>

      <!-- Tool Panel -->
      <div *ngIf="selectedTool$ | async as selectedTool" class="tool-panel">
        <div *ngIf="selectedTool === 'text'" class="text-tool-panel">
          <input #textInput type="text" placeholder="Enter text..." (keyup.enter)="addText(textInput.value)">
          <input #colorInput type="color" (change)="setTextColor(colorInput.value)">
          <input #sizeInput type="number" placeholder="Size" min="8" max="72" (change)="setTextSize(sizeInput.value)">
        </div>
        
        <div *ngIf="selectedTool === 'shape'" class="shape-tool-panel">
          <button mat-button (click)="addShape('rect')">Rectangle</button>
          <button mat-button (click)="addShape('circle')">Circle</button>
          <button mat-button (click)="addShape('line')">Line</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .image-editor-container {
      display: flex;
      flex-direction: column;
      height: 100vh;
      background-color: #f5f5f5;
    }

    .editor-toolbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0 16px;
      background-color: #fff;
      border-bottom: 1px solid #e0e0e0;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .toolbar-section {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .zoom-slider {
      width: 100px;
      margin: 0 8px;
    }

    .zoom-label {
      font-size: 12px;
      color: #666;
      min-width: 30px;
    }

    .canvas-container {
      flex: 1;
      position: relative;
      display: flex;
      justify-content: center;
      align-items: center;
      overflow: auto;
      background-color: #e0e0e0;
    }

    .editor-canvas {
      border: 1px solid #ccc;
      background-color: #fff;
      box-shadow: 0 4px 8px rgba(0,0,0,0.1);
    }

    .loading-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      background-color: rgba(255,255,255,0.8);
      z-index: 10;
    }

    .error-message {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background-color: #f44336;
      color: white;
      padding: 16px;
      border-radius: 4px;
      z-index: 10;
    }

    .tool-panel {
      position: absolute;
      top: 80px;
      right: 16px;
      background-color: #fff;
      border: 1px solid #e0e0e0;
      border-radius: 4px;
      padding: 16px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      z-index: 5;
    }

    .text-tool-panel, .shape-tool-panel {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .text-tool-panel input {
      padding: 8px;
      border: 1px solid #ccc;
      border-radius: 4px;
    }

    .shape-tool-panel button {
      margin-bottom: 4px;
    }

    .active {
      background-color: #e3f2fd;
      color: #1976d2;
    }

    @media (max-width: 768px) {
      .editor-toolbar {
        flex-wrap: wrap;
        padding: 8px;
      }
      
      .toolbar-section {
        margin-bottom: 8px;
      }
      
      .tool-panel {
        position: fixed;
        bottom: 16px;
        right: 16px;
        top: auto;
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
  selectedTool$: Observable<string | null>;
  zoomLevel$: Observable<number>;
  canUndo$: Observable<boolean>;
  canRedo$: Observable<boolean>;

  private destroy$ = new Subject<void>();

  constructor(
    private store: Store<AppState>,
    private imageEditorService: ImageEditorService,
    private loggingService: LoggingService
  ) {
    // Initialize observables
    this.currentImage$ = this.store.select(ImageEditorSelectors.selectCurrentImage);
    this.loading$ = this.store.select(ImageEditorSelectors.selectLoading);
    this.error$ = this.store.select(ImageEditorSelectors.selectError);
    this.selectedTool$ = this.store.select(ImageEditorSelectors.selectSelectedTool);
    this.zoomLevel$ = this.store.select(ImageEditorSelectors.selectZoomLevel);
    this.canUndo$ = this.store.select(ImageEditorSelectors.selectCanUndo);
    this.canRedo$ = this.store.select(ImageEditorSelectors.selectCanRedo);
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
    // Subscribe to current image changes
    this.currentImage$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(imageUrl => {
      if (imageUrl) {
        this.loadImageToCanvas(imageUrl);
      }
    });

    // Subscribe to zoom level changes
    this.zoomLevel$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(zoomLevel => {
      this.imageEditorService.zoomImage(zoomLevel);
    });
  }

  private loadImageToCanvas(imageUrl: string): void {
    this.imageEditorService.loadImage(imageUrl).catch(error => {
      this.loggingService.error('Failed to load image to canvas', error as Error);
    });
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
          this.store.dispatch(ImageEditorActions.loadImage({ imageUrl: e.target.result }));
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  }

  undo(): void {
    this.store.dispatch(ImageEditorActions.undo());
  }

  redo(): void {
    this.store.dispatch(ImageEditorActions.redo());
  }

  selectTool(tool: string): void {
    this.store.dispatch(ImageEditorActions.selectTool({ tool }));
  }

  rotateImage(angle: number): void {
    this.store.dispatch(ImageEditorActions.rotateImage({ angle }));
    this.imageEditorService.rotateImage(angle);
  }

  flipImage(direction: 'horizontal' | 'vertical'): void {
    this.store.dispatch(ImageEditorActions.flipImage({ direction }));
    this.imageEditorService.flipImage(direction);
  }

  zoomImage(zoomLevel: number): void {
    this.store.dispatch(ImageEditorActions.zoomImage({ zoomLevel }));
  }

  addText(text: string): void {
    if (text.trim()) {
      // For simplicity, add text at center of canvas
      const canvas = this.canvasElement.nativeElement;
      const x = canvas.width / 2;
      const y = canvas.height / 2;
      
      this.imageEditorService.addText(text, { left: x, top: y });
    }
  }

  addShape(type: 'rect' | 'circle' | 'line'): void {
    const canvas = this.canvasElement.nativeElement;
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    
    switch (type) {
      case 'rect':
        this.imageEditorService.addShape('rect', {
          left: centerX - 50,
          top: centerY - 30,
          width: 100,
          height: 60
        });
        break;
      case 'circle':
        this.imageEditorService.addShape('circle', {
          left: centerX,
          top: centerY,
          radius: 30
        });
        break;
      case 'line':
        this.imageEditorService.addShape('line', {
          x1: centerX - 50,
          y1: centerY,
          x2: centerX + 50,
          y2: centerY
        });
        break;
    }
  }

  setTextColor(color: string): void {
    // Implementation for setting text color
    this.loggingService.info('Text color changed', { color });
  }

  setTextSize(size: string): void {
    // Implementation for setting text size
    this.loggingService.info('Text size changed', { size });
  }

  exportImage(format: 'jpeg' | 'png' | 'svg'): void {
    this.store.dispatch(ImageEditorActions.exportImage({ format }));
  }
} 