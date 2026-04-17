const SSyncData = {
    venue: {
        name: 'Arun Jaitley Stadium',
        location: 'Feroz Shah Kotla, New Delhi',
        capacity: 41000,
        currentOccupancy: 34200,
        coords: [28.6377, 77.2433]
    },
    event: {
        league: 'IPL 2026',
        home: { name: 'Delhi Capitals', short: 'DC', color: '#6CABDD' },
        away: { name: 'Chennai Super Kings', short: 'CSK', color: '#F9CD32' },
        score: { home: '186/4', away: '142/6' },
        overs: { home: '20.0', away: '16.3' },
        status: 'Live — 2nd Innings',
        date: 'March 29, 2026 · 7:30 PM IST',
        matchEvents: [
            { over: '0.3', desc: '<strong>Warner</strong> — boundary, cover drive' },
            { over: '3.1', desc: '<strong>Pant</strong> — SIX, over long-on' },
            { over: '6.0', desc: 'Powerplay ends — DC 58/1' },
            { over: '8.4', desc: '<strong>Axar</strong> — WICKET, caught mid-off' },
            { over: '14.2', desc: '<strong>Pant</strong> — 50 off 31 balls' },
            { over: '18.5', desc: '<strong>Powell</strong> — SIX, into the stands' }
        ]
    },
    queues: [
        { id: 'q1', name: 'Gate A Entry', type: 'entry', icon: 'door_front', wait: 8, people: 340, location: 'North Stand', distance: '50m' },
        { id: 'q2', name: 'Gate B Entry', type: 'entry', icon: 'door_front', wait: 3, people: 120, location: 'East Stand', distance: '180m' },
        { id: 'q3', name: 'Gate C VIP', type: 'entry', icon: 'door_front', wait: 1, people: 25, location: 'South Pavilion', distance: '300m' },
        { id: 'q4', name: 'Main Food Court', type: 'food', icon: 'restaurant', wait: 12, people: 180, location: 'West Stand L1', distance: '120m' },
        { id: 'q5', name: 'Drinks Counter', type: 'food', icon: 'local_bar', wait: 6, people: 85, location: 'East Stand L2', distance: '90m' },
        { id: 'q6', name: 'Quick Bites', type: 'food', icon: 'fastfood', wait: 4, people: 45, location: 'North Stand L1', distance: '200m' },
        { id: 'q7', name: 'Restroom A', type: 'facility', icon: 'wc', wait: 5, people: 60, location: 'North Stand L1', distance: '75m' },
        { id: 'q8', name: 'Restroom B', type: 'facility', icon: 'wc', wait: 2, people: 20, location: 'South Stand L2', distance: '250m' },
        { id: 'q9', name: 'Merch Store', type: 'merchandise', icon: 'storefront', wait: 7, people: 95, location: 'Main Concourse', distance: '160m' },
        { id: 'q10', name: 'Premium Lounge', type: 'facility', icon: 'lounge', wait: 1, people: 15, location: 'Pavilion L3', distance: '350m' },
        { id: 'q11', name: 'South Food Kiosk', type: 'food', icon: 'lunch_dining', wait: 9, people: 130, location: 'South Stand L1', distance: '280m' },
        { id: 'q12', name: 'ATM Counter', type: 'facility', icon: 'atm', wait: 4, people: 30, location: 'Main Concourse', distance: '140m' }
    ],
    alerts: [
        { id: 'a1', type: 'critical', title: 'North Stand Overcrowding', message: 'Zone N-02 at 92% capacity. Diverting flow to adjacent zones.', time: '2 min ago', icon: 'warning' },
        { id: 'a2', type: 'warning', title: 'Gate A Queue Building', message: 'Wait time exceeding 15 minutes. Additional lane recommended.', time: '5 min ago', icon: 'group' },
        { id: 'a3', type: 'info', title: 'Rain Forecast Update', message: 'Light drizzle expected at 9:15 PM. Retractable covers on standby.', time: '8 min ago', icon: 'cloud' },
        { id: 'a4', type: 'success', title: 'Medical Response Clear', message: 'Section E-14 medical incident resolved. All-clear issued.', time: '12 min ago', icon: 'check_circle' },
        { id: 'a5', type: 'warning', title: 'Temp Spike — West Stand', message: 'Zone W-01 temperature at 34°C. Misting systems activated.', time: '15 min ago', icon: 'thermostat' },
        { id: 'a6', type: 'info', title: 'VIP Convoy Arrival', message: 'VVIP party arriving Gate D. Security perimeter established.', time: '20 min ago', icon: 'verified' },
        { id: 'a7', type: 'critical', title: 'Power Fluctuation', message: 'Sector 4 transformer showing irregular voltage. Backup engaged.', time: '25 min ago', icon: 'bolt' },
        { id: 'a8', type: 'info', title: 'Innings Break', message: 'Strategic timeout in 3 overs. Concourse rush expected.', time: '30 min ago', icon: 'sports_cricket' }
    ],
    cameras: [
        { id: 'cam1', name: 'North Stand Panoramic', location: 'Tower A — North', resolution: '4K HDR', people: 4200, anomaly: false, aiInsight: 'Crowd density stable. Movement patterns normal.', detections: { faces: 3850, bags: 620, phones: 1100 } },
        { id: 'cam2', name: 'Gate A Entrance', location: 'Main Gate — North', resolution: '4K', people: 340, anomaly: true, aiInsight: 'Queue buildup detected. Recommending additional screening lane.', detections: { faces: 310, bags: 280, phones: 95 } },
        { id: 'cam3', name: 'West Concourse', location: 'Concourse — West L1', resolution: '1080p', people: 890, anomaly: false, aiInsight: 'Moderate foot traffic. No congestion points identified.', detections: { faces: 750, bags: 340, phones: 290 } },
        { id: 'cam4', name: 'South Pavilion', location: 'VIP Area — South', resolution: '4K HDR', people: 180, anomaly: false, aiInsight: 'Low density. VIP zone operating below threshold.', detections: { faces: 170, bags: 95, phones: 88 } },
        { id: 'cam5', name: 'Food Court Overview', location: 'West Stand L1 — Interior', resolution: '1080p', people: 560, anomaly: true, aiInsight: 'Congestion near Counter 3. Suggest crowd rerouting via digital signage.', detections: { faces: 480, bags: 210, phones: 310 } },
        { id: 'cam6', name: 'East Stand Upper', location: 'Tower B — East', resolution: '4K', people: 3100, anomaly: false, aiInsight: 'Section filling as expected. Exit routes clear.', detections: { faces: 2900, bags: 500, phones: 860 } }
    ],
    foodMenu: [
        { name: 'Butter Chicken Bowl', category: 'Main Course', emoji: '🍛', price: 320, wait: 8, rating: 4.5, reviews: 230, popular: true, available: true },
        { name: 'Paneer Tikka Wrap', category: 'Quick Bites', emoji: '🌯', price: 180, wait: 4, rating: 4.2, reviews: 180, popular: false, available: true },
        { name: 'Masala Dosa', category: 'South Indian', emoji: '🥞', price: 150, wait: 6, rating: 4.6, reviews: 310, popular: true, available: true },
        { name: 'Veg Biryani', category: 'Main Course', emoji: '🍚', price: 250, wait: 10, rating: 4.3, reviews: 145, popular: false, available: true },
        { name: 'Cold Coffee', category: 'Beverages', emoji: '☕', price: 120, wait: 3, rating: 4.1, reviews: 420, popular: true, available: true },
        { name: 'Mango Lassi', category: 'Beverages', emoji: '🥤', price: 100, wait: 2, rating: 4.7, reviews: 390, popular: false, available: true },
        { name: 'Samosa Plate', category: 'Snacks', emoji: '🔺', price: 80, wait: 3, rating: 4.0, reviews: 510, popular: false, available: true },
        { name: 'Ice Cream Sundae', category: 'Desserts', emoji: '🍨', price: 200, wait: 5, rating: 4.8, reviews: 275, popular: true, available: false },
        { name: 'Chicken 65', category: 'Snacks', emoji: '🍗', price: 220, wait: 7, rating: 4.4, reviews: 190, popular: false, available: true }
    ],
    merchItems: [
        { name: 'DC Jersey 2026', emoji: '👕', price: 2499, popular: true },
        { name: 'DC Cap', emoji: '🧢', price: 799, popular: false },
        { name: 'LED Fan Baton', emoji: '✨', price: 499, popular: true },
        { name: 'Team Scarf', emoji: '🧣', price: 599, popular: false },
        { name: 'Mini Bat Signed', emoji: '🏏', price: 3999, popular: true },
        { name: 'DC Water Bottle', emoji: '💧', price: 349, popular: false }
    ],
    user: {
        name: 'Demo User',
        initials: 'DU',
        seat: 'Block D · Row 12 · Seat 7',
        gate: 'Gate A',
        ticket: { id: 'SSYNC-2026-DC-07412', section: 'D', row: '12', seat: '7', type: 'Premium' }
    },
    zoneAnalytics: [
        { zone: 'North Stand', capacity: 8500, current: 7820, status: 'critical' },
        { zone: 'East Stand', capacity: 9000, current: 6300, status: 'moderate' },
        { zone: 'South Pavilion', capacity: 5500, current: 3200, status: 'low' },
        { zone: 'West Stand', capacity: 9000, current: 8100, status: 'high' },
        { zone: 'Upper Deck N', capacity: 5000, current: 4600, status: 'high' },
        { zone: 'Upper Deck S', capacity: 4000, current: 2100, status: 'low' }
    ],
    revenue: {
        total: 2847000,
        food: 1240000,
        merch: 680000,
        tickets: 927000,
        hourly: [
            { hour: '5 PM', val: 120000 },
            { hour: '6 PM', val: 380000 },
            { hour: '7 PM', val: 620000 },
            { hour: '7:30 PM', val: 840000 },
            { hour: '8 PM', val: 540000 },
            { hour: '8:30 PM', val: 347000 }
        ]
    },
    incidents: [
        { time: '20:15', id: 'INC-041', type: 'Medical', severity: 'warning', location: 'E-14', detail: 'Fan fainted — heat exhaustion. First aid deployed.' },
        { time: '19:48', id: 'INC-040', type: 'Security', severity: 'critical', location: 'N-02', detail: 'Unauthorized entry attempt at restricted zone.' },
        { time: '19:30', id: 'INC-039', type: 'Facility', severity: 'info', location: 'W-01', detail: 'Restroom A overflow sensor triggered. Maintenance dispatched.' },
        { time: '19:12', id: 'INC-038', type: 'Crowd', severity: 'warning', location: 'Gate A', detail: 'Queue exceeded 300 people. Opened additional lane.' },
        { time: '18:55', id: 'INC-037', type: 'Medical', severity: 'info', location: 'S-08', detail: 'Minor cut treated on-site. No further action.' }
    ],
    environment: {
        temperature: '32°C',
        humidity: '58%',
        wind: '12 km/h NW',
        aqi: 'AQI 85 — Moderate',
        noise: '94 dB',
        uv: 'UV 2 — Low'
    }
};
