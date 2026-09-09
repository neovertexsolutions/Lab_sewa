/**
 * MediFlow SaaS - Interactions & Application Logic
 * Pure Vanilla JavaScript
 */

document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const siteHeader = document.getElementById('siteHeader');
  const mobileMenuToggle = document.getElementById('mobileMenuToggle');
  const mobileDrawer = document.getElementById('mobileDrawer');
  
  // Mobile accordions
  const mobileSolutionsToggle = document.getElementById('mobileSolutionsToggle');
  const mobileSolutionsContent = document.getElementById('mobileSolutionsContent');
  const mobileResourcesToggle = document.getElementById('mobileResourcesToggle');
  const mobileResourcesContent = document.getElementById('mobileResourcesContent');

  // Billing Toggle Elements
  const billingToggle = document.getElementById('billingToggle');
  const monthlyLabel = document.getElementById('monthlyLabel');
  const annualLabel = document.getElementById('annualLabel');
  const priceAmounts = document.querySelectorAll('.price-amount');
  const starterAnnualNote = document.getElementById('starterAnnualNote');
  const proAnnualNote = document.getElementById('proAnnualNote');

  // Modals
  const demoModal = document.getElementById('demoModal');
  const loginModal = document.getElementById('loginModal');
  const closeDemoModal = document.getElementById('closeDemoModal');
  const closeLoginModal = document.getElementById('closeLoginModal');
  const demoForm = document.getElementById('demoForm');
  const loginForm = document.getElementById('loginForm');
  const toastContainer = document.getElementById('toastContainer');

  // Trigger buttons
  const bookDemoNavBtn = document.getElementById('bookDemoNavBtn');
  const mobileBookDemoBtn = document.getElementById('mobileBookDemoBtn');
  const bottomBookDemoBtn = document.getElementById('bottomBookDemoBtn');
  const loginBtn = document.getElementById('loginBtn');
  const mobileLoginBtn = document.getElementById('mobileLoginBtn');
  const bottomGetStartedBtn = document.getElementById('bottomGetStartedBtn');
  const modalSignUpLink = document.getElementById('modalSignUpLink');
  const planCtaButtons = document.querySelectorAll('.plan-cta');

  // State
  let isAnnual = false;

  /* ================= 1. SCROLL LISTENER ================= */
  window.addEventListener('scroll', () => {
    if (window.scrollY > 20) {
      siteHeader.classList.add('scrolled');
    } else {
      siteHeader.classList.remove('scrolled');
    }
  });

  /* ================= 2. MOBILE MENU & ACCORDIONS ================= */
  function toggleMobileMenu() {
    const isOpen = mobileDrawer.classList.toggle('open');
    mobileMenuToggle.classList.toggle('active', isOpen);
    mobileMenuToggle.setAttribute('aria-expanded', isOpen);
  }

  function closeMobileMenu() {
    mobileDrawer.classList.remove('open');
    mobileMenuToggle.classList.remove('active');
    mobileMenuToggle.setAttribute('aria-expanded', 'false');
  }

  if (mobileMenuToggle) {
    mobileMenuToggle.addEventListener('click', toggleMobileMenu);
  }

  // Close mobile drawer when clicking links
  document.querySelectorAll('.mobile-link, .mobile-sublink').forEach(link => {
    link.addEventListener('click', () => {
      closeMobileMenu();
    });
  });

  // Mobile Accordion: Solutions
  if (mobileSolutionsToggle && mobileSolutionsContent) {
    mobileSolutionsToggle.addEventListener('click', () => {
      const isExpanded = mobileSolutionsContent.classList.toggle('open');
      const icon = mobileSolutionsToggle.querySelector('.chevron-icon');
      if (icon) {
        icon.style.transform = isExpanded ? 'rotate(180deg)' : 'rotate(0deg)';
      }
    });
  }

  // Mobile Accordion: Resources
  if (mobileResourcesToggle && mobileResourcesContent) {
    mobileResourcesToggle.addEventListener('click', () => {
      const isExpanded = mobileResourcesContent.classList.toggle('open');
      const icon = mobileResourcesToggle.querySelector('.chevron-icon');
      if (icon) {
        icon.style.transform = isExpanded ? 'rotate(180deg)' : 'rotate(0deg)';
      }
    });
  }

  /* ================= 3. BILLING TOGGLE (MONTHLY / ANNUALLY) ================= */
  function updatePricing() {
    billingToggle.classList.toggle('active', isAnnual);
    monthlyLabel.classList.toggle('active', !isAnnual);
    annualLabel.classList.toggle('active', isAnnual);

    priceAmounts.forEach(el => {
      const targetVal = isAnnual ? el.getAttribute('data-annual') : el.getAttribute('data-monthly');
      if (targetVal) {
        el.style.opacity = '0.3';
        el.style.transform = 'translateY(-4px)';
        setTimeout(() => {
          el.textContent = targetVal;
          el.style.opacity = '1';
          el.style.transform = 'translateY(0)';
        }, 120);
      }
    });

    if (starterAnnualNote) {
      starterAnnualNote.classList.toggle('hidden', !isAnnual);
    }
    if (proAnnualNote) {
      proAnnualNote.classList.toggle('hidden', !isAnnual);
    }
  }

  if (billingToggle) {
    billingToggle.addEventListener('click', () => {
      isAnnual = !isAnnual;
      updatePricing();
    });
  }

  if (monthlyLabel) {
    monthlyLabel.addEventListener('click', () => {
      if (isAnnual) {
        isAnnual = false;
        updatePricing();
      }
    });
  }

  if (annualLabel) {
    annualLabel.addEventListener('click', () => {
      if (!isAnnual) {
        isAnnual = true;
        updatePricing();
      }
    });
  }

  /* ================= 4. MODALS & POPUPS ================= */
  function openModal(modal) {
    if (!modal) return;
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden'; // prevent scroll
  }

  function closeModal(modal) {
    if (!modal) return;
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  function closeAllModals() {
    closeModal(demoModal);
    closeModal(loginModal);
  }

  const futureGetStartedBtn = document.getElementById('futureGetStartedBtn');
  const futureBookDemoBtn = document.getElementById('futureBookDemoBtn');

  const aboutHeroDemoBtn = document.getElementById('aboutHeroDemoBtn');

  // Demo Modal Triggers
  [bookDemoNavBtn, mobileBookDemoBtn, bottomBookDemoBtn, futureBookDemoBtn, aboutHeroDemoBtn].forEach(btn => {
    if (btn) {
      btn.addEventListener('click', () => {
        closeMobileMenu();
        openModal(demoModal);
      });
    }
  });

  // Login Modal Triggers
  [loginBtn, mobileLoginBtn].forEach(btn => {
    if (btn) {
      btn.addEventListener('click', () => {
        closeMobileMenu();
        openModal(loginModal);
      });
    }
  });

  // "Get Started Free" scroll or action
  [bottomGetStartedBtn, futureGetStartedBtn].forEach(btn => {
    if (btn) {
      btn.addEventListener('click', () => {
        const pricingSec = document.getElementById('pricing');
        if (pricingSec) {
          pricingSec.scrollIntoView({ behavior: 'smooth' });
        } else {
          window.location.href = 'index.html#pricing';
        }
      });
    }
  });

  if (modalSignUpLink) {
    modalSignUpLink.addEventListener('click', (e) => {
      e.preventDefault();
      closeModal(loginModal);
      window.location.href = 'register.html';
    });
  }

  // Plan CTA Buttons
  planCtaButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const plan = btn.getAttribute('data-plan');
      if (plan === 'Enterprise') {
        const notesField = document.getElementById('demoNotes');
        if (notesField) {
          notesField.value = `Inquiring about Enterprise Tier for multi-branch/hospital integration.`;
        }
        openModal(demoModal);
      } else {
        showToast(`Selected ${plan} Plan. Redirecting to registration...`, 'success');
        setTimeout(() => {
          window.location.href = `register.html?plan=${encodeURIComponent(plan)}`;
        }, 800);
      }
    });
  });

  // Modal Close Buttons
  if (closeDemoModal) closeDemoModal.addEventListener('click', () => closeModal(demoModal));
  if (closeLoginModal) closeLoginModal.addEventListener('click', () => closeModal(loginModal));

  // Backdrop click to close
  [demoModal, loginModal].forEach(modal => {
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          closeModal(modal);
        }
      });
    }
  });

  // ESC key to close
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeAllModals();
    }
  });

  /* ================= 5. FORM SUBMISSIONS & TOASTS ================= */
  function showToast(message, type = 'normal') {
    if (!toastContainer) return;
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
      <span>${type === 'success' ? '✓' : 'ℹ'}</span>
      <span>${message}</span>
    `;
    toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }

  // Demo Form Submit
  if (demoForm) {
    demoForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('demoName').value;
      closeModal(demoModal);
      demoForm.reset();
      showToast(`Thank you, ${name}! Your demo request has been received. Our team will contact you within 2 business hours.`, 'success');
    });
  }

  // Login Form Submit
  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = document.getElementById('loginEmail').value;
      closeModal(loginModal);
      loginForm.reset();
      showToast(`Logged in successfully as ${email}`, 'success');
    });
  }

  // Contact Us Form Submit
  const contactUsForm = document.getElementById('contactUsForm');
  if (contactUsForm) {
    contactUsForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('contactFullName').value;
      contactUsForm.reset();
      showToast(`Thank you, ${name}! Your message has been sent successfully. Our healthcare team will get back to you shortly.`, 'success');
    });
  }
});
