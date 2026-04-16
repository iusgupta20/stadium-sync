/**
 * Map rendering and logic for StadiumSync
 * Uses HTML5 Canvas to render a dynamic venue map with heatmaps.
 */

class StadiumMap {
    constructor(canvasId, isInteractive = true) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) return;
        
        this.ctx = this.canvas.getContext('2d');
        this.isInteractive = isInteractive;
        this.activeLayer = 'density'; // density, flow, exits, amenities
        
        // Map state
        this.scale = 1;
        this.offsetX = 0;
        this.offsetY = 0;
        this.isDragging = false;
        this.lastX = 0;
        this.lastY = 0;

        // Colors
        this.colors = {
            bg: '#0b1120',
            pitch: '#15803d',
            pitchLines: 'rgba(255,255,255,0.4)',
            standBase: '#1e293b',
            standOutline: '#334155',
            heatmap: {
                low: 'rgba(16, 185, 129, 0.7)',   // Green
                medium: 'rgba(245, 158, 11, 0.7)', // Yellow/Orange
                high: 'rgba(249, 115, 22, 0.7)',   // Orange
                critical: 'rgba(239, 68, 68, 0.8)' // Red
            }
        };

        // Initialize zones (dummy data representing stadium sections)
        this.zones = this.generateZones();

        this.init();
    }

    init() {
        this.resize();
        window.addEventListener('resize', () => this.resize());
        
        if (this.isInteractive) {
            this.setupInteractions();
        }

        // Start render loop
        this.animate();
        
        // Simulate real-time updates
        setInterval(() => this.updateHeatmapData(), 5000);
    }

    resize() {
        const parent = this.canvas.parentElement;
        this.canvas.width = parent.clientWidth;
        this.canvas.height = parent.clientHeight;
        
        // Center initial view
        this.offsetX = this.canvas.width / 2;
        this.offsetY = this.canvas.height / 2;
        
        // Initial scale based on canvas size
        if (this.canvas.width < 500) {
            this.scale = 0.6;
        } else {
            this.scale = 1;
        }
    }

    setupInteractions() {
        // Mouse Events
        this.canvas.addEventListener('mousedown', (e) => this.dragStart(e));
        window.addEventListener('mousemove', (e) => this.dragMove(e));
        window.addEventListener('mouseup', () => this.dragEnd());
        this.canvas.addEventListener('wheel', (e) => this.zoom(e), { passive: false });
        
        // Touch Events
        this.canvas.addEventListener('touchstart', (e) => this.touchStart(e));
        window.addEventListener('touchmove', (e) => this.touchMove(e), { passive: false });
        window.addEventListener('touchend', () => this.dragEnd());
        
        // Click to show info
        this.canvas.addEventListener('click', (e) => {
            if (!this.wasDragging) {
                this.handleClick(e);
            }
        });
    }

    generateZones() {
        const zones = [];
        const numSections = 12;
        const radiusInner = 100;
        const radiusOuter = 250;
        
        for (let i = 0; i < numSections; i++) {
            const angleStart = (i * (Math.PI * 2)) / numSections;
            const angleEnd = ((i + 1) * (Math.PI * 2)) / numSections - 0.05; // Gap
            
            // Random initial crowd density 0-100
            const density = Math.floor(Math.random() * 100);
            
            zones.push({
                id: `Sec ${101 + i}`,
                angleStart,
                angleEnd,
                rInner: radiusInner,
                rOuter: radiusOuter,
                density,
                targetDensity: density,
                cx: 0, 
                cy: 0
            });
        }
        return zones;
    }

    updateHeatmapData() {
        // Slowly morph target densities
        this.zones.forEach(zone => {
            // Random walk target
            let change = (Math.random() - 0.5) * 30;
            zone.targetDensity = Math.max(0, Math.min(100, zone.density + change));
        });
    }

    setLayer(layerName) {
        this.activeLayer = layerName;
    }

    // --- Interaction Handlers ---
    dragStart(e) {
        this.isDragging = true;
        this.wasDragging = false;
        this.lastX = e.clientX;
        this.lastY = e.clientY;
    }

    dragMove(e) {
        if (!this.isDragging) return;
        this.wasDragging = true;
        
        const dx = e.clientX - this.lastX;
        const dy = e.clientY - this.lastY;
        
        this.offsetX += dx;
        this.offsetY += dy;
        
        this.lastX = e.clientX;
        this.lastY = e.clientY;
    }

    dragEnd() {
        this.isDragging = false;
    }

    touchStart(e) {
        if (e.touches.length === 1) {
            this.isDragging = true;
            this.wasDragging = false;
            this.lastX = e.touches[0].clientX;
            this.lastY = e.touches[0].clientY;
        }
    }

    touchMove(e) {
        if (!this.isDragging || e.touches.length !== 1) return;
        e.preventDefault(); // Prevent scrolling
        this.wasDragging = true;
        
        const dx = e.touches[0].clientX - this.lastX;
        const dy = e.touches[0].clientY - this.lastY;
        
        this.offsetX += dx;
        this.offsetY += dy;
        
        this.lastX = e.touches[0].clientX;
        this.lastY = e.touches[0].clientY;
    }

    zoom(e) {
        e.preventDefault();
        const zoomIntensity = 0.1;
        const wheel = e.deltaY < 0 ? 1 : -1;
        
        // Calculate new scale
        let newScale = this.scale * Math.exp(wheel * zoomIntensity);
        newScale = Math.max(0.3, Math.min(newScale, 3)); // limits
        
        this.scale = newScale;
    }
    
    manualZoom(direction) {
        let newScale = this.scale + (direction * 0.2);
        this.scale = Math.max(0.3, Math.min(newScale, 3));
    }

    handleClick(e) {
        // Simple hit test for zones
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        // Convert to local coordinates
        const localX = (mouseX - this.offsetX) / this.scale;
        const localY = (mouseY - this.offsetY) / this.scale;
        
        const dist = Math.sqrt(localX * localX + localY * localY);
        const angle = Math.atan2(localY, localX);
        const normalizedAngle = angle < 0 ? angle + Math.PI * 2 : angle;

        let foundZone = null;
        
        for (let zone of this.zones) {
            if (dist >= zone.rInner && dist <= zone.rOuter) {
                // Check angle
                if (normalizedAngle >= zone.angleStart && normalizedAngle <= zone.angleEnd) {
                    foundZone = zone;
                    break;
                }
            }
        }
        
        if (foundZone && window.showMapInfo) {
            window.showMapInfo(foundZone);
        }
    }

    // --- Rendering ---
    animate() {
        this.render();
        requestAnimationFrame(() => this.animate());
    }

    render() {
        const { width, height } = this.canvas;
        
        // Clear background
        this.ctx.fillStyle = this.colors.bg;
        this.ctx.fillRect(0, 0, width, height);
        
        this.ctx.save();
        
        // Apply transforms
        this.ctx.translate(this.offsetX, this.offsetY);
        this.ctx.scale(this.scale, this.scale);
        
        // Process animations
        this.zones.forEach(zone => {
            // Smoothly interpolate towards target density
            zone.density += (zone.targetDensity - zone.density) * 0.02;
        });

        // Draw pitch
        this.drawPitch();
        
        // Draw stands/zones
        this.drawStands();
        
        // User Location Pin
        this.drawUserLocation();
        
        this.ctx.restore();
    }

    drawPitch() {
        const pitchW = 140;
        const pitchH = 90;
        
        this.ctx.fillStyle = this.colors.pitch;
        this.ctx.beginPath();
        this.ctx.roundRect(-pitchW/2, -pitchH/2, pitchW, pitchH, 5);
        this.ctx.fill();
        
        // Center circle
        this.ctx.strokeStyle = this.colors.pitchLines;
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.ctx.arc(0, 0, 15, 0, Math.PI * 2);
        this.ctx.stroke();
        
        // Center line
        this.ctx.beginPath();
        this.ctx.moveTo(0, -pitchH/2);
        this.ctx.lineTo(0, pitchH/2);
        this.ctx.stroke();
        
        // Penalty boxes (approx)
        this.ctx.strokeRect(-pitchW/2, -20, 25, 40);
        this.ctx.strokeRect(pitchW/2 - 25, -20, 25, 40);
    }

    drawStands() {
        this.ctx.lineWidth = 2;
        
        this.zones.forEach(zone => {
            // Base stand shape
            this.ctx.beginPath();
            this.ctx.arc(0, 0, zone.rOuter, zone.angleStart, zone.angleEnd);
            this.ctx.arc(0, 0, zone.rInner, zone.angleEnd, zone.angleStart, true);
            this.ctx.closePath();
            
            this.ctx.fillStyle = this.colors.standBase;
            this.ctx.fill();
            this.ctx.strokeStyle = this.colors.standOutline;
            this.ctx.stroke();
            
            // Heatmap overlay
            if (this.activeLayer === 'density') {
                let color;
                if (zone.density < 30) color = this.colors.heatmap.low;
                else if (zone.density < 60) color = this.colors.heatmap.medium;
                else if (zone.density < 85) color = this.colors.heatmap.high;
                else color = this.colors.heatmap.critical;
                
                this.ctx.fillStyle = color;
                this.ctx.fill();
            } else if (this.activeLayer === 'amenities') {
                 // Draw some dots representing amenities
                 const midR = (zone.rInner + zone.rOuter) / 2;
                 const midAngle = (zone.angleStart + zone.angleEnd) / 2;
                 const x = Math.cos(midAngle) * midR;
                 const y = Math.sin(midAngle) * midR;
                 
                 this.ctx.fillStyle = '#d500f9';
                 this.ctx.beginPath();
                 this.ctx.arc(x, y, 4, 0, Math.PI * 2);
                 this.ctx.fill();
            }
        });
    }
    
    drawUserLocation() {
        // Pin in Section 204 (approx bottom right)
        const x = 120;
        const y = 80;
        
        this.ctx.fillStyle = '#00e5ff'; // Primary color
        this.ctx.beginPath();
        this.ctx.arc(x, y, 6, 0, Math.PI*2);
        this.ctx.fill();
        
        // Ping ripple
        const time = Date.now() / 1000;
        const r = 6 + ((time % 2) * 15);
        const alpha = 1 - ((time % 2) / 2);
        
        this.ctx.strokeStyle = `rgba(0, 229, 255, ${alpha})`;
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.arc(x, y, r, 0, Math.PI*2);
        this.ctx.stroke();
    }
}

