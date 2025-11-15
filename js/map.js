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

  // Disable user zoom controls: prevent scroll-wheel, double-click, touch-pinch zooming.
  // We intentionally do NOT add the NavigationControl (zoom buttons) so users cannot change zoom.
  try {
    map.scrollZoom.disable();
    map.doubleClickZoom.disable();
    // touchZoomRotate exists in newer mapbox-gl versions and covers touch gestures
    if (map.touchZoomRotate && typeof map.touchZoomRotate.disable === 'function') {
      map.touchZoomRotate.disable();
    }
    // also disable box zoom to avoid accidental zooming
    if (map.boxZoom && typeof map.boxZoom.disable === 'function') map.boxZoom.disable();
    if (map.keyboard && typeof map.keyboard.disable === 'function') map.keyboard.disable();
  } catch (e) {
    // ignore if any control is not present
  }

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

        // Click behavior: notify caller and zoom to the clicked feature's bounds.
        map.on('click', 'transit-index-fill', (e) => {
          if (!e.features || !e.features.length) return;
          const feat = e.features[0];

          // Compute tight bounding box for the feature geometry (supports Polygon and MultiPolygon)
          function featureBBox(f) {
            const geom = f.geometry || {};
            const coords = geom.coordinates || [];
            let minX = Infinity;
            let minY = Infinity;
            let maxX = -Infinity;
            let maxY = -Infinity;

            function scan(arr) {
              // arr may be nested arrays (for polygons/multipolygons)
              for (const el of arr) {
                if (!el) continue;
                if (typeof el[0] === 'number' && typeof el[1] === 'number') {
                  const x = el[0];
                  const y = el[1];
                  if (x < minX) minX = x;
                  if (y < minY) minY = y;
                  if (x > maxX) maxX = x;
                  if (y > maxY) maxY = y;
                } else if (Array.isArray(el)) {
                  scan(el);
                }
              }
            }

            scan(coords);
            // fallback to feature center if bbox is invalid
            if (!isFinite(minX) || !isFinite(minY) || !isFinite(maxX) || !isFinite(maxY)) {
              const center = f.bbox && f.bbox.length === 4 ? [(f.bbox[0] + f.bbox[2]) / 2, (f.bbox[1] + f.bbox[3]) / 2] : null;
              if (center) return [[center[0] - 0.01, center[1] - 0.01], [center[0] + 0.01, center[1] + 0.01]];
              return null;
            }
            return [[minX, minY], [maxX, maxY]];
          }

          const bbox = featureBBox(feat);
          if (bbox) {
            // Fit bounds with padding. Limit maxZoom to avoid over-zooming on tiny polygons.
            map.fitBounds(bbox, { padding: 20, maxZoom: 14, duration: 700 });
          }

          if (typeof onFeatureClick === 'function') onFeatureClick(feat);
        });

        // If user clicks elsewhere, reset charts (send null)
        map.on('click', (e) => {
          const feats = map.queryRenderedFeatures(e.point, { layers: ['transit-index-fill'] });
          if (!feats || feats.length === 0) {
            if (typeof onFeatureClick === 'function') onFeatureClick(null);
            // Reset view to the initial center/zoom when clicking empty space
            try {
              map.easeTo({ center, zoom, duration: 700 });
            } catch (err) {
              // ignore
            }
          }
        });
      })
      .catch((err) => console.error('Failed to load GeoJSON:', err));
  });

  return map;
}

export {initMap};
