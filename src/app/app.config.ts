import { ApplicationConfig, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { routes } from './app.routes';

import { ProductRepository } from '@core/ports/product.repository';
import { ProductRepositoryImpl } from '@data/repositories/product.repository.impl';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(),
    provideRouter(routes),
    provideHttpClient(withFetch()),
    { provide: ProductRepository, useClass: ProductRepositoryImpl },
  ]
};
