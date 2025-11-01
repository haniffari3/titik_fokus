// script.js — modal login behavior, simple validation, toast
(function(){
  // Check session first
  const SESSION_KEY = 'tf_session';
  if(!localStorage.getItem(SESSION_KEY)){
    location.href = 'login.html';
    return;
  }

  // Elements
  const loginBtn = document.getElementById('login-btn');
  const authArea = document.getElementById('auth-area');
  const modal = document.getElementById('login-modal');
  const overlayEls = modal ? modal.querySelectorAll('[data-close]') : [];
  const closeButtons = modal ? modal.querySelectorAll('[data-close]') : [];
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');
  const emailInput = document.getElementById('login-email');
  const passInput = document.getElementById('login-password');
  const rememberChk = document.getElementById('remember');
  const toast = document.getElementById('toast');
  const toRegister = document.getElementById('to-register');
  const toLogin = document.getElementById('to-login');

  // Register inputs
  const regEmail = document.getElementById('register-email');
  const regPass = document.getElementById('register-password');
  const regPassConfirm = document.getElementById('register-password-confirm');

  // localStorage keys
  const USERS_KEY = 'tf_users';
  const REMEMBER_KEY = 'tf_remember_email';

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

  function onKeyDown(e){ if(e.key === 'Escape') closeModal(); }

  function openModal(view='login'){
    if(!modal) return;
    modal.setAttribute('aria-hidden','false');
    // show view
    switchView(view);
    // focus first field
    setTimeout(()=>{
      const first = modal.querySelector('[data-view]:not([style*="display:none"]) input');
      first && first.focus();
    }, 120);
    // prefill email if remembered
    const saved = localStorage.getItem(REMEMBER_KEY);
    if(saved){
      const loginEmail = document.getElementById('login-email');
      if(loginEmail) loginEmail.value = saved;
      rememberChk.checked = true;
    }
    document.addEventListener('keydown', onKeyDown);
  }

  function closeModal(){
    if(!modal) return;
    modal.setAttribute('aria-hidden','true');
    document.removeEventListener('keydown', onKeyDown);
    loginBtn && loginBtn.focus();
  }

  // Crud for users: store map email -> passwordHash
  function loadUsers(){
    try{ return JSON.parse(localStorage.getItem(USERS_KEY) || '{}') } catch(e){ return {} }
  }
  function saveUsers(obj){ localStorage.setItem(USERS_KEY, JSON.stringify(obj)); }

  // hashing helper (SHA-256) -> hex
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

  function createSession(email){ localStorage.setItem(SESSION_KEY, email.toLowerCase()); updateAuthUI(); }
  function destroySession(){ localStorage.removeItem(SESSION_KEY); updateAuthUI(); }
  function getSession(){ return localStorage.getItem(SESSION_KEY); }

  function updateAuthUI(){
    const email = getSession();
    if(email){
      // show profile + logout
      authArea.innerHTML = `<div class="profile">
          <span class="profile-name">${escapeHtml(email)}</span>
          <button id="logout-btn" class="btn outline">Keluar</button>
        </div>`;
      const logoutBtn = document.getElementById('logout-btn');
      logoutBtn && logoutBtn.addEventListener('click', (e)=>{
        e.preventDefault();
        destroySession();
        showToast('Anda telah keluar.');
        // after logout, open the login modal so user can log in again
        setTimeout(()=>{ openModal('login'); }, 150);
      });
    } else {
      // show login button
      authArea.innerHTML = `<button id="login-btn" class="btn login-btn" aria-haspopup="dialog">Masuk</button>`;
      const newLoginBtn = document.getElementById('login-btn');
      newLoginBtn && newLoginBtn.addEventListener('click', (e)=>{ e.preventDefault(); openModal('login'); });
    }
  }

  function escapeHtml(s){ return String(s).replace(/[&<>\"']/g, (c)=>({ '&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;' })[c]); }

  function switchView(view){
    const loginV = document.querySelector('[data-view="login"]');
    const regV = document.querySelector('[data-view="register"]');
    if(view === 'register'){
      loginV && (loginV.style.display = 'none');
      regV && (regV.style.display = 'block');
    } else {
      loginV && (loginV.style.display = 'block');
      regV && (regV.style.display = 'none');
    }
  }

  // wire events
  if(loginBtn) loginBtn.addEventListener('click', (e)=>{ e.preventDefault(); openModal('login'); });
  overlayEls.forEach(btn => btn.addEventListener('click', (e)=>{ e.preventDefault(); closeModal(); }));
  closeButtons.forEach(btn => btn.addEventListener('click', (e)=>{ e.preventDefault(); closeModal(); }));

  // toggle links
  toRegister && toRegister.addEventListener('click', (e)=>{ e.preventDefault(); switchView('register'); });
  toLogin && toLogin.addEventListener('click', (e)=>{ e.preventDefault(); switchView('login'); });

  // register handler
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
      if(!res.ok){ if(res.reason === 'exists'){ showToast('Akun sudah terdaftar. Silakan masuk.'); switchView('login'); } else showToast('Gagal membuat akun.'); return }
      showToast('Akun berhasil dibuat. Anda otomatis masuk.');
      // remember option: set remembered email
      localStorage.setItem(REMEMBER_KEY, email.toLowerCase());
      createSession(email);
      setTimeout(closeModal, 900);
    });
  }

  // login handler
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
      // remember
      if(rememberChk.checked){ localStorage.setItem(REMEMBER_KEY, email.toLowerCase()); }
      else { localStorage.removeItem(REMEMBER_KEY); }
      createSession(email);
      showToast('Berhasil masuk sebagai ' + email, 2000);
      setTimeout(closeModal, 700);
    });
  }

  // initialize UI from session
  updateAuthUI();

})();