// Map Info Handler function (called by instance)
window.showMapInfo = function(zone) {
    const panel = document.getElementById('map-info-panel');
    const header = document.getElementById('map-zone-name');
    const body = document.getElementById('map-info-body');
    
    if(!panel || !header || !body) return;
    
    header.textContent = zone.id;
    
    let densityStatus = "Low";
    if (zone.density >= 85) densityStatus = "Critical";
    else if (zone.density >= 60) densityStatus = "High";
    else if (zone.density >= 30) densityStatus = "Medium";
    
    body.innerHTML = `
        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
            <span>Crowd Density:</span>
            <strong>${Math.round(zone.density)}% (${densityStatus})</strong>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
            <span>Amenities:</span>
            <span>Food, Restrooms</span>
        </div>
        <button class="btn-secondary" style="width: 100%; margin-top: 10px; font-size: 0.8rem; padding: 6px;">Find Route Here</button>
    `;
    
    panel.classList.add('visible');
    
    const closeBtn = document.getElementById('close-map-info');
    if(closeBtn) {
        // clean up old listeners
        const newBtn = closeBtn.cloneNode(true);
        closeBtn.parentNode.replaceChild(newBtn, closeBtn);
        newBtn.addEventListener('click', () => {
            panel.classList.remove('visible');
        });
    }
}
