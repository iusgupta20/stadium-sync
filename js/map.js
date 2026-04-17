class StadiumMap {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) return;
        this.ctx = this.canvas.getContext('2d');
        this.zones = [];
        this.scale = 1;
        this.offsetX = 0;
        this.offsetY = 0;
        this.dragging = false;
        this.lastMouse = { x: 0, y: 0 };
        this.activeLayer = 'density';
        this.selectedZone = null;
        this.animFrame = null;
        this.time = 0;
        this.initZones();
        this.bindEvents();
        this.resize();
        this.animate();
    }

    initZones() {
        const data = typeof SSyncData !== 'undefined' ? SSyncData.zoneAnalytics : [];
        const labels = ['N', 'NNE', 'ENE', 'E', 'ESE', 'SSE', 'S', 'SSW', 'WSW', 'W', 'WNW', 'NNW'];
        for (let i = 0; i < 12; i++) {
            const src = data[i % data.length] || { current: 3000, capacity: 5000, status: 'low' };
            const pct = src.current / src.capacity;
            this.zones.push({
                index: i,
                label: labels[i],
                name: src.zone || labels[i],
                angle: (Math.PI * 2 / 12) * i - Math.PI / 2,
                span: Math.PI * 2 / 12,
                density: pct,
                capacity: src.capacity,
                current: src.current,
                status: src.status
            });
        }
    }

    bindEvents() {
        this.canvas.addEventListener('mousedown', e => { this.dragging = true; this.lastMouse = { x: e.clientX, y: e.clientY }; });
        window.addEventListener('mousemove', e => {
            if (!this.dragging) return;
            this.offsetX += e.clientX - this.lastMouse.x;
            this.offsetY += e.clientY - this.lastMouse.y;
            this.lastMouse = { x: e.clientX, y: e.clientY };
        });
        window.addEventListener('mouseup', () => { this.dragging = false; });
        this.canvas.addEventListener('wheel', e => {
            e.preventDefault();
            const delta = e.deltaY > 0 ? 0.9 : 1.1;
            this.scale = Math.max(0.5, Math.min(3, this.scale * delta));
        }, { passive: false });
        this.canvas.addEventListener('click', e => {
            const rect = this.canvas.getBoundingClientRect();
            const mx = (e.clientX - rect.left - this.canvas.width / 2 - this.offsetX) / this.scale;
            const my = (e.clientY - rect.top - this.canvas.height / 2 - this.offsetY) / this.scale;
            const angle = Math.atan2(my, mx);
            const dist = Math.sqrt(mx * mx + my * my);
            const r = Math.min(this.canvas.width, this.canvas.height) * 0.35;
            if (dist > r * 0.5 && dist < r * 1.05) {
                let a = angle + Math.PI / 2;
                if (a < 0) a += Math.PI * 2;
                const idx = Math.floor(a / (Math.PI * 2 / 12)) % 12;
                this.selectedZone = this.zones[idx];
                this.showZoneInfo(this.zones[idx]);
            } else {
                this.selectedZone = null;
                this.hideZoneInfo();
            }
        });
        window.addEventListener('resize', () => this.resize());
    }

    resize() {
        const parent = this.canvas.parentElement;
        if (!parent) return;
        this.canvas.width = parent.clientWidth;
        this.canvas.height = parent.clientHeight;
    }

    zoomIn() { this.scale = Math.min(3, this.scale * 1.2); }
    zoomOut() { this.scale = Math.max(0.5, this.scale * 0.8); }

    setLayer(layer) { this.activeLayer = layer; }

    getDensityColor(pct) {
        if (pct < 0.5) return 'rgba(0,212,255,';    // cyan
        if (pct < 0.7) return 'rgba(255,184,0,';     // amber
        if (pct < 0.85) return 'rgba(255,136,0,';    // orange
        return 'rgba(255,68,68,';                      // red/critical
    }

    draw() {
        const { ctx, canvas } = this;
        const w = canvas.width, h = canvas.height;
        const cx = w / 2 + this.offsetX, cy = h / 2 + this.offsetY;
        const r = Math.min(w, h) * 0.35 * this.scale;

        ctx.clearRect(0, 0, w, h);

        // Background grid
        ctx.strokeStyle = 'rgba(21,101,216,0.06)';
        ctx.lineWidth = 1;
        for (let i = -20; i < 40; i++) {
            const x = (i * 40 * this.scale) + (this.offsetX % (40 * this.scale));
            ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
            const y = (i * 40 * this.scale) + (this.offsetY % (40 * this.scale));
            ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
        }

        // Pitch (centre)
        ctx.fillStyle = '#0a1628';
        ctx.beginPath();
        ctx.ellipse(cx, cy, r * 0.35, r * 0.22, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'rgba(21,101,216,0.3)';
        ctx.lineWidth = 1.5 * this.scale;
        ctx.stroke();

        // 30-yard circle
        ctx.beginPath();
        ctx.ellipse(cx, cy, r * 0.52, r * 0.45, 0, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(21,101,216,0.15)';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Draw zones
        this.zones.forEach(zone => {
            const startA = zone.angle;
            const endA = startA + zone.span;
            const innerR = r * 0.55;
            const outerR = r;

            ctx.beginPath();
            ctx.arc(cx, cy, outerR, startA, endA);
            ctx.arc(cx, cy, innerR, endA, startA, true);
            ctx.closePath();

            const colorBase = this.getDensityColor(zone.density);
            const pulse = zone.density >= 0.85 ? 0.15 * Math.sin(this.time * 3 + zone.index) : 0;
            const alpha = 0.3 + zone.density * 0.5 + pulse;
            ctx.fillStyle = colorBase + alpha.toFixed(2) + ')';
            ctx.fill();

            const isSelected = this.selectedZone && this.selectedZone.index === zone.index;
            ctx.strokeStyle = isSelected ? 'rgba(0,212,255,0.8)' : 'rgba(21,101,216,0.25)';
            ctx.lineWidth = isSelected ? 2.5 * this.scale : 1;
            ctx.stroke();

            // Label
            const midA = startA + zone.span / 2;
            const labelR = (innerR + outerR) / 2;
            const lx = cx + Math.cos(midA) * labelR;
            const ly = cy + Math.sin(midA) * labelR;
            ctx.fillStyle = 'rgba(255,255,255,0.85)';
            ctx.font = `bold ${Math.max(10, 12 * this.scale)}px Inter`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(zone.label, lx, ly);

            const pctText = Math.round(zone.density * 100) + '%';
            ctx.fillStyle = zone.density >= 0.85 ? '#FF4444' : 'rgba(255,255,255,0.5)';
            ctx.font = `${Math.max(8, 10 * this.scale)}px JetBrains Mono`;
            ctx.fillText(pctText, lx, ly + 14 * this.scale);
        });

        // Amenity markers (if layer active)
        if (this.activeLayer === 'amenities') {
            const amenities = [
                { angle: 0, r: 0.8, icon: '🍔', label: 'Food Court' },
                { angle: Math.PI / 3, r: 0.85, icon: '🚻', label: 'Restroom' },
                { angle: Math.PI * 2 / 3, r: 0.75, icon: '🏪', label: 'Merch' },
                { angle: Math.PI, r: 0.82, icon: '🚑', label: 'Medical' },
                { angle: -Math.PI / 3, r: 0.78, icon: '🚪', label: 'Exit' },
                { angle: -Math.PI * 2 / 3, r: 0.88, icon: '☕', label: 'Café' }
            ];
            amenities.forEach(a => {
                const ax = cx + Math.cos(a.angle) * r * a.r;
                const ay = cy + Math.sin(a.angle) * r * a.r;
                ctx.font = `${18 * this.scale}px serif`;
                ctx.textAlign = 'center';
                ctx.fillText(a.icon, ax, ay);
                ctx.fillStyle = 'rgba(255,255,255,0.6)';
                ctx.font = `${9 * this.scale}px Inter`;
                ctx.fillText(a.label, ax, ay + 16 * this.scale);
            });
        }

        // Exit markers
        if (this.activeLayer === 'exits') {
            const exits = [0, Math.PI / 2, Math.PI, -Math.PI / 2];
            const names = ['Gate A', 'Gate B', 'Gate C', 'Gate D'];
            exits.forEach((a, i) => {
                const ex = cx + Math.cos(a) * r * 1.12;
                const ey = cy + Math.sin(a) * r * 1.12;
                ctx.beginPath();
                ctx.arc(ex, ey, 14 * this.scale, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(16,185,129,0.2)';
                ctx.fill();
                ctx.strokeStyle = 'rgba(16,185,129,0.6)';
                ctx.lineWidth = 1.5;
                ctx.stroke();
                ctx.fillStyle = '#10B981';
                ctx.font = `bold ${10 * this.scale}px Inter`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(names[i], ex, ey);
            });
        }

        // Flow arrows
        if (this.activeLayer === 'flow') {
            for (let i = 0; i < 8; i++) {
                const a = (Math.PI * 2 / 8) * i + this.time * 0.5;
                const fr = r * (0.5 + 0.15 * Math.sin(this.time + i));
                const fx = cx + Math.cos(a) * fr;
                const fy = cy + Math.sin(a) * fr;
                ctx.beginPath();
                ctx.moveTo(fx, fy);
                const tx = cx + Math.cos(a) * (fr + 20 * this.scale);
                const ty = cy + Math.sin(a) * (fr + 20 * this.scale);
                ctx.lineTo(tx, ty);
                ctx.strokeStyle = 'rgba(0,212,255,0.4)';
                ctx.lineWidth = 2 * this.scale;
                ctx.stroke();
                // arrowhead
                const headLen = 8 * this.scale;
                const ha = Math.atan2(ty - fy, tx - fx);
                ctx.beginPath();
                ctx.moveTo(tx, ty);
                ctx.lineTo(tx - headLen * Math.cos(ha - 0.4), ty - headLen * Math.sin(ha - 0.4));
                ctx.lineTo(tx - headLen * Math.cos(ha + 0.4), ty - headLen * Math.sin(ha + 0.4));
                ctx.closePath();
                ctx.fillStyle = 'rgba(0,212,255,0.5)';
                ctx.fill();
            }
        }

        // Centre label
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.font = `${Math.max(9, 11 * this.scale)}px JetBrains Mono`;
        ctx.textAlign = 'center';
        ctx.fillText('PITCH', cx, cy);
    }

    animate() {
        this.time += 0.016;
        this.draw();
        this.animFrame = requestAnimationFrame(() => this.animate());
    }

    showZoneInfo(zone) {
        const panel = document.querySelector('.map-info-panel');
        if (!panel) return;
        const pct = Math.round(zone.density * 100);
        panel.querySelector('h4').textContent = zone.name || zone.label;
        panel.querySelector('.map-info-body').innerHTML = `
            <p style="margin-bottom:8px"><strong>Occupancy:</strong> ${zone.current.toLocaleString()} / ${zone.capacity.toLocaleString()} (${pct}%)</p>
            <div style="height:6px;background:rgba(255,255,255,0.1);border-radius:99px;overflow:hidden;margin-bottom:8px">
                <div style="height:100%;width:${pct}%;background:${pct >= 85 ? '#FF4444' : pct >= 70 ? '#FFB800' : '#00D4FF'};border-radius:99px"></div>
            </div>
            <p style="font-size:.8rem;color:rgba(255,255,255,0.5)">Status: <span style="color:${pct >= 85 ? '#FF4444' : pct >= 70 ? '#FFB800' : '#10B981'}">${zone.status.toUpperCase()}</span></p>
        `;
        panel.classList.add('visible');
    }

    hideZoneInfo() {
        const panel = document.querySelector('.map-info-panel');
        if (panel) panel.classList.remove('visible');
    }

    updateData() {
        const data = typeof SSyncData !== 'undefined' ? SSyncData.zoneAnalytics : [];
        this.zones.forEach((zone, i) => {
            const src = data[i % data.length];
            if (src) {
                zone.density = src.current / src.capacity;
                zone.current = src.current;
                zone.capacity = src.capacity;
                zone.status = src.status;
            }
        });
    }

    destroy() {
        if (this.animFrame) cancelAnimationFrame(this.animFrame);
    }
}
