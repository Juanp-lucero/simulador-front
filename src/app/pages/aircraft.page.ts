import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { ApiService } from '../core/api.service';
import { Aircraft } from '../core/contracts';
import { errorMessage } from '../core/errors';

@Component({
  selector: 'app-aircraft', imports: [ReactiveFormsModule],
  template: `
    <section class="page">
      <div class="page-heading"><div><div class="eyebrow">GESTIÓN DE FLOTA</div><h1>Aeronaves</h1><p>Tu flota, con parámetros explícitos y unidades consistentes.</p></div><span class="tag">VELOCIDAD: m/s · ALTITUD: m</span></div>
      @if (error()) { <div role="alert" class="error-box">{{ error() }}</div> }
      @if (message()) { <div role="status" class="success-box">{{ message() }}</div> }
      <div class="resource-grid">
        <article class="panel"><div class="panel-heading"><h2>{{ editingId() ? 'Editar aeronave' : 'Nueva aeronave' }}</h2><span>✈</span></div>
          <form [formGroup]="form" (ngSubmit)="save()">
            <label>Matrícula<input formControlName="registration" placeholder="HK-1234" maxlength="15"></label>
            <label>Modelo<input formControlName="model_name" placeholder="Cessna 172" maxlength="100"></label>
            <div class="form-two"><label>Crucero (m/s)<input type="number" formControlName="cruise_speed_mps" min="0.1" max="400" step="0.1"></label><label>Altitud máx. (m)<input type="number" formControlName="max_altitude_m" min="1" max="20000" step="1"></label></div>
            <p class="field-hint">La velocidad se usa como referencia de la aeronave. Cada tramo de ruta define su propia velocidad sobre el suelo.</p>
            <div class="flex gap-3"><button class="button primary" [disabled]="busy()" type="submit">{{ busy() ? 'Guardando…' : editingId() ? 'Guardar cambios' : 'Crear aeronave' }}</button>@if (editingId()) { <button class="button secondary" type="button" (click)="reset()">Cancelar</button> }</div>
          </form>
        </article>
        <article class="panel"><div class="panel-heading"><h2>Tu flota</h2><span class="tag">{{ items().length }} REGISTROS</span></div>
          @if (loading()) { <p class="muted">Cargando…</p> }
          @for (item of items(); track item.id) {
            <div class="aircraft-row"><span class="aircraft-symbol">✈</span><div class="grow"><strong>{{ item.registration }}</strong><small>{{ item.model_name }} · {{ item.cruise_speed_mps }} m/s · {{ item.max_altitude_m }} m</small></div><button class="text-button" (click)="edit(item)">Editar</button><button class="text-button danger" [disabled]="busy()" (click)="remove(item)">Eliminar</button></div>
          } @empty { @if (!loading()) { <div class="empty-state"><span>✈</span><h3>No hay aeronaves aún</h3><p>Registra la primera usando el formulario.</p></div> } }
        </article>
      </div>
    </section>
  `
})
export class AircraftPage implements OnInit {
  private readonly api = inject(ApiService);
  private readonly fb = inject(FormBuilder);
  readonly items = signal<Aircraft[]>([]);
  readonly editingId = signal<number | null>(null);
  readonly error = signal(''); readonly message = signal('');
  readonly busy = signal(false); readonly loading = signal(true);
  readonly form = this.fb.nonNullable.group({
    registration: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(15), Validators.pattern(/^[a-zA-Z0-9][a-zA-Z0-9-]+$/)]],
    model_name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
    cruise_speed_mps: [60, [Validators.required, Validators.min(0.1), Validators.max(400)]],
    max_altitude_m: [4000, [Validators.required, Validators.min(1), Validators.max(20000)]],
  });
  async ngOnInit() { await this.load(); }
  async load() {
    try { this.items.set(await firstValueFrom(this.api.aircraft())); }
    catch (error) { this.error.set(errorMessage(error)); }
    finally { this.loading.set(false); }
  }
  edit(item: Aircraft) { this.editingId.set(item.id); this.form.patchValue(item); this.message.set(''); this.error.set(''); }
  reset() { this.editingId.set(null); this.form.reset({ registration: '', model_name: '', cruise_speed_mps: 60, max_altitude_m: 4000 }); }
  async save() {
    if (this.form.invalid) { this.form.markAllAsTouched(); this.error.set('Revisa matrícula, modelo y rangos numéricos.'); return; }
    this.busy.set(true); this.error.set(''); this.message.set('');
    try {
      const id = this.editingId();
      await firstValueFrom(id ? this.api.updateAircraft(id, this.form.getRawValue()) : this.api.createAircraft(this.form.getRawValue()));
      this.reset(); this.message.set('Aeronave guardada.'); await this.load();
    } catch (error) { this.error.set(errorMessage(error)); }
    finally { this.busy.set(false); }
  }
  async remove(item: Aircraft) {
    if (!confirm(`¿Eliminar ${item.registration}? Sus rutas quedarán sin aeronave asignada.`)) return;
    this.busy.set(true); this.error.set('');
    try { await firstValueFrom(this.api.deleteAircraft(item.id)); if (this.editingId() === item.id) this.reset(); await this.load(); }
    catch (error) { this.error.set(errorMessage(error)); }
    finally { this.busy.set(false); }
  }
}
