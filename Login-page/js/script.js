/* =================== ۱. مدیریت تم پیشرفته با گزینه‌های بیشتر =================== */
// اضافه کردن گزینه‌های تم بیشتر مانند 'auto' که بر اساس زمان روز تغییر کند
function setThemeWithExpiry(theme, days = 30) {
  const expiry = new Date();
  expiry.setDate(expiry.getDate() + days);
  localStorage.setItem('theme', JSON.stringify({ value: theme, expiry: expiry.getTime() }));
}

function getThemeWithExpiry() {
  const itemStr = localStorage.getItem('theme');
  if (!itemStr) return detectAutoTheme();
  try {
    const item = JSON.parse(itemStr);
    if (Date.now() > item.expiry) {
      localStorage.removeItem('theme');
      return detectAutoTheme();
    }
    return item.value === 'auto' ? detectAutoTheme() : item.value;
  } catch {
    return detectAutoTheme();
  }
}

function detectAutoTheme() {
  const hour = new Date().getHours();
  return (hour >= 6 && hour < 18) ? 'light' : 'dark';
}

const savedTheme = getThemeWithExpiry();
document.body.setAttribute('data-theme', savedTheme);

/* =================== ۲. ذرات نور پیشرفته با فیزیک بهبود یافته و افکت‌های جدید =================== */
const canvas = document.getElementById('particles-canvas');
const ctx = canvas.getContext('2d', { alpha: true, willReadFrequently: true }); // بهبود عملکرد
let particles = [];
let mouse = { x: null, y: null, radius: 180 }; // افزایش شعاع ماوس برای تعامل بیشتر
let animationFrame, lastTime = 0, fps = 60, interval = 1000 / fps;
let gravity = 0.01; // اضافه کردن گرانش سبک برای حرکت طبیعی‌تر

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  initParticles();
}

window.addEventListener('resize', debounce(resizeCanvas, 200)); // استفاده از debounce برای بهینه‌سازی
canvas.addEventListener('mousemove', e => { mouse.x = e.clientX; mouse.y = e.clientY; });
canvas.addEventListener('touchmove', e => { // پشتیبانی از تاچ برای موبایل
  const touch = e.touches[0];
  mouse.x = touch.clientX;
  mouse.y = touch.clientY;
});
canvas.addEventListener('mouseleave', () => { mouse.x = null; mouse.y = null; });
canvas.addEventListener('touchend', () => { mouse.x = null; mouse.y = null; });

class SmartParticle {
  constructor() {
    this.reset();
  }

  reset() {
    this.x = Math.random() * canvas.width;
    this.y = Math.random() * canvas.height;
    this.size = Math.random() * 3.5 + 0.8; // اندازه بزرگ‌تر برای خفن‌تر شدن
    this.speedX = Math.random() * 1.2 - 0.6;
    this.speedY = Math.random() * 1.2 - 0.6;
    this.color = getThemeColor();
    this.glow = Math.random() * 0.7 + 0.4;
    this.trail = []; // اضافه کردن trail برای افکت دنباله‌دار
  }

  update() {
    this.speedY += gravity; // اعمال گرانش
    this.x += this.speedX;
    this.y += this.speedY;

    // برخورد با مرزها با رنگ تغییر و bounce الاستیک
    if (this.x < 0 || this.x > canvas.width) {
      this.speedX *= -0.9; // الاستیسیته
      this.color = `rgba(255,150,150,${Math.random()*0.6+0.4})`;
      this.x = Math.max(0, Math.min(this.x, canvas.width));
    }
    if (this.y < 0 || this.y > canvas.height) {
      this.speedY *= -0.9;
      this.color = `rgba(150,255,150,${Math.random()*0.6+0.4})`;
      this.y = Math.max(0, Math.min(this.y, canvas.height));
    }

    if (mouse.x && mouse.y) {
      const dx = mouse.x - this.x, dy = mouse.y - this.y;
      const dist = Math.hypot(dx, dy); // استفاده از hypot برای محاسبه دقیق‌تر
      if (dist < mouse.radius) {
        const angle = Math.atan2(dy, dx);
        const force = (mouse.radius - dist) / mouse.radius * 5;
        this.speedX -= Math.cos(angle) * force;
        this.speedY -= Math.sin(angle) * force;
        this.color = `rgba(255,223,0,${force * 0.8 + 0.4})`;
      }
    }

    // مدیریت trail
    this.trail.push({ x: this.x, y: this.y });
    if (this.trail.length > 5) this.trail.shift();
  }

