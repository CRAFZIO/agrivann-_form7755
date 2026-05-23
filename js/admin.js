const API_BASE = CONFIG.API_BASE;

const axiosInstance = axios.create({
    baseURL: API_BASE
});

// Interceptor to attach JWT token to every request
axiosInstance.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('agrivaan_token');
        if (token && token !== 'undefined' && token !== 'null') {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Global error handler for Auth issues
async function handleAuthError(error) {
    console.error('API Error:', error.response);
    if (error.response && (error.response.status === 401 || error.response.status === 422)) {
        console.warn('Session expired or invalid token. Redirecting to login...');
        localStorage.removeItem('agrivaan_token');
        localStorage.removeItem('admin_email');
        window.location.href = 'login.html';
    }
}

async function loadDashboard() {
    try {
        const statsRes = await axiosInstance.get('/analytics/dashboard');
        const stats = statsRes.data;

        document.getElementById('totalFarmers').innerText = stats.total_farmers || 0;
        document.getElementById('machineryUsers').innerText = stats.machinery_users || 0;
        document.getElementById('livestockUsers').innerText = stats.livestock_users || 0;
        document.getElementById('vehicleOwners').innerText = stats.vehicle_owners || 0;
        
        if (document.getElementById('appInterested')) {
            document.getElementById('appInterested').innerText = stats.app_interested || 0;
        }
        if (document.getElementById('whatsappPerm')) {
            document.getElementById('whatsappPerm').innerText = stats.whatsapp_perm || 0;
        }

        const adminEmail = localStorage.getItem('admin_email');
        if (document.getElementById('adminEmailDisplay')) {
            document.getElementById('adminEmailDisplay').innerText = adminEmail || 'Admin';
        }

        loadRecentFarmers();
    } catch (error) {
        handleAuthError(error);
    }
}

async function loadRecentFarmers() {
    try {
        const response = await axiosInstance.get('/farmers?per_page=5');
        const tableBody = document.getElementById('recentFarmersTable');
        if (!tableBody) return;
        
        tableBody.innerHTML = '';
        if (response.data.farmers && response.data.farmers.length > 0) {
            response.data.farmers.forEach(farmer => {
                const date = new Date(farmer.created_at).toLocaleDateString();
                tableBody.innerHTML += `
                    <tr>
                        <td data-label="Full Name">${farmer.full_name}</td>
                        <td data-label="District">${farmer.district || '-'}</td>
                        <td data-label="Mobile">${farmer.mobile_number}</td>
                        <td data-label="Joined Date">${date}</td>
                        <td data-label="Actions">
                            <a href="farmer-view.html?id=${farmer.id}" class="btn btn-sm btn-light"><i class="fas fa-eye text-success"></i></a>
                        </td>
                    </tr>
                `;
            });
        } else {
            tableBody.innerHTML = '<tr><td colspan="5" class="text-center">No recent registrations found</td></tr>';
        }
    } catch (error) {
        console.error('Error loading recent farmers:', error);
    }
}

async function exportData() {
    try {
        const response = await axiosInstance.get('/export/excel', { responseType: 'blob' });
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `Agrivaan_Farmers_${new Date().toISOString().slice(0,10)}.xlsx`);
        document.body.appendChild(link);
        link.click();
        link.remove();
    } catch (error) {
        alert('Export failed. Please try logging in again.');
    }
}

// New function to export full survey data for all farmers
async function exportSurveyData() {
    try {
        const response = await axiosInstance.get('/export/survey', { responseType: 'blob' });
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `Agrivaan_SurveyData_${new Date().toISOString().slice(0,10)}.xlsx`);
        document.body.appendChild(link);
        link.click();
        link.remove();
    } catch (error) {
        alert('Survey export failed. Please try again.');
    }
}

function logout() {
    localStorage.removeItem('agrivaan_token');
    localStorage.removeItem('admin_email');
    window.location.href = 'login.html';
}

// Ensure logout button works
document.addEventListener('click', (e) => {
    if (e.target.id === 'logoutBtn' || e.target.closest('#logoutBtn')) {
        e.preventDefault();
        logout();
    }
});

// Check auth on page load for protected pages
if (!window.location.pathname.includes('login.html') && 
    !window.location.pathname.includes('index.html') && 
    !window.location.pathname.includes('survey.html')) {
    const token = localStorage.getItem('agrivaan_token');
    if (!token) {
        window.location.href = 'login.html';
    }
}

// Sidebar Toggle Logic for Mobile
document.addEventListener('DOMContentLoaded', () => {
    const sidebar = document.getElementById('sidebar');
    const toggler = document.getElementById('sidebarToggle');
    
    if (sidebar && toggler) {
        toggler.addEventListener('click', (e) => {
            e.stopPropagation();
            sidebar.classList.toggle('active');
        });

        // Close sidebar when clicking outside on mobile
        document.addEventListener('click', (e) => {
            if (sidebar.classList.contains('active') && 
                !sidebar.contains(e.target) && 
                !toggler.contains(e.target)) {
                sidebar.classList.remove('active');
            }
        });
    }

    // Set Active Link based on URL
    const currentPath = window.location.pathname;
    document.querySelectorAll('.sidebar-link').forEach(link => {
        if (currentPath.includes(link.getAttribute('href'))) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
});

function logout() {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('agrivaan_token');
        localStorage.removeItem('admin_email');
        window.location.href = 'login.html';
    }
}
