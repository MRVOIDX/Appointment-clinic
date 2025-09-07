/**
 * Floating Chat Widget for DARSEHHA Medical Clinic
 * Provides quick access to AI assistant from any page
 */

class ChatWidget {
    constructor() {
        this.widget = document.getElementById('chatWidget');
        this.toggleBtn = document.getElementById('chatWidgetToggle');
        this.messagesContainer = document.getElementById('widgetChatMessages');
        this.messageInput = document.getElementById('widgetMessageInput');
        this.sendBtn = document.getElementById('widgetSendBtn');
        this.minimizeBtn = document.querySelector('.chat-minimize');
        this.closeBtn = document.querySelector('.chat-close');
        
        this.isOpen = false;
        this.isMinimized = false;
        this.isWaitingForResponse = false;
        
        this.init();
    }
    
    init() {
        // Event listeners
        this.toggleBtn.addEventListener('click', () => this.toggleWidget());
        this.minimizeBtn.addEventListener('click', () => this.minimizeWidget());
        this.closeBtn.addEventListener('click', () => this.closeWidget());
        this.sendBtn.addEventListener('click', () => this.sendMessage());
        
        // Input event listeners
        this.messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.sendMessage();
            }
        });
        
        // Auto-show widget on pages where it might be useful
        this.autoShowOnRelevantPages();
    }
    
    toggleWidget() {
        if (this.isOpen) {
            this.closeWidget();
        } else {
            this.openWidget();
        }
    }
    
    openWidget() {
        this.widget.classList.add('show');
        this.widget.classList.remove('widget-minimized');
        this.toggleBtn.classList.add('widget-open');
        this.isOpen = true;
        this.isMinimized = false;
        
        // Focus input
        setTimeout(() => {
            this.messageInput.focus();
        }, 300);
        
        // Scroll to bottom
        this.scrollToBottom();
    }
    
    closeWidget() {
        this.widget.classList.remove('show', 'widget-minimized');
        this.toggleBtn.classList.remove('widget-open');
        this.isOpen = false;
        this.isMinimized = false;
    }
    
    minimizeWidget() {
        if (this.isMinimized) {
            this.widget.classList.remove('widget-minimized');
            this.isMinimized = false;
            this.messageInput.focus();
        } else {
            this.widget.classList.add('widget-minimized');
            this.isMinimized = true;
        }
    }
    
    async sendMessage() {
        const message = this.messageInput.value.trim();
        if (!message || this.isWaitingForResponse) return;
        
        // Add user message
        this.addMessage(message, 'user');
        this.messageInput.value = '';
        this.setInputState(false);
        
        // Show typing indicator
        this.showTypingIndicator();
        
        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ message: message })
            });
            
            const data = await response.json();
            this.hideTypingIndicator();
            
            if (data.success) {
                this.addMessage(data.response, 'bot');
                
                // Check if appointment is completed
                if (data.completed) {
                    await this.handleAppointmentCompletion();
                }
            } else {
                this.addMessage(
                    `I apologize, but I encountered an error. Please try again or use the full chat interface.`,
                    'bot'
                );
            }
            
        } catch (error) {
            console.error('Widget chat error:', error);
            this.hideTypingIndicator();
            this.addMessage(
                'I\'m having trouble connecting. Please try the full chat interface.',
                'bot'
            );
        } finally {
            this.setInputState(true);
        }
    }
    
    addMessage(content, type) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `widget-message ${type}-message`;
        
        const messageBubble = document.createElement('div');
        messageBubble.className = 'message-bubble';
        
        if (type === 'bot') {
            messageBubble.innerHTML = this.formatBotMessage(content);
        } else {
            messageBubble.textContent = content;
        }
        
        messageDiv.appendChild(messageBubble);
        this.messagesContainer.appendChild(messageDiv);
        this.scrollToBottom();
    }
    
    formatBotMessage(content) {
        // Simple formatting for widget
        return content
            .replace(/\n/g, '<br>')
            .replace(/👤/g, '<i class="fas fa-user text-primary"></i>')
            .replace(/📞/g, '<i class="fas fa-phone text-primary"></i>')
            .replace(/📧/g, '<i class="fas fa-envelope text-primary"></i>')
            .replace(/🎂/g, '<i class="fas fa-birthday-cake text-primary"></i>')
            .replace(/👫/g, '<i class="fas fa-venus-mars text-primary"></i>')
            .replace(/🏥/g, '<i class="fas fa-hospital text-primary"></i>')
            .replace(/📅/g, '<i class="fas fa-calendar text-primary"></i>')
            .replace(/⏰/g, '<i class="fas fa-clock text-primary"></i>')
            .replace(/📝/g, '<i class="fas fa-notes-medical text-primary"></i>');
    }
    
    showTypingIndicator() {
        const typingDiv = document.createElement('div');
        typingDiv.className = 'widget-message bot-message typing-indicator';
        typingDiv.innerHTML = `
            <div class="message-bubble">
                <div class="widget-typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
            </div>
        `;
        this.messagesContainer.appendChild(typingDiv);
        this.scrollToBottom();
    }
    
    hideTypingIndicator() {
        const typingIndicator = this.messagesContainer.querySelector('.typing-indicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }
    
    setInputState(enabled) {
        this.isWaitingForResponse = !enabled;
        this.messageInput.disabled = !enabled;
        this.sendBtn.disabled = !enabled;
        
        if (enabled && this.isOpen && !this.isMinimized) {
            this.messageInput.focus();
        }
    }
    
    scrollToBottom() {
        setTimeout(() => {
            this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
        }, 100);
    }
    
    async handleAppointmentCompletion() {
        try {
            const response = await fetch('/api/chat/book-appointment', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            const data = await response.json();
            
            if (data.success) {
                // Save to local storage if available
                if (typeof clinicStorage !== 'undefined') {
                    try {
                        clinicStorage.saveAppointment(data.appointment);
                    } catch (storageError) {
                        console.warn('Could not save to local storage:', storageError);
                    }
                }
                
                // Add confirmation message
                setTimeout(() => {
                    this.addMessage(
                        'Great! Your appointment has been saved. You can view it in "My Appointments".',
                        'bot'
                    );
                    
                    // Add action buttons
                    this.addActionButtons();
                }, 1000);
                
            } else {
                this.addMessage(
                    `There was an issue saving your appointment: ${data.error}. Please use the full booking form.`,
                    'bot'
                );
            }
            
        } catch (error) {
            console.error('Widget appointment completion error:', error);
            this.addMessage(
                'Your appointment details were collected but couldn\'t be saved. Please use the full booking form.',
                'bot'
            );
        }
    }
    
    addActionButtons() {
        const actionDiv = document.createElement('div');
        actionDiv.className = 'widget-message bot-message';
        actionDiv.innerHTML = `
            <div class="message-bubble" style="text-align: center; padding: 15px;">
                <div class="d-flex flex-column gap-2">
                    <a href="/my-appointments" class="btn btn-primary btn-sm">
                        <i class="fas fa-calendar-check me-1"></i>
                        View My Appointments
                    </a>
                    <button class="btn btn-outline-secondary btn-sm" onclick="chatWidget.startNewBooking()">
                        <i class="fas fa-plus me-1"></i>
                        Book Another Appointment
                    </button>
                </div>
            </div>
        `;
        this.messagesContainer.appendChild(actionDiv);
        this.scrollToBottom();
    }
    
    startNewBooking() {
        // Reset conversation
        fetch('/api/chat/reset', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        }).then(() => {
            // Clear messages except the welcome message
            const welcomeMessage = this.messagesContainer.firstElementChild;
            this.messagesContainer.innerHTML = '';
            this.messagesContainer.appendChild(welcomeMessage);
            
            // Add new booking message
            this.addMessage('I\'d be happy to help you book another appointment! What\'s your full name?', 'bot');
        });
    }
    
    autoShowOnRelevantPages() {
        // Auto-show widget on certain pages after a delay
        const currentPath = window.location.pathname;
        const relevantPages = ['/home', '/book-appointment', '/my-appointments'];
        
        if (relevantPages.includes(currentPath)) {
            setTimeout(() => {
                // Show a subtle notification
                this.showQuickTip();
            }, 3000);
        }
    }
    
    showQuickTip() {
        // Add a subtle pulse animation to the toggle button
        this.toggleBtn.style.animation = 'pulse 2s infinite';
        
        // Remove animation after a few pulses
        setTimeout(() => {
            this.toggleBtn.style.animation = '';
        }, 6000);
    }
    
    // Utility method for full screen chat
    openFullChat() {
        window.location.href = '/chat';
    }
}

// CSS animation for pulse effect
const style = document.createElement('style');
style.textContent = `
    @keyframes pulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.05); }
        100% { transform: scale(1); }
    }
`;
document.head.appendChild(style);

// Initialize chat widget when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Only initialize if the widget exists (user is logged in)
    if (document.getElementById('chatWidget')) {
        window.chatWidget = new ChatWidget();
    }
});

// Export for potential external use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ChatWidget;
}