import { AfterViewInit, Component, ElementRef, Input, OnChanges, OnDestroy, ViewChild } from '@angular/core';
import * as L from 'leaflet';
import { AircraftState, FlightRoute } from '../core/contracts';

@Component({ selector: 'app-flight-map', template: `<div #host class="flight-map" role="img" aria-label="Mapa de rutas y posiciones calculadas"></div>` })
export class FlightMap implements AfterViewInit, OnChanges, OnDestroy {
  @ViewChild('host', { static: true }) private host!: ElementRef<HTMLDivElement>;
  @Input() routes: FlightRoute[] = [];
  @Input() states: AircraftState[] = [];
  private map?: L.Map;
  private routeLayers?: L.LayerGroup;
  private stateLayers?: L.LayerGroup;
  ngAfterViewInit() {
    this.map = L.map(this.host.nativeElement, { zoomControl: true }).setView([4.7, -74.15], 5);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(this.map);
    this.routeLayers = L.layerGroup().addTo(this.map);
    this.stateLayers = L.layerGroup().addTo(this.map);
    this.drawRoutes(); this.drawStates();
  }
  ngOnChanges(changes: { [key: string]: unknown }) {
    if (changes['routes']) this.drawRoutes();
    if (changes['states']) this.drawStates();
  }
  private drawRoutes() {
    if (!this.map || !this.routeLayers) return;
    this.routeLayers.clearLayers();
    const bounds: L.LatLngTuple[] = [];
    for (const route of this.routes) {
      const points: L.LatLngTuple[] = [];
      for (const point of route.waypoints) {
        let longitude = point.longitude_deg;
        const previous = points.at(-1)?.[1] ?? longitude;
        while (longitude - previous > 180) longitude -= 360;
        while (longitude - previous < -180) longitude += 360;
        points.push([point.latitude_deg, longitude]);
      }
      bounds.push(...points);
      L.polyline(points, { color: '#087e8b', weight: 3, dashArray: '8 6' }).addTo(this.routeLayers);
      points.forEach((position, index) => {
        const label = document.createElement('span'); label.textContent = `${route.name} · WP ${index + 1}`;
        L.circleMarker(position, { radius: 4, color: '#087e8b', fillOpacity: 1 }).bindTooltip(label).addTo(this.routeLayers!);
      });
    }
    if (bounds.length) this.map.fitBounds(L.latLngBounds(bounds), { padding: [35, 35], maxZoom: 12 });
  }
  private drawStates() {
    if (!this.stateLayers) return;
    this.stateLayers.clearLayers();
    for (const state of this.states) {
      const iconElement = document.createElement('div');
      iconElement.className = 'plane-marker';
      const arrow = document.createElement('span'); arrow.textContent = '▲';
      arrow.style.transform = `rotate(${state.heading_deg}deg)`; iconElement.append(arrow);
      const label = document.createElement('span');
      label.textContent = `${state.registration} · ${Math.round(state.altitude_m)} m`;
      let longitude = state.longitude_deg;
      const reference = this.map?.getCenter().lng ?? longitude;
      while (longitude - reference > 180) longitude -= 360;
      while (longitude - reference < -180) longitude += 360;
      L.marker([state.latitude_deg, longitude], {
        icon: L.divIcon({ html: iconElement, className: '', iconSize: [34, 34], iconAnchor: [17, 17] }),
      }).bindTooltip(label, { direction: 'top', offset: [0, -17] }).addTo(this.stateLayers);
    }
  }
  ngOnDestroy() { this.map?.remove(); }
}
