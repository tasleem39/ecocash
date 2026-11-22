/**
 * Ecocash - Smart ATM EcoCard Controller
 * Controls the 3D realistic ATM EcoCard, card flip animations,
 * freeze/unfreeze status, daily tap limits, barcode display, and RVM tap links.
 */

class EcoCardController {
  constructor() {
    this.isMasked = true;
    this.isFlipped = false;
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
    // 3D Card Elements
    this.cardContainer = document.getElementById('ecocard-3d');
    this.cardFront = document.getElementById('ecocard-front');
    this.cardBack = document.getElementById('ecocard-back');
    this.cardNumberEl = document.getElementById('card-number-display');
    this.cardHolderEl = document.getElementById('card-holder-display');
    this.cardExpiryEl = document.getElementById('card-expiry-display');
    this.cardCvvEl = document.getElementById('card-cvv-display');
    this.cardChipUidEl = document.getElementById('card-chip-uid');
    this.cardStatusBadge = document.getElementById('card-status-badge');
    this.cardBarcodeEl = document.getElementById('card-barcode-val');

    // Controls
    this.btnFlipCard = document.getElementById('btn-flip-card');
    this.btnToggleMask = document.getElementById('btn-toggle-mask');
    this.btnCopyCard = document.getElementById('btn-copy-card');
    this.btnFreezeCard = document.getElementById('btn-freeze-card');
    this.btnReplaceCard = document.getElementById('btn-replace-card');
    this.limitSlider = document.getElementById('card-limit-slider');
    this.limitValDisplay = document.getElementById('card-limit-val');
    this.btnSaveLimit = document.getElementById('btn-save-limit');
    this.tapsTodayEl = document.getElementById('card-taps-today');
    this.cardDailyCapEl = document.getElementById('card-daily-cap');
    this.btnTapRvmDirect = document.getElementById('btn-card-tap-rvm');
  }

  bindEvents() {
    // Flip Card on click or button
    if (this.btnFlipCard) {
      this.btnFlipCard.addEventListener('click', () => this.toggleFlip());
    }
    if (this.cardContainer) {
      this.cardContainer.addEventListener('click', (e) => {
        // Prevent flipping if clicking interactive sub-buttons
        if (!e.target.closest('button')) {
          this.toggleFlip();
        }
      });
    }

    // Mask / Unmask Card Number
    if (this.btnToggleMask) {
      this.btnToggleMask.addEventListener('click', (e) => {
        e.stopPropagation();
        this.isMasked = !this.isMasked;
        this.renderCardNumber();
        if (window.ecoAudio) window.ecoAudio.playBeep(600, 'sine', 0.04);
      });
    }

    // Copy Card Number
    if (this.btnCopyCard) {
      this.btnCopyCard.addEventListener('click', (e) => {
        e.stopPropagation();
        this.copyCardNumber();
      });
    }

    // Freeze / Unfreeze Card
    if (this.btnFreezeCard) {
      this.btnFreezeCard.addEventListener('click', () => this.toggleFreeze());
    }

    // Replace Card
    if (this.btnReplaceCard) {
      this.btnReplaceCard.addEventListener('click', () => this.handleReplaceCard());
    }

    // Daily Tap Limit Slider
    if (this.limitSlider && this.limitValDisplay) {
      this.limitSlider.addEventListener('input', (e) => {
        this.limitValDisplay.textContent = `${parseInt(e.target.value, 10).toLocaleString()} Credits`;
      });
    }

    if (this.btnSaveLimit && this.limitSlider) {
      this.btnSaveLimit.addEventListener('click', () => {
        const user = window.ecocashStore?.getCurrentUser();
        if (!user) return;
        const res = window.ecocashStore.updateCardLimit(user.id, this.limitSlider.value);
        if (res.success) {
          if (window.showToast) {
            window.showToast('Daily Limit Saved', `Card daily tap limit updated to ${res.dailyTapLimit.toLocaleString()} Credits.`, 'success');
          }
        }
      });
    }

    // Direct Tap at RVM button
    if (this.btnTapRvmDirect) {
      this.btnTapRvmDirect.addEventListener('click', () => {
        window.location.hash = '#simulator';
      });
    }
  }

  toggleFlip() {
    this.isFlipped = !this.isFlipped;
    if (this.cardContainer) {
      this.cardContainer.classList.toggle('flipped', this.isFlipped);
    }
    if (window.ecoAudio) window.ecoAudio.playBeep(480, 'sine', 0.05);
  }

  copyCardNumber() {
    const user = window.ecocashStore?.getCurrentUser();
    if (!user || !user.ecoCard) return;

    const fullNumber = user.ecoCard.cardNumber;
    navigator.clipboard.writeText(fullNumber).then(() => {
      if (window.showToast) {
        window.showToast('Copied to Clipboard!', `EcoCard Number ${fullNumber} copied.`, 'success');
      }
      if (window.ecoAudio) window.ecoAudio.playSuccess();
    }).catch(() => {
      if (window.showToast) window.showToast('Copied!', fullNumber, 'success');
    });
  }

