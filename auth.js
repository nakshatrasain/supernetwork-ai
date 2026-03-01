// Initialize Supabase
const supabase = supabase.createClient(CONFIG.supabase.url, CONFIG.supabase.anonKey);

// Check if user is already logged in
async function checkAuth() {
  const { data: { session } } = await supabase.auth.getSession();
  if (session) {
    // Check if user has completed onboarding
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', session.user.id)
      .single();
    
    if (profile && profile.ikigai && Object.keys(profile.ikigai).length > 0) {
      window.location.href = 'search.html';
    } else {
      window.location.href = 'onboarding.html';
    }
  }
}

// Tab switching
function showTab(tab) {
  const loginForm = document.getElementById('loginForm');
  const signupForm = document.getElementById('signupForm');
  const tabs = document.querySelectorAll('.tab-btn');
  
  tabs.forEach(t => t.classList.remove('active'));
  
  if (tab === 'login') {
    loginForm.style.display = 'block';
    signupForm.style.display = 'none';
    tabs[0].classList.add('active');
  } else {
    loginForm.style.display = 'none';
    signupForm.style.display = 'block';
    tabs[1].classList.add('active');
  }
}

// Login
async function login() {
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;
  const errorEl = document.getElementById('loginError');
  
  if (!email || !password) {
    errorEl.textContent = 'Please fill in all fields';
    return;
  }
  
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });
  
  if (error) {
    errorEl.textContent = error.message;
  } else {
    // Check if profile exists and is complete
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', data.user.id)
      .single();
    
    if (profile && profile.ikigai && Object.keys(profile.ikigai).length > 0) {
      window.location.href = 'search.html';
    } else {
      window.location.href = 'onboarding.html';
    }
  }
}

// Signup
async function signup() {
  const name = document.getElementById('signupName').value;
  const email = document.getElementById('signupEmail').value;
  const password = document.getElementById('signupPassword').value;
  const errorEl = document.getElementById('signupError');
  
  if (!name || !email || !password) {
    errorEl.textContent = 'Please fill in all fields';
    return;
  }
  
  if (password.length < 6) {
    errorEl.textContent = 'Password must be at least 6 characters';
    return;
  }
  
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name: name
      }
    }
  });
  
  if (error) {
    errorEl.textContent = error.message;
  } else {
    // Create profile entry
    const { error: profileError } = await supabase
      .from('profiles')
      .insert([{
        user_id: data.user.id,
        email: email,
        name: name
      }]);
    
    if (profileError) {
      console.error('Profile creation error:', profileError);
    }
    
    window.location.href = 'onboarding.html';
  }
}

// Logout
async function logout() {
  await supabase.auth.signOut();
  window.location.href = 'index.html';
}

// Run auth check on page load
if (window.location.pathname.includes('index.html') || window.location.pathname === '/') {
  checkAuth();
}
