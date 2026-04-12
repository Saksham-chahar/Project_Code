document.addEventListener('DOMContentLoaded', () => {
    // 1. Grab your three main panels using your exact class names
    const signUpPanel = document.querySelector('.sign-up');
    const verifyPanel = document.querySelector('.verify-email');
    const logInPanel = document.querySelector('.log-in');

    // 2. Grab all the clickable buttons and links
    const linkToLogin = document.getElementById('link-to-login');
    const linkToSignup = document.getElementById('link-to-signup');
    const signupForm = document.getElementById('signup-form');
    const verifyForm = document.getElementById('verify-form');
    const prevBtn = document.getElementById('prev-btn');

    // Store email for verification step
    let savedEmail = '';

    // 3. Helper function to swap the active class
    function switchPanel(panelToShow) {
        // First, remove 'active' from all panels
        signUpPanel.classList.remove('active');
        verifyPanel.classList.remove('active');
        logInPanel.classList.remove('active');
        
        // Then, add 'active' only to the one we want to see
        panelToShow.classList.add('active');
    }

    // --- Set Default State ---
    // Make Sign Up visible as soon as the page loads
    switchPanel(signUpPanel);

    // --- Event Listeners (The Triggers) ---

    // Click "Already have an account?" -> Show Log In
    if (linkToLogin) {
        linkToLogin.addEventListener('click', (e) => {
            e.preventDefault(); // Stop page jump
            switchPanel(logInPanel);
        });
    }

    // Click "Don't have an account?" -> Show Sign Up
    if (linkToSignup) {
        linkToSignup.addEventListener('click', (e) => {
            e.preventDefault(); 
            switchPanel(signUpPanel);
        });
    }

    // Submit "Sign Up" Form -> Process Registration
    if (signupForm) {
        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault(); // Stop form from refreshing the page
            
            const name = document.getElementById('sign-name').value;
            const email = document.getElementById('sign-email').value;
            const password = document.getElementById('sign-password').value;
            const userType = 'student'; // Set user type based on request

            try {
                const response = await fetch('http://localhost:5000/api/auth/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ full_name: name, email, password, user_type: userType })
                });

                if (response.ok) {
                    savedEmail = email; // Store for the verification step
                    switchPanel(verifyPanel);
                } else {
                    const data = await response.json().catch(() => ({}));
                    alert(data.message || 'Registration failed. Please try again.');
                }
            } catch (error) {
                console.error('Registration Error:', error);
                alert('Connection error. Please check if the server is running.');
            }
        });
    }

    // Submit "Verify" Form -> Verify OTP and Redirect
    if (verifyForm) {
        verifyForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const otp = document.getElementById('verify-otp').value;

            try {
                const response = await fetch('http://localhost:5000/api/auth/verify-otp', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: savedEmail, otp })
                });

                if (response.ok) {
                    // Registration complete, load home page
                    window.location.href = 'home.html';
                } else {
                    const data = await response.json().catch(() => ({}));
                    alert(data.message || 'Verification failed. Please check the OTP.');
                }
            } catch (error) {
                console.error('Verification Error:', error);
                alert('Connection error. Please try again.');
            }
        });
    }

    // Click "Previous" -> Go back to Sign Up
    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            switchPanel(signUpPanel);
        });
    }
});