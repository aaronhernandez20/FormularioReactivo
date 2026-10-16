import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  dark = false;

  constructor() {
    const guardado = localStorage.getItem('dark');
    this.dark = guardado !== null
      ? guardado === 'true'
      : window.matchMedia('(prefers-color-scheme: dark)').matches;
    this.aplicar();
  }

  toggle(): void {
    this.dark = !this.dark;
    localStorage.setItem('dark', String(this.dark));
    this.aplicar();
  }

  private aplicar(): void {
    document.documentElement.classList.toggle('ion-palette-dark', this.dark);
  }
}