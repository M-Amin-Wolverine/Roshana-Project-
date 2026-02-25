/* =================== ۱. مدیریت تم پیشرفته =================== */
function setThemeWithExpiry(theme, days = 30) {
  const expiry = new Date();
  expiry.setDate(expiry.getDate() + days);
  localStorage.setItem('theme', JSON.stringify({ value: theme, expiry: expiry.getTime() }));
}

function getThemeWithExpiry() {
  const itemStr = localStorage.getItem('theme');
  if (!itemStr) return 'dark';
  try {
    const item = JSON.parse(itemStr);
    if (Date.now() > item.expiry) { localStorage.removeItem('theme'); return 'dark'; }
    return item.value;
  } catch { return itemStr; }
}

const savedTheme = getThemeWithExpiry();
document.body.setAttribute('data-theme', savedTheme);

/* =================== ۲. ذرات نور پیشرفته =================== */
const canvas = document.getElementById('particles-canvas');
const ctx = canvas.getContext('2d');
let particles = [];
let mouse = { x: null, y: null, radius: 150 };
let animationFrame, lastTime = 0, fps = 60, interval = 1000 / fps;

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  initParticles();
}
window.addEventListener('resize', resizeCanvas);
canvas.addEventListener('mousemove', e => { mouse.x = e.x; mouse.y = e.y; });
canvas.addEventListener('mouseleave', () => { mouse.x = null; mouse.y = null; });

class SmartParticle {
  constructor() {
    this.reset();
  }
  reset() {
    this.x = Math.random() * canvas.width;
    this.y = Math.random() * canvas.height;
    this.size = Math.random() * 2.8 + 0.6;
    this.speedX = Math.random() * 0.8 - 0.4;
    this.speedY = Math.random() * 0.8 - 0.4;
    this.color = `rgba(0,212,255,${Math.random()*0.5+0.3})`;
    this.glow = Math.random()*0.5+0.3;
  }
  update() {
    this.x += this.speedX;
    this.y += this.speedY;
    if(this.x<0||this.x>canvas.width){ this.speedX*=-1; this.color=`rgba(255,100,100,${Math.random()*0.5+0.3})`; }
    if(this.y<0||this.y>canvas.height){ this.speedY*=-1; this.color=`rgba(100,255,100,${Math.random()*0.5+0.3})`; }
    if(mouse.x && mouse.y){
      const dx=mouse.x-this.x, dy=mouse.y-this.y;
      const dist=Math.sqrt(dx*dx+dy*dy);
      if(dist<mouse.radius){
        const angle=Math.atan2(dy,dx), force=(mouse.radius-dist)/mouse.radius;
        this.x-=Math.cos(angle)*force*3;
        this.y-=Math.sin(angle)*force*3;
        this.color=`rgba(255,215,0,${force+0.3})`;
      }
    }
  }
  draw(){
    ctx.shadowColor=this.color;
    ctx.shadowBlur=this.glow*10;
    ctx.fillStyle=this.color;
    ctx.beginPath();
    ctx.arc(this.x,this.y,this.size,0,Math.PI*2);
    ctx.fill();
    ctx.shadowBlur=0;
  }
}

function initParticles(){
  particles=[];
  const count=Math.min(150,Math.floor(window.innerWidth*window.innerHeight/8000));
  for(let i=0;i<count;i++) particles.push(new SmartParticle());
}

function connectParticles(){
  for(let a=0;a<particles.length;a++){
    for(let b=a;b<particles.length;b++){
      const dx=particles[a].x-particles[b].x;
      const dy=particles[a].y-particles[b].y;
      const dist=Math.sqrt(dx*dx+dy*dy);
      if(dist<100){
        ctx.strokeStyle=`rgba(0,212,255,${(1-dist/100)*0.2})`;
        ctx.lineWidth=1;
        ctx.beginPath();
        ctx.moveTo(particles[a].x,particles[a].y);
        ctx.lineTo(particles[b].x,particles[b].y);
        ctx.stroke();
      }
    }
  }
}

function optimizedAnimate(time){
  animationFrame=requestAnimationFrame(optimizedAnimate);
  const delta=time-lastTime;
  if(delta>=interval){
    ctx.clearRect(0,0,canvas.width,canvas.height);
    particles.forEach(p=>{p.update(); p.draw();});
    connectParticles();
    lastTime=time-(delta%interval);
  }
}
document.addEventListener('visibilitychange',()=>{ 
  if(document.hidden) cancelAnimationFrame(animationFrame); 
  else animationFrame=requestAnimationFrame(optimizedAnimate); 
});
initParticles();
animationFrame=requestAnimationFrame(optimizedAnimate);

