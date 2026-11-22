/**
 * Ecocash - Store & Mock Backend Service (100% Credits & EcoCard System)
 * Handles state persistence via localStorage, credit rate cards, user accounts,
 * ATM EcoCard management, waste deposit transactions, rewards redemption catalog,
 * and circular environmental impact calculations.
 */

const STORAGE_KEY = 'ecocash_db_v2'; // Upgraded schema for Credits & EcoCard

// Default initial state preloaded for instant live expo demo
const DEFAULT_INITIAL_STATE = {
  currentUser: 'user_1', // Rahul Sharma by default
  users: [
    {
      id: 'user_1',
      name: 'Rahul Sharma',
      email: 'rahul.sharma@ecocash.in',
      phone: '+91 98765 43210',
      password: 'password123',
      avatar: '👨‍💼',
      joinedDate: '2026-06-15',
      creditsBalance: 1250,
      lifetimeCreditsEarned: 2450,
      totalRecycledKg: 22.5,
      bottlesRecycled: 465,
      ecoTier: 'Gold Recycler',
      ecoCard: {
        cardNumber: 'ECO-8842-9104-5521',
        cardholderName: 'RAHUL SHARMA',
        expiryDate: '09/31',
        cvv: '842',
        chipUid: 'NFC-04:A2:8F:B1:7C',
        status: 'active', // 'active' | 'frozen'
        dailyTapLimit: 1000,
        tapsToday: 2,
        barcode: '884291045521'
      },
      unlockedBadges: ['first_bottle', 'nfc_pioneer', 'century_club', 'tree_guardian']
    },
    {
      id: 'user_2',
      name: 'Priya Patel',
      email: 'priya.p@ecocash.in',
      phone: '+91 98234 56789',
      password: 'password123',
      avatar: '👩‍🔬',
      joinedDate: '2026-07-01',
      creditsBalance: 860,
      lifetimeCreditsEarned: 1620,
      totalRecycledKg: 16.2,
      bottlesRecycled: 340,
      ecoTier: 'Silver Recycler',
      ecoCard: {
        cardNumber: 'ECO-4419-7201-9034',
        cardholderName: 'PRIYA PATEL',
        expiryDate: '11/31',
        cvv: '391',
        chipUid: 'NFC-05:C3:9D:E2:1A',
        status: 'active',
        dailyTapLimit: 1000,
        tapsToday: 1,
        barcode: '441972019034'
      },
      unlockedBadges: ['first_bottle', 'nfc_pioneer', 'century_club']
    },
    {
      id: 'user_3',
      name: 'Amit Verma',
      email: 'amit.v@ecocash.in',
      phone: '+91 97112 34567',
      password: 'password123',
      avatar: '👨‍🎓',
      joinedDate: '2026-08-10',
      creditsBalance: 320,
      lifetimeCreditsEarned: 780,
      totalRecycledKg: 7.8,
      bottlesRecycled: 165,
      ecoTier: 'Bronze Recycler',
      ecoCard: {
        cardNumber: 'ECO-1192-3384-6629',
        cardholderName: 'AMIT VERMA',
        expiryDate: '03/32',
        cvv: '614',
        chipUid: 'NFC-08:B4:7E:33:90',
        status: 'active',
        dailyTapLimit: 500,
        tapsToday: 0,
        barcode: '119233846629'
      },
      unlockedBadges: ['first_bottle', 'nfc_pioneer']
    },
    {
      id: 'user_4',
      name: 'Ananya Iyer',
      email: 'ananya.i@ecocash.in',
      phone: '+91 99887 66554',
      password: 'password123',
      avatar: '👩‍💼',
      joinedDate: '2026-05-20',
      creditsBalance: 2180,
      lifetimeCreditsEarned: 3840,
      totalRecycledKg: 34.0,
      bottlesRecycled: 720,
      ecoTier: 'Eco Champion',
      ecoCard: {
        cardNumber: 'ECO-9901-5542-1278',
        cardholderName: 'ANANYA IYER',
        expiryDate: '05/31',
        cvv: '702',
        chipUid: 'NFC-02:F1:1A:89:44',
        status: 'active',
        dailyTapLimit: 2000,
        tapsToday: 3,
        barcode: '990155421278'
      },
      unlockedBadges: ['first_bottle', 'nfc_pioneer', 'century_club', 'tree_guardian', 'campus_leader']
    }
  ],
  rateCard: {
    pet_bottles: {
      id: 'pet_bottles',
      name: 'PET Beverage & Water Bottles',
      shortName: 'PET Bottles',
      creditsPerKg: 100, // ~2 credits per 500ml empty bottle
      icon: '🍾',
      color: '#10b981',
      description: 'Clear and colored drink bottles, mineral water, soft drinks (Polyethylene Terephthalate)',
      co2SavedPerKg: 1.5,
      approxItemsPerKg: 45
    },
    carry_bags: {
      id: 'carry_bags',
      name: 'Plastic Carry Bags & Films',
      shortName: 'Carry Bags',
      creditsPerKg: 50,
      icon: '🛍️',
      color: '#0ea5e9',
      description: 'Clean grocery bags, packaging polybags, LDPE bubble wraps, and protective films',
      co2SavedPerKg: 0.9,
      approxItemsPerKg: 60
    },
    other_plastics: {
      id: 'other_plastics',
      name: 'Rigid Plastics (HDPE / PP)',
      shortName: 'Rigid Plastics',
      creditsPerKg: 75,
      icon: '📦',
      color: '#f59e0b',
      description: 'Shampoo & detergent containers, milk jugs, bottle caps, plastic tubs & meal trays',
      co2SavedPerKg: 1.2,
      approxItemsPerKg: 20
    },
    aluminum_cans: {
      id: 'aluminum_cans',
      name: 'Aluminum Beverage Cans',
      shortName: 'Aluminum Cans',
      creditsPerKg: 120,
      icon: '🥫',
      color: '#8b5cf6',
      description: 'Soda cans, sparkling water cans, and energy drink aluminum containers',
      co2SavedPerKg: 2.1,
      approxItemsPerKg: 65
    }
  },
  rvmMachines: [
    {
      id: 'RVM-101',
      name: 'Central Metro Station - Exit 2',
      landmark: 'Near Ticket Counter #3',
      status: 'Online & Ready',
      fillStatus: '38% Full',
      color: '#10b981',
      nfcReady: true
    },
    {
      id: 'RVM-102',
      name: 'University Campus Cafeteria',
      landmark: 'Main Quadrangle Entrance',
      status: 'Online & Ready',
      fillStatus: '64% Full',
      color: '#10b981',
      nfcReady: true
    },
    {
      id: 'RVM-103',
      name: 'Phoenix Mall - Ground Atrium',
      landmark: 'Opposite Food Court Escalator',
      status: 'Online & Ready',
      fillStatus: '22% Full',
      color: '#10b981',
      nfcReady: true
    },
    {
      id: 'RVM-104',
      name: 'Tech Park Block 4 Lobby',
      landmark: 'Near Turnstile A',
      status: 'Online & Ready',
      fillStatus: '75% Full',
      color: '#10b981',
      nfcReady: true
    }
  ],
  rewards: [
    {
      id: 'rew_coffee',
      title: 'Artisan Fresh Brew Coffee',
      category: 'food',
      partner: 'Café GreenBean',
      costCredits: 120,
      icon: '☕',
      badge: 'Popular',
      description: 'Enjoy a free hot cappuccino, latte, or espresso at any campus or metro outlet.',
      terms: 'Valid for 30 days from redemption. Show QR coupon at counter.'
    },
    {
      id: 'rew_meal',
      title: 'Healthy Campus Meal Combo',
      category: 'food',
      partner: 'University Cafeteria',
      costCredits: 280,
      icon: '🥪',
      badge: 'Student Favorite',
      description: 'Wholesome salad wrap, whole grain sandwich, plus a cold pressed organic juice.',
      terms: 'Redeemable during lunch hours 12:00 PM - 3:00 PM.'
    },
    {
      id: 'rew_smoothie',
      title: 'Organic Fruit Smoothie (350ml)',
      category: 'food',
      partner: 'BerryBoost Juice Bar',
      costCredits: 150,
      icon: '🥤',
      badge: 'Fresh',
      description: 'Pure 100% natural fruit smoothie made with zero preservatives and compostable cup.',
      terms: 'Available at Phoenix Mall & Tech Park food court branches.'
    },
    {
      id: 'rew_metro',
      title: 'Metro 1-Day Commute Pass',
      category: 'transit',
      partner: 'City Rapid Metro',
      costCredits: 200,
      icon: '🚇',
      badge: 'High Value',
      description: 'Unlimited single-day travel across all Metro routes (Blue, Green, and Purple lines).',
      terms: 'Instant digital ticket code generated. Valid for 24 hours upon activation.'
    },
    {
      id: 'rew_bus',
      title: 'City Smart Bus Recharge Pass',
      category: 'transit',
      partner: 'Green City Transit',
      costCredits: 160,
      icon: '🚌',
      badge: 'Daily Commute',
      description: 'Free ₹80 equivalent bus wallet top-up loaded onto your city smart card.',
      terms: 'Applies automatically to paired smart mobility transit card.'
    },
    {
      id: 'rew_flask',
      title: 'Thermal Stainless Steel Bottle (750ml)',
      category: 'merch',
      partner: 'EcoCash Essentials',
      costCredits: 650,
      icon: '🍶',
      badge: 'Zero-Waste',
      description: 'Double-walled vacuum insulated bottle keeping drinks cold for 24h and hot for 12h.',
      terms: 'Shipped to your registered profile address or collected at RVM hub.'
    },
    {
      id: 'rew_tote',
      title: 'Organic Canvas Eco-Tote Bag',
      category: 'merch',
      partner: 'EcoCash Living',
      costCredits: 350,
      icon: '🛍️',
      badge: 'Eco Lifestyle',
      description: 'Heavyweight 100% unbleached organic cotton tote with reinforced shoulder straps.',
      terms: 'Includes EcoCash embroidered patch. Durable for 5+ years of grocery trips.'
    },
    {
      id: 'rew_tree',
      title: 'Plant 1 Real Native Tree',
      category: 'impact',
      partner: 'Green Canopy Foundation',
      costCredits: 500,
      icon: '🌳',
      badge: 'Verified Impact',
      description: 'We fund and plant a geo-tagged native sapling in urban reforestation zones.',
      terms: 'You receive a digital certificate with exact GPS coordinates and growth updates.'
    },
    {
      id: 'rew_ocean',
      title: 'Ocean Plastic Cleanup (5 kg)',
      category: 'impact',
      partner: 'CleanSeas Initiative',
      costCredits: 250,
      icon: '🌊',
      badge: 'Direct Impact',
      description: 'Sponsor the ethical retrieval and recycling of 5 kg of coastal marine plastic.',
      terms: 'Includes verified blockchain proof-of-removal certificate.'
    },
    {
      id: 'rew_grocery',
      title: '20% Supermarket Grocery Voucher',
      category: 'food',
      partner: 'NatureBasket Supermarkets',
      costCredits: 180,
      icon: '🛒',
      badge: 'Savings',
      description: 'Get flat 20% discount on fresh organic produce, pulses, and pantry essentials.',
      terms: 'Valid on purchases above ₹500 at any participating branch.'
    }
  ],
  transactions: [
    {
      id: 'TXN-80921',
      userId: 'user_1',
      type: 'deposit',
      timestamp: '2026-09-14 14:32',
      date: '14 Sep 2026',
      machineId: 'RVM-102',
      machineLocation: 'University Campus Cafeteria',
      wasteType: 'pet_bottles',
      wasteName: 'PET Bottles',
      weightKg: 1.5,
      itemsEstimated: 35,
      rateCreditsPerKg: 100,
      creditsEarned: 150,
      status: 'Verified & Credited',
      co2SavedKg: 2.25,
      cardUsed: 'ECO-8842-9104-5521'
    },
    {
      id: 'TXN-79450',
      userId: 'user_1',
      type: 'redemption',
      timestamp: '2026-09-12 11:15',
      date: '12 Sep 2026',
      rewardId: 'rew_coffee',
      rewardTitle: 'Artisan Fresh Brew Coffee',
      partner: 'Café GreenBean',
      voucherCode: 'ECO-COF-88429',
      creditsSpent: 120,
      status: 'Voucher Active',
      co2SavedKg: 0
    },
    {
      id: 'TXN-78120',
      userId: 'user_1',
      type: 'deposit',
      timestamp: '2026-09-10 17:40',
      date: '10 Sep 2026',
      machineId: 'RVM-101',
      machineLocation: 'Central Metro Station - Exit 2',
      wasteType: 'carry_bags',
      wasteName: 'Carry Bags',
      weightKg: 2.0,
      itemsEstimated: 40,
      rateCreditsPerKg: 50,
      creditsEarned: 100,
      status: 'Verified & Credited',
      co2SavedKg: 1.80,
      cardUsed: 'ECO-8842-9104-5521'
    },
    {
      id: 'TXN-76504',
      userId: 'user_1',
      type: 'deposit',
      timestamp: '2026-09-08 09:25',
      date: '08 Sep 2026',
      machineId: 'RVM-103',
      machineLocation: 'Phoenix Mall - Ground Atrium',
      wasteType: 'other_plastics',
      wasteName: 'Rigid Plastics',
      weightKg: 3.0,
      itemsEstimated: 25,
      rateCreditsPerKg: 75,
      creditsEarned: 225,
      status: 'Verified & Credited',
      co2SavedKg: 3.60,
      cardUsed: 'ECO-8842-9104-5521'
    },
    {
      id: 'TXN-75102',
      userId: 'user_1',
      type: 'redemption',
      timestamp: '2026-09-06 16:20',
      date: '06 Sep 2026',
      rewardId: 'rew_metro',
      rewardTitle: 'Metro 1-Day Commute Pass',
      partner: 'City Rapid Metro',
      voucherCode: 'ECO-MET-91042',
      creditsSpent: 200,
      status: 'Redeemed & Used',
      co2SavedKg: 0
    },
    {
      id: 'TXN-74112',
      userId: 'user_1',
      type: 'deposit',
      timestamp: '2026-09-05 18:05',
      date: '05 Sep 2026',
      machineId: 'RVM-102',
      machineLocation: 'University Campus Cafeteria',
      wasteType: 'pet_bottles',
      wasteName: 'PET Bottles',
      weightKg: 2.5,
      itemsEstimated: 55,
      rateCreditsPerKg: 100,
      creditsEarned: 250,
      status: 'Verified & Credited',
      co2SavedKg: 3.75,
      cardUsed: 'ECO-8842-9104-5521'
    },
    {
      id: 'TXN-72319',
      userId: 'user_4',
      type: 'deposit',
      timestamp: '2026-09-14 10:12',
      date: '14 Sep 2026',
      machineId: 'RVM-104',
      machineLocation: 'Tech Park Block 4 Lobby',
      wasteType: 'pet_bottles',
      wasteName: 'PET Bottles',
      weightKg: 4.0,
      itemsEstimated: 90,
      rateCreditsPerKg: 100,
      creditsEarned: 400,
      status: 'Verified & Credited',
      co2SavedKg: 6.00,
      cardUsed: 'ECO-9901-5542-1278'
    },
    {
      id: 'TXN-71884',
      userId: 'user_2',
      type: 'deposit',
      timestamp: '2026-09-13 16:45',
      date: '13 Sep 2026',
      machineId: 'RVM-101',
      machineLocation: 'Central Metro Station - Exit 2',
      wasteType: 'aluminum_cans',
      wasteName: 'Aluminum Cans',
      weightKg: 1.5,
      itemsEstimated: 45,
      rateCreditsPerKg: 120,
      creditsEarned: 180,
      status: 'Verified & Credited',
      co2SavedKg: 3.15,
      cardUsed: 'ECO-4419-7201-9034'
    }
  ]
};

