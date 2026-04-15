// Extend Window interface for custom properties
/**
 * @typedef {Object} WindowExtension
 * @property {any} myMap
 * @property {number[]} currentLocation
 * @property {any} destinationMarker
 * @property {any} maplibregl
 */

document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('main-search-input');
    const searchResults = document.getElementById('search-results');
    const API_BASE_URL = 'https://projectcode-production.up.railway.app'; // Match other files
    const OLA_MAPS_API_KEY = '5W9Ss6Rd7OFwQ4ehIXshZCcci0sDpngDos1MOYe3'; // from map.js

    // Debounce wrapper
    function debounce(func, delay) {
        let timeout;
        return function(...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), delay);
        };
    }

    // 1. Search DB Logic
    const handleSearch = async (e) => {
        const query = e.target.value.trim();

        if (query.length === 0) {
            searchResults.style.display = 'none';
            searchResults.innerHTML = '';
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/api/search?q=${encodeURIComponent(query)}`);
            const results = await response.json();

            searchResults.innerHTML = '';
            
            if (results.length === 0) {
                const li = document.createElement('li');
                li.innerHTML = '<span class="search-result-title">No locations found</span>';
                li.style.cursor = 'default';
                searchResults.appendChild(li);
            } else {
                results.forEach(loc => {
                    const li = document.createElement('li');
                    li.innerHTML = `
                        <span class="search-result-title"><i class="fa-solid fa-location-dot" style="margin-right: 8px;"></i>${loc.location_name}</span>
                        <span class="search-result-subtitle">${loc.location_type || 'Campus Location'}</span>
                    `;
                    
                    li.addEventListener('click', () => {
                        searchInput.value = loc.location_name;
                        searchResults.style.display = 'none';

                        drawRouteToTarget(loc.longitude, loc.latitude);

                        // 👇 NEW: highlight polygon
                        highlightLocationPolygon(loc);
                    });
                    
                    searchResults.appendChild(li);
                });
            }
            searchResults.style.display = 'block';

        } catch (error) {
            console.error("Search API failed:", error);
        }
    };

    if (searchInput) {
        searchInput.addEventListener('input', debounce(handleSearch, 300));
    }

    searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        const firstResult = searchResults.querySelector('li');

        if (firstResult) {
            firstResult.click(); // 👈 triggers BOTH route + polygon
        }
    }
});

    // Hide dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (searchInput && searchResults && !searchInput.contains(e.target) && !searchResults.contains(e.target)) {
            searchResults.style.display = 'none';
        }
    });

    // Simple decoder for standard encoded polylines
    function decodePolyline(str, precision) {
        let index = 0, lat = 0, lng = 0, coordinates = [], shift, result, byte;
        let factor = Math.pow(10, precision || 5);
        while (index < str.length) {
            byte = null; shift = 0; result = 0;
            do { byte = str.charCodeAt(index++) - 63; result |= (byte & 0x1f) << shift; shift += 5; } while (byte >= 0x20);
            let latitude_change = ((result & 1) ? ~(result >> 1) : (result >> 1));
            shift = result = 0;
            do { byte = str.charCodeAt(index++) - 63; result |= (byte & 0x1f) << shift; shift += 5; } while (byte >= 0x20);
            let longitude_change = ((result & 1) ? ~(result >> 1) : (result >> 1));
            lat += latitude_change; lng += longitude_change;
            coordinates.push([lng / factor, lat / factor]);
        }
        return coordinates;
    }

    // 2. Map Routing / Navigation Logic
    async function drawRouteToTarget(destLng, destLat) {
        if (!window.myMap) {
            console.error("Map is not initialized globally (window.myMap).");
            return;
        }
        if (!destLng || !destLat) {
            alert("This location does not have precise GPS coordinates to route to.");
            return;
        }
        
        let originLnt, originLat;
        if (window.currentLocation && window.currentLocation.length === 2) {
            [originLnt, originLat] = window.currentLocation;
        } else {
            console.error("User location is not globally tracked yet.");
            alert("Still acquiring GPS signal. Please wait or check your permissions.");
            return;
        }

        const origin = `${originLat},${originLnt}`; // Ola Maps API natively uses lat,lng format
        const destination = `${destLat},${destLng}`;
        
        try {
            const url = `https://api.olamaps.io/routing/v1/directions?origin=${origin}&destination=${destination}&api_key=${OLA_MAPS_API_KEY}`;
            const res = await fetch(url, {
                method: "POST" // Specifying POST per Ola Map SDK general guidelines, fetching directions avoids thick param stacks
            }); 
            
            // Wait, standard HTTP for Ola Maps Directions API is POST according to explicit Ola Docs for /routing/v1/directions
            const data = await res.json();
            
            let coordinates = [];
            if (data.routes && data.routes.length > 0) {
                const route = data.routes[0];
                if (typeof route.overview_polyline === 'string') {
                    coordinates = decodePolyline(route.overview_polyline, 5);
                } else if (route.geometry) {
                    if (typeof route.geometry === 'string') {
                        coordinates = decodePolyline(route.geometry, 6);
                    } else if (route.geometry.coordinates) {
                        coordinates = route.geometry.coordinates; // Pure GeoJSON
                    }
                } else if (route.overview_polyline && route.overview_polyline.points) {
                    coordinates = decodePolyline(route.overview_polyline.points, 5); 
                }
            }
            
            if (coordinates.length === 0) {
                console.warn("Could not parse route geometry. Drawing straight line as fallback.");
                coordinates = [[originLnt, originLat], [destLng, destLat]];
            }

            // ================================
            // 🔥 DOTTED LINE (user → road)
            // ================================
            // 🔥 CURVED PATH (adds a midpoint for smooth effect)
const snappedRoadPoint = coordinates[0];

// create slight curve using midpoint offset
const midLng = (originLnt + snappedRoadPoint[0]) / 2;
const midLat = (originLat + snappedRoadPoint[1]) / 2 + 0.00005; // tweak curve strength here

const dottedGeoJSON = {
    type: 'Feature',
    geometry: {
        type: 'LineString',
        coordinates: [
            [originLnt, originLat],
            [midLng, midLat],        // 👈 curve point
            snappedRoadPoint
        ]
    }
};

            // Remove old dotted line if exists
            if (window.myMap.getSource('dotted-src')) {
                window.myMap.removeLayer('dotted-layer');
                window.myMap.removeSource('dotted-src');
            }

            // Add dotted line
            window.myMap.addSource('dotted-src', {
                type: 'geojson',
                data: dottedGeoJSON
            });

            window.myMap.addLayer({
                id: 'dotted-layer',
                type: 'line',
                source: 'dotted-src',
                layout: {
                    'line-cap': 'round',
                    'line-join': 'round'
                },
                paint: {
                    'line-color': '#2563eb',
                    'line-width': 4,
                    'line-dasharray': [0.5, 2]
                }
            });


            const geoJsonData = {
                type: 'Feature',
                properties: {},
                geometry: {
                    type: 'LineString',
                    coordinates: coordinates
                }
            };

            // Render route path
            if (window.myMap.getSource('route-src')) {
                window.myMap.getSource('route-src').setData(geoJsonData);
            } else {
                window.myMap.addSource('route-src', {
                    type: 'geojson',
                    data: geoJsonData
                });

                window.myMap.addLayer({
                    id: 'route-layer',
                    type: 'line',
                    source: 'route-src',
                    layout: {
                        'line-join': 'round',
                        'line-cap': 'round'
                    },
                    paint: {
                        'line-color': '#2563eb', // Distinctive vivid blue color
                        'line-width': 6,
                        'line-opacity': 0.85
                    }
                });
            }

            // Calculate Box to fit view over the generated route
            let minLng = Math.min(originLnt, destLng);
            let maxLng = Math.max(originLnt, destLng);
            let minLat = Math.min(originLat, destLat);
            let maxLat = Math.max(originLat, destLat);
            
            coordinates.forEach(coord => {
                minLng = Math.min(minLng, coord[0]);
                maxLng = Math.max(maxLng, coord[0]);
                minLat = Math.min(minLat, coord[1]);
                maxLat = Math.max(maxLat, coord[1]);
            });

            window.myMap.fitBounds(
                [
                    [minLng, minLat],
                    [maxLng, maxLat]  
                ],
                { padding: { top: 150, bottom: 250, left: 100, right: 100 }, duration: 1500 }
            );

            // Add an explicit marker at destination
            if(window.destinationMarker) window.destinationMarker.remove();
            
            // Construct a MapLibre Marker for the target destination
            const markerDiv = document.createElement('div');
            markerDiv.className = 'fa-solid fa-location-dot';
            markerDiv.style.color = '#ef4444'; // Bright Red Target
            markerDiv.style.fontSize = '26px';
            markerDiv.style.textShadow = '0px 2px 5px rgba(0,0,0,0.4)';

            if (window.maplibregl) {
               window.destinationMarker = new window.maplibregl.Marker({element: markerDiv})
                    .setLngLat([destLng, destLat])
                    .addTo(window.myMap);
            }

        } catch (err) {
            console.error("Routing failed:", err);
            alert("Could not fetch directions. Note: Some Ola API configurations require POST on specific URLs, if this consistently fails consider falling back to drawn polylines.");
        }
    }

    function highlightLocationPolygon(loc) {
        if (!loc.boundary) return; // no polygon
        console.log("🔥 highlight function called", loc);
        // 🔹 Convert WKT → GeoJSON
        const raw = loc.boundary
    .replace(/POLYGON\s*\(\(/i, '')
    .replace(/\)\)/, '');

let coordsText = raw.split(',').map(pair => {
    const [lng, lat] = pair.trim().split(/\s+/).map(Number);
    return [lng, lat];
});

// 🔥 Ensure polygon is closed
if (
    coordsText.length > 0 &&
    (coordsText[0][0] !== coordsText[coordsText.length - 1][0] ||
     coordsText[0][1] !== coordsText[coordsText.length - 1][1])
) {
    coordsText.push(coordsText[0]);
}
        const geoJSON = {
            type: 'Feature',
            geometry: {
                type: 'Polygon',
                coordinates: [coordsText]
            }
        };

        // 🔹 Remove old highlight
        if (window.myMap.getSource('highlight-src')) {
            window.myMap.removeLayer('highlight-fill');
            window.myMap.removeSource('highlight-src');
        }

        // 🔹 Floor color mapping (MATCH YOUR LEGEND)
        const floorColors = {
            0: '#60a5fa',  // ground
            1: '#f97316',
            2: '#ef4444',
            3: '#ec4899',
            4: '#8b5cf6'
        };

        const color = floorColors[loc.floor_no] || '#3b82f6';

        // 🔹 Add polygon
        window.myMap.addSource('highlight-src', {
            type: 'geojson',
            data: geoJSON
        });

        window.myMap.addLayer({
            id: 'highlight-fill',
            type: 'fill',
            source: 'highlight-src',
            paint: {
                'fill-color': color,
                'fill-opacity': 0.25 // 👈 transparent overlay
            }
        });
    }
});
