/**
 * Ecocash - Application Router & Main Coordinator (Credits & EcoCard Edition)
 * Manages SPA navigation, authentication modals, quick login, toast notifications,
 * credits calculator logic, and controller lifecycle.
 */

// Toast notification helper
window.showToast = function(title, message, type = 'success') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  const icon = type === 'reward' ? '🪙' : type === 'error' ? '❌' : type === 'info' ? 'ℹ️' : '🌿';

  toast.innerHTML = `
    <div class="toast-icon">${icon}</div>
    <div class="toast-content">
      <div class="toast-title">${title}</div>
      <div class="toast-message">${message}</div>
    </div>
  `;

  container.appendChild(toast);

  requestAnimationFrame(() => {
    toast.classList.add('show');
  });

  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 350);
  }, 4000);
};

class EcocashApp {
  constructor() {
    this.currentPage = 'home';
    this.init();
  }

  init() {
    this.cacheDom();
    this.bindNavigation();
    this.bindAuthModals();
    this.bindHomeCalculator();
    this.bindGlobalModals();
    this.syncHeaderUser();
    this.updateGlobalImpactCounters();

    // Listen to hash changes
    window.addEventListener('hashchange', () => this.handleHashChange());
    this.handleHashChange();

    // Subscribe to store updates
    if (window.ecocashStore) {
      window.ecocashStore.subscribe(() => {
        this.syncHeaderUser();
        this.updateGlobalImpactCounters();
      });
    }

    // Initialize sub-controllers
    if (window.RvmSimulator) new window.RvmSimulator();
    if (window.UserDashboard) new window.UserDashboard();
    if (window.EcoCardController) new window.EcoCardController();
    if (window.RewardsController) new window.RewardsController();
    if (window.TransactionHistory) new window.TransactionHistory();
    if (window.Leaderboard) new window.Leaderboard();
    if (window.UserProfile) new window.UserProfile();
  }

  cacheDom() {
    this.navLinks = document.querySelectorAll('.nav-link');
    this.pageViews = document.querySelectorAll('.page-view');
    this.mobileToggle = document.getElementById('mobile-nav-toggle');
    this.navLinksContainer = document.getElementById('nav-links');

    // Header User Controls
    this.headerUserBtn = document.getElementById('header-user-btn');
    this.headerUserName = document.getElementById('header-user-name');
    this.headerUserBalance = document.getElementById('header-user-balance');
    this.headerUserAvatar = document.getElementById('header-user-avatar');
    this.headerAuthBtns = document.getElementById('header-auth-btns');
    this.headerUserBadge = document.getElementById('header-user-badge');

    // Modals
    this.loginModal = document.getElementById('modal-login');
    this.signupModal = document.getElementById('modal-signup');
    this.userSwitchModal = document.getElementById('modal-user-switch');

    // Impact Counters
    this.counterPlastic = document.getElementById('impact-stat-plastic');
    this.counterCredits = document.getElementById('impact-stat-credits');
    this.counterBottles = document.getElementById('impact-stat-bottles');
    this.counterTrees = document.getElementById('impact-stat-trees');
  }

  bindNavigation() {
    // Delegated click on all links with data-route or hash
    document.addEventListener('click', (e) => {
      const link = e.target.closest('[data-route]');
      if (link) {
        e.preventDefault();
        const route = link.dataset.route;
        window.location.hash = `#${route}`;
      }
    });

    // Mobile nav hamburger
    if (this.mobileToggle && this.navLinksContainer) {
      this.mobileToggle.addEventListener('click', () => {
        this.navLinksContainer.classList.toggle('open');
      });

      // Close menu on link click
      this.navLinks.forEach(l => {
        l.addEventListener('click', () => {
          this.navLinksContainer.classList.remove('open');
        });
      });
    }
  }

