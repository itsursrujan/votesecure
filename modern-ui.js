// Toast Notification System
class ToastSystem {
    static show(message, type = 'info', duration = 3000) {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s ease-out forwards';
            setTimeout(() => toast.remove(), 300);
        }, duration);
    }
}

// Loading Spinner
class LoadingSpinner {
    static show() {
        const spinner = document.createElement('div');
        spinner.className = 'loading-spinner';
        spinner.id = 'global-spinner';
        document.body.appendChild(spinner);
    }

    static hide() {
        const spinner = document.getElementById('global-spinner');
        if (spinner) spinner.remove();
    }
}

// Form Validation
class FormValidator {
    static validate(formElement) {
        const inputs = formElement.querySelectorAll('input, select, textarea');
        let isValid = true;

        inputs.forEach(input => {
            if (input.hasAttribute('required') && !input.value.trim()) {
                this.showError(input, 'This field is required');
                isValid = false;
            } else if (input.type === 'email' && !this.isValidEmail(input.value)) {
                this.showError(input, 'Please enter a valid email address');
                isValid = false;
            } else {
                this.clearError(input);
            }
        });

        return isValid;
    }

    static showError(input, message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        input.classList.add('error');
        input.parentNode.appendChild(errorDiv);
    }

    static clearError(input) {
        input.classList.remove('error');
        const errorDiv = input.parentNode.querySelector('.error-message');
        if (errorDiv) errorDiv.remove();
    }

    static isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }
}

// Smooth Scrolling
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Intersection Observer for Animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('animate');
            observer.unobserve(entry.target);
        }
    });
}, observerOptions);

document.querySelectorAll('.feature, .content-section').forEach(element => {
    observer.observe(element);
});

// Face Recognition Progress Indicator
class FaceRecognitionUI {
    static showProgress() {
        const progressContainer = document.createElement('div');
        progressContainer.className = 'face-recognition-progress';
        progressContainer.innerHTML = `
            <div class="progress-spinner"></div>
            <p>Processing face recognition...</p>
        `;
        document.body.appendChild(progressContainer);
    }

    static hideProgress() {
        const progressContainer = document.querySelector('.face-recognition-progress');
        if (progressContainer) progressContainer.remove();
    }
}

// Export all classes for use in other files
window.ToastSystem = ToastSystem;
window.LoadingSpinner = LoadingSpinner;
window.FormValidator = FormValidator;
window.FaceRecognitionUI = FaceRecognitionUI; 