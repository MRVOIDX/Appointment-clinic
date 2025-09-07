// Medical Clinic Local Storage Management
class MedicalClinicStorage {
    constructor() {
        this.storageKey = 'medicalClinicData';
        this.initStorage();
    }

    initStorage() {
        if (!localStorage.getItem(this.storageKey)) {
            localStorage.setItem(this.storageKey, JSON.stringify({
                appointments: [],
                users: []
            }));
        }
    }

    getData() {
        return JSON.parse(localStorage.getItem(this.storageKey) || '{"appointments":[],"users":[]}');
    }

    saveData(data) {
        localStorage.setItem(this.storageKey, JSON.stringify(data));
    }

    // Generate unique ID
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    // Appointment methods
    saveAppointment(appointmentData) {
        const data = this.getData();
        const appointment = {
            id: this.generateId(),
            ...appointmentData,
            status: 'pending',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        data.appointments.push(appointment);
        this.saveData(data);
        return appointment;
    }

    getUserAppointments(userEmail) {
        const data = this.getData();
        return data.appointments.filter(apt => apt.patientEmail === userEmail);
    }

    getAllAppointments() {
        const data = this.getData();
        return data.appointments;
    }

    updateAppointmentStatus(appointmentId, status, adminNotes = '') {
        const data = this.getData();
        const appointment = data.appointments.find(apt => apt.id === appointmentId);
        
        if (appointment) {
            appointment.status = status;
            appointment.adminNotes = adminNotes;
            appointment.updatedAt = new Date().toISOString();
            this.saveData(data);
            return appointment;
        }
        return null;
    }

    deleteAppointment(appointmentId) {
        const data = this.getData();
        data.appointments = data.appointments.filter(apt => apt.id !== appointmentId);
        this.saveData(data);
    }

    // Statistics methods
    getAppointmentStats() {
        const appointments = this.getAllAppointments();
        return {
            total: appointments.length,
            pending: appointments.filter(apt => apt.status === 'pending').length,
            approved: appointments.filter(apt => apt.status === 'approved').length,
            cancelled: appointments.filter(apt => apt.status === 'cancelled').length
        };
    }
}

// Initialize storage
const clinicStorage = new MedicalClinicStorage();

// Appointment booking form handler
document.addEventListener('DOMContentLoaded', function() {
    const appointmentForm = document.getElementById('appointmentForm');
    if (appointmentForm) {
        appointmentForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const formData = new FormData(this);
            const appointmentData = {
                patientEmail: getCurrentUserEmail(),
                fullName: formData.get('full_name'),
                phone: formData.get('phone'),
                email: formData.get('email'),
                dateOfBirth: formData.get('date_of_birth'),
                gender: formData.get('gender'),
                appointmentDate: formData.get('appointment_date'),
                appointmentTime: formData.get('appointment_time'),
                department: formData.get('department'),
                doctorPreference: formData.get('doctor_preference') || '',
                reason: formData.get('reason')
            };

            // Validate date
            const appointmentDate = new Date(appointmentData.appointmentDate);
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            if (appointmentDate < today) {
                showAlert('error', 'Appointment date cannot be in the past.');
                return;
            }

            try {
                const appointment = clinicStorage.saveAppointment(appointmentData);
                showAlert('success', 'Appointment booked successfully! We will review your request and get back to you soon.');
                
                setTimeout(() => {
                    window.location.href = '/my-appointments';
                }, 2000);
                
            } catch (error) {
                showAlert('error', 'An error occurred while booking your appointment. Please try again.');
            }
        });
    }

    // Load appointments on appropriate pages
    if (window.location.pathname === '/my-appointments') {
        loadUserAppointments();
    } else if (window.location.pathname === '/admin') {
        loadAdminDashboard();
    }
});

// Utility functions
function getCurrentUserEmail() {
    // This would normally come from the server session
    // For demo purposes, we'll use a simple approach
    return localStorage.getItem('currentUserEmail') || 'patient@example.com';
}

function isCurrentUserAdmin() {
    const email = getCurrentUserEmail();
    return email === 'admin@darsehha.com' || email === 'admin@example.com';
}

