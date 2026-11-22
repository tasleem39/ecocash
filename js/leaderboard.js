/**
 * Ecocash - Leaderboard Controller (Credits Based)
 * Renders top recyclers podium, community rankings, and lifetime credit earnings.
 */

class Leaderboard {
  constructor() {
    this.init();
  }

  init() {
    this.cacheDom();
    this.render();

    if (window.ecocashStore) {
      window.ecocashStore.subscribe(() => this.render());
    }
  }

  cacheDom() {
    this.podiumContainer = document.getElementById('leaderboard-podium');
    this.rankingTableBody = document.getElementById('leaderboard-table-body');
    this.userRankBanner = document.getElementById('user-rank-banner');
  }

  render() {
    if (!window.ecocashStore) return;
    const users = window.ecocashStore.getLeaderboard();
    const currentUser = window.ecocashStore.getCurrentUser();

    this.renderPodium(users.slice(0, 3));
    this.renderRankingList(users, currentUser);
    this.renderUserRankBanner(users, currentUser);
  }

  renderPodium(top3) {
    if (!this.podiumContainer || top3.length < 3) return;

    const [first, second, third] = top3;

    this.podiumContainer.innerHTML = `
      <!-- Rank 2: Silver -->
      <div class="podium-item">
        <div class="podium-avatar">
          <span>${second.avatar}</span>
        </div>
        <div class="podium-user-name">${second.name}</div>
        <div class="podium-user-score">${second.totalRecycledKg.toFixed(1)} kg</div>
        <div class="podium-bar podium-rank-2">
          <div style="font-size: 1.8rem; margin-bottom: 0.2rem;">🥈</div>
          <span>2nd</span>
          <small style="opacity: 0.85; font-size: 0.75rem;">🪙 ${second.lifetimeCreditsEarned.toLocaleString()} Credits</small>
        </div>
      </div>

      <!-- Rank 1: Gold -->
      <div class="podium-item">
        <div class="podium-avatar" style="border: 3px solid #f59e0b; box-shadow: 0 0 20px rgba(245, 158, 11, 0.3);">
          <span class="podium-crown">👑</span>
          <span>${first.avatar}</span>
        </div>
        <div class="podium-user-name">${first.name}</div>
        <div class="podium-user-score" style="color: #b45309;">${first.totalRecycledKg.toFixed(1)} kg</div>
        <div class="podium-bar podium-rank-1">
          <div style="font-size: 2.2rem; margin-bottom: 0.2rem;">🥇</div>
          <span>1st Place</span>
          <small style="opacity: 0.9; font-size: 0.8rem;">🪙 ${first.lifetimeCreditsEarned.toLocaleString()} Credits</small>
        </div>
      </div>

      <!-- Rank 3: Bronze -->
      <div class="podium-item">
        <div class="podium-avatar">
          <span>${third.avatar}</span>
        </div>
        <div class="podium-user-name">${third.name}</div>
        <div class="podium-user-score">${third.totalRecycledKg.toFixed(1)} kg</div>
        <div class="podium-bar podium-rank-3">
          <div style="font-size: 1.6rem; margin-bottom: 0.2rem;">🥉</div>
          <span>3rd</span>
          <small style="opacity: 0.85; font-size: 0.75rem;">🪙 ${third.lifetimeCreditsEarned.toLocaleString()} Credits</small>
        </div>
      </div>
    `;
  }

  renderRankingList(users, currentUser) {
    if (!this.rankingTableBody) return;

    this.rankingTableBody.innerHTML = users.map((user, idx) => {
      const rank = idx + 1;
      const isCurrentUser = currentUser && currentUser.id === user.id;
      const rankBadge = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`;
      
      let tierClass = 'badge-bronze';
      if (user.ecoTier === 'Eco Champion') tierClass = 'badge-champion';
      else if (user.ecoTier === 'Gold Recycler') tierClass = 'badge-gold';
      else if (user.ecoTier === 'Silver Recycler') tierClass = 'badge-silver';

      return `
        <tr style="${isCurrentUser ? 'background: #f0fdf4; border-left: 4px solid var(--primary);' : ''}">
          <td style="font-weight: 700; font-size: 1.1rem; width: 80px;">
            ${rankBadge}
          </td>
          <td>
            <div style="display: flex; align-items: center; gap: 0.75rem;">
              <span style="font-size: 1.5rem;">${user.avatar}</span>
              <div>
                <strong>${user.name}</strong> ${isCurrentUser ? '<span class="badge badge-success" style="font-size: 0.68rem; margin-left: 0.3rem;">You</span>' : ''}
                <div style="font-size: 0.78rem; color: #64748b;">Member since ${user.joinedDate}</div>
              </div>
            </div>
          </td>
          <td>
            <span class="badge ${tierClass}">${user.ecoTier}</span>
          </td>
          <td>
            <strong>${user.totalRecycledKg.toFixed(1)} kg</strong>
            <small style="color: #64748b;"> (~${user.bottlesRecycled || Math.round(user.totalRecycledKg * 40)} items)</small>
          </td>
          <td>
            <strong style="color: #059669; font-size: 1.05rem;">
              🪙 ${user.lifetimeCreditsEarned.toLocaleString()} Credits
            </strong>
          </td>
        </tr>
      `;
    }).join('');
  }

  renderUserRankBanner(users, currentUser) {
    if (!this.userRankBanner || !currentUser) return;

    const rankIdx = users.findIndex(u => u.id === currentUser.id);
    const rank = rankIdx !== -1 ? rankIdx + 1 : '-';

    this.userRankBanner.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 1rem;">
        <div style="display: flex; align-items: center; gap: 1rem;">
          <div style="font-size: 2.5rem;">${currentUser.avatar}</div>
          <div>
            <div style="font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.05em; color: #065f46; font-weight: 700;">
              Your Campus Standing
            </div>
            <h3 style="margin: 0; font-size: 1.35rem; color: #064e3b;">
              Ranked #${rank} of ${users.length} Eco Warriors
            </h3>
          </div>
        </div>
        <div style="display: flex; gap: 2rem;">
          <div>
            <small style="color: #065f46; font-weight: 600;">Lifetime Recycled</small>
            <div style="font-weight: 800; font-size: 1.25rem; color: #064e3b;">${currentUser.totalRecycledKg.toFixed(1)} kg</div>
          </div>
          <div>
            <small style="color: #065f46; font-weight: 600;">Lifetime Credits</small>
            <div style="font-weight: 800; font-size: 1.25rem; color: #059669;">🪙 ${currentUser.lifetimeCreditsEarned.toLocaleString()}</div>
          </div>
        </div>
      </div>
    `;
  }
}

window.Leaderboard = Leaderboard;
