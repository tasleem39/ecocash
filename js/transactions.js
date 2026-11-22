/**
 * Ecocash - Waste Deposit History & Ledger Controller
 * Handles full filterable and sortable waste deposit records,
 * redemption entries, digital receipt inspection, and CSV ledger export.
 */

class TransactionHistory {
  constructor() {
    this.currentFilter = 'all';
    this.searchQuery = '';
    this.sortBy = 'date-desc';
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
    this.tableBody = document.getElementById('history-table-body');
    this.filterPills = document.querySelectorAll('.history-filter-pill');
    this.searchInput = document.getElementById('history-search-input');
    this.sortSelect = document.getElementById('history-sort-select');
    this.exportBtn = document.getElementById('btn-export-csv');
    this.totalRecordsBadge = document.getElementById('history-total-count');
    this.receiptModal = document.getElementById('modal-receipt');
  }

  bindEvents() {
    this.filterPills.forEach(pill => {
      pill.addEventListener('click', () => {
        this.filterPills.forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        this.currentFilter = pill.dataset.filter;
        this.render();
      });
    });

    if (this.searchInput) {
      this.searchInput.addEventListener('input', (e) => {
        this.searchQuery = e.target.value.toLowerCase().trim();
        this.render();
      });
    }

    if (this.sortSelect) {
      this.sortSelect.addEventListener('change', (e) => {
        this.sortBy = e.target.value;
        this.render();
      });
    }

    if (this.exportBtn) {
      this.exportBtn.addEventListener('click', () => this.exportCsv());
    }

    // Delegated click for "View Receipt"
    if (this.tableBody) {
      this.tableBody.addEventListener('click', (e) => {
        const btn = e.target.closest('.btn-view-receipt');
        if (btn) {
          const txnId = btn.dataset.txnid;
          this.openReceiptModal(txnId);
        }
      });
    }
  }

  getFilteredTransactions() {
    if (!window.ecocashStore) return [];
    const currentUser = window.ecocashStore.getCurrentUser();
    if (!currentUser) return [];

    let list = window.ecocashStore.getUserTransactions(currentUser.id);

    // Apply category filter
    if (this.currentFilter !== 'all') {
      if (this.currentFilter === 'redemption') {
        list = list.filter(t => t.type === 'redemption');
      } else {
        list = list.filter(t => t.wasteType === this.currentFilter);
      }
    }

    // Apply search query
    if (this.searchQuery) {
      list = list.filter(t => 
        t.id.toLowerCase().includes(this.searchQuery) ||
        (t.machineLocation && t.machineLocation.toLowerCase().includes(this.searchQuery)) ||
        (t.machineId && t.machineId.toLowerCase().includes(this.searchQuery)) ||
        (t.wasteName && t.wasteName.toLowerCase().includes(this.searchQuery)) ||
        (t.rewardTitle && t.rewardTitle.toLowerCase().includes(this.searchQuery)) ||
        (t.cardUsed && t.cardUsed.toLowerCase().includes(this.searchQuery))
      );
    }

    // Apply sorting
    list.sort((a, b) => {
      if (this.sortBy === 'date-desc') {
        return new Date(b.timestamp.replace(/(\d{2}) (\w{3}) (\d{4})/, '$2 $1 $3')) - 
               new Date(a.timestamp.replace(/(\d{2}) (\w{3}) (\d{4})/, '$2 $1 $3'));
      }
      if (this.sortBy === 'date-asc') {
        return new Date(a.timestamp.replace(/(\d{2}) (\w{3}) (\d{4})/, '$2 $1 $3')) - 
               new Date(b.timestamp.replace(/(\d{2}) (\w{3}) (\d{4})/, '$2 $1 $3'));
      }
      if (this.sortBy === 'credits-desc') {
        const aCred = a.creditsEarned || a.creditsSpent || 0;
        const bCred = b.creditsEarned || b.creditsSpent || 0;
        return bCred - aCred;
      }
      if (this.sortBy === 'credits-asc') {
        const aCred = a.creditsEarned || a.creditsSpent || 0;
        const bCred = b.creditsEarned || b.creditsSpent || 0;
        return aCred - bCred;
      }
      return 0;
    });

    return list;
  }

