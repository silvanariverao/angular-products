import { Component, EventEmitter, Input, Output, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Product } from '@core/models/product.model';
import { HttpClient } from '@angular/common/http';
import { Subject, of } from 'rxjs';
import { debounceTime, switchMap, catchError } from 'rxjs/operators';

@Component({
  selector: 'app-product-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './product-form.component.html',
  styleUrls: ['./product-form.component.scss']
})
export class ProductFormComponent {
  @Input() product!: Product;
  @Input() editMode = false;
  @Output() save = new EventEmitter<Product>();
  @Output() cancel = new EventEmitter<void>();

  private http = inject(HttpClient);

  // Signals para mostrar validaciones
  idValid = signal(true);
  idMessage = signal('');

  nameValid = signal(true);
  nameMessage = signal('');

  descriptionValid = signal(true);
  descriptionMessage = signal('');

  logoValid = signal(true);
  logoMessage = signal('');

  dateReleaseValid = signal(true);
  dateReleaseMessage = signal('');

  dateRevisionValid = signal(true);
  dateRevisionMessage = signal('');

  private idChanges = new Subject<string>();
  idChecking = signal(false);  // esperando respuesta

  constructor() {
    this.idChanges.pipe(
      debounceTime(300),
      switchMap(id => {
        if (!id) return of({ exists: false });
        this.idChecking.set(true);
        return this.http.get<{ exists: boolean }>(`/bp/products/${id}`).pipe(
          catchError(() => of({ exists: false }))
        );
      })
    ).subscribe(res => {
      this.idChecking.set(false);
      if (res.exists) {
        this.idValid.set(false);
        this.idMessage.set('ID duplicado.');
      } else {
        this.idValid.set(true);
        this.idMessage.set('');
      }
    });
  }

  onIdChange(value: string) {
    value = value.trim();

    if (value.length < 3) {
      this.idValid.set(false);
      this.idMessage.set('ID debe tener mínimo 3 caracteres.');
    } else if (value.length > 10) {
      this.idValid.set(false);
      this.idMessage.set('ID puede tener máximo 10 caracteres.');
    } else {
      if (!this.editMode) {
        this.idMessage.set('Verificando...');
        this.idChanges.next(value);

      } else {
        this.idValid.set(true);
        this.idMessage.set('');
      }
    }
  }

  onNameChange(value: string) {
    value = value.trim();
    if (!value) {
      this.nameValid.set(false);
      this.nameMessage.set('Nombre es obligatorio.');
    } else if (value.length < 5) {
      this.nameValid.set(false);
      this.nameMessage.set('Nombre debe tener mínimo 5 caracteres.');
    } else if (value.length > 100) {
      this.nameValid.set(false);
      this.nameMessage.set('Nombre puede tener máximo 100 caracteres.');
    } else {
      this.nameValid.set(true);
      this.nameMessage.set('');
    }
  }

  onDescriptionChange(value: string) {
    value = value.trim();
    if (!value) {
      this.descriptionValid.set(false);
      this.descriptionMessage.set('Descripción es obligatoria.');
    } else if (value.length < 10) {
      this.descriptionValid.set(false);
      this.descriptionMessage.set('Descripción debe tener mínimo 10 caracteres.');
    } else if (value.length > 200) {
      this.descriptionValid.set(false);
      this.descriptionMessage.set('Descripción puede tener máximo 200 caracteres.');
    } else {
      this.descriptionValid.set(true);
      this.descriptionMessage.set('');
    }
  }

  onLogoChange(value: string) {
    value = value.trim();
    if (!value) {
      this.logoValid.set(false);
      this.logoMessage.set('Logo es obligatorio.');
    } else {
      this.logoValid.set(true);
      this.logoMessage.set('');
    }
  }

  onDateReleaseChange(value: string) {
    if (!value) {
      this.dateReleaseValid.set(false);
      this.dateReleaseMessage.set('Fecha de lanzamiento es obligatoria.');
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const releaseDate = new Date(value);

    if (releaseDate < today) {
      this.dateReleaseValid.set(false);
      this.dateReleaseMessage.set('La fecha de lanzamiento no puede ser anterior a hoy.');
    } else {
      this.dateReleaseValid.set(true);
      this.dateReleaseMessage.set('');
    }
  }

  onDateRevisionChange(value: string) {
    if (!value) {
      this.dateRevisionValid.set(false);
      this.dateRevisionMessage.set('Fecha de revisión es obligatoria.');
      return;
    }

    const releaseDate = new Date(this.product.date_release);
    const revisionDate = new Date(value);

    // calcular la fecha esperada = releaseDate + 1 año
    const expectedRevision = new Date(releaseDate);
    expectedRevision.setFullYear(expectedRevision.getFullYear() + 1);

    // normalizar horas para comparar solo fechas
    expectedRevision.setHours(0, 0, 0, 0);
    revisionDate.setHours(0, 0, 0, 0);

    if (revisionDate.getTime() !== expectedRevision.getTime()) {
      this.dateRevisionValid.set(false);
      this.dateRevisionMessage.set(
        `La fecha de revisión debe ser exactamente 1 año después de la fecha de lanzamiento (${expectedRevision.toISOString().split('T')[0]}).`
      );
    } else {
      this.dateRevisionValid.set(true);
      this.dateRevisionMessage.set('');
    }
  }

  // Validación final antes de emitir
  private allValid(): boolean {
    this.onIdChange(this.product.id);
    this.onNameChange(this.product.name);
    this.onDescriptionChange(this.product.description);
    this.onLogoChange(this.product.logo);
    this.onDateReleaseChange(this.product.date_release);
    this.onDateRevisionChange(this.product.date_revision);

    // Bloquear si todavía está verificando el ID
    if (this.idChecking()) {
      this.idMessage.set('Esperando validación del ID...');
      return false;
    }

    if (!this.idValid()) {
      return false;
    }
    
    return this.idValid() && this.nameValid() && this.descriptionValid() &&
          this.logoValid() && this.dateReleaseValid() && this.dateRevisionValid();
  }

  saveProduct() {
    if (!this.allValid()) return; // Si algún campo no es válido, no guardar
    this.save.emit(this.product); // Emitir producto
  }

  resetForm() {
    Object.assign(this.product, { id: '', name: '', description: '', logo: '', date_release: '', date_revision: '' });
    this.idValid.set(true); this.idMessage.set('');
    this.nameValid.set(true); this.nameMessage.set('');
    this.descriptionValid.set(true); this.descriptionMessage.set('');
    this.logoValid.set(true); this.logoMessage.set('');
    this.dateReleaseValid.set(true); this.dateReleaseMessage.set('');
    this.dateRevisionValid.set(true); this.dateRevisionMessage.set('');
  }

}