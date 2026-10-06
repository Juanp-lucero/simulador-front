import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../core/auth.service';
import { errorMessage } from '../core/errors';

@Component({
  selector: 'app-auth', imports: [ReactiveFormsModule],
  template: `
    <div class="auth-layout">
      <section class="auth-story">
        <div class="brand"><span class="brand-icon">A</span><span>AeroMind <b>IA</b><small>FLIGHT SIMULATION</small></span></div>
        <div class="auth-copy"><div class="eyebrow">PLANEA. OBSERVA. SIMULA.</div><h1>El espacio aéreo,<br>en perspectiva.</h1><p>Diseña rutas y explora el movimiento de tus aeronaves en un entorno determinístico.</p><div class="auth-grid"><span>01 <b>Tu flota</b></span><span>02 <b>Tus rutas</b></span><span>03 <b>Tu escenario</b></span></div></div>
        <div class="academic-note">Uso académico · No apto para navegación ni control de tráfico aéreo real.</div>
      </section>
      <section class="auth-panel">
        <div class="auth-card">
          <div class="eyebrow">BIENVENIDO A BORDO</div><h2>{{ registerMode() ? 'Crea tu cuenta' : 'Accede a tu espacio' }}</h2>
          <p class="muted">{{ registerMode() ? 'Empieza con una flota y planes de ruta propios.' : 'Continúa con tus planes de simulación.' }}</p>
          <form [formGroup]="form" (ngSubmit)="submit()">
            <label>Correo electrónico<input type="email" formControlName="email" autocomplete="username" placeholder="piloto@ejemplo.com"></label>
            <label>Contraseña<input type="password" formControlName="password" [attr.autocomplete]="registerMode() ? 'new-password' : 'current-password'" placeholder="Mínimo 8 caracteres"></label>
            @if (error()) { <div class="error-box" role="alert">{{ error() }}</div> }
            <button class="button primary full" type="submit" [disabled]="busy()">{{ busy() ? 'Conectando…' : registerMode() ? 'Crear cuenta' : 'Iniciar sesión' }} <span>→</span></button>
          </form>
          <button class="text-button full" (click)="registerMode.set(!registerMode()); error.set('')">{{ registerMode() ? 'Ya tengo cuenta · Iniciar sesión' : '¿Primera vez? Crear cuenta' }}</button>
          <p class="session-note">El token se mantiene solo en memoria. Al recargar la página debes volver a ingresar.</p>
        </div>
      </section>
    </div>
  `
})
export class AuthPage {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  readonly registerMode = signal(false);
  readonly busy = signal(false);
  readonly error = signal('');
  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(128)]],
  });
  async submit() {
    if (this.form.invalid) { this.form.markAllAsTouched(); this.error.set('Ingresa un correo válido y una contraseña de 8 a 128 caracteres.'); return; }
    this.busy.set(true); this.error.set('');
    const { email, password } = this.form.getRawValue();
    try {
      await firstValueFrom(this.registerMode() ? this.auth.register(email, password) : this.auth.login(email, password));
      this.form.controls.password.reset();
      await this.router.navigateByUrl('/');
    } catch (error) { this.error.set(errorMessage(error)); }
    finally { this.busy.set(false); }
  }
}
