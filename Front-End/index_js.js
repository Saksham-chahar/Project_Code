document.addEventListener('DOMContentLoaded', () => {
    // 1. Grab your three main panels using your exact class names
    const signUpPanel = document.querySelector('.sign-up');
    const verifyPanel = document.querySelector('.verify-email');
    const logInPanel = document.querySelector('.log-in');

    // 2. Grab all the clickable buttons and links
    const linkToLogin = document.getElementById('link-to-login');
    const linkToSignup = document.getElementById('link-to-signup');
    const signupForm = document.getElementById('signup-form');
    const prevBtn = document.getElementById('prev-btn');

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

    // Submit "Sign Up" Form -> Show Verify Email
    if (signupForm) {
        signupForm.addEventListener('submit', (e) => {
            e.preventDefault(); // Stop form from refreshing the page
            switchPanel(verifyPanel);
        });
    }

    // Click "Previous" -> Go back to Sign Up
    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            switchPanel(signUpPanel);
        });
    }
});