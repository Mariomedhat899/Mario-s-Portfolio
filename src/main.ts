import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import { injectSpeedInsights } from '@vercel/speed-insights';

bootstrapApplication(App, appConfig)
  .then(() => {
    // Initialize Vercel Speed Insights after the app is bootstrapped
    injectSpeedInsights();
  })
  .catch((err) => console.error(err));