  handleHashChange() {
    const rawHash = window.location.hash.replace(/^#/, '') || 'home';
    const validRoutes = ['home', 'dashboard', 'ecocard', 'simulator', 'transactions', 'rewards', 'leaderboard', 'profile', 'about'];
    
    // Map 'history' alias to 'transactions'
    const route = rawHash === 'history' ? 'transactions' : (validRoutes.includes(rawHash) ? rawHash : 'home');

    this.navigateTo(route);
  }

  navigateTo(pageId) {
    this.currentPage = pageId;

    // Update active class on views
    this.pageViews.forEach(view => {
      view.classList.remove('active');
    });

    const targetPage = document.getElementById(`page-${pageId}`);
    if (targetPage) {
      targetPage.classList.add('active');
    }

    // Update active nav link
    this.navLinks.forEach(link => {
      const route = link.dataset.route;
      if (route === pageId || (pageId === 'transactions' && route === 'history')) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });

    // Scroll top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  syncHeaderUser() {
    if (!window.ecocashStore) return;
    const user = window.ecocashStore.getCurrentUser();

    if (user) {
      if (this.headerUserName) this.headerUserName.textContent = user.name.split(' ')[0];
      if (this.headerUserBalance) {
        this.headerUserBalance.textContent = `🪙 ${user.creditsBalance.toLocaleString()} Credits`;
      }
      if (this.headerUserAvatar) this.headerUserAvatar.textContent = user.avatar || '👨‍💼';
      if (this.headerUserBadge) this.headerUserBadge.style.display = 'flex';
      if (this.headerAuthBtns) this.headerAuthBtns.style.display = 'none';
    } else {
      if (this.headerUserBadge) this.headerUserBadge.style.display = 'none';
      if (this.headerAuthBtns) this.headerAuthBtns.style.display = 'flex';
    }
  }

  updateGlobalImpactCounters() {
    if (!window.ecocashStore) return;
    const impact = window.ecocashStore.getGlobalImpact();

    if (this.counterPlastic) {
      this.counterPlastic.textContent = `${impact.totalPlasticKg.toLocaleString()} kg`;
    }
    if (this.counterCredits) {
      this.counterCredits.textContent = `🪙 ${impact.totalCreditsPaid.toLocaleString()} Credits`;
    }
    if (this.counterBottles) {
      this.counterBottles.textContent = `${impact.totalBottlesSaved.toLocaleString()} items`;
    }
    if (this.counterTrees) {
      this.counterTrees.textContent = `${impact.treesEquivalent} Trees`;
    }
  }

  bindHomeCalculator() {
    const petSlider = document.getElementById('calc-pet-slider');
    const bagSlider = document.getElementById('calc-bag-slider');
    const otherSlider = document.getElementById('calc-other-slider');
    const canSlider = document.getElementById('calc-can-slider');

    const petVal = document.getElementById('calc-pet-val');
    const bagVal = document.getElementById('calc-bag-val');
    const otherVal = document.getElementById('calc-other-val');
    const canVal = document.getElementById('calc-can-val');

    const totalCreditsEl = document.getElementById('calc-total-earned');
    const totalKgEl = document.getElementById('calc-impact-kg');
    const totalCo2El = document.getElementById('calc-impact-co2');

    if (!petSlider) return;

    const calculate = () => {
      const petKg = parseFloat(petSlider.value) || 0;
      const bagKg = parseFloat(bagSlider.value) || 0;
      const otherKg = parseFloat(otherSlider.value) || 0;
      const canKg = canSlider ? (parseFloat(canSlider.value) || 0) : 0;

      if (petVal) petVal.textContent = `${petKg.toFixed(1)} kg (${Math.round(petKg * 45)} bottles)`;
      if (bagVal) bagVal.textContent = `${bagKg.toFixed(1)} kg (${Math.round(bagKg * 60)} bags)`;
      if (otherVal) otherVal.textContent = `${otherKg.toFixed(1)} kg`;
      if (canVal) canVal.textContent = `${canKg.toFixed(1)} kg (${Math.round(canKg * 65)} cans)`;

      // Rate calculations (100 cr/kg PET, 50 cr/kg Bags, 75 cr/kg Other, 120 cr/kg Cans)
      const earnedCredits = Math.round(petKg * 100 + bagKg * 50 + otherKg * 75 + canKg * 120);
      const totalKg = petKg + bagKg + otherKg + canKg;
      const totalCo2 = (petKg * 1.5 + bagKg * 0.9 + otherKg * 1.2 + canKg * 2.1).toFixed(1);

      if (totalCreditsEl) totalCreditsEl.textContent = `🪙 ${earnedCredits.toLocaleString()} Credits`;
      if (totalKgEl) totalKgEl.textContent = `${totalKg.toFixed(1)} kg Plastic`;
      if (totalCo2El) totalCo2El.textContent = `${totalCo2} kg CO₂ Saved`;
    };

    [petSlider, bagSlider, otherSlider, canSlider].forEach(slider => {
      if (slider) slider.addEventListener('input', calculate);
    });

    calculate();
  }

  bindAuthModals() {
    const btnOpenLogin = document.getElementById('btn-open-login');
    const btnOpenSignup = document.getElementById('btn-open-signup');
    const heroBtnLogin = document.getElementById('hero-btn-login');
    const linkToSignup = document.getElementById('link-to-signup');
    const linkToLogin = document.getElementById('link-to-login');

    const openModal = (modal) => {
      if (modal) modal.classList.add('active');
    };

    const closeModal = (modal) => {
      if (modal) modal.classList.remove('active');
    };

    if (btnOpenLogin) btnOpenLogin.addEventListener('click', () => openModal(this.loginModal));
    if (btnOpenSignup) btnOpenSignup.addEventListener('click', () => openModal(this.signupModal));
    if (heroBtnLogin) heroBtnLogin.addEventListener('click', () => openModal(this.userSwitchModal));

    if (linkToSignup) {
      linkToSignup.addEventListener('click', (e) => {
        e.preventDefault();
        closeModal(this.loginModal);
        openModal(this.signupModal);
      });
    }

    if (linkToLogin) {
      linkToLogin.addEventListener('click', (e) => {
        e.preventDefault();
        closeModal(this.signupModal);
        openModal(this.loginModal);
      });
    }

    // User Badge click -> Open User Switch Modal
    if (this.headerUserBadge) {
      this.headerUserBadge.addEventListener('click', () => {
        this.renderUserSwitchList();
        openModal(this.userSwitchModal);
      });
    }

    // Quick Login Demo Buttons (inside Login Modal)
    document.querySelectorAll('.btn-quick-login').forEach(btn => {
      btn.addEventListener('click', () => {
        const userId = btn.dataset.user;
        window.ecocashStore?.setCurrentUser(userId);
        closeModal(this.loginModal);
        if (window.showToast) window.showToast('Profile Switched', `Logged in as demo user.`, 'success');
      });
    });

    // Login Form
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
      loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const ident = document.getElementById('login-identifier').value;
        const pass = document.getElementById('login-password').value;

        const res = window.ecocashStore?.login(ident, pass);
        if (res && res.success) {
          closeModal(this.loginModal);
          if (window.showToast) window.showToast('Welcome Back! 👋', `Logged in as ${res.user.name}.`, 'success');
        } else {
          if (window.showToast) window.showToast('Login Failed', res.error, 'error');
        }
      });
    }

    // Signup Form
    const signupForm = document.getElementById('signup-form');
    if (signupForm) {
      signupForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('signup-name').value;
        const email = document.getElementById('signup-email').value;
        const phone = document.getElementById('signup-phone').value;
        const password = document.getElementById('signup-password').value;

        const res = window.ecocashStore?.signUp({ name, email, phone, password });
        if (res && res.success) {
          closeModal(this.signupModal);
          if (window.showToast) {
            window.showToast('Account Created! 💳', `Welcome to EcoCash! A smart EcoCard has been generated for you with 100 bonus credits!`, 'reward');
          }
          window.location.hash = '#ecocard';
        } else {
          if (window.showToast) window.showToast('Sign Up Failed', res.error, 'error');
        }
      });
    }

    // Sign Out Button
    const btnSignOut = document.getElementById('btn-sign-out');
    if (btnSignOut) {
      btnSignOut.addEventListener('click', () => {
        window.ecocashStore?.logout();
        closeModal(this.userSwitchModal);
        if (window.showToast) window.showToast('Signed Out', 'You have been logged out.', 'info');
        window.location.hash = '#home';
      });
    }
  }

  renderUserSwitchList() {
    const container = document.getElementById('user-switch-list');
    if (!container || !window.ecocashStore) return;

    const users = window.ecocashStore.getAllUsers();
    const currentUser = window.ecocashStore.getCurrentUser();

    container.innerHTML = users.map(u => {
      const isCurrent = currentUser && currentUser.id === u.id;
      return `
        <div class="user-switch-card ${isCurrent ? 'active-profile' : ''}" data-userid="${u.id}" style="display: flex; align-items: center; justify-content: space-between; padding: 0.85rem 1rem; border: 1px solid ${isCurrent ? 'var(--primary)' : '#e2e8f0'}; border-radius: 10px; margin-bottom: 0.5rem; cursor: pointer; background: ${isCurrent ? 'var(--primary-50)' : '#fff'}; transition: all 0.2s;">
          <div style="display: flex; align-items: center; gap: 0.75rem;">
            <div style="font-size: 1.75rem;">${u.avatar}</div>
            <div>
              <div style="font-weight: 700; font-size: 0.95rem; color: #1e293b;">
                ${u.name} ${isCurrent ? '<span class="badge badge-success" style="font-size: 0.65rem;">Active</span>' : ''}
              </div>
              <small style="color: #64748b;">EcoCard: ${u.ecoCard?.cardNumber || 'None'} • ${u.ecoTier}</small>
            </div>
          </div>
          <div style="text-align: right;">
            <strong style="color: #059669; font-size: 0.95rem;">🪙 ${u.creditsBalance.toLocaleString()}</strong>
            <div style="font-size: 0.75rem; color: #64748b;">${u.totalRecycledKg.toFixed(1)} kg</div>
          </div>
        </div>
      `;
    }).join('');

    // Attach click events
    container.querySelectorAll('.user-switch-card').forEach(card => {
      card.addEventListener('click', () => {
        const uid = card.dataset.userid;
        window.ecocashStore?.setCurrentUser(uid);
        if (this.userSwitchModal) this.userSwitchModal.classList.remove('active');
        if (window.showToast) window.showToast('Profile Switched', `Active user changed.`, 'success');
      });
    });
  }

  bindGlobalModals() {
    // Close modal on [X] or [Done] button
    document.querySelectorAll('.modal-close, .btn-modal-close').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const overlay = e.target.closest('.modal-overlay');
        if (overlay) overlay.classList.remove('active');
      });
    });

    // Close modal on clicking outside dialog
    document.querySelectorAll('.modal-overlay').forEach(modal => {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          modal.classList.remove('active');
        }
      });
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        document.querySelectorAll('.modal-overlay.active').forEach(m => m.classList.remove('active'));
      }
    });
  }
}

// Instantiate on DOM load
document.addEventListener('DOMContentLoaded', () => {
  window.ecocashApp = new EcocashApp();
});
