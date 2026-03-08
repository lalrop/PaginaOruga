/* =====================================================
   ORUGA37 — JavaScript Principal
===================================================== */
document.addEventListener('DOMContentLoaded', function () {

  /* ── NAVBAR: clase al hacer scroll ──────────────── */
  const navbar = document.querySelector('.navbar');
  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 50);
  });

  /* ── MENÚ HAMBURGUESA ───────────────────────────── */
  const hamburger = document.querySelector('.hamburger');
  const mobileNav = document.querySelector('.mobile-nav');

  hamburger.addEventListener('click', () => {
    const isOpen = hamburger.classList.toggle('open');
    mobileNav.classList.toggle('open', isOpen);
    document.body.style.overflow = isOpen ? 'hidden' : '';
  });

  /* ── MENÚ MÓVIL: cerrar + scroll suave ─────────── */
  document.querySelectorAll('.mobile-nav a').forEach(link => {
    link.addEventListener('click', (e) => {
      const href = link.getAttribute('href');
      hamburger.classList.remove('open');
      mobileNav.classList.remove('open');
      document.body.style.overflow = '';

      if (href && href.startsWith('#')) {
        e.preventDefault();
        // Esperar al cierre del menú antes de hacer scroll
        setTimeout(() => {
          const target = document.querySelector(href);
          if (target) {
            const offset = 68;
            const top = target.getBoundingClientRect().top + window.scrollY - offset;
            window.scrollTo({ top, behavior: 'smooth' });
          }
        }, 50);
      }
    });
  });

  /* ── LINK ACTIVO EN NAVBAR ──────────────────────── */
  const sections  = document.querySelectorAll('section[id]');
  const navLinks  = document.querySelectorAll('.navbar-links a[href^="#"]');

  const sectionObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        navLinks.forEach(link => {
          link.classList.toggle('active', link.getAttribute('href') === '#' + entry.target.id);
        });
      }
    });
  }, { rootMargin: '-40% 0px -40% 0px' });

  sections.forEach(s => sectionObserver.observe(s));

  /* ── FAQ ACORDEÓN ───────────────────────────────── */
  document.querySelectorAll('.faq-q').forEach(btn => {
    btn.addEventListener('click', () => {
      const item   = btn.parentElement;
      const answer = item.querySelector('.faq-a');
      const isOpen = btn.classList.contains('active');

      // Cerrar todos
      document.querySelectorAll('.faq-q').forEach(q => {
        q.classList.remove('active');
        q.parentElement.querySelector('.faq-a').style.maxHeight = null;
      });

      // Abrir el actual (si estaba cerrado)
      if (!isOpen) {
        btn.classList.add('active');
        answer.style.maxHeight = answer.scrollHeight + 'px';
      }
    });
  });

  /* ── REVEAL ON SCROLL ───────────────────────────── */
  const revealObs = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.reveal').forEach(el => revealObs.observe(el));

  /* ── CONTADOR ANIMADO ───────────────────────────── */
  const counterObs = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el      = entry.target;
      const target  = parseInt(el.dataset.target, 10);
      const suffix  = el.dataset.suffix || '';
      const prefix  = el.dataset.prefix || '';
      let current   = 0;
      const step    = target / 60;

      const timer = setInterval(() => {
        current += step;
        if (current >= target) {
          el.textContent = prefix + target + suffix;
          clearInterval(timer);
        } else {
          el.textContent = prefix + Math.floor(current) + suffix;
        }
      }, 22);

      counterObs.unobserve(el);
    });
  }, { threshold: 0.6 });

  document.querySelectorAll('[data-target]').forEach(el => counterObs.observe(el));

  /* ── SMOOTH SCROLL (desktop y links directos) ────── */
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    // Los links del menú móvil tienen su propio handler arriba
    if (anchor.closest('.mobile-nav')) return;
    anchor.addEventListener('click', function (e) {
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        e.preventDefault();
        const offset = 68;
        const top    = target.getBoundingClientRect().top + window.scrollY - offset;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    });
  });

  /* ── AÑO DINÁMICO EN FOOTER ─────────────────────── */
  const yearEl = document.getElementById('footer-year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ── LIGHTBOX ───────────────────────────────────── */
  const lightbox  = document.getElementById('lightbox');
  const lbImg     = document.getElementById('lb-img');
  const lbCaption = document.getElementById('lb-caption');
  const lbCounter = document.getElementById('lb-counter');
  const lbClose   = document.getElementById('lb-close');
  const lbPrev    = document.getElementById('lb-prev');
  const lbNext    = document.getElementById('lb-next');

  const projectImages = [...document.querySelectorAll('.project-card img')];
  let lbIndex = 0;

  function openLightbox(index) {
    lbIndex = index;
    const img = projectImages[index];
    lbImg.src = img.src;
    lbImg.alt = img.alt;
    const captionEl = img.closest('.project-card').querySelector('.project-info h4');
    lbCaption.textContent = captionEl ? captionEl.textContent : '';
    lbCounter.textContent = (index + 1) + ' / ' + projectImages.length;
    lightbox.classList.add('open');
    document.body.style.overflow = 'hidden';
    lbClose.focus();
  }

  function closeLightbox() {
    lightbox.classList.remove('open');
    document.body.style.overflow = '';
  }

  function showPrev() {
    lbIndex = (lbIndex - 1 + projectImages.length) % projectImages.length;
    openLightbox(lbIndex);
  }

  function showNext() {
    lbIndex = (lbIndex + 1) % projectImages.length;
    openLightbox(lbIndex);
  }

  projectImages.forEach((img, i) => {
    img.closest('.project-card').addEventListener('click', () => openLightbox(i));
  });

  lbClose.addEventListener('click', closeLightbox);
  lbPrev.addEventListener('click',  (e) => { e.stopPropagation(); showPrev(); });
  lbNext.addEventListener('click',  (e) => { e.stopPropagation(); showNext(); });

  // Clic fuera de la imagen → cerrar
  lightbox.addEventListener('click', e => {
    if (e.target === lightbox) closeLightbox();
  });

  // Teclado: Escape, ← →
  document.addEventListener('keydown', e => {
    if (!lightbox.classList.contains('open')) return;
    if (e.key === 'Escape')     closeLightbox();
    if (e.key === 'ArrowLeft')  showPrev();
    if (e.key === 'ArrowRight') showNext();
  });

});
