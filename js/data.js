// Mock Data for StadiumSync

const SSyncData = {
    // Venue Info
    venue: {
        name: "Etihad Stadium",
        capacity: 53400,
        currentAttendance: 46458, // 87%
    },

    // Current Event
    event: {
        homeTeam: "Manchester City",
        awayTeam: "Arsenal",
        score: { home: 2, away: 1 },
        time: "67:23",
        period: "2nd Half"
    },

    // Quick Stats
    stats: {
        crowdDensity: 87,
        avgWaitTime: 4.2,
        flowStatus: "Normal",
        safetyStatus: "Green"
    },

    // Queues / POIs
    queues: [
        { id: "q1", name: "Burger Station (Concourse B)", type: "food", waitTime: 3, distance: 45, crowdTrend: "down", location: "Sec 204" },
        { id: "q2", name: "Men's Restroom Block C", type: "restroom", waitTime: 1, distance: 60, crowdTrend: "stable", location: "Sec 205" },
        { id: "q3", name: "Women's Restroom Block C", type: "restroom", waitTime: 4, distance: 60, crowdTrend: "up", location: "Sec 205" },
        { id: "q4", name: "City Store Main", type: "merch", waitTime: 12, distance: 210, crowdTrend: "up", location: "Level 1" },
        { id: "q5", name: "Gate B Exit", type: "entry", waitTime: 0, distance: 180, crowdTrend: "stable", location: "Ground" },
        { id: "q6", name: "Beer Kiosk 4", type: "food", waitTime: 7, distance: 85, crowdTrend: "up", location: "Sec 208" },
        { id: "q7", name: "First Aid Station", type: "other", waitTime: 0, distance: 120, crowdTrend: "stable", location: "Sec 210" },
        { id: "q8", name: "VIP Lounge Access", type: "entry", waitTime: 2, distance: 300, crowdTrend: "stable", location: "Level 2" }
    ],

    // Live Alerts
    alerts: [
        { id: "a1", type: "info", title: "Merch Discount", message: "20% off all jerseys at the main store until the 75th minute.", time: "2m ago" },
        { id: "a2", type: "warning", title: "Crowded Concourse", message: "Concourse A (Sections 101-105) is experiencing heavy foot traffic.", time: "8m ago" },
        { id: "a3", type: "info", title: "Weather Update", message: "Light rain expected in 15 minutes. Roof is closing.", time: "12m ago" },
        { id: "a4", type: "critical", title: "Exit Re-routing", message: "Gate D is temporarily closed for maintenance. Please use Gate C.", time: "25m ago" }
    ],

    // User Data
    user: {
        name: "Ayush S.",
        ticket: {
            section: "204",
            row: "F",
            seat: "12",
            gate: "B"
        },
        parking: "Lot B, Space 47"
    }
};
