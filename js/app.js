class App {
    constructor() {
        this.currentView = 'dashboard';
        this.stadiumMap = null;
        this.charts = null;
        this.assistant = null;
        this.leafletMap = null;
        this.cctvIntervals = [];
        this.warnFired = {};
        this.simInterval = null;
        this.aiInterval = null;
        this.clockInterval = null;
    }

    init() {
        this.hideSplash();
        this.bindNav();
        this.bindModals();
        this.bindTopBar();
        this.populateDashboard();
        this.populateAlerts();
        this.populateQueues();
        this.startMatchClock();
        this.startLiveSimulation();
        this.startAIMonitor();
        this.navigate('dashboard');
        this.initDashboardMiniMap();
        this.drawQRCode();
    }

    hideSplash() {
        setTimeout(() => {
            const splash = document.querySelector('.splash-screen');
            if (splash) {
                splash.classList.add('fade-out');
                setTimeout(() => splash.remove(), 600);
            }
            const appEl = document.querySelector('.app');
            if (appEl) appEl.classList.remove('hidden');
        }, 2000);
    }

    // ── Navigation ─────────────────────────────────────
    bindNav() {
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', () => this.navigate(item.dataset.view));
        });
        document.querySelectorAll('.mobile-nav-item').forEach(item => {
            item.addEventListener('click', () => this.navigate(item.dataset.view));
        });
    }

    navigate(viewId) {
        this.currentView = viewId;
        // Update nav items
        document.querySelectorAll('.nav-item').forEach(n => n.classList.toggle('active', n.dataset.view === viewId));
        document.querySelectorAll('.mobile-nav-item').forEach(n => n.classList.toggle('active', n.dataset.view === viewId));
        // Toggle views
        document.querySelectorAll('.view').forEach(v => v.classList.toggle('active', v.id === `view-${viewId}`));
        // Update top bar title
        const titles = {
            dashboard: 'Dashboard', 'crowd-map': 'Crowd Map', queues: 'Queue Management',
            navigation: 'Navigation', alerts: 'Alerts & Safety', assistant: 'AI Assistant',
            services: 'Services', cctv: 'CCTV & Detection', analytics: 'Analytics', settings: 'Settings'
        };
        const titleEl = document.querySelector('.view-title');
        if (titleEl) titleEl.textContent = titles[viewId] || viewId;

        // Lazy init
        if (viewId === 'crowd-map' && !this.stadiumMap) {
            setTimeout(() => {
                this.stadiumMap = new StadiumMap('venueMapCanvas');
                this.bindMapControls();
            }, 100);
        }
        if (viewId === 'analytics' && !this.charts) {
            setTimeout(() => {
                this.charts = new SyncCharts();
                this.charts.init();
            }, 100);
        }
        if (viewId === 'assistant' && !this.assistant) {
            this.assistant = new SyncAssistant();
        }
        if (viewId === 'cctv') this.startCCTV();
        if (viewId === 'services') { this.populateServices(); this.populateMerch(); }
        if (viewId === 'navigation') this.initLeafletMap();
        if (viewId === 'analytics') this.populateAnalytics();
        if (viewId === 'crowd-map') this.populateEnvironment();
    }

    // ── Dashboard Mini Map ──────────────────────────────
    initDashboardMiniMap() {
        const canvas = document.getElementById('dashMapCanvas');
        if (!canvas) return;
        const parent = canvas.parentElement;
        canvas.width = parent.clientWidth;
        canvas.height = parent.clientHeight || 250;
        const ctx = canvas.getContext('2d');
        const draw = () => {
            const w = canvas.width, h = canvas.height;
            const cx = w / 2, cy = h / 2;
            const r = Math.min(w, h) * 0.38;
            ctx.clearRect(0, 0, w, h);
            // Grid
            ctx.strokeStyle = 'rgba(21,101,216,0.06)';
            ctx.lineWidth = 1;
            for (let i = 0; i < w; i += 30) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, h); ctx.stroke(); }
            for (let i = 0; i < h; i += 30) { ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(w, i); ctx.stroke(); }
            // Pitch
            ctx.beginPath(); ctx.ellipse(cx, cy, r * 0.3, r * 0.2, 0, 0, Math.PI * 2);
            ctx.fillStyle = '#0a1628'; ctx.fill();
            ctx.strokeStyle = 'rgba(21,101,216,0.3)'; ctx.lineWidth = 1; ctx.stroke();
            // Zones
            const zones = SSyncData.zoneAnalytics;
            for (let i = 0; i < 12; i++) {
                const src = zones[i % zones.length];
                const pct = src.current / src.capacity;
                const startA = (Math.PI * 2 / 12) * i - Math.PI / 2;
                const endA = startA + Math.PI * 2 / 12;
                ctx.beginPath();
                ctx.arc(cx, cy, r, startA, endA);
                ctx.arc(cx, cy, r * 0.5, endA, startA, true);
                ctx.closePath();
                const alpha = 0.25 + pct * 0.5;
                ctx.fillStyle = pct >= 0.85 ? `rgba(255,68,68,${alpha})` : pct >= 0.7 ? `rgba(255,184,0,${alpha})` : `rgba(0,212,255,${alpha})`;
                ctx.fill();
                ctx.strokeStyle = 'rgba(21,101,216,0.2)'; ctx.lineWidth = 0.5; ctx.stroke();
            }
            ctx.fillStyle = 'rgba(255,255,255,0.4)';
            ctx.font = '10px JetBrains Mono'; ctx.textAlign = 'center';
            ctx.fillText('PITCH', cx, cy + 3);
        };
        draw();
        this._dashMapInterval = setInterval(draw, 5000);
    }

    // ── QR Code ─────────────────────────────────────────
    drawQRCode() {
        const canvas = document.getElementById('qr-canvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const size = 120, cellSize = size / 25;
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, size, size);
        // Simple deterministic pattern from ticket ID
        const seed = 'SSYNC-2026-DC-07412';
        ctx.fillStyle = '#0D1B2A';
        for (let y = 0; y < 25; y++) {
            for (let x = 0; x < 25; x++) {
                // Finder patterns (corners)
                if ((x < 7 && y < 7) || (x >= 18 && y < 7) || (x < 7 && y >= 18)) {
                    const inOuter = x < 7 && y < 7 ? true : x >= 18 && y < 7 ? true : x < 7 && y >= 18 ? true : false;
                    if (inOuter) {
                        const lx = x < 7 ? x : x >= 18 ? x - 18 : x;
                        const ly = y < 7 ? y : y >= 18 ? y - 18 : y;
                        if (lx === 0 || lx === 6 || ly === 0 || ly === 6 || (lx >= 2 && lx <= 4 && ly >= 2 && ly <= 4)) {
                            ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
                        }
                    }
                } else {
                    // Data area — pseudo-random from seed
                    const hash = (seed.charCodeAt((x + y * 3) % seed.length) * (x + 1) * (y + 1)) % 7;
                    if (hash < 3) ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
                }
            }
        }
    }

    // ── Dashboard ──────────────────────────────────────
    populateDashboard() {
        const d = SSyncData;
        // Stats
        this.setText('#stat-occupancy', d.venue.currentOccupancy.toLocaleString());
        this.setText('#stat-occupancy-pct', `/ ${d.venue.capacity.toLocaleString()}`);
        const occPct = Math.round((d.venue.currentOccupancy / d.venue.capacity) * 100);
        const trendEl = document.querySelector('#stat-occupancy-trend');
        if (trendEl) {
            trendEl.className = `stat-trend ${occPct > 80 ? 'up' : 'safe'}`;
            trendEl.innerHTML = `<span class="material-icons-round">${occPct > 80 ? 'trending_up' : 'check_circle'}</span>${occPct}%`;
        }
        const avgWait = Math.round(d.queues.reduce((s, q) => s + q.wait, 0) / d.queues.length);
        this.setText('#stat-avg-wait', `${avgWait} min`);
        this.setText('#stat-flow-rate', `${Math.round(d.venue.currentOccupancy / 60)}/min`);
        const safeScore = occPct < 80 ? 'A+' : occPct < 90 ? 'B' : 'C';
        this.setText('#stat-safety', safeScore);

        // Event banner
        this.setText('#match-status', d.event.status);
        this.setText('#match-date', d.event.date);
        const homeLogoEl = document.getElementById('team-home-logo');
        const awayLogoEl = document.getElementById('team-away-logo');
        if (homeLogoEl) homeLogoEl.textContent = d.event.home.short;
        if (awayLogoEl) awayLogoEl.textContent = d.event.away.short;
        this.setText('#team-home-name', d.event.home.name);
        this.setText('#team-away-name', d.event.away.name);
        this.setText('#score-home', d.event.score.home);
        this.setText('#score-away', d.event.score.away);
        this.setText('#overs-home', `(${d.event.overs.home})`);
        this.setText('#overs-away', `(${d.event.overs.away})`);

        // Match events
        const eventsEl = document.getElementById('match-events');
        if (eventsEl) {
            eventsEl.innerHTML = d.event.matchEvents.map(e =>
                `<div class="match-event-item"><span class="match-event-minute">${e.over}</span><span class="match-event-desc">${e.desc}</span></div>`
            ).join('');
        }

        // Dashboard queues
        const dqEl = document.getElementById('dashboard-queues');
        if (dqEl) {
            dqEl.innerHTML = d.queues.slice(0, 5).map(q => this.queueItemHTML(q)).join('');
        }

        // Dashboard alerts
        const daEl = document.getElementById('dashboard-alerts');
        if (daEl) {
            daEl.innerHTML = d.alerts.slice(0, 4).map(a => this.alertItemHTML(a)).join('');
        }
    }

    // ── Map Controls ───────────────────────────────────
    bindMapControls() {
        document.querySelectorAll('.map-filter').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.map-filter').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                if (this.stadiumMap) this.stadiumMap.setLayer(btn.dataset.layer);
            });
        });
        document.querySelector('.map-zoom-btn.in')?.addEventListener('click', () => this.stadiumMap?.zoomIn());
        document.querySelector('.map-zoom-btn.out')?.addEventListener('click', () => this.stadiumMap?.zoomOut());
        document.querySelector('.close-info')?.addEventListener('click', () => this.stadiumMap?.hideZoneInfo());
    }

    // ── Queues ─────────────────────────────────────────
    populateQueues() {
        const container = document.getElementById('queues-list');
        if (!container) return;
        container.innerHTML = SSyncData.queues.map(q => `
            <div class="queue-item" data-type="${q.type}">
                <div class="queue-info">
                    <div class="queue-icon"><span class="material-icons-round">${q.icon}</span></div>
                    <div class="queue-details"><h4>${q.name}</h4><p>${q.location} · ${q.people} people</p></div>
                </div>
                <div class="queue-time">
                    <span class="time-val ${q.wait <= 3 ? 'short' : q.wait <= 7 ? 'medium' : 'long'}">${q.wait} min</span>
                    <span class="distance">${q.distance}</span>
                </div>
            </div>
        `).join('');

        // Filters
        document.querySelectorAll('.queue-filter').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.queue-filter').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const type = btn.dataset.type;
                container.querySelectorAll('.queue-item').forEach(item => {
                    item.style.display = type === 'all' || item.dataset.type === type ? '' : 'none';
                });
            });
        });
    }

    // ── Alerts ─────────────────────────────────────────
    populateAlerts() {
        const container = document.getElementById('alerts-timeline');
        if (!container) return;
        container.innerHTML = SSyncData.alerts.map(a => this.alertItemHTML(a)).join('');

        document.querySelectorAll('.alert-filter').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.alert-filter').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const type = btn.dataset.type;
                container.querySelectorAll('.alert-item').forEach(item => {
                    item.style.display = type === 'all' || item.classList.contains(type) ? '' : 'none';
                });
            });
        });

        this.updateAlertBadge();
    }

    updateAlertBadge() {
        const badge = document.querySelector('.nav-item[data-view="alerts"] .badge');
        if (badge) badge.textContent = SSyncData.alerts.length;
    }

    // ── Environment ────────────────────────────────────
    populateEnvironment() {
        const env = SSyncData.environment;
        const grid = document.getElementById('env-grid');
        if (!grid) return;
        const items = [
            { icon: 'thermostat', label: 'Temperature', value: env.temperature },
            { icon: 'water_drop', label: 'Humidity', value: env.humidity },
            { icon: 'air', label: 'Wind', value: env.wind },
            { icon: 'eco', label: 'Air Quality', value: env.aqi },
            { icon: 'volume_up', label: 'Noise Level', value: env.noise },
            { icon: 'wb_sunny', label: 'UV Index', value: env.uv }
        ];
        grid.innerHTML = items.map(i => `
            <div class="env-item">
                <span class="material-icons-round" style="color:var(--primary);font-size:1.3rem">${i.icon}</span>
                <div><span class="env-label">${i.label}</span><span class="env-value">${i.value}</span></div>
            </div>
        `).join('');
    }

    // ── Services ───────────────────────────────────────
    populateServices() {
        const foodGrid = document.getElementById('food-menu');
        if (!foodGrid) return;
        foodGrid.innerHTML = SSyncData.foodMenu.map(f => `
            <div class="food-card ${f.popular ? 'popular' : ''} ${!f.available ? 'out-of-stock' : ''}">
                ${f.popular ? '<span class="popular-badge">POPULAR</span>' : ''}
                <div class="food-emoji">${f.emoji}</div>
                <h4>${f.name}</h4>
                <div class="food-category">${f.category}</div>
                <div class="food-meta"><span class="food-price">₹${f.price}</span><span class="food-wait">~${f.wait} min</span></div>
                <div class="food-rating">★ ${f.rating} <span>(${f.reviews})</span></div>
                ${!f.available ? '<div style="color:var(--danger);font-size:.85rem;font-weight:600">Sold Out</div>' : ''}
            </div>
        `).join('');

        // Merch is populated separately

        // Service tabs
        document.querySelectorAll('.service-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                document.querySelectorAll('.service-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                const target = tab.dataset.tab;
                document.querySelectorAll('.service-content').forEach(sc => {
                    sc.style.display = sc.id === target ? '' : 'none';
                });
            });
        });
    }

    populateMerch() {
        const grid = document.getElementById('merch-grid');
        if (!grid || grid.children.length > 0) return;
        grid.innerHTML = SSyncData.merchItems.map(m => `
            <div class="food-card ${m.popular ? 'popular' : ''}">
                ${m.popular ? '<span class="popular-badge">POPULAR</span>' : ''}
                <div class="food-emoji">${m.emoji}</div>
                <h4>${m.name}</h4>
                <div class="food-meta"><span class="food-price">₹${m.price.toLocaleString()}</span></div>
            </div>
        `).join('');
    }

    // ── CCTV ───────────────────────────────────────────
    startCCTV() {
        this.cctvIntervals.forEach(clearInterval);
        this.cctvIntervals = [];

        const grid = document.getElementById('cctv-grid');
        if (!grid) return;
        grid.innerHTML = SSyncData.cameras.map(cam => `
            <div class="cctv-card ${cam.anomaly ? 'anomaly' : ''}">
                <div class="cctv-feed">
                    <canvas class="cctv-canvas" id="cctv-${cam.id}"></canvas>
                    <div class="cctv-live-badge"><span class="live-dot"></span>LIVE</div>
                    <span class="cctv-res">${cam.resolution}</span>
                </div>
                <div class="cctv-info">
                    <h4>${cam.name}</h4>
                    <div class="cctv-location"><span class="material-icons-round" style="font-size:1rem">location_on</span>${cam.location}</div>
                    <div class="cctv-detections">
                        <span>👤 ${cam.detections.faces}</span>
                        <span>🎒 ${cam.detections.bags}</span>
                        <span>📱 ${cam.detections.phones}</span>
                    </div>
                    <div class="cctv-insight ${cam.anomaly ? 'warning' : ''}">${cam.aiInsight}</div>
                </div>
            </div>
        `).join('');

        // Populate stats
        const totalPeople = SSyncData.cameras.reduce((s, c) => s + c.people, 0);
        const anomalyCount = SSyncData.cameras.filter(c => c.anomaly).length;
        this.setText('#cctv-total-feeds', SSyncData.cameras.length);
        this.setText('#cctv-total-people', totalPeople.toLocaleString());
        this.setText('#cctv-anomalies', anomalyCount);
        this.setText('#cctv-uptime', '99.7%');

        // Simulate feeds
        SSyncData.cameras.forEach(cam => {
            const canvas = document.getElementById(`cctv-${cam.id}`);
            if (!canvas) return;
            const ctx = canvas.getContext('2d');
            canvas.width = canvas.parentElement.clientWidth;
            canvas.height = 180;
            const interval = setInterval(() => this.drawCCTVFrame(ctx, canvas.width, canvas.height, cam), 100);
            this.cctvIntervals.push(interval);
        });
    }

    drawCCTVFrame(ctx, w, h, cam) {
        ctx.fillStyle = `rgba(11,17,32,0.15)`;
        ctx.fillRect(0, 0, w, h);

        // Noise
        for (let i = 0; i < 30; i++) {
            const x = Math.random() * w, y = Math.random() * h;
            const a = Math.random() * 0.15;
            ctx.fillStyle = `rgba(0,212,255,${a})`;
            ctx.fillRect(x, y, 2, 2);
        }

        // People dots
        const count = Math.min(cam.people / 30, 50);
        for (let i = 0; i < count; i++) {
            const x = Math.random() * w, y = h * 0.3 + Math.random() * h * 0.6;
            ctx.beginPath();
            ctx.arc(x, y, 2 + Math.random() * 2, 0, Math.PI * 2);
            ctx.fillStyle = cam.anomaly
                ? `rgba(255,184,0,${0.3 + Math.random() * 0.4})`
                : `rgba(0,212,255,${0.2 + Math.random() * 0.3})`;
            ctx.fill();
        }

        // Scanline
        const scanY = (Date.now() / 20) % h;
        ctx.strokeStyle = 'rgba(0,212,255,0.08)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, scanY);
        ctx.lineTo(w, scanY);
        ctx.stroke();
    }

    // ── Analytics ──────────────────────────────────────
    populateAnalytics() {
        const rev = SSyncData.revenue;
        this.setText('#rev-total', `₹${(rev.total / 100000).toFixed(1)}L`);
        this.setText('#rev-food', `₹${(rev.food / 100000).toFixed(1)}L`);
        this.setText('#rev-merch', `₹${(rev.merch / 100000).toFixed(1)}L`);
        this.setText('#rev-tickets', `₹${(rev.tickets / 100000).toFixed(1)}L`);

        // Zone table
        const tbody = document.getElementById('zone-analytics-body');
        if (tbody) {
            tbody.innerHTML = SSyncData.zoneAnalytics.map(z => {
                const pct = Math.round(z.current / z.capacity * 100);
                const color = pct >= 85 ? 'var(--danger)' : pct >= 70 ? 'var(--warning)' : 'var(--success)';
                return `<tr>
                    <td><strong>${z.zone}</strong></td>
                    <td>${z.current.toLocaleString()}</td>
                    <td>${z.capacity.toLocaleString()}</td>
                    <td>
                        <div style="display:flex;align-items:center;gap:8px">
                            <div style="flex:1;height:6px;background:rgba(21,101,216,0.1);border-radius:99px;overflow:hidden">
                                <div style="height:100%;width:${pct}%;background:${color};border-radius:99px"></div>
                            </div>
                            <span style="font-weight:700;color:${color}">${pct}%</span>
                        </div>
                    </td>
                    <td><span style="color:${color};font-weight:600;text-transform:uppercase">${z.status}</span></td>
                </tr>`;
            }).join('');
        }
    }

    // ── Leaflet Map ────────────────────────────────────
    initLeafletMap() {
        if (this.leafletMap) return;
        const el = document.getElementById('leaflet-map');
        if (!el || typeof L === 'undefined') return;
        const coords = SSyncData.venue.coords;
        this.leafletMap = L.map('leaflet-map').setView(coords, 17);
        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; OSM &amp; CARTO',
            maxZoom: 20
        }).addTo(this.leafletMap);
        L.marker(coords).addTo(this.leafletMap).bindPopup(`<strong>${SSyncData.venue.name}</strong><br>${SSyncData.venue.location}`);
        setTimeout(() => this.leafletMap.invalidateSize(), 200);
    }

    // ── Top Bar ────────────────────────────────────────
    bindTopBar() {
        document.querySelector('.btn-emergency')?.addEventListener('click', () => this.toggleModal('emergency-modal'));
        document.querySelector('.menu-toggle')?.addEventListener('click', () => {
            document.querySelector('.sidebar')?.classList.toggle('open');
        });
        // Report issue
        document.querySelector('.btn-report-issue')?.addEventListener('click', () => this.toggleModal('report-modal'));
        // QR code
        document.querySelector('.btn-sync')?.addEventListener('click', () => this.toggleModal('ticket-modal'));
    }

    startMatchClock() {
        const el = document.getElementById('match-clock');
        if (!el) return;
        let sec = 0;
        this.clockInterval = setInterval(() => {
            sec++;
            const h = Math.floor(sec / 3600).toString().padStart(2, '0');
            const m = Math.floor((sec % 3600) / 60).toString().padStart(2, '0');
            const s = (sec % 60).toString().padStart(2, '0');
            el.textContent = `${h}:${m}:${s}`;
        }, 1000);
    }

    // ── Modals ─────────────────────────────────────────
    bindModals() {
        document.querySelectorAll('.modal-overlay').forEach(overlay => {
            overlay.addEventListener('click', e => {
                if (e.target === overlay) overlay.classList.add('hidden');
            });
        });
        document.querySelectorAll('[data-close-modal]').forEach(btn => {
            btn.addEventListener('click', () => {
                btn.closest('.modal-overlay')?.classList.add('hidden');
            });
        });
    }

    toggleModal(id) {
        const modal = document.getElementById(id);
        if (modal) modal.classList.toggle('hidden');
    }

    // ── Live Simulation ────────────────────────────────
    startLiveSimulation() {
        this.simInterval = setInterval(() => {
            // Nudge queue wait times
            SSyncData.queues.forEach(q => {
                q.wait = Math.max(1, q.wait + Math.round((Math.random() - 0.45) * 2));
                q.people = Math.max(5, q.people + Math.round((Math.random() - 0.45) * 20));
            });

            // Nudge zone occupancy
            SSyncData.zoneAnalytics.forEach(z => {
                const delta = Math.round((Math.random() - 0.48) * 150);
                z.current = Math.max(500, Math.min(z.capacity, z.current + delta));
                const pct = z.current / z.capacity;
                z.status = pct >= 0.85 ? 'critical' : pct >= 0.7 ? 'high' : pct >= 0.5 ? 'moderate' : 'low';
            });

            // Update total occupancy
            SSyncData.venue.currentOccupancy = SSyncData.zoneAnalytics.reduce((s, z) => s + z.current, 0);

            // Refresh UI
            this.populateDashboard();
            if (this.currentView === 'queues') this.populateQueues();
            if (this.stadiumMap) this.stadiumMap.updateData();

            // Check crowd warnings
            this.checkCrowdWarnings();
        }, 5000);
    }

    checkCrowdWarnings() {
        SSyncData.zoneAnalytics.forEach(zone => {
            const pct = zone.current / zone.capacity;
            const key = zone.zone;
            if (pct >= 0.85 && !this.warnFired[key + '_red']) {
                this.warnFired[key + '_red'] = true;
                this.showToast('error', `🚨 CRITICAL: ${zone.zone} at ${Math.round(pct * 100)}% capacity!`);
                SSyncData.alerts.unshift({
                    id: 'auto-' + Date.now(),
                    type: 'critical',
                    title: `${zone.zone} — Critical Occupancy`,
                    message: `Zone at ${Math.round(pct * 100)}% capacity. Immediate diversion recommended.`,
                    time: 'Just now',
                    icon: 'warning'
                });
                this.updateAlertBadge();
            } else if (pct >= 0.75 && pct < 0.85 && !this.warnFired[key + '_amber']) {
                this.warnFired[key + '_amber'] = true;
                this.showToast('warning', `⚠️ ${zone.zone} reaching ${Math.round(pct * 100)}% capacity`);
            }
            // Reset if zone drops below thresholds
            if (pct < 0.75) {
                delete this.warnFired[key + '_amber'];
                delete this.warnFired[key + '_red'];
            }
        });
    }

    // ── AI Monitor (Right Panel) ───────────────────────
    startAIMonitor() {
        const insights = [
            { text: 'Crowd density stable across East Stand. No action needed.', type: '' },
            { text: 'Gate A queue trending up — consider opening Lane 3.', type: 'warning-insight' },
            { text: 'Food Court congestion easing. Average wait dropping.', type: '' },
            { text: 'North Stand approaching 90% — reroute via West corridor.', type: 'critical-insight' },
            { text: 'Revenue pace +12% vs last match at this time.', type: '' },
            { text: 'Weather alert: humidity rising. Ventilation check advised.', type: 'warning-insight' },
            { text: 'Exit flow post-innings shows normal egress pattern.', type: '' },
            { text: 'Camera 5 detects clustering near Counter 3. Flag raised.', type: 'warning-insight' },
            { text: 'Medical station clear — no active cases.', type: '' },
            { text: 'Power grid stable. All backup systems nominal.', type: '' }
        ];
        let idx = 0;
        const stream = document.getElementById('ai-stream');
        if (!stream) return;

        this.aiInterval = setInterval(() => {
            const item = insights[idx % insights.length];
            const now = new Date();
            const time = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

            const div = document.createElement('div');
            div.className = `ai-stream-item ${item.type}`;
            div.innerHTML = `<span class="ai-time">[${time}]</span>${item.text}`;

            stream.prepend(div);
            if (stream.children.length > 8) stream.removeChild(stream.lastChild);

            // Update safety bars
            this.updateSafetyBars();
            idx++;
        }, 5000);
    }

    updateSafetyBars() {
        const d = SSyncData;
        const occPct = Math.round((d.venue.currentOccupancy / d.venue.capacity) * 100);
        const exitClear = 100 - Math.min(30, SSyncData.queues.filter(q => q.type === 'entry').reduce((s, q) => s + q.wait, 0));
        const safetyIdx = occPct < 80 ? 95 : occPct < 90 ? 78 : 62;

        this.setBar('#bar-crowd', occPct, occPct >= 85 ? '#FF4444' : occPct >= 70 ? '#FFB800' : '#00D4FF');
        this.setText('#val-crowd', occPct + '%');
        this.setBar('#bar-exits', exitClear, exitClear > 80 ? '#10B981' : '#FFB800');
        this.setText('#val-exits', exitClear + '%');
        this.setBar('#bar-safety', safetyIdx, safetyIdx > 80 ? '#10B981' : safetyIdx > 60 ? '#FFB800' : '#FF4444');
        this.setText('#val-safety', safetyIdx + '/100');
    }

    // ── Toast System ───────────────────────────────────
    showToast(type, message) {
        let container = document.querySelector('.toast-container');
        if (!container) {
            container = document.createElement('div');
            container.className = 'toast-container';
            document.body.appendChild(container);
        }
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `<span class="material-icons-round">${type === 'error' ? 'error' : type === 'warning' ? 'warning' : 'info'}</span><span>${message}</span>`;
        container.appendChild(toast);
        setTimeout(() => {
            toast.style.animation = 'slideOutRight 0.3s ease forwards';
            setTimeout(() => toast.remove(), 300);
        }, 5000);
    }

    // ── Helpers ─────────────────────────────────────────
    setText(sel, val) {
        const el = document.querySelector(sel);
        if (el) el.textContent = val;
    }

    setBar(sel, pct, color) {
        const el = document.querySelector(sel);
        if (el) {
            el.style.width = pct + '%';
            el.style.background = color;
        }
    }

    queueItemHTML(q) {
        return `<div class="queue-item">
            <div class="queue-info">
                <div class="queue-icon"><span class="material-icons-round">${q.icon}</span></div>
                <div class="queue-details"><h4>${q.name}</h4><p>${q.location} · ${q.people} people</p></div>
            </div>
            <div class="queue-time">
                <span class="time-val ${q.wait <= 3 ? 'short' : q.wait <= 7 ? 'medium' : 'long'}">${q.wait} min</span>
                <span class="distance">${q.distance}</span>
            </div>
        </div>`;
    }

    alertItemHTML(a) {
        return `<div class="alert-item ${a.type}">
            <span class="material-icons-round alert-icon">${a.icon}</span>
            <div class="alert-content">
                <h4>${a.title}</h4>
                <p>${a.message}</p>
                <span class="alert-time">${a.time}</span>
            </div>
        </div>`;
    }
}

// Boot
window.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
    window.app.init();
});
