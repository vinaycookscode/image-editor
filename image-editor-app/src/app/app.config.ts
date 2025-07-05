import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZonelessChangeDetection, ErrorHandler } from '@angular/core';
import { provideStore } from '@ngrx/store';
import { provideStoreDevtools } from '@ngrx/store-devtools';
import { provideAnimations } from '@angular/platform-browser/animations';

import { imageEditorReducer } from './store/reducers/image-editor.reducer';
import { ErrorHandlerService } from './core/services/error-handler.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideStore({
      imageEditor: imageEditorReducer
    }),
    provideStoreDevtools({
      maxAge: 25,
      logOnly: false
    }),
    provideAnimations(),
    { provide: ErrorHandler, useClass: ErrorHandlerService }
  ]
};
