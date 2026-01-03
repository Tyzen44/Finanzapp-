// ============= SWISS FINANCE V2.0 - COMPLETE REWRITE =============
// Clean Architecture | State Management | Auto-Updates | Bug-Free

// ============= CONSTANTS =============
const TABS = [
    { id: 'dashboard', icon: '🏠', label: 'Dashboard' },
    { id: 'overview', icon: '📊', label: 'Übersicht' },
    { id: 'income', icon: '💵', label: 'Einnahmen' },
    { id: 'expenses', icon: '💸', label: 'Ausgaben' },
    { id: 'debts', icon: '📋', label: 'Schulden' },
    { id: 'savings', icon: '🏦', label: 'Sparen' },
    { id: 'wealth', icon: '📈', label: 'Vermögen' },
    { id: 'food', icon: '🛒', label: 'Einkauf' },
    { id: 'settings', icon: '⚙️', label: 'Settings' }
];

const EXPENSE_CATEGORIES = [
    { group: 'Wohnen', items: ['Miete', 'Nebenkosten', 'Strom', 'Heizung', 'Hausrat'] },
    { group: 'Transport', items: ['Auto Leasing', 'Benzin', 'ÖV-Abo', 'Versicherung', 'Parkgebühren'] },
    { group: 'Versicherungen', items: ['Krankenkasse', 'Lebensversicherung', 'Haftpflicht', 'Rechtsschutz'] },
    { group: 'Steuern', items: ['Kantonssteuern', 'Bundessteuern', 'Gemeindesteuer', 'Kirchensteuer', 'Vermögenssteuer', 'Steuern (Gesamt)'] },
    { group: 'Lebensmittel', items: ['Groceries', 'Restaurant', 'Takeaway'] },
    { group: 'Kinder & Familie', items: ['Kinderbetreuung', 'Schule', 'Kita', 'Babysitter', 'Kinderkleidung', 'Spielzeug', 'Windeln', 'Taschengeld'] },
    { group: 'Sparen', items: ['Säule 3a', 'Säule 3b', 'Notgroschen', 'ETFs', 'Aktien', 'Sparkonto'] },
    { group: 'Transfer', items: ['Transfer Gemeinschaftskonto', 'Transfer Sven', 'Transfer Franzi'] },
    { group: 'Sonstiges', items: ['Handy', 'Internet', 'Kleidung', 'Geschenke', 'Diverses', 'Fitness', 'Hobbies'] }
];

// ============= STATE MANAGEMENT =============
class AppState {
    constructor() {
        this.data = {
            currentProfile: 'family',
            profiles: {
                sven: { name: 'Sven', income: 0 },
                franzi: { name: 'Franzi', income: 0 },
                family: { name: 'Familie', income: 0 }
            },
            accounts: {
                sven: { balance: 0, name: 'Sven Privatkonto' },
                franzi: { balance: 0, name: 'Franzi Privatkonto' },
                family: { balance: 0, name: 'Gemeinschaftskonto' }
            },
            expenses: [], // Unified expenses with type: 'fixed' | 'variable'
            debts: [],
            transfers: [], // Track transfers between accounts
            wealthHistory: [],
            foodBudget: {
                monthly: 800,
                purchases: []
            },
            savings: {
                pillar3a: { deposits: [], fundValues: [] },
                investments: []
            },
            settings: {
                emergencyFundMonths: 4 // Default: 4 months
            }
        };
        
        this.listeners = new Set();
        this.github = {
            token: localStorage.getItem('githubToken') || '',
            gistId: localStorage.getItem('gistId') || null
        };
    }

    // Subscribe to state changes
    subscribe(listener) {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }

    // Notify all listeners
    notify() {
        this.listeners.forEach(listener => listener(this.data));
    }

    // Update state
    update(updater) {
        updater(this.data);
        this.save();
        this.notify();
    }

    // Profile filtering helper
    filterByProfile(items, profileKey = 'account') {
        const profile = this.data.currentProfile;
        if (profile === 'family') return items.filter(i => i[profileKey] === 'shared');
        return items.filter(i => i[profileKey] === profile);
    }

    // Get current account balance (including available funds)
    getCurrentBalance() {
        const profile = this.data.currentProfile;
        const account = this.data.accounts[profile];
        if (!account) return 0;

        let available = 0;
        
        // Calculate income from transfers TO this profile
        const getTransferIncome = (targetProfile) => {
            const transferMapping = {
                'family': 'Transfer Gemeinschaftskonto',
                'sven': 'Transfer Sven',
                'franzi': 'Transfer Franzi'
            };
            
            const transferCategory = transferMapping[targetProfile];
            if (!transferCategory) return 0;
            
            // Sum all expenses with this transfer category from OTHER profiles
            return this.data.expenses
                .filter(e => e.active && 
                            e.category === transferCategory && 
                            e.account !== targetProfile)
                .reduce((sum, e) => sum + e.amount, 0);
        };
        
        if (profile !== 'family') {
            // Sven/Franzi: Regular income + incoming transfers
            const regularIncome = this.data.profiles[profile].income;
            const transferIncome = getTransferIncome(profile);
            const totalIncome = regularIncome + transferIncome;
            
            const expenses = this.filterByProfile(this.data.expenses)
                .filter(e => e.active)
                .reduce((sum, e) => sum + e.amount, 0);
            
            available = totalIncome - expenses;
        } else {
            // Familie: Only transfer income
            const transferIncome = getTransferIncome('family');
            
            const expenses = this.filterByProfile(this.data.expenses)
                .filter(e => e.active)
                .reduce((sum, e) => sum + e.amount, 0);
            
            available = transferIncome - expenses;
        }

        return account.balance + available;
    }

    // Save to GitHub Gist
    async save() {
        if (!this.github.token) {
            console.log('No GitHub token - skipping cloud save');
            return;
        }

        try {
            // SAFETY CHECK: Never save empty data if Gist already has data
            if (this.github.gistId) {
                try {
                    const checkResponse = await fetch(`https://api.github.com/gists/${this.github.gistId}`, {
                        headers: { 'Authorization': `token ${this.github.token}` }
                    });
                    
                    if (checkResponse.ok) {
                        const existingGist = await checkResponse.json();
                        const existingContent = existingGist.files['swiss-finance.json']?.content;
                        
                        if (existingContent) {
                            const existing = JSON.parse(existingContent);
                            
                            // Check if we're trying to save empty data over existing data
                            const hasExpenses = this.data.expenses.length > 0;
                            const hasHistory = this.data.wealthHistory.length > 0;
                            const existingHasExpenses = existing.data?.expenses?.length > 0;
                            const existingHasHistory = existing.data?.wealthHistory?.length > 0;
                            
                            if (!hasExpenses && !hasHistory && (existingHasExpenses || existingHasHistory)) {
                                console.warn('⚠️ BLOCKED: Refusing to overwrite existing data with empty data');
                                console.log('Loading existing data instead...');
                                this.data = { ...this.data, ...this.migrateData(existing.data) };
                                this.notify();
                                return false;
                            }
                        }
                    }
                } catch (error) {
                    console.error('Safety check failed:', error);
                }
            }

            const payload = {
                description: '🇨🇭 Swiss Finance - Sven & Franzi (PRIVAT)',
                public: false,
                files: {
                    'swiss-finance.json': {
                        content: JSON.stringify({
                            data: this.data,
                            lastUpdated: new Date().toISOString(),
                            version: '2.1.0'
                        }, null, 2)
                    }
                }
            };

            const url = this.github.gistId 
                ? `https://api.github.com/gists/${this.github.gistId}`
                : 'https://api.github.com/gists';
            
            const method = this.github.gistId ? 'PATCH' : 'POST';

            const response = await fetch(url, {
                method,
                headers: {
                    'Authorization': `token ${this.github.token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                const gist = await response.json();
                if (!this.github.gistId) {
                    this.github.gistId = gist.id;
                    localStorage.setItem('gistId', gist.id);
                }
                console.log('✅ Saved to cloud');
                return true;
            }
        } catch (error) {
            console.error('Save failed:', error);
        }
        return false;
    }

    // Load from GitHub Gist
    async load() {
        if (!this.github.token || !this.github.gistId) {
            console.log('No token/gist - using empty data');
            this.notify(); // IMPORTANT: notify even with empty data
            return;
        }

        try {
            const response = await fetch(`https://api.github.com/gists/${this.github.gistId}`, {
                headers: { 'Authorization': `token ${this.github.token}` }
            });

            if (response.ok) {
                const gist = await response.json();
                const content = gist.files['swiss-finance.json']?.content;
                if (content) {
                    const loaded = JSON.parse(content);
                    let migrated = this.migrateData(loaded.data);
                    this.data = { ...this.data, ...migrated };
                    this.notify();
                    console.log('✅ Loaded from cloud (with migration)');
                }
            } else {
                console.log('Could not load from cloud - using empty state');
                this.notify();
            }
        } catch (error) {
            console.error('Load failed:', error);
            this.notify(); // Ensure UI renders even on error
        }
    }

    // Migrate old data structure to new
    migrateData(oldData) {
        console.log('🔄 Running data migration...');
        
        // Fix: shared → family
        if (oldData.accounts?.shared) {
            oldData.accounts.family = oldData.accounts.shared;
            delete oldData.accounts.shared;
            console.log('  ✓ Renamed account: shared → family');
        }
        
        // Fix: expenses with account="shared" → "family"
        if (oldData.expenses) {
            let fixed = 0;
            oldData.expenses = oldData.expenses.map(exp => {
                if (exp.account === 'shared') {
                    exp.account = 'family';
                    fixed++;
                }
                return exp;
            });
            if (fixed > 0) console.log(`  ✓ Fixed ${fixed} expenses: shared → family`);
        }
        
        // Fix: debts with owner="shared" → "family"
        if (oldData.debts) {
            let fixed = 0;
            oldData.debts = oldData.debts.map(debt => {
                if (debt.owner === 'shared') {
                    debt.owner = 'family';
                    fixed++;
                }
                return debt;
            });
            if (fixed > 0) console.log(`  ✓ Fixed ${fixed} debts: shared → family`);
        }
        
        // Fix: savings investments with account="shared" → "family"
        if (oldData.savings?.investments) {
            let fixed = 0;
            oldData.savings.investments = oldData.savings.investments.map(inv => {
                if (inv.account === 'shared') {
                    inv.account = 'family';
                    fixed++;
                }
                return inv;
            });
            if (fixed > 0) console.log(`  ✓ Fixed ${fixed} investments: shared → family`);
        }
        
        // Fix: wealth history with profile="shared" → "family"
        if (oldData.wealthHistory) {
            let fixed = 0;
            oldData.wealthHistory = oldData.wealthHistory.map(entry => {
                if (entry.profile === 'shared') {
                    entry.profile = 'family';
                    fixed++;
                }
                return entry;
            });
            if (fixed > 0) console.log(`  ✓ Fixed ${fixed} wealth entries: shared → family`);
        }
        
        // Ensure all profiles exist
        if (!oldData.profiles) oldData.profiles = {};
        if (!oldData.profiles.sven) oldData.profiles.sven = { name: 'Sven', income: 0 };
        if (!oldData.profiles.franzi) oldData.profiles.franzi = { name: 'Franzi', income: 0 };
        if (!oldData.profiles.family) oldData.profiles.family = { name: 'Familie', income: 0 };
        
        // Ensure all accounts exist
        if (!oldData.accounts) oldData.accounts = {};
        if (!oldData.accounts.sven) oldData.accounts.sven = { balance: 0, name: 'Sven Privatkonto' };
        if (!oldData.accounts.franzi) oldData.accounts.franzi = { balance: 0, name: 'Franzi Privatkonto' };
        if (!oldData.accounts.family) oldData.accounts.family = { balance: 0, name: 'Gemeinschaftskonto' };
        
        console.log('✅ Migration complete');
        return oldData;
    }

    // Search for existing gist
    async findGist() {
        if (!this.github.token) return null;

        try {
            const response = await fetch('https://api.github.com/gists', {
                headers: { 'Authorization': `token ${this.github.token}` }
            });

            if (response.ok) {
                const gists = await response.json();
                const found = gists.find(g => 
                    g.description?.includes('Swiss Finance') || 
                    g.files['swiss-finance.json']
                );
                if (found) {
                    this.github.gistId = found.id;
                    localStorage.setItem('gistId', found.id);
                    return found;
                }
            }
        } catch (error) {
            console.error('Gist search failed:', error);
        }
        return null;
    }
}

// ============= FINANCIAL ADVISOR =============
class FinancialAdvisor {
    constructor(data, profile) {
        this.data = data;
        this.profile = profile;
        this.PILLAR3A_MAX_2026 = 7258;
    }