class Store {
  constructor() {
    this.state = this.loadState();
    this.listeners = [];
  }

  loadState() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.users && parsed.rateCard && parsed.rewards) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Could not read localStorage:', e);
    }
    // Save fresh initial state
    this.saveState(DEFAULT_INITIAL_STATE);
    return JSON.parse(JSON.stringify(DEFAULT_INITIAL_STATE));
  }

  saveState(stateToSave) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave || this.state));
    } catch (e) {
      console.error('Could not save to localStorage:', e);
    }
  }

  notify() {
    this.saveState();
    this.listeners.forEach(cb => {
      try { cb(this.state); } catch (err) { console.error('Listener error:', err); }
    });
  }

  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  // --- Auth & User State ---
  getCurrentUser() {
    if (!this.state.currentUser) return null;
    return this.state.users.find(u => u.id === this.state.currentUser) || null;
  }

  getAllUsers() {
    return this.state.users;
  }

  setCurrentUser(userId) {
    this.state.currentUser = userId;
    this.notify();
    return this.getCurrentUser();
  }

  login(identifier, password) {
    const cleanId = (identifier || '').trim().toLowerCase();
    const user = this.state.users.find(u => 
      (u.email.toLowerCase() === cleanId || u.phone.replace(/\s+/g, '') === cleanId.replace(/\s+/g, '')) &&
      u.password === password
    );

    if (user) {
      this.state.currentUser = user.id;
      this.notify();
      return { success: true, user };
    }
    return { success: false, error: 'Invalid email/phone or password.' };
  }

  signUp({ name, email, phone, password }) {
    const cleanEmail = email.trim().toLowerCase();
    const existing = this.state.users.find(u => u.email.toLowerCase() === cleanEmail);
    if (existing) {
      return { success: false, error: 'An account with this email already exists.' };
    }

    const randomDigits = Math.floor(1000 + Math.random() * 9000);
    const randomCardSuffix = Math.floor(1000 + Math.random() * 9000);
    const newCardNumber = `ECO-${randomDigits}-${Math.floor(1000 + Math.random() * 9000)}-${randomCardSuffix}`;

    const newUser = {
      id: 'user_' + Date.now(),
      name: name.trim(),
      email: cleanEmail,
      phone: phone.trim(),
      password: password,
      avatar: '🌱',
      joinedDate: new Date().toISOString().split('T')[0],
      creditsBalance: 100, // Welcome bonus credits!
      lifetimeCreditsEarned: 100,
      totalRecycledKg: 0.0,
      bottlesRecycled: 0,
      ecoTier: 'Bronze Recycler',
      ecoCard: {
        cardNumber: newCardNumber,
        cardholderName: name.trim().toUpperCase(),
        expiryDate: '09/31',
        cvv: String(Math.floor(100 + Math.random() * 900)),
        chipUid: `NFC-07:${Math.floor(10 + Math.random() * 89)}:A1:${Math.floor(10 + Math.random() * 89)}:B2`,
        status: 'active',
        dailyTapLimit: 1000,
        tapsToday: 0,
        barcode: newCardNumber.replace(/[^0-9]/g, '')
      },
      unlockedBadges: ['first_bottle', 'nfc_pioneer']
    };

    this.state.users.push(newUser);
    this.state.currentUser = newUser.id;
    this.notify();
    return { success: true, user: newUser };
  }

  logout() {
    this.state.currentUser = null;
    this.notify();
  }

  updateProfile(userId, updates) {
    const userIndex = this.state.users.findIndex(u => u.id === userId);
    if (userIndex === -1) return { success: false, error: 'User not found' };

    const user = this.state.users[userIndex];
    if (updates.name) {
      user.name = updates.name.trim();
      if (user.ecoCard) user.ecoCard.cardholderName = user.name.toUpperCase();
    }
    if (updates.phone) user.phone = updates.phone.trim();
    if (updates.avatar) user.avatar = updates.avatar;

    this.state.users[userIndex] = user;
    this.notify();
    return { success: true, user };
  }

  // --- ATM EcoCard Management ---
  toggleCardStatus(userId) {
    const user = this.state.users.find(u => u.id === userId);
    if (!user || !user.ecoCard) return { success: false, error: 'Card not found.' };

    user.ecoCard.status = user.ecoCard.status === 'active' ? 'frozen' : 'active';
    this.notify();
    return { success: true, status: user.ecoCard.status };
  }

  updateCardLimit(userId, newLimit) {
    const user = this.state.users.find(u => u.id === userId);
    if (!user || !user.ecoCard) return { success: false, error: 'Card not found.' };

    const parsed = parseInt(newLimit, 10);
    if (isNaN(parsed) || parsed < 100) {
      return { success: false, error: 'Daily tap limit must be at least 100 Credits.' };
    }

    user.ecoCard.dailyTapLimit = parsed;
    this.notify();
    return { success: true, dailyTapLimit: parsed };
  }

  replaceEcoCard(userId) {
    const user = this.state.users.find(u => u.id === userId);
    if (!user || !user.ecoCard) return { success: false, error: 'User not found.' };

    const randomDigits = Math.floor(1000 + Math.random() * 9000);
    const newCardNumber = `ECO-${randomDigits}-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`;

    user.ecoCard.cardNumber = newCardNumber;
    user.ecoCard.cvv = String(Math.floor(100 + Math.random() * 900));
    user.ecoCard.chipUid = `NFC-09:${Math.floor(10 + Math.random() * 89)}:C4:${Math.floor(10 + Math.random() * 89)}:E3`;
    user.ecoCard.status = 'active';
    user.ecoCard.tapsToday = 0;
    user.ecoCard.barcode = newCardNumber.replace(/[^0-9]/g, '');

    this.notify();
    return { success: true, ecoCard: user.ecoCard };
  }

  // --- RVM Waste Deposit Simulation ---
  simulateDeposit({ userId, machineId, wasteTypeId, weightKg }) {
    const user = this.state.users.find(u => u.id === userId);
    if (!user) return { success: false, error: 'User not found.' };

    if (user.ecoCard && user.ecoCard.status === 'frozen') {
      return {
        success: false,
        error: 'EcoCard is currently Frozen / Locked! Please unlock your card in the EcoCard Hub before tapping at the RVM machine.'
      };
    }

    const rateInfo = this.state.rateCard[wasteTypeId];
    if (!rateInfo) return { success: false, error: 'Invalid waste material.' };

    const machine = this.state.rvmMachines.find(m => m.id === machineId) || {
      id: machineId || 'RVM-101',
      name: 'Smart Reverse Vending Kiosk'
    };

    const parsedWeight = parseFloat(weightKg);
    if (isNaN(parsedWeight) || parsedWeight <= 0) {
      return { success: false, error: 'Deposit weight must be greater than 0 kg.' };
    }

    const creditsEarned = Math.round(parsedWeight * rateInfo.creditsPerKg);
    const co2Saved = parseFloat((parsedWeight * rateInfo.co2SavedPerKg).toFixed(2));
    const itemsCount = Math.round(parsedWeight * (rateInfo.approxItemsPerKg || 40));

    // Daily Tap Limit check
    if (user.ecoCard && user.ecoCard.dailyTapLimit) {
      const todayTotalEarned = creditsEarned;
      // Soft check or allow with friendly warning
    }

    const now = new Date();
    const dateStr = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    const timeStr = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

    const newTxn = {
      id: 'TXN-' + Math.floor(10000 + Math.random() * 90000),
      userId: user.id,
      type: 'deposit',
      timestamp: `${dateStr} ${timeStr}`,
      date: dateStr,
      machineId: machine.id,
      machineLocation: machine.name,
      wasteType: wasteTypeId,
      wasteName: rateInfo.shortName,
      weightKg: parsedWeight,
      itemsEstimated: itemsCount,
      rateCreditsPerKg: rateInfo.creditsPerKg,
      creditsEarned: creditsEarned,
      status: 'Verified & Credited',
      co2SavedKg: co2Saved,
      cardUsed: user.ecoCard?.cardNumber || 'ECO-NFC-DEFAULT'
    };

    // Update User Wallet & Stats
    user.creditsBalance += creditsEarned;
    user.lifetimeCreditsEarned += creditsEarned;
    user.totalRecycledKg = parseFloat((user.totalRecycledKg + parsedWeight).toFixed(2));
    user.bottlesRecycled = (user.bottlesRecycled || 0) + itemsCount;
    if (user.ecoCard) user.ecoCard.tapsToday = (user.ecoCard.tapsToday || 0) + 1;

    // Update Tier Progress
    if (user.lifetimeCreditsEarned >= 3000 || user.totalRecycledKg >= 30) {
      user.ecoTier = 'Eco Champion';
    } else if (user.lifetimeCreditsEarned >= 1500 || user.totalRecycledKg >= 15) {
      user.ecoTier = 'Gold Recycler';
    } else if (user.lifetimeCreditsEarned >= 600 || user.totalRecycledKg >= 5) {
      user.ecoTier = 'Silver Recycler';
    } else {
      user.ecoTier = 'Bronze Recycler';
    }

    // Insert at front of ledger
    this.state.transactions.unshift(newTxn);
    this.notify();

    return {
      success: true,
      transaction: newTxn,
      user,
      summary: {
        wasteName: rateInfo.shortName,
        weightKg: parsedWeight,
        itemsCount,
        rateCreditsPerKg: rateInfo.creditsPerKg,
        creditsEarned,
        co2Saved
      }
    };
  }

  // --- Rewards Redemption System ---
  redeemReward({ userId, rewardId }) {
    const user = this.state.users.find(u => u.id === userId);
    if (!user) return { success: false, error: 'User not found.' };

    const reward = this.state.rewards.find(r => r.id === rewardId);
    if (!reward) return { success: false, error: 'Reward item not found.' };

    if (user.creditsBalance < reward.costCredits) {
      return {
        success: false,
        error: `Insufficient credits! You have ${user.creditsBalance.toLocaleString()} Credits, but this reward requires ${reward.costCredits.toLocaleString()} Credits.`
      };
    }

    // Deduct Credits
    user.creditsBalance -= reward.costCredits;

    const prefix = reward.category === 'food' ? 'FOOD' : reward.category === 'transit' ? 'RIDE' : reward.category === 'merch' ? 'ECO' : 'TREE';
    const voucherCode = `ECO-${prefix}-${Math.floor(10000 + Math.random() * 90000)}`;

    const now = new Date();
    const dateStr = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    const timeStr = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

    const newTxn = {
      id: 'TXN-' + Math.floor(10000 + Math.random() * 90000),
      userId: user.id,
      type: 'redemption',
      timestamp: `${dateStr} ${timeStr}`,
      date: dateStr,
      rewardId: reward.id,
      rewardTitle: reward.title,
      partner: reward.partner,
      voucherCode: voucherCode,
      creditsSpent: reward.costCredits,
      status: 'Voucher Active',
      co2SavedKg: 0
    };

    this.state.transactions.unshift(newTxn);
    this.notify();

    return {
      success: true,
      reward,
      voucherCode,
      newBalance: user.creditsBalance,
      transaction: newTxn
    };
  }

  // --- Getters & Queries ---
  getUserTransactions(userId) {
    return this.state.transactions.filter(t => t.userId === userId);
  }

  getAllTransactions() {
    return this.state.transactions;
  }

  getRateCard() {
    return this.state.rateCard;
  }

  getRewards() {
    return this.state.rewards;
  }

  getRvmMachines() {
    return this.state.rvmMachines;
  }

  getLeaderboard() {
    // Rank by lifetime credits earned
    return [...this.state.users].sort((a, b) => b.lifetimeCreditsEarned - a.lifetimeCreditsEarned);
  }

  getGlobalImpact() {
    let totalKg = 0;
    let totalCredits = 0;
    let totalCo2 = 0;
    let totalBottles = 0;

    this.state.transactions.forEach(t => {
      if (t.type === 'deposit') {
        totalKg += t.weightKg || 0;
        totalCredits += t.creditsEarned || 0;
        totalCo2 += t.co2SavedKg || 0;
        totalBottles += t.itemsEstimated || 0;
      }
    });

    const baseKg = 2450.0;
    const baseCredits = 245000;
    const baseCo2 = 3675.0;
    const baseBottles = 49000;

    return {
      totalPlasticKg: parseFloat((baseKg + totalKg).toFixed(1)),
      totalCreditsPaid: baseCredits + totalCredits,
      totalCo2SavedKg: parseFloat((baseCo2 + totalCo2).toFixed(1)),
      totalBottlesSaved: baseBottles + totalBottles,
      treesEquivalent: Math.floor((baseCo2 + totalCo2) / 21)
    };
  }

  resetToDefaults() {
    localStorage.removeItem(STORAGE_KEY);
    this.state = JSON.parse(JSON.stringify(DEFAULT_INITIAL_STATE));
    this.notify();
  }
}

// Global store instance
window.ecocashStore = new Store();
