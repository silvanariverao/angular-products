import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Product } from '@core/models/product.model';
import { ProductRepository } from '@core/ports/product.repository';

@Injectable({ providedIn: 'root' })
export class ListProductsUseCase {
  constructor(private readonly repo: ProductRepository) {}
  execute(): Observable<Product[]> { return this.repo.list(); }
}
