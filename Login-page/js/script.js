```javascript
/* =================== پروژه روشنــا - نسخه نهایی فوق پیشرفته =================== */
// Author: تیم توسعه روشنــا
// Version: 3.2.0
// Last Update: 2026-02
// Description: نسخه بهبودیافته با WebGL particles, Service Worker offline, IndexedDB cache, smart FPS, dynamic gradients, GSAP, performance monitor, JWT mock

(function() {
  'use strict';

  /* =================== ۱. پیکربندی اصلی =================== */
  const CONFIG = {
    particles: {
      desktopCount: 220,
      mobileCount: 90,
      mouseRadius: 180,
      speedFactor: 0.8,
      glowFactor: 12,
      fpsThreshold: 35,
      mobileBreakpoint: 768
    },
    notifications: {
      duration: 4000,
      animationDuration: 400
    },
    music: {
      url: 'https://dl.musicdel.ir/Music/1400/05/naser_chashmazar_barane_eshghe.mp3',
      volume: 0.18,
      fadeDuration: 1200,
      autoPlay: false,
      retryCount: 3
    },
    api: {
      ip: 'https://api.ipify.org?format=json',
      fallbackIp: 'https://api.ipify.org?format=json',
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
    },
    jwt: {
      secret: 'mock-secret-key-2026', // فقط برای mock – در واقعی تغییر دهید
      expiresIn: '1h'
    }
  };

  /* =================== ۲. مدیریت تم پیشرفته با Dynamic Gradient Engine =================== */
  const ThemeManager = {
    init() {
      this.loadTheme();
      this.setupToggle();
      this.setupSystemThemeListener();
      this.generateDynamicGradient();
    },
    generateDynamicGradient() {
      const theme = document.body.getAttribute('data-theme') || 'dark';
      const colors = theme === 'dark' 
        ? ['#0a1118', '#1a2a35', '#00e0ff'] 
        : ['#f0f7fc', '#e0f0ff', '#0077cc'];
      
      const gradient = `radial-gradient(circle at ${Math.random() * 100}% ${Math.random() * 100}%, ${colors[0]}, ${colors[1]} 50%, ${colors[2]} 100%)`;
      document.body.style.backgroundImage = gradient;
    },
    animateThemeTransition() {
      const overlay = document.createElement('div');
      overlay.style.cssText = `
        position: fixed;
        inset: 0;
        background: ${document.body.getAttribute('data-theme') === 'dark' ? '#000' : '#fff'};
        opacity: 0.65;
        z-index: 9999;
        pointer-events: none;
        animation: fadeOut 0.6s ease-out forwards;
      `;
      document.body.appendChild(overlay);
      setTimeout(() => overlay.remove(), 600);
      this.generateDynamicGradient(); // بروزرسانی gradient بعد از تغییر تم
    },
    // بقیه متدها بدون تغییر
  };

  /* =================== ۳. WebGL Particle Engine (حرفه‌ای با FPS auto scaling) =================== */
  const ParticleSystem = {
    canvas: null,
    gl: null,
    particles: [],
    program: null,
    buffer: null,
    lastTime: 0,
    targetFPS: 60,
    frameTime: 0,
    init() {
      this.canvas = document.getElementById('particles-canvas');
      if (!this.canvas) return;
      
      this.gl = this.canvas.getContext('webgl');
      if (!this.gl) {
        console.warn('WebGL not supported');
        return;
      }
      
      // ایجاد برنامه shader ساده
      const vs = this.gl.createShader(this.gl.VERTEX_SHADER);
      this.gl.shaderSource(vs, `
        attribute vec2 position;
        void main() {
          gl_Position = vec4(position, 0.0, 1.0);
          gl_PointSize = 2.0;
        }
      `);
      this.gl.compileShader(vs);
      
      const fs = this.gl.createShader(this.gl.FRAGMENT_SHADER);
      this.gl.shaderSource(fs, `
        precision mediump float;
        void main() {
          gl_FragColor = vec4(0.0, 0.84, 1.0, 1.0);
        }
      `);
      this.gl.compileShader(fs);
      
      this.program = this.gl.createProgram();
      this.gl.attachShader(this.program, vs);
      this.gl.attachShader(this.program, fs);
      this.gl.linkProgram(this.program);
      this.gl.useProgram(this.program);
      
      this.buffer = this.gl.createBuffer();
      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffer);
      
      const position = this.gl.getAttribLocation(this.program, 'position');
      this.gl.enableVertexAttribArray(position);
      this.gl.vertexAttribPointer(position, 2, this.gl.FLOAT, false, 0, 0);
      
      this.createParticles();
      this.resize();
      window.addEventListener('resize', () => this.resize());
      this.animate(performance.now());
    },
    createParticles() {
      const count = Utils.isMobile() ? CONFIG.particles.mobileCount : CONFIG.particles.desktopCount;
      const data = new Float32Array(count * 2);
      for (let i = 0; i < count * 2; i += 2) {
        data[i] = Math.random() * 2 - 1; // x from -1 to 1
        data[i+1] = Math.random() * 2 - 1; // y
      }
      this.gl.bufferData(this.gl.ARRAY_BUFFER, data, this.gl.DYNAMIC_DRAW);
      this.particles = data; // برای بروزرسانی
    },
    resize() {
      this.canvas.width = window.innerWidth;
      this.canvas.height = window.innerHeight;
      this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    },
    animate(time) {
      requestAnimationFrame(t => this.animate(t));
      
      const delta = time - this.lastTime;
      this.lastTime = time;
      
      // Smart FPS scaling
      this.frameTime += delta;
      if (this.frameTime < 1000 / this.targetFPS) return; // skip frame اگر سریع‌تر باشه
      this.frameTime = 0;
      
      // بروزرسانی موقعیت ذرات (ساده)
      for (let i = 0; i < this.particles.length; i += 2) {
        this.particles[i] += (Math.random() - 0.5) * 0.01;
        this.particles[i+1] += (Math.random() - 0.5) * 0.01;
        // بازتاب اگر خارج از صفحه
        if (this.particles[i] < -1 || this.particles[i] > 1) this.particles[i] *= -1;
        if (this.particles[i+1] < -1 || this.particles[i+1] > 1) this.particles[i+1] *= -1;
      }
      
      this.gl.bufferSubData(this.gl.ARRAY_BUFFER, 0, this.particles);
      this.gl.clear(this.gl.COLOR_BUFFER_BIT);
      this.gl.drawArrays(this.gl.POINTS, 0, this.particles.length / 2);
    }
  };

  /* =================== ۴. Service Worker + Offline Mode =================== */
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js')
      .then(reg => console.log('Service Worker registered', reg))
      .catch(err => console.error('SW registration failed', err));
  }

  // sw.js محتوای پیشنهادی (در فایل جدا):
  // self.addEventListener('install', e => {
  //   e.waitUntil(caches.open('rooshan-v1').then(cache => cache.addAll(['/','/css/style.css','/js/script.js'])));
  // });
  // self.addEventListener('fetch', e => {
  //   e.respondWith(caches.match(e.request).then(res => res || fetch(e.request)));
  // });

  /* =================== ۵. IndexedDB Cache برای Weather =================== */
  const WeatherCache = {
    db: null,
    init() {
      const request = indexedDB.open('WeatherDB', 1);
      request.onupgradeneeded = e => {
        this.db = e.target.result;
        this.db.createObjectStore('weather', { keyPath: 'id' });
      };
      request.onsuccess = e => {
        this.db = e.target.result;
      };
    },
    cacheWeather(data) {
      const tx = this.db.transaction('weather', 'readwrite');
      tx.objectStore('weather').put({ id: 'current', data });
      tx.oncomplete = () => console.log('Weather cached in IndexedDB');
    },
    getCachedWeather() {
      return new Promise(resolve => {
        const tx = this.db.transaction('weather', 'readonly');
        const req = tx.objectStore('weather').get('current');
        req.onsuccess = e => resolve(e.target.result?.data);
      });
    }
  };

  /* =================== ۶. مدیریت IP و آب و هوا با IndexedDB =================== */
  const IPWeatherManager = {
    async init() {
      WeatherCache.init();
      const cached = await WeatherCache.getCachedWeather();
      if (cached) {
        this.displayWeather(cached, { city: 'ذخیره‌شده' });
      }
      await this.fetchIPAndWeather();
    },
    // بقیه متدها + بعد از fetch موفق:
    // WeatherCache.cacheWeather(data.current);
  };

  /* =================== ۷. GSAP transitions برای انیمیشن‌ها =================== */
  // فرض کنید GSAP رو از CDN لود کردید: <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"></script>
  const GSAPManager = {
    init() {
      gsap.registerPlugin(ScrollTrigger);
      // مثال: انیمیشن ورود فرم
      gsap.from('.login-box', { duration: 1, y: 50, opacity: 0, ease: 'power2.out' });
      // انیمیشن تغییر تم
      // در ThemeManager.toggle() بعد از setTheme: gsap.to('body', { duration: 0.5, backgroundColor: newBg });
    }
  };

  /* =================== ۸. Performance Monitor داخلی (با stats.js الهام گرفته) =================== */
  // فرض کنید stats.js رو اضافه کردید: <script src="https://github.com/mrdoob/stats.js/raw/master/build/stats.min.js"></script>
  const PerformanceMonitor = {
    stats: new Stats(),
    init() {
      this.stats.showPanel(0); // 0: FPS
      document.body.appendChild(this.stats.dom);
      this.animate();
    },
    animate() {
      this.stats.update();
      requestAnimationFrame(() => this.animate());
    }
  };

  /* =================== ۹. Secure login via JWT mock =================== */
  const JWTManager = {
    generateToken(username) {
      // Mock JWT: header.payload.signature
      const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
      const payload = btoa(JSON.stringify({ sub: username, exp: Date.now() + 3600000 })); // 1h
      const signature = btoa(CONFIG.jwt.secret); // ساده mock
      return `${header}.${payload}.${signature}`;
    },
    validateToken(token) {
      try {
        const [header, payload, sig] = token.split('.');
        const decodedPayload = JSON.parse(atob(payload));
        return decodedPayload.exp > Date.now(); // چک ساده
      } catch {
        return false;
      }
    }
  };

  // در FormManager.handleLogin() بعد از validate:
  // const token = JWTManager.generateToken(username);
  // localStorage.setItem('jwt', token);
  // و در درخواست‌های بعدی: if (!JWTManager.validateToken(localStorage.getItem('jwt'))) { ... }

  /* =================== ۱۰. مقداردهی اولیه =================== */
  function init() {
    console.time('روشنــا');
    addAnimations();
    checkRequiredElements();
    ThemeManager.init();
    ParticleSystem.init(); // حالا WebGL
    DateTimeManager.init();
    NotificationManager.init();
    FormManager.init();
    MusicManager.init();
    SecurityManager.init();
    setTimeout(() => IPWeatherManager.init(), 600);
    GSAPManager.init();
    PerformanceMonitor.init();
    showConsoleInfo();
    console.timeEnd('روشنــا');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.Rooshan = {
    theme: ThemeManager,
    particles: ParticleSystem,
    notifications: NotificationManager,
    music: MusicManager,
    jwt: JWTManager,
    version: '3.2.0',
    config: CONFIG
  };
})();
```
