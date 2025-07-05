import { Component } from '@angular/core';
import { ImageEditorComponent } from './features/image-editor/image-editor.component';

@Component({
  selector: 'app-root',
  imports: [ImageEditorComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected title = 'Image Editor';
}
