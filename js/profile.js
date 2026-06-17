/**
 * profile.js — Login, user session, profile view, travel tracker
 */

// ── Session Store (in-memory, no PII persisted) ──────────────────
const UserSession = {
    loggedIn: false,
    isGuest: false,
    name: '',
    phone: '',
    ticketId: '',
    type: 'Guest',

    login(opts) {
        this.loggedIn = true;
        this.isGuest  = opts.isGuest || false;
        this.name     = opts.name    || 'Guest';
        this.phone    = opts.phone   || '';
        this.ticketId = opts.ticketId || '';
        this.type     = opts.type    || 'Guest';
    },

    logout() {
        this.loggedIn = false;
        this.isGuest  = false;
        this.name = this.phone = this.ticketId = '';
        this.type = 'Guest';
    }
};

// ── Login Screen Controller ───────────────────────────────────────
class LoginController {
    constructor() {
        this.screen  = document.getElementById('login-screen');
        this.appEl   = document.querySelector('.app');
        this._bindTabs();
        this._bindButtons();
        // Track live searches for history
        this._bindSearchTracking();
    }

    _bindTabs() {
        document.getElementById('tab-ticket')?.addEventListener('click', () => {
            this._switchTab('ticket');
        });
        document.getElementById('tab-guest')?.addEventListener('click', () => {
            this._switchTab('guest');
        });
    }

    _switchTab(tab) {
        document.getElementById('tab-ticket').classList.toggle('active', tab === 'ticket');
        document.getElementById('tab-guest').classList.toggle('active', tab === 'guest');
        document.getElementById('form-ticket').classList.toggle('hidden', tab !== 'ticket');
        document.getElementById('form-guest').classList.toggle('hidden', tab !== 'guest');
        document.getElementById('ticket-error')?.classList.add('hidden');
    }

    _bindButtons() {
        document.getElementById('btn-ticket-login')?.addEventListener('click', () => this._doTicketLogin());
        document.getElementById('btn-guest-login')?.addEventListener('click',  () => this._doGuestLogin());

        // Allow Enter key
        ['input-ticket','input-phone','input-name'].forEach(id => {
            document.getElementById(id)?.addEventListener('keydown', e => {
                if (e.key === 'Enter') this._doTicketLogin();
            });
        });
    }

    _doTicketLogin() {
        const ticketInput = document.getElementById('input-ticket')?.value.trim().toUpperCase();
        const phone  = document.getElementById('input-phone')?.value.trim();
        const name   = document.getElementById('input-name')?.value.trim();
        const errEl  = document.getElementById('ticket-error');

        // Accept any ticket starting with SSYNC- or exact match
        const validTickets = SSyncData.user.ticketHistory.map(t => t.id.toUpperCase());
        const isValid = ticketInput && (ticketInput.startsWith('SSYNC-') || validTickets.includes(ticketInput));

        if (!isValid) {
            errEl?.classList.remove('hidden');
            document.getElementById('input-ticket')?.classList.add('input-shake');
            setTimeout(() => document.getElementById('input-ticket')?.classList.remove('input-shake'), 600);
            return;
        }

        errEl?.classList.add('hidden');
        const matchedTicket = SSyncData.user.ticketHistory.find(t => t.id.toUpperCase() === ticketInput) || SSyncData.user.ticketHistory[0];

        UserSession.login({
            isGuest:  false,
            name:     name || SSyncData.user.name,
            phone:    phone || SSyncData.user.phone,
            ticketId: matchedTicket.id,
            type:     matchedTicket.type
        });

        // Patch data if user filled name/phone
        if (name)  SSyncData.user.name  = name;
        if (phone) SSyncData.user.phone = phone;

        this._enterApp();
    }

    _doGuestLogin() {
        const name  = document.getElementById('input-guest-name')?.value.trim()  || 'Guest';
        const phone = document.getElementById('input-guest-phone')?.value.trim() || '';

        UserSession.login({ isGuest: true, name, phone, type: 'Guest' });
        if (name !== 'Guest') SSyncData.user.name  = name;
        if (phone)            SSyncData.user.phone = phone;

        this._enterApp();
    }

    _enterApp() {
        this.screen.classList.add('login-exit');
        setTimeout(() => {
            this.screen.style.display = 'none';
        }, 500);
        // Update sidebar user card
        this._updateSidebarUser();
    }

