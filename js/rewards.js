/**
 * Ecocash - Rewards & Redeemable Options Controller
 * Handles browsing rewards catalog, category filtering, affordability calculations,
 * instant credit redemption, voucher ticket generation, and digital coupon modals.
 */

class RewardsController {
  constructor() {
    this.currentCategory = 'all';
    this.searchQuery = '';
    this.pendingRewardId = null;
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
    this.catalogGrid = document.getElementById('rewards-catalog-grid');
    this.categoryPills = document.querySelectorAll('.reward-category-pill');
    this.searchInput = document.getElementById('rewards-search-input');
    this.userBalanceDisplay = document.getElementById('rewards-user-balance');

    // Confirm Redeem Modal
    this.confirmModal = document.getElementById('modal-confirm-redeem');
    this.confirmTitle = document.getElementById('redeem-item-title');
    this.confirmPartner = document.getElementById('redeem-item-partner');
    this.confirmCost = document.getElementById('redeem-item-cost');
    this.confirmUserBalance = document.getElementById('redeem-user-avail');
    this.confirmBalanceRemaining = document.getElementById('redeem-balance-remaining');
    this.btnExecuteRedeem = document.getElementById('btn-execute-redeem');

    // Voucher Success Modal
    this.voucherModal = document.getElementById('modal-voucher-ticket');
    this.voucherCodeEl = document.getElementById('voucher-code-display');
    this.voucherTitleEl = document.getElementById('voucher-reward-title');
    this.voucherPartnerEl = document.getElementById('voucher-partner-name');
    this.voucherCostEl = document.getElementById('voucher-credits-spent');
    this.voucherDateEl = document.getElementById('voucher-created-date');
    this.btnCopyVoucher = document.getElementById('btn-copy-voucher');
  }

  bindEvents() {
    // Category Filtering
    this.categoryPills.forEach(pill => {
      pill.addEventListener('click', () => {
        this.categoryPills.forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        this.currentCategory = pill.dataset.category;
        this.renderCatalog();
        if (window.ecoAudio) window.ecoAudio.playBeep(560, 'sine', 0.04);
      });
    });

    // Search input
    if (this.searchInput) {
      this.searchInput.addEventListener('input', (e) => {
        this.searchQuery = e.target.value.toLowerCase().trim();
        this.renderCatalog();
      });
    }

    // Delegated click on Catalog Grid (Redeem Button)
    if (this.catalogGrid) {
      this.catalogGrid.addEventListener('click', (e) => {
        const btn = e.target.closest('.btn-redeem-item');
        if (btn) {
          const rewardId = btn.dataset.rewardId;
          this.openConfirmModal(rewardId);
        }
      });
    }

    // Execute Redeem Confirmation
    if (this.btnExecuteRedeem) {
      this.btnExecuteRedeem.addEventListener('click', () => {
        this.executeRedeem();
      });
    }

    // Copy Voucher Code
    if (this.btnCopyVoucher) {
      this.btnCopyVoucher.addEventListener('click', () => {
        const code = this.voucherCodeEl?.textContent;
        if (!code) return;
        navigator.clipboard.writeText(code).then(() => {
          if (window.showToast) window.showToast('Voucher Copied! 🎟️', `Code ${code} copied to clipboard.`, 'success');
        });
      });
    }
  }

  openConfirmModal(rewardId) {
    const user = window.ecocashStore?.getCurrentUser();
    if (!user) {
      if (window.showToast) window.showToast('Login Required', 'Please log in to redeem rewards.', 'error');
      return;
    }

    const rewards = window.ecocashStore.getRewards();
    const reward = rewards.find(r => r.id === rewardId);
    if (!reward) return;

    if (user.creditsBalance < reward.costCredits) {
      if (window.showToast) {
        window.showToast('Insufficient Credits', `You need ${(reward.costCredits - user.creditsBalance).toLocaleString()} more Credits for this reward. Keep recycling!`, 'info');
      }
      return;
    }

    this.pendingRewardId = rewardId;

    if (this.confirmTitle) this.confirmTitle.textContent = `${reward.icon} ${reward.title}`;
    if (this.confirmPartner) this.confirmPartner.textContent = reward.partner;
    if (this.confirmCost) this.confirmCost.textContent = `${reward.costCredits.toLocaleString()} Credits`;
    if (this.confirmUserBalance) this.confirmUserBalance.textContent = `${user.creditsBalance.toLocaleString()} Credits`;
    if (this.confirmBalanceRemaining) {
      const rem = user.creditsBalance - reward.costCredits;
      this.confirmBalanceRemaining.textContent = `${rem.toLocaleString()} Credits`;
    }

    if (this.confirmModal) {
      this.confirmModal.classList.add('active');
    }
  }

