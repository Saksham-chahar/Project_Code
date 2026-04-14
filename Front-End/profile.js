document.addEventListener('DOMContentLoaded', () => {
    const profileBtn = document.querySelector('.profile-btn');
    const profilePanel = document.getElementById('side-panel-profile');
    const closeProfileBtn = document.getElementById('close-profile-btn');
    const editProfileBtn = document.getElementById('edit-profile-btn');
    const cancelEditBtn = document.getElementById('cancel-edit-profile-btn');
    const globalOverlay = document.getElementById('sp-global-overlay');
    
    const viewMode = document.getElementById('profile-view-mode');
    const editMode = document.getElementById('profile-edit-mode');
    
    // View elements
    const viewFullName = document.getElementById('view-full-name');
    const viewEmail = document.getElementById('view-email');
    const viewUserType = document.getElementById('view-user-type');
    const viewStudentFields = document.getElementById('view-student-fields');
    const viewProfFields = document.getElementById('view-professor-fields');
    
    // Edit elements
    const editStudentFields = document.getElementById('edit-student-fields');
    const editProfFields = document.getElementById('edit-professor-fields');

    let isEditMode = false;
    let currentUser = window.loggedInUser || null;

    // Try reading cached user once
    const userStr = localStorage.getItem('user');
    if (userStr) {
        currentUser = JSON.parse(userStr);
    }

    // Load initial options
    fetchProfileOptions();

    if (profileBtn) {
        profileBtn.addEventListener('click', () => {
            if (profilePanel) profilePanel.classList.add('sp-open');
            if (globalOverlay) globalOverlay.classList.add('sp-active');
            loadUserProfile();
        });
    }

    if (closeProfileBtn) {
        closeProfileBtn.addEventListener('click', closePanel);
    }
    
    if (globalOverlay) {
        globalOverlay.addEventListener('click', () => {
            if (profilePanel && profilePanel.classList.contains('sp-open')) {
                closePanel();
            }
        });
    }

    if (editProfileBtn) {
        editProfileBtn.addEventListener('click', () => {
            isEditMode = true;
            toggleMode();
        });
    }

    if (cancelEditBtn) {
        cancelEditBtn.addEventListener('click', () => {
            isEditMode = false;
            toggleMode();
        });
    }
    
    const editForm = document.getElementById('profile-edit-mode');
    if (editForm) {
        editForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await saveUserProfile();
        });
    }

    function closePanel() {
        if (profilePanel) profilePanel.classList.remove('sp-open');
        if (globalOverlay) globalOverlay.classList.remove('sp-active');
        isEditMode = false;
        toggleMode();
    }

    function toggleMode() {
        if (!viewMode || !editMode) return;
        if (isEditMode) {
            viewMode.style.display = 'none';
            editMode.style.display = 'block';
            if (editProfileBtn) editProfileBtn.style.display = 'none';
        } else {
            viewMode.style.display = 'block';
            editMode.style.display = 'none';
            if (editProfileBtn) editProfileBtn.style.display = 'block';
        }
    }

    async function fetchProfileOptions() {
        try {
            const res = await fetch('http://localhost:5000/api/profile/options');
            if (res.ok) {
                const data = await res.json();
                populateDropdown('edit-student-dept-select', data.departments, 'dept_id', 'dept_name');
                populateDropdown('edit-prof-dept-select', data.departments, 'dept_id', 'dept_name');
                populateDropdown('edit-student-hostel-select', data.hostels, 'host_id', 'location_name');
            }
        } catch (err) {
            console.error('Failed to fetch profile options:', err);
        }
    }

    function populateDropdown(selectId, items, valueKey, textKey) {
        const select = document.getElementById(selectId);
        if (!select) return;
        // Keep the placeholder first option
        const placeholder = select.options[0];
        select.innerHTML = '';
        if (placeholder) select.appendChild(placeholder);

        items.forEach(item => {
            const option = document.createElement('option');
            option.value = item[valueKey];
            option.textContent = item[textKey];
            select.appendChild(option);
        });
    }

    async function loadUserProfile() {
        const usrStr = localStorage.getItem('user');
        if (!usrStr) {
            if (viewFullName) viewFullName.textContent = 'Not logged in';
            if (viewEmail) viewEmail.textContent = '-';
            if (viewUserType) viewUserType.textContent = '-';
            return;
        }

        const userObj = JSON.parse(usrStr);
        if (!userObj.user_id) {
            if (viewFullName) viewFullName.textContent = 'Missing User ID';
            return;
        }

        if (viewFullName) viewFullName.textContent = 'Loading...';

        try {
            const res = await fetch(`http://localhost:5000/api/profile?user_id=${userObj.user_id}`);
            if (res.ok) {
                currentUser = await res.json();
                // Ensure front-end has the ID stored accurately for saving
                currentUser.user_id = userObj.user_id; 
                populateView(currentUser);
                populateEditFlow(currentUser);
            } else {
                if (viewFullName) viewFullName.textContent = 'Error loading profile';
            }
        } catch (err) {
            console.error('Failed to fetch profile:', err);
            if (viewFullName) viewFullName.textContent = 'Connection Error';
        }
    }

    function populateView(data) {
        if (viewFullName) viewFullName.textContent = data.full_name || '-';
        if (viewEmail) viewEmail.textContent = data.email || '-';
        if (viewUserType) viewUserType.textContent = data.user_type || 'Unknown';

        if (viewStudentFields) viewStudentFields.style.display = 'none';
        if (viewProfFields) viewProfFields.style.display = 'none';

        if (data.user_type === 'student') {
            if (viewStudentFields) viewStudentFields.style.display = 'block';
            const deptEl = document.getElementById('view-student-dept');
            if (deptEl) deptEl.textContent = data.dept_name || 'Not Set';
            
            const hostelEl = document.getElementById('view-student-hostel');
            if (hostelEl) hostelEl.textContent = data.hostel_name || 'Not Set';
            
            const yearEl = document.getElementById('view-student-year');
            if (yearEl) yearEl.textContent = data.year_of_study || 'Not Set';
            
        } else if (data.user_type === 'professor') {
            if (viewProfFields) viewProfFields.style.display = 'block';
            
            const deptEl = document.getElementById('view-prof-dept');
            if (deptEl) deptEl.textContent = data.dept_name || 'Not Set';
            
            const desigEl = document.getElementById('view-prof-desig');
            if (desigEl) desigEl.textContent = data.designation || 'Not Set';
            
            const availEl = document.getElementById('view-prof-avail');
            if (availEl) availEl.textContent = data.is_available !== 0 ? 'Yes' : 'No';
        }
    }

    function populateEditFlow(data) {
        if (editStudentFields) editStudentFields.style.display = 'none';
        if (editProfFields) editProfFields.style.display = 'none';

        const nameInput = document.getElementById('edit-full-name-input');
        if (nameInput) nameInput.value = data.full_name || '';

        const emailText = document.getElementById('edit-email');
        if (emailText) emailText.textContent = data.email || '';

        const typeText = document.getElementById('edit-user-type');
        if (typeText) typeText.textContent = data.user_type || 'Unknown';

        if (data.user_type === 'student') {
            if (editStudentFields) editStudentFields.style.display = 'block';
            
            const deptSelect = document.getElementById('edit-student-dept-select');
            if (deptSelect && data.dept_id) deptSelect.value = data.dept_id;
            
            const hostSelect = document.getElementById('edit-student-hostel-select');
            if (hostSelect && data.host_id) hostSelect.value = data.host_id;
            
            const yearInput = document.getElementById('edit-student-year-input');
            if (yearInput && data.year_of_study) yearInput.value = data.year_of_study;
            
        } else if (data.user_type === 'professor') {
            if (editProfFields) editProfFields.style.display = 'block';
            
            const deptSelect = document.getElementById('edit-prof-dept-select');
            if (deptSelect && data.dept_id) deptSelect.value = data.dept_id;
            
            const desigInput = document.getElementById('edit-prof-desig-input');
            if (desigInput && data.designation) desigInput.value = data.designation;
            
            const availSelect = document.getElementById('edit-prof-avail-select');
            if (availSelect) availSelect.value = data.is_available === 0 ? "0" : "1";
        }
    }

    async function saveUserProfile() {
        if (!currentUser) return;

        const payload = {
            user_id: currentUser.user_id,
            user_type: currentUser.user_type
        };

        const nameInput = document.getElementById('edit-full-name-input');
        if (nameInput) payload.full_name = nameInput.value;

        if (payload.user_type === 'student') {
            payload.dept_id = document.getElementById('edit-student-dept-select').value;
            payload.host_id = document.getElementById('edit-student-hostel-select').value;
            payload.year_of_study = document.getElementById('edit-student-year-input').value;
        } else if (payload.user_type === 'professor') {
            payload.dept_id = document.getElementById('edit-prof-dept-select').value;
            payload.designation = document.getElementById('edit-prof-desig-input').value;
            payload.is_available = parseInt(document.getElementById('edit-prof-avail-select').value, 10);
        }

        try {
            const saveBtn = editForm.querySelector('button[type="submit"]');
            if (saveBtn) {
                saveBtn.textContent = 'Saving...';
                saveBtn.disabled = true;
            }

            const res = await fetch('http://localhost:5000/api/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (saveBtn) {
                saveBtn.textContent = 'Save';
                saveBtn.disabled = false;
            }

            if (res.ok) {
                // Reload visual
                await loadUserProfile();
                isEditMode = false;
                toggleMode();
            } else {
                alert('Error saving profile');
            }
        } catch (err) {
            console.error('Save error:', err);
            alert('Connection error');
        }
    }
});
