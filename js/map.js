/* global mapboxgl */
function initMap(options = {}) {
  const container = options.container || 'map';
  const style = options.style || 'mapbox://styles/mapbox/streets-v12';
  const center = options.center || [-75.1652, 39.9526];
  const zoom = options.zoom || 10;
  const geojsonUrl = options.geojsonUrl || 'data/phila_transit_index.geojson';
  const colorProperty = options.colorProperty || 'color';
  const onFeatureClick = options.onFeatureClick || null; // callback(feature) or callback(null) to reset

  // Expect token to be set on window.MAPBOX_TOKEN (index.html).
  mapboxgl.accessToken = 'pk.eyJ1IjoiemhhbmNoYW8iLCJhIjoiY21nYm1mOGNpMTlycTJtb2xuczUwdjY1aCJ9.KRjlJ3Siuf2p0OKSsngcGw';

  const map = new mapboxgl.Map({ container, style, center, zoom });
  map.addControl(new mapboxgl.NavigationControl());

  map.on('load', () => {
    // Fetch and add GeoJSON from the data folder
    fetch(geojsonUrl)
      .then((r) => r.json())
      .then((data) => {
        map.addSource('transit-index', { type: 'geojson', data });

        map.addLayer({
          id: 'transit-index-fill',
          type: 'fill',
          source: 'transit-index',
          paint: {
            // use feature property directly as a color string
            'fill-color': ['coalesce', ['get', colorProperty], '#888888'],
            'fill-opacity': 0.7,
          },
        });

        map.addLayer({
          id: 'transit-index-line',
          type: 'line',
          source: 'transit-index',
          paint: { 'line-color': '#ffffff', 'line-width': 1 },
        });


        const hoverPopup = new mapboxgl.Popup({ closeButton: false, closeOnClick: false });

        // Show popup on mousemove over the fill layer
        map.on('mousemove', 'transit-index-fill', (e) => {
          map.getCanvas().style.cursor = 'pointer';
          if (!e.features || !e.features.length) return;
          const feat = e.features[0];
          // Only show Name and Total (total residents) in the popup
          const props = feat.properties || {};
          // Try common key variants for name and total
          const name = props.Name || props.name || props.NAME || 'Unknown';
          const total = (props.Total !== undefined && props.Total !== null)
            ? props.Total
            : (props.total !== undefined && props.total !== null ? props.total : 'N/A');
          const html = `<div style="font-size:13px; line-height:1.2;"><strong>${name}</strong><br/>Total Residents: ${total}</div>`;
          hoverPopup.setLngLat(e.lngLat).setHTML(html).addTo(map);
        });

        // Hide popup and reset cursor when leaving the layer
        map.on('mouseleave', 'transit-index-fill', () => {
          hoverPopup.remove();
          map.getCanvas().style.cursor = '';
        });

        // Click behavior: notify caller with the clicked feature (or null if click on empty space)
        map.on('click', 'transit-index-fill', (e) => {
          if (!e.features || !e.features.length) return;
          const feat = e.features[0];
          if (typeof onFeatureClick === 'function') onFeatureClick(feat);
        });

        // If user clicks elsewhere, reset charts (send null)
        map.on('click', (e) => {
          const feats = map.queryRenderedFeatures(e.point, { layers: ['transit-index-fill'] });
          if (!feats || feats.length === 0) {
            if (typeof onFeatureClick === 'function') onFeatureClick(null);
          }
        });
      })
      .catch((err) => console.error('Failed to load GeoJSON:', err));
  });

  return map;
}

export {initMap};
