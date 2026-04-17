# StadiumSync — Smart Venue Intelligence & Safety Platform

StadiumSync is an advanced in-venue management platform designed to optimize fan experience and stadium safety during high-density sporting events.

---

## 🎯 1. Chosen Vertical: Smart Venue & Crowd Safety
We chose the **Smart Venue** vertical because live sporting events (like IPL matches) present unique challenges in crowd control, emergency response, and facility management. StadiumSync addresses these by providing real-time data visibility to both administrators and fans.

## 🧠 2. Approach & Logic
Our approach focuses on **predictive and reactive intelligence**:
- **Google Services Integration:** Meaningful use of **Google Maps API**, **Google Material Icons**, **Google Fonts**, and **Google Cloud Run (Dockerized)**.
- **Dynamic Decision Making:** The system doesn't just display data; it makes logical decisions. If a zone exceeds 85% capacity, the AI assistant automatically prioritizes exit guidance and redirects fans to less crowded food stalls or restrooms.
- **AI-Human Hybrid Monitoring:** While the dashboard provides raw data, the **AI Assistant** acts as a context-aware bridge, interpreting queue times and safety alerts for the user in natural language.

## 🛠️ 3. How the Solution Works
- **Real-Time Dashboard:** Uses **Chart.js** to visualize attendance trends and revenue hourly.
- **Interactive Venue Map:** A custom HTML5 Canvas-based heatmap renders dynamic occupancy levels. It supports layers for "Density", "Flow", "Exits", and "Amenities".
- **Queue Management Engine:** A simulated real-time data service (`js/data.js`) feeds live wait times for entry gates and food courts into the UI.
- **AI Assistant Interface:** Integrated with the Anthropic API (via client-side keys) to provide intelligent navigation and match updates based on the current JSON state of the venue.

## 🌐 4. Google Services Integration
This solution meaningfully integrates several Google services to demonstrate real-world scalability:
- **Google Maps API Embedding:** Integrated into the **Navigation** module to provide live geographical context for the Arun Jaitley Stadium.
- **Google Cloud Run (Infrastructure as Code):** Provided a `Dockerfile` for seamless deployment to Google's container-based serverless platform.
- **Google Material Icons & Fonts:** Uses **Material Icons Round** and **Google Fonts (Inter, JetBrains Mono)** for an inclusive and premium UI/UX.
- **Google AI Readiness:** The assistant logic is optimized for integration with **Google Gemini API** (via Vertex AI).

## 🔒 5. Security & Privacy
- **PII Sanitization:** The repository is fully sanitized for public release. No real names or personal identifying information are stored.
- **Safe Key Handling:** AI API keys are handled in-memory only via a password-type input field, ensuring keys are never logged or pushed to version control.

## 📝 6. Assumptions Made
- We assume the user has a modern browser with Canvas and JavaScript enabled.
- We assume the user will provide their own Anthropic API key in the settings to enable the full capabilities of the "StadiumSync AI" assistant.
- Local storage or in-memory state is sufficient for this demo version of the platform.

---
**Repository Details:**
- **Branch:** Single branch (`main`) as per rules.
- **Size:** ~156 KB (Well within the 1 MB limit).
- **Type:** Public.
