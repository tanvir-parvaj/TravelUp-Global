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
        localStorage.removeItem('travelup_admin_token');
        localStorage.removeItem('travelup_admin_user');
        window.location.href = 'logout.html';
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
            const isStaff = ['admin', 'manager', 'accountant', 'support', 'moderator', 'uploader'].includes(user.role);
            authContainer.innerHTML = `
                <div style="display: flex; align-items: center; gap: 0.75rem;">
                    <span style="font-weight: 600; font-size: 0.9rem; display: flex; align-items: center; gap: 0.4rem;">
                        <span style="display:inline-block; width: 8px; height: 8px; background: #10b981; border-radius: 50%;"></span>
                        ${user.name.split(' ')[0]}
                    </span>
                    ${isStaff ? `
                        <a href="admin.html" class="btn-nav-outline" style="border-color: #0284c7; color: #0284c7; display: inline-flex; align-items: center; gap: 0.35rem; padding: 0.4rem 0.85rem; border-radius: 9999px; text-decoration: none; font-weight: 700; font-size: 0.85rem;">
                            <i class="material-icons" style="font-size: 16px;">admin_panel_settings</i>
                            <span>Admin Portal</span>
                        </a>
                    ` : ''}
                    <button onclick="Auth.logout()" class="btn-nav-outline" style="cursor: pointer; padding: 0.4rem 0.85rem; font-size: 0.85rem; border-radius: 9999px; font-weight: 700;">Logout</button>
                </div>
            `;
        } else {
            authContainer.innerHTML = `
                <div style="display: flex; align-items: center; gap: 0.75rem;">
                    <a href="admin.html" class="btn-nav-outline" style="border-color: #0284c7; color: #0284c7; display: inline-flex; align-items: center; gap: 0.35rem; padding: 0.4rem 0.85rem; border-radius: 9999px; text-decoration: none; font-weight: 700; font-size: 0.85rem;">
                        <i class="material-icons" style="font-size: 16px;">admin_panel_settings</i>
                        <span>Admin Portal</span>
                    </a>
                    <a href="login.html" class="btn-nav-outline" style="text-decoration: none; padding: 0.4rem 0.85rem; border-radius: 9999px; font-weight: 700; font-size: 0.85rem;">Log In</a>
                </div>
            `;
        }
    }
};

window.Auth = Auth;
document.addEventListener('DOMContentLoaded', () => {
    Auth.updateNavUI();
});
