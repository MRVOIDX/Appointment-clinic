/**
 * Chat Interface for DARSEHHA Medical Clinic
 * Handles AI chatbot interactions for appointment booking
 */

class ChatInterface {
    constructor() {
        this.chatMessages = document.getElementById('chatMessages');
        this.messageInput = document.getElementById('messageInput');
        this.chatForm = document.getElementById('chatForm');
        this.sendButton = document.getElementById('sendButton');
        this.resetButton = document.getElementById('resetChat');
        this.typingIndicator = document.getElementById('typingIndicator');
        this.quickActions = document.querySelectorAll('.quick-action');
        
        this.isWaitingForResponse = false;
        this.appointmentInProgress = false;
        
        this.init();
    }
    
    init() {
        // Event listeners
        this.chatForm.addEventListener('submit', (e) => this.handleSendMessage(e));
        this.resetButton.addEventListener('click', () => this.resetConversation());
        
        // Quick action buttons
        this.quickActions.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const message = e.currentTarget.dataset.message;
                this.sendMessage(message);
            });
        });
        
        // Auto-focus input
        this.messageInput.focus();
        
        // Enter key to send
        this.messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.chatForm.dispatchEvent(new Event('submit'));
            }
        });
    }
    
    async handleSendMessage(e) {
        e.preventDefault();
        
        const message = this.messageInput.value.trim();
        if (!message || this.isWaitingForResponse) return;
        
        await this.sendMessage(message);
    }
    
    async sendMessage(message) {
        if (this.isWaitingForResponse) return;
        
        // Clear input and disable form
        this.messageInput.value = '';
        this.setInputState(false);
        
        // Add user message to chat
        this.addMessage(message, 'user');
        
        // Show typing indicator
        this.showTypingIndicator();
        
        try {
            // Send message to chatbot API
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ message: message })
            });
            
            const data = await response.json();
            
            // Hide typing indicator
            this.hideTypingIndicator();
            
            if (data.success) {
                // Add bot response
                this.addMessage(data.response, 'bot');
                
                // Check if appointment is completed
                if (data.completed) {
                    await this.handleAppointmentCompletion();
                }
            } else {
                this.addMessage(
                    `I apologize, but I encountered an error: ${data.error}. Please try again or contact us directly.`,
                    'bot'
                );
            }
            
        } catch (error) {
            console.error('Chat error:', error);
            this.hideTypingIndicator();
            this.addMessage(
                'I\'m sorry, but I\'m having trouble connecting right now. Please try again in a moment or contact us directly.',
                'bot'
            );
        } finally {
            // Re-enable form
            this.setInputState(true);
        }
    }
    
    addMessage(content, type) {
        const messageWrapper = document.createElement('div');
        messageWrapper.className = 'message-wrapper mb-3';
        
        const messageDiv = document.createElement('div');
        messageDiv.className = `${type}-message`;
        
        const messageBubble = document.createElement('div');
        messageBubble.className = `message-bubble ${type}`;
        
        const messageContent = document.createElement('div');
        messageContent.className = 'message-content';
        
        if (type === 'bot') {
            // Format bot messages with potential line breaks and icons
            messageContent.innerHTML = this.formatBotMessage(content);
        } else {
            messageContent.textContent = content;
        }
        
        const messageTime = document.createElement('div');
        messageTime.className = 'message-time';
        messageTime.textContent = this.getCurrentTime();
        
        messageBubble.appendChild(messageContent);
        messageBubble.appendChild(messageTime);
        messageDiv.appendChild(messageBubble);
        messageWrapper.appendChild(messageDiv);
        
        this.chatMessages.appendChild(messageWrapper);
        this.scrollToBottom();
    }
    
    formatBotMessage(content) {
        // Convert newlines to HTML breaks
        content = content.replace(/\n/g, '<br>');
        
        // Add icons for emojis if present
        content = content.replace(/👤/g, '<i class="fas fa-user text-primary"></i>');
        content = content.replace(/📞/g, '<i class="fas fa-phone text-primary"></i>');
        content = content.replace(/📧/g, '<i class="fas fa-envelope text-primary"></i>');
        content = content.replace(/🎂/g, '<i class="fas fa-birthday-cake text-primary"></i>');
        content = content.replace(/👫/g, '<i class="fas fa-venus-mars text-primary"></i>');
        content = content.replace(/🏥/g, '<i class="fas fa-hospital text-primary"></i>');
        content = content.replace(/📅/g, '<i class="fas fa-calendar text-primary"></i>');
        content = content.replace(/⏰/g, '<i class="fas fa-clock text-primary"></i>');
        content = content.replace(/📝/g, '<i class="fas fa-notes-medical text-primary"></i>');
        
        return content;
    }
    
    showTypingIndicator() {
        this.typingIndicator.style.display = 'block';
        this.scrollToBottom();
    }
    
    hideTypingIndicator() {
        this.typingIndicator.style.display = 'none';
    }
    
    setInputState(enabled) {
        this.isWaitingForResponse = !enabled;
        this.messageInput.disabled = !enabled;
        this.sendButton.disabled = !enabled;
        
        if (enabled) {
            this.messageInput.focus();
        }
    }
    
    scrollToBottom() {
        setTimeout(() => {
            this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
        }, 100);
    }
    
    getCurrentTime() {
        return new Date().toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
    }
    
    async handleAppointmentCompletion() {
        try {
            // Process the completed appointment
            const response = await fetch('/api/chat/book-appointment', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            const data = await response.json();
            
            if (data.success) {
                // Save appointment to local storage (same as existing system)
                if (typeof clinicStorage !== 'undefined') {
                    try {
                        clinicStorage.saveAppointment(data.appointment);
                    } catch (storageError) {
                        console.warn('Could not save to local storage:', storageError);
                    }
                }
                
                // Show success modal
                this.showSuccessModal();
                
                // Add final confirmation message
                setTimeout(() => {
                    this.addMessage(
                        'Perfect! Your appointment has been saved to your account. You can view all your appointments in the "My Appointments" section.',
                        'bot'
                    );
                }, 1000);
                
            } else {
                this.addMessage(
                    `I apologize, but there was an issue saving your appointment: ${data.error}. Please try booking through our regular form or contact us directly.`,
                    'bot'
                );
            }
            
        } catch (error) {
            console.error('Appointment completion error:', error);
            this.addMessage(
                'Your appointment details have been collected, but there was an issue saving them. Please try booking through our regular form or contact us directly.',
                'bot'
            );
        }
    }
    
    showSuccessModal() {
        const modal = new bootstrap.Modal(document.getElementById('appointmentSuccessModal'));
        modal.show();
    }
    
    async resetConversation() {
        if (confirm('Are you sure you want to start a new conversation? This will clear the current chat.')) {
            try {
                // Reset conversation on server
                await fetch('/api/chat/reset', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
                
                // Clear chat messages except welcome message
                const welcomeMessage = this.chatMessages.firstElementChild;
                this.chatMessages.innerHTML = '';
                this.chatMessages.appendChild(welcomeMessage);
                
                // Reset state
                this.appointmentInProgress = false;
                this.setInputState(true);
                
                this.addMessage(
                    'Great! I\'ve started a new conversation. How can I help you today?',
                    'bot'
                );
                
            } catch (error) {
                console.error('Reset error:', error);
                // Just clear the UI even if server reset fails
                const welcomeMessage = this.chatMessages.firstElementChild;
                this.chatMessages.innerHTML = '';
                this.chatMessages.appendChild(welcomeMessage);
                this.setInputState(true);
            }
        }
    }
    
    // Utility method to show alerts
    showAlert(type, message) {
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type === 'error' ? 'danger' : 'success'} alert-dismissible fade show`;
        alertDiv.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        // Insert at top of container
        const container = document.querySelector('.container-fluid');
        container.insertBefore(alertDiv, container.firstChild);
        
        // Auto-dismiss after 5 seconds
        setTimeout(() => {
            if (alertDiv.parentNode) {
                alertDiv.remove();
            }
        }, 5000);
    }
}

// Initialize chat interface when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Only initialize if we're on the chat page
    if (document.getElementById('chatMessages')) {
        window.chatInterface = new ChatInterface();
    }
});

// Export for potential external use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ChatInterface;
}