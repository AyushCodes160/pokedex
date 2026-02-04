const signUpButton = document.getElementById('signUp');
const signInButton = document.getElementById('signIn');
const container = document.getElementById('container');

// Mobile Toggle Elements
const toSigninMobile = document.getElementById('to-signin');
const toSignupMobile = document.getElementById('to-signup');

function showSignup() {
    container.classList.add("right-panel-active");
}

function showSignin() {
    container.classList.remove("right-panel-active");
}

signUpButton.addEventListener('click', showSignup);
signInButton.addEventListener('click', showSignin);

// Bind mobile toggles
if(toSignupMobile) toSignupMobile.addEventListener('click', showSignup);
if(toSigninMobile) toSigninMobile.addEventListener('click', showSignin);

// Signup Logic
const signupForm = document.getElementById('signup-form');
const signupError = document.getElementById('signup-error');

signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    signupError.textContent = '';
    
    const name = document.getElementById('signup-name').value;
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;

    try {
        const response = await fetch('/api/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password })
        });

        const data = await response.json();

        if (response.ok) {
            alert('Signup successful! Please check your email for the verification link.');
            container.classList.remove("right-panel-active"); // Switch to login
        } else {
            signupError.textContent = data.error || 'Signup failed';
        }
    } catch (err) {
        console.error(err);
        signupError.textContent = 'An error occurred. Please try again.';
    }
});

// Login Logic
const loginForm = document.getElementById('login-form');
const loginError = document.getElementById('login-error');

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    loginError.textContent = '';

    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (response.ok) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            window.location.href = 'index.html';
        } else {
            loginError.textContent = data.error || 'Login failed';
        }
    } catch (err) {
        console.error(err);
        loginError.textContent = 'An error occurred. Please try again.';
    }
});

// Verification & Password Reset Logic
document.addEventListener("DOMContentLoaded", async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const resetToken = urlParams.get('resetToken');
    const verifyToken = urlParams.get('token'); // Not usually on auth.html, but verification might redirect here if you change logic

    // Forgot Password Modal
    const forgotLink = document.querySelector('a[href="#"]'); // Identifying the "Forgot your password?" link
    const forgotModal = document.getElementById('forgot-password-modal');
    const closeModalElements = document.querySelectorAll('.close-modal');
    
    if (forgotLink && forgotLink.innerText.includes("Forgot")) {
        forgotLink.addEventListener('click', (e) => {
            e.preventDefault();
            forgotModal.style.display = "flex";
        });
    }

    closeModalElements.forEach(el => {
        el.addEventListener('click', () => {
            el.closest('.modal').style.display = "none";
        });
    });

    window.onclick = (event) => {
        if (event.target.classList.contains('modal')) {
            event.target.style.display = "none";
        }
    };

    // Send Reset Link
    const sendResetBtn = document.getElementById('send-reset-btn');
    if (sendResetBtn) {
        sendResetBtn.addEventListener('click', async () => {
            const email = document.getElementById('forgot-email').value;
            const msgDiv = document.getElementById('forgot-message');
            msgDiv.textContent = "Sending...";
            
            try {
                const res = await fetch('/api/forgot-password', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({ email })
                });
                const data = await res.json();
                msgDiv.textContent = data.message || "Check your email.";
                msgDiv.style.color = "green";
            } catch (e) {
                msgDiv.textContent = "Error sending email.";
            }
        });
    }

    // Reset Password Modal
    if (resetToken) {
        const resetModal = document.getElementById('reset-password-modal');
        resetModal.style.display = "flex";

        const confirmResetBtn = document.getElementById('confirm-reset-btn');
        confirmResetBtn.addEventListener('click', async () => {
            const newPassword = document.getElementById('new-password').value;
            const msgDiv = document.getElementById('reset-message');
            
            try {
                const res = await fetch('/api/reset-password', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({ token: resetToken, newPassword })
                });
                
                if (res.ok) {
                    alert("Password reset successful! Please login.");
                    window.location.href = "auth.html"; // remove query params
                } else {
                    const data = await res.json();
                    msgDiv.textContent = data.error || "Reset failed.";
                }
            } catch (e) {
                msgDiv.textContent = "Error resetting password.";
            }
        });
    }
});
