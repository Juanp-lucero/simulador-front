import { AfterViewInit, Component, ElementRef, Input, OnChanges, OnDestroy, ViewChild } from '@angular/core';
import { BarController, BarElement, CategoryScale, Chart, LinearScale, Tooltip } from 'chart.js';
import { AircraftState } from '../core/contracts';

Chart.register(BarController, BarElement, CategoryScale, LinearScale, Tooltip);

@Component({ selector: 'app-altitude-chart', template: `<div class="chart-container"><canvas #canvas role="img" aria-label="Altitud calculada por aeronave, en metros"></canvas></div>` })
export class AltitudeChart implements AfterViewInit, OnChanges, OnDestroy {
  @Input() states: AircraftState[] = [];
  @ViewChild('canvas', { static: true }) canvas!: ElementRef<HTMLCanvasElement>;
  private chart?: Chart<'bar'>;
  ngAfterViewInit() {
    this.chart = new Chart(this.canvas.nativeElement, {
      type: 'bar',
      data: { labels: [], datasets: [{ label: 'Altitud (m)', data: [], backgroundColor: '#29ceb5', borderRadius: 4, maxBarThickness: 35 }] },
      options: { responsive: true, maintainAspectRatio: false, animation: false,
        scales: { x: { ticks: { color: '#9aadc5' }, grid: { display: false } }, y: { beginAtZero: true, ticks: { color: '#9aadc5' }, grid: { color: '#243347' } } },
        plugins: { legend: { display: false } },
      },
    });
    this.update();
  }
  ngOnChanges() { this.update(); }
  private update() {
    if (!this.chart) return;
    this.chart.data.labels = this.states.map(state => state.registration);
    this.chart.data.datasets[0].data = this.states.map(state => state.altitude_m);
    this.chart.update('none');
  }
  ngOnDestroy() { this.chart?.destroy(); }
}
