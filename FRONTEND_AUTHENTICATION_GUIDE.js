/*
 * Frontend Authentication Guide
 * How to properly authenticate and access protected endpoints
 */

// ==========================================
// 1. LOGIN AND GET TOKEN
// ==========================================

async function login() {
    const response = await fetch(`${CONFIG.API_BASE}/auth/login`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            email: 'admin@agrivaan.com',
            password: 'password'
        })
    });
    
    if (response.ok) {
        const data = await response.json();
        const token = data.access_token;
        
        // SAVE TOKEN (store in localStorage or sessionStorage)
        localStorage.setItem('auth_token', token);
        console.log('✅ Login successful! Token saved.');
        return token;
    } else {
        console.error('❌ Login failed');
        return null;
    }
}

// ==========================================
// 2. GET TOKEN FROM STORAGE
// ==========================================

function getAuthToken() {
    return localStorage.getItem('auth_token');
}

// ==========================================
// 3. ACCESS PROTECTED ENDPOINTS WITH TOKEN
// ==========================================

async function getFarmers() {
    const token = getAuthToken();
    
    // If no token, must login first
    if (!token) {
        console.error('❌ No authentication token. Please login first.');
        return;
    }
    
    const response = await fetch(`${CONFIG.API_BASE}/farmers`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`  // ← IMPORTANT: Add token to header
        }
    });
    
    if (response.ok) {
        const data = await response.json();
        console.log('✅ Farmers data:', data);
        return data;
    } else if (response.status === 401) {
        console.error('❌ Token expired or invalid. Please login again.');
        localStorage.removeItem('auth_token');
        return null;
    } else {
        console.error('❌ Error fetching farmers');
        return null;
    }
}

// ==========================================
// 4. GET FARMER DETAILS
// ==========================================

async function getFarmerDetail(farmerId) {
    const token = getAuthToken();
    
    if (!token) {
        console.error('❌ No authentication token. Please login first.');
        return;
    }
    
    const response = await fetch(`${CONFIG.API_BASE}/farmers/${farmerId}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`  // ← IMPORTANT: Add token
        }
    });
    
    if (response.ok) {
        const data = await response.json();
        console.log('✅ Farmer detail:', data);
        return data;
    } else if (response.status === 401) {
        console.error('❌ Unauthorized. Token expired.');
        return null;
    } else {
        console.error('❌ Error fetching farmer details');
        return null;
    }
}

// ==========================================
// 5. GET ANALYTICS (Protected)
// ==========================================

async function getAnalytics() {
    const token = getAuthToken();
    
    if (!token) {
        console.error('❌ No authentication token. Please login first.');
        return;
    }
    
    const response = await fetch(`${CONFIG.API_BASE}/analytics/dashboard`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        }
    });
    
    if (response.ok) {
        const data = await response.json();
        console.log('✅ Analytics:', data);
        return data;
    } else if (response.status === 401) {
        console.error('❌ Unauthorized');
        return null;
    }
}

// ==========================================
// 6. GET SURVEY QUESTIONS (PUBLIC - No Auth)
// ==========================================

async function getSurveyQuestions() {
    // This endpoint is PUBLIC - no token needed
    const response = await fetch(`${CONFIG.API_BASE}/questions`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
            // NO Authorization header needed
        }
    });
    
    if (response.ok) {
        const data = await response.json();
        console.log('✅ Survey questions:', data);
        return data;
    }
}

// ==========================================
// 7. SUBMIT FARMER SURVEY (PUBLIC - No Auth)
// ==========================================

async function submitFarmerSurvey(surveyData) {
    // This endpoint is PUBLIC - for survey submissions
    const response = await fetch(`${CONFIG.API_BASE}/farmers`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
            // NO Authorization header needed
        },
        body: JSON.stringify(surveyData)
    });
    
    if (response.ok) {
        const data = await response.json();
        console.log('✅ Survey submitted:', data);
        return data;
    }
}

// ==========================================
// 8. LOGOUT AND CLEAR TOKEN
// ==========================================

function logout() {
    // Remove token from storage
    localStorage.removeItem('auth_token');
    console.log('✅ Logged out. Token cleared.');
}

// ==========================================
// 9. CHECK IF LOGGED IN
// ==========================================

function isLoggedIn() {
    const token = getAuthToken();
    return token !== null && token !== undefined;
}

// ==========================================
// 10. EXAMPLE WORKFLOW
// ==========================================

/*
Step 1: User logs in
  → await login()
  → Token saved to localStorage

Step 2: User can now access protected endpoints
  → await getFarmers()
  → await getFarmerDetail(123)
  → await getAnalytics()

Step 3: Frontend automatically sends token in Authorization header
  → Authorization: Bearer eyJhbGc...

Step 4: Backend validates token
  → If valid: Returns data ✅
  → If invalid: Returns 401 Unauthorized

Step 5: User logs out
  → logout()
  → Token removed from storage
*/

// ==========================================
// IMPLEMENTATION IN HTML
// ==========================================

/*
<button onclick="handleLogin()">Login</button>
<button onclick="handleGetFarmers()">Get Farmers</button>
<button onclick="logout(); location.reload();">Logout</button>

<script>
async function handleLogin() {
    const token = await login();
    if (token) {
        alert('✅ Login successful!');
    }
}

async function handleGetFarmers() {
    if (!isLoggedIn()) {
        alert('❌ Please login first');
        return;
    }
    
    const farmers = await getFarmers();
    if (farmers) {
        console.log(farmers);
        // Display farmers on page
    }
}
</script>
*/

// ==========================================
// SECURITY BEST PRACTICES
// ==========================================

/*
1. ✅ Always send token in Authorization header
   Authorization: Bearer <token>

2. ✅ Store token securely (localStorage for now)
   Consider: sessionStorage for more security

3. ✅ Clear token on logout
   localStorage.removeItem('auth_token')

4. ✅ Check if logged in before accessing protected endpoints
   if (!isLoggedIn()) { /* show login */ }

5. ✅ Handle 401 responses
   If token expired, force re-login

6. ✅ Use HTTPS in production
   Never send tokens over HTTP

7. ✅ Don't expose token in URL
   Always use Authorization header
*/

// ==========================================
// COMMON ERRORS & SOLUTIONS
// ==========================================

/*
Error: 401 Unauthorized
Solution: Token is missing or expired
  → Check localStorage has auth_token
  → Login again if token is missing
  → Token expires after 24 hours

Error: 403 Forbidden
Solution: User doesn't have permission
  → Admin account might be needed
  → Check user role/permissions

Error: CORS error
Solution: Frontend URL not allowed
  → Update ALLOWED_ORIGINS in backend .env
  → Example: ALLOWED_ORIGINS=http://localhost:3000
*/
