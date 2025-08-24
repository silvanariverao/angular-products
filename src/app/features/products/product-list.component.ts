import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { CommonModule, NgFor, NgIf, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ListProductsUseCase } from '@core/use-cases/list-products.usecase';
import { Product } from '@core/models/product.model';
import { ProductRepository } from '@core/ports/product.repository';
import { ProductRepositoryImpl } from '@data/repositories/product.repository.impl';
import { ProductFormComponent } from './product-form.component';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [CommonModule, NgIf, NgFor, DatePipe, FormsModule, ProductFormComponent],
  templateUrl: './product-list.component.html',
  styleUrls: ['./product-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: ProductRepository, useClass: ProductRepositoryImpl }]
})
export class ProductListComponent {
  products = signal<Product[]>([]);
  searchId = signal('');
  page = signal(1);
  pageSize = signal(5);
  pageSizes = [5, 10, 20];

  showForm = signal(false);
  newProduct = signal<Product>(this.emptyProduct());
  editingProduct = signal<Product | null>(null);
  openDropdown: Product | null = null;

  constructor(
    private readonly listProducts: ListProductsUseCase,
    private readonly repo: ProductRepository
  ) {
    this.refreshList();
  }

  filtered = computed(() => {
    const term = this.searchId().trim().toLowerCase();
    if (!term) return this.products();
    return this.products().filter(p => p.id.toLowerCase().includes(term));
  });

  paginated = computed(() => {
    const start = (this.page() - 1) * this.pageSize();
    return this.filtered().slice(start, start + this.pageSize());
  });

  totalPages = computed(() => Math.ceil(this.filtered().length / this.pageSize()) || 1);

  emptyProduct(): Product {
    return { id: '', name: '', description: '', logo: '', date_release: '', date_revision: '' };
  }

  private formatDateForBackend(date: string): string {
    if (!date) return '';
    const d = new Date(date);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  refreshList() {
    this.listProducts.execute().subscribe({
      next: data => this.products.set(data)
    });
  }

  logoUrl(logo: string): string {
    if (!logo) return 'assets/placeholder.png';
    if (/^https?:\/\//i.test(logo)) return logo;
    return logo.startsWith('assets/') ? logo : `assets/${logo}`;
  }

  trackById(_: number, item: Product) { return item.id; }

  // ------------------ CREAR NUEVO ------------------
  showNewForm() {
    this.editingProduct.set(null);
    this.newProduct.set(this.emptyProduct());
    this.showForm.set(true);
  }

  // ------------------ EDITAR ------------------
  onEditProduct(product: Product) {
    this.editingProduct.set(product);       // editando
    this.newProduct.set({ ...product });
    this.showForm.set(true);
    this.openDropdown = null;
  }
  
   // ------------------ ELIMINAR ------------------
  deleteProduct(product: Product) {
    if (!confirm(`¿Estas seguro de eliminar el producto "${product.name}"?`)) {
      this.openDropdown = null;
      return;
    }

    this.repo.delete(product.id).subscribe({
      next: () => {
        alert('Producto eliminado con éxito');
        this.refreshList();
      },
      error: err => alert('Error al eliminar: ' + JSON.stringify(err))
    });

    this.openDropdown = null;
  } 

  toggleDropdown(product: Product) {
    this.openDropdown = this.openDropdown === product ? null : product;
  }

  onProductSaved(product: Product) {
    const payload: Product = {
      ...product,
      date_release: this.formatDateForBackend(product.date_release),
      date_revision: this.formatDateForBackend(product.date_revision)
    };

    const request$ = this.editingProduct()
      ? this.repo.update(payload)  // PUT
      : this.repo.create(payload); // POST

    request$.subscribe({
      next: () => {
        alert('Producto guardado con éxito');
        this.showForm.set(false);
        this.newProduct.set(this.emptyProduct());
        this.editingProduct.set(null);
        this.refreshList();
      },
      //error: err => alert('Error al guardar: ' + JSON.stringify(err))
      error: (err) => {
      if (err.status === 400 && err.error?.message?.includes('Duplicate')) {
        alert('El ID del producto ya está registrado. Por favor elige otro.');
      } else {
        alert('Ocurrió un error al guardar el producto. Inténtalo más tarde.');
        console.error('Error al guardar:', err);
      }
    }
    });
  }
}