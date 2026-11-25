import { formatDate, formatDuration, formatKm } from './format';

describe('format helpers', () => {
  it('formats durations for humans', () => {
    expect(formatDuration(42)).toBe('42 s');
    expect(formatDuration(725)).toBe('12 min 05 s');
    expect(formatDuration(3725)).toBe('1 h 02 min');
    expect(formatDuration(-5)).toBe('0 s');
  });

  it('formats distances with one decimal', () => {
    expect(formatKm(12)).toMatch(/^12[,.]0 km$/);
  });

  it('ignores invalid dates', () => {
    expect(formatDate('no-es-fecha')).toBe('');
    expect(formatDate('2026-11-24T10:00:00Z')).toContain('2026');
  });
});
