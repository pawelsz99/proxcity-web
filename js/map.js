class GameMap {
  constructor(containerId) {
    this.containerId = containerId;
    this.map = null;
    this.markers = [];
    this.polylineLayers = [];
    this.questionCity = null;
  }

  init() {
    const container = document.getElementById(this.containerId);
    if (!container) return;

    const placeholder = container.querySelector('.map-placeholder');
    if (placeholder) placeholder.style.display = 'none';

    this.showOverlay('loading', 'Loading map...');

    this.map = new maplibregl.Map({
      container: this.containerId,
      style: 'https://tiles.openfreemap.org/styles/dark',
      center: [0, 20],
      zoom: 1.5,
      attributionControl: false,
    });
    this.map.addControl(new maplibregl.NavigationControl(), 'bottom-right');

    this.map.on('load', () => this.removeOverlay('loading'));
    this.map.on('error', (e) => {
      console.error('Map error:', e.error?.message || e);
      this.showOverlay('error', 'Map unavailable', 'Game continues without map');
    });
    this.map.on('style.load', () => this.removeOverlay('loading'));
  }

  geodesicRoute(lng1, lat1, lng2, lat2, steps) {
    steps = steps || 64;
    const coords = [];
    const d = 1.0 / steps;
    const f = [lat1 * Math.PI / 180, lng1 * Math.PI / 180];
    const t = [lat2 * Math.PI / 180, lng2 * Math.PI / 180];

    const cosφ1 = Math.cos(f[0]), sinφ1 = Math.sin(f[0]);
    const cosφ2 = Math.cos(t[0]), sinφ2 = Math.sin(t[0]);
    const Δλ = t[1] - f[1];
    const cosΔλ = Math.cos(Δλ), sinΔλ = Math.sin(Δλ);

    const x = Math.sqrt((cosφ2 * sinΔλ) ** 2 + (cosφ1 * sinφ2 - sinφ1 * cosφ2 * cosΔλ) ** 2);
    const y = sinφ1 * sinφ2 + cosφ1 * cosφ2 * cosΔλ;
    const δ = Math.atan2(x, y);

    for (let i = 0; i <= steps; i++) {
      const frac = i * d;
      const A = Math.sin((1 - frac) * δ) / Math.sin(δ);
      const B = Math.sin(frac * δ) / Math.sin(δ);
      const x = A * cosφ1 * Math.cos(f[1]) + B * cosφ2 * Math.cos(t[1]);
      const y = A * cosφ1 * Math.sin(f[1]) + B * cosφ2 * Math.sin(t[1]);
      const z = A * sinφ1 + B * sinφ2;
      const lat = Math.atan2(z, Math.sqrt(x * x + y * y)) * 180 / Math.PI;
      const lng = Math.atan2(y, x) * 180 / Math.PI;
      coords.push([lng, lat]);
    }
    return coords;
  }

  showOverlay(type, title, sub) {
    const container = document.getElementById(this.containerId);
    if (!container) return;
    this.removeOverlay(type);
    const overlay = document.createElement('div');
    overlay.className = 'map-overlay map-overlay-' + type;
    overlay.id = 'map-overlay-' + type;
    if (type === 'loading') {
      overlay.innerHTML = '<div class="spinner"></div><p>' + title + '</p>';
    } else {
      overlay.innerHTML = '<p>' + title + '</p>' + (sub ? '<p class="map-overlay-sub">' + sub + '</p>' : '');
    }
    container.appendChild(overlay);
  }

  removeOverlay(type) {
    const el = document.getElementById('map-overlay-' + type);
    if (el) el.remove();
  }

  createMarker(color, lngLat, size, onClick) {
    const el = document.createElement('div');
    el.style.width = size + 'px';
    el.style.height = size + 'px';
    el.style.borderRadius = '50%';
    el.style.background = color;
    el.style.border = '3px solid white';
    el.style.boxShadow = '0 0 4px rgba(0,0,0,0.5)';
    el.style.cursor = 'pointer';
    if (onClick) el.addEventListener('click', onClick);
    const marker = new maplibregl.Marker({ element: el })
      .setLngLat(lngLat)
      .addTo(this.map);
    this.markers.push(marker);
    return marker;
  }

  showQuestion(city) {
    this.clear();
    this.questionCity = city;
    this.createMarker('#5B9DFF', [city.longitude, city.latitude], 18);
    this.map.flyTo({ center: [city.longitude, city.latitude], zoom: 4, duration: 1000 });
  }

  showReveal(questionCity, optionA, optionB, correctCity) {
    this.clear();
    this.questionCity = questionCity;

    this.createMarker('#5B9DFF', [questionCity.longitude, questionCity.latitude], 18);

    const aColor = optionA.id === correctCity.id ? '#52C697' : '#E83634';
    const bColor = optionB.id === correctCity.id ? '#52C697' : '#E83634';
    this.createMarker(aColor, [optionA.longitude, optionA.latitude], 14, () => this.zoomToCity(questionCity, optionA));
    this.createMarker(bColor, [optionB.longitude, optionB.latitude], 14, () => this.zoomToCity(questionCity, optionB));

    this.addGeodesicPolyline(questionCity, optionA);
    this.addGeodesicPolyline(questionCity, optionB);

    const bounds = [
      [questionCity.longitude, questionCity.latitude],
      [optionA.longitude, optionA.latitude],
      [optionB.longitude, optionB.latitude],
    ];
    this.map.fitBounds(bounds, { padding: 100, duration: 800 });
  }

  addGeodesicPolyline(city1, city2) {
    const id = 'pline-' + city1.id + '-' + city2.id;
    const coords = this.geodesicRoute(city1.longitude, city1.latitude, city2.longitude, city2.latitude, 64);
    this.map.addSource(id, {
      type: 'geojson',
      data: {
        type: 'Feature',
        geometry: {
          type: 'LineString',
          coordinates: coords,
        },
      },
    });
    this.map.addLayer({
      id: id + '-layer',
      type: 'line',
      source: id,
      paint: {
        'line-color': 'rgb(217, 217, 217)',
        'line-width': 3,
        'line-dasharray': [4, 3],
        'line-opacity': 0.7,
      },
    });
    this.polylineLayers.push(id);
  }

  zoomToCity(city1, city2) {
    const bounds = [[city1.longitude, city1.latitude], [city2.longitude, city2.latitude]];
    this.map.fitBounds(bounds, { padding: 100, duration: 600 });
  }

  switchTheme(theme) {
    const styleUrl = theme === 'light'
      ? 'https://tiles.openfreemap.org/styles/liberty'
      : 'https://tiles.openfreemap.org/styles/dark';
    this.map.setStyle(styleUrl);
  }

  clear() {
    this.markers.forEach(m => m.remove());
    this.markers = [];

    this.polylineLayers.forEach(id => {
      const layerId = id + '-layer';
      if (this.map.getLayer(layerId)) this.map.removeLayer(layerId);
      if (this.map.getSource(id)) this.map.removeSource(id);
    });
    this.polylineLayers = [];
  }
}
