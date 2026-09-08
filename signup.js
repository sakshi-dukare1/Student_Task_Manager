const signupForm = document.getElementById('signup-form');
const signupMessage = document.getElementById('signup-message');

// Check if user is already logged in
window.addEventListener('DOMContentLoaded', () => {
    if (localStorage.getItem('student-task-manager.loggedIn') === 'true') {
        window.location.href = 'index.html';
        return;
    }

    signupForm.addEventListener('submit', handleSignup);
});

async function handleSignup(event) {
    event.preventDefault();

    const fullName = document.getElementById('full-name').value.trim();
    const email = document.getElementById('signup-email').value.trim();
    const password = document.getElementById('signup-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;

    // Validate fields
    if (!fullName || !email || !password || !confirmPassword) {
        setSignupMessage('Please fill in all fields.', true);
        return;
    }

    // Validate email
    if (!email.includes('@') || !email.includes('.')) {
        setSignupMessage('Please enter a valid email address.', true);
        return;
    }

    // Validate password length
    if (password.length < 6) {
        setSignupMessage('Password must be at least 6 characters long.', true);
        return;
    }

    // Check if passwords match
    if (password !== confirmPassword) {
        setSignupMessage('Passwords do not match. Please try again.', true);
        return;
    }

    // Disable button and show loading state
    const signupBtn = document.querySelector('.signup-btn');
    signupBtn.classList.add('loading');
    signupBtn.textContent = 'Creating Account...';

    try {
        // Send request to backend
        const response = await fetch('http://localhost:3000/api/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                fullName, 
                email, 
                password 
            })
        });

        const data = await response.json();

        if (!response.ok) {
            setSignupMessage(data.error || 'Registration failed. Please try again.', true);
            signupBtn.classList.remove('loading');
            signupBtn.textContent = 'Create Account';
            return;
        }

        // Save user data in localStorage
        localStorage.setItem('student-task-manager.loggedIn', 'true');
        localStorage.setItem('student-task-manager.studentName', data.user.fullName);
        localStorage.setItem('student-task-manager.studentEmail', data.user.email);
        localStorage.setItem('student-task-manager.userId', data.user.id);

        setSignupMessage('Account created successfully! Redirecting to dashboard...', false);

        // Reset button
        signupBtn.classList.remove('loading');
        signupBtn.textContent = 'Create Account';

        // Redirect after delay
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 600);

    } catch (error) {
        console.error('Signup error:', error);
        setSignupMessage('Connection error. Please make sure the server is running.', true);
        signupBtn.classList.remove('loading');
        signupBtn.textContent = 'Create Account';
    }
}

function setSignupMessage(message, isError) {
    signupMessage.textContent = message;
    signupMessage.className = isError ? 'signup-message error' : 'signup-message success';
    
    // Clear message after 5 seconds (only for success messages)
    if (!isError) {
        setTimeout(() => {
            signupMessage.textContent = '';
            signupMessage.className = 'signup-message';
        }, 5000);
    }
}

// Real-time password match validation (optional enhancement)
document.getElementById('confirm-password')?.addEventListener('input', function() {
    const password = document.getElementById('signup-password').value;
    const confirmPassword = this.value;
    
    if (confirmPassword && password !== confirmPassword) {
        this.style.borderColor = '#dc2626';
        this.style.boxShadow = '0 0 0 3px rgba(220, 38, 38, 0.12)';
    } else if (confirmPassword && password === confirmPassword) {
        this.style.borderColor = '#16a34a';
        this.style.boxShadow = '0 0 0 3px rgba(22, 163, 74, 0.12)';
    } else {
        this.style.borderColor = '';
        this.style.boxShadow = '';
    }
});

// Real-time password strength indicator (optional enhancement)
document.getElementById('signup-password')?.addEventListener('input', function() {
    const password = this.value;
    const strengthIndicator = document.getElementById('password-strength');
    
    if (!strengthIndicator) {
        // Create strength indicator if it doesn't exist
        const indicator = document.createElement('div');
        indicator.id = 'password-strength';
        indicator.style.fontSize = '0.85rem';
        indicator.style.marginTop = '4px';
        indicator.style.fontWeight = '500';
        this.parentNode.appendChild(indicator);
    }
    
    const indicator = document.getElementById('password-strength');
    
    if (password.length === 0) {
        indicator.textContent = '';
        indicator.style.color = '';
        return;
    }
    
    if (password.length < 6) {
        indicator.textContent = 'Weak - Minimum 6 characters required';
        indicator.style.color = '#dc2626';
    } else if (password.length < 8) {
        indicator.textContent = 'Medium - Add more characters for strength';
        indicator.style.color = '#f59e0b';
    } else {
        indicator.textContent = 'Strong password!';
        indicator.style.color = '#16a34a';
    }
});
