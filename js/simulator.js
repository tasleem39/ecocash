/**
 * Ecocash - Reverse Vending Machine (RVM) Simulator
 * Controls the interactive Kiosk simulator with contactless ATM EcoCard tap,
 * optical polymer classification, calibrated load cell weighing, shredder cycle,
 * and instant credit transfer to the user's card.
 */

class RvmSimulator {
  constructor() {
    this.selectedWaste = 'pet_bottles';
    this.currentWeight = 1.0;
    this.isCardTapped = true; // Pre-tapped by default for seamless demo
    this.isProcessing = false;
    this.init();
  }

  init() {
    this.cacheDom();
    this.bindEvents();
    this.populateSelectors();
    this.syncActiveCard();
    this.updatePreview();

    if (window.ecocashStore) {
      window.ecocashStore.subscribe(() => {
        this.populateSelectors();
        this.syncActiveCard();
        this.updatePreview();
      });
    }
  }

  cacheDom() {
    this.userSelect = document.getElementById('sim-user-select');
    this.machineSelect = document.getElementById('sim-machine-select');
    this.wasteCards = document.querySelectorAll('.waste-card-option');
    this.weightDisplay = document.getElementById('sim-weight-val');
    this.weightInput = document.getElementById('sim-weight-input');
    this.presetChips = document.querySelectorAll('.preset-chip');
    this.previewRate = document.getElementById('sim-preview-rate');
    this.previewCredits = document.getElementById('sim-preview-credits');
    this.previewCo2 = document.getElementById('sim-preview-co2');
    this.previewItems = document.getElementById('sim-preview-items');
    this.depositBtn = document.getElementById('btn-simulate-deposit');
    this.processingOverlay = document.getElementById('kiosk-processing-overlay');
    this.processingStatus = document.getElementById('kiosk-processing-status');

    // NFC Card Scanner
    this.btnTapCard = document.getElementById('btn-rvm-tap-card');
    this.cardTapPad = document.getElementById('rvm-nfc-tap-pad');
    this.tappedCardName = document.getElementById('rvm-tapped-card-name');
    this.tappedCardNum = document.getElementById('rvm-tapped-card-num');
    this.tappedCardStatus = document.getElementById('rvm-tapped-card-status');
    this.tappedCardBalance = document.getElementById('rvm-tapped-card-balance');

    // Receipt Modal
    this.receiptModal = document.getElementById('modal-receipt');
    this.receiptTxnId = document.getElementById('receipt-txn-id');
    this.receiptDate = document.getElementById('receipt-date');
    this.receiptMachine = document.getElementById('receipt-machine');
    this.receiptWaste = document.getElementById('receipt-waste');
    this.receiptWeight = document.getElementById('receipt-weight');
    this.receiptRate = document.getElementById('receipt-rate');
    this.receiptCredits = document.getElementById('receipt-credits');
    this.receiptCo2 = document.getElementById('receipt-co2');
    this.receiptUser = document.getElementById('receipt-user');
    this.receiptCardUsed = document.getElementById('receipt-card-used');
  }

  populateSelectors() {
    if (!window.ecocashStore) return;
    const users = window.ecocashStore.getAllUsers();
    const currentUser = window.ecocashStore.getCurrentUser();
    const machines = window.ecocashStore.getRvmMachines();

    // Populate User Dropdown
    if (this.userSelect) {
      this.userSelect.innerHTML = users.map(u => `
        <option value="${u.id}" ${currentUser && currentUser.id === u.id ? 'selected' : ''}>
          ${u.avatar} ${u.name} (Card: ${u.ecoCard?.cardNumber || 'None'}) — ${u.creditsBalance.toLocaleString()} Credits
        </option>
      `).join('');
    }

    // Populate Machine Dropdown
    if (this.machineSelect) {
      this.machineSelect.innerHTML = machines.map(m => `
        <option value="${m.id}">
          🟢 ${m.id} — ${m.name} (${m.fillStatus})
        </option>
      `).join('');
    }
  }

