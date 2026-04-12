/* panel.js */
document.addEventListener('DOMContentLoaded', () => {
    const overlay = document.getElementById('sp-global-overlay');

    // Generic function to open a panel by its ID
    window.openPanel = function(panelId) {
        if (!overlay) return;
        
        // Ensure any currently open panels are closed first
        window.closePanels();

        const panel = document.getElementById(panelId);
        if (panel) {
            overlay.classList.add('sp-active');
            panel.classList.add('sp-open');
        }
    };

    // Generic function to close all open panels and hide overlay
    window.closePanels = function() {
        if (overlay) {
            overlay.classList.remove('sp-active');
        }

        const openPanels = document.querySelectorAll('.sp-side-panel.sp-open');
        openPanels.forEach(panel => {
            panel.classList.remove('sp-open');
        });
    };

    // Global overlay click dismisses the panel
    if (overlay) {
        overlay.addEventListener('click', window.closePanels);
    }
    
    // Wire up all close buttons inside any panel
    const closeButtons = document.querySelectorAll('.sp-close-btn');
    closeButtons.forEach(btn => {
        btn.addEventListener('click', window.closePanels);
    });
});
