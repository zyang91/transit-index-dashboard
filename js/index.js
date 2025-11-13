// Entry module: import the map initializer and call it once the DOM is ready.
import { initMap } from './map.js';

function start() {
  // Initialize the map with defaults (reads token from window.MAPBOX_TOKEN)
  initMap();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', start);
} else {
  start();
}
