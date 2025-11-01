// auth.js - Authentication logic for login page
(function(){
  // Elements
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');
  const emailInput = document.getElementById('login-email');
  const passInput = document.getElementById('login-password');
  const rememberChk = document.getElementById('remember');
  const toast = document.getElementById('toast');
  const showRegister = document.getElementById('show-register');
  const showLogin = document.getElementById('show-login');

  // Register inputs
  const regEmail = document.getElementById('register-email');
  const regPass = document.getElementById('register-password');
  const regPassConfirm = document.getElementById('register-password-confirm');

  // localStorage keys
  const USERS_KEY = 'tf_users';
  const SESSION_KEY = 'tf_session';
  const REMEMBER_KEY = 'tf_remember_email';

  // If already logged in, redirect to index
  const session = localStorage.getItem(SESSION_KEY);
  if(session){ location.href = 'index.html'; }

  // Helpers
  function showToast(message, duration=3000){
    if(!toast) return;
    toast.textContent = message;
    toast.hidden = false;
    toast.style.opacity = '1';
    setTimeout(()=>{
      toast.style.transition = 'opacity 250ms ease';
      toast.style.opacity = '0';
      setTimeout(()=>{ toast.hidden = true; toast.style.transition = ''; }, 260);
    }, duration);
  }

  function switchView(view){
    loginForm.style.display = view === 'login' ? 'flex' : 'none';
    registerForm.style.display = view === 'register' ? 'flex' : 'none';
    // focus first input
    setTimeout(()=>{
      const first = view === 'login' ? emailInput : regEmail;
      first && first.focus();
    }, 100);
  }

  // Crud for users
  function loadUsers(){
    try{ return JSON.parse(localStorage.getItem(USERS_KEY) || '{}') } catch(e){ return {} }
  }
  function saveUsers(obj){ localStorage.setItem(USERS_KEY, JSON.stringify(obj)); }

  // hash password (SHA-256)
  async function hashPassword(password){
    const enc = new TextEncoder();
    const buf = await crypto.subtle.digest('SHA-256', enc.encode(password));
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,'0')).join('');
  }

  async function registerUser(email, password){
    const users = loadUsers();
    const key = email.toLowerCase();
    if(users[key]) return {ok:false, reason:'exists'};
    const hash = await hashPassword(password);
    users[key] = { passwordHash: hash, created: Date.now() };
    saveUsers(users);
    return {ok:true};
  }

  async function validateLogin(email, password){
    const users = loadUsers();
    const key = email.toLowerCase();
    if(!users[key]) return {ok:false, reason:'not_found'};
    const hash = await hashPassword(password);
    if(hash !== users[key].passwordHash) return {ok:false, reason:'bad_password'};
    return {ok:true};
  }

  function createSession(email){
    localStorage.setItem(SESSION_KEY, email.toLowerCase());
    location.href = 'index.html'; // redirect after login
  }

  // Load remembered email
  const saved = localStorage.getItem(REMEMBER_KEY);
  if(saved && emailInput){ emailInput.value = saved; rememberChk.checked = true; }

  // Setup password toggles
  document.querySelectorAll('.password-toggle').forEach(btn => {
    btn.addEventListener('click', function(e){
      const input = this.previousElementSibling;
      const visible = input.type === 'text';
      input.type = visible ? 'password' : 'text';
      this.textContent = visible ? '👁️' : '👁️‍🗨️';
      this.setAttribute('data-visible', !visible);
      this.setAttribute('aria-label', visible ? 'Tampilkan kata sandi' : 'Sembunyikan kata sandi');
    });
  });

  // Wire up form handlers
  if(registerForm){
    registerForm.addEventListener('submit', async function(e){
      e.preventDefault();
      const email = regEmail.value.trim();
      const pass = regPass.value;
      const pass2 = regPassConfirm.value;
      if(!email){ showToast('Masukkan email'); regEmail.focus(); return }
      if(!pass || pass.length < 6){ showToast('Kata sandi minimal 6 karakter'); regPass.focus(); return }
      if(pass !== pass2){ showToast('Konfirmasi kata sandi tidak cocok'); regPassConfirm.focus(); return }

      const res = await registerUser(email, pass);
      if(!res.ok){
        if(res.reason === 'exists'){ showToast('Akun sudah terdaftar. Silakan masuk.'); switchView('login'); }
        else showToast('Gagal membuat akun.');
        return;
      }
      showToast('Akun berhasil dibuat.');
      // remember email & create session
      localStorage.setItem(REMEMBER_KEY, email.toLowerCase());
      setTimeout(()=> createSession(email), 800);
    });
  }

  if(loginForm){
    loginForm.addEventListener('submit', async function(e){
      e.preventDefault();
      const email = emailInput.value.trim();
      const pass = passInput.value;
      if(!email){ showToast('Mohon masukkan email.'); emailInput.focus(); return }
      if(!pass){ showToast('Mohon masukkan kata sandi.'); passInput.focus(); return }

      const res = await validateLogin(email, pass);
      if(!res.ok){
        if(res.reason === 'not_found'){ showToast('Akun tidak ditemukan. Silakan daftar.'); switchView('register'); }
        else if(res.reason === 'bad_password'){ showToast('Kata sandi salah.'); passInput.focus(); }
        return;
      }

      if(rememberChk.checked){ localStorage.setItem(REMEMBER_KEY, email.toLowerCase()); }
      else { localStorage.removeItem(REMEMBER_KEY); }

      showToast('Berhasil masuk...');
      setTimeout(()=> createSession(email), 800);
    });
  }

  // View toggles
  showRegister && showRegister.addEventListener('click', (e)=>{ e.preventDefault(); switchView('register'); });
  showLogin && showLogin.addEventListener('click', (e)=>{ e.preventDefault(); switchView('login'); });

})();