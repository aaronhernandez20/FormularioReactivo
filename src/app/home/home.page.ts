import { Component, inject, signal } from '@angular/core';
import {
  ReactiveFormsModule,
  FormBuilder,
  Validators,
  AbstractControl,
  ValidationErrors
} from '@angular/forms';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonList,
  IonItem,
  IonInput,
  IonSelect,
  IonSelectOption,
  IonButton,
  IonLoading,
  IonToast
} from '@ionic/angular';

// Validador personalizado: SKU de exactamente 12 caracteres alfanuméricos
function skuValido(control: AbstractControl): ValidationErrors | null {
  const valor = control.value ?? '';
  if (!valor) return null; // de lo vacío se encarga Validators.required
  return /^[A-Za-z0-9]{12}$/.test(valor) ? null : { skuInvalido: true };
}

// Validador personalizado: stock mínimo entero y mayor que 0
function stockMayorQueCero(control: AbstractControl): ValidationErrors | null {
  const valor = control.value;
  if (valor === null || valor === '') return null;
  const numero = Number(valor);
  return Number.isInteger(numero) && numero > 0 ? null : { stockInvalido: true };
}

// Validador personalizado: la fecha de nacimiento no puede ser futura
function fechaNoFutura(control: AbstractControl): ValidationErrors | null {
  if (!control.value) return null;
  return new Date(control.value) > new Date() ? { fechaFutura: true } : null;
}

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  imports: [
    ReactiveFormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonList,
    IonItem,
    IonInput,
    IonSelect,
    IonSelectOption,
    IonButton,
    IonLoading,
    IonToast
  ]
})
export class HomePage {
  private fb = inject(FormBuilder);

  // Signals de estado
  isSubmitting = signal(false);
  toastOpen = signal(false);
  toastMessage = signal('');

  categorias = ['Electrónica', 'Herramientas', 'Consumibles'];

  // Fecha de hoy (YYYY-MM-DD) para limitar el selector de fecha
  hoy = new Date().toISOString().split('T')[0];

  productoForm = this.fb.group({
    sku: ['', [Validators.required, skuValido]],
    nombre: ['', [Validators.required]],
    categoria: ['', [Validators.required]],
    stockMinimo: ['', [Validators.required, stockMayorQueCero]],
    fechaNacimiento: ['', [Validators.required, fechaNoFutura]]
  });

  async onSubmit(): Promise<void> {
    if (this.productoForm.invalid) {
      this.productoForm.markAllAsTouched();
      return;
    }

    // Se guarda el valor antes de desactivar el formulario
    const producto = this.productoForm.getRawValue();

    this.isSubmitting.set(true);
    this.productoForm.disable();

    try {
      console.log('Producto a guardar:', producto);

      // Simulación de petición de guardado
      await new Promise(resolve => setTimeout(resolve, 2000));

      this.productoForm.reset();
      this.toastMessage.set(`Producto "${producto.nombre}" guardado en local.`);
      this.toastOpen.set(true);
    } catch (error) {
      console.error('Error al guardar el producto', error);
    } finally {
      this.productoForm.enable();
      this.isSubmitting.set(false);
    }
  }
}