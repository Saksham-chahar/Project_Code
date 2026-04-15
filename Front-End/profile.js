document.addEventListener('DOMContentLoaded', () => {
    const profileBtn = document.querySelector('.profile-btn');
    const profilePanel = document.getElementById('side-panel-profile');
    const closeProfileBtn = document.getElementById('close-profile-btn');
    const editProfileBtn = document.getElementById('edit-profile-btn');
    const cancelEditBtn = document.getElementById('cancel-edit-profile-btn');
    const globalOverlay = document.getElementById('sp-global-overlay');
    
    const viewMode = document.getElementById('profile-view-mode');
    const editMode = document.getElementById('profile-edit-mode');
    
    const viewFullName = document.getElementById('view-full-name');
    const viewEmail = document.getElementById('view-email');
    const viewUserType = document.getElementById('view-user-type');
    const viewStudentFields = document.getElementById('view-student-fields');
    const viewProfFields = document.getElementById('view-professor-fields');
    
    const editStudentFields = document.getElementById('edit-student-fields');
    const editProfFields = document.getElementById('edit-professor-fields');

    let isEditMode = false;
    let currentUser = null;

    // Load cached user
    const userStr = localStorage.getItem('user');
    if (userStr) {
        currentUser = JSON.parse(userStr);
    }

    fetchProfileOptions();

    if (profileBtn) {
        profileBtn.addEventListener('click', () => {
            if (profilePanel) profilePanel.classList.add('sp-open');
            if (globalOverlay) globalOverlay.classList.add('sp-active');
            loadUserProfile();
        });
    }

    if (closeProfileBtn) closeProfileBtn.addEventListener('click', closePanel);

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
            const res = await fetch('https://projectcode-production.up.railway.app/api/profile/options');
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
            return;
        }

        const userObj = JSON.parse(usrStr);

        // ✅ FIXED USER ID HANDLING
        const userId = userObj.user_id || userObj.id;

        if (!userId) {
            if (viewFullName) viewFullName.textContent = 'Missing User ID';
            return;
        }

        if (viewFullName) viewFullName.textContent = 'Loading...';

        try {
            const res = await fetch(`https://projectcode-production.up.railway.app/api/profile?user_id=${userId}`);

            if (res.ok) {
                currentUser = await res.json();

                // ✅ ensure correct ID stored
                currentUser.user_id = userId;

                populateView(currentUser);
                populateEditFlow(currentUser);
            } else {
                if (viewFullName) viewFullName.textContent = 'Error loading profile';
            }
        } catch (err) {
            console.error('Profile fetch error:', err);
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
            document.getElementById('view-student-dept').textContent = data.dept_name || 'Not Set';
            document.getElementById('view-student-hostel').textContent = data.hostel_name || 'Not Set';
            document.getElementById('view-student-year').textContent = data.year_of_study || 'Not Set';
        } else if (data.user_type === 'professor') {
            if (viewProfFields) viewProfFields.style.display = 'block';
            document.getElementById('view-prof-dept').textContent = data.dept_name || 'Not Set';
            document.getElementById('view-prof-desig').textContent = data.designation || 'Not Set';
            document.getElementById('view-prof-avail').textContent = data.is_available !== 0 ? 'Yes' : 'No';
        }
    }

    function populateEditFlow(data) {
        if (editStudentFields) editStudentFields.style.display = 'none';
        if (editProfFields) editProfFields.style.display = 'none';

        document.getElementById('edit-full-name-input').value = data.full_name || '';
        document.getElementById('edit-email').textContent = data.email || '';
        document.getElementById('edit-user-type').textContent = data.user_type || 'Unknown';

        if (data.user_type === 'student') {
            editStudentFields.style.display = 'block';
            document.getElementById('edit-student-dept-select').value = data.dept_id || '';
            document.getElementById('edit-student-hostel-select').value = data.host_id || '';
            document.getElementById('edit-student-year-input').value = data.year_of_study || '';
        } else if (data.user_type === 'professor') {
            editProfFields.style.display = 'block';
            document.getElementById('edit-prof-dept-select').value = data.dept_id || '';
            document.getElementById('edit-prof-desig-input').value = data.designation || '';
            document.getElementById('edit-prof-avail-select').value = data.is_available === 0 ? "0" : "1";
        }
    }

    async function saveUserProfile() {
        if (!currentUser) return;

        const payload = {
            user_id: currentUser.user_id,
            user_type: currentUser.user_type,
            full_name: document.getElementById('edit-full-name-input').value
        };

        if (payload.user_type === 'student') {
            payload.dept_id = document.getElementById('edit-student-dept-select').value;
            payload.host_id = document.getElementById('edit-student-hostel-select').value;
            payload.year_of_study = document.getElementById('edit-student-year-input').value;
        } else {
            payload.dept_id = document.getElementById('edit-prof-dept-select').value;
            payload.designation = document.getElementById('edit-prof-desig-input').value;
            payload.is_available = parseInt(document.getElementById('edit-prof-avail-select').value, 10);
        }

        try {
            const res = await fetch('https://projectcode-production.up.railway.app/api/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
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