    _updateSidebarUser() {
        const u = SSyncData.user;
        const avatarEl = document.querySelector('.user-avatar');
        const nameEl   = document.querySelector('.user-name');
        const seatEl   = document.querySelector('.user-seat');
        if (avatarEl) avatarEl.textContent = UserSession.name.slice(0,2).toUpperCase();
        if (nameEl)   nameEl.textContent   = UserSession.name;
        if (seatEl)   seatEl.textContent   = UserSession.isGuest ? 'Guest • No seat assigned' : u.seat;
    }

    _bindSearchTracking() {
        // Track navigation search queries live
        const navInput = document.querySelector('.nav-search-bar input');
        if (navInput) {
            navInput.addEventListener('keydown', e => {
                if (e.key === 'Enter' && navInput.value.trim()) {
                    const now = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false });
                    SSyncData.user.searchHistory.unshift({
                        time: now,
                        query: navInput.value.trim(),
                        icon: 'search'
                    });
                    if (SSyncData.user.searchHistory.length > 20) SSyncData.user.searchHistory.pop();
                }
            });
        }
    }
}

// ── Profile View Renderer ─────────────────────────────────────────
class ProfileView {
    render() {
        const u = SSyncData.user;

        // Hero
        const initials = UserSession.name.slice(0,2).toUpperCase() || u.initials;
        const avatarEl  = document.getElementById('profile-avatar-lg');
        const nameEl    = document.getElementById('profile-display-name');
        const phoneEl   = document.getElementById('profile-display-phone');
        const seatEl    = document.getElementById('profile-display-seat');
        const gateEl    = document.getElementById('profile-display-gate');
        const roleEl    = document.getElementById('profile-role-badge');

        if (avatarEl)  avatarEl.textContent  = initials;
        if (nameEl)    nameEl.textContent    = UserSession.name || u.name;
        if (phoneEl)   phoneEl.innerHTML     = `<span class="material-icons-round">phone</span> ${u.phone || 'Not provided'}`;
        if (seatEl)    seatEl.innerHTML      = `<span class="material-icons-round">chair</span> ${UserSession.isGuest ? 'Guest — no seat' : u.seat}`;
        if (gateEl)    gateEl.innerHTML      = `<span class="material-icons-round">door_front</span> Entry: ${u.gate}`;
        if (roleEl)    roleEl.textContent    = UserSession.type;
        if (roleEl)    roleEl.className      = `profile-role-badge type-${UserSession.type.toLowerCase()}`;

        // Logout
        document.getElementById('btn-logout')?.addEventListener('click', () => {
            UserSession.logout();
            location.reload();
        });

        this._renderTicketHistory(u.ticketHistory);
        this._renderPurchaseHistory(u.purchaseHistory);
        this._renderSearchHistory(u.searchHistory);
        this._renderTravelTimeline(u.travelLog);
        this._drawTravelMap(u.travelLog);
    }

    _renderTicketHistory(tickets) {
        const el = document.getElementById('ticket-history-list');
        if (!el) return;
        el.innerHTML = tickets.map(t => `
            <div class="profile-ticket-row ${t.status}">
                <div class="pt-icon"><span class="material-icons-round">confirmation_number</span></div>
                <div class="pt-info">
                    <span class="pt-match">${t.match}</span>
                    <span class="pt-date">${t.date} · ${t.venue}</span>
                    <span class="pt-seat">Seat: ${t.seat} · ${t.type}</span>
                </div>
                <div class="pt-id">
                    <span class="pt-id-num">${t.id}</span>
                    <span class="pt-status ${t.status}">${t.status === 'active' ? '● Active' : '✓ Used'}</span>
                </div>
            </div>
        `).join('');
    }

    _renderPurchaseHistory(purchases) {
        const el = document.getElementById('purchase-history-list');
        if (!el) return;
        const total = purchases.reduce((s, p) => s + p.price, 0);
        el.innerHTML = `
            <div class="purchase-total">Total Spent Today: <strong>₹${total.toLocaleString()}</strong></div>
            ${purchases.map(p => `
            <div class="purchase-row">
                <span class="purchase-emoji">${p.icon}</span>
                <div class="purchase-info">
                    <span class="purchase-name">${p.item}</span>
                    <span class="purchase-cat">${p.category} · ${p.time}</span>
                </div>
                <span class="purchase-price">₹${p.price.toLocaleString()}</span>
            </div>`).join('')}`;
    }

