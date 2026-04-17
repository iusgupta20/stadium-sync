class SyncAssistant {
    constructor() {
        this.chatHistory = [];
        this.isTyping = false;
        this.apiKey = '';
        this.model = 'claude-sonnet-4-20250514';
        this.messagesEl = document.querySelector('.chat-messages');
        this.inputEl = document.querySelector('.chat-input-bar input');
        this.sendBtn = document.querySelector('.send-btn');
        this.quickReplies = document.querySelectorAll('.quick-reply');
        this.bindEvents();
    }

    bindEvents() {
        if (this.sendBtn) this.sendBtn.addEventListener('click', () => this.send());
        if (this.inputEl) {
            this.inputEl.addEventListener('keydown', e => { if (e.key === 'Enter') this.send(); });
        }
        this.quickReplies.forEach(btn => {
            btn.addEventListener('click', () => {
                if (this.inputEl) this.inputEl.value = btn.textContent.trim();
                this.send();
            });
        });
    }

    getSystemPrompt() {
        const d = typeof SSyncData !== 'undefined' ? SSyncData : {};
        const v = d.venue || {};
        const ev = d.event || {};
        const zones = (d.zoneAnalytics || []).map(z => `${z.zone}: ${z.current}/${z.capacity} (${z.status})`).join('; ');
        const queueInfo = (d.queues || []).map(q => `${q.name}: ${q.wait}min wait, ${q.people} people`).join('; ');
        const alertInfo = (d.alerts || []).slice(0, 3).map(a => `[${a.type}] ${a.title}`).join('; ');
        const env = d.environment || {};

        return `You are StadiumSync AI, the intelligent assistant for ${v.name || 'the stadium'} during ${ev.league || 'the event'}: ${ev.home?.name || 'Home'} vs ${ev.away?.name || 'Away'}.

CURRENT VENUE STATE:
- Capacity: ${v.capacity?.toLocaleString() || 'N/A'} | Current: ${v.currentOccupancy?.toLocaleString() || 'N/A'} (${v.capacity ? Math.round((v.currentOccupancy / v.capacity) * 100) : 0}%)
- Match Status: ${ev.status || 'N/A'} | Score: ${ev.score?.home || '?'} vs ${ev.score?.away || '?'}
- Zone Occupancy: ${zones || 'N/A'}
- Queues: ${queueInfo || 'N/A'}
- Active Alerts: ${alertInfo || 'None'}
- Environment: Temp ${env.temperature || 'N/A'}, Humidity ${env.humidity || 'N/A'}, AQI ${env.aqi || 'N/A'}, Noise ${env.noise || 'N/A'}

USER CONTEXT:
- Seat: ${d.user?.seat || 'N/A'} | Gate: ${d.user?.gate || 'N/A'}

GUIDELINES:
- Provide concise, actionable stadium guidance
- Reference real-time data (queues, zones, alerts) when relevant
- Prioritize safety — warn about crowded zones or high wait times
- Suggest optimized routes to food, restrooms, merch, exits
- Use friendly tone with occasional cricket/sports context
- Keep responses under 150 words unless detail is requested`;
    }

    async send() {
        const text = this.inputEl?.value?.trim();
        if (!text || this.isTyping) return;
        this.inputEl.value = '';

        this.appendMessage('user', text);
        this.chatHistory.push({ role: 'user', content: text });

        this.showTyping();
        this.isTyping = true;

        try {
            const reply = await this.callAPI(text);
            this.hideTyping();
            this.appendMessage('bot', reply);
            this.chatHistory.push({ role: 'assistant', content: reply });
        } catch (err) {
            this.hideTyping();
            const fallback = this.getLocalResponse(text);
            this.appendMessage('bot', fallback);
            this.chatHistory.push({ role: 'assistant', content: fallback });
        }
        this.isTyping = false;
    }

    async callAPI(userMessage) {
        if (!this.apiKey) {
            return this.getLocalResponse(userMessage);
        }

        const messages = this.chatHistory.slice(-10).map(m => ({
            role: m.role,
            content: m.content
        }));
        messages.push({ role: 'user', content: userMessage });

        const resp = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': this.apiKey,
                'anthropic-version': '2023-06-01',
                'anthropic-dangerous-direct-browser-access': 'true'
            },
            body: JSON.stringify({
                model: this.model,
                max_tokens: 300,
                system: this.getSystemPrompt(),
                messages: messages
            })
        });

        if (!resp.ok) throw new Error(`API ${resp.status}`);
        const data = await resp.json();
        return data.content?.[0]?.text || 'Sorry, I could not process that.';
    }

    getLocalResponse(text) {
        const lower = text.toLowerCase();
        const d = typeof SSyncData !== 'undefined' ? SSyncData : {};

        if (lower.includes('food') || lower.includes('eat') || lower.includes('hungry')) {
            const best = (d.queues || []).filter(q => q.type === 'food').sort((a, b) => a.wait - b.wait)[0];
            return best
                ? `🍔 Shortest food queue: <strong>${best.name}</strong> — ${best.wait} min wait (${best.people} people). Located at ${best.location}, ${best.distance} from you.`
                : 'Food courts are available on multiple levels. Check the Queues tab for live wait times.';
        }
        if (lower.includes('restroom') || lower.includes('bathroom') || lower.includes('toilet')) {
            const best = (d.queues || []).filter(q => q.type === 'facility' && q.icon === 'wc').sort((a, b) => a.wait - b.wait)[0];
            return best
                ? `🚻 Nearest available restroom: <strong>${best.name}</strong> — ${best.wait} min wait. ${best.location}, ${best.distance} from your seat.`
                : 'Restrooms are available on each level. Check Queues tab for availability.';
        }
        if (lower.includes('score') || lower.includes('match') || lower.includes('cricket')) {
            const ev = d.event || {};
            return `🏏 <strong>${ev.home?.short || 'Home'} ${ev.score?.home || '?'}</strong> vs <strong>${ev.away?.short || 'Away'} ${ev.score?.away || '?'}</strong> — ${ev.status || 'Live'}. Over: ${ev.overs?.away || '?'}`;
        }
        if (lower.includes('crowd') || lower.includes('busy') || lower.includes('packed')) {
            const critical = (d.zoneAnalytics || []).filter(z => z.status === 'critical' || z.status === 'high');
            if (critical.length) {
                return `⚠️ High-density zones: ${critical.map(z => `<strong>${z.zone}</strong> (${Math.round(z.current / z.capacity * 100)}%)`).join(', ')}. Consider moving to less crowded sections.`;
            }
            return 'Current crowd levels are manageable across all zones. Enjoy the match!';
        }
        if (lower.includes('exit') || lower.includes('leave') || lower.includes('gate')) {
            return `🚪 Recommended exit: <strong>Gate B</strong> (East Stand) — shortest queue at ${(d.queues || []).find(q => q.id === 'q2')?.wait || 3} min. Avoid Gate A during innings breaks.`;
        }
        if (lower.includes('weather') || lower.includes('rain') || lower.includes('temp')) {
            const env = d.environment || {};
            return `🌤️ Current conditions: ${env.temperature}, Humidity ${env.humidity}, Wind ${env.wind}. ${env.aqi}. UV ${env.uv}.`;
        }
        if (lower.includes('seat') || lower.includes('ticket') || lower.includes('where')) {
            const u = d.user || {};
            return `🎫 Your seat: <strong>${u.seat}</strong>. Enter via <strong>${u.gate}</strong>. Ticket ID: <code>${u.ticket?.id || 'N/A'}</code>`;
        }
        if (lower.includes('help') || lower.includes('what can')) {
            return `I can help with: 🍔 Food & drink queues, 🚻 Nearest restrooms, 🏏 Live score, 🗺️ Crowd & zone info, 🚪 Exit routes, 🌤️ Weather, 🎫 Your ticket info, and more. Just ask!`;
        }
        if (lower.includes('emergency') || lower.includes('medical') || lower.includes('help me')) {
            return `🚨 <strong>Emergency contacts nearby:</strong> Medical station at South Pavilion (2 min walk). For immediate assistance, press the Emergency button in the top bar or call stadium security at the nearest help desk.`;
        }

        return `I'm StadiumSync AI — your in-venue assistant. I can help with food queues, restrooms, crowd info, navigation, match updates, and more. What would you like to know?`;
    }

    appendMessage(type, content) {
        if (!this.messagesEl) return;
        const div = document.createElement('div');
        div.className = `chat-message ${type}`;
        const icon = type === 'bot' ? 'smart_toy' : 'person';
        div.innerHTML = `
            <div class="message-avatar"><span class="material-icons-round" style="font-size:1.2rem">${icon}</span></div>
            <div class="message-content">${content}</div>
        `;
        this.messagesEl.appendChild(div);
        this.messagesEl.scrollTop = this.messagesEl.scrollHeight;
    }

    showTyping() {
        if (!this.messagesEl) return;
        const div = document.createElement('div');
        div.className = 'chat-message bot typing-indicator';
        div.innerHTML = `
            <div class="message-avatar"><span class="material-icons-round" style="font-size:1.2rem">smart_toy</span></div>
            <div class="message-content"><div class="typing-dots"><span></span><span></span><span></span></div></div>
        `;
        this.messagesEl.appendChild(div);
        this.messagesEl.scrollTop = this.messagesEl.scrollHeight;
    }

    hideTyping() {
        const el = this.messagesEl?.querySelector('.typing-indicator');
        if (el) el.remove();
    }

    setApiKey(key) {
        this.apiKey = key;
    }
}
