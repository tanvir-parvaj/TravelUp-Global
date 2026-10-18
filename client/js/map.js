/**
 * TravelUp Global - Interactive Leaflet Map Script
 */
let travelMap = null;
let markersGroup = null;

function initLeafletMap(destinations = []) {
    const mapElement = document.getElementById('map');
    if (!mapElement) return;

    if (!travelMap) {
        // Initialize Map
        travelMap = L.map('map').setView([22.5, 90.5], 4);

        // OpenStreetMap Tile Layer
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 18,
            attribution: '© OpenStreetMap contributors | TravelUp Global'
        }).addTo(travelMap);

        markersGroup = L.layerGroup().addTo(travelMap);
    } else {
        markersGroup.clearLayers();
    }

    // Add Destination Markers
    destinations.forEach(dest => {
        if (dest.latitude && dest.longitude) {
            const currentLang = localStorage.getItem('travelup_lang') || 'en';
            const name = currentLang === 'bn' ? dest.name_bn : dest.name_en;
            const currency = localStorage.getItem('travelup_currency') || 'BDT';
            const price = currency === 'USD' ? `$${dest.price_usd}` : `৳${dest.price_bdt}`;

            const customPopup = `
                <div style="font-family: 'Inter', sans-serif; max-width: 200px;">
                    <img src="${dest.image_url}" alt="${name}" style="width:100%; height:100px; object-fit:cover; border-radius:6px; margin-bottom:6px;">
                    <strong style="font-size:1rem; display:block; color:#0f172a;">${name}</strong>
                    <div style="font-size:0.8rem; color:#64748b; margin-bottom:4px;">📍 ${dest.city}, ${dest.country}</div>
                    <div style="font-weight:700; color:#0284c7; font-size:0.95rem;">${price}</div>
                    <button onclick="app.openBookingModal(${dest.id})" style="margin-top:6px; width:100%; background:#0284c7; color:white; border:none; padding:4px 8px; border-radius:4px; cursor:pointer; font-size:0.8rem; font-weight:600;">Book Trip</button>
                </div>
            `;

            L.marker([dest.latitude, dest.longitude])
                .addTo(markersGroup)
                .bindPopup(customPopup);
        }
    });
}