    // Get all recommendations
    getRecommendations() {
        const recommendations = [];
        
        // Calculate key metrics
        const income = this.profile === 'family' ? 0 : this.data.profiles[this.profile]?.income || 0;
        const expenses = this.getExpenses();
        const available = income - expenses;
        const debts = this.getDebts();
        const currentBalance = this.getCurrentBalance();
        const notgroschen = this.calculateRequiredEmergencyFund();
        const pillar3aDeposits = this.getPillar3aDepositsThisYear();
        
        // Priority 1: Negative Budget
        if (available < 0) {
            recommendations.push({
                priority: 'critical',
                icon: '🚨',
                title: 'KRITISCH: Ausgaben übersteigen Einkommen',
                message: `Sie geben monatlich CHF ${Math.abs(available).toLocaleString()} mehr aus als Sie verdienen. Dies führt zu Schulden!`,
                action: `Reduzieren Sie sofort Ihre Ausgaben um mindestens CHF ${Math.abs(available).toLocaleString()} oder erhöhen Sie Ihr Einkommen.`,
                category: 'budget'
            });
        }
        
        // Priority 2: High-Interest Debt
        const highInterestDebt = debts.filter(d => d.type === 'Kreditkarte').reduce((s, d) => s + d.amount, 0);
        if (highInterestDebt > 0) {
            recommendations.push({
                priority: 'high',
                icon: '💳',
                title: 'Teure Schulden zuerst abbauen',
                message: `Sie haben CHF ${highInterestDebt.toLocaleString()} Kreditkartenschulden. Diese kosten Sie ~10-15% Zinsen pro Jahr!`,
                action: `Bezahlen Sie Kreditkarten-Schulden mit Priorität ab. Erst danach in Säule 3a oder Investments einzahlen.`,
                category: 'debt',
                savings: Math.round(highInterestDebt * 0.12) // 12% interest per year
            });
        }
        
        // Priority 3: Emergency Fund
        if (currentBalance < notgroschen && available > 0) {
            const missing = notgroschen - currentBalance;
            const months = Math.ceil(missing / available);
            const emergencyMonths = this.data.settings?.emergencyFundMonths || 4;
            recommendations.push({
                priority: 'high',
                icon: '🛡️',
                title: 'Notgroschen aufbauen',
                message: `Ihr Notgroschen sollte CHF ${notgroschen.toLocaleString()} betragen (${emergencyMonths} Monate Fixkosten). Aktuell fehlen CHF ${missing.toLocaleString()}.`,
                action: `Sparen Sie monatlich CHF ${available.toLocaleString()}. In ${months} Monaten erreichen Sie Ihr Ziel. (Einstellung unter Settings anpassbar)`,
                category: 'emergency'
            });
        }
        
        // Priority 4: Pillar 3a Optimization
        if (pillar3aDeposits < this.PILLAR3A_MAX_2026 && available > 0 && debts.length === 0 && currentBalance >= notgroschen) {
            const remaining = this.PILLAR3A_MAX_2026 - pillar3aDeposits;
            const taxSavings = Math.round(remaining * 0.25); // ~25% average tax rate
            recommendations.push({
                priority: 'medium',
                icon: '🏛️',
                title: 'Säule 3a maximal ausschöpfen',
                message: `Sie haben ${new Date().getFullYear()} erst CHF ${pillar3aDeposits.toLocaleString()} in die Säule 3a eingezahlt. Maximum: CHF ${this.PILLAR3A_MAX_2026.toLocaleString()}.`,
                action: `Zahlen Sie noch CHF ${remaining.toLocaleString()} ein und sparen Sie ca. CHF ${taxSavings.toLocaleString()} Steuern!`,
                category: 'pillar3a',
                savings: taxSavings
            });
        }
        
        // Priority 5: Investments
        if (available > 0 && debts.length === 0 && currentBalance >= notgroschen && pillar3aDeposits >= this.PILLAR3A_MAX_2026) {
            recommendations.push({
                priority: 'low',
                icon: '📈',
                title: 'In ETFs / Aktien investieren',
                message: `Glückwunsch! Sie haben Schulden abbezahlt, Notgroschen aufgebaut und Säule 3a maximiert.`,
                action: `Investieren Sie monatlich CHF ${Math.round(available * 0.7).toLocaleString()} in breit diversifizierte ETFs (z.B. MSCI World). Langfristig ~7% Rendite erwartet.`,
                category: 'invest'
            });
        }
        
        // Budget Warning
        if (available > 0 && available < income * 0.1) {
            recommendations.push({
                priority: 'medium',
                icon: '⚠️',
                title: 'Geringes Spar-Potential',
                message: `Sie sparen nur ${(available/income*100).toFixed(1)}% Ihres Einkommens. Experten empfehlen mindestens 10-20%.`,
                action: 'Prüfen Sie Ihre variablen Ausgaben. Können Sie Abos kündigen oder günstiger einkaufen?',
                category: 'budget'
            });
        }
        
        // Positive Feedback
        if (available >= income * 0.2) {
            recommendations.push({
                priority: 'success',
                icon: '✅',
                title: 'Exzellentes Sparverhalten!',
                message: `Sie sparen ${(available/income*100).toFixed(1)}% Ihres Einkommens. Das ist überdurchschnittlich gut!`,
                action: 'Weiter so! Nutzen Sie dieses Geld für langfristigen Vermögensaufbau.',
                category: 'success'
            });
        }
        
        return recommendations.sort((a, b) => {
            const priority = { critical: 0, high: 1, medium: 2, low: 3, success: 4 };
            return priority[a.priority] - priority[b.priority];
        });
    }
    
    getExpenses() {
        const profile = this.profile;
        return this.data.expenses
            .filter(e => e.account === profile && e.active)
            .reduce((sum, e) => sum + e.amount, 0);
    }
    
    getDebts() {
        const profile = this.profile;
        return this.data.debts.filter(d => d.owner === profile);
    }
    
    getCurrentBalance() {
        return this.data.accounts[this.profile]?.balance || 0;
    }
    
    calculateRequiredEmergencyFund() {
        const fixedExpenses = this.data.expenses
            .filter(e => e.account === this.profile && e.active && e.type === 'fixed')
            .reduce((sum, e) => sum + e.amount, 0);
        const months = this.data.settings?.emergencyFundMonths || 4;
        return fixedExpenses * months;
    }
    
    getPillar3aDepositsThisYear() {
        const year = new Date().getFullYear();
        return this.data.savings.pillar3a.deposits
            .filter(d => d.year === year)
            .reduce((sum, d) => sum + d.amount, 0);
    }
}

// ============= APPLICATION =============
class SwissFinanceApp {
    constructor() {
        this.state = new AppState();
        this.currentTab = 'dashboard';
        
        // Subscribe to state changes
        this.state.subscribe(() => this.render());
    }

    async init() {
        try {
            // Try to find existing gist if token is present but no gistId
            if (this.state.github.token && !this.state.github.gistId) {
                console.log('🔍 Searching for existing Gist...');
                const found = await this.state.findGist();
                if (found) {
                    console.log('✅ Found existing Gist:', found.id);
                }
            }
            
            // Load data from Gist (or use empty data)
            await this.state.load();
            
            // Initialize UI
            this.renderNavigation();
            this.renderTab(this.currentTab);
            
            // Set profile selects
            const desktopSelect = document.getElementById('desktop-profile-select');
            const mobileSelect = document.getElementById('mobile-profile-select');
            if (desktopSelect) desktopSelect.value = this.state.data.currentProfile;
            if (mobileSelect) mobileSelect.value = this.state.data.currentProfile;
            
            console.log('✅ Swiss Finance V2 initialized');
        } catch (error) {
            console.error('Init error:', error);
            // Show error in UI
            const container = document.getElementById('tab-content');
            if (container) {
                container.innerHTML = `
                    <div class="tab-content active">
                        <div class="recommendation-card error">
                            <div class="recommendation-title">⚠️ Fehler beim Laden</div>
                            <div class="recommendation-text">
                                ${error.message}<br><br>
                                Bitte Seite neu laden (F5)
                            </div>
                        </div>
                    </div>
                `;
            }
        }
    }

    // Switch profile
    switchProfile(profile) {
        this.state.update(data => {
            data.currentProfile = profile;
        });
        document.getElementById('desktop-profile-select').value = profile;
        document.getElementById('mobile-profile-select').value = profile;
    }

