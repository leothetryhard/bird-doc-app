import {ApplicationConfig, provideBrowserGlobalErrorListeners, provideZoneChangeDetection} from '@angular/core';
import {provideRouter} from '@angular/router';

import {routes} from './app.routes';
import localeDeAt from '@angular/common/locales/de-at';
import {registerLocaleData} from '@angular/common';
import {provideHttpClient} from '@angular/common/http';

registerLocaleData(localeDeAt);

export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(),
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({eventCoalescing: true}),
    provideRouter(routes)
  ]
};
