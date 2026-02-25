/* =================== پروژه روشنــا - نسخه نهایی بهبودیافته =================== */

// ۱. مدیریت تم (dark / light فقط - بدون auto برای سادگی)
function setTheme(theme) {
  document.body.setAttribute('data-theme', theme);
  localStorage.setItem('theme', theme);
  // بروزرسانی رنگ ذرات
  particles.forEach(p => { p.color = getThemeColor(); });
}

function loadTheme() {
  const saved = localStorage.getItem('theme');
  const theme = saved || 'dark'; // پیش‌فرض تاریک
  setTheme(theme);
}

function toggleTheme() {
  const current = document.body.getAttribute('data-theme') || 'dark';
  const next = current === 'dark' ? 'light' : 'dark';
  setTheme(next);
  showNotification(`تم به ${next === 'dark' ? 'تاریک' : 'روشن'} تغییر کرد`, 'success');
}

loadTheme();

// ۲. ذرات نور (کاهش تعداد در موبایل)
const canvas = document.getElementById('particles-canvas');
const ctx = canvas.getContext('2d', { alpha: true });
let particles = [];
let mouse = { x: null, y: null, radius: 180 };
let animationFrame, lastTime = 0;

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  initParticles();
}

window.addEventListener('resize', debounce(resizeCanvas, 300));
canvas.addEventListener('mousemove', e => {
  mouse.x = e.clientX;
  mouse.y = e.clientY;
});
canvas.addEventListener('mouseleave', () => { mouse.x = null; mouse.y = null; });

class SmartParticle {
  constructor() { this.reset(); }
  reset() {
    this.x = Math.random() * canvas.width;
    this.y = Math.random() * canvas.height;
    this.size = Math.random() * 3 + 1;
    this.speedX = Math.random() * 1.2 - 0.6;
    this.speedY = Math.random() * 1.2 - 0.6;
    this.color = getThemeColor();
    this.glow = Math.random() * 0.7 + 0.3;
  }
  update() {
    this.x += this.speedX;
    this.y += this.speedY;
    if (this.x < 0 || this.x > canvas.width) this.speedX *= -0.9;
    if (this.y < 0 || this.y > canvas.height) this.speedY *= -0.9;

    if (mouse.x && mouse.y) {
      const dx = mouse.x - this.x;
      const dy = mouse.y - this.y;
      const dist = Math.hypot(dx, dy);
      if (dist < mouse.radius) {
        const force = (mouse.radius - dist) / mouse.radius * 4;
        this.speedX -= (dx / dist) * force;
        this.speedY -= (dy / dist) * force;
      }
    }
  }
  draw() {
    ctx.shadowColor = this.color;
    ctx.shadowBlur = this.glow * 15;
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
  }
}

function getThemeColor() {
  return document.body.getAttribute('data-theme') === 'light'
    ? `rgba(0, 90, 180, ${Math.random()*0.5 + 0.4})`
    : `rgba(0, 212, 255, ${Math.random()*0.6 + 0.4})`;
}

function initParticles() {
  particles = [];
  const density = window.innerWidth * window.innerHeight / (window.innerWidth < 768 ? 14000 : 6000);
  const count = Math.min(300, Math.floor(density));
  for (let i = 0; i < count; i++) particles.push(new SmartParticle());
}

function animate(time) {
  animationFrame = requestAnimationFrame(animate);
  if (!lastTime) lastTime = time;
  const delta = time - lastTime;
  if (delta > 30) {  // ~33fps برای صرفه‌جویی
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => { p.update(); p.draw(); });
    lastTime = time;
  }
}

function debounce(func, wait) {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

resizeCanvas();
initParticles();
requestAnimationFrame(animate);

// ۳. ساعت و تاریخ شمسی
const persianWeekdays = ['یک‌شنبه','دوشنبه','سه‌شنبه','چهارشنبه','پنج‌شنبه','جمعه','شنبه'];

function updateDateTime() {
  const now = new Date();
  const weekday = persianWeekdays[now.getDay()];
  const dateStr = now.toLocaleString('fa-IR', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'Asia/Tehran' });
  const timeStr = now.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
  document.getElementById('datetime').textContent = `${weekday} ${dateStr} ساعت ${timeStr}`;
}
setInterval(updateDateTime, 1000);
updateDateTime();

// ۴. دریافت IP + آب و هوا (بدون کلید API)
const ipEl = document.getElementById('user-ip');
const weatherEl = document.getElementById('weather') || document.createElement('div');

