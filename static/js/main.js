// Medical Clinic JavaScript
document.addEventListener('DOMContentLoaded', function() {
    
    // Initialize tooltips
    var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });

    // Form validation and enhancement
    const appointmentForm = document.getElementById('appointmentForm');
    if (appointmentForm) {
        // Set minimum date to today
        const dateInput = document.getElementById('appointment_date');
        if (dateInput) {
            const today = new Date().toISOString().split('T')[0];
            dateInput.min = today;
        }

        // Set maximum birth date to today
        const dobInput = document.getElementById('date_of_birth');
        if (dobInput) {
            const today = new Date().toISOString().split('T')[0];
            dobInput.max = today;
        }

        // Form submission handling
        appointmentForm.addEventListener('submit', function(e) {
            const submitBtn = this.querySelector('button[type="submit"]');
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Booking...';
                
                // Re-enable button after 5 seconds in case of error
                setTimeout(() => {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = '<i class="fas fa-calendar-check me-2"></i>Book Appointment';
                }, 5000);
            }
        });

        // Phone number formatting
        const phoneInput = document.getElementById('phone');
        if (phoneInput) {
            phoneInput.addEventListener('input', function(e) {
                let value = e.target.value.replace(/\D/g, '');
                if (value.length >= 6) {
                    value = value.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3');
                } else if (value.length >= 3) {
                    value = value.replace(/(\d{3})(\d{3})/, '($1) $2');
                }
                e.target.value = value;
            });
        }
    }

    // Admin Dashboard functionality
    const appointmentsTable = document.getElementById('appointmentsTable');
    if (appointmentsTable) {
        // Filter buttons
        const allBtn = document.getElementById('allAppointments');
        const pendingBtn = document.getElementById('pendingAppointments');
        
        if (allBtn && pendingBtn) {
            allBtn.addEventListener('click', function() {
                filterAppointments('all');
                updateFilterButtons(this);
            });
            
            pendingBtn.addEventListener('click', function() {
                filterAppointments('pending');
                updateFilterButtons(this);
            });
        }
    }

    // Auto-dismiss alerts after 5 seconds
    const alerts = document.querySelectorAll('.alert');
    alerts.forEach(alert => {
        setTimeout(() => {
            const bsAlert = new bootstrap.Alert(alert);
            bsAlert.close();
        }, 5000);
    });

    // Smooth scrolling for anchor links with offset for fixed navbar
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                const navbarHeight = document.querySelector('.navbar').offsetHeight;
                const targetPosition = target.offsetTop - navbarHeight - 20; // 20px extra offset
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
    
    // Add scroll effect to navbar
    window.addEventListener('scroll', function() {
        const navbar = document.querySelector('.navbar');
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    // Loading state for buttons
    document.querySelectorAll('.btn').forEach(button => {
        if (button.type === 'submit' || button.classList.contains('loading-btn')) {
            button.addEventListener('click', function() {
                if (!this.disabled) {
                    this.classList.add('loading');
                }
            });
        }
    });

    // Fade in animations for cards
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('fade-in');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Observe cards for animation
    document.querySelectorAll('.feature-card, .service-card, .action-card, .appointment-card').forEach(card => {
        observer.observe(card);
    });
});

// Filter appointments function
function filterAppointments(status) {
    const rows = document.querySelectorAll('.appointment-row');
    rows.forEach(row => {
        const rowStatus = row.getAttribute('data-status');
        if (status === 'all' || rowStatus === status) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}

// Update filter button states
function updateFilterButtons(activeBtn) {
    document.querySelectorAll('#allAppointments, #pendingAppointments').forEach(btn => {
        btn.classList.remove('active');
    });
    activeBtn.classList.add('active');
}

// Utility function to format phone numbers
function formatPhoneNumber(phoneNumber) {
    const cleaned = phoneNumber.replace(/\D/g, '');
    const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
    if (match) {
        return `(${match[1]}) ${match[2]}-${match[3]}`;
    }
    return phoneNumber;
}

// Utility function to validate email
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// Show confirmation before form submission
function confirmAction(message) {
    return confirm(message);
}

// Real-time appointment status updates (would connect to WebSocket in production)
function checkAppointmentUpdates() {
    // This would typically connect to a WebSocket or poll an API
    // For now, it's a placeholder for future enhancement
    console.log('Checking for appointment updates...');
}

// Export functions for global use
window.medicalClinic = {
    filterAppointments,
    updateFilterButtons,
    formatPhoneNumber,
    validateEmail,
    confirmAction,
    checkAppointmentUpdates
};
