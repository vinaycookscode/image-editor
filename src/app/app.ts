import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ImageEditorComponent } from './features/image-editor/image-editor.component';
import { ClarityModule } from '@clr/angular';

@Component({
  selector: 'app-root',
  imports: [ImageEditorComponent, ClarityModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected title = 'Image Editor';
}