function showAlert(type, message) {
    const alertClass = type === 'error' ? 'alert-danger' : 'alert-success';
    const alertHtml = `
        <div class="alert ${alertClass} alert-dismissible fade show" role="alert">
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
    `;
    
    const container = document.querySelector('.container');
    if (container) {
        container.insertAdjacentHTML('afterbegin', alertHtml);
        
        // Auto-dismiss after 5 seconds
        setTimeout(() => {
            const alert = container.querySelector('.alert');
            if (alert) {
                const bsAlert = new bootstrap.Alert(alert);
                bsAlert.close();
            }
        }, 5000);
    }
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
}

function formatTime(timeString) {
    const [hours, minutes] = timeString.split(':');
    const time = new Date();
    time.setHours(hours, minutes);
    return time.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
    });
}

function getStatusBadge(status) {
    const badges = {
        'pending': '<span class="badge bg-warning"><i class="fas fa-clock me-1"></i> Pending</span>',
        'approved': '<span class="badge bg-success"><i class="fas fa-check me-1"></i> Approved</span>',
        'cancelled': '<span class="badge bg-danger"><i class="fas fa-times me-1"></i> Cancelled</span>'
    };
    return badges[status] || badges['pending'];
}

// Load user appointments
function loadUserAppointments() {
    const userEmail = getCurrentUserEmail();
    const appointments = clinicStorage.getUserAppointments(userEmail);
    const container = document.getElementById('appointmentsContainer');
    
    if (!container) return;
    
    if (appointments.length === 0) {
        container.innerHTML = `
            <div class="text-center py-5">
                <div class="empty-state">
                    <i class="fas fa-calendar-times display-1 text-muted mb-4"></i>
                    <h3>No Appointments Yet</h3>
                    <p class="text-muted mb-4">You haven't booked any appointments yet. Start by scheduling your first appointment.</p>
                    <a href="/book-appointment" class="btn btn-primary btn-lg">
                        <i class="fas fa-calendar-plus me-2"></i> Book Your First Appointment
                    </a>
                </div>
            </div>
        `;
        return;
    }

    const appointmentsHtml = appointments.map(appointment => `
        <div class="col-12">
            <div class="appointment-card">
                <div class="appointment-header">
                    <div class="row align-items-center">
                        <div class="col-md-8">
                            <h5 class="mb-1">${appointment.department.charAt(0).toUpperCase() + appointment.department.slice(1)} Appointment</h5>
                            <p class="text-muted mb-0">
                                <i class="fas fa-calendar me-1"></i>
                                ${formatDate(appointment.appointmentDate)} at ${formatTime(appointment.appointmentTime)}
                            </p>
                        </div>
                        <div class="col-md-4 text-md-end">
                            ${getStatusBadge(appointment.status)}
                        </div>
                    </div>
                </div>
                
                <div class="appointment-body">
                    <div class="row">
                        <div class="col-md-6">
                            <div class="detail-group">
                                <label>Patient Name</label>
                                <span>${appointment.fullName}</span>
                            </div>
                            <div class="detail-group">
                                <label>Phone</label>
                                <span>${appointment.phone}</span>
                            </div>
                            <div class="detail-group">
                                <label>Email</label>
                                <span>${appointment.email}</span>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="detail-group">
                                <label>Department</label>
                                <span>${appointment.department.charAt(0).toUpperCase() + appointment.department.slice(1)}</span>
                            </div>
                            ${appointment.doctorPreference ? `
                            <div class="detail-group">
                                <label>Doctor Preference</label>
                                <span>${appointment.doctorPreference}</span>
                            </div>` : ''}
                            <div class="detail-group">
                                <label>Booking Date</label>
                                <span>${formatDate(appointment.createdAt)}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="detail-group">
                        <label>Reason for Visit</label>
                        <span>${appointment.reason}</span>
                    </div>
                    
                    ${appointment.adminNotes ? `
                    <div class="detail-group">
                        <label>Admin Notes</label>
                        <div class="admin-notes">
                            <i class="fas fa-sticky-note me-1"></i>
                            ${appointment.adminNotes}
                        </div>
                    </div>` : ''}
                </div>
                
                ${appointment.status === 'approved' ? `
                <div class="appointment-footer bg-light">
                    <div class="d-flex align-items-center">
                        <i class="fas fa-check-circle text-success me-2"></i>
                        <span class="text-success fw-bold">Your appointment has been confirmed!</span>
                        <span class="ms-auto text-muted small">
                            Please arrive 15 minutes early
                        </span>
                    </div>
                </div>` : ''}
                
                ${appointment.status === 'cancelled' ? `
                <div class="appointment-footer bg-light">
                    <div class="d-flex align-items-center">
                        <i class="fas fa-exclamation-circle text-danger me-2"></i>
                        <span class="text-danger fw-bold">This appointment has been cancelled</span>
                        <span class="ms-auto">
                            <a href="/book-appointment" class="btn btn-sm btn-outline-primary">
                                Book New
                            </a>
                        </span>
                    </div>
                </div>` : ''}
            </div>
        </div>
    `).join('');

    container.innerHTML = appointmentsHtml;
}