  syncActiveCard() {
    const user = window.ecocashStore?.getCurrentUser();
    if (!user || !user.ecoCard) return;

    const card = user.ecoCard;
    const isFrozen = card.status === 'frozen';

    if (this.tappedCardName) this.tappedCardName.textContent = user.name;
    if (this.tappedCardNum) this.tappedCardNum.textContent = card.cardNumber;
    if (this.tappedCardBalance) {
      this.tappedCardBalance.textContent = `${user.creditsBalance.toLocaleString()} Credits`;
    }

    if (this.tappedCardStatus) {
      if (isFrozen) {
        this.tappedCardStatus.textContent = '❌ REJECTED: CARD FROZEN';
        this.tappedCardStatus.className = 'text-danger font-bold';
      } else {
        this.tappedCardStatus.textContent = '✅ AUTHENTICATED & READY';
        this.tappedCardStatus.className = 'text-emerald font-bold';
      }
    }
  }

  bindEvents() {
    // User Switch from simulator dropdown
    if (this.userSelect) {
      this.userSelect.addEventListener('change', (e) => {
        window.ecocashStore?.setCurrentUser(e.target.value);
        this.syncActiveCard();
        this.updatePreview();
      });
    }

    // Tap Card Action Button
    if (this.btnTapCard) {
      this.btnTapCard.addEventListener('click', () => {
        this.handleCardTapAnimation();
      });
    }
    if (this.cardTapPad) {
      this.cardTapPad.addEventListener('click', () => {
        this.handleCardTapAnimation();
      });
    }

    // Waste Material Selection
    this.wasteCards.forEach(card => {
      card.addEventListener('click', () => {
        this.wasteCards.forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        this.selectedWaste = card.dataset.waste;
        if (window.ecoAudio) window.ecoAudio.playBeep(520, 'sine', 0.05);
        this.updatePreview();
      });
    });

    // Preset Weight Chips
    this.presetChips.forEach(chip => {
      chip.addEventListener('click', () => {
        this.presetChips.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        const val = parseFloat(chip.dataset.weight);
        this.setWeight(val);
        if (window.ecoAudio) window.ecoAudio.playBeep(640, 'sine', 0.05);
      });
    });

    // Weight slider
    if (this.weightInput) {
      this.weightInput.addEventListener('input', (e) => {
        this.presetChips.forEach(c => c.classList.remove('active'));
        this.setWeight(parseFloat(e.target.value));
      });
    }

    // Submit Simulated Waste Deposit
    if (this.depositBtn) {
      this.depositBtn.addEventListener('click', () => this.handleDeposit());
    }
  }

  handleCardTapAnimation() {
    const user = window.ecocashStore?.getCurrentUser();
    if (!user || !user.ecoCard) return;

    if (this.cardTapPad) {
      this.cardTapPad.classList.add('nfc-tap-pulse');
      setTimeout(() => {
        this.cardTapPad.classList.remove('nfc-tap-pulse');
      }, 700);
    }

    if (user.ecoCard.status === 'frozen') {
      if (window.ecoAudio) window.ecoAudio.playError();
      if (window.showToast) {
        window.showToast('Card Tap Rejected ❌', 'This EcoCard is locked/frozen! Unlock it in My EcoCard page.', 'error');
      }
      return;
    }

    if (window.ecoAudio) window.ecoAudio.playBeep(880, 'sine', 0.12);
    if (window.showToast) {
      window.showToast('NFC Card Verified! 📶', `${user.name} • ${user.ecoCard.cardNumber} connected.`, 'success');
    }
    this.isCardTapped = true;
    this.syncActiveCard();
  }

  setWeight(weight) {
    this.currentWeight = Math.max(0.1, Math.min(10.0, weight));
    if (this.weightDisplay) this.weightDisplay.textContent = this.currentWeight.toFixed(2);
    if (this.weightInput) this.weightInput.value = this.currentWeight;
    this.updatePreview();
  }

  updatePreview() {
    if (!window.ecocashStore) return;
    const rateCard = window.ecocashStore.getRateCard();
    const rateInfo = rateCard[this.selectedWaste];
    if (!rateInfo) return;

    const creditsEarned = Math.round(this.currentWeight * rateInfo.creditsPerKg);
    const co2Saved = (this.currentWeight * rateInfo.co2SavedPerKg).toFixed(2);
    const itemsCount = Math.round(this.currentWeight * (rateInfo.approxItemsPerKg || 40));

    if (this.previewRate) this.previewRate.textContent = `${rateInfo.creditsPerKg} Credits / kg`;
    if (this.previewCredits) this.previewCredits.textContent = `+${creditsEarned.toLocaleString()} Credits`;
    if (this.previewCo2) this.previewCo2.textContent = `${co2Saved} kg CO₂`;
    if (this.previewItems) this.previewItems.textContent = `~${itemsCount} items`;
  }

