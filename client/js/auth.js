/**
 * TravelUp Global - Authentication & State Manager
 */
const Auth = {
    getUser() {
        try {
            const user = localStorage.getItem('travelup_user');
            return user ? JSON.parse(user) : null;
        } catch {
            return null;
        }
    },

    setUser(user, token) {
        if (user) localStorage.setItem('travelup_user', JSON.stringify(user));
        if (token) localStorage.setItem('travelup_token', token);
        this.updateNavUI();
    },

    logout() {
        localStorage.removeItem('travelup_user');
        localStorage.removeItem('travelup_token');
        window.location.href = '/login.html';
    },

    isLoggedIn() {
        return !!localStorage.getItem('travelup_token');
    },

    isAdmin() {
        const user = this.getUser();
        return user && (user.role === 'admin' || user.role === 'superadmin' || user.role === 'staff');
    },

    updateNavUI() {
        const authContainer = document.getElementById('nav-auth-slot');
        if (!authContainer) return;

        const user = this.getUser();
        if (user) {
            authContainer.innerHTML = `
                <div style="display: flex; align-items: center; gap: 0.75rem;">
                    <span style="font-weight: 600; font-size: 0.9rem; display: flex; align-items: center; gap: 0.4rem;">
                        <span style="display:inline-block; width: 8px; height: 8px; background: #10b981; border-radius: 50%;"></span>
                        ${user.name.split(' ')[0]}
                    </span>
                    <button onclick="Auth.logout()" class="btn-nav-outline" style="cursor: pointer; padding: 0.45rem 0.9rem; font-size: 0.85rem;">Logout</button>
                    <a href="travel-planner.html" class="btn-nav-primary">
                        <i class="material-icons" style="font-size: 16px;">tune</i>
                        <span>Build My Trip</span>
                    </a>
                </div>
            `;
        } else {
            authContainer.innerHTML = `
                <a href="login.html" class="btn-nav-outline">Log In</a>
                <a href="travel-planner.html" class="btn-nav-primary">
                    <i class="material-icons" style="font-size: 16px;">tune</i>
                    <span>Build My Trip</span>
                </a>
            `;
        }
    }
};

window.Auth = Auth;
document.addEventListener('DOMContentLoaded', () => {
    Auth.updateNavUI();
});