// Load admin dashboard
function loadAdminDashboard() {
    const appointments = clinicStorage.getAllAppointments();
    const stats = clinicStorage.getAppointmentStats();
    
    // Update statistics
    updateAdminStats(stats);
    
    // Load appointments table
    loadAdminAppointmentsTable(appointments);
}

function updateAdminStats(stats) {
    const totalElement = document.getElementById('totalAppointments');
    const pendingElement = document.getElementById('pendingAppointments');
    const approvedElement = document.getElementById('approvedAppointments');
    const cancelledElement = document.getElementById('cancelledAppointments');
    
    if (totalElement) totalElement.textContent = stats.total;
    if (pendingElement) pendingElement.textContent = stats.pending;
    if (approvedElement) approvedElement.textContent = stats.approved;
    if (cancelledElement) cancelledElement.textContent = stats.cancelled;
}

function loadAdminAppointmentsTable(appointments) {
    const tbody = document.getElementById('appointmentsTableBody');
    if (!tbody) return;
    
    if (appointments.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center py-5">
                    <div class="empty-state">
                        <i class="fas fa-calendar-times display-1 text-muted mb-4"></i>
                        <h3>No Appointments</h3>
                        <p class="text-muted">No appointments have been booked yet.</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }

    const appointmentsHtml = appointments.map(appointment => `
        <tr class="appointment-row" data-status="${appointment.status}">
            <td>
                <strong>#${appointment.id}</strong>
                <small class="d-block text-muted">
                    ${formatDate(appointment.createdAt)}
                </small>
            </td>
            <td>
                <div class="patient-info">
                    <strong>${appointment.fullName}</strong>
                    <small class="d-block text-muted">
                        ${appointment.gender.charAt(0).toUpperCase() + appointment.gender.slice(1)}, 
                        DOB: ${formatDate(appointment.dateOfBirth)}
                    </small>
                </div>
            </td>
            <td>
                <div>
                    <i class="fas fa-phone me-1"></i> ${appointment.phone}
                </div>
                <div>
                    <i class="fas fa-envelope me-1"></i> ${appointment.email}
                </div>
            </td>
            <td>
                <div class="appointment-datetime">
                    <strong>${formatDate(appointment.appointmentDate)}</strong>
                    <small class="d-block text-muted">
                        ${formatTime(appointment.appointmentTime)}
                    </small>
                </div>
            </td>
            <td>
                <div class="department-info">
                    <strong>${appointment.department.charAt(0).toUpperCase() + appointment.department.slice(1)}</strong>
                    ${appointment.doctorPreference ? `
                    <small class="d-block text-muted">
                        Dr. ${appointment.doctorPreference}
                    </small>` : ''}
                </div>
            </td>
            <td>
                ${getStatusBadge(appointment.status)}
            </td>
            <td>
                <div class="btn-group" role="group">
                    <button type="button" class="btn btn-sm btn-outline-info" 
                            onclick="viewAppointment('${appointment.id}')">
                        <i class="fas fa-eye"></i>
                    </button>
                    ${appointment.status === 'pending' ? `
                    <button type="button" class="btn btn-sm btn-outline-success" 
                            onclick="approveAppointment('${appointment.id}')">
                        <i class="fas fa-check"></i>
                    </button>
                    <button type="button" class="btn btn-sm btn-outline-danger" 
                            onclick="cancelAppointment('${appointment.id}')">
                        <i class="fas fa-times"></i>
                    </button>` : ''}
                </div>
            </td>
        </tr>
    `).join('');

    tbody.innerHTML = appointmentsHtml;
}