/* =================== ۳. ساعت و تاریخ شمسی =================== */
function updateDateTime(){
  const now=new Date();
  const farsi=now.toLocaleString('fa-IR',{
    weekday:'long', year:'numeric', month:'long', day:'numeric',
    hour:'2-digit', minute:'2-digit', second:'2-digit', hour12:false
  });
  const dt=document.getElementById('datetime');
  dt.textContent=farsi;
  dt.style.transform='scale(1.02)';
  setTimeout(()=>{dt.style.transform='scale(1)';},100);
}
setInterval(updateDateTime,1000);
updateDateTime();

/* =================== ۴. دریافت IP و نوتیفیکیشن =================== */
const ipEl=document.getElementById('user-ip');
function showNotification(msg,type){
  const n=document.createElement('div');
  n.className=`notification ${type}`; n.textContent=msg;
  n.style.cssText=`position:fixed;bottom:20px;right:20px;padding:12px 24px;border-radius:8px;
  background:${type==='success'?'#4CAF50':'#f44336'};color:white;z-index:1000;animation:slideIn 0.3s ease;`;
  document.body.appendChild(n);
  setTimeout(()=>{ n.style.animation='slideOut 0.3s ease'; setTimeout(()=>n.remove(),300); },3000);
}
fetch('https://api.ipify.org?format=json')
  .then(r=>r.json()).then(d=>{ ipEl.textContent=d.ip; showNotification('✅ IP با موفقیت دریافت شد','success'); })
  .catch(()=>{ ipEl.textContent='خطا'; showNotification('❌ خطا در دریافت IP','error'); });

/* =================== ۵. چشمک رمز عبور =================== */
const togglePassword=document.querySelector('.toggle-password');
const passwordInput=document.querySelector('#password');
togglePassword.addEventListener('click',()=>{
  const type=passwordInput.getAttribute('type')==='password'?'text':'password';
  passwordInput.setAttribute('type',type);
  togglePassword.textContent=type==='password'?'👁':'🙈';
  togglePassword.style.transform='translateY(-50%) scale(1.2)';
  setTimeout(()=>{togglePassword.style.transform='translateY(-50%) scale(1)';},200);
});

/* =================== ۶. تغییر تم با ripple =================== */
const themeToggleBtn=document.getElementById('theme-toggle');
themeToggleBtn.addEventListener('click',(e)=>{
  const ripple=document.createElement('span'); ripple.classList.add('ripple'); themeToggleBtn.appendChild(ripple);
  const rect=themeToggleBtn.getBoundingClientRect();
  ripple.style.left=`${e.clientX-rect.left}px`; ripple.style.top=`${e.clientY-rect.top}px`;
  setTimeout(()=>ripple.remove(),600);
  const cur=document.body.getAttribute('data-theme');
  const next=cur==='dark'?'light':'dark';
  document.body.setAttribute('data-theme',next);
  setThemeWithExpiry(next);
  particles.forEach(p=>p.color=next==='light'?`rgba(0,102,204,${Math.random()*0.5+0.3})`:`rgba(0,212,255,${Math.random()*0.5+0.3})`);
  showNotification(`تم به ${next==='dark'?'تاریک':'روشن'} تغییر کرد`,'success');
});

/* =================== ۷. کارت شناور =================== */
const container=document.querySelector('.container');
container.addEventListener('mousemove',(e)=>{
  const rect=container.getBoundingClientRect();
  const x=e.clientX-rect.left; const y=e.clientY-rect.top;
  const cx=rect.width/2, cy=rect.height/2;
  const rx=(y-cy)/20, ry=(cx-x)/20;
  container.style.transform=`perspective(1000px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-2px)`;
});
container.addEventListener('mouseleave',()=>{ container.style.transform='perspective(1000px) rotateX(0) rotateY(0) translateY(0)'; });

/* =================== ۸. محافظت کلیک راست =================== */
document.addEventListener('contextmenu',e=>{ if(e.target.tagName!=='INPUT'){ e.preventDefault(); showNotification('ℹ️ کلیک راست غیرفعال است','info'); } });

/* =================== ۹. Drag & Drop =================== */
container.addEventListener('dragover',e=>{ e.preventDefault(); container.style.borderColor='var(--accent)'; });
container.addEventListener('dragleave',()=>{ container.style.borderColor='var(--border)'; });
container.addEventListener('drop',e=>{ e.preventDefault(); container.style.borderColor='var(--border)'; showNotification('📁 فایل دریافت شد','success'); });

/* =================== ۱۰. ذخیره آمار ذرات =================== */
window.addEventListener('beforeunload',()=>{
  const backup=particles.slice(0,10).map(p=>({x:p.x,y:p.y,speedX:p.speedX,speedY:p.speedY,size:p.size}));
  localStorage.setItem('particles-backup',JSON.stringify(backup));
});

console.log('🚀 Project Version: Ultimate 3-in-1 | All Features Loaded');
