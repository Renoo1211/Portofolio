const GREETINGS = [
  { word: 'Halo.',       lang: 'Bahasa Indonesia' },
  { word: 'Hello.',      lang: 'English' },
  { word: 'こんにちは.',  lang: '日本語 / Japanese' },
  { word: '안녕하세요.',  lang: '한국어 / Korean' },
  { word: 'Bonjour.',    lang: 'Français / French' },
  { word: 'Hola.',       lang: 'Español / Spanish' },
  { word: 'مرحباً.',     lang: 'العربية / Arabic' },
  { word: 'Ciao.',       lang: 'Italiano / Italian' },
  { word: 'Olá.',        lang: 'Português / Portuguese' },
  { word: '你好.',        lang: '中文 / Chinese' },
  { word: 'Namaste.',    lang: 'हिन्दी / Hindi' },
  { word: 'Hallo.',      lang: 'Deutsch / German' },
  { word: 'Привет.',     lang: 'Русский / Russian' },
];

/* timing (ms) */
const HOLD_TIME  = 80;
const TRANS_TIME = 40;
const GAP_TIME   = 10;

function runIntro() {
  const introEl  = document.getElementById('intro');
  const wordEl   = document.getElementById('intro-word');
  const langEl   = document.getElementById('intro-lang');
  const barEl    = document.getElementById('intro-bar');

  if (!introEl) return;

  document.body.classList.add('intro-active');

  const total = GREETINGS.length;
  let index   = 0;

  function showNext() {
    if (index >= total) {
      introEl.classList.add('hiding');
      introEl.addEventListener('animationend', () => {
        introEl.remove();
        document.body.classList.remove('intro-active');
        initScrollAnimations();
        animateSkillBars();
      }, { once: true });
      return;
    }

    const { word, lang } = GREETINGS[index];

    barEl.style.width = ((index + 1) / total * 100) + '%';

    wordEl.textContent = word;
    langEl.textContent = lang;

    wordEl.classList.remove('exit');
    langEl.classList.remove('active');
    void wordEl.offsetWidth;
    wordEl.classList.add('active');
    langEl.classList.add('active');

    setTimeout(() => {
      wordEl.classList.remove('active');
      wordEl.classList.add('exit');
      langEl.classList.remove('active');

      setTimeout(() => {
        wordEl.classList.remove('exit');
        index++;
        setTimeout(showNext, GAP_TIME);
      }, TRANS_TIME);

    }, HOLD_TIME + TRANS_TIME);
  }

  setTimeout(showNext, 200);
}


/* ──────────────────────────────────────────────────────────
   SCROLL FADE-UP (IntersectionObserver)
────────────────────────────────────────────────────────── */
function initScrollAnimations() {
  const targets = document.querySelectorAll('.fade-up');

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.07 });

  targets.forEach(el => observer.observe(el));
}


/* ──────────────────────────────────────────────────────────
   SKILL BAR ANIMATION
────────────────────────────────────────────────────────── */
function animateSkillBars() {
  const skillsSection = document.getElementById('skills');
  if (!skillsSection) return;

  const barObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        document.querySelectorAll('.skill-bar').forEach(bar => {
          bar.style.width = bar.dataset.width + '%';
        });
        barObserver.disconnect();
      }
    });
  }, { threshold: 0.2 });

  barObserver.observe(skillsSection);
}


/* ──────────────────────────────────────────────────────────
   NAV — Active link highlight on scroll
────────────────────────────────────────────────────────── */
function initNavHighlight() {
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-links a');

  const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        navLinks.forEach(link => {
          link.classList.remove('nav-active');
          if (link.getAttribute('href') === '#' + entry.target.id) {
            link.classList.add('nav-active');
          }
        });
      }
    });
  }, { rootMargin: '-40% 0px -55% 0px' });

  sections.forEach(s => sectionObserver.observe(s));
}


/* ──────────────────────────────────────────────────────────
   SMOOTH ANCHOR SCROLLING
────────────────────────────────────────────────────────── */
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });
}


/* ──────────────────────────────────────────────────────────
   MARQUEE — Pause on hover (already handled by CSS)
   But also add touch support for mobile
────────────────────────────────────────────────────────── */
function initMarquee() {
  document.querySelectorAll('.marquee-track').forEach(track => {
    track.addEventListener('touchstart', () => {
      track.style.animationPlayState = 'paused';
    });
    track.addEventListener('touchend', () => {
      track.style.animationPlayState = 'running';
    });
  });
}