    // Switch tab
    switchTab(tabId) {
        this.currentTab = tabId;
        this.renderTab(tabId);
        
        // Update nav buttons
        document.querySelectorAll('.nav-button, .desktop-nav-item').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabId);
        });
    }

    // Render navigation
    renderNavigation() {
        const desktopNav = document.getElementById('desktop-nav');
        const mobileNav = document.getElementById('mobile-nav');

        const navHTML = TABS.map(tab => `
            <button class="nav-button ${tab.id === this.currentTab ? 'active' : ''}" 
                    data-tab="${tab.id}" 
                    onclick="app.switchTab('${tab.id}')">
                <span class="nav-icon">${tab.icon}</span>
                ${tab.label}
            </button>
        `).join('');

        const desktopNavHTML = TABS.map(tab => `
            <div class="desktop-nav-item ${tab.id === this.currentTab ? 'active' : ''}" 
                 data-tab="${tab.id}" 
                 onclick="app.switchTab('${tab.id}')">
                <span class="nav-icon">${tab.icon}</span>
                <span>${tab.label}</span>
            </div>
        `).join('');

        if (desktopNav) desktopNav.innerHTML = desktopNavHTML;
        if (mobileNav) mobileNav.innerHTML = navHTML;
    }

    // Render current tab
    renderTab(tabId) {
        const container = document.getElementById('tab-content');
        if (!container) return;

        const renderers = {
            dashboard: () => this.renderDashboard(),
            overview: () => this.renderOverview(),
            income: () => this.renderIncome(),
            expenses: () => this.renderExpenses(),
            debts: () => this.renderDebts(),
            savings: () => this.renderSavings(),
            wealth: () => this.renderWealth(),
            food: () => this.renderFood(),
            settings: () => this.renderSettings()
        };

        const renderer = renderers[tabId];
        container.innerHTML = renderer ? renderer() : '<div class="tab-content active"><p>Tab wird geladen...</p></div>';
    }

    // Full render
    render() {
        this.renderTab(this.currentTab);
    }

    // ============= TAB RENDERERS =============

    renderDashboard() {
        const data = this.state.data;
        const profile = data.currentProfile;
        const balance = this.state.getCurrentBalance();
        
        // Helper function to calculate transfer income
        const getTransferIncome = (targetProfile) => {
            const transferMapping = {
                'family': 'Transfer Gemeinschaftskonto',
                'sven': 'Transfer Sven',
                'franzi': 'Transfer Franzi'
            };
            
            const transferCategory = transferMapping[targetProfile];
            if (!transferCategory) return 0;
            
            return data.expenses
                .filter(e => e.active && 
                            e.category === transferCategory && 
                            e.account !== targetProfile)
                .reduce((sum, e) => sum + e.amount, 0);
        };
        
        // Calculate metrics
        const expenses = this.state.filterByProfile(data.expenses)
            .filter(e => e.active)
            .reduce((sum, e) => sum + e.amount, 0);
        
        let income = 0;
        let available = 0;
        
        if (profile === 'family') {
            // Familie: Only transfer income
            income = getTransferIncome('family');
            available = income - expenses;
        } else {
            // Sven/Franzi: Regular income + transfers TO them
            const regularIncome = data.profiles[profile]?.income || 0;
            const transferIncome = getTransferIncome(profile);
            income = regularIncome + transferIncome;
            available = income - expenses;
        }
        
        const debts = this.state.filterByProfile(data.debts, 'owner')
            .reduce((sum, d) => sum + d.amount, 0);
        
        // Get financial advisor recommendations (skip for family)
        let topRec = null;
        let recommendations = [];
        if (profile !== 'family') {
            const advisor = new FinancialAdvisor(data, profile);
            recommendations = advisor.getRecommendations();
            topRec = recommendations[0];
        }

        return `
            <div class="tab-content active">
                <h2 style="margin-bottom: 24px;">Dashboard</h2>
                
                <div class="dashboard-grid">
                    <!-- Balance Card -->
                    <div class="account-card full-width">
                        <div class="account-header">
                            <div class="account-title">${data.accounts[profile].name}</div>
                            <button class="action-btn edit" onclick="app.editBalance()">✏️</button>
                        </div>
                        <div class="account-balance-hero">CHF ${data.accounts[profile].balance.toLocaleString()}</div>
                        <div class="account-details">Aktueller Kontostand</div>
                        
                        <button onclick="app.editBalance()" class="btn btn-secondary" style="width: 100%; margin-top: 12px; font-size: 14px;">
                            ✏️ Kontostand manuell anpassen
                        </button>
                        
                        ${available !== 0 ? `
                            <div style="margin-top: 12px; padding: 12px; background: ${available > 0 ? 'rgba(40, 167, 69, 0.1)' : 'rgba(220, 53, 69, 0.1)'}; border-radius: 8px;">
                                <div style="font-size: 13px; color: #666;">Voraussichtlich nach Monatsabschluss:</div>
                                <div style="font-size: 20px; font-weight: 600; color: ${available > 0 ? '#28a745' : '#dc3545'}; margin-top: 4px;">
                                    CHF ${balance.toLocaleString()} 
                                    <span style="font-size: 14px;">(${available > 0 ? '+' : ''}${available.toLocaleString()})</span>
                                </div>
                            </div>
                        ` : ''}
                        
                        <div style="background: #e3f2fd; padding: 10px; border-radius: 6px; margin-top: 12px; font-size: 12px; color: #666;">
                            💡 <strong>Tipp:</strong> Passen Sie Ihren Kontostand jederzeit manuell an, um ihn mit Ihrem echten Bankkonto zu synchronisieren!
                        </div>
                    </div>

                    <!-- Metrics -->
                    <div class="metric-card">
                        <div class="metric-label">${profile === 'family' ? 'Transfer-Einnahmen' : 'Monatlich verfügbar'}</div>
                        <div class="metric-value ${available < 0 ? 'negative' : ''}">
                            CHF ${(profile === 'family' ? income : available).toLocaleString()}
                        </div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-label">Offene Schulden</div>
                        <div class="metric-value ${debts > 0 ? 'negative' : ''}">CHF ${debts.toLocaleString()}</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-label">Ausgaben</div>
                        <div class="metric-value">CHF ${expenses.toLocaleString()}</div>
                    </div>
                </div>

                ${topRec ? `
                    <div class="recommendation-card ${topRec.priority === 'critical' ? 'error' : topRec.priority === 'high' ? 'warning' : topRec.priority === 'success' ? 'success' : 'info'}">
                        <div class="recommendation-title">${topRec.icon} ${topRec.title}</div>
                        <div class="recommendation-text">
                            <strong>${topRec.message}</strong><br><br>
                            💡 <strong>Empfehlung:</strong> ${topRec.action}
                            ${topRec.savings ? `<br><br>💰 <strong>Ersparnis:</strong> ca. CHF ${topRec.savings.toLocaleString()} pro Jahr` : ''}
                        </div>
                        ${recommendations.length > 1 ? `
                            <button onclick="app.showAllRecommendations()" class="btn btn-secondary" style="margin-top: 12px; width: 100%;">
                                📋 Alle ${recommendations.length} Empfehlungen anzeigen
                            </button>
                        ` : ''}
                    </div>
                ` : ''}
                
                ${profile === 'family' ? `
                    <div class="recommendation-card info">
                        <div class="recommendation-title">👥 Gemeinschaftskonto</div>
                        <div class="recommendation-text">
                            <strong>Transfer-Einnahmen:</strong> CHF ${income.toLocaleString()}/Monat<br>
                            <strong>Ausgaben:</strong> CHF ${expenses.toLocaleString()}/Monat<br>
                            <strong>Verfügbar:</strong> CHF ${available.toLocaleString()}/Monat<br><br>
                            
                            💡 Transfers werden als <strong>Ausgaben</strong> bei Sven/Franzi mit Kategorie "Transfer Gemeinschaftskonto" erfasst.
                        </div>
                    </div>
                ` : ''}

                <!-- Quick Actions -->
                <div class="dashboard-actions">
                    <button class="action-card" onclick="app.switchTab('income')">
                        <div class="action-icon">💰</div>
                        <div class="action-label">Gehalt</div>
                    </button>
                    <button class="action-card" onclick="app.switchTab('expenses')">
                        <div class="action-icon">💸</div>
                        <div class="action-label">Ausgaben</div>
                    </button>
                    <button class="action-card" onclick="app.switchTab('wealth')">
                        <div class="action-icon">📊</div>
                        <div class="action-label">Monat abschließen</div>
                    </button>
                    <button class="action-card" onclick="app.syncNow()">
                        <div class="action-icon">🔄</div>
                        <div class="action-label">Sync</div>
                    </button>
                </div>
            </div>
        `;
    }

    renderOverview() {
        const data = this.state.data;
        const profile = data.currentProfile;
        const balance = this.state.getCurrentBalance();
        
        const expenses = this.state.filterByProfile(data.expenses)
            .filter(e => e.active);
        
        const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
        
        // Helper function to calculate transfer income
        const getTransferIncome = (targetProfile) => {
            const transferMapping = {
                'family': 'Transfer Gemeinschaftskonto',
                'sven': 'Transfer Sven',
                'franzi': 'Transfer Franzi'
            };
            
            const transferCategory = transferMapping[targetProfile];
            if (!transferCategory) return 0;
            
            return data.expenses
                .filter(e => e.active && 
                            e.category === transferCategory && 
                            e.account !== targetProfile)
                .reduce((sum, e) => sum + e.amount, 0);
        };
        
        let income = 0;
        if (profile === 'family') {
            income = getTransferIncome('family');
        } else {
            const regularIncome = data.profiles[profile]?.income || 0;
            const transferIncome = getTransferIncome(profile);
            income = regularIncome + transferIncome;
        }
        
        const available = income - totalExpenses;

        // Group by category
        const byCategory = {};
        expenses.forEach(exp => {
            byCategory[exp.category] = (byCategory[exp.category] || 0) + exp.amount;
        });

        // Generate unique chart ID
        const chartId = 'expenseChart-' + Date.now();

        // Chart will be rendered after DOM update
        setTimeout(() => {
            const canvas = document.getElementById(chartId);
            if (canvas && typeof Chart !== 'undefined') {
                const ctx = canvas.getContext('2d');
                
                // Destroy existing chart if any
                if (canvas.chart) {
                    canvas.chart.destroy();
                }
                
                const categories = Object.keys(byCategory);
                const amounts = Object.values(byCategory);
                
                canvas.chart = new Chart(ctx, {
                    type: 'pie',
                    data: {
                        labels: categories,
                        datasets: [{
                            data: amounts,
                            backgroundColor: [
                                '#4facfe', '#00f2fe', '#43e97b', '#38f9d7',
                                '#fa709a', '#fee140', '#30cfd0', '#330867',
                                '#a8edea', '#fed6e3', '#ff6b6b', '#4ecdc4'
                            ]
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: true,
                        plugins: {
                            legend: {
                                position: 'bottom',
                                labels: {
                                    boxWidth: 12,
                                    font: { size: 11 }
                                }
                            },
                            tooltip: {
                                callbacks: {
                                    label: function(context) {
                                        const label = context.label || '';
                                        const value = context.parsed || 0;
                                        const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                        const percentage = ((value / total) * 100).toFixed(1);
                                        return `${label}: CHF ${value.toLocaleString()} (${percentage}%)`;
                                    }
                                }
                            }
                        }
                    }
                });
            }
        }, 100);

        return `
            <div class="tab-content active">
                <div class="balance-hero">
                    <div class="balance-label">Kontostand ${data.accounts[profile].name}</div>
                    <div class="balance-amount">CHF ${data.accounts[profile].balance.toLocaleString()}</div>
                    <div class="balance-trend">${available >= 0 ? '📈' : '📉'} CHF ${available.toLocaleString()} monatlich verfügbar</div>
                </div>

                <div class="quick-stats">
                    <div class="quick-stat">
                        <div class="quick-stat-icon">💰</div>
                        <div class="quick-stat-value">${income.toLocaleString()}</div>
                        <div class="quick-stat-label">Einkommen</div>
                    </div>
                    <div class="quick-stat">
                        <div class="quick-stat-icon">💸</div>
                        <div class="quick-stat-value">${totalExpenses.toLocaleString()}</div>
                        <div class="quick-stat-label">Ausgaben</div>
                    </div>
                    <div class="quick-stat">
                        <div class="quick-stat-icon">✅</div>
                        <div class="quick-stat-value">${available.toLocaleString()}</div>
                        <div class="quick-stat-label">Verfügbar</div>
                    </div>
                </div>

                ${Object.keys(byCategory).length > 0 ? `
                    <div class="settings-group">
                        <div class="settings-title">📊 Ausgaben nach Kategorien</div>
                        <div style="max-width: 400px; margin: 0 auto;">
                            <canvas id="${chartId}"></canvas>
                        </div>
                    </div>
                ` : ''}

                <div class="settings-group">
                    <div class="settings-title">📋 Detailliste</div>
                    ${Object.entries(byCategory)
                        .sort((a, b) => b[1] - a[1])
                        .map(([cat, amount]) => {
                            const percent = income > 0 ? (amount / income * 100).toFixed(1) : 0;
                            return `
                                <div class="expense-item">
                                    <div class="expense-header">
                                        <div class="expense-info">
                                            <div class="expense-name">${cat}</div>
                                            <div class="expense-category">${percent}% des Einkommens</div>
                                        </div>
                                        <div class="expense-amount">CHF ${amount.toLocaleString()}</div>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                </div>
            </div>
        `;
    }

    renderIncome() {
        const data = this.state.data;
        const profile = data.currentProfile;
        
        if (profile === 'family') {
            // Get all "Transfer Gemeinschaftskonto" expenses from other profiles
            const transferExpenses = data.expenses.filter(e => 
                e.active && 
                e.category === 'Transfer Gemeinschaftskonto' && 
                e.account !== 'family'
            );
            const totalIncome = transferExpenses.reduce((sum, e) => sum + e.amount, 0);
            
            return `
                <div class="tab-content active">
                    <div class="recommendation-card info">
                        <div class="recommendation-title">👥 Gemeinschaftskonto - Einnahmen</div>
                        <div class="recommendation-text">
                            Das Gemeinschaftskonto hat <strong>kein Gehalt</strong>, sondern erhält monatliche Transfers als <strong>Ausgaben</strong> von Sven und Franzi.<br><br>
                            
                            💡 <strong>So funktioniert's:</strong><br>
                            1. Wechsel zu Sven oder Franzi<br>
                            2. Gehe zu "Ausgaben" → "Fixe Ausgaben"<br>
                            3. Füge Ausgabe hinzu: Kategorie "Transfer Gemeinschaftskonto"<br>
                            4. Diese Ausgabe erscheint hier als Einnahme!
                        </div>
                    </div>
                    
                    ${transferExpenses.length === 0 ? `
                        <div class="recommendation-card warning">
                            <div class="recommendation-title">⚠️ Noch keine Transfers eingerichtet</div>
                            <div class="recommendation-text">
                                Wechseln Sie zu <strong>Sven</strong> oder <strong>Franzi</strong> und fügen Sie bei <strong>Ausgaben</strong> eine Ausgabe mit Kategorie "Transfer Gemeinschaftskonto" hinzu.
                            </div>
                        </div>
                    ` : `
                        <div class="settings-group">
                            <div class="settings-title">💰 Monatliche Transfer-Einnahmen</div>
                            
                            ${transferExpenses.map(exp => {
                                const fromName = data.accounts[exp.account]?.name || exp.account;
                                return `
                                    <div class="expense-item">
                                        <div class="expense-header">
                                            <div class="expense-info">
                                                <div class="expense-name">Transfer von ${fromName}</div>
                                                <div class="expense-category">${exp.name}</div>
                                            </div>
                                            <div class="expense-amount">CHF ${exp.amount.toLocaleString()}</div>
                                        </div>
                                    </div>
                                `;
                            }).join('')}
                            
                            <div class="total-card">
                                <div class="total-amount">CHF ${totalIncome.toLocaleString()}</div>
                                <div class="total-label">Gesamte monatliche Einnahmen</div>
                            </div>
                        </div>
                    `}
                </div>
            `;
        }

        const currentIncome = data.profiles[profile].income;
        const expenses = this.state.filterByProfile(data.expenses).filter(e => e.active);
        const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
        const available = currentIncome - totalExpenses;

        return `
            <div class="tab-content active">
                <div class="salary-section">
                    <h2 style="font-size: 28px; margin-bottom: 24px;">💰 Monatliches Gehalt</h2>
                    
                    <div style="background: rgba(255,255,255,0.15); padding: 24px; border-radius: 12px; margin-bottom: 24px;">
                        <input type="number" 
                               id="income-input" 
                               value="${currentIncome || ''}"
                               placeholder="z.B. 6500"
                               style="background: white; border: none; border-radius: 8px; padding: 16px; font-size: 32px; font-weight: 700; text-align: center; color: #059669; width: 100%;">
                    </div>

                    <div style="background: rgba(255,255,255,0.1); padding: 16px; border-radius: 8px; margin-bottom: 16px;">
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                            <div>
                                <div style="font-size: 12px; opacity: 0.9;">Ausgaben</div>
                                <div style="font-size: 20px; font-weight: 600;">CHF ${totalExpenses.toLocaleString()}</div>
                            </div>
                            <div>
                                <div style="font-size: 12px; opacity: 0.9;">Verfügbar</div>
                                <div style="font-size: 20px; font-weight: 600;">CHF ${available.toLocaleString()}</div>
                            </div>
                        </div>
                    </div>

                    <button onclick="app.saveIncome()" class="salary-button" style="width: 100%;">
                        💾 Gehalt speichern
                    </button>
                </div>

                <div class="settings-group">
                    <div class="settings-title">📜 Historie</div>
                    <p style="text-align: center; color: #666; padding: 20px;">
                        Aktuelles Gehalt: CHF ${currentIncome.toLocaleString()}
                    </p>
                </div>
            </div>
        `;
    }

    renderExpenses() {
        const data = this.state.data;
        const expenses = this.state.filterByProfile(data.expenses);
        
        const fixed = expenses.filter(e => e.type === 'fixed');
        const variable = expenses.filter(e => e.type === 'variable');
        
        const fixedTotal = fixed.filter(e => e.active).reduce((sum, e) => sum + e.amount, 0);
        const variableTotal = variable.filter(e => e.active).reduce((sum, e) => sum + e.amount, 0);

        return `
            <div class="tab-content active">
                <!-- Fixed Expenses -->
                <div class="expense-section">
                    <div class="section-header">
                        <div class="section-title">🏢 Fixe Ausgaben</div>
                        <button class="add-button" onclick="app.addExpense('fixed')">
                            <span>➕</span>
                            <span>Hinzufügen</span>
                        </button>
                    </div>
                    
                    ${fixed.length === 0 ? '<p style="text-align: center; color: #666; padding: 20px;">Noch keine fixen Ausgaben</p>' : 
                        fixed.map(exp => this.renderExpenseItem(exp)).join('')
                    }
                    
                    <div class="total-card">
                        <div class="total-amount">CHF ${fixedTotal.toLocaleString()}</div>
                        <div class="total-label">Summe Fixkosten</div>
                    </div>
                </div>

                <!-- Variable Expenses -->
                <div class="expense-section">
                    <div class="section-header">
                        <div class="section-title">🛒 Variable Ausgaben</div>
                        <button class="add-button" onclick="app.addExpense('variable')">
                            <span>➕</span>
                            <span>Hinzufügen</span>
                        </button>
                    </div>
                    
                    ${variable.length === 0 ? '<p style="text-align: center; color: #666; padding: 20px;">Noch keine variablen Ausgaben</p>' : 
                        variable.map(exp => this.renderExpenseItem(exp)).join('')
                    }
                    
                    <div class="total-card" style="background: linear-gradient(135deg, #f39c12, #e67e22);">
                        <div class="total-amount">CHF ${variableTotal.toLocaleString()}</div>
                        <div class="total-label">Summe variable Kosten</div>
                    </div>
                </div>
            </div>
        `;
    }

    renderExpenseItem(exp) {
        const date = exp.date ? new Date(exp.date).toLocaleDateString('de-CH') : '-';
        
        return `
            <div class="expense-item" style="${exp.active ? '' : 'opacity: 0.5;'}">
                <div class="expense-header">
                    <div class="expense-info">
                        <div class="expense-name" style="${exp.active ? '' : 'text-decoration: line-through;'}">
                            ${exp.name}
                        </div>
                        <div class="expense-category">${exp.category} • ${date}</div>
                    </div>
                    <div class="expense-amount">CHF ${exp.amount.toLocaleString()}</div>
                    <div class="expense-actions">
                        <button class="action-btn edit" onclick="app.editExpense(${exp.id})" title="Bearbeiten">✏️</button>
                        <button class="action-btn toggle" onclick="app.toggleExpense(${exp.id})" title="${exp.active ? 'Deaktivieren' : 'Aktivieren'}">
                            ${exp.active ? '👁️' : '👁️‍🗨️'}
                        </button>
                        <button class="action-btn delete" onclick="app.deleteExpense(${exp.id})" title="Löschen">🗑️</button>
                    </div>
                </div>
            </div>
        `;
    }

    renderDebts() {
        const data = this.state.data;
        const debts = this.state.filterByProfile(data.debts, 'owner');
        const total = debts.reduce((sum, d) => sum + d.amount, 0);

        return `
            <div class="tab-content active">
                <div class="expense-section">
                    <div class="section-header">
                        <div class="section-title">📋 Offene Schulden</div>
                        <button class="add-button" onclick="app.addDebt()">
                            <span>➕</span>
                            <span>Hinzufügen</span>
                        </button>
                    </div>
                    
                    ${debts.length === 0 ? '<p style="text-align: center; color: #666; padding: 20px;">Keine offenen Schulden</p>' :
                        debts.map(debt => {
                            const dueDate = debt.dueDate ? new Date(debt.dueDate) : null;
                            const isOverdue = dueDate && dueDate < new Date();
                            
                            return `
                                <div class="debt-item ${isOverdue ? 'overdue' : ''}">
                                    <div class="debt-header">
                                        <div class="debt-info">
                                            <div class="debt-name">${debt.name}</div>
                                            <div class="debt-due-date">
                                                ${debt.type} 
                                                ${dueDate ? `• Fällig: ${dueDate.toLocaleDateString('de-CH')}` : ''}
                                                ${isOverdue ? ' ⚠️ ÜBERFÄLLIG' : ''}
                                            </div>
                                        </div>
                                        <div class="debt-amount">CHF ${debt.amount.toLocaleString()}</div>
                                        <div class="expense-actions">
                                            <button class="action-btn edit" onclick="app.editDebt(${debt.id})">✏️</button>
                                            <button class="action-btn delete" onclick="app.deleteDebt(${debt.id})">🗑️</button>
                                        </div>
                                    </div>
                                </div>
                            `;
                        }).join('')
                    }
                    
                    <div class="total-card" style="background: linear-gradient(135deg, #e74c3c, #c0392b);">
                        <div class="total-amount">CHF ${total.toLocaleString()}</div>
                        <div class="total-label">Summe offene Schulden</div>
                    </div>
                </div>
            </div>
        `;
    }

    renderSavings() {
        const data = this.state.data;
        const pillar3a = data.savings.pillar3a;
        const investments = this.state.filterByProfile(data.savings.investments);
        
        const totalDeposits = pillar3a.deposits
            .filter(d => d.year === new Date().getFullYear())
            .reduce((sum, d) => sum + d.amount, 0);
        
        const lastFundValue = pillar3a.fundValues[pillar3a.fundValues.length - 1];
        const currentValue = lastFundValue?.endValue || 0;
        
        // Get recent deposits (last 6)
        const recentDeposits = pillar3a.deposits
            .slice()
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, 6);

        return `
            <div class="tab-content active">
                <div class="settings-group">
                    <div class="settings-title">🏛️ Säule 3a</div>
                    
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px;">
                        <div class="expense-item" style="text-align: center; padding: 20px;">
                            <div class="expense-category">Aktueller Fondswert</div>
                            <div class="expense-amount" style="font-size: 24px; color: #4facfe;">
                                CHF ${currentValue.toLocaleString()}
                            </div>
                        </div>
                        
                        <div class="expense-item" style="text-align: center; padding: 20px;">
                            <div class="expense-category">Eingezahlt ${new Date().getFullYear()}</div>
                            <div class="expense-amount" style="font-size: 24px;">
                                CHF ${totalDeposits.toLocaleString()}
                            </div>
                            <div style="font-size: 12px; color: #666; margin-top: 4px;">
                                von CHF 7'258 Maximum
                            </div>
                        </div>
                    </div>
                    
                    ${recentDeposits.length > 0 ? `
                        <div style="margin-bottom: 20px;">
                            <h4 style="font-size: 14px; color: #666; margin-bottom: 12px;">Letzte Einzahlungen:</h4>
                            ${recentDeposits.map(d => {
                                const depositDate = new Date(d.date);
                                const monthYear = depositDate.toLocaleDateString('de-CH', { month: 'long', year: 'numeric' });
                                return `
                                    <div class="expense-item" style="margin-bottom: 8px;">
                                        <div class="expense-header">
                                            <div class="expense-info">
                                                <div class="expense-name">${monthYear}</div>
                                                <div class="expense-category">${d.autoAdded ? '🤖 Automatisch hinzugefügt' : '✏️ Manuell eingetragen'}</div>
                                            </div>
                                            <div class="expense-amount">CHF ${d.amount.toLocaleString()}</div>
                                        </div>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    ` : ''}

                    <button onclick="app.addPillar3aValue()" class="btn btn-primary" style="width: 100%;">
                        📈 Fondswert manuell eintragen
                    </button>
                </div>

                <div class="settings-group">
                    <div class="settings-title">💎 Weitere Investments</div>
                    
                    ${investments.length === 0 ? '<p style="text-align: center; color: #666; padding: 20px;">Noch keine Investments</p>' :
                        investments.map(inv => `
                            <div class="expense-item">
                                <div class="expense-header">
                                    <div class="expense-info">
                                        <div class="expense-name">${inv.type} ${inv.name}</div>
                                        <div class="expense-category">
                                            Investiert: CHF ${inv.invested.toLocaleString()} | 
                                            Wert: CHF ${inv.currentValue.toLocaleString()}
                                        </div>
                                    </div>
                                    <div class="expense-amount" style="color: ${inv.performance >= 0 ? '#28a745' : '#dc3545'}">
                                        ${inv.performance >= 0 ? '+' : ''}${inv.performance.toFixed(2)}%
                                    </div>
                                </div>
                            </div>
                        `).join('')
                    }
                    
                    <button onclick="app.addInvestment()" class="btn btn-primary" style="width: 100%; margin-top: 16px;">
                        ➕ Investment hinzufügen
                    </button>
                </div>
                
                <div class="recommendation-card info">
                    <div class="recommendation-title">💡 Automatische Säule 3a Einträge</div>
                    <div class="recommendation-text">
                        Wenn Sie bei <strong>Ausgaben</strong> (Fix oder Variabel) eine Ausgabe mit Kategorie "Säule 3a" erstellen, wird diese beim <strong>Monatsabschluss automatisch</strong> hier für den Folgemonat eingetragen.<br><br>
                        
                        <strong>Beispiel:</strong> Monatsabschluss am 25. Januar → Säule 3a Eintrag für Februar wird automatisch erstellt.
                    </div>
                </div>
            </div>
        `;
    }

    renderWealth() {
        const data = this.state.data;
        const profile = data.currentProfile;
        const history = data.wealthHistory.filter(h => h.profile === profile);
        const balance = this.state.getCurrentBalance();

        // Chart ID
        const chartId = 'wealthChart-' + Date.now();
        const surplusChartId = 'surplusChart-' + Date.now();

        // Render wealth chart after DOM update
        if (history.length > 0) {
            setTimeout(() => {
                const canvas = document.getElementById(chartId);
                if (canvas && typeof Chart !== 'undefined') {
                    const ctx = canvas.getContext('2d');
                    
                    if (canvas.chart) {
                        canvas.chart.destroy();
                    }
                    
                    const labels = history.map(h => h.month);
                    const balances = history.map(h => h.totalBalance);
                    
                    canvas.chart = new Chart(ctx, {
                        type: 'line',
                        data: {
                            labels,
                            datasets: [{
                                label: 'Vermögen',
                                data: balances,
                                borderColor: '#4facfe',
                                backgroundColor: 'rgba(79, 172, 254, 0.1)',
                                tension: 0.4,
                                fill: true
                            }]
                        },
                        options: {
                            responsive: true,
                            maintainAspectRatio: true,
                            plugins: {
                                legend: {
                                    display: false
                                },
                                tooltip: {
                                    callbacks: {
                                        label: function(context) {
                                            return 'CHF ' + context.parsed.y.toLocaleString();
                                        }
                                    }
                                }
                            },
                            scales: {
                                y: {
                                    beginAtZero: true,
                                    ticks: {
                                        callback: function(value) {
                                            return 'CHF ' + value.toLocaleString();
                                        }
                                    }
                                }
                            }
                        }
                    });
                }
            }, 100);
            
            // Render surplus chart
            setTimeout(() => {
                const canvas = document.getElementById(surplusChartId);
                if (canvas && typeof Chart !== 'undefined') {
                    const ctx = canvas.getContext('2d');
                    
                    if (canvas.chart) {
                        canvas.chart.destroy();
                    }
                    
                    const labels = history.map(h => h.month);
                    const surplus = history.map(h => h.balance);
                    
                    canvas.chart = new Chart(ctx, {
                        type: 'bar',
                        data: {
                            labels,
                            datasets: [{
                                label: 'Monatlicher Überschuss',
                                data: surplus,
                                backgroundColor: surplus.map(s => s >= 0 ? 'rgba(40, 167, 69, 0.7)' : 'rgba(220, 53, 69, 0.7)'),
                                borderColor: surplus.map(s => s >= 0 ? '#28a745' : '#dc3545'),
                                borderWidth: 2
                            }]
                        },
                        options: {
                            responsive: true,
                            maintainAspectRatio: true,
                            plugins: {
                                legend: {
                                    display: false
                                },
                                tooltip: {
                                    callbacks: {
                                        label: function(context) {
                                            const value = context.parsed.y;
                                            return (value >= 0 ? '+' : '') + 'CHF ' + value.toLocaleString();
                                        }
                                    }
                                }
                            },
                            scales: {
                                y: {
                                    beginAtZero: true,
                                    ticks: {
                                        callback: function(value) {
                                            return 'CHF ' + value.toLocaleString();
                                        }
                                    }
                                }
                            }
                        }
                    });
                }
            }, 100);
        }
        
        // Calculate average surplus
        const avgSurplus = history.length > 0 
            ? history.reduce((sum, h) => sum + h.balance, 0) / history.length 
            : 0;

        return `
            <div class="tab-content active">
                <div class="settings-group">
                    <div class="settings-title">📈 Vermögensentwicklung</div>
                    
                    <div style="text-align: center; margin: 20px 0;">
                        <div style="font-size: 32px; font-weight: bold; color: #4facfe; margin-bottom: 10px;">
                            CHF ${data.accounts[profile].balance.toLocaleString()}
                        </div>
                        <p style="color: #666; margin-bottom: 20px;">Aktueller Kontostand</p>
                        
                        <button class="btn btn-primary" onclick="app.closeMonth()" style="width: 100%;">
                            📊 Monat abschließen & speichern
                        </button>
                        
                        <div style="background: #e3f2fd; padding: 12px; border-radius: 8px; margin-top: 16px; font-size: 13px; text-align: left;">
                            <strong>💡 Ablauf Monatsabschluss:</strong><br>
                            1️⃣ System fragt nach Ihrem <strong>tatsächlichen Gehalt</strong> (kann jeden Monat variieren)<br>
                            2️⃣ Überschuss = Gehalt - Ausgaben<br>
                            3️⃣ Überschuss wird zu Ihrem <strong>Kontostand hinzugefügt</strong><br>
                            4️⃣ Variable Ausgaben werden gelöscht<br>
                            5️⃣ Säule 3a Ausgaben werden automatisch für nächsten Monat eingetragen
                        </div>
                    </div>
                </div>

                ${history.length > 0 ? `
                    <div class="settings-group">
                        <div class="settings-title">💰 Monatlicher Überschuss</div>
                        
                        <div style="text-align: center; margin-bottom: 16px;">
                            <div style="font-size: 24px; font-weight: bold; color: ${avgSurplus >= 0 ? '#28a745' : '#dc3545'};">
                                Ø ${avgSurplus >= 0 ? '+' : ''}CHF ${avgSurplus.toFixed(0).toLocaleString()}
                            </div>
                            <div style="font-size: 12px; color: #666;">Durchschnittlicher monatlicher Überschuss</div>
                        </div>
                        
                        <div style="max-width: 600px; margin: 0 auto 20px;">
                            <canvas id="${surplusChartId}"></canvas>
                        </div>
                        
                        <div style="background: #fff3cd; padding: 12px; border-radius: 8px; font-size: 13px;">
                            <strong>📊 Überschuss-Berechnung:</strong> Gehalt - Alle Ausgaben = Überschuss<br>
                            Der Überschuss wird am Monatsende automatisch zu Ihrem Kontostand hinzugefügt.
                        </div>
                    </div>
                    
                    <div class="settings-group">
                        <div class="settings-title">📊 Vermögensverlauf</div>
                        <div style="max-width: 600px; margin: 0 auto 20px;">
                            <canvas id="${chartId}"></canvas>
                        </div>
                    </div>
                ` : ''}

                <div class="settings-group">
                    <div class="settings-title">📜 Verlaufsdaten</div>
                    
                    ${history.length === 0 ? 
                        '<p style="text-align: center; color: #666; padding: 20px;">Noch keine Verlaufsdaten. Schließen Sie Ihren ersten Monat ab!</p>' :
                        history.slice().reverse().slice(0, 12).map(entry => `
                            <div class="expense-item">
                                <div class="expense-header">
                                    <div class="expense-info">
                                        <div class="expense-name">${entry.month}</div>
                                        <div class="expense-category">
                                            Gehalt: CHF ${entry.income.toLocaleString()} | 
                                            Ausgaben: CHF ${entry.expenses.toLocaleString()}
                                        </div>
                                    </div>
                                    <div class="expense-amount" style="color: ${entry.balance >= 0 ? '#28a745' : '#dc3545'}">
                                        <div style="font-weight: bold;">${entry.balance >= 0 ? '+' : ''}CHF ${entry.balance.toLocaleString()}</div>
                                        <div style="font-size: 11px; color: #666; margin-top: 2px;">Überschuss</div>
                                        <div style="font-size: 12px; color: #666; margin-top: 4px; border-top: 1px solid #eee; padding-top: 4px;">Stand: CHF ${entry.totalBalance.toLocaleString()}</div>
                                    </div>
                                </div>
                            </div>
                        `).join('')
                    }
                </div>
            </div>
        `;
    }

    renderFood() {
        const data = this.state.data;
        const currentMonth = new Date().toISOString().slice(0, 7);
        const purchases = data.foodBudget.purchases.filter(p => p.month === currentMonth);
        const spent = purchases.reduce((sum, p) => sum + p.amount, 0);
        const budget = data.foodBudget.monthly;
        const remaining = budget - spent;
        const percentage = (spent / budget * 100).toFixed(0);

        return `
            <div class="tab-content active">
                <div class="settings-group">
                    <div class="settings-title">🛒 Lebensmittel-Budget</div>
                    
                    <div style="text-align: center; margin-bottom: 20px;">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                            <div>
                                <div style="font-size: 12px; color: #666;">Budget</div>
                                <div style="font-size: 18px; font-weight: bold;">CHF ${budget}</div>
                            </div>
                            <div>
                                <div style="font-size: 12px; color: #666;">Ausgegeben</div>
                                <div style="font-size: 18px; font-weight: bold; color: #e74c3c;">CHF ${spent.toFixed(2)}</div>
                            </div>
                            <div>
                                <div style="font-size: 12px; color: #666;">Verfügbar</div>
                                <div style="font-size: 18px; font-weight: bold; color: ${remaining >= 0 ? '#28a745' : '#dc3545'}">
                                    CHF ${remaining.toFixed(2)}
                                </div>
                            </div>
                        </div>
                        
                        <div style="width: 100%; height: 8px; background: #f0f0f0; border-radius: 4px; overflow: hidden;">
                            <div style="height: 100%; background: ${percentage < 80 ? '#28a745' : percentage < 100 ? '#ffc107' : '#dc3545'}; width: ${Math.min(percentage, 100)}%;"></div>
                        </div>
                    </div>

                    <div style="display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 10px; margin-bottom: 20px;">
                        <input type="text" id="food-shop" placeholder="z.B. Migros" class="form-input">
                        <input type="number" id="food-amount" placeholder="Betrag" class="form-input" step="0.05">
                        <button onclick="app.addFoodPurchase()" class="btn btn-primary">➕</button>
                    </div>

                    ${purchases.length === 0 ? '<p style="text-align: center; color: #666;">Noch keine Einkäufe</p>' :
                        purchases.slice().reverse().map(p => `
                            <div class="expense-item">
                                <div class="expense-header">
                                    <div class="expense-info">
                                        <div class="expense-name">🛍️ ${p.shop}</div>
                                        <div class="expense-category">${new Date(p.date).toLocaleDateString('de-CH')}</div>
                                    </div>
                                    <div class="expense-amount">CHF ${p.amount.toFixed(2)}</div>
                                    <div class="expense-actions">
                                        <button class="action-btn delete" onclick="app.deleteFoodPurchase(${p.id})">🗑️</button>
                                    </div>
                                </div>
                            </div>
                        `).join('')
                    }
                </div>
            </div>
        `;
    }

    renderSettings() {
        const hasToken = !!this.state.github.token;
        const hasGist = !!this.state.github.gistId;
        const emergencyMonths = this.state.data.settings?.emergencyFundMonths || 4;

        return `
            <div class="tab-content active">
                <div class="settings-group">
                    <div class="settings-title">💰 Finanzplanung</div>
                    
                    <div class="form-row">
                        <label class="form-label">Notgroschen in Monaten (empfohlen: 3-6)</label>
                        <div style="display: grid; grid-template-columns: 1fr auto; gap: 8px;">
                            <input type="number" id="emergency-months" class="form-input" 
                                   value="${emergencyMonths}" min="1" max="12" step="1">
                            <button onclick="app.saveEmergencyMonths()" class="btn btn-primary">💾</button>
                        </div>
                        <small style="color: #666; font-size: 12px; margin-top: 4px; display: block;">
                            Ihr Notgroschen wird auf ${emergencyMonths} Monate Fixkosten berechnet
                        </small>
                    </div>
                </div>

                <div class="settings-group">
                    <div class="settings-title">☁️ Cloud-Synchronisation (Geräte-übergreifend)</div>
                    
                    <div class="sync-status ${hasToken && hasGist ? 'success' : hasToken ? 'info' : 'error'}">
                        <strong>${hasToken && hasGist ? '✅ Cloud-Sync AKTIV' : hasToken ? '⚠️ Token OK, Gist wird gesucht...' : '⚠️ Kein Cloud-Sync'}</strong><br>
                        <small>${hasToken && hasGist ? 'Automatisch synchronisiert zwischen allen Geräten!' : hasToken ? 'Gist wird beim nächsten Speichern erstellt' : 'GitHub Token benötigt für Synchronisation'}</small>
                    </div>

                    ${hasToken && hasGist ? `
                        <div style="background: #d4edda; border: 1px solid #c3e6cb; padding: 16px; border-radius: 8px; margin: 16px 0;">
                            <strong>✅ Synchronisation aktiv!</strong><br><br>
                            
                            <strong>📱 Auf einem anderen Gerät einrichten:</strong><br>
                            1. Öffnen Sie die App auf dem neuen Gerät<br>
                            2. Gehen Sie zu Settings<br>
                            3. Geben Sie den <strong>gleichen GitHub Token</strong> ein<br>
                            4. Klicken Sie "Speichern"<br>
                            5. ✅ App lädt automatisch Ihre Daten!<br><br>
                            
                            <button onclick="app.syncNow()" class="btn btn-primary" style="width: 100%; margin-top: 12px;">
                                🔄 Jetzt synchronisieren
                            </button>
                        </div>
                    ` : ''}

                    <div style="margin: 16px 0;">
                        <label class="form-label">GitHub Personal Access Token</label>
                        <div style="display: grid; grid-template-columns: 1fr auto; gap: 8px;">
                            <input type="password" id="github-token" class="form-input" 
                                   placeholder="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                                   value="${this.state.github.token ? '••••••••••••••••' : ''}">
                            <button onclick="app.saveToken()" class="btn btn-primary">💾 Speichern</button>
                        </div>
                    </div>

                    ${hasToken ? `
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
                            <button onclick="app.showToken()" class="btn btn-secondary">👁️ Token anzeigen</button>
                            <button onclick="app.removeToken()" class="btn btn-secondary" style="background: #dc3545; color: white;">
                                🗑️ Token löschen
                            </button>
                        </div>
                    ` : ''}

                    <div style="background: #e3f2fd; padding: 16px; border-radius: 8px; margin-top: 16px; font-size: 13px;">
                        <h4 style="margin-bottom: 8px;">📋 Token erstellen (EINMALIG):</h4>
                        <ol style="padding-left: 20px; line-height: 1.8;">
                            <li>Gehe zu <a href="https://github.com/settings/tokens" target="_blank">github.com/settings/tokens</a></li>
                            <li>Klicke "Generate new token (classic)"</li>
                            <li>Name: <code>Swiss Finance Sync</code></li>
                            <li>Ablaufzeit: <strong>No expiration</strong></li>
                            <li>Scope: Nur <strong>gist</strong> auswählen</li>
                            <li>Token kopieren</li>
                            <li><strong>Wichtig:</strong> Speichere den Token sicher - du brauchst ihn für alle deine Geräte!</li>
                        </ol>
                        
                        <div style="background: #fff3cd; padding: 12px; border-radius: 6px; margin-top: 12px;">
                            <strong>💡 Tipp für mehrere Geräte:</strong><br>
                            Kopiere den Token in eine sichere Notiz-App (z.B. Notes, OneNote). Dann kannst du ihn auf allen Geräten verwenden!
                        </div>
                    </div>
                </div>

                <div class="settings-group">
                    <div class="settings-title">ℹ️ App-Info</div>
                    <p style="font-size: 14px; line-height: 1.6;">
                        <strong>Version:</strong> 2.1.0 (Professional Edition)<br>
                        <strong>Profil:</strong> ${this.state.data.currentProfile}<br>
                        <strong>Ausgaben:</strong> ${this.state.data.expenses.length}<br>
                        <strong>Schulden:</strong> ${this.state.data.debts.length}<br>
                        ${hasGist ? `<strong>Gist ID:</strong> ${this.state.github.gistId.substring(0, 8)}...` : ''}
                    </p>
                </div>
            </div>
        `;
    }

    // ============= MODAL SYSTEM =============

    showModal(title, content, buttons = []) {
        const modal = document.getElementById('modals');
        modal.innerHTML = `
            <div class="modal active">
                <div class="modal-content">
                    <div class="modal-header">
                        <div class="modal-title">${title}</div>
                        <button class="close-btn" onclick="app.closeModal()">×</button>
                    </div>
                    ${content}
                    <div class="form-buttons">
                        ${buttons.map(btn => `
                            <button class="btn ${btn.primary ? 'btn-primary' : 'btn-secondary'}" 
                                    onclick="${btn.action}">
                                ${btn.label}
                            </button>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
    }

    closeModal() {
        document.getElementById('modals').innerHTML = '';
    }

    // ============= ACTIONS =============

    async saveIncome() {
        const input = document.getElementById('income-input');
        const amount = parseFloat(input.value);
        
        if (!amount || amount <= 0) {
            alert('⚠️ Bitte geben Sie ein gültiges Gehalt ein');
            return;
        }

        this.state.update(data => {
            data.profiles[data.currentProfile].income = amount;
        });

        alert(`✅ Gehalt von CHF ${amount.toLocaleString()} gespeichert!`);
    }

    addExpense(type) {
        const categoriesHTML = EXPENSE_CATEGORIES.map(group => `
            <optgroup label="${group.group}">
                ${group.items.map(item => `<option value="${item}">${item}</option>`).join('')}
            </optgroup>
        `).join('');

        this.showModal(
            `${type === 'fixed' ? 'Fixe' : 'Variable'} Ausgabe hinzufügen`,
            `
                <div class="form-row">
                    <label class="form-label">Bezeichnung</label>
                    <input type="text" id="exp-name" class="form-input" placeholder="z.B. Miete">
                </div>
                <div class="form-row">
                    <label class="form-label">Betrag (CHF)</label>
                    <input type="number" id="exp-amount" class="form-input" placeholder="0.00" step="0.01">
                </div>
                <div class="form-row">
                    <label class="form-label">Kategorie</label>
                    <select id="exp-category" class="form-input">
                        <option value="">Kategorie wählen</option>
                        ${categoriesHTML}
                    </select>
                </div>
            `,
            [
                { label: '💾 Speichern', primary: true, action: `app.saveExpenseFromModal('${type}')` },
                { label: '↩ Abbrechen', action: 'app.closeModal()' }
            ]
        );
    }

    saveExpenseFromModal(type) {
        const name = document.getElementById('exp-name').value.trim();
        const amount = parseFloat(document.getElementById('exp-amount').value);
        const category = document.getElementById('exp-category').value;

        if (!name || !amount || !category) {
            alert('⚠️ Bitte alle Felder ausfüllen');
            return;
        }

        this.state.update(data => {
            data.expenses.push({
                id: Date.now(),
                name,
                amount,
                category,
                type,
                account: data.currentProfile,
                active: true,
                date: new Date().toISOString()
            });
        });

        this.closeModal();
        alert('✅ Ausgabe hinzugefügt!');
    }

    editExpense(id) {
        const exp = this.state.data.expenses.find(e => e.id === id);
        if (!exp) return;

        const categoriesHTML = EXPENSE_CATEGORIES.map(group => `
            <optgroup label="${group.group}">
                ${group.items.map(item => `<option value="${item}" ${item === exp.category ? 'selected' : ''}>${item}</option>`).join('')}
            </optgroup>
        `).join('');

        this.showModal(
            'Ausgabe bearbeiten',
            `
                <div class="form-row">
                    <label class="form-label">Bezeichnung</label>
                    <input type="text" id="exp-name" class="form-input" value="${exp.name}">
                </div>
                <div class="form-row">
                    <label class="form-label">Betrag (CHF)</label>
                    <input type="number" id="exp-amount" class="form-input" value="${exp.amount}" step="0.01">
                </div>
                <div class="form-row">
                    <label class="form-label">Kategorie</label>
                    <select id="exp-category" class="form-input">
                        ${categoriesHTML}
                    </select>
                </div>
            `,
            [
                { label: '💾 Speichern', primary: true, action: `app.updateExpenseFromModal(${id})` },
                { label: '↩ Abbrechen', action: 'app.closeModal()' }
            ]
        );
    }

    updateExpenseFromModal(id) {
        const name = document.getElementById('exp-name').value.trim();
        const amount = parseFloat(document.getElementById('exp-amount').value);
        const category = document.getElementById('exp-category').value;

        if (!name || !amount || !category) {
            alert('⚠️ Bitte alle Felder ausfüllen');
            return;
        }

        this.state.update(data => {
            const exp = data.expenses.find(e => e.id === id);
            if (exp) {
                exp.name = name;
                exp.amount = amount;
                exp.category = category;
            }
        });

        this.closeModal();
        alert('✅ Ausgabe aktualisiert!');
    }

    toggleExpense(id) {
        this.state.update(data => {
            const exp = data.expenses.find(e => e.id === id);
            if (exp) exp.active = !exp.active;
        });
    }

    deleteExpense(id) {
        if (!confirm('🗑️ Ausgabe wirklich löschen?')) return;
        
        this.state.update(data => {
            data.expenses = data.expenses.filter(e => e.id !== id);
        });
        
        alert('✅ Ausgabe gelöscht!');
    }

    addDebt() {
        this.showModal(
            'Schulden hinzufügen',
            `
                <div class="form-row">
                    <label class="form-label">Bezeichnung</label>
                    <input type="text" id="debt-name" class="form-input" placeholder="z.B. Steuern 2024">
                </div>
                <div class="form-row">
                    <label class="form-label">Betrag (CHF)</label>
                    <input type="number" id="debt-amount" class="form-input" placeholder="0.00" step="0.01">
                </div>
                <div class="form-row">
                    <label class="form-label">Typ</label>
                    <select id="debt-type" class="form-input">
                        <option value="">Typ wählen</option>
                        <option value="Offene Steuern">Offene Steuern</option>
                        <option value="Kreditkarte">Kreditkarte</option>
                        <option value="Offene Rechnung">Offene Rechnung</option>
                        <option value="Privatdarlehen">Privatdarlehen</option>
                        <option value="Sonstiges">Sonstiges</option>
                    </select>
                </div>
                <div class="form-row">
                    <label class="form-label">Fälligkeitsdatum</label>
                    <input type="date" id="debt-date" class="form-input">
                </div>
            `,
            [
                { label: '💾 Speichern', primary: true, action: 'app.saveDebtFromModal()' },
                { label: '↩ Abbrechen', action: 'app.closeModal()' }
            ]
        );
    }

    saveDebtFromModal() {
        const name = document.getElementById('debt-name').value.trim();
        const amount = parseFloat(document.getElementById('debt-amount').value);
        const type = document.getElementById('debt-type').value;
        const dueDate = document.getElementById('debt-date').value;

        if (!name || !amount || !type) {
            alert('⚠️ Bitte alle Pflichtfelder ausfüllen');
            return;
        }

        this.state.update(data => {
            data.debts.push({
                id: Date.now(),
                name,
                amount,
                type,
                dueDate,
                owner: data.currentProfile,
                date: new Date().toISOString()
            });
        });

        this.closeModal();
        alert('✅ Schulden hinzugefügt!');
    }

    editDebt(id) {
        const debt = this.state.data.debts.find(d => d.id === id);
        if (!debt) return;

        this.showModal(
            'Schulden bearbeiten',
            `
                <div class="form-row">
                    <label class="form-label">Bezeichnung</label>
                    <input type="text" id="debt-name" class="form-input" value="${debt.name}">
                </div>
                <div class="form-row">
                    <label class="form-label">Betrag (CHF)</label>
                    <input type="number" id="debt-amount" class="form-input" value="${debt.amount}" step="0.01">
                </div>
                <div class="form-row">
                    <label class="form-label">Typ</label>
                    <select id="debt-type" class="form-input">
                        <option value="Offene Steuern" ${debt.type === 'Offene Steuern' ? 'selected' : ''}>Offene Steuern</option>
                        <option value="Kreditkarte" ${debt.type === 'Kreditkarte' ? 'selected' : ''}>Kreditkarte</option>
                        <option value="Offene Rechnung" ${debt.type === 'Offene Rechnung' ? 'selected' : ''}>Offene Rechnung</option>
                        <option value="Privatdarlehen" ${debt.type === 'Privatdarlehen' ? 'selected' : ''}>Privatdarlehen</option>
                        <option value="Sonstiges" ${debt.type === 'Sonstiges' ? 'selected' : ''}>Sonstiges</option>
                    </select>
                </div>
                <div class="form-row">
                    <label class="form-label">Fälligkeitsdatum</label>
                    <input type="date" id="debt-date" class="form-input" value="${debt.dueDate || ''}">
                </div>
            `,
            [
                { label: '💾 Speichern', primary: true, action: `app.updateDebtFromModal(${id})` },
                { label: '↩ Abbrechen', action: 'app.closeModal()' }
            ]
        );
    }

    updateDebtFromModal(id) {
        const name = document.getElementById('debt-name').value.trim();
        const amount = parseFloat(document.getElementById('debt-amount').value);
        const type = document.getElementById('debt-type').value;
        const dueDate = document.getElementById('debt-date').value;

        if (!name || !amount || !type) {
            alert('⚠️ Bitte alle Pflichtfelder ausfüllen');
            return;
        }

        this.state.update(data => {
            const debt = data.debts.find(d => d.id === id);
            if (debt) {
                debt.name = name;
                debt.amount = amount;
                debt.type = type;
                debt.dueDate = dueDate;
            }
        });

        this.closeModal();
        alert('✅ Schulden aktualisiert!');
    }

    deleteDebt(id) {
        if (!confirm('🗑️ Schulden wirklich löschen?')) return;
        
        this.state.update(data => {
            data.debts = data.debts.filter(d => d.id !== id);
        });
        
        alert('✅ Schulden gelöscht!');
    }

    editBalance() {
        const profile = this.state.data.currentProfile;
        const current = this.state.data.accounts[profile].balance;

        this.showModal(
            '💰 Kontostand manuell anpassen',
            `
                <div style="background: #e3f2fd; padding: 12px; border-radius: 8px; margin-bottom: 16px; font-size: 13px;">
                    <strong>💡 Hinweis:</strong> Hier können Sie Ihren Kontostand mit Ihrem echten Bankkonto synchronisieren.<br><br>
                    
                    <strong>Beispiel:</strong><br>
                    • Ihr echtes Konto zeigt: CHF 5'200<br>
                    • App zeigt aktuell: CHF ${current.toLocaleString()}<br>
                    → Geben Sie CHF 5'200 ein
                </div>
                
                <div class="form-row">
                    <label class="form-label">Neuer Kontostand (CHF)</label>
                    <input type="number" id="balance-input" class="form-input" 
                           value="${current}" placeholder="z.B. 5200" step="0.01" autofocus>
                </div>
                
                <div style="background: #fff3cd; padding: 10px; border-radius: 6px; margin-top: 12px; font-size: 12px;">
                    ⚠️ Diese Änderung überschreibt den gespeicherten Kontostand und hat keinen Einfluss auf Ihre Verlaufsdaten.
                </div>
            `,
            [
                { label: '💾 Speichern', primary: true, action: 'app.saveBalanceFromModal()' },
                { label: '↩ Abbrechen', action: 'app.closeModal()' }
            ]
        );
    }

    saveBalanceFromModal() {
        const balance = parseFloat(document.getElementById('balance-input').value);
        if (isNaN(balance)) {
            alert('⚠️ Bitte geben Sie einen gültigen Betrag ein');
            return;
        }

        this.state.update(data => {
            data.accounts[data.currentProfile].balance = balance;
        });

        this.closeModal();
        alert('✅ Kontostand aktualisiert!');
    }

    addPillar3aValue() {
        this.showModal(
            '📈 Säule 3a Fondswert',
            `
                <div class="form-row">
                    <label class="form-label">Aktueller Fondswert (CHF)</label>
                    <input type="number" id="pillar-value" class="form-input" placeholder="z.B. 15000" step="100">
                </div>
                <div class="form-row">
                    <label class="form-label">Einzahlung diesen Monat (CHF)</label>
                    <input type="number" id="pillar-deposit" class="form-input" value="588" step="10">
                </div>
            `,
            [
                { label: '💾 Speichern', primary: true, action: 'app.savePillar3aFromModal()' },
                { label: '↩ Abbrechen', action: 'app.closeModal()' }
            ]
        );
    }

    savePillar3aFromModal() {
        const value = parseFloat(document.getElementById('pillar-value').value);
        const deposit = parseFloat(document.getElementById('pillar-deposit').value) || 0;

        if (!value || value <= 0) {
            alert('⚠️ Bitte geben Sie einen gültigen Fondswert ein');
            return;
        }

        this.state.update(data => {
            const month = new Date().toLocaleDateString('de-CH', { month: 'long', year: 'numeric' });
            const lastValue = data.savings.pillar3a.fundValues[data.savings.pillar3a.fundValues.length - 1];
            const startValue = lastValue?.endValue || 0;
            const profit = value - startValue - deposit;
            const performance = startValue > 0 ? (profit / startValue * 100) : 0;

            data.savings.pillar3a.fundValues.push({
                id: Date.now(),
                month,
                startValue,
                deposit,
                endValue: value,
                profit,
                performance,
                date: new Date().toISOString()
            });

            if (deposit > 0) {
                data.savings.pillar3a.deposits.push({
                    id: Date.now(),
                    amount: deposit,
                    year: new Date().getFullYear(),
                    date: new Date().toISOString()
                });
            }
        });

        this.closeModal();
        alert('✅ Fondswert gespeichert!');
    }

    addInvestment() {
        this.showModal(
            '💎 Investment hinzufügen',
            `
                <div class="form-row">
                    <label class="form-label">Name</label>
                    <input type="text" id="inv-name" class="form-input" placeholder="z.B. MSCI World ETF">
                </div>
                <div class="form-row">
                    <label class="form-label">Investierter Betrag (CHF)</label>
                    <input type="number" id="inv-invested" class="form-input" placeholder="z.B. 5000" step="100">
                </div>
                <div class="form-row">
                    <label class="form-label">Aktueller Wert (CHF)</label>
                    <input type="number" id="inv-value" class="form-input" placeholder="z.B. 5500" step="100">
                </div>
                <div class="form-row">
                    <label class="form-label">Typ</label>
                    <select id="inv-type" class="form-input">
                        <option value="ETF">ETF</option>
                        <option value="Aktien">Aktien</option>
                        <option value="Bitcoin">Bitcoin</option>
                        <option value="Crypto">Andere Krypto</option>
                        <option value="Gold">Gold</option>
                        <option value="Andere">Andere</option>
                    </select>
                </div>
            `,
            [
                { label: '💾 Speichern', primary: true, action: 'app.saveInvestmentFromModal()' },
                { label: '↩ Abbrechen', action: 'app.closeModal()' }
            ]
        );
    }

    saveInvestmentFromModal() {
        const name = document.getElementById('inv-name').value.trim();
        const invested = parseFloat(document.getElementById('inv-invested').value);
        const currentValue = parseFloat(document.getElementById('inv-value').value);
        const type = document.getElementById('inv-type').value;

        if (!name || !invested || !currentValue) {
            alert('⚠️ Bitte alle Felder ausfüllen');
            return;
        }

        this.state.update(data => {
            const performance = ((currentValue - invested) / invested * 100);
            const profit = currentValue - invested;

            data.savings.investments.push({
                id: Date.now(),
                name,
                invested,
                currentValue,
                type,
                performance,
                profit,
                account: data.currentProfile,
                date: new Date().toISOString()
            });
        });

        this.closeModal();
        alert('✅ Investment hinzugefügt!');
    }

    addFoodPurchase() {
        const shop = document.getElementById('food-shop').value.trim();
        const amount = parseFloat(document.getElementById('food-amount').value);

        if (!shop || !amount || amount <= 0) {
            alert('⚠️ Bitte Laden und Betrag eingeben');
            return;
        }

        this.state.update(data => {
            data.foodBudget.purchases.push({
                id: Date.now(),
                shop,
                amount,
                date: new Date().toISOString(),
                month: new Date().toISOString().slice(0, 7)
            });
        });

        document.getElementById('food-shop').value = '';
        document.getElementById('food-amount').value = '';
        
        alert(`✅ Einkauf bei ${shop} erfasst!`);
    }

    deleteFoodPurchase(id) {
        if (!confirm('🗑️ Einkauf wirklich löschen?')) return;
        
        this.state.update(data => {
            data.foodBudget.purchases = data.foodBudget.purchases.filter(p => p.id !== id);
        });
        
        alert('✅ Einkauf gelöscht!');
    }

    closeMonth() {
        const profile = this.state.data.currentProfile;
        
        if (profile === 'family') {
            alert('⚠️ Bitte wechseln Sie zu Sven oder Franzi um den Monat abzuschließen');
            return;
        }

        const salary = parseFloat(prompt('💰 Ihr tatsächliches Gehalt für DIESEN Monat (CHF):', 
            this.state.data.profiles[profile].income || ''));

        if (!salary || salary <= 0) return;

        // Calculate expenses BEFORE deletion
        const fixedExpenses = this.state.filterByProfile(this.state.data.expenses)
            .filter(e => e.active && e.type === 'fixed')
            .reduce((sum, e) => sum + e.amount, 0);
        
        const variableExpenses = this.state.filterByProfile(this.state.data.expenses)
            .filter(e => e.active && e.type === 'variable')
            .reduce((sum, e) => sum + e.amount, 0);

        const totalExpenses = fixedExpenses + variableExpenses;
        const available = salary - totalExpenses;
        
        // Find all Säule 3a expenses (both fixed and variable)
        const pillar3aExpenses = this.state.filterByProfile(this.state.data.expenses)
            .filter(e => e.active && e.category === 'Säule 3a');
        
        const total3aDeposits = pillar3aExpenses.reduce((sum, e) => sum + e.amount, 0);

        const confirmMsg = `📅 Monat abschließen?\n\n` +
            `💰 Gehalt: CHF ${salary.toLocaleString()}\n` +
            `🏢 Fixkosten: CHF ${fixedExpenses.toLocaleString()}\n` +
            `🛒 Variable: CHF ${variableExpenses.toLocaleString()}\n` +
            `➖ ─────────────\n` +
            `✅ Verfügbar: CHF ${available.toLocaleString()}\n\n` +
            `${total3aDeposits > 0 ? `🏛️ Säule 3a: CHF ${total3aDeposits.toLocaleString()} wird automatisch für nächsten Monat eingetragen\n\n` : ''}` +
            `Variable Ausgaben werden gelöscht!`;

        if (!confirm(confirmMsg)) return;

        this.state.update(data => {
            // Save month data
            const monthName = new Date().toLocaleDateString('de-CH', { year: 'numeric', month: 'long' });
            data.wealthHistory = data.wealthHistory.filter(h => 
                !(h.month === monthName && h.profile === profile)
            );
            
            data.wealthHistory.push({
                month: monthName,
                date: new Date().toISOString(),
                profile,
                income: salary,
                expenses: totalExpenses,
                balance: available,
                totalBalance: data.accounts[profile].balance + available
            });

            // Add Säule 3a deposits automatically for NEXT month
            if (total3aDeposits > 0) {
                // Calculate next month/year
                const now = new Date();
                const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
                const nextYear = nextMonth.getFullYear();
                
                data.savings.pillar3a.deposits.push({
                    id: Date.now(),
                    amount: total3aDeposits,
                    year: nextYear,
                    date: nextMonth.toISOString(),
                    autoAdded: true // Mark as automatically added
                });
                
                console.log(`✅ Säule 3a: CHF ${total3aDeposits} für ${nextMonth.toLocaleDateString('de-CH', { month: 'long', year: 'numeric' })} eingetragen`);
            }

            // Delete variable expenses for this profile - CRITICAL FIX!
            const beforeCount = data.expenses.length;
            data.expenses = data.expenses.filter(e => 
                !(e.type === 'variable' && e.account === profile)
            );
            const deletedCount = beforeCount - data.expenses.length;

            // Transfer available to account
            if (available > 0) {
                data.accounts[profile].balance += available;
            }

            // Update income reference
            data.profiles[profile].income = salary;

            console.log(`✅ Monat abgeschlossen: ${deletedCount} variable Ausgaben gelöscht`);
        });

        alert(`✅ Monat erfolgreich abgeschlossen!\n\n` +
            `💳 CHF ${available.toLocaleString()} auf Ihr Konto übertragen\n` +
            `🗑️ Variable Ausgaben gelöscht\n` +
            `${total3aDeposits > 0 ? `🏛️ CHF ${total3aDeposits.toLocaleString()} für Säule 3a (nächster Monat) eingetragen` : ''}`);
    }

    async saveToken() {
        const input = document.getElementById('github-token');
        const token = input.value.trim();

        if (!token || !token.startsWith('ghp_')) {
            alert('⚠️ Ungültiges Token-Format');
            return;
        }

        this.state.github.token = token;
        localStorage.setItem('githubToken', token);

        // Try to find existing gist
        await this.state.findGist();
        
        // Try first sync
        const success = await this.state.save();
        
        if (success) {
            alert('✅ Token gespeichert und Cloud-Sync aktiviert!');
            this.render();
        } else {
            alert('⚠️ Token gespeichert, aber Sync fehlgeschlagen. Prüfen Sie Ihre Internetverbindung.');
        }
    }

    showToken() {
        const input = document.getElementById('github-token');
        input.type = 'text';
        input.value = this.state.github.token;
        setTimeout(() => {
            input.type = 'password';
            input.value = '••••••••••••••••';
        }, 5000);
    }

    removeToken() {
        if (!confirm('🗑️ GitHub Token wirklich löschen?\n\nCloud-Sync wird deaktiviert.')) return;

        this.state.github.token = '';
        this.state.github.gistId = null;
        localStorage.removeItem('githubToken');
        localStorage.removeItem('gistId');

        alert('✅ Token gelöscht');
        this.render();
    }

    async syncNow() {
        if (!this.state.github.token) {
            alert('⚠️ Kein GitHub Token konfiguriert');
            this.switchTab('settings');
            return;
        }

        try {
            // First, save current data
            const saved = await this.state.save();
            
            // Then, reload from cloud to get any changes from other devices
            await this.state.load();
            
            if (saved) {
                alert('✅ Synchronisiert!\n\nDaten wurden gespeichert und neu geladen.');
                this.render(); // Re-render to show any updates
            } else {
                alert('⚠️ Sync fehlgeschlagen beim Speichern');
            }
        } catch (error) {
            console.error('Sync error:', error);
            alert('⚠️ Sync fehlgeschlagen: ' + error.message);
        }
    }

    showAllRecommendations() {
        const advisor = new FinancialAdvisor(this.state.data, this.state.data.currentProfile);
        const recommendations = advisor.getRecommendations();
        
        const content = `
            <div style="max-height: 60vh; overflow-y: auto;">
                ${recommendations.map((rec, i) => `
                    <div class="recommendation-card ${rec.priority === 'critical' ? 'error' : rec.priority === 'high' ? 'warning' : rec.priority === 'success' ? 'success' : 'info'}" style="margin-bottom: 16px;">
                        <div class="recommendation-title">${i + 1}. ${rec.icon} ${rec.title}</div>
                        <div class="recommendation-text">
                            <strong>${rec.message}</strong><br><br>
                            💡 <strong>Empfehlung:</strong> ${rec.action}
                            ${rec.savings ? `<br><br>💰 <strong>Ersparnis:</strong> ca. CHF ${rec.savings.toLocaleString()} pro Jahr` : ''}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
        
        this.showModal('💼 Finanzplanung - Alle Empfehlungen', content, [
            { label: '↩ Schließen', action: 'app.closeModal()' }
        ]);
    }

    saveEmergencyMonths() {
        const input = document.getElementById('emergency-months');
        const months = parseInt(input.value);
        
        if (!months || months < 1 || months > 12) {
            alert('⚠️ Bitte geben Sie einen Wert zwischen 1 und 12 ein');
            return;
        }

        this.state.update(data => {
            if (!data.settings) data.settings = {};
            data.settings.emergencyFundMonths = months;
        });

        alert(`✅ Notgroschen auf ${months} Monate gesetzt!`);
    }
}

// ============= INITIALIZATION =============
console.log('📱 Script loaded');

const app = new SwissFinanceApp();
console.log('🏗️ App instance created');

document.addEventListener('DOMContentLoaded', async () => {
    console.log('📄 DOM ready, starting init...');
    try {
        await app.init();
        console.log('🇨🇭 Swiss Finance V2.0 ready!');
    } catch (error) {
        console.error('❌ Init failed:', error);
        alert('Fehler beim Laden der App: ' + error.message);
    }
});
