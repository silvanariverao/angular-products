import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Product } from '@core/models/product.model';

@Injectable({ providedIn: 'root' })
export class ProductApiDataSource {
  constructor(private readonly http: HttpClient) {}

  list(): Observable<Product[]> {
    return this.http.get<{ data: Product[] }>('/bp/products')
      .pipe(map(res => res.data));
  }

  create(product: Product): Observable<Product> {
    return this.http.post<Product>('/bp/products', product);
  }

  update(product: Product): Observable<Product> {
    return this.http.put<Product>(`/bp/products/${product.id}`, product);
  }

   delete(id: string): Observable<void> {
    return this.http.delete<void>(`/bp/products/${id}`);
  }

}