  render() {
    if (!this.tableBody) return;
    const transactions = this.getFilteredTransactions();

    if (this.totalRecordsBadge) {
      this.totalRecordsBadge.textContent = `Showing ${transactions.length} record${transactions.length === 1 ? '' : 's'}`;
    }

    if (transactions.length === 0) {
      this.tableBody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align: center; padding: 3rem 1rem; color: #64748b;">
            <div style="font-size: 2.5rem; margin-bottom: 0.5rem;">📋</div>
            <h4 style="color: #334155;">No records found</h4>
            <p style="font-size: 0.9rem;">No waste deposits match your filter. Tap your EcoCard at any RVM to deposit!</p>
          </td>
        </tr>
      `;
      return;
    }

    this.tableBody.innerHTML = transactions.map(t => {
      const isDeposit = t.type === 'deposit';

      return `
        <tr>
          <td>
            <div style="font-family: monospace; font-weight: 700; color: #065f46; font-size: 0.88rem;">
              ${t.id}
            </div>
            <small style="color: #64748b;">${t.timestamp}</small>
          </td>
          <td>
            <div style="display: flex; align-items: center; gap: 0.4rem;">
              <span>${isDeposit ? (t.wasteType === 'pet_bottles' ? '🍾' : t.wasteType === 'carry_bags' ? '🛍️' : t.wasteType === 'aluminum_cans' ? '🥫' : '📦') : '🎟️'}</span>
              <strong>${isDeposit ? t.wasteName : t.rewardTitle}</strong>
            </div>
          </td>
          <td>
            <div style="font-size: 0.88rem; color: #334155;">
              ${isDeposit ? `${t.machineId} — ${t.machineLocation}` : `Voucher: ${t.voucherCode || 'Claimed'}`}
            </div>
            ${isDeposit && t.cardUsed ? `<small style="color: #64748b;">Card: ${t.cardUsed}</small>` : ''}
          </td>
          <td>
            ${isDeposit ? `<strong>${t.weightKg.toFixed(2)} kg</strong> <small style="color: #64748b;">(~${t.itemsEstimated} items)</small>` : '<span style="color: #94a3b8;">-</span>'}
          </td>
          <td>
            <div style="font-size: 0.88rem; color: #475569;">
              ${isDeposit ? `${t.rateCreditsPerKg} Credits/kg` : 'Voucher'}
            </div>
            ${isDeposit ? `<small style="color: #059669;">🌱 ${t.co2SavedKg} kg CO₂</small>` : ''}
          </td>
          <td>
            <span class="${isDeposit ? 'text-emerald font-bold' : 'text-danger font-bold'}">
              ${isDeposit ? `+${t.creditsEarned.toLocaleString()} Credits` : `-${t.creditsSpent.toLocaleString()} Credits`}
            </span>
          </td>
          <td>
            ${isDeposit ? `
              <button class="btn btn-outline btn-sm btn-view-receipt" data-txnid="${t.id}" style="padding: 0.35rem 0.75rem; font-size: 0.8rem;">
                🧾 Receipt
              </button>
            ` : `
              <span class="badge badge-gold">${t.status || 'Active'}</span>
            `}
          </td>
        </tr>
      `;
    }).join('');
  }

  openReceiptModal(txnId) {
    if (!window.ecocashStore) return;
    const allTxns = window.ecocashStore.getAllTransactions();
    const txn = allTxns.find(t => t.id === txnId);
    if (!txn || !this.receiptModal) return;

    const user = window.ecocashStore.getCurrentUser();

    document.getElementById('receipt-txn-id').textContent = txn.id;
    document.getElementById('receipt-date').textContent = txn.timestamp;
    document.getElementById('receipt-user').textContent = user ? user.name : 'Account Holder';
    document.getElementById('receipt-card-used').textContent = txn.cardUsed || user?.ecoCard?.cardNumber || 'ECO-CARD';
    document.getElementById('receipt-machine').textContent = `${txn.machineId} (${txn.machineLocation})`;
    document.getElementById('receipt-waste').textContent = txn.wasteName;
    document.getElementById('receipt-weight').textContent = `${txn.weightKg.toFixed(2)} kg (~${txn.itemsEstimated} items)`;
    document.getElementById('receipt-rate').textContent = `${txn.rateCreditsPerKg} Credits / kg`;
    document.getElementById('receipt-co2').textContent = `${txn.co2SavedKg.toFixed(2)} kg CO₂`;
    document.getElementById('receipt-credits').textContent = `+${txn.creditsEarned.toLocaleString()} Credits`;

    this.receiptModal.classList.add('active');
  }

  exportCsv() {
    const list = this.getFilteredTransactions();
    if (list.length === 0) {
      if (window.showToast) window.showToast('Nothing to Export', 'No transactions found in current view.', 'info');
      return;
    }

    const headers = ['Transaction ID', 'Date & Time', 'Type', 'Category / Item', 'Machine Location', 'Weight (kg)', 'Items Estimated', 'Credits Earned/Spent', 'CO2 Offset (kg)', 'Card Used'];
    
    const rows = list.map(t => [
      t.id,
      `"${t.timestamp}"`,
      t.type,
      `"${t.type === 'deposit' ? t.wasteName : t.rewardTitle}"`,
      `"${t.machineLocation || ''}"`,
      t.weightKg || 0,
      t.itemsEstimated || 0,
      t.type === 'deposit' ? t.creditsEarned : -t.creditsSpent,
      t.co2SavedKg || 0,
      `"${t.cardUsed || ''}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + 
      [headers.join(','), ...rows.map(e => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `ecocash_waste_ledger_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    if (window.showToast) window.showToast('CSV Exported! 📥', `Exported ${list.length} records to CSV.`, 'success');
  }
}

window.TransactionHistory = TransactionHistory;
