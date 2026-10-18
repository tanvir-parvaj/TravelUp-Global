/**
 * TravelUp Global - Unified API Helper Client (v2.0)
 */
const API = {
    BASE_URL: window.location.origin.includes('5000') ? window.location.origin : 'http://localhost:5000',

    getToken() {
        return localStorage.getItem('travelup_token');
    },

    getHeaders() {
        const headers = { 'Content-Type': 'application/json' };
        const token = this.getToken();
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        return headers;
    },

    async request(endpoint, options = {}) {
        const url = `${this.BASE_URL}${endpoint}`;
        const config = {
            headers: this.getHeaders(),
            ...options
        };

        try {
            const response = await fetch(url, config);
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || `Request failed with status ${response.status}`);
            }
            return data;
        } catch (error) {
            console.error(`API Error [${endpoint}]:`, error);
            throw error;
        }
    },

    // Destinations
    getDestinations(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        return this.request(`/api/destinations${queryString ? '?' + queryString : ''}`);
    },

    getDestination(id) {
        return this.request(`/api/destinations/${id}`);
    },

    getHotels(destinationId, params = {}) {
        const queryString = new URLSearchParams(params).toString();
        return this.request(`/api/destinations/${destinationId}/hotels${queryString ? '?' + queryString : ''}`);
    },

    // Packages
    getPackages() {
        return this.request('/api/packages');
    },

    getPackage(id) {
        return this.request(`/api/packages/${id}`);
    },

    // Trip Builder (Algorithmic Engine)
    calculateTrip(payload) {
        return this.request('/api/trip-builder/calculate', {
            method: 'POST',
            body: JSON.stringify(payload)
        });
    },

    getInventory() {
        return this.request('/api/trip-builder/inventory');
    },

    // Bookings & Split Bill
    createBooking(payload) {
        return this.request('/api/bookings', {
            method: 'POST',
            body: JSON.stringify(payload)
        });
    },

    getUserBookings() {
        return this.request('/api/bookings/my-bookings');
    },

    getSplitBill(ref) {
        return this.request(`/api/bookings/split/${ref}`);
    },

    paySplitShare(ref, payload) {
        return this.request(`/api/bookings/split/${ref}/pay`, {
            method: 'POST',
            body: JSON.stringify(payload)
        });
    },

    // Corporate B2B Quotations
    generateQuotation(payload) {
        return this.request('/api/quotations/generate', {
            method: 'POST',
            body: JSON.stringify(payload)
        });
    },

    // Alerts
    getAlerts() {
        return this.request('/api/alerts');
    },

    broadcastAlert(payload) {
        return this.request('/api/alerts/broadcast', {
            method: 'POST',
            body: JSON.stringify(payload)
        });
    }
};

window.API = API;