async function fetchIPAndWeather() {
  try {
    const ipRes = await fetch('https://api.ipify.org?format=json');
    const { ip } = await ipRes.json();
    ipEl.textContent = ip;

    // موقعیت تقریبی
    const geoRes = await fetch(`https://ipapi.co/${ip}/json/`);
    const geo = await geoRes.json();
    const lat = geo.latitude, lon = geo.longitude;

    // آب و هوا با Open-Meteo
    const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,apparent_temperature,weather_code&timezone=Asia%2FTehran`);
    const data = await weatherRes.json();
    if (data.current) {
      const temp = Math.round(data.current.temperature_2m);
      const feel = Math.round(data.current.apparent_temperature);
      const code = data.current.weather_code;
      const emoji = code <= 3 ? '☀️' : code <= 48 ? '☁️' : code <= 67 ? '🌧️' : '❄️';
      weatherEl.innerHTML = `<div style="display:flex;align-items:center;gap:8px;justify-content:center;">
        <span style="font-size:1.4em">${emoji}</span> ${temp}°C (احساس ${feel}°)</div>`;
      weatherEl.style.marginTop = '12px';
      document.querySelector('.login-box').appendChild(weatherEl);
    }
  } catch (err) {
    ipEl.textContent = 'خطا';
    weatherEl.textContent = 'آب‌و‌هوا: در دسترس نیست';
  }
}
fetchIPAndWeather();

// ۵. نمایش/مخفی رمز عبور
const togglePassword = document.querySelector('.toggle-password');
const passwordInput = document.getElementById('password');
if (togglePassword && passwordInput) {
  togglePassword.addEventListener('click', () => {
    const type = passwordInput.type === 'password' ? 'text' : 'password';
    passwordInput.type = type;
    togglePassword.textContent = type === 'password' ? '👁' : '🙈';
  });
}

// ۶. تغییر تم با ripple و notification
const themeToggle = document.getElementById('theme-toggle');
if (themeToggle) {
  themeToggle.addEventListener('click', (e) => {
    const ripple = document.createElement('span');
    ripple.classList.add('ripple');
    themeToggle.appendChild(ripple);
    const rect = themeToggle.getBoundingClientRect();
    ripple.style.left = `${e.clientX - rect.left}px`;
    ripple.style.top = `${e.clientY - rect.top}px`;
    setTimeout(() => ripple.remove(), 700);

    toggleTheme();
  });
}

// ۷. نوتیفیکیشن
function showNotification(msg, type = 'info') {
  const colors = { success: '#4CAF50', error: '#f44336', info: '#2196F3', warning: '#FFC107' };
  const n = document.createElement('div');
  n.className = `notification ${type}`;
  n.textContent = msg;
  n.style.background = colors[type] || '#2196F3';
  document.body.appendChild(n);
  setTimeout(() => {
    n.style.animation = 'slideOut 0.4s forwards';
    setTimeout(() => n.remove(), 400);
  }, 3200);
}

// ۸. موسیقی پس‌زمینه (با لینک مستقیم)
const audio = new Audio('https://dl.musicdel.ir/Music/1400/05/naser_chashmazar_barane_eshghe.mp3');
audio.loop = true;
audio.volume = 0.18;

const musicToggle = document.getElementById('music-toggle') || document.createElement('button');
if (!document.getElementById('music-toggle')) {
  musicToggle.id = 'music-toggle';
  musicToggle.textContent = '🎵';
  musicToggle.style.cssText = 'position:fixed;bottom:20px;left:20px;width:54px;height:54px;border-radius:50%;background:linear-gradient(135deg,#00d4ff,#0099cc);color:white;font-size:24px;cursor:pointer;z-index:1000;box-shadow:0 4px 15px rgba(0,0,0,0.4);border:none;display:flex;align-items:center;justify-content:center;';
  document.body.appendChild(musicToggle);
}

musicToggle.addEventListener('click', () => {
  if (audio.paused) {
    audio.play().catch(() => showNotification('اجازه پخش صدا را بدهید', 'info'));
    musicToggle.textContent = '🔊';
  } else {
    audio.pause();
    musicToggle.textContent = '🎵';
  }
});

// ۹. لاگین ساده (فقط تست)
document.querySelector('.login-btn')?.addEventListener('click', (e) => {
  e.preventDefault();
  const user = document.getElementById('username')?.value.trim();
  const pass = document.getElementById('password')?.value.trim();
  if (user && pass) {
    if (user.length > 3 && pass.length > 5) {
      showNotification('ورود موفق! خوش آمدید', 'success');
    } else {
      showNotification('نام کاربری یا رمز کوتاه است', 'error');
    }
  } else {
    showNotification('فیلدها را پر کنید', 'warning');
  }
});

// ۱۰. محافظت کلیک راست (اختیاری)
document.addEventListener('contextmenu', e => {
  if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
    e.preventDefault();
  }
});

console.log('روشنــا - نسخه نهایی | موسیقی باران عشق فعال شد');
