/**
 * VisionAPI — bridges the frontend to the StadiumSync Python FastAPI backend.
 * Base URL: http://localhost:8000
 *
 * Usage:
 *   const api = new VisionAPI();
 *   api.onResult = (camId, result) => { ... };
 *   api.startPolling(['cam1','cam2']);
 *   api.stopPolling();
 */
class VisionAPI {
    constructor(baseUrl = 'http://localhost:8000') {
        this.baseUrl = baseUrl;
        this.pollingIntervals = {};
        this.connected = false;
        this.onResult = null;    // callback(camId, resultPayload)
        this.onStatus = null;    // callback(connected)
    }

    // ── Health check ────────────────────────────────────────────────
    async checkHealth() {
        try {
            const res = await fetch(`${this.baseUrl}/health`, { signal: AbortSignal.timeout(2500) });
            const data = await res.json();
            this._setConnected(data.status === 'ok');
            return data;
        } catch {
            this._setConnected(false);
            return null;
        }
    }

    _setConnected(val) {
        if (this.connected !== val) {
            this.connected = val;
            if (typeof this.onStatus === 'function') this.onStatus(val);
        }
    }

    // ── Fetch latest result for one camera via synthetic frame ──────
    async pollCamera(camId) {
        if (!this.connected) return null;
        try {
            const res = await fetch(`${this.baseUrl}/detect/synthetic/${camId}`, {
                method: 'POST',
                signal: AbortSignal.timeout(5000),
            });
            if (!res.ok) return null;
            const data = await res.json();
            if (typeof this.onResult === 'function') this.onResult(camId, data);
            return data;
        } catch {
            return null;
        }
    }

    // ── Upload a user-supplied image (phone / satellite) ─────────────
    async detectUpload(file, sourceType = 'phone', cameraId = 'upload') {
        const form = new FormData();
        form.append('source_type', sourceType);
        form.append('camera_id', cameraId);
        form.append('file', file);
        const res = await fetch(`${this.baseUrl}/detect/image`, { method: 'POST', body: form });
        if (!res.ok) throw new Error(`Detection failed: ${res.status}`);
        return await res.json();
    }

    // ── Get all cameras status ────────────────────────────────────────
    async getCamerasStatus() {
        try {
            const res = await fetch(`${this.baseUrl}/status/cameras`, { signal: AbortSignal.timeout(3000) });
            return res.ok ? await res.json() : null;
        } catch {
            return null;
        }
    }

    // ── Start/stop polling ────────────────────────────────────────────
    startPolling(camIds, intervalMs = 4000) {
        this.checkHealth().then(ok => {
            if (!ok) return;
            camIds.forEach(id => {
                if (this.pollingIntervals[id]) clearInterval(this.pollingIntervals[id]);
                // stagger start so requests don't fire simultaneously
                const delay = camIds.indexOf(id) * 650;
                setTimeout(() => {
                    this.pollCamera(id);
                    this.pollingIntervals[id] = setInterval(() => this.pollCamera(id), intervalMs);
                }, delay);
            });
        });
    }

    stopPolling() {
        Object.values(this.pollingIntervals).forEach(clearInterval);
        this.pollingIntervals = {};
    }
}
