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
  IonButtons,
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
import { jsPDF } from 'jspdf';
import { ThemeService } from '../theme.service';

interface ProductoEnviado {
  sku: string;
  nombre: string;
  categoria: string;
  stockMinimo: string;
  fechaNacimiento: string;
}

// Fecha de hoy en local (YYYY-MM-DD)
function hoyISO(): string {
  const d = new Date();
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const dia = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mes}-${dia}`;
}

// SKU: exactamente 12 caracteres alfanuméricos
function skuValido(control: AbstractControl): ValidationErrors | null {
  const valor = control.value ?? '';
  if (!valor) return null;
  return /^[A-Za-z0-9]{12}$/.test(valor) ? null : { skuInvalido: true };
}

// Stock mínimo: entero mayor que 0
function stockMayorQueCero(control: AbstractControl): ValidationErrors | null {
  const valor = control.value;
  if (valor === null || valor === '') return null;
  const numero = Number(valor);
  return Number.isInteger(numero) && numero > 0 ? null : { stockInvalido: true };
}

// Fecha de nacimiento: no puede ser posterior a hoy
function fechaNoFutura(control: AbstractControl): ValidationErrors | null {
  if (!control.value) return null;
  return control.value > hoyISO() ? { fechaFutura: true } : null;
}

@Component({
  selector: 'app-registro',
  templateUrl: 'registro.page.html',
  styleUrls: ['registro.page.scss'],
  imports: [
    ReactiveFormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
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
export class RegistroPage {
  private fb = inject(FormBuilder);
  theme = inject(ThemeService);

  isSubmitting = signal(false);
  toastOpen = signal(false);
  toastMessage = signal('');
  ultimoEnvio = signal<ProductoEnviado | null>(null);

  categorias = ['Electrónica', 'Herramientas', 'Consumibles'];
  hoy = hoyISO();

  productoForm = this.fb.group({
    sku: ['', [Validators.required, skuValido]],
    nombre: ['', [Validators.required]],
    categoria: ['', [Validators.required]],
    stockMinimo: ['', [Validators.required, stockMayorQueCero]],
    fechaNacimiento: ['', [Validators.required, fechaNoFutura]],
    password: ['', [
      Validators.required,
      // Mínimo 8 caracteres, al menos una letra y un número
      Validators.pattern(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/)
    ]]
  });

  // Hash SHA-256 de la contraseña, en hexadecimal (64 caracteres)
  private async cifrarPassword(password: string): Promise<string> {
    const datos = new TextEncoder().encode(password);
    const hash = await crypto.subtle.digest('SHA-256', datos);
    return Array.from(new Uint8Array(hash))
      .map(byte => byte.toString(16).padStart(2, '0'))
      .join('');
  }

  async onSubmit(): Promise<void> {
    if (this.productoForm.invalid) {
      this.productoForm.markAllAsTouched();
      return;
    }

    const valores = this.productoForm.getRawValue();
    const producto: ProductoEnviado = {
      sku: valores.sku ?? '',
      nombre: valores.nombre ?? '',
      categoria: valores.categoria ?? '',
      stockMinimo: String(valores.stockMinimo ?? ''),
      fechaNacimiento: valores.fechaNacimiento ?? ''
    };

    this.isSubmitting.set(true);
    this.productoForm.disable();

    try {
      const passwordCifrada = await this.cifrarPassword(valores.password ?? '');

      // La contraseña en claro nunca llega a la consola
      console.log('Payload a enviar:', { ...producto, password: passwordCifrada });

      await new Promise(resolve => setTimeout(resolve, 2000));

      this.ultimoEnvio.set(producto);
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

  descargarPdf(): void {
    const p = this.ultimoEnvio();
    if (!p) return;

    // 2026-10-16 -> 16/10/2026
    const [anio, mes, dia] = p.fechaNacimiento.split('-');
    const fecha = `${dia}/${mes}/${anio}`;

    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('Datos del formulario enviado', 20, 25);

    doc.setFontSize(12);
    doc.text(`Código de barras (SKU): ${p.sku}`, 20, 45);
    doc.text(`Nombre del producto: ${p.nombre}`, 20, 55);
    doc.text(`Categoría: ${p.categoria}`, 20, 65);
    doc.text(`Stock mínimo: ${p.stockMinimo}`, 20, 75);
    doc.text(`Fecha de nacimiento: ${fecha}`, 20, 85);

    doc.setFontSize(10);
    doc.text(`Generado el ${new Date().toLocaleString('es-ES')}`, 20, 105);

    doc.save(`producto-${p.sku}.pdf`);
  }
}