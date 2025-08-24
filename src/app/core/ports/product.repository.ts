import { Observable } from 'rxjs';
import { Product } from '@core/models/product.model';

export abstract class ProductRepository {
  abstract list(): Observable<Product[]>;
  abstract create(product: Product): Observable<Product>;
  abstract update(product: Product): Observable<Product>;
  abstract delete(id: string): Observable<void>;
}
