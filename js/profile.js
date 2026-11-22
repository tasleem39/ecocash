/**
 * Ecocash - User Profile & EcoCard Settings Controller
 * Handles personal info editing, linked ATM EcoCard display,
 * recycling milestone badges, and session management.
 */

class UserProfile {
  constructor() {
    this.init();
  }

  init() {
    this.cacheDom();
    this.bindEvents();
    this.render();

    if (window.ecocashStore) {
      window.ecocashStore.subscribe(() => this.render());
    }
  }

  cacheDom() {
    this.profileAvatar = document.getElementById('profile-header-avatar');
    this.profileName = document.getElementById('profile-header-name');
    this.profileEmail = document.getElementById('profile-header-email');
    this.profileTier = document.getElementById('profile-header-tier');
    this.profileForm = document.getElementById('profile-form');
    this.nameInput = document.getElementById('profile-name');
    this.emailInput = document.getElementById('profile-email');
    this.phoneInput = document.getElementById('profile-phone');
    this.avatarSelect = document.getElementById('profile-avatar-select');

    // EcoCard Section on Profile
    this.profCardNumber = document.getElementById('prof-card-number');
    this.profCardChip = document.getElementById('prof-card-chip');
    this.profCardStatus = document.getElementById('prof-card-status');
    this.profCardLimit = document.getElementById('prof-card-limit');
    this.btnProfManageCard = document.getElementById('btn-prof-manage-card');

    // Badges Container
    this.badgesContainer = document.getElementById('profile-badges-grid');

    // Reset Data
    this.btnResetData = document.getElementById('btn-reset-demo-data');
  }

  bindEvents() {
    if (this.profileForm) {
      this.profileForm.addEventListener('submit', (e) => this.handleSave(e));
    }

    if (this.btnProfManageCard) {
      this.btnProfManageCard.addEventListener('click', () => {
        window.location.hash = '#ecocard';
      });
    }

    if (this.btnResetData) {
      this.btnResetData.addEventListener('click', () => {
        if (confirm('Reset mock database to initial expo state? This will restore initial credits and cards.')) {
          window.ecocashStore?.resetToDefaults();
          if (window.showToast) window.showToast('Reset Complete', 'Database restored to fresh expo defaults.', 'info');
        }
      });
    }
  }

  render() {
    if (!window.ecocashStore) return;
    const user = window.ecocashStore.getCurrentUser();
    if (!user) return;

    if (this.profileAvatar) this.profileAvatar.textContent = user.avatar || '👨‍💼';
    if (this.profileName) this.profileName.textContent = user.name;
    if (this.profileEmail) this.profileEmail.textContent = user.email;

    if (this.profileTier) {
      this.profileTier.textContent = user.ecoTier;
      this.profileTier.className = 'badge';
      if (user.ecoTier === 'Eco Champion') this.profileTier.classList.add('badge-champion');
      else if (user.ecoTier === 'Gold Recycler') this.profileTier.classList.add('badge-gold');
      else if (user.ecoTier === 'Silver Recycler') this.profileTier.classList.add('badge-silver');
      else this.profileTier.classList.add('badge-bronze');
    }

    // Form inputs
    if (this.nameInput) this.nameInput.value = user.name;
    if (this.emailInput) this.emailInput.value = user.email;
    if (this.phoneInput) this.phoneInput.value = user.phone;
    if (this.avatarSelect) this.avatarSelect.value = user.avatar || '👨‍💼';

    // Linked EcoCard
    if (user.ecoCard) {
      if (this.profCardNumber) this.profCardNumber.textContent = user.ecoCard.cardNumber;
      if (this.profCardChip) this.profCardChip.textContent = user.ecoCard.chipUid || 'NFC-04:A2:8F';
      if (this.profCardLimit) this.profCardLimit.textContent = `${(user.ecoCard.dailyTapLimit || 1000).toLocaleString()} Credits / day`;
      if (this.profCardStatus) {
        const isFrozen = user.ecoCard.status === 'frozen';
        this.profCardStatus.textContent = isFrozen ? '❄️ Frozen / Locked' : '🟢 Active & Ready';
        this.profCardStatus.className = isFrozen ? 'badge badge-danger' : 'badge badge-success';
      }
    }

    // Render Milestone Badges
    this.renderBadges(user);
  }

  renderBadges(user) {
    if (!this.badgesContainer) return;

    const allBadges = [
      { id: 'first_bottle', icon: '🍾', name: 'First Deposit', desc: 'Deposited first bottle into an RVM' },
      { id: 'nfc_pioneer', icon: '📶', name: 'NFC Card Pioneer', desc: 'Linked physical ATM EcoCard' },
      { id: 'century_club', icon: '💯', name: 'Century Club', desc: 'Recycled over 100 bottles & containers' },
      { id: 'tree_guardian', icon: '🌳', name: 'Tree Guardian', desc: 'Saved 20+ kg of CO2 equivalent' },
      { id: 'campus_leader', icon: '🏆', name: 'Campus Champion', desc: 'Reached top tier ranking in campus' }
    ];

    const unlocked = user.unlockedBadges || ['first_bottle', 'nfc_pioneer'];

    this.badgesContainer.innerHTML = allBadges.map(b => {
      const isUnlocked = unlocked.includes(b.id) || (b.id === 'century_club' && (user.bottlesRecycled || 0) >= 100);
      return `
        <div class="glass-panel" style="padding: 1.25rem; display: flex; align-items: center; gap: 1rem; opacity: ${isUnlocked ? '1' : '0.45'};">
          <div style="font-size: 2.2rem; width: 52px; height: 52px; display: flex; align-items: center; justify-content: center; background: ${isUnlocked ? 'var(--primary-50)' : '#f1f5f9'}; border-radius: 12px;">
            ${b.icon}
          </div>
          <div>
            <div style="font-weight: 700; font-size: 0.95rem; color: #1e293b;">
              ${b.name} ${isUnlocked ? '✅' : '🔒'}
            </div>
            <p style="font-size: 0.8rem; color: #64748b; margin: 0;">${b.desc}</p>
          </div>
        </div>
      `;
    }).join('');
  }

  handleSave(e) {
    e.preventDefault();
    const user = window.ecocashStore?.getCurrentUser();
    if (!user) return;

    const updates = {
      name: this.nameInput.value,
      phone: this.phoneInput.value,
      avatar: this.avatarSelect.value
    };

    const res = window.ecocashStore.updateProfile(user.id, updates);
    if (res.success) {
      if (window.showToast) {
        window.showToast('Profile Updated! 👤', 'Your details have been updated successfully.', 'success');
      }
      if (window.ecoAudio) window.ecoAudio.playSuccess();
    } else {
      if (window.showToast) window.showToast('Update Failed', res.error, 'error');
    }
  }
}

window.UserProfile = UserProfile;
