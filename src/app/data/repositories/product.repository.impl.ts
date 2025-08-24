import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Product } from '@core/models/product.model';
import { ProductRepository } from '@core/ports/product.repository';
import { ProductApiDataSource } from '@data/datasources/product.api.datasource';

@Injectable()
export class ProductRepositoryImpl extends ProductRepository {
  constructor(private readonly ds: ProductApiDataSource) { super(); }

  list(): Observable<Product[]> { return this.ds.list(); }
  create(product: Product): Observable<Product> { return this.ds.create(product); }

  update(product: Product): Observable<Product> {
    return this.ds.update(product);
  }

  delete(id: string): Observable<void> {
    return this.ds.delete(id);
  }
}