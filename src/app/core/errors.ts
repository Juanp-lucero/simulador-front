import { HttpErrorResponse } from '@angular/common/http';

export function errorMessage(error: unknown): string {
  if (!(error instanceof HttpErrorResponse)) return 'No se pudo completar la operación.';
  if (error.status === 0) return 'No hay conexión con la API. Verifica la URL del backend y CORS.';
  const detail = error.error?.detail;
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) {
    return detail.map(item => {
      const location = Array.isArray(item?.loc) ? item.loc.filter((part: unknown) => part !== 'body').join('.') : '';
      return `${location}: ${typeof item?.msg === 'string' ? item.msg : 'Valor inválido'}`;
    }).join(' · ');
  }
  return `La API respondió con un error (${error.status}).`;
}
