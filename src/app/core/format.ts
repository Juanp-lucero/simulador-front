/** Display helpers shared by pages. Values come from the API in SI units. */

/** `3725` seconds -> `1 h 02 min`; under an hour -> `12 min 05 s`. */
export function formatDuration(seconds: number): string {
  const total = Math.max(0, Math.round(seconds));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const rest = total % 60;
  if (hours) return `${hours} h ${String(minutes).padStart(2, '0')} min`;
  if (minutes) return `${minutes} min ${String(rest).padStart(2, '0')} s`;
  return `${rest} s`;
}

/** Kilometres with one decimal and the Spanish decimal comma. */
export function formatKm(km: number): string {
  return `${km.toLocaleString('es-CO', { maximumFractionDigits: 1, minimumFractionDigits: 1 })} km`;
}

/** ISO date from the API -> `24 nov 2026, 23:40` in the user's time zone. */
export function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString('es-CO', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}
