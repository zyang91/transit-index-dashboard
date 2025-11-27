let googleLoaderPromise = null;

const PUBLIC_GOOGLE_MAPS_KEY = 'AIzaSyC7Tu9W6-BUZzBz-EzpKoNjZeWNc_X7Xd0A';

function resolveApiKey(explicitKey) {
	return explicitKey || PUBLIC_GOOGLE_MAPS_KEY;
}

function loadGooglePlaces(explicitKey) {
	const apiKey = resolveApiKey(explicitKey);
    
	if (googleLoaderPromise) return googleLoaderPromise;

	googleLoaderPromise = new Promise((resolve, reject) => {
		const existing = document.querySelector('script[data-google-maps="true"]');
		if (existing) {
			existing.addEventListener('load', () => resolve(window.google));
			existing.addEventListener('error', reject);
			return;
		}

		const script = document.createElement('script');
		script.type = 'text/javascript';
		script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
		script.async = true;
		script.defer = true;
		script.dataset.googleMaps = 'true';
		script.addEventListener('load', () => {
			if (window.google && window.google.maps && window.google.maps.places) {
				resolve(window.google);
			} else {
				reject(new Error('Google Maps script loaded but Places library unavailable.'));
			}
		});
		script.addEventListener('error', () => reject(new Error('Failed to load Google Maps script.')));
		document.head.appendChild(script);
	});

	return googleLoaderPromise;
}

function markInputError(input) {
	if (!input) return;
	input.classList.add('input-error');
	setTimeout(() => input.classList.remove('input-error'), 1600);
}

export async function initGeolocate(options = {}) {
	const {
		inputSelector = '#address-search',
		map = null,
		apiKey = PUBLIC_GOOGLE_MAPS_KEY,
		flyToOptions = {},
		onPlaceResolved = null,
	} = options;

	const input = document.querySelector(inputSelector);
	if (!input) {
		console.warn('initGeolocate: input element not found');
		return null;
	}

	let google;
	try {
		google = await loadGooglePlaces(apiKey);
	} catch (err) {
		console.error(err);
		markInputError(input);
		return null;
	}

	const autocomplete = new google.maps.places.Autocomplete(input, {
		types: ['address'],
		fields: ['geometry', 'formatted_address', 'address_components'],
		componentRestrictions: { country: 'us' },
	});

	let marker = null;
	if (map && window.mapboxgl) {
		marker = new window.mapboxgl.Marker({ color: '#0f5132' });
	}

	autocomplete.addListener('place_changed', () => {
		const place = autocomplete.getPlace();
		if (!place || !place.geometry || !place.geometry.location) {
			markInputError(input);
			return;
		}

		const lat = place.geometry.location.lat();
		const lng = place.geometry.location.lng();

		if (marker && typeof marker.setLngLat === 'function') {
			marker.setLngLat([lng, lat]).addTo(map);
		}

		if (map && typeof map.flyTo === 'function') {
			map.flyTo({
				center: [lng, lat],
				zoom: flyToOptions.zoom || 13,
				pitch: flyToOptions.pitch || 0,
				bearing: flyToOptions.bearing || 0,
				essential: true,
			});
		}

		if (typeof onPlaceResolved === 'function') {
			onPlaceResolved({ place, latitude: lat, longitude: lng });
		}
	});

	return { autocomplete };
}
