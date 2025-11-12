// Exported Mapbox initializer.
// Usage: import { initMap } from './map.js';
// Calls initMap() to create and return a Mapbox GL map instance.

// Minimal initializer: assumes token is in window.MAPBOX_TOKEN
// and GeoJSON is located at data/choropleth.geojson by default.
function initMap(options = {}) {
	const container = options.container || 'map';
	const style = options.style || 'mapbox://styles/mapbox/streets-v12';
	const center = options.center || [-75.1652, 39.9526];
	const zoom = options.zoom || 10;
	const geojsonUrl = options.geojsonUrl || 'data/phila_transit_index.geojson';
	const colorProperty = options.colorProperty || 'color';

	// Expect token to be set on window.MAPBOX_TOKEN (index.html).
	mapboxgl.accessToken = "pk.eyJ1IjoiemhhbmNoYW8iLCJhIjoiY21nYm1mOGNpMTlycTJtb2xuczUwdjY1aCJ9.KRjlJ3Siuf2p0OKSsngcGw";

	const map = new mapboxgl.Map({ container, style, center, zoom });
	map.addControl(new mapboxgl.NavigationControl());

	map.on('load', () => {
		// Fetch and add GeoJSON from the data folder
		fetch(geojsonUrl)
			.then(r => r.json())
			.then(data => {
				map.addSource('transit-index', { type: 'geojson', data });

				map.addLayer({
					id: 'transit-index-fill',
					type: 'fill',
					source: 'transit-index',
					paint: {
						// use feature property directly as a color string
						'fill-color': ['coalesce', ['get', colorProperty], '#888888'],
						'fill-opacity': 0.7
					}
				});

				map.addLayer({
					id: 'transit-index-line',
					type: 'line',
					source: 'transit-index',
					paint: { 'line-color': '#ffffff', 'line-width': 1 }
				});
			})
			.catch(err => console.error('Failed to load GeoJSON:', err));
	});

	return map;
}

export {initMap};