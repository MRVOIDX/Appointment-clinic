from flask import render_template, request, redirect, url_for, flash, session, jsonify
from datetime import datetime, date
import json
import os
import uuid
from app import app
from chatbot import chatbot

# Admin user configuration
ADMIN_EMAILS = ["admin@darsehha.com"]

@app.before_request
def make_session_permanent():
    session.permanent = True

@app.context_processor
def inject_user():
    return dict(current_user=session.get('user'), is_logged_in=is_logged_in(), is_admin=is_admin())

def is_logged_in():
    return 'user' in session

def is_admin():
    return is_logged_in() and session.get('user', {}).get('email') in ADMIN_EMAILS

def require_login(f):
    def decorated_function(*args, **kwargs):
        if not is_logged_in():
            flash('Please log in to access this page.', 'error')
            return redirect(url_for('login'))
        return f(*args, **kwargs)
    decorated_function.__name__ = f.__name__
    return decorated_function

def require_admin(f):
    def decorated_function(*args, **kwargs):
        if not is_admin():
            return render_template("403.html"), 403
        return f(*args, **kwargs)
    decorated_function.__name__ = f.__name__
    return decorated_function

@app.route('/')
def index():
    """Landing page for logged out users, home page for logged in users"""
    if is_logged_in():
        # Redirect based on user type
        if is_admin():
            return redirect(url_for('admin_dashboard'))
        else:
            return redirect(url_for('home'))
    return render_template('index.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    """Simple login form"""
    if request.method == 'POST':
        email = request.form.get('email')
        name = request.form.get('name')
        
        if email and name:
            user_data = {
                'email': email,
                'name': name,
                'is_admin': email in ADMIN_EMAILS
            }
            session['user'] = user_data
            flash(f'Welcome, {name}!', 'success')
            
            # Redirect admins to admin dashboard, regular users to home
            if user_data['is_admin']:
                return redirect(url_for('admin_dashboard'))
            else:
                return redirect(url_for('home'))
        else:
            flash('Please fill in all fields.', 'error')
    
    return render_template('login.html')

@app.route('/logout')
def logout():
    """Logout user"""
    session.pop('user', None)
    flash('You have been logged out.', 'success')
    return redirect(url_for('index'))

@app.route('/home')
@require_login
def home():
    """Home page for authenticated users"""
    return render_template('home.html', user=session['user'])

@app.route('/book-appointment', methods=['GET', 'POST'])
@require_login
def book_appointment():
    """Appointment booking page - data stored in browser local storage"""
    if request.method == 'POST':
        # Server-side validation only - actual storage happens in browser
        try:
            appointment_date_str = request.form.get('appointment_date')
            if appointment_date_str:
                appointment_date = datetime.strptime(appointment_date_str, '%Y-%m-%d').date()
                
                # Validate appointment date is not in the past
                if appointment_date < date.today():
                    return jsonify({'success': False, 'message': 'Appointment date cannot be in the past.'})
            
            return jsonify({'success': True, 'message': 'Appointment booked successfully! We will review your request and get back to you soon.'})
            
        except ValueError as e:
            return jsonify({'success': False, 'message': 'Please check your date and time formats.'})
        except Exception as e:
            return jsonify({'success': False, 'message': 'An error occurred while booking your appointment. Please try again.'})
    
    return render_template('book_appointment.html')

@app.route('/my-appointments')
@require_login
def my_appointments():
    """User's appointment history - data comes from local storage"""
    return render_template('my_appointments.html')

@app.route('/admin')
@require_admin
def admin_dashboard():
    """Admin dashboard for appointment management - data comes from local storage"""
    return render_template('admin_dashboard.html')

@app.route('/admin/settings')
@require_admin
def admin_settings():
    """Admin settings page for website configuration"""
    return render_template('admin_settings.html')

@app.route('/admin/settings/save', methods=['POST'])
@require_admin
def save_settings():
    """Save website settings"""
    try:
        settings_data = request.get_json()
        
        # Save settings to a simple file (in production, use a database)
        settings_file = 'clinic_settings.json'
        
        # Load existing settings or create new
        if os.path.exists(settings_file):
            with open(settings_file, 'r') as f:
                existing_settings = json.load(f)
        else:
            existing_settings = {}
        
        # Update with new settings
        category = settings_data.get('category')
        if category:
            existing_settings[category] = settings_data.get('data', {})
        
        # Save back to file
        with open(settings_file, 'w') as f:
            json.dump(existing_settings, f)
        
        return jsonify({'success': True, 'message': 'Settings saved successfully!'})
    
    except Exception as e:
        return jsonify({'success': False, 'message': f'Error saving settings: {str(e)}'})

@app.route('/admin/settings/load')
@require_admin
def load_settings():
    """Load website settings"""
    try:
        settings_file = 'clinic_settings.json'
        
        if os.path.exists(settings_file):
            with open(settings_file, 'r') as f:
                settings = json.load(f)
        else:
            # Default settings
            settings = get_default_settings()
        
        return jsonify({'success': True, 'settings': settings})
    
    except Exception as e:
        return jsonify({'success': False, 'message': f'Error loading settings: {str(e)}'})

@app.route('/api/settings')
def get_public_settings():
    """Get public settings for website display"""
    try:
        settings_file = 'clinic_settings.json'
        
        if os.path.exists(settings_file):
            with open(settings_file, 'r') as f:
                settings = json.load(f)
        else:
            settings = get_default_settings()
        
        return jsonify(settings)
    
    except Exception as e:
        return jsonify(get_default_settings())

def get_default_settings():
    """Return default website settings"""
    return {
        'clinic-info': {
            'clinicName': 'DARSEHHA Clinic',
            'clinicPhone': '(555) 123-4567',
            'clinicEmail': 'info@darsehha.com',
            'emergencyPhone': '(555) 911-HELP',
            'clinicAddress': '123 Health Street, Medical City',
            'clinicDescription': 'Providing quality healthcare services with compassion and excellence.'
        },
        'website-content': {
            'heroTitle': 'Your Health, Our Priority',
            'heroSubtitle': 'Experience exceptional healthcare with our team of dedicated professionals. Book your appointment today and take the first step towards better health.',
            'totalPatients': '15K+',
            'totalDoctors': '50+',
            'yearsExperience': '25',
            'emergencyAvailability': '24/7'
        },
        'appointment-settings': {
            'weekdayHours': '8:00 AM - 8:00 PM',
            'saturdayHours': '9:00 AM - 6:00 PM',
            'sundayHours': '10:00 AM - 4:00 PM',
            'slotDuration': '30',
            'maxAdvanceBooking': '30',
            'minAdvanceBooking': '2'
        },
        'system-settings': {
            'maintenanceMode': 'off',
            'autoApproval': 'off',
            'emailNotifications': 'on',
            'dataRetention': '365'
        }
    }

@app.route('/admin/appointment/<appointment_id>/approve', methods=['POST'])
@require_admin
def approve_appointment(appointment_id):
    """Approve an appointment - returns success response for JS to handle"""
    admin_notes = request.form.get('admin_notes', '')
    return jsonify({
        'success': True, 
        'message': f'Appointment has been approved.',
        'admin_notes': admin_notes
    })

@app.route('/admin/appointment/<appointment_id>/cancel', methods=['POST'])
@require_admin
def cancel_appointment(appointment_id):
    """Cancel an appointment - returns success response for JS to handle"""
    admin_notes = request.form.get('admin_notes', '')
    return jsonify({
        'success': True, 
        'message': f'Appointment has been cancelled.',
        'admin_notes': admin_notes
    })

@app.route('/chat')
def chat_interface():
    """Chatbot interface page"""
    return render_template('chat.html')

@app.route('/api/chat', methods=['POST'])
def chat_api():
    """Handle chatbot conversations"""
    try:
        data = request.get_json()
        message = data.get('message', '').strip()
        
        if not message:
            return jsonify({
                'success': False,
                'error': 'Message cannot be empty'
            })
        
        # Use session ID to maintain conversation state
        session_id = session.get('user', {}).get('email', 'anonymous')
        
        # Process message with chatbot
        response_data = chatbot.process_message(message, session_id)
        
        return jsonify({
            'success': True,
            'response': response_data['response'],
            'stage': response_data['stage'],
            'completed': response_data.get('completed', False)
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Error processing message: {str(e)}'
        })

@app.route('/api/chat/book-appointment', methods=['POST'])
def chat_book_appointment():
    """Process appointment booking from chatbot"""
    try:
        session_id = session.get('user', {}).get('email', 'anonymous')
        appointment_data = chatbot.get_formatted_appointment_data(session_id)
        
        if not appointment_data:
            return jsonify({
                'success': False,
                'error': 'No appointment data found. Please start a new conversation.'
            })
        
        # Add user email from session (required for the existing storage system)
        appointment_data['patientEmail'] = session.get('user', {}).get('email', '')
        
        # Validate appointment date
        appointment_date = datetime.strptime(appointment_data['appointmentDate'], '%Y-%m-%d').date()
        if appointment_date < date.today():
            return jsonify({
                'success': False,
                'error': 'Appointment date cannot be in the past.'
            })
        
        # The existing storage system will automatically add:
        # - id (generated)
        # - status ('pending')
        # - createdAt
        # - updatedAt
        # So we don't need to add these manually
        
        return jsonify({
            'success': True,
            'message': 'Appointment booked successfully! We will review your request and get back to you soon.',
            'appointment': appointment_data
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Error booking appointment: {str(e)}'
        })

@app.route('/api/chat/reset', methods=['POST'])
def chat_reset():
    """Reset chatbot conversation"""
    try:
        session_id = session.get('user', {}).get('email', 'anonymous')
        chatbot.reset_conversation(session_id)
        
        return jsonify({
            'success': True,
            'message': 'Conversation reset successfully'
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Error resetting conversation: {str(e)}'
        })

@app.errorhandler(404)
def not_found(error):
    return render_template('403.html', error_message="Page not found"), 404

@app.errorhandler(500)
def internal_error(error):
    return render_template('403.html', error_message="Internal server error"), 500