// Admin action functions
function viewAppointment(appointmentId) {
    const appointments = clinicStorage.getAllAppointments();
    const appointment = appointments.find(apt => apt.id === appointmentId);
    
    if (!appointment) return;
    
    const modalHtml = `
        <div class="modal fade" id="viewModal" tabindex="-1">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">
                            <i class="fas fa-eye me-2"></i>Appointment Details - #${appointment.id}
                        </h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="row g-3">
                            <div class="col-md-6">
                                <label class="fw-bold">Patient Name:</label>
                                <p>${appointment.fullName}</p>
                            </div>
                            <div class="col-md-6">
                                <label class="fw-bold">Phone:</label>
                                <p>${appointment.phone}</p>
                            </div>
                            <div class="col-md-6">
                                <label class="fw-bold">Email:</label>
                                <p>${appointment.email}</p>
                            </div>
                            <div class="col-md-6">
                                <label class="fw-bold">Date of Birth:</label>
                                <p>${formatDate(appointment.dateOfBirth)}</p>
                            </div>
                            <div class="col-md-6">
                                <label class="fw-bold">Gender:</label>
                                <p>${appointment.gender.charAt(0).toUpperCase() + appointment.gender.slice(1)}</p>
                            </div>
                            <div class="col-md-6">
                                <label class="fw-bold">Department:</label>
                                <p>${appointment.department.charAt(0).toUpperCase() + appointment.department.slice(1)}</p>
                            </div>
                            <div class="col-12">
                                <label class="fw-bold">Reason for Visit:</label>
                                <p>${appointment.reason}</p>
                            </div>
                            ${appointment.adminNotes ? `
                            <div class="col-12">
                                <label class="fw-bold">Admin Notes:</label>
                                <p class="text-muted">${appointment.adminNotes}</p>
                            </div>` : ''}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Remove existing modal
    const existingModal = document.getElementById('viewModal');
    if (existingModal) existingModal.remove();
    
    // Add new modal
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('viewModal'));
    modal.show();
}

function approveAppointment(appointmentId) {
    const appointments = clinicStorage.getAllAppointments();
    const appointment = appointments.find(apt => apt.id === appointmentId);
    
    if (!appointment) return;
    
    const notes = prompt('Add any notes for the patient (optional):') || '';
    
    if (confirm(`Are you sure you want to approve the appointment for ${appointment.fullName}?`)) {
        clinicStorage.updateAppointmentStatus(appointmentId, 'approved', notes);
        showAlert('success', `Appointment for ${appointment.fullName} has been approved.`);
        loadAdminDashboard();
    }
}

function cancelAppointment(appointmentId) {
    const appointments = clinicStorage.getAllAppointments();
    const appointment = appointments.find(apt => apt.id === appointmentId);
    
    if (!appointment) return;
    
    const reason = prompt('Please provide a reason for cancellation:');
    
    if (reason && confirm(`Are you sure you want to cancel the appointment for ${appointment.fullName}?`)) {
        clinicStorage.updateAppointmentStatus(appointmentId, 'cancelled', reason);
        showAlert('success', `Appointment for ${appointment.fullName} has been cancelled.`);
        loadAdminDashboard();
    }
}

// Filter appointments
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

// Export for global use
window.clinicStorage = clinicStorage;
window.loadUserAppointments = loadUserAppointments;
window.loadAdminDashboard = loadAdminDashboard;
window.viewAppointment = viewAppointment;
window.approveAppointment = approveAppointment;
window.cancelAppointment = cancelAppointment;
window.filterAppointments = filterAppointments;