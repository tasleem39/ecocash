/**
 * Verification Test for EcoCash Credits & ATM EcoCard System
 */

// Mock browser global objects
const localStorageMock = (function () {
  let store = {};
  return {
    getItem: function (key) {
      return store[key] || null;
    },
    setItem: function (key, value) {
      store[key] = value.toString();
    },
    removeItem: function (key) {
      delete store[key];
    },
    clear: function () {
      store = {};
    }
  };
})();

global.window = {
  localStorage: localStorageMock
};
global.localStorage = localStorageMock;

// Load store.js
require('./js/store.js');

console.log("=== Testing EcoCash Credits & ATM EcoCard System ===");
const store = window.ecocashStore;
console.log("Store loaded successfully!");

// 1. Initial State Check
const currentUser = store.getCurrentUser();
console.log(`Current user: ${currentUser.name} (${currentUser.email})`);
console.log(`Credits Balance: ${currentUser.creditsBalance} Credits`);
console.log(`EcoCard: ${currentUser.ecoCard?.cardNumber}, Status: ${currentUser.ecoCard?.status}`);

if (currentUser.creditsBalance !== 1250) throw new Error("Expected initial 1,250 Credits balance");
if (!currentUser.ecoCard || !currentUser.ecoCard.cardNumber.startsWith('ECO-')) {
  throw new Error("Expected valid ATM EcoCard number starting with ECO-");
}
if (currentUser.ecoCard.status !== 'active') throw new Error("Expected active EcoCard");

// 2. Rate Card Check (in Credits)
const rateCard = store.getRateCard();
console.log("\nRate Card materials:", Object.keys(rateCard));
if (rateCard.pet_bottles.creditsPerKg !== 100) throw new Error("Invalid PET credits rate");
if (rateCard.aluminum_cans.creditsPerKg !== 120) throw new Error("Invalid Aluminum Cans credits rate");
if (rateCard.other_plastics.creditsPerKg !== 75) throw new Error("Invalid Rigid Plastics credits rate");
if (rateCard.carry_bags.creditsPerKg !== 50) throw new Error("Invalid Carry Bags credits rate");
console.log("Rate card validated in Credits! ✅");

// 3. ATM EcoCard Freeze & Unfreeze Check
console.log("\nTesting EcoCard Freeze / Unfreeze toggle...");
const freezeRes = store.toggleCardStatus(currentUser.id);
if (!freezeRes.success || freezeRes.status !== 'frozen') throw new Error("Failed to freeze card");
console.log(`Card frozen successfully: ${currentUser.ecoCard.status}`);

// Test Deposit Blocked while Frozen
const blockedDeposit = store.simulateDeposit({
  userId: currentUser.id,
  machineId: 'RVM-101',
  wasteTypeId: 'pet_bottles',
  weightKg: 1.0
});
if (blockedDeposit.success) throw new Error("Deposit should have failed because card is frozen!");
console.log("RVM correctly rejected deposit while card is frozen! ✅");

// Unfreeze card
const unfreezeRes = store.toggleCardStatus(currentUser.id);
if (!unfreezeRes.success || unfreezeRes.status !== 'active') throw new Error("Failed to unfreeze card");
console.log(`Card reactivated successfully: ${currentUser.ecoCard.status}`);

// 4. Deposit Simulation Check (Earn Credits)
console.log("\nSimulating deposit: 2.5 kg of PET bottles for Rahul...");
const depositResult = store.simulateDeposit({
  userId: currentUser.id,
  machineId: 'RVM-102',
  wasteTypeId: 'pet_bottles',
  weightKg: 2.5
});

if (!depositResult.success) throw new Error("Deposit failed: " + depositResult.error);
console.log(`Deposit successful! Earned: +${depositResult.transaction.creditsEarned} Credits, New Balance: ${depositResult.user.creditsBalance} Credits`);
if (depositResult.transaction.creditsEarned !== 250) throw new Error("Expected +250 Credits earned (2.5kg * 100)");
if (depositResult.user.creditsBalance !== 1500) throw new Error("Expected 1,500 Credits balance (1250 + 250)");

// 5. Rewards Redemption Simulation Check (Spend Credits)
console.log("\nSimulating reward redemption: Artisan Fresh Brew Coffee (120 Credits)...");
const redeemResult = store.redeemReward({
  userId: currentUser.id,
  rewardId: 'rew_coffee'
});

if (!redeemResult.success) throw new Error("Redemption failed: " + redeemResult.error);
console.log(`Redemption successful! Voucher Code: ${redeemResult.voucherCode}, New Balance: ${redeemResult.newBalance} Credits`);
if (redeemResult.newBalance !== 1380) throw new Error("Expected 1,380 Credits balance (1500 - 120)");
if (!redeemResult.voucherCode.startsWith('ECO-FOOD-')) throw new Error("Expected valid voucher code");

// 6. Insufficient Balance Check
const failRedeem = store.redeemReward({
  userId: currentUser.id,
  rewardId: 'rew_coffee'
});
// Set user balance temporarily to 10 credits to test insufficient check
currentUser.creditsBalance = 10;
const overdrawnRedeem = store.redeemReward({
  userId: currentUser.id,
  rewardId: 'rew_coffee'
});
if (overdrawnRedeem.success) throw new Error("Redemption should fail with insufficient credits!");
console.log("Insufficient credits check passed:", overdrawnRedeem.error);
currentUser.creditsBalance = 1380; // Restore balance

// 7. Waste History / Transaction Ledger Check
const userTxns = store.getUserTransactions(currentUser.id);
console.log(`\nUser has ${userTxns.length} recorded transactions.`);
const latestTxn = userTxns[0];
console.log(`Latest Transaction: [${latestTxn.type.toUpperCase()}] ${latestTxn.rewardTitle || latestTxn.wasteName}`);
if (userTxns.length < 3) throw new Error("Expected at least 3 transactions in ledger");

// 8. Leaderboard Check
const leaderboard = store.getLeaderboard();
console.log(`\nLeaderboard has ${leaderboard.length} ranked users.`);
console.log(`Rank 1: ${leaderboard[0].name} with ${leaderboard[0].lifetimeCreditsEarned} Lifetime Credits`);
if (leaderboard[0].lifetimeCreditsEarned < leaderboard[1].lifetimeCreditsEarned) {
  throw new Error("Leaderboard not properly sorted by credits");
}

// 9. Global Impact Check
const impact = store.getGlobalImpact();
console.log("\nGlobal Impact Stats:", impact);
if (!impact.totalPlasticKg || !impact.totalCreditsPaid || !impact.totalBottlesSaved) {
  throw new Error("Missing global impact stats");
}

console.log("\n========================================================");
console.log("ALL ECOCASH CREDITS & ECOCARD TESTS PASSED SUCCESSFULLY! ✅");
console.log("========================================================");
