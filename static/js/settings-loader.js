// Settings Loader - Apply dynamic settings to website
let websiteSettings = {};

// Load settings when page loads
document.addEventListener('DOMContentLoaded', function() {
    loadWebsiteSettings();
    
    // Listen for settings updates
    window.addEventListener('settingsUpdated', function() {
        loadWebsiteSettings();
    });
});

async function loadWebsiteSettings() {
    try {
        const response = await fetch('/api/settings');
        websiteSettings = await response.json();
        applySettingsToPage();
    } catch (error) {
        console.error('Error loading website settings:', error);
    }
}

function applySettingsToPage() {
    const path = window.location.pathname;
    
    // Apply settings based on current page
    if (path === '/' || path === '/index') {
        applyHomepageSettings();
    }
    
    // Apply global settings to all pages
    applyGlobalSettings();
}

function applyHomepageSettings() {
    const contentSettings = websiteSettings['website-content'] || {};
    
    // Update hero section
    const heroTitle = document.querySelector('.hero-section h1');
    if (heroTitle && contentSettings.heroTitle) {
        const titleSpan = heroTitle.querySelector('span');
        if (titleSpan) {
            heroTitle.innerHTML = contentSettings.heroTitle.replace('Priority', '<span class="text-primary">Priority</span>');
        } else {
            heroTitle.innerHTML = contentSettings.heroTitle;
        }
    }
    
    const heroSubtitle = document.querySelector('.hero-section .lead');
    if (heroSubtitle && contentSettings.heroSubtitle) {
        heroSubtitle.textContent = contentSettings.heroSubtitle;
    }
    
    // Update statistics
    updateStatistic('.stat-number', contentSettings.totalPatients, '15K+');
    updateStatistic('.stat-number', contentSettings.totalDoctors, '50+', 1);
    updateStatistic('.stat-number', contentSettings.yearsExperience, '25', 2);
    updateStatistic('.stat-number', contentSettings.emergencyAvailability, '24/7', 3);
    
    // Update appointment hours
    const appointmentSettings = websiteSettings['appointment-settings'] || {};
    updateScheduleItem('Monday - Friday', appointmentSettings.weekdayHours || '8:00 AM - 8:00 PM');
    updateScheduleItem('Saturday', appointmentSettings.saturdayHours || '9:00 AM - 6:00 PM');
    updateScheduleItem('Sunday', appointmentSettings.sundayHours || '10:00 AM - 4:00 PM');
}

function applyGlobalSettings() {
    const clinicSettings = websiteSettings['clinic-info'] || {};
    
    // Update clinic name in navbar
    const navbarBrand = document.querySelector('.navbar-brand span');
    if (navbarBrand && clinicSettings.clinicName) {
        navbarBrand.textContent = clinicSettings.clinicName;
    }
    
    // Update page title
    const titleElement = document.querySelector('title');
    if (titleElement && clinicSettings.clinicName) {
        const currentTitle = titleElement.textContent;
        if (currentTitle.includes('DARSEHHA Clinic')) {
            titleElement.textContent = currentTitle.replace('DARSEHHA Clinic', clinicSettings.clinicName);
        }
    }
    
    // Update footer information
    const footerTitle = document.querySelector('footer h5');
    if (footerTitle && clinicSettings.clinicName) {
        footerTitle.innerHTML = `<i class="fas fa-heartbeat me-2"></i> ${clinicSettings.clinicName}`;
    }
    
    const footerDescription = document.querySelector('footer p.text-dark');
    if (footerDescription && clinicSettings.clinicDescription) {
        footerDescription.textContent = clinicSettings.clinicDescription;
    }
    
    // Update contact information in footer
    updateContactInfo('fas fa-phone', clinicSettings.clinicPhone || '(555) 123-4567');
    updateContactInfo('fas fa-envelope', clinicSettings.clinicEmail || 'info@darsehha.com');
    updateContactInfo('fas fa-map-marker-alt', clinicSettings.clinicAddress || '123 Health Street, Medical City');
    
    // Update emergency contact
    const emergencyCard = document.querySelector('.emergency-card .fs-4');
    if (emergencyCard && clinicSettings.emergencyPhone) {
        emergencyCard.textContent = `911 or ${clinicSettings.emergencyPhone}`;
    }
}

function updateStatistic(selector, newValue, defaultValue, index = 0) {
    const elements = document.querySelectorAll(selector);
    if (elements[index] && newValue) {
        elements[index].textContent = newValue;
    }
}

function updateScheduleItem(day, hours) {
    const scheduleItems = document.querySelectorAll('.schedule-item');
    scheduleItems.forEach(item => {
        const dayElement = item.querySelector('.fw-bold');
        if (dayElement && dayElement.textContent.includes(day)) {
            const hoursElement = item.querySelector('.text-primary');
            if (hoursElement) {
                hoursElement.textContent = hours;
            }
        }
    });
}

function updateContactInfo(iconClass, newValue) {
    const contactElements = document.querySelectorAll('footer p.text-dark');
    contactElements.forEach(element => {
        const icon = element.querySelector(`i.${iconClass.replace(' ', '.')}`);
        if (icon && newValue) {
            // Keep the icon and update the text
            const iconHtml = icon.outerHTML;
            element.innerHTML = `${iconHtml} ${newValue}`;
        }
    });
}

// Export for global use
window.websiteSettings = {
    load: loadWebsiteSettings,
    apply: applySettingsToPage,
    get: () => websiteSettings
};