    _renderSearchHistory(searches) {
        const el = document.getElementById('search-history-list');
        if (!el) return;
        el.innerHTML = searches.map(s => `
            <div class="search-history-row">
                <span class="material-icons-round search-icon">${s.icon}</span>
                <div class="search-info">
                    <span class="search-query">${s.query}</span>
                    <span class="search-time">${s.time}</span>
                </div>
            </div>`).join('');
    }

    _renderTravelTimeline(log) {
        const el = document.getElementById('travel-timeline');
        if (!el) return;
        const typeIcon = { entry: 'door_front', seat: 'chair', food: 'restaurant', restroom: 'wc', exit: 'exit_to_app' };
        el.innerHTML = log.map((step, i) => `
            <div class="travel-step ${step.type} ${i === log.length - 1 ? 'last' : ''}">
                <div class="travel-dot ${step.type}">
                    <span class="material-icons-round">${typeIcon[step.type] || 'place'}</span>
                </div>
                <div class="travel-content">
                    <span class="travel-zone">${step.zone}</span>
                    <span class="travel-note">${step.note}</span>
                </div>
                <span class="travel-time">${step.time}</span>
            </div>`).join('');
    }

    _drawTravelMap(log) {
        const canvas = document.getElementById('travel-map-canvas');
        if (!canvas) return;
        const parent = canvas.parentElement;
        canvas.width  = parent.clientWidth || 400;
        canvas.height = 160;
        const ctx = canvas.getContext('2d');
        const w = canvas.width, h = canvas.height;

        // Background
        ctx.fillStyle = '#0F1C10';
        ctx.fillRect(0, 0, w, h);

        // Stadium outline
        ctx.strokeStyle = 'rgba(34,197,94,0.2)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.ellipse(w/2, h/2, w*0.44, h*0.38, 0, 0, Math.PI*2);
        ctx.stroke();
        ctx.beginPath();
        ctx.ellipse(w/2, h/2, w*0.18, h*0.14, 0, 0, Math.PI*2);
        ctx.fillStyle = 'rgba(22,163,74,0.12)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(34,197,94,0.3)';
        ctx.stroke();

        // Map zone points
        const pts = {
            entry:    { x: w*0.15, y: h*0.5 },
            seat:     { x: w*0.55, y: h*0.35 },
            food:     { x: w*0.72, y: h*0.65 },
            restroom: { x: w*0.62, y: h*0.72 },
            exit:     { x: w*0.2,  y: h*0.7  }
        };
        const colors = { entry:'#22C55E', seat:'#3B82F6', food:'#FF9500', restroom:'#A78BFA', exit:'#EF4444' };

        // Draw path
        ctx.beginPath();
        log.forEach((step, i) => {
            const pt = pts[step.type];
            if (!pt) return;
            if (i === 0) ctx.moveTo(pt.x, pt.y);
            else ctx.lineTo(pt.x, pt.y);
        });
        ctx.strokeStyle = 'rgba(255,149,0,0.5)';
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 3]);
        ctx.stroke();
        ctx.setLineDash([]);

        // Draw dots
        log.forEach(step => {
            const pt = pts[step.type];
            if (!pt) return;
            ctx.beginPath();
            ctx.arc(pt.x, pt.y, 6, 0, Math.PI*2);
            ctx.fillStyle = colors[step.type] || '#fff';
            ctx.fill();
            ctx.strokeStyle = 'rgba(255,255,255,0.6)';
            ctx.lineWidth = 1.5;
            ctx.stroke();
        });

        // Labels
        ctx.font = '9px Inter';
        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        ctx.textAlign = 'center';
        Object.entries(pts).forEach(([key, pt]) => {
            ctx.fillText(key.charAt(0).toUpperCase() + key.slice(1), pt.x, pt.y - 10);
        });
    }
}

// ── Globals used by App ───────────────────────────────────────────
window.UserSession  = UserSession;
window.ProfileView  = ProfileView;
window.LoginController = LoginController;
