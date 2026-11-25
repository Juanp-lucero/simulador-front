import { HttpErrorResponse } from '@angular/common/http';
import { aiErrorMessage, errorMessage } from './errors';

describe('error messages', () => {
  it('distinguishes a missing AI key from a provider failure', () => {
    expect(aiErrorMessage(new HttpErrorResponse({ status: 503 }))).toContain('no está configurada');
    expect(aiErrorMessage(new HttpErrorResponse({ status: 502 }))).toContain('no respondió');
  });

  it('falls back to the generic API messages', () => {
    const offline = new HttpErrorResponse({ status: 0 });
    expect(aiErrorMessage(offline)).toBe(errorMessage(offline));
    expect(aiErrorMessage(new Error('x'))).toBe('No se pudo completar la operación.');
  });

  it('shows the API detail when it is a string', () => {
    expect(errorMessage(new HttpErrorResponse({ status: 404, error: { detail: 'Ruta no encontrada' } })))
      .toBe('Ruta no encontrada');
  });
});
