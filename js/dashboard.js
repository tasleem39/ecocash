/**
 * Ecocash - Dashboard Controller (100% Credits & EcoCard System)
 * Updates user credit balances, tier progress, mini ATM card widget,
 * recent deposit records, and quick actions.
 */

class UserDashboard {
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
    this.welcomeName = document.getElementById('dash-welcome-name');
    this.creditsBalance = document.getElementById('dash-credits-balance');
    this.lifetimeCredits = document.getElementById('dash-lifetime-credits');
    this.totalRecycled = document.getElementById('dash-total-recycled');
    this.bottlesSaved = document.getElementById('dash-bottles-saved');
    this.co2Offset = document.getElementById('dash-co2-offset');
    this.ecoTierBadge = document.getElementById('dash-eco-tier');
    this.tierProgressBar = document.getElementById('dash-tier-progress-bar');
    this.tierProgressText = document.getElementById('dash-tier-progress-text');
    this.recentTxnList = document.getElementById('dash-recent-txns');

    // Mini EcoCard Widget
    this.miniCardNumber = document.getElementById('dash-card-number');
    this.miniCardHolder = document.getElementById('dash-card-holder');
    this.miniCardStatus = document.getElementById('dash-card-status');
    this.btnDashTapRvm = document.getElementById('btn-dash-tap-rvm');
    this.btnDashManageCard = document.getElementById('btn-dash-manage-card');
    this.btnDashRedeem = document.getElementById('btn-dash-redeem');
  }

  bindEvents() {
    if (this.btnDashTapRvm) {
      this.btnDashTapRvm.addEventListener('click', () => {
        window.location.hash = '#simulator';
      });
    }

    if (this.btnDashManageCard) {
      this.btnDashManageCard.addEventListener('click', () => {
        window.location.hash = '#ecocard';
      });
    }

    if (this.btnDashRedeem) {
      this.btnDashRedeem.addEventListener('click', () => {
        window.location.hash = '#rewards';
      });
    }
  }

  render() {
    if (!window.ecocashStore) return;
    const user = window.ecocashStore.getCurrentUser();

    if (!user) {
      if (this.welcomeName) this.welcomeName.textContent = 'Guest User';
      return;
    }

    // Header & Balance
    if (this.welcomeName) this.welcomeName.textContent = user.name;
    if (this.creditsBalance) {
      this.creditsBalance.textContent = `${user.creditsBalance.toLocaleString()}`;
    }
    if (this.lifetimeCredits) {
      this.lifetimeCredits.textContent = `${user.lifetimeCreditsEarned.toLocaleString()} Credits`;
    }
    if (this.totalRecycled) {
      this.totalRecycled.textContent = `${user.totalRecycledKg.toFixed(1)} kg`;
    }
    if (this.bottlesSaved) {
      this.bottlesSaved.textContent = `~${(user.bottlesRecycled || Math.round(user.totalRecycledKg * 40))} items`;
    }

    // Eco Tier Badge
    if (this.ecoTierBadge) {
      this.ecoTierBadge.textContent = user.ecoTier;
      this.ecoTierBadge.className = 'badge';
      if (user.ecoTier === 'Eco Champion') this.ecoTierBadge.classList.add('badge-champion');
      else if (user.ecoTier === 'Gold Recycler') this.ecoTierBadge.classList.add('badge-gold');
      else if (user.ecoTier === 'Silver Recycler') this.ecoTierBadge.classList.add('badge-silver');
      else this.ecoTierBadge.classList.add('badge-bronze');
    }

    // Tier Progress Calculations
    this.renderTierProgress(user);

    // CO2 Offset
    const userTxns = window.ecocashStore.getUserTransactions(user.id);
    let co2Total = 0;
    userTxns.forEach(t => { if (t.co2SavedKg) co2Total += t.co2SavedKg; });
    if (this.co2Offset) {
      this.co2Offset.textContent = `${co2Total.toFixed(1)} kg CO₂`;
    }

    // Mini EcoCard Widget
    if (user.ecoCard) {
      if (this.miniCardNumber) {
        const raw = user.ecoCard.cardNumber;
        const parts = raw.split('-');
        this.miniCardNumber.textContent = parts.length === 4 ? `${parts[0]} •••• •••• ${parts[3]}` : raw;
      }
      if (this.miniCardHolder) {
        this.miniCardHolder.textContent = user.ecoCard.cardholderName || user.name.toUpperCase();
      }
      if (this.miniCardStatus) {
        const isFrozen = user.ecoCard.status === 'frozen';
        this.miniCardStatus.textContent = isFrozen ? '❄️ Frozen' : '🟢 Tap Ready';
        this.miniCardStatus.className = isFrozen ? 'badge badge-danger' : 'badge badge-success';
      }
    }

    // Recent 5 Transactions
    this.renderRecentTransactions(userTxns);
  }

  renderTierProgress(user) {
    if (!this.tierProgressBar || !this.tierProgressText) return;

    let targetCredits = 3000;
    let nextTier = 'Eco Champion';

    if (user.lifetimeCreditsEarned < 600) {
      targetCredits = 600;
      nextTier = 'Silver Recycler';
    } else if (user.lifetimeCreditsEarned < 1500) {
      targetCredits = 1500;
      nextTier = 'Gold Recycler';
    } else if (user.lifetimeCreditsEarned < 3000) {
      targetCredits = 3000;
      nextTier = 'Eco Champion';
    } else {
      this.tierProgressBar.style.width = '100%';
      this.tierProgressText.textContent = '🌟 Highest Tier Achieved: Eco Champion!';
      return;
    }

    const pct = Math.min(100, Math.round((user.lifetimeCreditsEarned / targetCredits) * 100));
    this.tierProgressBar.style.width = `${pct}%`;
    const needed = targetCredits - user.lifetimeCreditsEarned;
    this.tierProgressText.textContent = `${needed.toLocaleString()} credits to unlock ${nextTier} (${pct}% complete)`;
  }

  renderRecentTransactions(txns) {
    if (!this.recentTxnList) return;

    const recent = txns.slice(0, 5);

    if (recent.length === 0) {
      this.recentTxnList.innerHTML = `
        <tr>
          <td colspan="6" style="text-align: center; padding: 2rem; color: #64748b;">
            No activity yet. Tap your EcoCard at an RVM machine to earn your first credits!
          </td>
        </tr>
      `;
      return;
    }

    this.recentTxnList.innerHTML = recent.map(t => {
      const isDeposit = t.type === 'deposit';

      return `
        <tr>
          <td>
            <div style="font-weight: 600; color: #1e293b;">${t.date}</div>
            <small style="color: #64748b;">${t.timestamp.split(' ')[1] || ''}</small>
          </td>
          <td>
            <div style="display: flex; align-items: center; gap: 0.5rem;">
              <span>${isDeposit ? (t.wasteType === 'pet_bottles' ? '🍾' : t.wasteType === 'carry_bags' ? '🛍️' : t.wasteType === 'aluminum_cans' ? '🥫' : '📦') : '🎟️'}</span>
              <strong>${isDeposit ? t.wasteName : t.rewardTitle}</strong>
            </div>
          </td>
          <td>
            <div style="font-size: 0.9rem; color: #334155;">${isDeposit ? (t.machineLocation || 'RVM Kiosk') : `Voucher: ${t.voucherCode || 'Active'}`}</div>
          </td>
          <td>
            ${isDeposit ? `<strong>${t.weightKg.toFixed(2)} kg</strong> <small style="color: #64748b;">(~${t.itemsEstimated} items)</small>` : '<span style="color: #94a3b8;">-</span>'}
          </td>
          <td>
            <span class="${isDeposit ? 'text-emerald font-bold' : 'text-danger font-bold'}">
              ${isDeposit ? `+${t.creditsEarned} Credits` : `-${t.creditsSpent} Credits`}
            </span>
          </td>
          <td>
            <span class="badge ${isDeposit ? 'badge-success' : 'badge-gold'}">
              ${isDeposit ? 'Verified' : 'Claimed'}
            </span>
          </td>
        </tr>
      `;
    }).join('');
  }
}

window.UserDashboard = UserDashboard;
