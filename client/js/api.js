/**
 * TravelUp Global - Centralized API Service (Client Scripting)
 */
const getApiBase = () => {
    if (typeof window !== 'undefined' && window.location) {
        // If opened via file:// protocol or from a different port (e.g. Live Server on 5500/8080)
        if (window.location.protocol === 'file:' || 
            (window.location.hostname === 'localhost' && window.location.port !== '5000') ||
            (window.location.hostname === '127.0.0.1' && window.location.port !== '5000')) {
            return 'http://localhost:5000/api';
        }
    }
    return '/api';
};

const API_BASE = getApiBase();

const api = {
    // Helper for requests
    async request(endpoint, options = {}) {
        const headers = {
            'Content-Type': 'application/json',
            ...(options.headers || {})
        };

        const token = localStorage.getItem('travelup_token');
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        try {
            const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint}`;
            const res = await fetch(url, {
                ...options,
                headers
            });
            const data = await res.json();
            return data;
        } catch (error) {
            console.warn(`Primary API fetch failed on ${endpoint}, trying direct http://localhost:5000/api fallback:`, error);
            
            // Auto-fallback to absolute localhost URL if opened via file:// or proxy failed
            if (!endpoint.startsWith('http') && API_BASE !== 'http://localhost:5000/api') {
                try {
                    const fallbackRes = await fetch(`http://localhost:5000/api${endpoint}`, {
                        ...options,
                        headers
                    });
                    const fallbackData = await fallbackRes.json();
                    return fallbackData;
                } catch (fallbackErr) {
                    console.error('Fallback API fetch also failed:', fallbackErr);
                }
            }
            return { success: false, message: 'Network or server error. Please ensure the backend server is running on port 5000.' };
        }
    },

    // 1. Destinations
    getDestinations(params = {}) {
        const query = new URLSearchParams(params).toString();
        return this.request(`/destinations${query ? '?' + query : ''}`);
    },

    getDestinationById(id) {
        return this.request(`/destinations/${id}`);
    },

    addReview(reviewData) {
        return this.request('/destinations/review', {
            method: 'POST',
            body: JSON.stringify(reviewData)
        });
    },

    createDestination(destinationData) {
        return this.request('/destinations', {
            method: 'POST',
            body: JSON.stringify(destinationData)
        });
    },

    updateDestination(id, destinationData) {
        return this.request(`/destinations/${id}`, {
            method: 'PUT',
            body: JSON.stringify(destinationData)
        });
    },

    toggleDestinationStatus(id) {
        return this.request(`/destinations/${id}/status`, {
            method: 'PUT'
        });
    },

    deleteDestination(id) {
        return this.request(`/destinations/${id}`, {
            method: 'DELETE'
        });
    },

    // --- Master Destination Management System (DMS) Endpoints ---
    getCountries() {
        return this.request('/destinations/meta/countries');
    },

    createCountry(data) {
        return this.request('/destinations/meta/countries', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },

    getDivisions(params = {}) {
        const qs = new URLSearchParams(params).toString();
        return this.request(`/destinations/meta/divisions${qs ? '?' + qs : ''}`);
    },

    createDivision(data) {
        return this.request('/destinations/meta/divisions', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },

    getCities(params = {}) {
        const qs = new URLSearchParams(params).toString();
        return this.request(`/destinations/meta/cities${qs ? '?' + qs : ''}`);
    },

    createCity(data) {
        return this.request('/destinations/meta/cities', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },

    getDestinationCategories() {
        return this.request('/destinations/meta/categories');
    },

    createDestinationCategory(data) {
        return this.request('/destinations/meta/categories', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },

    getDestinationDurations() {
        return this.request('/destinations/meta/durations');
    },

    createDestinationDuration(data) {
        return this.request('/destinations/meta/durations', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },

    validateDestination(data) {
        return this.request('/destinations/validate', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },

    saveDestinationDraft(data) {
        return this.request('/destinations/draft', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },

    getDestinationInventory(destId, params = {}) {
        const qs = new URLSearchParams(params).toString();
        return this.request(`/destinations/${destId}/inventory${qs ? '?' + qs : ''}`);
    },

    createDestinationInventoryItem(destId, type, data) {
        return this.request(`/destinations/${destId}/inventory/${type}`, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },

    deleteDestinationInventoryItem(destId, type, itemId) {
        return this.request(`/destinations/${destId}/inventory/${type}/${itemId}`, {
            method: 'DELETE'
        });
    },

    linkExistingDestinationInventory(destId, data) {
        return this.request(`/destinations/${destId}/inventory-link`, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },


    // 2. Auth
    login(credentials) {
        return this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify(credentials)
        });
    },

    register(userData) {
        return this.request('/auth/register', {
            method: 'POST',
            body: JSON.stringify(userData)
        });
    },

    getProfile() {
        return this.request('/auth/me');
    },

    updateProfile(profileData) {
        return this.request('/auth/profile', {
            method: 'PUT',
            body: JSON.stringify(profileData)
        });
    },

    // 3. Bookings
    createBooking(bookingData) {
        return this.request('/bookings', {
            method: 'POST',
            body: JSON.stringify(bookingData)
        });
    },

    getUserBookings() {
        return this.request('/bookings/my');
    },

    // 4. Alerts
    getAlerts() {
        return this.request('/alerts');
    },

    // 5. Smart AI & Tools
    calculateBudget(budgetData) {
        return this.request('/ai/budget', {
            method: 'POST',
            body: JSON.stringify(budgetData)
        });
    },

    quizRecommend(quizData) {
        return this.request('/ai/quiz', {
            method: 'POST',
            body: JSON.stringify(quizData)
        });
    },

    askAssistant(assistantData) {
        return this.request('/ai/assistant', {
            method: 'POST',
            body: JSON.stringify(assistantData)
        });
    },

    // 6. Modular Component Ecosystem
    getDestinationEcosystem(destinationId) {
        return this.request(`/components/ecosystem/${destinationId}`);
    },

    getHotels(params = {}) {
        const query = new URLSearchParams(params).toString();
        return this.request(`/components/hotels${query ? '?' + query : ''}`);
    },

    getActivities(params = {}) {
        const query = new URLSearchParams(params).toString();
        return this.request(`/components/activities${query ? '?' + query : ''}`);
    },

    getTransportation(params = {}) {
        const query = new URLSearchParams(params).toString();
        return this.request(`/components/transportation${query ? '?' + query : ''}`);
    },

    // 7. Authoritative Pricing Engine
    calculateCustomTrip(tripData) {
        return this.request('/pricing/calculate-custom-trip', {
            method: 'POST',
            body: JSON.stringify(tripData)
        });
    },

    validateBookingPrice(validationData) {
        return this.request('/pricing/validate-booking-price', {
            method: 'POST',
            body: JSON.stringify(validationData)
        });
    },

    getGroupPricingRules() {
        return this.request('/pricing/group-rules');
    },

    // 8. Custom Trip Builder & Optimizer
    createCustomTrip(tripData) {
        return this.request('/custom-trips', {
            method: 'POST',
            body: JSON.stringify(tripData)
        });
    },

    getCustomTrip(id) {
        return this.request(`/custom-trips/${id}`);
    },

    optimizeTripBudget(optimizationData) {
        return this.request('/custom-trips/optimize', {
            method: 'POST',
            body: JSON.stringify(optimizationData)
        });
    },

    // 9. Packages & Add-on Calculation
    getPackages(params = {}) {
        const query = new URLSearchParams(params).toString();
        return this.request(`/packages${query ? '?' + query : ''}`);
    },

    getPackageById(id) {
        return this.request(`/packages/${id}`);
    },

    calculatePackage(packageId, data) {
        return this.request(`/packages/${packageId}/calculate`, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },

    createPackage(packageData) {
        return this.request('/packages', {
            method: 'POST',
            body: JSON.stringify(packageData)
        });
    },

    deletePackage(id) {
        return this.request(`/packages/${id}`, {
            method: 'DELETE'
        });
    },


    // 10. Admin SaaS Management
    getAdminAnalytics() {
        return this.request('/admin/analytics');
    },

    getFinancials() {
        return this.request('/admin/financials');
    },

    updateAdminPricing(data) {
        return this.request('/admin/pricing/update', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },

    getAdminAuditLogs() {
        return this.request('/admin/pricing/audit-logs');
    },

    // 11. Leads & Customer Inquiries
    createLead(leadData) {
        return this.request('/leads', {
            method: 'POST',
            body: JSON.stringify(leadData)
        });
    },

    getLeads() {
        return this.request('/leads');
    },

    updateLeadStatus(id, updateData) {
        return this.request(`/leads/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(updateData)
        });
    },

    // 12. Bookings & Staff Live Management
    getAllBookings() {
        return this.request('/bookings/all');
    },

    updateBookingStatus(id, status) {
        return this.request(`/bookings/${id}/status`, {
            method: 'PATCH',
            body: JSON.stringify({ status })
        });
    },

    getUsers() {
        return this.request('/auth/users');
    },

    createUser(userData) {
        return this.request('/auth/users', {
            method: 'POST',
            body: JSON.stringify(userData)
        });
    },

    updateUser(id, userData) {
        return this.request(`/auth/users/${id}`, {
            method: 'PUT',
            body: JSON.stringify(userData)
        });
    },

    resetUserPassword(id, password) {
        return this.request(`/auth/users/${id}/reset-password`, {
            method: 'POST',
            body: JSON.stringify({ password })
        });
    },

    updateUserRole(id, role) {
        return this.request(`/auth/users/${id}/role`, {
            method: 'PATCH',
            body: JSON.stringify({ role })
        });
    },

    deleteUser(id) {
        return this.request(`/auth/users/${id}`, {
            method: 'DELETE'
        });
    },

    // 13. Wishlists Management
    getWishlist() {
        return this.request('/wishlists');
    },

    addToWishlist(destId, pkgId = null) {
        return this.request('/wishlists', {
            method: 'POST',
            body: JSON.stringify({ destination_id: destId, package_id: pkgId })
        });
    },

    removeFromWishlist(id) {
        return this.request(`/wishlists/${id}`, {
            method: 'DELETE'
        });
    },

    removeWishlistByDestination(destId) {
        return this.request(`/wishlists/destination/${destId}`, {
            method: 'DELETE'
        });
    },

    // 14. Reviews Management
    getReviews(params = {}) {
        const query = new URLSearchParams(params).toString();
        return this.request(`/reviews${query ? '?' + query : ''}`);
    },

    submitReview(data) {
        return this.request('/reviews', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },

    deleteReview(id) {
        return this.request(`/reviews/${id}`, {
            method: 'DELETE'
        });
    },

    // 15. Blogs Management
    getBlogs(params = {}) {
        const query = new URLSearchParams(params).toString();
        return this.request(`/blogs${query ? '?' + query : ''}`);
    },

    getBlogById(id) {
        return this.request(`/blogs/${id}`);
    },

    createBlog(data) {
        return this.request('/blogs', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },

    // 16. Custom Trips
    getUserCustomTrips() {
        return this.request('/custom-trips/my');
    },

    deleteCustomTrip(id) {
        return this.request(`/custom-trips/${id}`, {
            method: 'DELETE'
        });
    },

    // 17. Admin Pricing Components
    getPricingComponents() {
        return this.request('/admin/pricing/components');
    },

    // 18. Hotels & Accommodation Master Data
    getHotels(params = {}) {
        const query = new URLSearchParams(params).toString();
        return this.request(`/hotels${query ? '?' + query : ''}`);
    },

    getHotelById(id) {
        return this.request(`/hotels/${id}`);
    },

    createHotel(data) {
        return this.request('/hotels', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },

    updateHotel(id, data) {
        return this.request(`/hotels/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    },

    toggleHotelStatus(id) {
        return this.request(`/hotels/${id}/status`, {
            method: 'PUT'
        });
    },

    deleteHotel(id) {
        return this.request(`/hotels/${id}`, {
            method: 'DELETE'
        });
    },

    addHotelRoom(data) {
        return this.request('/hotels/rooms', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },

    // 19. Transportation Fleet Master Data
    getTransportation(params = {}) {
        const query = new URLSearchParams(params).toString();
        return this.request(`/transportation${query ? '?' + query : ''}`);
    },

    createTransport(data) {
        return this.request('/transportation', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },

    updateTransport(id, data) {
        return this.request(`/transportation/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    },

    toggleTransportStatus(id) {
        return this.request(`/transportation/${id}/status`, {
            method: 'PUT'
        });
    },

    deleteTransport(id) {
        return this.request(`/transportation/${id}`, {
            method: 'DELETE'
        });
    },

    // 20. Visa Applications Tracker
    getVisaApplications(params = {}) {
        const query = new URLSearchParams(params).toString();
        return this.request(`/visas${query ? '?' + query : ''}`);
    },

    createVisaApplication(data) {
        return this.request('/visas', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },

    updateVisaStatus(id, data) {
        return this.request(`/visas/${id}/status`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    },

    deleteVisaApplication(id) {
        return this.request(`/visas/${id}`, {
            method: 'DELETE'
        });
    },

    // 21. B2B Suppliers Management
    getSuppliers(params = {}) {
        const query = new URLSearchParams(params).toString();
        return this.request(`/suppliers${query ? '?' + query : ''}`);
    },

    getSupplierById(id) {
        return this.request(`/suppliers/${id}`);
    },

    createSupplier(data) {
        return this.request('/suppliers', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },

    updateSupplier(id, data) {
        return this.request(`/suppliers/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    },

    toggleSupplierStatus(id) {
        return this.request(`/suppliers/${id}/status`, {
            method: 'PUT'
        });
    },

    deleteSupplier(id) {
        return this.request(`/suppliers/${id}`, {
            method: 'DELETE'
        });
    },

    // 22. Airline & Flight Services Master Data
    getFlights(params = {}) {
        const query = new URLSearchParams(params).toString();
        return this.request(`/flights${query ? '?' + query : ''}`);
    },

    getFlightById(id) {
        return this.request(`/flights/${id}`);
    },

    createFlight(data) {
        return this.request('/flights', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },

    updateFlight(id, data) {
        return this.request(`/flights/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    },

    toggleFlightStatus(id) {
        return this.request(`/flights/${id}/status`, {
            method: 'PUT'
        });
    },

    deleteFlight(id) {
        return this.request(`/flights/${id}`, {
            method: 'DELETE'
        });
    },

    // 23. Food & Dining (Restaurants)
    getRestaurants(params = {}) {
        const query = new URLSearchParams(params).toString();
        return this.request(`/restaurants${query ? '?' + query : ''}`);
    },

    getRestaurantById(id) {
        return this.request(`/restaurants/${id}`);
    },

    createRestaurant(data) {
        return this.request('/restaurants', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },

    updateRestaurant(id, data) {
        return this.request(`/restaurants/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    },

    toggleRestaurantStatus(id) {
        return this.request(`/restaurants/${id}/status`, {
            method: 'PUT'
        });
    },

    deleteRestaurant(id) {
        return this.request(`/restaurants/${id}`, {
            method: 'DELETE'
        });
    },

    // 24. Marketing Coupons & Promo Offers
    getCoupons() {
        return this.request('/coupons');
    },

    validateCoupon(code, total_amount, travel_type) {
        return this.request('/coupons/validate', {
            method: 'POST',
            body: JSON.stringify({ code, total_amount, travel_type })
        });
    },

    createCoupon(data) {
        return this.request('/coupons', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },

    deleteCoupon(id) {
        return this.request(`/coupons/${id}`, {
            method: 'DELETE'
        });
    }
};
