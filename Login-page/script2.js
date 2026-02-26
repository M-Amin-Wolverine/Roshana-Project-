/* ===========================================================
   پروژه روشنــا - نسخه نهایی فوق العاده (Ultimate Edition)
   Version: 3.2.6  // بروزرسانی بر اساس داده‌های جدید (فیکس IP، آب‌وهوا، پرچم، نوتیفیکیشن VPN)
   Last Update: 2026-02-26
   Features: WebGL Particles, IndexedDB Cache, JWT Auth,
             GSAP Animations, Dynamic Gradients, Performance Monitor,
             Enhanced Weather/IP with Flag & VPN Detection
   Author: تیم توسعه روشنــا (با گسترش از Grok)
=========================================================== */
(function() {
    'use strict';
    // =================== پیکربندی جامع ===================
    const CONFIG = {
        particles: {
            desktopCount: 220,
            mobileCount: 90,
            targetFPS: 60,
            mobileBreakpoint: 768,
            speedFactor: 0.8,
            color: [0.0, 0.84, 1.0, 0.8] // RGBA
        },
        jwt: {
            secret: 'rooshan-secure-key-2026',
            expiresIn: 3600000 // 1 hour
        },
        database: {
            name: 'RooshanDB',
            version: 1,
            storeName: 'cache'
        },
        api: {
            ip: 'https://api.ipify.org?format=json',
            weather: 'https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&current=temperature_2m,relative_humidity_2m,weather_code&timezone=Asia%2FTehran'
        },
        music: {
            url: 'https://dl.musicdel.ir/Music/1400/05/naser_chashmazar_barane_eshghe.mp3',
            volume: 0.18,
            autoPlay: false
        }
    };
    // =================== ابزارهای کمکی ===================
    const Utils = {
        isMobile() {
            return window.innerWidth < CONFIG.particles.mobileBreakpoint;
        },
       
        async fetchWithCache(url, cacheKey) {
            try {
                const cached = await DataManager.getFromCache(cacheKey);
                if (cached) return cached;
               
                const response = await fetch(url);
                const data = await response.json();
                await DataManager.saveToCache(cacheKey, data);
                return data;
            } catch (error) {
                console.error('Fetch error:', error);
                return null;
            }
        },
        showNotification(message, type = 'info') {
            if (window.Rooshan?.notifications) {
                window.Rooshan.notifications.show(message, type);
            } else {
                console.log(`[${type}] ${message}`);
            }
        }
    };
    // =================== مدیریت خطا ===================
    const ErrorHandler = {
        async safeExecute(fn, context, fallback = null) {
            try {
                return await fn();
            } catch (error) {
                console.error(`Error in ${context}:`, error);
                Utils.showNotification(`خطا در ${context}`, 'error');
                return fallback;
            }
        }
    };
    // =================== مدیریت تم و گرادیان ===================
    const ThemeManager = {
        currentTheme: 'dark',
       
        async init() {
            return ErrorHandler.safeExecute(async () => {
                this.loadTheme();
                this.setupToggle();
                this.setupSystemThemeListener();
                this.generateDynamicGradient();
                console.log('🎨 ThemeManager initialized');
            }, 'ThemeManager');
        },
        loadTheme() {
            this.currentTheme = localStorage.getItem('rooshan-theme') || 'dark';
            document.body.setAttribute('data-theme', this.currentTheme);
        },
        setupToggle() {
            const toggleButtons = document.querySelectorAll('.theme-toggle');
            if (toggleButtons.length === 0) {
               console.warn('هیچ دکمه theme-toggle پیدا نشد');
               return;
    }

        toggleButtons.forEach(btn => {
            btn.addEventListener('click', () => this.toggleTheme());
    });

    console.log(`🎨 ${toggleButtons.length} دکمه تغییر تم ثبت شد`);
}
        setupSystemThemeListener() {
            window.matchMedia('(prefers-color-scheme: dark)').addListener((e) => {
                if (!localStorage.getItem('rooshan-theme')) {
                    this.currentTheme = e.matches ? 'dark' : 'light';
                    this.applyTheme();
                }
            });
        },
        toggleTheme() {
            this.currentTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
            this.applyTheme();
            this.animateThemeTransition();
        },
        applyTheme() {
            document.body.setAttribute('data-theme', this.currentTheme);
            localStorage.setItem('rooshan-theme', this.currentTheme);
            this.generateDynamicGradient();
        },
        generateDynamicGradient() {
            const colors = this.currentTheme === 'dark'
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
                background: ${this.currentTheme === 'dark' ? '#000' : '#fff'};
                opacity: 0.65;
                z-index: 9999;
                pointer-events: none;
                transition: opacity 0.6s ease;
            `;
            document.body.appendChild(overlay);
           
            setTimeout(() => {
                overlay.style.opacity = '0';
                setTimeout(() => overlay.remove(), 600);
            }, 50);
        }
    };
    // =================== موتور ذرات WebGL ===================
    const ParticleEngine = {
        canvas: null,
        gl: null,
        program: null,
        particles: null,
        buffer: null,
        lastTime: 0,
        frameCount: 0,
       
        async init() {
            return ErrorHandler.safeExecute(() => {
                this.canvas = document.getElementById('particles-canvas');
                if (!this.canvas) {
                    this.createCanvas();
                }
               
                this.gl = this.canvas.getContext('webgl') || this.canvas.getContext('experimental-webgl');
                if (!this.gl) {
                    console.warn('WebGL not supported, falling back to 2D canvas');
                    return this.fallbackTo2D();
                }
                this.setupShaders();
                this.createParticles();
                this.resize();
               
                window.addEventListener('resize', () => this.resize());
                requestAnimationFrame((t) => this.render(t));
               
                console.log('🎯 ParticleEngine initialized');
            }, 'ParticleEngine');
        },
        createCanvas() {
            this.canvas = document.createElement('canvas');
            this.canvas.id = 'particles-canvas';
            this.canvas.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                pointer-events: none;
                z-index: -1;
            `;
            document.body.prepend(this.canvas);
        },
        setupShaders() {
            // Vertex Shader
            const vsSource = `
                attribute vec2 position;
                void main() {
                    gl_Position = vec4(position, 0.0, 1.0);
                    gl_PointSize = 2.0;
                }
            `;
            // Fragment Shader
            const fsSource = `
                precision mediump float;
                void main() {
                    gl_FragColor = vec4(${CONFIG.particles.color.join(',')});
                }
            `;
            const vs = this.createShader(this.gl.VERTEX_SHADER, vsSource);
            const fs = this.createShader(this.gl.FRAGMENT_SHADER, fsSource);
            this.program = this.gl.createProgram();
            this.gl.attachShader(this.program, vs);
            this.gl.attachShader(this.program, fs);
            this.gl.linkProgram(this.program);
            if (!this.gl.getProgramParameter(this.program, this.gl.LINK_STATUS)) {
                throw new Error('Shader program linking failed');
            }
            this.gl.useProgram(this.program);
        },
        createShader(type, source) {
            const shader = this.gl.createShader(type);
            this.gl.shaderSource(shader, source);
            this.gl.compileShader(shader);
            if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
                console.error('Shader compile error:', this.gl.getShaderInfoLog(shader));
                this.gl.deleteShader(shader);
                throw new Error('Shader compilation failed');
            }
            return shader;
        },
        createParticles() {
            const count = Utils.isMobile() ? CONFIG.particles.mobileCount : CONFIG.particles.desktopCount;
            this.particles = new Float32Array(count * 2);
           
            for (let i = 0; i < count * 2; i += 2) {
                this.particles[i] = Math.random() * 2 - 1; // x
                this.particles[i + 1] = Math.random() * 2 - 1; // y
            }
            this.buffer = this.gl.createBuffer();
            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffer);
            this.gl.bufferData(this.gl.ARRAY_BUFFER, this.particles, this.gl.DYNAMIC_DRAW);
            const positionLoc = this.gl.getAttribLocation(this.program, 'position');
            this.gl.enableVertexAttribArray(positionLoc);
            this.gl.vertexAttribPointer(positionLoc, 2, this.gl.FLOAT, false, 0, 0);
        },
        resize() {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
           
            if (this.gl) {
                this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
            }
        },
        render(currentTime) {
            requestAnimationFrame((t) => this.render(t));
            const delta = currentTime - this.lastTime;
            if (delta < 1000 / CONFIG.particles.targetFPS) return;
            this.lastTime = currentTime;
            this.frameCount++;
            // Update particles
            for (let i = 0; i < this.particles.length; i += 2) {
                this.particles[i] += (Math.random() - 0.5) * 0.005;
                this.particles[i + 1] += (Math.random() - 0.5) * 0.005;
                // Bounce off edges
                if (Math.abs(this.particles[i]) > 1.0) {
                    this.particles[i] *= -0.95;
                }
                if (Math.abs(this.particles[i + 1]) > 1.0) {
                    this.particles[i + 1] *= -0.95;
                }
            }
            // Render
            this.gl.bufferSubData(this.gl.ARRAY_BUFFER, 0, this.particles);
            this.gl.clearColor(0, 0, 0, 0);
            this.gl.clear(this.gl.COLOR_BUFFER_BIT);
            this.gl.drawArrays(this.gl.POINTS, 0, this.particles.length / 2);
        },
        fallbackTo2D() {
            // Simple 2D fallback
            const ctx = this.canvas.getContext('2d');
            const count = Utils.isMobile() ? CONFIG.particles.mobileCount : CONFIG.particles.desktopCount;
           
            const animate = () => {
                ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
                ctx.fillStyle = '#00e0ff';
               
                for (let i = 0; i < count; i++) {
                    const x = Math.random() * this.canvas.width;
                    const y = Math.random() * this.canvas.height;
                    ctx.fillRect(x, y, 2, 2);
                }
               
                requestAnimationFrame(animate);
            };
           
            animate();
        }
    };
    // =================== مدیریت داده و IndexedDB ===================
    const DataManager = {
        db: null,
       
        async init() {
            return ErrorHandler.safeExecute(async () => {
                await this.initDB();
                console.log('📦 DataManager initialized');
            }, 'DataManager');
        },
        initDB() {
            return new Promise((resolve, reject) => {
                const request = indexedDB.open(CONFIG.database.name, CONFIG.database.version);
               
                request.onupgradeneeded = (event) => {
                    const db = event.target.result;
                    if (!db.objectStoreNames.contains(CONFIG.database.storeName)) {
                        db.createObjectStore(CONFIG.database.storeName);
                    }
                };
               
                request.onsuccess = (event) => {
                    this.db = event.target.result;
                    resolve();
                };
               
                request.onerror = (event) => {
                    reject('IndexedDB initialization failed');
                };
            });
        },
        async saveToCache(key, data) {
            if (!this.db) return;
           
            return new Promise((resolve, reject) => {
                const transaction = this.db.transaction([CONFIG.database.storeName], 'readwrite');
                const store = transaction.objectStore(CONFIG.database.storeName);
                const request = store.put(data, key);
               
                request.onsuccess = () => resolve();
                request.onerror = () => reject();
            });
        },
        async getFromCache(key) {
            if (!this.db) return null;
           
            return new Promise((resolve) => {
                const transaction = this.db.transaction([CONFIG.database.storeName], 'readonly');
                const store = transaction.objectStore(CONFIG.database.storeName);
                const request = store.get(key);
               
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => resolve(null);
            });
        }
    };
    // =================== مدیریت JWT ===================
    const JWTManager = {
        generateToken(username) {
            try {
                const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
                const payload = btoa(JSON.stringify({
                    sub: username,
                    exp: Date.now() + CONFIG.jwt.expiresIn,
                    iat: Date.now()
                }));
                const signature = btoa(CONFIG.jwt.secret);
               
                return `${header}.${payload}.${signature}`;
            } catch (error) {
                console.error('Token generation failed:', error);
                return null;
            }
        },
        validateToken(token) {
            try {
                const parts = token.split('.');
                if (parts.length !== 3) return false;
               
                const payload = JSON.parse(atob(parts[1]));
                return payload.exp > Date.now();
            } catch {
                return false;
            }
        },
        getToken() {
            return localStorage.getItem('rooshan-jwt');
        },
        setToken(token) {
            if (token) {
                localStorage.setItem('rooshan-jwt', token);
            } else {
                localStorage.removeItem('rooshan-jwt');
            }
        }
    };
    // =================== مدیریت آب و هوا (گسترش‌یافته با IP، پرچم، چک VPN) ===================
    const WeatherManager = {
        async init() {
            return ErrorHandler.safeExecute(async () => {
                await this.getLocationAndWeather();
            }, 'WeatherManager');
        },
        async getLocationAndWeather() {
            const cached = await DataManager.getFromCache('weather');
            if (cached && (Date.now() - cached.timestamp) < 1800000) {
                this.displayWeather(cached.data);
                return;
            }

            try {
                // 1. گرفتن IP (ipify ساده و سریع)
                const ipRes = await fetch(CONFIG.api.ip);
                const ipData = await ipRes.json();

                // 2. گرفتن اطلاعات کشور/مکان/مختصات از ipapi.co
                const locRes = await fetch(`https://ipapi.co/${ipData.ip}/json/`);
                const locData = await locRes.json();

                if (!locData || !locData.latitude || !locData.longitude) {
                    throw new Error('مکان از IP قابل دریافت نیست');
                }

                // ★★★ چک کشور و نوتیفیکیشن VPN ★★★
                const countryCode = locData.country_code?.toUpperCase(); // مثل "NL" یا "IR"
                const countryName = locData.country_name || 'نامشخص';

                // پرچم emoji (روش ساده بدون کتابخانه)
                let flagEmoji = '🌍'; // پیش‌فرض
                if (countryCode && countryCode.length === 2) {
                    // تبدیل AA -> 🇦🇦 (regional indicators)
                    flagEmoji = String.fromCodePoint(
                        countryCode.charCodeAt(0) + 127397,
                        countryCode.charCodeAt(1) + 127397
                    );
                }

                // اگر کشور ایران نبود → هشدار
                if (countryCode !== 'IR') {
                    Utils.showNotification(
                        `احتمالاً از VPN/فیلترشکن استفاده می‌کنید!\nکشور تشخیص‌داده‌شده: ${countryName} (${countryCode})\nلطفاً برای ورود امن خاموش کنید.`,
                        'warning',
                        8000 // طولانی‌تر
                    );
                }

                // 3. گرفتن آب و هوا با مختصات واقعی
                const weatherUrl = CONFIG.api.weather
                    .replace('{lat}', locData.latitude)
                    .replace('{lon}', locData.longitude);
                
                const weatherRes = await fetch(weatherUrl);
                const weatherData = await weatherRes.json();

                const current = weatherData.current || {};

                const data = {
                    flag: flagEmoji,
                    country: countryName,
                    city: locData.city || 'نامشخص',
                    ip: ipData.ip,
                    temperature: current.temperature_2m?.toFixed(1) || '?',
                    humidity: current.relative_humidity_2m || '?',
                    condition: this.getWeatherCondition(current.weather_code),
                    timestamp: Date.now()
                };

                await DataManager.saveToCache('weather', data);
                this.displayWeather(data);

            } catch (error) {
                console.error('Weather/IP fetch failed:', error);
                Utils.showNotification('ناتوانی در دریافت IP یا آب‌وهوا', 'error');
                // نمایش fallback
                document.getElementById('user-ip').innerHTML = 'IP: قابل دریافت نیست 🌍';
                document.getElementById('weather').innerHTML = 'آب‌و‌هوا: نامشخص ☁️';
            }
        },
        getWeatherCondition(code) {
            // مپینگ ساده از WMO کدهای open-meteo (بر اساس داکیومنت رسمی)
            const map = {
                0: 'آفتابی ☀️',
                1: 'عمدتاً صاف 🌤️',
                2: 'نیمه‌ابری ⛅',
                3: 'ابری ☁️',
                45: 'مه 🟫',
                51: 'باران ریز 🌦️',
                61: 'باران 🌧️',
                71: 'برف ❄️',
                80: 'رگبار ⛈️',
                95: 'طوفان ⚡'
                // بقیه کدها رو می‌تونی اضافه کنی
            };
            return map[code] || 'نامشخص 🌫️';
        },
        displayWeather(data) {
            // IP + پرچم
            const ipEl = document.getElementById('user-ip');
            if (ipEl) {
                ipEl.innerHTML = `IP: ${data.ip} ${data.flag} (${data.country})`;
            }

            // آب و هوا (توی #weather)
            const weatherEl = document.getElementById('weather');
            if (weatherEl) {
                weatherEl.innerHTML = `
                    ${data.city}: ${data.temperature}°C • ${data.condition} • رطوبت ${data.humidity}%
                `;
            }
        }
    };
    // =================== مدیریت انیمیشن‌ها ===================
    const AnimationManager = {
        init() {
            return ErrorHandler.safeExecute(() => {
                if (typeof gsap !== 'undefined') {
                    this.animateLoginBox();
                    this.setupScrollAnimations();
                    console.log('✨ AnimationManager initialized');
                } else {
                    console.warn('GSAP not loaded, animations disabled');
                }
            }, 'AnimationManager');
        },
        animateLoginBox() {
            const loginBox = document.querySelector('.login-box');
            if (loginBox) {
                gsap.from(loginBox, {
                    duration: 1.2,
                    y: 50,
                    opacity: 0,
                    ease: 'back.out(1.7)'
                });
            }
        },
        setupScrollAnimations() {
            if (typeof ScrollTrigger !== 'undefined') {
                gsap.registerPlugin(ScrollTrigger);
                // Add scroll animations here if needed
            }
        }
    };
    // =================== مانیتورینگ عملکرد ===================
    const PerformanceMonitor = {
        stats: null,
       
        init() {
            return ErrorHandler.safeExecute(() => {
                if (typeof Stats !== 'undefined') {
                    this.stats = new Stats();
                    this.stats.showPanel(0); // 0: fps, 1: ms, 2: memory
                    this.stats.dom.style.cssText = `
                        position: fixed;
                        top: 10px;
                        left: 10px;
                        z-index: 10000;
                        opacity: 0.8;
                        cursor: pointer;
                    `;
                   
                    this.stats.dom.addEventListener('click', () => {
                        this.stats.dom.style.display =
                            this.stats.dom.style.display === 'none' ? 'block' : 'none';
                    });
                   
                    document.body.appendChild(this.stats.dom);
                    this.animate();
                    console.log('📊 PerformanceMonitor initialized');
                }
            }, 'PerformanceMonitor');
        },
        animate() {
            this.stats?.update();
            requestAnimationFrame(() => this.animate());
        }
    };
    // =================== مدیریت نوتیفیکیشن ===================
    const NotificationManager = {
        container: null,
       
        init() {
            this.createContainer();
        },
        createContainer() {
            this.container = document.createElement('div');
            this.container.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 10001;
                display: flex;
                flex-direction: column;
                gap: 10px;
            `;
            document.body.appendChild(this.container);
        },
        show(message, type = 'info', duration = 4000) {
            const notification = document.createElement('div');
           
            const colors = {
                info: '#00e0ff',
                success: '#4caf50',
                warning: '#ff9800',
                error: '#f44336'
            };
           
            notification.style.cssText = `
                background: ${colors[type] || colors.info};
                color: white;
                padding: 12px 24px;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                font-family: 'Vazir', sans-serif;
                direction: rtl;
                transform: translateX(120%);
                transition: transform 0.3s ease;
                cursor: pointer;
            `;
           
            notification.textContent = message;
           
            notification.addEventListener('click', () => {
                notification.style.transform = 'translateX(120%)';
                setTimeout(() => notification.remove(), 300);
            });
           
            this.container.appendChild(notification);
           
            // Animate in
            setTimeout(() => {
                notification.style.transform = 'translateX(0)';
            }, 10);
           
            // Auto remove
            setTimeout(() => {
                notification.style.transform = 'translateX(120%)';
                setTimeout(() => notification.remove(), 300);
            }, duration);
        }
    };
// =================== مدیریت ساعت و تاریخ شمسی ===================
const DateTimeManager = {
    init() {
        const datetimeEl = document.getElementById('datetime');
        if (!datetimeEl) {
            console.warn('المان #datetime پیدا نشد');
            return;
        }

        const updateDateTime = () => {
            const now = new Date();
            // تاریخ و ساعت شمسی با Intl (بدون کتابخانه اضافی)
            const persianDate = now.toLocaleString('fa-IR', {
                dateStyle: 'full',
                timeStyle: 'medium'
            });
            datetimeEl.innerHTML = persianDate;
        };

        // آپدیت اولیه
        updateDateTime();
        // هر ثانیه آپدیت
        setInterval(updateDateTime, 1000);
        console.log('🕒 DateTimeManager فعال شد');
    }
};
// =================== مدیریت موسیقی (پلیر waveform پیشرفته) ===================
const MusicManager = {
    wavesurfer: null,
    isInitialized: false,
    init() {
        // چک کردن وجود المان‌های HTML پلیر
        const container = document.getElementById('musicPlayerContainer');
        if (!container) {
            console.warn('Music player HTML not found → پلیر غیرفعال');
            return;
        }
        const toggleBtn = document.getElementById('musicToggleBtn');
        const closeBtn = document.getElementById('musicClose');
        const playPauseBtn = document.getElementById('musicPlayPause');
        const playPath = document.getElementById('playPath');
        const currentTime = document.getElementById('currentTime');
        const duration = document.getElementById('duration');
        const volumeControl = document.getElementById('volumeControl');
        const muteBtn = document.getElementById('muteBtn');
        const volumeIcon = document.getElementById('volumeIcon');
        if (!toggleBtn || !playPauseBtn) return;
        // ولوم اولیه از CONFIG
        if (volumeControl) volumeControl.value = CONFIG.music.volume;
        // اتصال رویدادها
        toggleBtn.addEventListener('click', () => this.togglePlayer());
        closeBtn?.addEventListener('click', () => this.closePlayer());
        playPauseBtn.addEventListener('click', () => this.playPause());
        volumeControl?.addEventListener('input', e => this.setVolume(e.target.value));
        muteBtn?.addEventListener('click', () => this.toggleMute());
        // اگر autoPlay فعال بود، پلیر را باز کن
        if (CONFIG.music.autoPlay) {
            this.togglePlayer(true);
        }
        this.isInitialized = true;
        console.log('🎵 MusicManager آماده شد');
    },
    async togglePlayer(autoPlay = false) {
        const container = document.getElementById('musicPlayerContainer');
        container.classList.toggle('active');
        if (!this.wavesurfer) {
            await this.initWaveSurfer();
        }
        if (this.wavesurfer && (autoPlay || container.classList.contains('active'))) {
            this.wavesurfer.play().catch(err => console.warn('Play failed:', err));
        } else if (this.wavesurfer) {
            this.wavesurfer.pause();
        }
    },
    closePlayer() {
        document.getElementById('musicPlayerContainer').classList.remove('active');
        if (this.wavesurfer) this.wavesurfer.pause();
    },
    playPause() {
        if (this.wavesurfer) {
            this.wavesurfer.playPause();
        } else {
            this.togglePlayer(true);
        }
    },
    async initWaveSurfer() {
        if (typeof WaveSurfer === 'undefined') {
            console.error('WaveSurfer لود نشده است. اسکریپت CDN را چک کنید.');
            return;
        }
        this.wavesurfer = WaveSurfer.create({
            container: '#waveform',
            waveColor: '#888cf8',
            progressColor: '#5060ff',
            cursorColor: '#ffffff88',
            barWidth: 3,
            barGap: 2,
            height: 48,
            normalize: true,
            barRadius: 4
        });
        try {
            await this.wavesurfer.load(CONFIG.music.url);
            this.wavesurfer.on('ready', () => {
                document.getElementById('duration').textContent = this.formatTime(this.wavesurfer.getDuration());
                this.setVolume(CONFIG.music.volume);
            });
            this.wavesurfer.on('audioprocess', () => {
                document.getElementById('currentTime').textContent = this.formatTime(this.wavesurfer.getCurrentTime());
            });
            this.wavesurfer.on('play', () => {
                document.getElementById('playPath').setAttribute('d', 'M6,19H10V5H6V19M14,5V19H18V5H14Z'); // آیکون pause
            });
            this.wavesurfer.on('pause', () => {
                document.getElementById('playPath').setAttribute('d', 'M8,5.14V19.14L19,12.14L8,5.14Z'); // آیکون play
            });
        } catch (err) {
            console.error('خطا در لود آهنگ:', err);
            Utils.showNotification('آهنگ لود نشد. لینک را چک کنید.', 'error');
        }
    },
    setVolume(value) {
        if (this.wavesurfer) {
            this.wavesurfer.setVolume(parseFloat(value));
        }
    },
    toggleMute() {
        if (this.wavesurfer) {
            const muted = this.wavesurfer.getMuted();
            this.wavesurfer.setMuted(!muted);
            // می‌توانی آیکون mute را اینجا تغییر دهی
        }
    },
    formatTime(seconds) {
        if (!seconds || isNaN(seconds)) return '00:00';
        const min = Math.floor(seconds / 60);
        const sec = Math.floor(seconds % 60);
        return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
    }
};
    // =================== سیستم راه‌اندازی ===================
    const Bootstrapper = {
        async init() {
            console.time('🚀 Rooshan Startup Time');
            console.log('%c روشنــا v3.2.6 ', 'background: #00e0ff; color: #000; font-size: 16px; padding: 4px;');
           
            // Initialize modules in order
            await this.initCore();
            await this.initFeatures();
            await this.initUI();
           
            this.exposeAPI();
           
            console.timeEnd('🚀 Rooshan Startup Time');
            Utils.showNotification('روشنــا با موفقیت راه‌اندازی شد', 'success');
        },
        async initCore() {
            await ErrorHandler.safeExecute(DataManager.init.bind(DataManager), 'DataManager');
           // await ErrorHandler.safeExecute(JWTManager.init?.bind(JWTManager), 'JWTManager');
        },
        async initFeatures() {
            await ErrorHandler.safeExecute(ParticleEngine.init.bind(ParticleEngine), 'ParticleEngine');
            await ErrorHandler.safeExecute(ThemeManager.init.bind(ThemeManager), 'ThemeManager');
            await ErrorHandler.safeExecute(WeatherManager.init.bind(WeatherManager), 'WeatherManager');
        },
        async initUI() {
            await ErrorHandler.safeExecute(AnimationManager.init.bind(AnimationManager), 'AnimationManager');
            await ErrorHandler.safeExecute(PerformanceMonitor.init.bind(PerformanceMonitor), 'PerformanceMonitor');
            await ErrorHandler.safeExecute(MusicManager.init.bind(MusicManager), 'MusicManager');
            DateTimeManager.init();  // ← اضافه کن اینجا
            NotificationManager.init();
          
        },
        exposeAPI() {
            window.Rooshan = {
                version: '3.2.6-ultimate',
                theme: ThemeManager,
                auth: {
                    generateToken: JWTManager.generateToken.bind(JWTManager),
                    validateToken: JWTManager.validateToken.bind(JWTManager),
                    getToken: JWTManager.getToken.bind(JWTManager),
                    setToken: JWTManager.setToken.bind(JWTManager)
                },
                notifications: {
                    show: NotificationManager.show.bind(NotificationManager)
                },
                data: {
                    save: DataManager.saveToCache.bind(DataManager),
                    get: DataManager.getFromCache.bind(DataManager)
                },
                music: MusicManager,
                refreshGradient: () => ThemeManager.generateDynamicGradient(),
                config: CONFIG
            };
           
            console.log('✅ Rooshan API available at window.Rooshan');
        }
    };
    // =================== شروع برنامه ===================
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => Bootstrapper.init());
    } else {
        Bootstrapper.init();
    }
})();