  draw() {
    // رسم trail برای افکت دنباله‌دار
    ctx.beginPath();
    this.trail.forEach((pos, i) => {
      ctx.lineTo(pos.x, pos.y);
      ctx.strokeStyle = `rgba(0,212,255,${(i / this.trail.length) * 0.3})`;
      ctx.lineWidth = this.size * (i / this.trail.length);
      ctx.stroke();
    });

    ctx.shadowColor = this.color;
    ctx.shadowBlur = this.glow * 15; // افزایش glow
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }
}

function getThemeColor() {
  const theme = document.body.getAttribute('data-theme');
  return theme === 'light' ? `rgba(0,102,204,${Math.random()*0.6+0.4})` : `rgba(0,212,255,${Math.random()*0.6+0.4})`;
}

function initParticles() {
  particles = [];
  const density = window.innerWidth * window.innerHeight / 6000; // افزایش تراکم برای خفن‌تر شدن
  const count = Math.min(300, Math.floor(density)); // حداکثر 300 برای عملکرد بهتر
  for (let i = 0; i < count; i++) particles.push(new SmartParticle());

  // بازیابی بک‌آپ اگر موجود باشد
  const backupStr = localStorage.getItem('particles-backup');
  if (backupStr) {
    const backup = JSON.parse(backupStr);
    backup.forEach((p, i) => {
      if (particles[i]) {
        Object.assign(particles[i], p);
      }
    });
  }
}

function connectParticles() {
  for (let a = 0; a < particles.length; a++) {
    for (let b = a + 1; b < particles.length; b++) { // بهینه‌سازی با شروع از a+1
      const dx = particles[a].x - particles[b].x;
      const dy = particles[a].y - particles[b].y;
      const dist = Math.hypot(dx, dy);
      if (dist < 120) { // افزایش فاصله اتصال
        const opacity = (1 - dist / 120) * 0.25;
        ctx.strokeStyle = `rgba(0,212,255,${opacity})`;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(particles[a].x, particles[a].y);
        ctx.lineTo(particles[b].x, particles[b].y);
        ctx.stroke();
      }
    }
  }
}

function optimizedAnimate(time) {
  animationFrame = requestAnimationFrame(optimizedAnimate);
  const delta = time - lastTime;
  if (delta >= interval) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => { p.update(); p.draw(); });
    connectParticles();
    lastTime = time - (delta % interval);
  }
}

document.addEventListener('visibilitychange', () => {
  if (document.hidden) cancelAnimationFrame(animationFrame);
  else {
    lastTime = performance.now();
    animationFrame = requestAnimationFrame(optimizedAnimate);
  }
});

// تابع debounce برای بهینه‌سازی
function debounce(func, wait) {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

initParticles();
animationFrame = requestAnimationFrame(optimizedAnimate);

/* =================== ۳. ساعت و تاریخ شمسی با انیمیشن پیشرفته =================== */
function updateDateTime() {
  const now = new Date();
  const options = {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
    timeZone: 'Asia/Tehran' // تنظیم timezone دقیق
  };
  const farsi = now.toLocaleString('fa-IR', options);
  const dt = document.getElementById('datetime');
  dt.textContent = farsi;
  dt.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.05)' }, { transform: 'scale(1)' }], {
    duration: 300,
    easing: 'ease-in-out'
  });
}

setInterval(updateDateTime, 1000);
updateDateTime();

/* =================== ۴. دریافت IP و نوتیفیکیشن با انیمیشن CSS بهبود یافته =================== */
const ipEl = document.getElementById('user-ip');

function showNotification(msg, type = 'info') {
  const n = document.createElement('div');
  n.className = `notification ${type}`;
  n.textContent = msg;
  n.style.cssText = `position:fixed;bottom:30px;right:30px;padding:15px 30px;border-radius:12px;
  background:${getNotificationColor(type)};color:white;z-index:2000;box-shadow:0 4px 12px rgba(0,0,0,0.2);
  animation:slideIn 0.4s ease-out forwards;`;
  document.body.appendChild(n);
  setTimeout(() => {
    n.style.animation = 'slideOut 0.4s ease-in forwards';
    setTimeout(() => n.remove(), 400);
  }, 3500);
}

