// contact.js — client-side contact form handling: validation, localStorage persistence, toast
(function(){
  const FORM_KEY = 'contact_submissions';
  const form = document.getElementById('contact-form');
  const toastEl = document.getElementById('toast');

  function showToast(message, duration = 3500){
    if(!toastEl) return;
    toastEl.textContent = message;
    toastEl.hidden = false;
    toastEl.style.opacity = '1';
    toastEl.style.transition = '';
    setTimeout(()=>{
      toastEl.style.transition = 'opacity 250ms ease';
      toastEl.style.opacity = '0';
      setTimeout(()=>{ toastEl.hidden = true; toastEl.style.transition = ''; }, 260);
    }, duration);
  }

  function isValidEmail(email){
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  function loadSubmissions(){
    try{ return JSON.parse(localStorage.getItem(FORM_KEY) || '[]'); }catch(e){ return []; }
  }
  function saveSubmission(obj){
    const arr = loadSubmissions();
    arr.push(obj);
    localStorage.setItem(FORM_KEY, JSON.stringify(arr));
  }

  if(!form) return;

  form.addEventListener('submit', function(e){
    e.preventDefault();
    const name = (document.getElementById('name')||{}).value || '';
    const email = (document.getElementById('email')||{}).value || '';
    const subject = (document.getElementById('subject')||{}).value || '';
    const message = (document.getElementById('message')||{}).value || '';

    if(!name.trim()){ showToast('Mohon isi nama Anda'); (document.getElementById('name')||{}).focus && document.getElementById('name').focus(); return }
    if(!email.trim() || !isValidEmail(email)){ showToast('Mohon masukkan email yang valid'); (document.getElementById('email')||{}).focus && document.getElementById('email').focus(); return }
    if(!message.trim()){ showToast('Mohon isi pesan Anda'); (document.getElementById('message')||{}).focus && document.getElementById('message').focus(); return }

    const payload = {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      subject: subject.trim(),
      message: message.trim(),
      createdAt: new Date().toISOString()
    };

    try{
      saveSubmission(payload);
      showToast('Pesan terkirim. Terima kasih!');
      form.reset();
    }catch(err){
      console.error(err);
      showToast('Terjadi kesalahan saat menyimpan pesan. Coba lagi.');
    }
  });

  // Optional: handle reset to give user feedback
  form.addEventListener('reset', function(){
    setTimeout(()=> showToast('Formulir dikosongkan'), 150);
  });

})();