  async handleDeposit() {
    if (this.isProcessing) return;

    const user = window.ecocashStore?.getCurrentUser();
    if (!user) {
      if (window.showToast) window.showToast('Select User', 'Please select or log in to a user account.', 'error');
      return;
    }

    if (user.ecoCard && user.ecoCard.status === 'frozen') {
      if (window.ecoAudio) window.ecoAudio.playError();
      if (window.showToast) {
        window.showToast('Card Locked', 'Cannot deposit. This EcoCard is frozen. Go to My EcoCard to unlock.', 'error');
      }
      return;
    }

    this.isProcessing = true;
    if (this.depositBtn) this.depositBtn.disabled = true;

    // Show Animated Kiosk Processing Overlay
    if (this.processingOverlay) {
      this.processingOverlay.classList.add('active');
    }

    const steps = [
      { text: '📶 Reading EcoCard chip & contactless session...', sound: () => window.ecoAudio?.playBeep(480, 'sine', 0.08) },
      { text: '📷 Optical camera scanning polymer & barcode...', sound: () => window.ecoAudio?.playBeep(620, 'sine', 0.08) },
      { text: '⚖️ Calibrating strain-gauge load cell weight...', sound: () => window.ecoAudio?.playBeep(740, 'sine', 0.08) },
      { text: '⚙️ Activating high-torque compactor rollers...', sound: () => window.ecoAudio?.playMotorHum() },
      { text: '🪙 Crediting user EcoCard balance...', sound: () => window.ecoAudio?.playSuccess() }
    ];

    for (const step of steps) {
      if (this.processingStatus) this.processingStatus.textContent = step.text;
      if (step.sound) step.sound();
      await new Promise(r => setTimeout(r, 650));
    }

    // Execute deposit in store
    const machineId = this.machineSelect ? this.machineSelect.value : 'RVM-101';
    const result = window.ecocashStore.simulateDeposit({
      userId: user.id,
      machineId: machineId,
      wasteTypeId: this.selectedWaste,
      weightKg: this.currentWeight
    });

    // Hide overlay
    if (this.processingOverlay) this.processingOverlay.classList.remove('active');
    this.isProcessing = false;
    if (this.depositBtn) this.depositBtn.disabled = false;

    if (result.success) {
      if (window.showToast) {
        window.showToast('Credits Added to EcoCard! 🪙', `+${result.summary.creditsEarned} Credits added to ${user.name}!`, 'reward');
      }
      this.showReceipt(result.transaction, result.user);
    } else {
      if (window.showToast) window.showToast('Deposit Failed', result.error, 'error');
    }
  }

  showReceipt(txn, user) {
    if (!this.receiptModal) return;

    if (this.receiptTxnId) this.receiptTxnId.textContent = txn.id;
    if (this.receiptDate) this.receiptDate.textContent = txn.timestamp;
    if (this.receiptUser) this.receiptUser.textContent = user.name;
    if (this.receiptCardUsed) this.receiptCardUsed.textContent = txn.cardUsed || user.ecoCard?.cardNumber || 'ECO-CARD';
    if (this.receiptMachine) this.receiptMachine.textContent = `${txn.machineId} (${txn.machineLocation})`;
    if (this.receiptWaste) this.receiptWaste.textContent = txn.wasteName;
    if (this.receiptWeight) this.receiptWeight.textContent = `${txn.weightKg.toFixed(2)} kg (~${txn.itemsEstimated} items)`;
    if (this.receiptRate) this.receiptRate.textContent = `${txn.rateCreditsPerKg} Credits / kg`;
    if (this.receiptCo2) this.receiptCo2.textContent = `${txn.co2SavedKg.toFixed(2)} kg CO₂`;
    if (this.receiptCredits) this.receiptCredits.textContent = `+${txn.creditsEarned.toLocaleString()} Credits`;

    this.receiptModal.classList.add('active');
  }
}

window.RvmSimulator = RvmSimulator;