function getNotificationColor(type) {
  switch (type) {
    case 'success': return '#4CAF50';
    case 'error': return '#f44336';
    case 'info': return '#2196F3';
    default: return '#FFC107';
  }
}

// استفاده از API بهتر و fallback
async function fetchIP() {
  try {
    const res = await fetch('https://api.ipify.org?format=json');
    const data = await res.json();
    ipEl.textContent = data.ip;
    showNotification('✅ IP با موفقیت دریافت شد', 'success');
  } catch {
    try {
      const res = await fetch('https://ipapi.co/json/');
      const data = await res.json();
      ipEl.textContent = data.ip;
      showNotification('✅ IP از منبع جایگزین دریافت شد', 'success');
    } catch {
      ipEl.textContent = 'خطا در دریافت';
      showNotification('❌ خطا در دریافت IP', 'error');
    }
  }
}

fetchIP();

/* =================== ۵. چشمک رمز عبور با انیمیشن و امنیت بیشتر =================== */
const togglePassword = document.querySelector('.toggle-password');
const passwordInput = document.querySelector('#password');

togglePassword.addEventListener('click', () => {
  const type = passwordInput.type === 'password' ? 'text' : 'password';
  passwordInput.type = type;
  togglePassword.textContent = type === 'password' ? '👁' : '🙈';
  togglePassword.animate([{ transform: 'translateY(-50%) scale(1)' }, { transform: 'translateY(-50%) scale(1.3)' }, { transform: 'translateY(-50%) scale(1)' }], {
    duration: 250,
    easing: 'ease-in-out'
  });
});

// جلوگیری از کپی رمز عبور
passwordInput.addEventListener('copy', e => e.preventDefault());
passwordInput.addEventListener('cut', e => e.preventDefault());

/* =================== ۶. تغییر تم با ripple و گزینه auto =================== */
const themeToggleBtn = document.getElementById('theme-toggle');

themeToggleBtn.addEventListener('click', (e) => {
  const ripple = document.createElement('span');
  ripple.classList.add('ripple');
  themeToggleBtn.appendChild(ripple);
  const rect = themeToggleBtn.getBoundingClientRect();
  ripple.style.left = `${e.clientX - rect.left}px`;
  ripple.style.top = `${e.clientY - rect.top}px`;
  setTimeout(() => ripple.remove(), 700); // افزایش زمان برای انیمیشن نرم‌تر

  let current = document.body.getAttribute('data-theme');
  let next;
  if (current === 'dark') next = 'light';
  else if (current === 'light') next = 'auto';
  else next = 'dark';

  document.body.setAttribute('data-theme', next);
  setThemeWithExpiry(next);
  particles.forEach(p => p.color = getThemeColor());
  showNotification(`تم به ${next === 'dark' ? 'تاریک' : next === 'light' ? 'روشن' : 'خودکار'} تغییر کرد`, 'success');
});

/* =================== ۷. کارت شناور با افکت‌های 3D پیشرفته =================== */
const card = document.querySelector('.login-box');

card.addEventListener('mousemove', (e) => {
  const rect = card.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  const cx = rect.width / 2;
  const cy = rect.height / 2;
  const rx = (y - cy) / cy * 15; // افزایش زاویه برای خفن‌تر شدن
  const ry = (cx - x) / cx * 15;
  card.style.transform = `perspective(1200px) rotateX(${rx}deg) rotateY(${ry}deg) scale(1.02)`;
  card.style.boxShadow = `0 ${Math.abs(rx * 2)}px ${Math.abs(ry * 3)}px rgba(0,0,0,0.3)`;
});

card.addEventListener('mouseleave', () => {
  card.style.transform = 'perspective(1200px) rotateX(0) rotateY(0) scale(1)';
  card.style.boxShadow = '0 10px 20px rgba(0,0,0,0.1)';
});

/* =================== ۸. محافظت کلیک راست با گزینه‌های سفارشی =================== */
document.addEventListener('contextmenu', e => {
  if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
    e.preventDefault();
    showNotification('ℹ️ کلیک راست غیرفعال است. برای کپی، از Ctrl+C استفاده کنید.', 'info');
  }
});

/* =================== ۹. Drag & Drop با پیش‌نمایش فایل =================== */
card.addEventListener('dragover', e => {
  e.preventDefault();
  card.style.borderColor = 'var(--accent)';
  card.style.boxShadow = '0 0 15px var(--accent)';
});