  toggleFreeze() {
    const user = window.ecocashStore?.getCurrentUser();
    if (!user) return;

    const res = window.ecocashStore.toggleCardStatus(user.id);
    if (res.success) {
      const isFrozen = res.status === 'frozen';
      if (window.showToast) {
        if (isFrozen) {
          window.showToast('EcoCard Frozen ❄️', 'Your EcoCard is now locked. RVM machines will reject taps until unlocked.', 'error');
        } else {
          window.showToast('EcoCard Active 🟢', 'Your EcoCard is unlocked and ready for contactless RVM taps!', 'success');
        }
      }
      if (window.ecoAudio) window.ecoAudio.playBeep(isFrozen ? 300 : 700, 'sine', 0.08);
      this.render();
    }
  }

  handleReplaceCard() {
    if (!confirm('Are you sure you want to issue a new EcoCard? Your existing card number will be deactivated and replaced with a new contactless NFC card.')) {
      return;
    }

    const user = window.ecocashStore?.getCurrentUser();
    if (!user) return;

    const res = window.ecocashStore.replaceEcoCard(user.id);
    if (res.success) {
      if (window.showToast) {
        window.showToast('New EcoCard Issued! 💳', `New card number: ${res.ecoCard.cardNumber}`, 'reward');
      }
      if (window.ecoAudio) window.ecoAudio.playSuccess();
      this.render();
    }
  }

  renderCardNumber() {
    if (!this.cardNumberEl) return;
    const user = window.ecocashStore?.getCurrentUser();
    if (!user || !user.ecoCard) return;

    const raw = user.ecoCard.cardNumber; // e.g. "ECO-8842-9104-5521"
    if (this.isMasked) {
      const parts = raw.split('-');
      if (parts.length === 4) {
        this.cardNumberEl.textContent = `${parts[0]} •••• •••• ${parts[3]}`;
      } else {
        this.cardNumberEl.textContent = raw.substring(0, 4) + ' •••• •••• ' + raw.substring(raw.length - 4);
      }
      if (this.btnToggleMask) this.btnToggleMask.textContent = '👁️ Reveal';
    } else {
      this.cardNumberEl.textContent = raw.replace(/-/g, ' ');
      if (this.btnToggleMask) this.btnToggleMask.textContent = '🔒 Hide';
    }
  }

  render() {
    if (!window.ecocashStore) return;
    const user = window.ecocashStore.getCurrentUser();
    if (!user || !user.ecoCard) return;

    const card = user.ecoCard;
    const isFrozen = card.status === 'frozen';

    // Render text fields
    this.renderCardNumber();

    if (this.cardHolderEl) {
      this.cardHolderEl.textContent = card.cardholderName || user.name.toUpperCase();
    }
    if (this.cardExpiryEl) {
      this.cardExpiryEl.textContent = card.expiryDate || '09/31';
    }
    if (this.cardCvvEl) {
      this.cardCvvEl.textContent = card.cvv || '842';
    }
    if (this.cardChipUidEl) {
      this.cardChipUidEl.textContent = card.chipUid || 'NFC-04:A2:8F';
    }
    if (this.cardBarcodeEl) {
      this.cardBarcodeEl.textContent = card.cardNumber;
    }

    // Status Badge on Card
    if (this.cardStatusBadge) {
      if (isFrozen) {
        this.cardStatusBadge.textContent = '❄️ FROZEN / LOCKED';
        this.cardStatusBadge.className = 'card-status-pill frozen';
      } else {
        this.cardStatusBadge.innerHTML = '<span class="status-dot-pulse"></span> ACTIVE & READY';
        this.cardStatusBadge.className = 'card-status-pill active';
      }
    }

    // Freeze Button Label
    if (this.btnFreezeCard) {
      if (isFrozen) {
        this.btnFreezeCard.innerHTML = '<span>🟢 Unlock / Unfreeze Card</span>';
        this.btnFreezeCard.className = 'btn btn-primary btn-sm';
      } else {
        this.btnFreezeCard.innerHTML = '<span>❄️ Freeze / Lock Card</span>';
        this.btnFreezeCard.className = 'btn btn-outline btn-sm';
      }
    }

    // Daily Tap Limits
    if (this.limitSlider) {
      this.limitSlider.value = card.dailyTapLimit || 1000;
    }
    if (this.limitValDisplay) {
      this.limitValDisplay.textContent = `${(card.dailyTapLimit || 1000).toLocaleString()} Credits`;
    }
    if (this.tapsTodayEl) {
      this.tapsTodayEl.textContent = `${card.tapsToday || 0} taps today`;
    }
    if (this.cardDailyCapEl) {
      this.cardDailyCapEl.textContent = `${(card.dailyTapLimit || 1000).toLocaleString()} Credits / day`;
    }

    // Visual card state
    if (this.cardContainer) {
      this.cardContainer.classList.toggle('card-frozen-style', isFrozen);
    }
  }
}

window.EcoCardController = EcoCardController;
