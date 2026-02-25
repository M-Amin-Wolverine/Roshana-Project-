/* =================== پروژه روشنــا - نسخه نهایی فوق پیشرفته =================== */
// Author: تیم توسعه روشنــا
// Version: 3.0.0
// Last Update: 2026
// Description: نسخه بهبود یافته با رفع مشکلات و اضافه شدن ویژگی‌های جدید

(function() {
  'use strict';

  /* =================== ۱. پیکربندی اصلی =================== */
  const CONFIG = {
    particles: {
      desktopCount: 250,
      mobileCount: 100,
      mouseRadius: 200,
      speedFactor: 1,
      glowFactor: 15,
      fpsThreshold: 30,
      mobileBreakpoint: 768,
      tabletBreakpoint: 1024
    },
    notifications: {
      duration: 3500,
      animationDuration: 400
    },
    music: {
      url: 'naser_chashmazar_barane_eshghe.mp3',
      volume: 0.2,
      fadeDuration: 1000,
      autoPlay: false,
      retryCount: 3
    },
    api: {
      ip: 'https://api.ipify.org?format=json',
      geo: 'https://ipapi.co/{ip}/json/',
      weather: 'https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&current=temperature_2m,apparent_temperature,weather_code,relative_humidity_2m,wind_speed_10m&timezone=Asia%2FTehran'
    },
    validation: {
      minUsername: 3,
      minPassword: 6
    },
    ui: {
      animationSpeed: 'normal',
      rippleEffect: true,
      soundEnabled: true
    }
  };

  /* =================== ۲. مدیریت تم پیشرفته =================== */
  const ThemeManager = {
    init() {
      this.loadTheme();
      this.setupToggle();
      this.setupSystemThemeListener();
    },

    loadTheme() {
      const saved = localStorage.getItem('theme');
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const theme = saved || (prefersDark ? 'dark' : 'light');
      this.setTheme(theme);
    },

    setTheme(theme) {
      document.body.setAttribute('data-theme', theme);
      localStorage.setItem('theme', theme);
      
      // بروزرسانی رنگ ذرات
      if (window.ParticleSystem && window.ParticleSystem.updateColors) {
        window.ParticleSystem.updateColors();
      }
      
      // بروزرسانی متا تگ برای حالت نمایش
      const metaTheme = document.querySelector('meta[name="theme-color"]');
      if (metaTheme) {
        metaTheme.setAttribute('content', theme === 'dark' ? '#0a1118' : '#f0f7fc');
      }
      
      // آپدیت آیکون‌های تم
      this.updateToggleIcons(theme);
    },

    updateToggleIcons(theme) {
      const sunIcon = document.querySelector('.icon-sun');
      const moonIcon = document.querySelector('.icon-moon');
      if (sunIcon && moonIcon) {
        if (theme === 'dark') {
          sunIcon.style.opacity = '1';
          moonIcon.style.opacity = '0';
        } else {
          sunIcon.style.opacity = '0';
          moonIcon.style.opacity = '1';
        }
      }
    },

    setupToggle() {
      const toggleBtn = document.getElementById('theme-toggle');
      if (toggleBtn) {
        toggleBtn.addEventListener('click', (e) => {
          if (CONFIG.ui.rippleEffect) {
            this.createRippleEffect(e);
          }
          this.toggle();
        });
      }
    },

    setupSystemThemeListener() {
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        if (!localStorage.getItem('theme')) {
          this.setTheme(e.matches ? 'dark' : 'light');
        }
      });
    },

    createRippleEffect(e) {
      const button = e.currentTarget;
      const ripple = document.createElement('span');
      ripple.className = 'ripple';
      
      const rect = button.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      
      ripple.style.width = ripple.style.height = `${size}px`;
      ripple.style.left = `${e.clientX - rect.left - size/2}px`;
      ripple.style.top = `${e.clientY - rect.top - size/2}px`;
      
      button.appendChild(ripple);
      setTimeout(() => ripple.remove(), 600);
    },

    toggle() {
      const current = document.body.getAttribute('data-theme') || 'dark';
      const next = current === 'dark' ? 'light' : 'dark';
      this.setTheme(next);
      
      // انیمیشن ویژه تغییر تم
      this.animateThemeTransition();
      
      NotificationManager.show(
        `تم به ${next === 'dark' ? '🌙 تاریک' : '☀️ روشن'} تغییر کرد`, 
        'success'
      );
    },

    animateThemeTransition() {
      const overlay = document.createElement('div');
      overlay.style.cssText = `
        position: fixed;
        inset: 0;
        background: ${document.body.getAttribute('data-theme') === 'dark' ? '#000' : '#fff'};
        opacity: 0.3;
        z-index: 9999;
        pointer-events: none;
        animation: fadeOut 0.5s ease-out forwards;
      `;
      document.body.appendChild(overlay);
      setTimeout(() => overlay.remove(), 500);
    }
  };

  /* =================== ۳. سیستم ذرات نور پیشرفته =================== */
  const ParticleSystem = {
    canvas: null,
    ctx: null,
    particles: [],
    mouse: { x: null, y: null, radius: CONFIG.particles.mouseRadius },
    animationFrame: null,
    lastTime: 0,
    isMobile: false,
    isRunning: true,
    connectionDistance: 120,

    init() {
      this.canvas = document.getElementById('particles-canvas');
      if (!this.canvas) {
        this.createCanvas();
      }
      this.ctx = this.canvas.getContext('2d', { alpha: true });
      this.checkMobile();
      this.setupEventListeners();
      this.resize();
      this.initParticles();
      this.animate();
    },

    createCanvas() {
      this.canvas = document.createElement('canvas');
      this.canvas.id = 'particles-canvas';
      document.body.prepend(this.canvas);
    },

    checkMobile() {
      this.isMobile = window.innerWidth < CONFIG.particles.mobileBreakpoint;
      this.connectionDistance = this.isMobile ? 80 : 120;
    },

    setupEventListeners() {
      // تریتل موس
      this.canvas.addEventListener('mousemove', (e) => {
        this.mouse.x = e.clientX;
        this.mouse.y = e.clientY;
      });

      this.canvas.addEventListener('mouseleave', () => {
        this.mouse.x = null;
        this.mouse.y = null;
      });

      // پشتیبانی از تاچ
      this.canvas.addEventListener('touchmove', (e) => {
        e.preventDefault();
        const touch = e.touches[0];
        this.mouse.x = touch.clientX;
        this.mouse.y = touch.clientY;
      }, { passive: false });

      this.canvas.addEventListener('touchend', () => {
        this.mouse.x = null;
        this.mouse.y = null;
      });

      // ریسایز با دیبانس
      window.addEventListener('resize', this.debounce(() => {
        this.checkMobile();
        this.resize();
        this.initParticles();
      }, 250));

      // توقف انیمیشن در تب غیرفعال
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
          this.isRunning = false;
          cancelAnimationFrame(this.animationFrame);
        } else {
          this.isRunning = true;
          this.lastTime = performance.now();
          this.animate();
        }
      });
    },

    resize() {
      this.canvas.width = window.innerWidth;
      this.canvas.height = window.innerHeight;
    },

    initParticles() {
      this.particles = [];
      const density = (window.innerWidth * window.innerHeight) / 
        (this.isMobile ? 14000 : 6000);
      const count = Math.min(
        this.isMobile ? CONFIG.particles.mobileCount : CONFIG.particles.desktopCount,
        Math.floor(density)
      );
      
      for (let i = 0; i < count; i++) {
        this.particles.push(new Particle(this));
      }
    },

    updateColors() {
      this.particles.forEach(p => p.updateColor());
    },

    animate(currentTime) {
      if (!this.isRunning) return;
      
      this.animationFrame = requestAnimationFrame((t) => this.animate(t));
      
      if (!this.lastTime) {
        this.lastTime = currentTime;
        return;
      }
      
      const delta = currentTime - this.lastTime;
      if (delta > 1000 / CONFIG.particles.fpsThreshold) {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // به‌روزرسانی و رسم ذرات
        this.particles.forEach(particle => {
          particle.update(this.mouse);
          particle.draw(this.ctx);
        });
        
        // رسم اتصالات بین ذرات
        this.drawConnections();
        
        this.lastTime = currentTime;
      }
    },

    drawConnections() {
      for (let i = 0; i < this.particles.length; i++) {
        for (let j = i + 1; j < this.particles.length; j++) {
          const dx = this.particles[i].x - this.particles[j].x;
          const dy = this.particles[i].y - this.particles[j].y;
          const distance = Math.hypot(dx, dy);
          
          if (distance < this.connectionDistance) {
            const opacity = (1 - distance / this.connectionDistance) * 0.25;
            this.ctx.beginPath();
            this.ctx.strokeStyle = `rgba(0, 212, 255, ${opacity})`;
            this.ctx.lineWidth = 0.8;
            this.ctx.moveTo(this.particles[i].x, this.particles[i].y);
            this.ctx.lineTo(this.particles[j].x, this.particles[j].y);
            this.ctx.stroke();
          }
        }
      }
    },

    debounce(func, wait) {
      let timeout;
      return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
      };
    }
  };

  /* =================== ۴. کلاس ذره =================== */
  class Particle {
    constructor(system) {
      this.system = system;
      this.reset();
    }

    reset() {
      this.x = Math.random() * this.system.canvas.width;
      this.y = Math.random() * this.system.canvas.height;
      this.size = Math.random() * 2.5 + 0.8;
      this.speedX = (Math.random() - 0.5) * 1.2;
      this.speedY = (Math.random() - 0.5) * 1.2;
      this.baseColor = this.getBaseColor();
      this.glow = Math.random() * 0.6 + 0.3;
      this.life = 1;
    }

    getBaseColor() {
      const theme = document.body.getAttribute('data-theme');
      const blue = theme === 'light' ? '0, 90, 180' : '0, 212, 255';
      const alpha = (Math.random() * 0.5 + 0.4).toFixed(2);
      return `rgba(${blue}, ${alpha})`;
    }

    updateColor() {
      this.baseColor = this.getBaseColor();
    }

    update(mouse) {
      // حرکت پایه
      this.x += this.speedX;
      this.y += this.speedY;

      // بازتاب از لبه‌ها
      if (this.x < 0 || this.x > this.system.canvas.width) {
        this.speedX *= -0.95;
        this.x = Math.max(0, Math.min(this.x, this.system.canvas.width));
      }
      if (this.y < 0 || this.y > this.system.canvas.height) {
        this.speedY *= -0.95;
        this.y = Math.max(0, Math.min(this.y, this.system.canvas.height));
      }

      // تعامل با موس
      if (mouse.x && mouse.y) {
        const dx = mouse.x - this.x;
        const dy = mouse.y - this.y;
        const dist = Math.hypot(dx, dy);
        
        if (dist < mouse.radius) {
          const force = (mouse.radius - dist) / mouse.radius * 3;
          const angle = Math.atan2(dy, dx);
          this.speedX -= Math.cos(angle) * force;
          this.speedY -= Math.sin(angle) * force;
          
          // افزایش درخشش نزدیک موس
          this.glow = Math.min(1, this.glow + 0.1);
        } else {
          this.glow = Math.max(0.3, this.glow - 0.01);
        }
      }
    },

    draw(ctx) {
      ctx.shadowColor = this.baseColor;
      ctx.shadowBlur = this.glow * 15;
      ctx.fillStyle = this.baseColor;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  /* =================== ۵. مدیریت نوتیفیکیشن =================== */
  const NotificationManager = {
    container: null,
    activeNotifications: [],
    maxNotifications: 3,

    init() {
      this.createContainer();
    },

    createContainer() {
      this.container = document.createElement('div');
      this.container.id = 'notification-container';
      this.container.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 9999;
        display: flex;
        flex-direction: column;
        gap: 10px;
        pointer-events: none;
      `;
      document.body.appendChild(this.container);
    },

    show(message, type = 'info', duration = CONFIG.notifications.duration) {
      // حذف نوتیفیکیشن‌های اضافی
      while (this.activeNotifications.length >= this.maxNotifications) {
        const oldest = this.activeNotifications.shift();
        if (oldest && oldest.parentNode) {
          this.close(oldest);
        }
      }

      const colors = {
        success: 'linear-gradient(135deg, #4CAF50, #45a049)',
        error: 'linear-gradient(135deg, #f44336, #d32f2f)',
        info: 'linear-gradient(135deg, #2196F3, #1976D2)',
        warning: 'linear-gradient(135deg, #FFC107, #FFA000)'
      };

      const icons = {
        success: '✅',
        error: '❌',
        info: 'ℹ️',
        warning: '⚠️'
      };

      const notification = document.createElement('div');
      notification.className = `notification ${type}`;
      notification.style.cssText = `
        background: ${colors[type]};
        color: white;
        padding: 14px 24px;
        border-radius: 12px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.2);
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255,255,255,0.2);
        display: flex;
        align-items: center;
        gap: 12px;
        font-family: 'Vazirmatn', sans-serif;
        direction: rtl;
        transform: translateX(120%);
        animation: slideIn 0.4s ease-out forwards;
        min-width: 280px;
        max-width: 400px;
        pointer-events: auto;
      `;

      notification.innerHTML = `
        <span style="font-size: 1.3em;">${icons[type]}</span>
        <span style="flex:1;">${message}</span>
        <button style="background:none;border:none;color:white;font-size:1.2em;cursor:pointer;opacity:0.7;">×</button>
      `;

      // دکمه بستن
      const closeBtn = notification.querySelector('button');
      closeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.close(notification);
      });

      this.container.appendChild(notification);
      this.activeNotifications.push(notification);

      // Auto close
      setTimeout(() => {
        if (notification.parentNode) {
          this.close(notification);
        }
      }, duration);
    },

    close(notification) {
      notification.style.animation = 'slideOut 0.4s ease-in forwards';
      setTimeout(() => {
        if (notification.parentNode) {
          notification.remove();
          this.activeNotifications = this.activeNotifications.filter(n => n !== notification);
        }
      }, 400);
    }
  };

  /* =================== ۶. مدیریت تاریخ و زمان =================== */
  const DateTimeManager = {
    elements: {
      datetime: document.getElementById('datetime'),
      countdown: document.getElementById('nowruz-countdown')
    },
    
    persianWeekdays: ['یک‌شنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنج‌شنبه', 'جمعه', 'شنبه'],
    persianMonths: ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'],

    init() {
      if (!this.elements.datetime) {
        console.warn('المان datetime یافت نشد');
        return;
      }
      this.update();
      setInterval(() => this.update(), 1000);
    },

    update() {
      const now = new Date();
      this.updateDateTime(now);
      this.updateNowruzCountdown(now);
    },

    updateDateTime(now) {
      if (!this.elements.datetime) return;

      const weekday = this.persianWeekdays[now.getDay()];
      
      // تاریخ شمسی
      const dateStr = now.toLocaleDateString('fa-IR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      
      // زمان
      const timeStr = now.toLocaleTimeString('fa-IR', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      });

      this.elements.datetime.innerHTML = `
        <div style="display:flex; flex-direction:column; gap:2px;">
          <span style="font-size:1.1em; font-weight:bold;">${weekday}</span>
          <span style="font-size:0.9em; opacity:0.8;">${dateStr}</span>
          <span style="font-size:1.2em; color:var(--primary); font-weight:bold;">${timeStr}</span>
        </div>
      `;
    },

    updateNowruzCountdown(now) {
      if (!this.elements.countdown) {
        this.createCountdownElement();
      }

      const nowruz2026 = new Date(2026, 2, 20, 0, 30, 0); // ۲۰ مارس ۲۰۲۶
      const diff = nowruz2026 - now;
      
      if (diff <= 0) return;
      
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      if (days < 60) {
        let countdownText = `🎉 ${this.toPersianNumber(days)} روز`;
        if (hours > 0) {
          countdownText += ` و ${this.toPersianNumber(hours)} ساعت`;
        }
        if (days < 30 && minutes > 0 && hours === 0) {
          countdownText += ` و ${this.toPersianNumber(minutes)} دقیقه`;
        }
        countdownText += ' تا نوروز ۱۴۰۵';
        
        this.elements.countdown.innerHTML = countdownText;
        this.elements.countdown.style.display = 'block';
      } else {
        this.elements.countdown.style.display = 'none';
      }
    },

    createCountdownElement() {
      const infoBar = document.querySelector('.info-bar');
      if (!infoBar) return;
      
      this.elements.countdown = document.createElement('div');
      this.elements.countdown.id = 'nowruz-countdown';
      this.elements.countdown.style.cssText = `
        margin-top: 8px;
        font-size: 0.9rem;
        color: var(--primary);
        animation: pulse 2s infinite;
        background: var(--glass-bg);
        padding: 6px 12px;
        border-radius: 20px;
        display: inline-block;
        width: 100%;
        text-align: center;
      `;
      infoBar.appendChild(this.elements.countdown);
    },

    toPersianNumber(num) {
      const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
      return num.toString().replace(/\d/g, d => persianDigits[d]);
    }
  };

  /* =================== ۷. مدیریت IP و آب و هوا =================== */
  const IPWeatherManager = {
    ipEl: document.getElementById('user-ip'),
    weatherEl: document.getElementById('weather'),
    retryCount: 0,
    maxRetries: 3,

    async init() {
      if (!this.ipEl) {
        console.warn('المان user-ip یافت نشد');
        return;
      }
      
      this.ipEl.textContent = 'در حال دریافت...';
      if (this.weatherEl) {
        this.weatherEl.innerHTML = '🔄 در حال دریافت اطلاعات...';
      }
      
      await this.fetchIPAndWeather();
    },

    async fetchIPAndWeather() {
      try {
        // دریافت IP
        const ip = await this.fetchIP();
        this.ipEl.innerHTML = `
          <div style="display:flex; align-items:center; gap:4px;">
            <span>🌐</span>
            <span>${ip}</span>
          </div>
        `;
        
        // دریافت موقعیت
        const geo = await this.fetchGeo(ip);
        
        // دریافت آب و هوا
        if (geo.latitude && geo.longitude) {
          await this.fetchWeather(geo.latitude, geo.longitude, geo);
        } else {
          this.showWeatherError();
        }
        
        NotificationManager.show('📍 موقعیت شما شناسایی شد', 'success');
      } catch (error) {
        console.error('خطا در دریافت اطلاعات:', error);
        this.handleError();
      }
    },

    async fetchIP() {
      try {
        const response = await fetch(CONFIG.api.ip);
        const data = await response.json();
        return data.ip;
      } catch (error) {
        // روش دوم
        const response = await fetch('https://jsonip.com');
        const data = await response.json();
        return data.ip;
      }
    },

    async fetchGeo(ip) {
      try {
        const url = CONFIG.api.geo.replace('{ip}', ip);
        const response = await fetch(url);
        return await response.json();
      } catch (error) {
        console.warn('خطا در دریافت موقعیت:', error);
        return {};
      }
    },

    async fetchWeather(lat, lon, geo) {
      if (!this.weatherEl) return;

      try {
        const url = CONFIG.api.weather
          .replace('{lat}', lat)
          .replace('{lon}', lon);
        
        const response = await fetch(url);
        const data = await response.json();

        if (data.current) {
          this.displayWeather(data.current, geo);
        } else {
          this.showWeatherError();
        }
      } catch (error) {
        console.error('خطا در دریافت آب و هوا:', error);
        this.showWeatherError();
      }
    },

    displayWeather(current, geo) {
      const temp = Math.round(current.temperature_2m);
      const feel = Math.round(current.apparent_temperature);
      const humidity = current.relative_humidity_2m;
      const wind = current.wind_speed_10m;
      
      const weatherCodes = {
        0: '☀️', 1: '🌤️', 2: '⛅', 3: '☁️',
        45: '🌫️', 48: '🌫️', 51: '🌧️', 61: '🌧️',
        71: '🌨️', 95: '⛈️'
      };
      
      const emoji = weatherCodes[current.weather_code] || '🌡️';
      const city = geo.city || geo.region || '';

      this.weatherEl.innerHTML = `
        <div style="display:flex; align-items:center; gap:12px; justify-content:center; flex-wrap:wrap; padding:8px;">
          <span style="font-size:2em;">${emoji}</span>
          <div style="text-align:center;">
            <div style="font-size:1.5em; font-weight:bold; color:var(--primary);">${temp}°C</div>
            <div style="font-size:0.8em; opacity:0.8;">احساس ${feel}°C</div>
            ${city ? `<div style="font-size:0.8em;">${city}</div>` : ''}
          </div>
          <div style="border-right:1px solid rgba(255,255,255,0.2); padding-right:12px;">
            <div>💧 ${humidity}%</div>
            <div>🌪️ ${wind} km/h</div>
          </div>
        </div>
      `;
    },

    showWeatherError() {
      if (this.weatherEl) {
        this.weatherEl.innerHTML = `
          <div style="padding:8px; text-align:center; opacity:0.8;">
            🌡️ اطلاعات آب و هوا موقتاً در دسترس نیست
          </div>
        `;
      }
    },

    handleError() {
      if (this.retryCount < this.maxRetries) {
        this.retryCount++;
        setTimeout(() => this.fetchIPAndWeather(), 2000 * this.retryCount);
      } else {
        this.ipEl.textContent = 'خطا در دریافت IP';
        this.showWeatherError();
        NotificationManager.show('⚠️ خطا در دریافت اطلاعات', 'error');
      }
    }
  };

  /* =================== ۸. مدیریت فرم =================== */
  const FormManager = {
    elements: {
      username: document.getElementById('username'),
      password: document.getElementById('password'),
      loginBtn: document.querySelector('.login-btn'),
      togglePassword: document.querySelector('.toggle-password')
    },

    init() {
      this.setupPasswordToggle();
      this.setupLoginButton();
      this.setupInputValidation();
    },

    setupPasswordToggle() {
      if (!this.elements.togglePassword || !this.elements.password) return;

      this.elements.togglePassword.addEventListener('click', () => {
        const type = this.elements.password.type === 'password' ? 'text' : 'password';
        this.elements.password.type = type;
        this.elements.togglePassword.textContent = type === 'password' ? '👁' : '🙈';
        
        // انیمیشن
        this.elements.togglePassword.animate([
          { transform: 'scale(1)' },
          { transform: 'scale(1.2)' },
          { transform: 'scale(1)' }
        ], {
          duration: 300,
          easing: 'ease-in-out'
        });
      });
    },

    setupLoginButton() {
      if (!this.elements.loginBtn) return;

      this.elements.loginBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.handleLogin();
      });

      // Enter key
      document.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && 
            document.activeElement === this.elements.username || 
            document.activeElement === this.elements.password) {
          e.preventDefault();
          this.handleLogin();
        }
      });
    },

    setupInputValidation() {
      if (this.elements.username) {
        this.elements.username.addEventListener('input', () => {
          this.validateField(this.elements.username);
        });
      }

      if (this.elements.password) {
        this.elements.password.addEventListener('input', () => {
          this.validateField(this.elements.password);
        });
      }
    },

    validateField(input) {
      const isValid = input.value.trim().length > 0;
      input.style.borderColor = isValid ? 'var(--success)' : 'var(--error)';
      return isValid;
    },

    handleLogin() {
      const username = this.elements.username?.value.trim() || '';
      const password = this.elements.password?.value.trim() || '';

      // اعتبارسنجی
      if (!username || !password) {
        NotificationManager.show('⚠️ لطفاً همه فیلدها را پر کنید', 'warning');
        this.shakeForm();
        return;
      }

      if (username.length < CONFIG.validation.minUsername) {
        NotificationManager.show(`👤 نام کاربری حداقل ${CONFIG.validation.minUsername} کاراکتر`, 'error');
        this.elements.username?.focus();
        return;
      }

      if (password.length < CONFIG.validation.minPassword) {
        NotificationManager.show(`🔒 رمز عبور حداقل ${CONFIG.validation.minPassword} کاراکتر`, 'error');
        this.elements.password?.focus();
        return;
      }

      // شبیه‌سازی ورود موفق
      this.simulateLogin(username, password);
    },

    simulateLogin(username, password) {
      // نمایش لودینگ
      const originalText = this.elements.loginBtn.innerHTML;
      this.elements.loginBtn.innerHTML = '<span class="loading"></span> در حال ورود...';
      this.elements.loginBtn.disabled = true;

      setTimeout(() => {
        // Reset button
        this.elements.loginBtn.innerHTML = originalText;
        this.elements.loginBtn.disabled = false;

        // Check credentials
        if (username === 'admin' && password === '123456') {
          NotificationManager.show('✅ خوش آمدید! ورود موفق', 'success');
          this.celebrateLogin();
          
          // پاک کردن فرم
          this.elements.username.value = '';
          this.elements.password.value = '';
        } else {
          NotificationManager.show('❌ نام کاربری یا رمز عبور اشتباه است', 'error');
          this.elements.password.value = '';
          this.elements.password.focus();
        }
      }, 1500);
    },

    shakeForm() {
      const loginBox = document.querySelector('.login-box');
      if (loginBox) {
        loginBox.animate([
          { transform: 'translateX(0)' },
          { transform: 'translateX(-10px)' },
          { transform: 'translateX(10px)' },
          { transform: 'translateX(-5px)' },
          { transform: 'translateX(5px)' },
          { transform: 'translateX(0)' }
        ], {
          duration: 400,
          easing: 'ease-in-out'
        });
      }
    },

    celebrateLogin() {
      // ایجاد ذرات ویژه برای جشن ورود
      for (let i = 0; i < 20; i++) {
        setTimeout(() => {
          const particle = {
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight,
            size: Math.random() * 5 + 2,
            color: `hsl(${Math.random() * 360}, 100%, 50%)`
          };
          
          const ctx = document.getElementById('particles-canvas')?.getContext('2d');
          if (ctx) {
            ctx.shadowBlur = 20;
            ctx.fillStyle = particle.color;
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            ctx.fill();
          }
        }, i * 50);
      }
    }
  };

  /* =================== ۹. مدیریت موسیقی =================== */
  const MusicManager = {
    audio: null,
    button: null,
    isPlaying: false,
    fadeInterval: null,
    retryCount: 0,
    maxRetries: 3,

    init() {
      this.createButton();
      this.setupAudio();
    },

    setupAudio() {
      try {
        this.audio = new Audio(CONFIG.music.url);
        this.audio.loop = true;
        this.audio.volume = 0;
        this.audio.preload = 'auto';

        this.audio.addEventListener('canplaythrough', () => {
          console.log('✅ موسیقی آماده پخش است');
          this.button.style.opacity = '1';
          this.button.style.cursor = 'pointer';
        });

        this.audio.addEventListener('error', (e) => {
          console.error('❌ خطا در بارگذاری موسیقی:', e);
          this.handleError();
        });

        this.audio.addEventListener('waiting', () => {
          console.log('⏳ در حال بافرینگ...');
        });

      } catch (error) {
        console.error('❌ خطا در ایجاد Audio object:', error);
        this.handleError();
      }
    },

    handleError() {
      this.retryCount++;
      this.button.style.opacity = '0.5';
      this.button.title = 'خطا در پخش موسیقی';
      
      if (this.retryCount < this.maxRetries) {
        setTimeout(() => this.setupAudio(), 2000);
      }
    },

    createButton() {
      this.button = document.getElementById('music-toggle');
      
      if (!this.button) {
        this.button = document.createElement('button');
        this.button.id = 'music-toggle';
        document.body.appendChild(this.button);
      }

      this.button.innerHTML = '🎵';
      this.button.setAttribute('aria-label', 'پخش/توقف موسیقی');
      this.button.style.cssText = `
        position: fixed;
        bottom: 24px;
        left: 24px;
        width: 58px;
        height: 58px;
        border-radius: 50%;
        background: linear-gradient(135deg, #00d4ff, #0099cc);
        color: white;
        font-size: 26px;
        cursor: pointer;
        z-index: 1000;
        box-shadow: 0 4px 15px rgba(0,0,0,0.4);
        border: none;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.3s ease;
      `;

      this.button.addEventListener('click', () => this.toggle());
      
      // اضافه کردن hover effect
      this.button.addEventListener('mouseenter', () => {
        this.button.style.transform = 'scale(1.1)';
      });
      
      this.button.addEventListener('mouseleave', () => {
        this.button.style.transform = 'scale(1)';
      });
    },

    toggle() {
      if (!this.audio) {
        NotificationManager.show('🔇 خطا در پخش موسیقی', 'error');
        return;
      }

      if (this.isPlaying) {
        this.pause();
      } else {
        this.play();
      }
    },

    async play() {
      try {
        // تلاش برای پخش
        const playPromise = this.audio.play();
        
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              this.isPlaying = true;
              this.button.innerHTML = '🔊';
              
              // fade in
              let vol = 0;
              this.fadeInterval = setInterval(() => {
                vol += 0.02;
                if (vol >= CONFIG.music.volume) {
                  this.audio.volume = CONFIG.music.volume;
                  clearInterval(this.fadeInterval);
                } else {
                  this.audio.volume = vol;
                }
              }, 50);

              NotificationManager.show('🎶 موسیقی روشن شد', 'success');
            })
            .catch(error => {
              console.error('خطا در پخش:', error);
              NotificationManager.show('🔇 برای پخش موسیقی کلیک کنید', 'warning');
              this.button.innerHTML = '🎵';
            });
        }
      } catch (error) {
        console.error('❌ خطا:', error);
        NotificationManager.show('🔇 خطا در پخش موسیقی', 'error');
      }
    },

    pause() {
      // fade out
      clearInterval(this.fadeInterval);
      const startVol = this.audio.volume;
      const steps = 20;
      let step = 0;
      
      const fadeOut = setInterval(() => {
        step++;
        this.audio.volume = startVol * (1 - step / steps);
        
        if (step >= steps) {
          this.audio.pause();
          this.audio.volume = 0;
          this.isPlaying = false;
          this.button.innerHTML = '🎵';
          clearInterval(fadeOut);
        }
      }, 30);

      NotificationManager.show('🔇 موسیقی متوقف شد', 'info');
    }
  };

  /* =================== ۱۰. مدیریت امنیت =================== */
  const SecurityManager = {
    init() {
      this.preventRightClick();
      this.preventCopyPassword();
      this.preventInspect();
      this.preventSelection();
    },

    preventRightClick() {
      document.addEventListener('contextmenu', (e) => {
        const target = e.target;
        if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
          e.preventDefault();
        }
      });
    },

    preventCopyPassword() {
      const passwordInput = document.getElementById('password');
      if (passwordInput) {
        passwordInput.addEventListener('copy', (e) => e.preventDefault());
        passwordInput.addEventListener('cut', (e) => e.preventDefault());
        passwordInput.addEventListener('paste', (e) => e.preventDefault());
      }
    },

    preventInspect() {
      document.addEventListener('keydown', (e) => {
        if (e.key === 'F12' || 
            (e.ctrlKey && e.shiftKey && e.key === 'I') ||
            (e.ctrlKey && e.shiftKey && e.key === 'J') ||
            (e.ctrlKey && e.key === 'U')) {
          e.preventDefault();
        }
      });
    },

    preventSelection() {
      document.addEventListener('selectstart', (e) => {
        if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
          e.preventDefault();
        }
      });
    }
  };

  /* =================== ۱۱. انیمیشن‌های CSS =================== */
  function addAnimations() {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideIn {
        from { transform: translateX(120%) translateY(20px); opacity: 0; }
        to { transform: translateX(0) translateY(0); opacity: 1; }
      }

      @keyframes slideOut {
        from { transform: translateX(0) translateY(0); opacity: 1; }
        to { transform: translateX(120%) translateY(20px); opacity: 0; }
      }

      @keyframes fadeOut {
        from { opacity: 0.3; }
        to { opacity: 0; }
      }

      @keyframes pulse {
        0% { transform: scale(1); opacity: 0.6; }
        50% { transform: scale(1.05); opacity: 1; }
        100% { transform: scale(1); opacity: 0.6; }
      }

      @keyframes spin {
        to { transform: rotate(360deg); }
      }

      @keyframes ripple {
        to { transform: scale(4); opacity: 0; }
      }

      .loading {
        display: inline-block;
        width: 20px;
        height: 20px;
        border: 3px solid rgba(255,255,255,.3);
        border-radius: 50%;
        border-top-color: white;
        animation: spin 1s ease-in-out infinite;
        margin-left: 8px;
      }

      #music-toggle {
        transition: all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
      }

      #music-toggle:hover {
        transform: scale(1.2) rotate(360deg);
      }

      .notification {
        transition: all 0.3s ease;
      }

      .notification button {
        transition: opacity 0.3s ease, transform 0.3s ease;
      }

      .notification button:hover {
        opacity: 1 !important;
        transform: scale(1.2);
      }

      .ripple {
        position: absolute;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.6);
        transform: scale(0);
        animation: ripple 0.6s ease-out;
        pointer-events: none;
      }

      #datetime, #user-ip, #weather {
        transition: all 0.3s ease;
      }

      .info-bar {
        display: flex;
        gap: 10px;
        margin-bottom: 20px;
        flex-wrap: wrap;
      }

      .datetime-display, .ip-display {
        flex: 1;
        min-width: 200px;
        padding: 10px 15px;
        background: var(--glass-bg);
        border: 1px solid var(--glass-border);
        border-radius: 30px;
        backdrop-filter: blur(10px);
        text-align: center;
        font-size: 0.9rem;
      }
    `;
    document.head.appendChild(style);
  }

  /* =================== ۱۲. نمایش اطلاعات در کنسول =================== */
  function showConsoleInfo() {
    console.log('%c┌─────────────────────────────────────┐', 'color: #00e0ff');
    console.log('%c│    🚀 پروژه روشنــا - نسخه ۳.۰     │', 'color: #00e0ff; font-size: 14px; font-weight: bold;');
    console.log('%c├─────────────────────────────────────┤', 'color: #00e0ff');
    console.log('%c│  📅 تاریخ: ' + new Date().toLocaleString('fa-IR'), 'color: #4CAF50');
    console.log('%c│  🌙 تم فعلی: ' + document.body.getAttribute('data-theme'), 'color: #FFC107');
    console.log('%c│  🎵 موسیقی: باران عشق - ناصر چشم‌آذر', 'color: #ff2d88');
    console.log('%c│  ✨ تمام ویژگی‌ها فعال شدند', 'color: #00e0ff');
    console.log('%c└─────────────────────────────────────┘', 'color: #00e0ff');
  }

  /* =================== ۱۳. بررسی وجود المنت‌ها =================== */
  function checkRequiredElements() {
    const required = ['datetime', 'user-ip', 'username', 'password'];
    const missing = [];
    
    required.forEach(id => {
      if (!document.getElementById(id)) {
        missing.push(id);
      }
    });
    
    if (missing.length > 0) {
      console.warn('⚠️ المنت‌های زیر یافت نشدند:', missing.join(', '));
    }
    
    return missing.length === 0;
  }

  /* =================== ۱۴. مقداردهی اولیه =================== */
  function init() {
    console.time('روشنــا');
    console.log('🚀 در حال راه‌اندازی پروژه روشنــا...');

    // اضافه کردن انیمیشن‌های CSS
    addAnimations();

    // بررسی المنت‌های مورد نیاز
    checkRequiredElements();

    // مقداردهی ماژول‌ها
    ThemeManager.init();
    ParticleSystem.init();
    DateTimeManager.init();
    NotificationManager.init();
    FormManager.init();
    MusicManager.init();
    SecurityManager.init();

    // دریافت IP و آب و هوا با تاخیر
    setTimeout(() => {
      IPWeatherManager.init();
    }, 500);

    // نمایش اطلاعات
    showConsoleInfo();

    console.timeEnd('روشنــا');
  }

  // شروع برنامه پس از بارگذاری کامل صفحه
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // ذخیره در global برای دسترسی از کنسول
  window.Rooshan = {
    theme: ThemeManager,
    particles: ParticleSystem,
    notifications: NotificationManager,
    music: MusicManager,
    version: '3.0.0',
    config: CONFIG
  };

})();