/* ──────────────────────────────────────────────────────────
   ID CARD DRAGGABLE — Mouse & Touch
────────────────────────────────────────────────────────── */
function initDraggableCard() {
  const card = document.querySelector('.id-card');
  const heroRight = document.querySelector('.hero-right');
  if (!card || !heroRight) return;

  let isDragging = false;
  let startX = 0, startY = 0;
  let currentX = 0, currentY = 0;
  let velX = 0, velY = 0;
  let rafId = null;
  let lastX = 0, lastY = 0;
  let animating = false;

  // Remove float animation while dragging, re-add on release
  function stopFloat() {
    card.style.animation = 'none';
    card.style.willChange = 'transform';
  }

  function startFloat() {
    card.style.willChange = '';
    card.style.animation = '';
    card.style.transform = '';
    currentX = 0;
    currentY = 0;
    velX = 0;
    velY = 0;
  }

  function applyTransform(x, y, rot) {
    card.style.transform = `translate(${x}px, ${y}px) rotate(${rot}deg)`;
  }

  // Physics-based return animation
  function returnToCenter() {
    animating = true;
    const decay = 0.12;
    const spring = 0.08;

    function tick() {
      velX += (0 - currentX) * spring;
      velY += (0 - currentY) * spring;
      velX *= (1 - decay);
      velY *= (1 - decay);
      currentX += velX;
      currentY += velY;

      const rot = currentX * 0.04;
      applyTransform(currentX, currentY, rot);

      const still = Math.abs(velX) < 0.05 && Math.abs(velY) < 0.05
                 && Math.abs(currentX) < 0.1 && Math.abs(currentY) < 0.1;

      if (still) {
        animating = false;
        startFloat();
      } else {
        rafId = requestAnimationFrame(tick);
      }
    }
    rafId = requestAnimationFrame(tick);
  }

  // Mouse Events
  card.addEventListener('mousedown', (e) => {
    if (e.button !== 0) return;
    cancelAnimationFrame(rafId);
    isDragging = true;
    stopFloat();
    startX = e.clientX - currentX;
    startY = e.clientY - currentY;
    lastX = e.clientX;
    lastY = e.clientY;
    card.style.cursor = 'grabbing';
    e.preventDefault();
  });

  document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    velX = e.clientX - lastX;
    velY = e.clientY - lastY;
    lastX = e.clientX;
    lastY = e.clientY;
    currentX = e.clientX - startX;
    currentY = e.clientY - startY;
    const rot = currentX * 0.04;
    applyTransform(currentX, currentY, rot);
  });

  document.addEventListener('mouseup', () => {
    if (!isDragging) return;
    isDragging = false;
    card.style.cursor = 'grab';
    returnToCenter();
  });

  // Touch Events
  card.addEventListener('touchstart', (e) => {
    cancelAnimationFrame(rafId);
    isDragging = true;
    stopFloat();
    const t = e.touches[0];
    startX = t.clientX - currentX;
    startY = t.clientY - currentY;
    lastX = t.clientX;
    lastY = t.clientY;
    e.preventDefault();
  }, { passive: false });

  card.addEventListener('touchmove', (e) => {
    if (!isDragging) return;
    const t = e.touches[0];
    velX = t.clientX - lastX;
    velY = t.clientY - lastY;
    lastX = t.clientX;
    lastY = t.clientY;
    currentX = t.clientX - startX;
    currentY = t.clientY - startY;
    const rot = currentX * 0.04;
    applyTransform(currentX, currentY, rot);
    e.preventDefault();
  }, { passive: false });

  card.addEventListener('touchend', () => {
    isDragging = false;
    returnToCenter();
  });

  // Set grab cursor hint
  card.style.cursor = 'grab';
}

function initContactToast() {
  const form = document.getElementById("contactForm");
  const sendBtn = document.getElementById("sendBtn");
  const toast = document.getElementById("toast");

  if (!form || !sendBtn || !toast) return;

  sendBtn.addEventListener("click", () => {
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    toast.classList.add("show");
    form.reset();

    setTimeout(() => {
      toast.classList.remove("show");
    }, 3000);
  });
}

/* HERO COUNTER - */

function startHeroCounter() {
  const counters = document.querySelectorAll(".counter");

  counters.forEach(counter => {
    if (counter.dataset.done === "true") return;

    const target = Number(counter.dataset.target);
    let current = 0;
    const duration = 1500;
    const startTime = performance.now();

    function update(now) {
      const progress = Math.min((now - startTime) / duration, 1);
      const value = Math.floor(progress * target);

      counter.textContent = value.toLocaleString();

      if (progress < 1) {
        requestAnimationFrame(update);
      } else {
        counter.textContent = target.toLocaleString();
        counter.dataset.done = "true";
      }
    }

    requestAnimationFrame(update);
  });
}

function initThemeToggle() {
  const themeButtons = [
    document.getElementById("themeToggle"),
    document.getElementById("themeToggleMobile")
  ].filter(Boolean);

  if (themeButtons.length === 0) return;

  const THEME_KEY = "reno-portfolio-theme";

  // Restore saved theme
  const savedTheme = localStorage.getItem(THEME_KEY);
  if (savedTheme === "dark") {
    document.body.classList.add("dark-mode");
  } else {
    document.body.classList.remove("dark-mode");
  }

  function updateIcons() {
    const isDark = document.body.classList.contains("dark-mode");

    themeButtons.forEach(btn => {
      const icon = btn.querySelector("i");
      if (!icon) return;

      // Add spin animation on change
      icon.style.transform = "rotate(360deg)";
      setTimeout(() => {
        icon.className = isDark
          ? "fa-solid fa-sun"
          : "fa-solid fa-moon";
        icon.style.transform = "";
      }, 250);
    });
  }

  function toggleTheme() {
    document.body.classList.toggle("dark-mode");

    const isDark = document.body.classList.contains("dark-mode");
    localStorage.setItem(THEME_KEY, isDark ? "dark" : "light");

    updateIcons();
  }

  themeButtons.forEach(btn => {
    btn.addEventListener("click", toggleTheme);
  });

  // Set initial icons without animation
  const isDark = document.body.classList.contains("dark-mode");
  themeButtons.forEach(btn => {
    const icon = btn.querySelector("i");
    if (!icon) return;
    icon.className = isDark ? "fa-solid fa-sun" : "fa-solid fa-moon";
  });
}

/* ──────────────────────────────────────────────────────────
   INIT
────────────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  initSmoothScroll();
  initNavHighlight();
  initMarquee();
  initDraggableCard();
  initContactToast();
  initThemeToggle();
  runIntro();

  setTimeout(() => {
    startHeroCounter();
  }, 5000);
});