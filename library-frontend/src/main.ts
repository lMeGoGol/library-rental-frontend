import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

bootstrapApplication(App, appConfig)
  .catch(async (err) => {
    try {
      const { LoggerService } = await import('./app/core/services/logger.service');
      const logger = new LoggerService();
      logger.error('bootstrap', err);
    } catch {
      console.error(err);
    }
  });
