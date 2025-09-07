import re
import json
import random
from datetime import datetime, timedelta
from typing import Dict, List, Tuple, Optional

class AppointmentChatbot:
    """
    Simple NLP-based chatbot for booking medical appointments
    Uses pattern matching and keyword recognition without external APIs
    """
    
    def __init__(self):
        self.conversation_state = {}
        self.session_data = {}
        self.init_training_data()
        
    def init_training_data(self):
        """Initialize training patterns and responses"""
        
        # Intent patterns with keywords and responses
        self.intents = {
            'greeting': {
                'patterns': [
                    r'\b(hello|hi|hey|good morning|good afternoon|good evening)\b',
                    r'\b(greetings|salutations)\b'
                ],
                'responses': [
                    "Hello! I'm here to help you book an appointment at DARSEHHA Medical Clinic. How can I assist you today?",
                    "Hi there! Welcome to DARSEHHA Medical Clinic. I can help you schedule an appointment. What would you like to do?",
                    "Good day! I'm your appointment booking assistant. How may I help you?"
                ]
            },
            'emergency': {
                'patterns': [
                    r'\b(emergency|urgent|pain|hurt|bleeding|chest pain|trouble breathing)\b',
                    r'\b(911|ambulance|er|emergency room)\b',
                    r'\b(cant breathe|heart attack|stroke)\b'
                ],
                'responses': [
                    "⚠️ If this is a medical emergency, please call 911 immediately or go to your nearest emergency room. For urgent but non-emergency care, you can call our emergency line at (555) 911-HELP. Would you like me to help you book a regular appointment instead?",
                    "🚨 For emergencies, please call 911 or visit the emergency room immediately. If you need urgent care, call (555) 911-HELP. I can help you schedule a non-emergency appointment - would you like to do that?",
                    "⚠️ This sounds urgent! Please call 911 for emergencies or (555) 911-HELP for urgent care. I'm here to help with regular appointment bookings when you're ready."
                ]
            },
            'book_appointment': {
                'patterns': [
                    r'\b(book|schedule|make|arrange|set up|get)\b.*\b(appointment|visit|consultation|checkup)\b',
                    r'\b(need|want|would like)\b.*\b(see|visit|meet)\b.*\b(doctor|physician|specialist)\b',
                    r'\b(appointment|booking|schedule)\b'
                ],
                'responses': [
                    "I'd be happy to help you book an appointment! Let me gather some information from you.",
                    "Great! I'll help you schedule your appointment. Let's start with some details.",
                    "Perfect! I can assist you with booking an appointment. Let me ask you a few questions."
                ]
            },
            'ask_name': {
                'patterns': [
                    r'\b(my name is|i am|i\'m|call me)\b\s*([a-zA-Z\s]+)',
                    r'^([a-zA-Z\s]+)$'
                ],
                'responses': [
                    "Nice to meet you, {name}! What's your phone number?",
                    "Thank you, {name}! Could you please provide your phone number?",
                    "Hello {name}! I'll need your phone number to continue."
                ]
            },
            'ask_phone': {
                'patterns': [
                    r'\b(\+?\d{1,3}[-.\s]?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4})\b',
                    r'\b(\d{10,15})\b'
                ],
                'responses': [
                    "Got it! What's your email address?",
                    "Thank you! Could you please provide your email?",
                    "Perfect! Now I need your email address."
                ]
            },
            'ask_email': {
                'patterns': [
                    r'\b([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})\b'
                ],
                'responses': [
                    "Great! What's your date of birth? (Please use YYYY-MM-DD format)",
                    "Thank you! Could you tell me your date of birth? (Format: YYYY-MM-DD)",
                    "Perfect! I need your date of birth in YYYY-MM-DD format."
                ]
            },
            'ask_dob': {
                'patterns': [
                    r'\b(\d{4}-\d{1,2}-\d{1,2})\b',
                    r'\b(\d{1,2}[/.-]\d{1,2}[/.-]\d{4})\b'
                ],
                'responses': [
                    "Thanks! What's your gender? (Male/Female/Other)",
                    "Got it! Could you tell me your gender?",
                    "Perfect! What gender should I record?"
                ]
            },
            'ask_gender': {
                'patterns': [
                    r'\b(male|female|other|man|woman|m|f|o)\b'
                ],
                'responses': [
                    "Thank you! What department would you like to visit? (Cardiology, Dermatology, General Medicine, Pediatrics, Orthopedics)",
                    "Great! Which department do you need? We have Cardiology, Dermatology, General Medicine, Pediatrics, and Orthopedics.",
                    "Perfect! What department would you like to book with?"
                ]
            },
            'ask_department': {
                'patterns': [
                    r'\b(cardiology|heart|cardiac)\b',
                    r'\b(dermatology|skin|dermat)\b',
                    r'\b(general|medicine|family|gp)\b',
                    r'\b(pediatrics|children|kids|pediatric)\b',
                    r'\b(orthopedics|bones|joints|orthopedic)\b'
                ],
                'responses': [
                    "Excellent! When would you like to schedule your appointment? Please provide a date (YYYY-MM-DD).",
                    "Great choice! What date works for you? (Please use YYYY-MM-DD format)",
                    "Perfect! When would you prefer your appointment? (Format: YYYY-MM-DD)"
                ]
            },
            'ask_date': {
                'patterns': [
                    r'\b(\d{4}-\d{1,2}-\d{1,2})\b',
                    r'\b(today|tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b',
                    r'\b(next week|this week)\b'
                ],
                'responses': [
                    "Great! What time would you prefer? (Format: HH:MM, we're open 9:00-17:00)",
                    "Perfect! What time works best for you? (9:00 AM to 5:00 PM)",
                    "Excellent! Please specify your preferred time (HH:MM format)."
                ]
            },
            'ask_time': {
                'patterns': [
                    r'\b(\d{1,2}:\d{2})\b',
                    r'\b(\d{1,2})\s*(am|pm|AM|PM)\b',
                    r'\b(morning|afternoon|evening)\b'
                ],
                'responses': [
                    "Almost done! Do you have any specific doctor preference or reason for your visit?",
                    "Great! Any specific doctor you'd like to see or reason for the visit?",
                    "Perfect! Is there a particular doctor you prefer or could you tell me the reason for your visit?"
                ]
            },
            'ask_reason': {
                'patterns': [
                    r'.*',  # Match any response for reason
                ],
                'responses': [
                    "Perfect! Let me confirm your appointment details:",
                    "Excellent! Here's a summary of your appointment:",
                    "Great! Please review your appointment information:"
                ]
            },
            'help': {
                'patterns': [
                    r'\b(help|assistance|support|how|what can you do)\b'
                ],
                'responses': [
                    "I can help you book medical appointments at DARSEHHA Medical Clinic. Just tell me you'd like to book an appointment and I'll guide you through the process!",
                    "I'm here to assist with appointment bookings. I can help you schedule visits with our doctors in various departments. Just say you want to book an appointment!",
                    "I can help you schedule appointments with our medical professionals. Available departments include Cardiology, Dermatology, General Medicine, Pediatrics, and Orthopedics."
                ]
            },
            'symptoms_inquiry': {
                'patterns': [
                    r'\b(symptom|symptoms|feeling|sick|unwell)\b',
                    r'\b(headache|fever|cough|cold|flu|nausea)\b',
                    r'\b(rash|swelling|dizziness|fatigue|tired)\b'
                ],
                'responses': [
                    "I understand you're not feeling well. While I can't provide medical advice, I can help you book an appointment with one of our doctors who can properly assess your symptoms. Would you like to schedule an appointment?",
                    "It sounds like you may need medical attention. I'd be happy to help you book an appointment so a doctor can evaluate your symptoms properly. Shall we get started?",
                    "I'm sorry you're experiencing symptoms. The best thing to do is see a doctor for proper evaluation. Would you like me to help you schedule an appointment today?"
                ]
            },
            'department_inquiry': {
                'patterns': [
                    r'\b(department|departments|specialties|specialist|specialists)\b',
                    r'\b(what do you have|what departments|available|options)\b'
                ],
                'responses': [
                    "We have several departments at DARSEHHA Medical Clinic:\n🫀 Cardiology - Heart and cardiovascular health\n🩺 Dermatology - Skin, hair, and nail conditions\n👨‍⚕️ General Medicine - Primary care and family medicine\n👶 Pediatrics - Children's healthcare\n🦴 Orthopedics - Bones, joints, and musculoskeletal issues\n\nWhich department interests you?",
                    "Here are our available departments:\n• Cardiology (Heart care)\n• Dermatology (Skin care)\n• General Medicine (Primary care)\n• Pediatrics (Children's care)\n• Orthopedics (Bone and joint care)\n\nWould you like to book an appointment in any of these?",
                    "DARSEHHA Medical Clinic offers these specialties:\n- Cardiology for heart conditions\n- Dermatology for skin issues\n- General Medicine for overall health\n- Pediatrics for children\n- Orthopedics for bone/joint problems\n\nWhich would you like to book with?"
                ]
            },
            'hours_inquiry': {
                'patterns': [
                    r'\b(hours|open|close|schedule|time|timing)\b',
                    r'\b(when.*open|what time|business hours)\b'
                ],
                'responses': [
                    "Our clinic hours are:\n🕐 Monday-Friday: 8:00 AM - 8:00 PM\n🕐 Saturday: 9:00 AM - 6:00 PM\n🕐 Sunday: 10:00 AM - 4:00 PM\n\nWould you like to book an appointment during these hours?",
                    "DARSEHHA Medical Clinic is open:\n• Weekdays: 8:00 AM to 8:00 PM\n• Saturday: 9:00 AM to 6:00 PM\n• Sunday: 10:00 AM to 4:00 PM\n\nI can help you schedule an appointment. What time works for you?",
                    "We're open 7 days a week with extended hours:\nMon-Fri: 8 AM-8 PM, Sat: 9 AM-6 PM, Sun: 10 AM-4 PM. Ready to book your appointment?"
                ]
            },
            'insurance_inquiry': {
                'patterns': [
                    r'\b(insurance|coverage|covered|accept|take)\b',
                    r'\b(copay|deductible|billing|cost|price)\b'
                ],
                'responses': [
                    "For insurance and billing questions, please contact our billing department at (555) 123-4567. I can help you book your appointment, and our staff will verify your insurance when you arrive. Shall we schedule your visit?",
                    "Insurance verification is handled by our front desk team. I'd be happy to book your appointment first, and they'll sort out insurance details when you check in. Would you like to proceed with scheduling?",
                    "Our billing team handles insurance questions at (555) 123-4567. Let's get your appointment scheduled first - they'll take care of insurance verification. Ready to book?"
                ]
            },
            'thanks': {
                'patterns': [
                    r'\b(thank you|thanks|thank|thx|appreciate)\b'
                ],
                'responses': [
                    "You're welcome! Is there anything else I can help you with?",
                    "My pleasure! Do you need any other assistance?",
                    "You're very welcome! How else can I help you today?"
                ]
            },
            'goodbye': {
                'patterns': [
                    r'\b(bye|goodbye|see you|farewell|take care)\b'
                ],
                'responses': [
                    "Goodbye! Take care and see you at your appointment!",
                    "Have a great day! We look forward to seeing you at DARSEHHA Medical Clinic!",
                    "Bye! If you need to make any changes to your appointment, feel free to contact us again."
                ]
            }
        }
        
        # Departments mapping
        self.departments = {
            'cardiology': 'Cardiology',
            'heart': 'Cardiology',
            'cardiac': 'Cardiology',
            'dermatology': 'Dermatology',
            'skin': 'Dermatology',
            'dermat': 'Dermatology',
            'general': 'General Medicine',
            'medicine': 'General Medicine',
            'family': 'General Medicine',
            'gp': 'General Medicine',
            'pediatrics': 'Pediatrics',
            'children': 'Pediatrics',
            'kids': 'Pediatrics',
            'pediatric': 'Pediatrics',
            'orthopedics': 'Orthopedics',
            'bones': 'Orthopedics',
            'joints': 'Orthopedics',
            'orthopedic': 'Orthopedics'
        }
        
        # Gender mapping
        self.gender_mapping = {
            'male': 'Male',
            'man': 'Male',
            'm': 'Male',
            'female': 'Female',
            'woman': 'Female',
            'f': 'Female',
            'other': 'Other',
            'o': 'Other'
        }
    
    def process_message(self, message: str, session_id: str = 'default') -> Dict:
        """
        Process incoming message and return response
        """
        message = message.lower().strip()
        
        # Initialize session if not exists
        if session_id not in self.conversation_state:
            self.conversation_state[session_id] = {
                'stage': 'initial',
                'data': {},
                'context': []
            }
        
        state = self.conversation_state[session_id]
        response = self._generate_response(message, state)
        
        return {
            'response': response,
            'stage': state['stage'],
            'data': state['data'],
            'completed': state['stage'] == 'completed'
        }
    
    def _generate_response(self, message: str, state: Dict) -> str:
        """Generate appropriate response based on current conversation state"""
        
        current_stage = state['stage']
        
        # Handle different conversation stages
        if current_stage == 'initial':
            return self._handle_initial_message(message, state)
        elif current_stage == 'collecting_name':
            return self._handle_name_input(message, state)
        elif current_stage == 'collecting_phone':
            return self._handle_phone_input(message, state)
        elif current_stage == 'collecting_email':
            return self._handle_email_input(message, state)
        elif current_stage == 'collecting_dob':
            return self._handle_dob_input(message, state)
        elif current_stage == 'collecting_gender':
            return self._handle_gender_input(message, state)
        elif current_stage == 'collecting_department':
            return self._handle_department_input(message, state)
        elif current_stage == 'collecting_date':
            return self._handle_date_input(message, state)
        elif current_stage == 'collecting_time':
            return self._handle_time_input(message, state)
        elif current_stage == 'collecting_reason':
            return self._handle_reason_input(message, state)
        elif current_stage == 'completed':
            return self._handle_completed_conversation(message, state)
        
        return "I'm not sure how to help with that. Could you please try again?"
    
    def _handle_initial_message(self, message: str, state: Dict) -> str:
        """Handle the initial message from user"""
        
        # Check for emergency first (highest priority)
        if self._match_intent(message, 'emergency'):
            return random.choice(self.intents['emergency']['responses'])
        
        # Check for greeting
        if self._match_intent(message, 'greeting'):
            return random.choice(self.intents['greeting']['responses'])
        
        # Check for appointment booking intent
        if self._match_intent(message, 'book_appointment'):
            state['stage'] = 'collecting_name'
            return random.choice(self.intents['book_appointment']['responses']) + " First, could you tell me your full name?"
        
        # Check for symptoms inquiry
        if self._match_intent(message, 'symptoms_inquiry'):
            return random.choice(self.intents['symptoms_inquiry']['responses'])
        
        # Check for department inquiry
        if self._match_intent(message, 'department_inquiry'):
            return random.choice(self.intents['department_inquiry']['responses'])
        
        # Check for hours inquiry
        if self._match_intent(message, 'hours_inquiry'):
            return random.choice(self.intents['hours_inquiry']['responses'])
        
        # Check for insurance inquiry
        if self._match_intent(message, 'insurance_inquiry'):
            return random.choice(self.intents['insurance_inquiry']['responses'])
        
        # Check for help
        if self._match_intent(message, 'help'):
            return random.choice(self.intents['help']['responses'])
        
        # Default response
        return "Hello! I'm here to help you book an appointment at DARSEHHA Medical Clinic. Would you like to schedule an appointment? I can also answer questions about our departments, hours, or help with any symptoms you're experiencing."
    
    def _handle_name_input(self, message: str, state: Dict) -> str:
        """Handle name input"""
        name_match = re.search(r'\b(?:my name is|i am|i\'m|call me)\s*([a-zA-Z\s]+)', message)
        if name_match:
            name = name_match.group(1).strip().title()
        else:
            # Try to extract name from simple input
            name_parts = [word.title() for word in message.split() if word.isalpha() and len(word) > 1]
            if name_parts:
                name = ' '.join(name_parts)
            else:
                return "I didn't catch your name. Could you please tell me your full name?"
        
        state['data']['fullName'] = name
        state['stage'] = 'collecting_phone'
        return f"Nice to meet you, {name}! What's your phone number?"
    
    def _handle_phone_input(self, message: str, state: Dict) -> str:
        """Handle phone number input"""
        phone_match = re.search(r'(\+?\d{1,3}[-.\s]?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}|\d{10,15})', message)
        if phone_match:
            phone = phone_match.group(1)
            state['data']['phone'] = phone
            state['stage'] = 'collecting_email'
            return "Got it! What's your email address?"
        else:
            return "I need a valid phone number. Please provide your phone number."
    
    def _handle_email_input(self, message: str, state: Dict) -> str:
        """Handle email input"""
        email_match = re.search(r'\b([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})\b', message)
        if email_match:
            email = email_match.group(1)
            state['data']['email'] = email
            state['stage'] = 'collecting_dob'
            return "Great! What's your date of birth? (Please use YYYY-MM-DD format)"
        else:
            return "I need a valid email address. Please provide your email."
    
    def _handle_dob_input(self, message: str, state: Dict) -> str:
        """Handle date of birth input"""
        # Try YYYY-MM-DD format
        dob_match = re.search(r'\b(\d{4}-\d{1,2}-\d{1,2})\b', message)
        if dob_match:
            dob = dob_match.group(1)
            try:
                # Validate date
                datetime.strptime(dob, '%Y-%m-%d')
                state['data']['dateOfBirth'] = dob
                state['stage'] = 'collecting_gender'
                return "Thanks! What's your gender? (Male/Female/Other)"
            except ValueError:
                return "Please provide a valid date in YYYY-MM-DD format."
        else:
            # Try other formats and convert
            other_match = re.search(r'\b(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})\b', message)
            if other_match:
                month, day, year = other_match.groups()
                try:
                    dob = f"{year}-{month.zfill(2)}-{day.zfill(2)}"
                    datetime.strptime(dob, '%Y-%m-%d')
                    state['data']['dateOfBirth'] = dob
                    state['stage'] = 'collecting_gender'
                    return "Thanks! What's your gender? (Male/Female/Other)"
                except ValueError:
                    return "Please provide a valid date in YYYY-MM-DD format."
            else:
                return "Please provide your date of birth in YYYY-MM-DD format."
    
    def _handle_gender_input(self, message: str, state: Dict) -> str:
        """Handle gender input"""
        gender_key = None
        for key, value in self.gender_mapping.items():
            if key in message:
                gender_key = value
                break
        
        if gender_key:
            state['data']['gender'] = gender_key
            state['stage'] = 'collecting_department'
            return "Thank you! What department would you like to visit? (Cardiology, Dermatology, General Medicine, Pediatrics, Orthopedics)"
        else:
            return "Please specify your gender: Male, Female, or Other."
    
    def _handle_department_input(self, message: str, state: Dict) -> str:
        """Handle department input"""
        department = None
        for key, value in self.departments.items():
            if key in message:
                department = value
                break
        
        if department:
            state['data']['department'] = department
            state['stage'] = 'collecting_date'
            return f"Excellent! When would you like to schedule your {department} appointment? Please provide a date (YYYY-MM-DD)."
        else:
            return "Please choose from: Cardiology, Dermatology, General Medicine, Pediatrics, or Orthopedics."
    
    def _handle_date_input(self, message: str, state: Dict) -> str:
        """Handle appointment date input"""
        # Handle relative dates
        if 'today' in message:
            date = datetime.now().strftime('%Y-%m-%d')
        elif 'tomorrow' in message:
            date = (datetime.now() + timedelta(days=1)).strftime('%Y-%m-%d')
        else:
            # Try to extract specific date
            date_match = re.search(r'\b(\d{4}-\d{1,2}-\d{1,2})\b', message)
            if date_match:
                date = date_match.group(1)
            else:
                return "Please provide a date in YYYY-MM-DD format, or say 'today' or 'tomorrow'."
        
        try:
            # Validate date is not in the past
            appointment_date = datetime.strptime(date, '%Y-%m-%d')
            if appointment_date.date() < datetime.now().date():
                return "Please choose a date that's today or in the future."
            
            state['data']['appointmentDate'] = date
            state['stage'] = 'collecting_time'
            return "Great! What time would you prefer? (Format: HH:MM, we're open 9:00-17:00)"
        except ValueError:
            return "Please provide a valid date in YYYY-MM-DD format."
    
    def _handle_time_input(self, message: str, state: Dict) -> str:
        """Handle appointment time input"""
        # Try to extract time
        time_match = re.search(r'\b(\d{1,2}):(\d{2})\b', message)
        if time_match:
            hour, minute = time_match.groups()
            time_str = f"{hour.zfill(2)}:{minute}"
        else:
            # Handle AM/PM format
            ampm_match = re.search(r'\b(\d{1,2})\s*(am|pm|AM|PM)\b', message)
            if ampm_match:
                hour, period = ampm_match.groups()
                hour = int(hour)
                if period.lower() == 'pm' and hour != 12:
                    hour += 12
                elif period.lower() == 'am' and hour == 12:
                    hour = 0
                time_str = f"{hour:02d}:00"
            elif 'morning' in message:
                time_str = "10:00"
            elif 'afternoon' in message:
                time_str = "14:00"
            elif 'evening' in message:
                time_str = "16:00"
            else:
                return "Please provide a time in HH:MM format (24-hour) or like '2 PM'. We're open 9:00-17:00."
        
        # Validate time is within business hours
        try:
            hour = int(time_str.split(':')[0])
            if 9 <= hour <= 17:
                state['data']['appointmentTime'] = time_str
                state['stage'] = 'collecting_reason'
                return "Almost done! Do you have any specific doctor preference or reason for your visit?"
            else:
                return "Please choose a time between 9:00 and 17:00 (our business hours)."
        except:
            return "Please provide a valid time format."
    
    def _handle_reason_input(self, message: str, state: Dict) -> str:
        """Handle reason/doctor preference input"""
        state['data']['reason'] = message.strip()
        state['data']['doctorPreference'] = ''  # Can be enhanced to extract doctor names
        state['stage'] = 'completed'
        
        # Generate confirmation message
        data = state['data']
        confirmation = f"""Perfect! Here's your appointment summary:

👤 Name: {data['fullName']}
📞 Phone: {data['phone']}
📧 Email: {data['email']}
🎂 Date of Birth: {data['dateOfBirth']}
👫 Gender: {data['gender']}
🏥 Department: {data['department']}
📅 Date: {data['appointmentDate']}
⏰ Time: {data['appointmentTime']}
📝 Reason: {data['reason']}

Your appointment request has been submitted! We'll review it and get back to you soon. Is there anything else I can help you with?"""
        
        return confirmation
    
    def _handle_completed_conversation(self, message: str, state: Dict) -> str:
        """Handle messages after appointment is booked"""
        if self._match_intent(message, 'thanks'):
            return random.choice(self.intents['thanks']['responses'])
        elif self._match_intent(message, 'goodbye'):
            # Reset conversation state
            state['stage'] = 'initial'
            state['data'] = {}
            return random.choice(self.intents['goodbye']['responses'])
        elif self._match_intent(message, 'book_appointment'):
            # Start new appointment
            state['stage'] = 'collecting_name'
            state['data'] = {}
            return "Of course! I'd be happy to help you book another appointment. What's your full name?"
        else:
            return "Your appointment has been submitted! Is there anything else I can help you with, or would you like to book another appointment?"
    
    def get_formatted_appointment_data(self, session_id: str) -> Optional[Dict]:
        """Get appointment data formatted for the existing storage system"""
        if session_id in self.conversation_state:
            state = self.conversation_state[session_id]
            if state['stage'] == 'completed' and state['data']:
                # Format data to match existing appointment system structure
                raw_data = state['data']
                formatted_data = {
                    'fullName': raw_data.get('fullName', ''),
                    'phone': raw_data.get('phone', ''),
                    'email': raw_data.get('email', ''),
                    'dateOfBirth': raw_data.get('dateOfBirth', ''),
                    'gender': raw_data.get('gender', ''),
                    'appointmentDate': raw_data.get('appointmentDate', ''),
                    'appointmentTime': raw_data.get('appointmentTime', ''),
                    'department': raw_data.get('department', ''),
                    'doctorPreference': raw_data.get('reason', ''),  # Use reason as doctor preference/notes
                    'reason': raw_data.get('reason', '')
                }
                return formatted_data
        return None
    
    def _match_intent(self, message: str, intent: str) -> bool:
        """Check if message matches an intent pattern"""
        if intent not in self.intents:
            return False
        
        patterns = self.intents[intent]['patterns']
        for pattern in patterns:
            if re.search(pattern, message, re.IGNORECASE):
                return True
        return False
    
    def get_appointment_data(self, session_id: str) -> Optional[Dict]:
        """Get collected appointment data for a session"""
        if session_id in self.conversation_state:
            state = self.conversation_state[session_id]
            if state['stage'] == 'completed':
                return state['data']
        return None
    
    def reset_conversation(self, session_id: str):
        """Reset conversation state for a session"""
        if session_id in self.conversation_state:
            del self.conversation_state[session_id]

# Global chatbot instance
chatbot = AppointmentChatbot()