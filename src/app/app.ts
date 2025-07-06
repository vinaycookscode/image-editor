import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit, Renderer2 } from '@angular/core';
import { ImageEditorComponent } from './features/image-editor/image-editor.component';
import { ClarityModule } from '@clr/angular';

@Component({
  selector: 'app-root',
  imports: [ImageEditorComponent, ClarityModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit {
  protected title = 'Image Editor';
  isDarkMode = false;

  constructor(private renderer: Renderer2) {}

  ngOnInit(): void {
    this.initializeTheme();
  }

  private initializeTheme(): void {
    // Check for saved theme preference or default to dark mode
    const savedTheme = localStorage.getItem('image-editor-theme');
    const html = this.renderer.selectRootElement('html', true);
    
    if (savedTheme === 'light') {
      this.isDarkMode = false;
      this.renderer.removeClass(html, 'dark-mode');
      this.renderer.addClass(html, 'light-mode');
    } else {
      this.isDarkMode = true;
      this.renderer.removeClass(html, 'light-mode');
      this.renderer.addClass(html, 'dark-mode');
    }
  }

  toggleDarkMode() {
    this.isDarkMode = !this.isDarkMode;
    const html = this.renderer.selectRootElement('html', true);
    
    if (this.isDarkMode) {
      this.renderer.removeClass(html, 'light-mode');
      this.renderer.addClass(html, 'dark-mode');
      localStorage.setItem('image-editor-theme', 'dark');
    } else {
      this.renderer.removeClass(html, 'dark-mode');
      this.renderer.addClass(html, 'light-mode');
      localStorage.setItem('image-editor-theme', 'light');
    }
  }
}
