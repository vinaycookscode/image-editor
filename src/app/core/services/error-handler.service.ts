import { Injectable, ErrorHandler } from '@angular/core';
import { LoggingService } from './logging.service';

@Injectable({
  providedIn: 'root'
})
export class ErrorHandlerService implements ErrorHandler {
  
  constructor(private loggingService: LoggingService) {}

  handleError(error: Error): void {
    // Log the error
    this.loggingService.error('Unhandled error occurred', error);

    // In a production app, you might want to:
    // 1. Send error to a monitoring service (Sentry, LogRocket, etc.)
    // 2. Show a user-friendly error message
    // 3. Navigate to an error page
    // 4. Attempt to recover from the error

    // For now, we'll just log it and optionally show a console message
    console.error('An error occurred:', error);

    // You could also implement a toast notification service here
    // this.toastService.showError('An unexpected error occurred. Please try again.');
  }

  handleAsyncError(error: any, context?: string): void {
    const errorMessage = context ? `${context}: ${error.message || error}` : error.message || error;
    this.loggingService.error(errorMessage, error instanceof Error ? error : new Error(errorMessage));
  }

  handlePromiseRejection(reason: any, promise: Promise<any>): void {
    this.loggingService.error('Unhandled promise rejection', new Error(reason), { promise });
  }
} 