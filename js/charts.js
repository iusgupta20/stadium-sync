class SyncCharts {
    constructor() {
        this.charts = {};
        this.colors = {
            primary: '#1565D8',
            cyan: '#00D4FF',
            accent: '#00C2E0',
            success: '#10B981',
            warning: '#FFB800',
            danger: '#FF4444',
            primaryAlpha: 'rgba(21,101,216,0.15)',
            cyanAlpha: 'rgba(0,212,255,0.15)'
        };
    }

    init() {
        this.createAttendanceChart();
        this.createRevenueChart();
        this.createFlowChart();
    }

    createAttendanceChart() {
        const el = document.getElementById('attendanceChart');
        if (!el) return;
        const ctx = el.getContext('2d');
        this.charts.attendance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['5 PM', '5:30', '6 PM', '6:30', '7 PM', '7:30', '8 PM', '8:30', '9 PM'],
                datasets: [{
                    label: 'Attendance',
                    data: [4200, 12800, 21500, 28900, 32600, 34200, 33800, 34100, 34200],
                    borderColor: this.colors.primary,
                    backgroundColor: this.createGradient(ctx, this.colors.primary, 0.3, 0),
                    fill: true,
                    tension: 0.4,
                    pointRadius: 4,
                    pointBackgroundColor: this.colors.primary,
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointHoverRadius: 7
                }, {
                    label: 'Capacity',
                    data: Array(9).fill(41000),
                    borderColor: 'rgba(255,68,68,0.3)',
                    borderDash: [8, 4],
                    pointRadius: 0,
                    fill: false
                }]
            },
            options: this.lineOptions('Attendance Over Time')
        });
    }

    createRevenueChart() {
        const el = document.getElementById('revenueChart');
        if (!el) return;
        const ctx = el.getContext('2d');
        const data = typeof SSyncData !== 'undefined' ? SSyncData.revenue.hourly : [];
        this.charts.revenue = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.map(d => d.hour),
                datasets: [{
                    label: 'Revenue (₹)',
                    data: data.map(d => d.val),
                    backgroundColor: data.map((_, i) => {
                        const grad = ctx.createLinearGradient(0, 0, 0, 300);
                        grad.addColorStop(0, this.colors.cyan);
                        grad.addColorStop(1, this.colors.primary);
                        return grad;
                    }),
                    borderRadius: 8,
                    borderSkipped: false,
                    maxBarThickness: 40
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    title: { display: true, text: 'Revenue by Hour', color: '#1E293B', font: { size: 14, weight: 600 } },
                    tooltip: {
                        backgroundColor: '#0D1B2A',
                        titleColor: '#00D4FF',
                        bodyColor: '#fff',
                        cornerRadius: 8,
                        callbacks: { label: t => '₹' + t.raw.toLocaleString() }
                    }
                },
                scales: {
                    y: { beginAtZero: true, grid: { color: 'rgba(21,101,216,0.06)' }, ticks: { color: '#64748B', callback: v => '₹' + (v / 1000) + 'K' } },
                    x: { grid: { display: false }, ticks: { color: '#64748B' } }
                }
            }
        });
    }

    createFlowChart() {
        const el = document.getElementById('flowChart');
        if (!el) return;
        const ctx = el.getContext('2d');
        this.charts.flow = new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['5 PM', '5:30', '6 PM', '6:30', '7 PM', '7:30', '8 PM', '8:30'],
                datasets: [{
                    label: 'Entries',
                    data: [4200, 8600, 8700, 7400, 3700, 1600, 400, 300],
                    borderColor: this.colors.primary,
                    backgroundColor: this.createGradient(ctx, this.colors.primary, 0.2, 0),
                    fill: true,
                    tension: 0.4,
                    pointRadius: 3
                }, {
                    label: 'Exits',
                    data: [0, 0, 100, 200, 400, 600, 1000, 800],
                    borderColor: this.colors.danger,
                    backgroundColor: this.createGradient(ctx, this.colors.danger, 0.1, 0),
                    fill: true,
                    tension: 0.4,
                    pointRadius: 3
                }]
            },
            options: this.lineOptions('Crowd Flow — In vs Out')
        });
    }

    lineOptions(title) {
        return {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'top', labels: { color: '#64748B', usePointStyle: true, padding: 20 } },
                title: { display: true, text: title, color: '#1E293B', font: { size: 14, weight: 600 } },
                tooltip: { backgroundColor: '#0D1B2A', titleColor: '#00D4FF', bodyColor: '#fff', cornerRadius: 8 }
            },
            scales: {
                y: { beginAtZero: true, grid: { color: 'rgba(21,101,216,0.06)' }, ticks: { color: '#64748B' } },
                x: { grid: { display: false }, ticks: { color: '#64748B' } }
            },
            interaction: { intersect: false, mode: 'index' }
        };
    }

    createGradient(ctx, color, alphaTop, alphaBottom) {
        const grad = ctx.createLinearGradient(0, 0, 0, 300);
        const rgb = this.hexToRgb(color);
        grad.addColorStop(0, `rgba(${rgb},${alphaTop})`);
        grad.addColorStop(1, `rgba(${rgb},${alphaBottom})`);
        return grad;
    }

    hexToRgb(hex) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `${r},${g},${b}`;
    }

    destroy() {
        Object.values(this.charts).forEach(c => c && c.destroy());
    }
}