  executeRedeem() {
    if (!this.pendingRewardId) return;
    const user = window.ecocashStore?.getCurrentUser();
    if (!user) return;

    const res = window.ecocashStore.redeemReward({
      userId: user.id,
      rewardId: this.pendingRewardId
    });

    // Close confirm modal
    if (this.confirmModal) this.confirmModal.classList.remove('active');

    if (res.success) {
      if (window.ecoAudio) window.ecoAudio.playSuccess();
      if (window.showToast) {
        window.showToast('Reward Redeemed! 🎉', `You redeemed ${res.reward.title}!`, 'reward');
      }

      // Show Voucher Ticket Modal
      this.showVoucherTicket(res);
      this.pendingRewardId = null;
    } else {
      if (window.showToast) window.showToast('Redemption Failed', res.error, 'error');
    }
  }

  showVoucherTicket(res) {
    if (!this.voucherModal) return;

    if (this.voucherCodeEl) this.voucherCodeEl.textContent = res.voucherCode;
    if (this.voucherTitleEl) this.voucherTitleEl.textContent = `${res.reward.icon} ${res.reward.title}`;
    if (this.voucherPartnerEl) this.voucherPartnerEl.textContent = `Partner: ${res.reward.partner}`;
    if (this.voucherCostEl) this.voucherCostEl.textContent = `${res.reward.costCredits.toLocaleString()} Credits`;
    if (this.voucherDateEl) this.voucherDateEl.textContent = res.transaction.date;

    this.voucherModal.classList.add('active');
  }

  render() {
    if (!window.ecocashStore) return;
    const user = window.ecocashStore.getCurrentUser();

    if (this.userBalanceDisplay) {
      this.userBalanceDisplay.textContent = user ? `${user.creditsBalance.toLocaleString()} Credits` : '0 Credits';
    }

    this.renderCatalog();
  }

  renderCatalog() {
    if (!this.catalogGrid || !window.ecocashStore) return;
    const user = window.ecocashStore.getCurrentUser();
    const userCredits = user ? user.creditsBalance : 0;
    const allRewards = window.ecocashStore.getRewards();

    let filtered = allRewards;

    // Filter by Category
    if (this.currentCategory !== 'all') {
      filtered = filtered.filter(r => r.category === this.currentCategory);
    }

    // Filter by Search
    if (this.searchQuery) {
      filtered = filtered.filter(r => 
        r.title.toLowerCase().includes(this.searchQuery) ||
        r.partner.toLowerCase().includes(this.searchQuery) ||
        r.description.toLowerCase().includes(this.searchQuery)
      );
    }

    if (filtered.length === 0) {
      this.catalogGrid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 3rem 1rem; color: #64748b;">
          <div style="font-size: 3rem; margin-bottom: 0.75rem;">🔍</div>
          <h4>No rewards found matching your criteria</h4>
          <p>Try searching with another keyword or pick a different category.</p>
        </div>
      `;
      return;
    }

    this.catalogGrid.innerHTML = filtered.map(item => {
      const canAfford = userCredits >= item.costCredits;
      const progressPct = Math.min(100, Math.round((userCredits / item.costCredits) * 100));

      return `
        <div class="reward-card ${canAfford ? 'affordable' : 'locked'}">
          <div class="reward-header">
            <span class="reward-badge-category">${item.badge || item.category.toUpperCase()}</span>
            <div class="reward-cost-tag">
              <span class="reward-coin-icon">🪙</span>
              <strong>${item.costCredits.toLocaleString()}</strong>
              <small>Credits</small>
            </div>
          </div>

          <div class="reward-icon-display">${item.icon}</div>

          <h3 class="reward-title">${item.title}</h3>
          <div class="reward-partner-tag">🏢 ${item.partner}</div>
          <p class="reward-desc">${item.description}</p>

          <div class="reward-afford-meter">
            <div class="afford-meter-track">
              <div class="afford-meter-fill" style="width: ${progressPct}%;"></div>
            </div>
            <div class="afford-meter-text">
              <span>${canAfford ? '✅ Ready to claim' : `${(item.costCredits - userCredits).toLocaleString()} credits needed`}</span>
              <span>${progressPct}%</span>
            </div>
          </div>

          <div class="reward-card-actions">
            <button class="btn ${canAfford ? 'btn-primary' : 'btn-outline'} btn-full btn-redeem-item" 
              data-reward-id="${item.id}" 
              ${!canAfford ? 'title="Need more credits"' : ''}>
              ${canAfford ? '<span>⚡ Redeem Reward</span>' : `<span>🔒 Need ${item.costCredits.toLocaleString()} Credits</span>`}
            </button>
          </div>
        </div>
      `;
    }).join('');
  }
}

window.RewardsController = RewardsController;
