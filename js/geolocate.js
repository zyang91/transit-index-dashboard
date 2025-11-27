const CENSUS_ENDPOINT = 'https://geocoding.geo.census.gov/geocoder/locations/onelineaddress';
const DEFAULT_BENCHMARK = 'PUBLIC_AR_CURRENT';
const SUGGESTION_MIN_CHARS = 3;
const SUGGESTION_LIMIT = 5;
const SUGGESTION_DEBOUNCE_MS = 350;
const CITY_SUFFIX = 'Philadelphia, PA';

function markInputError(input) {
	if (!input) return;
	input.classList.add('input-error');
	setTimeout(() => input.classList.remove('input-error'), 1600);
}

function setStatus(element, message, isError = false) {
	if (!element) return;
	element.textContent = message;
	element.classList.toggle('error', Boolean(isError));
}

let jsonpCounter = 0;

function ensureCityContext(text) {
	if (!text) return CITY_SUFFIX;
	const normalized = text.toLowerCase();
	if (normalized.includes('philadelphia')) return text.trim();
	return `${text.replace(/,+\s*$/, '').trim()}, ${CITY_SUFFIX}`;
}

function censusJsonp(params, signal) {
	if (signal?.aborted) {
		throw new DOMException('Aborted', 'AbortError');
	}

	return new Promise((resolve, reject) => {
		const callbackName = `__censusCallback${Date.now()}_${jsonpCounter++}`;
		const query = new URLSearchParams({ ...params, format: 'jsonp', callback: callbackName });
		const script = document.createElement('script');
		script.src = `${CENSUS_ENDPOINT}?${query.toString()}`;
		script.async = true;

		function cleanup() {
			if (script.parentNode) script.parentNode.removeChild(script);
			delete window[callbackName];
		}

		window[callbackName] = (data) => {
			if (signal?.aborted) {
				cleanup();
				reject(new DOMException('Aborted', 'AbortError'));
				return;
			}
			cleanup();
			resolve(data);
		};

		script.addEventListener('error', () => {
			cleanup();
			reject(new Error('Census JSONP request failed.'));
		});

		if (signal) {
			const abortHandler = () => {
				cleanup();
				reject(new DOMException('Aborted', 'AbortError'));
			};
			signal.addEventListener('abort', abortHandler, { once: true });
		}

		document.head.appendChild(script);
	});
}

async function fetchMatches(address, benchmark = DEFAULT_BENCHMARK, signal) {
	const queryAddress = ensureCityContext(address);
	const data = await censusJsonp({ address: queryAddress, benchmark }, signal);
	return Array.isArray(data?.result?.addressMatches) ? data.result.addressMatches : [];
}

async function geocodeAddress(address, benchmark = DEFAULT_BENCHMARK) {
	const matches = await fetchMatches(address, benchmark);
	const match = matches[0];
	if (!match || !match.coordinates) return null;

	const lat = Number(match.coordinates.y);
	const lng = Number(match.coordinates.x);
	if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

	return {
		latitude: lat,
		longitude: lng,
		matchedAddress: match.matchedAddress,
		tigerLineId: match.tigerLine?.tigerLineId,
		tigerLineSide: match.tigerLine?.side,
		raw: match,
	};
}

function debounce(fn, wait = 200) {
	let timer;
	return (...args) => {
		clearTimeout(timer);
		timer = setTimeout(() => fn(...args), wait);
	};
}

function renderSuggestions(listEl, matches) {
	if (!listEl) return;
	listEl.innerHTML = '';
	matches.slice(0, SUGGESTION_LIMIT).forEach((match) => {
		const option = document.createElement('option');
		option.value = match.matchedAddress || '';
		if (match.coordinates) {
			option.dataset.lat = match.coordinates.y;
			option.dataset.lng = match.coordinates.x;
		}
		listEl.appendChild(option);
	});
}

export function initGeolocate(options = {}) {
	const {
		inputSelector = '#address-search',
		buttonSelector = '#address-search-submit',
		statusSelector = '[data-role="search-hint"]',
		suggestionListSelector = '#address-suggestions',
		map = null,
		flyToOptions = {},
		onPlaceResolved = null,
	} = options;

	const input = document.querySelector(inputSelector);
	if (!input) {
		console.warn('initGeolocate: input element not found');
		return null;
	}

	const button = document.querySelector(buttonSelector);
	const statusEl = document.querySelector(statusSelector);
	const suggestionList = document.querySelector(suggestionListSelector);

	let marker = null;
	if (map && window.mapboxgl) {
		marker = new window.mapboxgl.Marker({ color: '#0f5132' });
	}

	const setLoading = (isLoading) => {
		input.setAttribute('aria-busy', isLoading ? 'true' : 'false');
		input.classList.toggle('is-loading', isLoading);
		if (button) button.disabled = isLoading;
	};

	const handleResult = (result) => {
		if (!result) {
			markInputError(input);
			setStatus(statusEl, 'No exact match found. Try a more complete address.', true);
			return;
		}

		if (marker && typeof marker.setLngLat === 'function') {
			marker.setLngLat([result.longitude, result.latitude]).addTo(map);
		}

		if (map && typeof map.flyTo === 'function') {
			map.flyTo({
				center: [result.longitude, result.latitude],
				zoom: flyToOptions.zoom || 13,
				pitch: flyToOptions.pitch || 0,
				bearing: flyToOptions.bearing || 0,
				essential: true,
			});
		}

		if (typeof onPlaceResolved === 'function') {
			onPlaceResolved(result);
		}

		setStatus(statusEl, `Matched: ${result.matchedAddress}`, false);
	};

	const lookup = async () => {
		const query = input.value.trim();
		if (!query) {
			markInputError(input);
			setStatus(statusEl, 'Enter a full street address to search.', true);
			return;
		}

		try {
			setLoading(true);
			setStatus(statusEl, 'Searching U.S. Census geocoder…', false);
			const result = await geocodeAddress(query);
			handleResult(result);
		} catch (err) {
			console.error('Census geocoding failed:', err);
			markInputError(input);
			setStatus(statusEl, 'Lookup failed. Please try again.', true);
		} finally {
			setLoading(false);
		}
	};

	input.addEventListener('keydown', (event) => {
		if (event.key === 'Enter') {
			event.preventDefault();
			lookup();
		}
	});

	if (button) {
		button.addEventListener('click', (event) => {
			event.preventDefault();
			lookup();
		});
	}

	if (suggestionList) {
		let activeController = null;
		const requestSuggestions = debounce(async (value) => {
			if (value.length < SUGGESTION_MIN_CHARS) {
				suggestionList.innerHTML = '';
				return;
			}

			if (activeController) {
				activeController.abort();
			}
			activeController = new AbortController();
			try {
				const matches = await fetchMatches(value, DEFAULT_BENCHMARK, activeController.signal);
				renderSuggestions(suggestionList, matches);
				if (matches.length) {
					setStatus(statusEl, 'Pick an address suggestion or press Enter to search.', false);
				} else {
					setStatus(statusEl, 'No suggestions yet. Try adding more details.', true);
				}
			} catch (err) {
				if (err.name === 'AbortError') return;
				console.error('Suggestion fetch failed:', err);
			}
		}, SUGGESTION_DEBOUNCE_MS);

		input.addEventListener('input', () => {
			const value = input.value.trim();
			if (!value) {
				suggestionList.innerHTML = '';
				return;
			}
			requestSuggestions(value);
		});
	}

	return { lookup };
}
