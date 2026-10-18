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
                    <span style="font-weight: 600; font-size: 0.9rem; color: var(--secondary); display: flex; align-items: center; gap: 0.4rem;">
                        <span style="display:inline-block; width: 8px; height: 8px; background: var(--accent); border-radius: 50%;"></span>
                        ${user.name.split(' ')[0]}
                    </span>
                    <button onclick="Auth.logout()" class="btn btn-sm btn-outline" style="padding: 0.35rem 0.65rem;">Logout</button>
                </div>
            `;
        } else {
            authContainer.innerHTML = `
                <a href="/login.html" class="btn btn-outline btn-sm">Log In</a>
                <a href="/signup.html" class="btn btn-primary btn-sm">Get Started</a>
            `;
        }
    }
};

window.Auth = Auth;
document.addEventListener('DOMContentLoaded', () => {
    Auth.updateNavUI();
});
