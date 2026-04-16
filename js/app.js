/**
 * Main Application Logic for StadiumSync
 * Handles UI routing, data binding, and initialization.
 */

class App {
    constructor() {
        this.currentView = 'dashboard';
        this.maps = {};
        this.assistant = null;
        
        // Wait for DOM
        document.addEventListener('DOMContentLoaded', () => this.init());
    }

    init() {
        // --- Remove Splash Screen ---
        setTimeout(() => {
            const splash = document.getElementById('splash-screen');
            const app = document.getElementById('app');
            
            splash.classList.add('fade-out');
            setTimeout(() => {
                splash.style.display = 'none';
                app.classList.remove('hidden');
                
                // Initialize modules after app is visible
                this.initMaps();
                this.assistant = new SyncAssistant();
            }, 500);
        }, 1500);

        // --- Setup Navigation ---
        this.setupNavigation();
        
        // --- Populate Data ---
        this.populateDashboard();
        this.populateQueues();
        this.populateAlerts();
        this.populateTicketModal();
        
        // --- Setup Actions & Modals ---
        this.setupModals();
        
        // --- System Clock ---
        this.updateClock();
        setInterval(() => this.updateClock(), 1000);
    }

    // ========== NAVIGATION ==========
    
    setupNavigation() {
        // Sidebar clicks
        const navItems = document.querySelectorAll('.nav-item, .mobile-nav-item, .quick-action-btn, .panel-action');
        navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                // Ensure we get the data-view from the closest element that has it
                const target = item.closest('[data-view]');
                if (target) {
                    const viewName = target.getAttribute('data-view');
                    this.switchView(viewName);
                    
                    // Close sidebar on mobile
                    if (window.innerWidth <= 768) {
                        document.getElementById('sidebar').classList.remove('open');
                    }
                }
            });
        });

        // Mobile Menu Toggle
        const menuToggle = document.getElementById('menu-toggle');
        const sidebar = document.getElementById('sidebar');
        if (menuToggle && sidebar) {
            menuToggle.addEventListener('click', () => {
                sidebar.classList.toggle('open');
            });
        }
    }

    switchView(viewName) {
        if (!viewName || this.currentView === viewName) return;
        
        // Hide all views
        document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
        
        // Show target view
        const targetView = document.getElementById(`view-${viewName}`);
        if (targetView) {
            targetView.classList.add('active');
            this.currentView = viewName;
            
            // Update Title
            let titleText = viewName.charAt(0).toUpperCase() + viewName.slice(1);
            if (viewName === 'crowd-map') titleText = 'Crowd Map';
            if (viewName === 'assistant') titleText = 'AI Assistant';
            document.getElementById('view-title').textContent = titleText;
            
            // Update Active State in Nav (Sidebar + Mobile)
            document.querySelectorAll('.nav-item').forEach(n => {
                if(n.getAttribute('data-view') === viewName) n.classList.add('active');
                else n.classList.remove('active');
            });
            document.querySelectorAll('.mobile-nav-item').forEach(n => {
                if(n.getAttribute('data-view') === viewName) n.classList.add('active');
                else n.classList.remove('active');
            });
            
            // Trigger specific view logic
            if (viewName === 'crowd-map' && this.maps.main) {
                // Resize map canvas when container becomes visible
                setTimeout(() => this.maps.main.resize(), 50);
            }
        }
    }

    // ========== MAP INITIALIZATION ==========
    
    initMaps() {
        // Mini map on dashboard
        if (document.getElementById('mini-heatmap')) {
            this.maps.mini = new StadiumMap('mini-heatmap', false); // non-interactive
        }
        
        // Main full map
        if (document.getElementById('venue-map')) {
            this.maps.main = new StadiumMap('venue-map', true); // interactive
            
            // Setup map controls
            const filters = document.querySelectorAll('.map-filter');
            filters.forEach(btn => {
                btn.addEventListener('click', (e) => {
                    filters.forEach(f => f.classList.remove('active'));
                    btn.classList.add('active');
                    if(this.maps.main) {
                        this.maps.main.setLayer(btn.getAttribute('data-layer'));
                    }
                });
            });
            
            document.getElementById('zoom-in').addEventListener('click', () => {
                if(this.maps.main) this.maps.main.manualZoom(1);
            });
            document.getElementById('zoom-out').addEventListener('click', () => {
                if(this.maps.main) this.maps.main.manualZoom(-1);
            });
        }
    }

    // ========== DATA BINDING ==========
    
    populateDashboard() {
        // Basic Stats
        document.getElementById('stat-crowd-val').textContent = SSyncData.stats.crowdDensity + '%';
        document.getElementById('stat-wait-val').textContent = SSyncData.stats.avgWaitTime + 'm';
        document.getElementById('stat-flow-val').textContent = SSyncData.stats.flowStatus;
        document.getElementById('stat-safety-val').textContent = SSyncData.stats.safetyStatus;
        
        // Profile Nav
        document.querySelector('#user-profile .user-name').textContent = SSyncData.user.name;
        document.querySelector('#user-profile .user-seat').textContent = `Sec ${SSyncData.user.ticket.section} · Seat ${SSyncData.user.ticket.seat}`;
        
        // Top Queues (Dashboard)
        const dashQList = document.getElementById('dash-queue-list');
        if(dashQList) {
            dashQList.innerHTML = '';
            // Get top 3 sorted by distance
            const topQ = [...SSyncData.queues].sort((a,b) => a.distance - b.distance).slice(0, 3);
            
            topQ.forEach(q => {
                let icon = 'schedule';
                if(q.type === 'food') icon = 'restaurant';
                if(q.type === 'restroom') icon = 'wc';
                
                let timeClass = 'medium';
                if(q.waitTime <= 2) timeClass = 'short';
                if(q.waitTime >= 10) timeClass = 'long';
                
                dashQList.innerHTML += `
                    <div class="queue-item" onclick="app.showToast('Routing to ${q.name}...')">
                        <div class="queue-info">
                            <div class="queue-icon"><span class="material-icons-round">${icon}</span></div>
                            <div class="queue-details">
                                <h4>${q.name}</h4>
                                <p>${q.location}</p>
                            </div>
                        </div>
                        <div class="queue-time">
                            <span class="time-val ${timeClass}">${q.waitTime}m</span>
                            <span class="distance">${q.distance}m</span>
                        </div>
                    </div>
                `;
            });
        }
    }
    
    populateQueues() {
        const qGrid = document.getElementById('queues-grid');
        if(!qGrid) return;
        
        qGrid.innerHTML = '';
        
        SSyncData.queues.forEach(q => {
            let icon = 'schedule';
            if(q.type === 'food') icon = 'restaurant';
            if(q.type === 'restroom') icon = 'wc';
            if(q.type === 'merch') icon = 'storefront';
            if(q.type === 'entry') icon = 'door_front';
            
            let timeColor = 'var(--warning)';
            if(q.waitTime <= 2) timeColor = 'var(--success)';
            if(q.waitTime >= 10) timeColor = 'var(--danger)';
            
            let trendIcon = 'remove';
            if(q.crowdTrend === 'up') trendIcon = 'trending_up';
            if(q.crowdTrend === 'down') trendIcon = 'trending_down';
            
            qGrid.innerHTML += `
                <div class="stat-card" style="flex-direction: column; align-items: flex-start; gap: 12px; cursor: pointer;">
                    <div style="display: flex; justify-content: space-between; width: 100%;">
                        <div class="queue-icon" style="color: var(--primary);"><span class="material-icons-round">${icon}</span></div>
                        <div style="text-align: right;">
                            <span style="font-size: 1.5rem; font-weight: 800; color: ${timeColor};">${q.waitTime}m</span>
                            <div style="font-size: 0.75rem; color: var(--text-muted); display: flex; align-items: center; justify-content: flex-end; gap: 4px;">
                                <span class="material-icons-round" style="font-size: 1rem;">${trendIcon}</span> Trend
                            </div>
                        </div>
                    </div>
                    <div>
                        <h4 style="font-size: 1rem; margin-bottom: 4px;">${q.name}</h4>
                        <span style="font-size: 0.85rem; color: var(--text-muted);"><span class="material-icons-round" style="font-size: 1rem; vertical-align: middle;">place</span> ${q.location} · ${q.distance}m away</span>
                    </div>
                    <button class="btn-secondary" style="width: 100%; border-radius: var(--radius-sm); padding: 8px; font-size: 0.85rem; margin-top: 4px;" onclick="app.showToast('Navigation started to ${q.name}')">Navigate</button>
                </div>
            `;
        });
    }

    populateAlerts() {
        // Dashboard Alerts
        const dashAlerts = document.getElementById('dash-alert-feed');
        if(dashAlerts) {
            dashAlerts.innerHTML = '';
            SSyncData.alerts.slice(0,3).forEach(a => {
                let icon = 'info';
                if(a.type === 'warning') icon = 'warning';
                if(a.type === 'critical') icon = 'error_outline';
                
                dashAlerts.innerHTML += `
                    <div class="alert-item ${a.type}">
                        <span class="material-icons-round alert-icon">${icon}</span>
                        <div class="alert-content">
                            <h4>${a.title}</h4>
                            <p>${a.message}</p>
                            <span class="alert-time">${a.time}</span>
                        </div>
                    </div>
                `;
            });
        }
        
        // Alert View Timeline
        const alertTimeline = document.getElementById('alerts-timeline');
        if(alertTimeline) {
            alertTimeline.innerHTML = '';
            SSyncData.alerts.forEach(a => {
                let icon = 'info';
                if(a.type === 'warning') icon = 'warning';
                if(a.type === 'critical') icon = 'error_outline';
                
                alertTimeline.innerHTML += `
                    <div class="alert-item ${a.type}" style="margin-bottom: 16px;">
                        <span class="material-icons-round alert-icon">${icon}</span>
                        <div class="alert-content">
                            <h4>${a.title}</h4>
                            <p>${a.message}</p>
                            <span class="alert-time">${a.time}</span>
                        </div>
                    </div>
                `;
            });
        }
    }
    
    populateTicketModal() {
        const cvs = document.getElementById('qr-canvas');
        if(cvs) {
            const ctx = cvs.getContext('2d');
            // Draw a pseudo-QR code pattern
            ctx.fillStyle = '#fff';
            ctx.fillRect(0,0, 180, 180);
            ctx.fillStyle = '#000';
            for(let i=0; i<180; i+=10) {
                for(let j=0; j<180; j+=10) {
                    if(Math.random() > 0.4) {
                        ctx.fillRect(i, j, 10, 10);
                    }
                }
            }
            // Position markers
            ctx.fillStyle = '#000';
            ctx.fillRect(10, 10, 40, 40); ctx.fillStyle = '#fff'; ctx.fillRect(15, 15, 30, 30); ctx.fillStyle = '#000'; ctx.fillRect(20, 20, 20, 20);
            ctx.fillRect(130, 10, 40, 40); ctx.fillStyle = '#fff'; ctx.fillRect(135, 15, 30, 30); ctx.fillStyle = '#000'; ctx.fillRect(140, 20, 20, 20);
            ctx.fillRect(10, 130, 40, 40); ctx.fillStyle = '#fff'; ctx.fillRect(15, 135, 30, 30); ctx.fillStyle = '#000'; ctx.fillRect(20, 140, 20, 20);
        }
    }

    // ========== MODALS & ACTIONS ==========
    
    setupModals() {
        // Abstract modal toggling
        const toggleModal = (modalId, show) => {
            const overlay = document.getElementById(modalId);
            if(overlay) {
                if(show) overlay.classList.remove('hidden');
                else overlay.classList.add('hidden');
            }
        };

        // Emergency Modal
        document.getElementById('btn-emergency')?.addEventListener('click', () => toggleModal('emergency-modal', true));
        document.getElementById('emergency-cancel')?.addEventListener('click', () => toggleModal('emergency-modal', false));
        document.getElementById('emergency-call')?.addEventListener('click', () => {
            toggleModal('emergency-modal', false);
            this.showToast('Connecting to emergency services...', 'error');
        });
        
        const emeOpts = document.querySelectorAll('.emergency-option');
        emeOpts.forEach(btn => {
            btn.addEventListener('click', () => {
                emeOpts.forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
            });
        });

        // Report Issue Modal
        document.getElementById('btn-report-issue')?.addEventListener('click', () => toggleModal('report-modal', true));
        document.getElementById('report-cancel')?.addEventListener('click', () => toggleModal('report-modal', false));
        document.getElementById('report-submit')?.addEventListener('click', () => {
            toggleModal('report-modal', false);
            this.showToast('Report submitted successfully. Staff dispatched.', 'success');
        });

        // Ticket Modal
        document.getElementById('btn-show-ticket')?.addEventListener('click', () => toggleModal('ticket-modal', true));
        document.getElementById('ticket-close')?.addEventListener('click', () => toggleModal('ticket-modal', false));
        
        // Navigation Routes (Mockup)
        constchips = document.querySelectorAll('.suggestion-chip');
        const routePanel = document.getElementById('nav-route-panel');
        chips.forEach(chip => {
            chip.addEventListener('click', () => {
                if(routePanel) {
                    routePanel.classList.remove('hidden');
                    document.getElementById('route-dest-name').textContent = chip.textContent.trim();
                    
                    // Simple mock map for route
                    const rcvs = document.getElementById('nav-map-canvas');
                    if(rcvs) {
                        rcvs.width = rcvs.parentElement.clientWidth;
                        rcvs.height = 300;
                        const ctx = rcvs.getContext('2d');
                        ctx.fillStyle = '#0b1120'; ctx.fillRect(0,0, rcvs.width, rcvs.height);
                        
                        // Draw mock path
                        ctx.strokeStyle = '#00e5ff';
                        ctx.lineWidth = 4;
                        ctx.setLineDash([10, 10]);
                        ctx.beginPath();
                        ctx.moveTo(rcvs.width/2, 250);
                        ctx.lineTo(rcvs.width/2, 100);
                        ctx.lineTo(rcvs.width/2 + 80, 100);
                        ctx.stroke();
                        
                        // Start point
                        ctx.fillStyle = '#10b981'; ctx.beginPath(); ctx.arc(rcvs.width/2, 250, 8, 0, Math.PI*2); ctx.fill();
                        // End point
                        ctx.fillStyle = '#ef4444'; ctx.beginPath(); ctx.arc(rcvs.width/2 + 80, 100, 8, 0, Math.PI*2); ctx.fill();
                    }
                }
            });
        });
        
        document.getElementById('route-close')?.addEventListener('click', () => {
            if(routePanel) routePanel.classList.add('hidden');
        });
    }

    // ========== UTILS ==========

    showToast(message, type = 'info') {
        const container = document.getElementById('toast-container');
        if(!container) return;

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        let icon = 'info';
        if(type === 'success') icon = 'check_circle';
        if(type === 'warning') icon = 'warning';
        if(type === 'error') icon = 'error';

        toast.innerHTML = `
            <span class="material-icons-round" style="color: var(--${type === 'error' ? 'danger' : type})">${icon}</span>
            <span style="font-size: 0.9rem; font-weight: 500;">${message}</span>
        `;

        container.appendChild(toast);

        // Remove after 3 seconds
        setTimeout(() => {
            toast.style.animation = 'slideOutRight 0.3s forwards';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
    
    updateClock() {
        const clockSpan = document.getElementById('match-clock');
        if(!clockSpan) return;
        
        // Simple mock incrementing timer based on SSyncData
        let parts = SSyncData.event.time.split(':');
        let m = parseInt(parts[0]);
        let s = parseInt(parts[1]);
        
        s++;
        if(s >= 60) {
            s = 0;
            m++;
        }
        
        SSyncData.event.time = `${m}:${s < 10 ? '0'+s : s}`;
        clockSpan.textContent = `${SSyncData.event.period} · ${SSyncData.event.time}`;
    }
}

// Global initialization
const app = new App();
window.app = app; // Expose to global for inline onclicks
