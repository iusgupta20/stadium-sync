/**
 * AI Assistant Logic for StadiumSync
 * Handles the virtual assistant interactions in the "Assistant" view.
 */

class SyncAssistant {
    constructor() {
        this.messagesContainer = document.getElementById('chat-messages');
        this.input = document.getElementById('chat-input');
        this.sendBtn = document.getElementById('chat-send-btn');
        this.quickReplies = document.querySelectorAll('.quick-reply');
        
        // Simple context parsing map for simulation
        this.knowledgeBase = {
            'restroom': 'The nearest restroom to your seat (Sec 204) is Men\'s/Women\'s Restroom Block C in Section 205. Waiting time is currently low (1-4 mins).',
            'food': 'The shortest food queue right now is Burger Station at Concourse B (3 min wait). Would you like directions?',
            'seat': 'You are in Section 204, Row F, Seat 12. From your current location, head towards Gate B and take the stairs to Level 1.',
            'alert': 'Yes, there is an active alert: Concourse A is experiencing heavy foot traffic. Also, there is a 20% discount at the main merch store right now.',
            'parking': 'You parked in Lot B, Space 47. Do you want me to navigate you back there after the match?',
            'hello': 'Hello Ayush! How can I assist you with your stadium experience today?',
            'ticket': 'Your ticket is for Section 204, Row F, Seat 12. You can access the digital QR code from Settings -> Profile & Ticket.',
            'default': 'I am SyncBot, powered by Google Gemini. While I\'m just a simulation right now, in the real app I would process your request via AI and provide venue-specific answers.'
        };

        this.init();
    }

    init() {
        if(!this.messagesContainer || !this.input || !this.sendBtn) return;

        // Event Listeners
        this.sendBtn.addEventListener('click', () => this.handleSend());
        this.input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleSend();
        });

        this.quickReplies.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const query = e.target.getAttribute('data-query');
                if (query) {
                    this.input.value = query;
                    this.handleSend();
                }
            });
        });
    }

    handleSend() {
        const text = this.input.value.trim();
        if (!text) return;

        // Clear input
        this.input.value = '';

        // Add user message
        this.appendMessage(text, 'user');

        // Scroll to bottom
        this.scrollToBottom();

        // Simulate thinking delay
        this.showTypingIndicator();

        setTimeout(() => {
            this.removeTypingIndicator();
            const response = this.generateResponse(text);
            this.appendMessage(response, 'bot');
            this.scrollToBottom();
        }, 1200 + Math.random() * 1000);
    }

    generateResponse(text) {
        text = text.toLowerCase();
        
        for (const [key, response] of Object.entries(this.knowledgeBase)) {
            if (text.includes(key)) {
                return response;
            }
        }
        
        return this.knowledgeBase['default'];
    }

    appendMessage(text, sender) {
        const div = document.createElement('div');
        div.className = `chat-message ${sender}`;
        
        const avatarStr = sender === 'bot' 
            ? '<span class="material-icons-round">smart_toy</span>' 
            : 'AS';
            
        div.innerHTML = `
            <div class="message-avatar">${avatarStr}</div>
            <div class="message-content"><p>${text}</p></div>
        `;
        
        this.messagesContainer.appendChild(div);
    }

    showTypingIndicator() {
        if (document.getElementById('typing-indicator')) return;

        const div = document.createElement('div');
        div.className = 'chat-message bot';
        div.id = 'typing-indicator';
        
        div.innerHTML = `
            <div class="message-avatar"><span class="material-icons-round">smart_toy</span></div>
            <div class="message-content">
                <div class="typing-dots">
                    <span></span><span></span><span></span>
                </div>
            </div>
        `;
        
        this.messagesContainer.appendChild(div);
        this.scrollToBottom();
    }

    removeTypingIndicator() {
        const indicator = document.getElementById('typing-indicator');
        if (indicator) {
            indicator.remove();
        }
    }

    scrollToBottom() {
        this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    }
}