card.addEventListener('dragleave', () => {
  card.style.borderColor = 'var(--border)';
  card.style.boxShadow = '0 10px 20px rgba(0,0,0,0.1)';
});

card.addEventListener('drop', e => {
  e.preventDefault();
  card.style.borderColor = 'var(--border)';
  card.style.boxShadow = '0 10px 20px rgba(0,0,0,0.1)';
  const files = e.dataTransfer.files;
  if (files.length) {
    showNotification(`📁 ${files.length} فایل دریافت شد: ${files[0].name} ...`, 'success');
    // می‌توان پیش‌نمایش اضافه کرد، مثلاً برای تصاویر
    if (files[0].type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = ev => {
        const img = document.createElement('img');
        img.src = ev.target.result;
        img.style.maxWidth = '100px';
        card.appendChild(img); // مثال ساده، می‌توان modal اضافه کرد
        setTimeout(() => img.remove(), 5000);
      };
      reader.readAsDataURL(files[0]);
    }
  }
});

/* =================== ۱۰. ذخیره آمار ذرات با داده‌های بیشتر =================== */
window.addEventListener('beforeunload', () => {
  const backup = particles.slice(0, 20).map(p => ({ // افزایش تعداد بک‌آپ
    x: p.x, y: p.y, speedX: p.speedX, speedY: p.speedY, size: p.size, color: p.color
  }));
  localStorage.setItem('particles-backup', JSON.stringify(backup));
});

/* =================== ۱۱. ویژگی جدید: آب و هوا بر اساس IP =================== */
// گسترش: اضافه کردن نمایش آب و هوا
const weatherEl = document.createElement('div');
weatherEl.id = 'weather';
weatherEl.style.marginTop = '10px';
document.querySelector('.login-box').appendChild(weatherEl);

async function fetchWeather(ip) {
  try {
    const res = await fetch(`https://api.weatherapi.com/v1/current.json?key=YOUR_API_KEY&q=${ip}`); // جایگزین با API key واقعی
    const data = await res.json();
    weatherEl.textContent = `آب و هوا: ${data.current.condition.text} - ${data.current.temp_c}°C`;
    showNotification('🌤️ آب و هوا دریافت شد', 'success');
  } catch {
    weatherEl.textContent = 'خطا در دریافت آب و هوا';
    showNotification('❌ خطا در دریافت آب و هوا', 'error');
  }
}

// فراخوانی بعد از دریافت IP
// 注意: در کد واقعی، بعد از fetchIP فراخوانی کنید، اما اینجا مثال است

/* =================== ۱۲. ویژگی جدید: موسیقی پس‌زمینه =================== */
// گسترش: اضافه کردن موسیقی آرام برای خفن‌تر شدن
const audio = new Audio('path/to/calm-music.mp3'); // مسیر موسیقی
audio.loop = true;
audio.volume = 0.3;

const musicToggle = document.createElement('button');
musicToggle.textContent = '🎵';
musicToggle.style.position = 'fixed';
musicToggle.style.bottom = '20px';
musicToggle.style.left = '20px';
document.body.appendChild(musicToggle);

musicToggle.addEventListener('click', () => {
  if (audio.paused) {
    audio.play();
    musicToggle.textContent = '🔇';
    showNotification('🎶 موسیقی پخش شد', 'success');
  } else {
    audio.pause();
    musicToggle.textContent = '🎵';
    showNotification('🔇 موسیقی متوقف شد', 'info');
  }
});

/* =================== ۱۳. ویژگی جدید: لاگین با اعتبارسنجی ساده =================== */
// گسترش: اضافه کردن عملکرد لاگین واقعی (مثال ساده، بدون سرور)
const loginForm = document.querySelector('form');
loginForm.addEventListener('submit', e => {
  e.preventDefault();
  const username = document.querySelector('#username').value;
  const password = passwordInput.value;
  if (username === 'admin' && password === '123') {
    showNotification('✅ ورود موفق', 'success');
    // هدایت به صفحه دیگر یا چیزی
  } else {
    showNotification('❌ نام کاربری یا رمز اشتباه', 'error');
  }
});

console.log('🚀 Project Version: Ultimate 4.0 | Enhanced Features Loaded with Physics, Weather, Music, and More');
