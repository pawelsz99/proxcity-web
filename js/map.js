class GameMap {
  constructor(containerId) {
    this.containerId = containerId;
    this.map = null;
    this.markers = [];
    this.polylineLayers = [];
  }

  init() {
    const container = document.getElementById(this.containerId);
    if (!container) return;

    const placeholder = container.querySelector('.map-placeholder');
    if (placeholder) placeholder.style.display = 'none';

    this.map = new maplibregl.Map({
      container: this.containerId,
      style: 'https://tiles.openfreemap.org/styles/dark',
      center: [0, 20],
      zoom: 1.5,
      attributionControl: false,
    });
    this.map.addControl(new maplibregl.NavigationControl(), 'bottom-right');
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

    this.addPolyline(questionCity, optionA);
    this.addPolyline(questionCity, optionB);

    const bounds = [
      [questionCity.longitude, questionCity.latitude],
      [optionA.longitude, optionA.latitude],
      [optionB.longitude, optionB.latitude],
    ];
    this.map.fitBounds(bounds, { padding: 100, duration: 800 });
  }

  addPolyline(city1, city2) {
    const id = 'pline-' + city1.id + '-' + city2.id;
    this.map.addSource(id, {
      type: 'geojson',
      data: {
        type: 'Feature',
        geometry: {
          type: 'LineString',
          coordinates: [[city1.longitude, city1.latitude], [city2.longitude, city2.latitude]],
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
