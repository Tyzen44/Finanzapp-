// ============= PROFESSIONAL DASHBOARD - BANKING STYLE ============= 
function updateDashboard() {
    const dashboardGrid = document.querySelector('.dashboard-grid');
    if (!dashboardGrid) return;

    // Clear existing content
    dashboardGrid.innerHTML = '';

    if (appData.currentProfile === 'family') {
        // Family profile shows all three accounts with clean cards
        const accounts = [
            { 
                id: 'sven', 
                name: 'SVEN PRIVAT', 
                balance: getRealTimeBalance('sven')
            },
            { 
                id: 'franzi', 
                name: 'FRANZI PRIVAT', 
                balance: getRealTimeBalance('franzi')
            },
            { 
                id: 'shared', 
                name: 'GEMEINSCHAFTSKONTO', 
                balance: getRealTimeBalance('shared')
            }
        ];

        accounts.forEach(account => {
            const isPositive = account.balance >= 0;
            const accountCard = `
                <div class="account-card">
                    <div class="account-header">
                        <div class="account-title">${account.name}</div>
                        <button onclick="editAccountBalance('${account.id}')" class="action-btn" title="Bearbeiten">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                            </svg>
                        </button>
                    </div>
                    <div class="account-balance" style="color: ${isPositive ? '#0d7a5f' : '#c92a2a'}">
                        CHF ${account.balance.toLocaleString('de-CH')}
                    </div>
                    <div class="account-details">
                        ${isPositive ? 'Positiver Saldo' : 'Negativer Saldo'}
                    </div>
                </div>
            `;
            dashboardGrid.insertAdjacentHTML('beforeend', accountCard);
        });

        // Update family balance summary
        const totalFamilyBalance = getRealTimeBalance('sven') + getRealTimeBalance('franzi') + getRealTimeBalance('shared');
        const familyBalanceElement = document.getElementById('total-family-balance');
        const familyBalanceSummary = document.getElementById('family-balance-summary');
        
        if (familyBalanceElement) {
            familyBalanceElement.textContent = `CHF ${totalFamilyBalance.toLocaleString('de-CH')}`;
        }
        
        if (familyBalanceSummary) {
            familyBalanceSummary.style.display = 'block';
        }
    } else {
        // Individual profile shows single account
        const realTimeBalance = getRealTimeBalance(appData.currentProfile);
        const currentAccount = appData.accounts[appData.currentProfile];
        const profileName = appData.currentProfile.toUpperCase();
        const isPositive = realTimeBalance >= 0;
        
        const accountCard = `
            <div class="account-card" style="grid-column: span 3;">
                <div class="account-header">
                    <div class="account-title">${profileName} PRIVATKONTO</div>
                    <button onclick="editAccountBalance()" class="action-btn" title="Bearbeiten">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                    </button>
                </div>
                <div class="account-balance" style="font-size: 36px; text-align: center; margin: 24px 0; color: ${isPositive ? '#0d7a5f' : '#c92a2a'}">
                    CHF ${realTimeBalance.toLocaleString('de-CH')}
                </div>
                <div class="account-details" style="text-align: center;">
                    Aktueller Kontostand (inkl. verfügbar)
                </div>
            </div>
        `;
        dashboardGrid.insertAdjacentHTML('beforeend', accountCard);

        // Hide family balance summary for individual profiles
        const familyBalanceSummary = document.getElementById('family-balance-summary');
        if (familyBalanceSummary) {
            familyBalanceSummary.style.display = 'none';
        }
    }

    // Update professional stats
    updateDashboardStats();
}

// Update dashboard statistics
function updateDashboardStats() {
    // Calculate available
    let income = 0;
    let totalExpenses = 0;
    let totalDebts = 0;
    
    if (appData.currentProfile === 'sven') {
        income = appData.profiles.sven.income || 0;
        totalExpenses = appData.fixedExpenses.filter(exp => exp.active && exp.account === 'sven').reduce((sum, exp) => sum + exp.amount, 0) +
                       appData.variableExpenses.filter(exp => exp.active && exp.account === 'sven').reduce((sum, exp) => sum + exp.amount, 0);
        totalDebts = appData.debts.filter(debt => debt.owner === 'sven').reduce((sum, debt) => sum + debt.amount, 0);
    } else if (appData.currentProfile === 'franzi') {
        income = appData.profiles.franzi.income || 0;
        totalExpenses = appData.fixedExpenses.filter(exp => exp.active && exp.account === 'franzi').reduce((sum, exp) => sum + exp.amount, 0) +
                       appData.variableExpenses.filter(exp => exp.active && exp.account === 'franzi').reduce((sum, exp) => sum + exp.amount, 0);
        totalDebts = appData.debts.filter(debt => debt.owner === 'franzi').reduce((sum, debt) => sum + debt.amount, 0);
    } else {
        // Family profile
        income = calculateTransferIncome();
        totalExpenses = appData.fixedExpenses.filter(exp => exp.active && exp.account === 'shared').reduce((sum, exp) => sum + exp.amount, 0) +
                       appData.variableExpenses.filter(exp => exp.active && exp.account === 'shared').reduce((sum, exp) => sum + exp.amount, 0);
        totalDebts = appData.debts.reduce((sum, debt) => sum + debt.amount, 0);
    }
    
    const available = income - totalExpenses;
    const savingsRate = income > 0 ? Math.max(0, Math.round((available / income) * 100)) : 0;
    
    // Update stat displays
    const availableElement = document.getElementById('dashboard-available');
    const debtsElement = document.getElementById('dashboard-debts');
    const savingsRateElement = document.getElementById('dashboard-savings-rate');
    
    if (availableElement) {
        availableElement.textContent = `CHF ${available.toLocaleString('de-CH')}`;
        availableElement.style.color = available >= 0 ? 'white' : '#ffb4b4';
    }
    
    if (debtsElement) {
        debtsElement.textContent = `CHF ${totalDebts.toLocaleString('de-CH')}`;
        debtsElement.style.color = totalDebts > 0 ? '#ffb4b4' : 'white';
    }
    
    if (savingsRateElement) {
        savingsRateElement.textContent = `${savingsRate}%`;
        savingsRateElement.style.color = savingsRate >= 20 ? '#a8e6cf' : savingsRate >= 10 ? 'white' : '#ffb4b4';
    }
}

// Get real-time balance function
function getRealTimeBalance(profile) {
    let baseBalance = 0;
    let available = 0;
    
    if (profile === 'sven') {
        baseBalance = appData.accounts.sven.balance || 0;
        
        // Calculate available for Sven
        const income = appData.profiles.sven.income || 0;
        const fixedExpenses = (appData.fixedExpenses || [])
            .filter(exp => exp.active && exp.account === 'sven')
            .reduce((sum, exp) => sum + exp.amount, 0);
        const variableExpenses = (appData.variableExpenses || [])
            .filter(exp => exp.active && exp.account === 'sven')
            .reduce((sum, exp) => sum + exp.amount, 0);
        
        available = income - fixedExpenses - variableExpenses;
        
    } else if (profile === 'franzi') {
        baseBalance = appData.accounts.franzi.balance || 0;
        
        // Calculate available for Franzi
        const income = appData.profiles.franzi.income || 0;
        const fixedExpenses = (appData.fixedExpenses || [])
            .filter(exp => exp.active && exp.account === 'franzi')
            .reduce((sum, exp) => sum + exp.amount, 0);
        const variableExpenses = (appData.variableExpenses || [])
            .filter(exp => exp.active && exp.account === 'franzi')
            .reduce((sum, exp) => sum + exp.amount, 0);
        
        available = income - fixedExpenses - variableExpenses;
        
    } else if (profile === 'shared') {
        // Shared account doesn't have "available" concept, just the base balance
        baseBalance = appData.accounts.shared.balance || 0;
        available = 0; // No additional available for shared account
    }
    
    // Real-time balance = saved balance + current month's available
    return baseBalance + available;
}

// ============= CALCULATIONS ============= 
function calculateAll() {
    let totalFixed = 0;
    let totalVariable = 0;
    let totalDebts = 0;
    let income = 0;
    let balance = 0;
    
    const transfers = calculateTransfersByProfile();
    
    if (appData.currentProfile === 'sven') {
        totalFixed = (appData.fixedExpenses || [])
            .filter(exp => exp.active && exp.account === 'sven')
            .reduce((sum, exp) => sum + (exp.amount || 0), 0);
        
        totalVariable = (appData.variableExpenses || [])
            .filter(exp => exp.active && exp.account === 'sven')
            .reduce((sum, exp) => sum + (exp.amount || 0), 0);
        
        totalDebts = (appData.debts || [])
            .filter(debt => debt.owner === 'sven')
            .reduce((sum, debt) => sum + (debt.amount || 0), 0);
        
        income = appData.profiles.sven.income || 0;
        balance = getRealTimeBalance('sven');
        
    } else if (appData.currentProfile === 'franzi') {
        totalFixed = (appData.fixedExpenses || [])
            .filter(exp => exp.active && exp.account === 'franzi')
            .reduce((sum, exp) => sum + (exp.amount || 0), 0);
        
        totalVariable = (appData.variableExpenses || [])
            .filter(exp => exp.active && exp.account === 'franzi')
            .reduce((sum, exp) => sum + (exp.amount || 0), 0);
        
        totalDebts = (appData.debts || [])
            .filter(debt => debt.owner === 'franzi')
            .reduce((sum, debt) => sum + (debt.amount || 0), 0);
        
        income = appData.profiles.franzi.income || 0;
        balance = getRealTimeBalance('franzi');
        
    } else {
        // Family profile
        totalFixed = (appData.fixedExpenses || [])
            .filter(exp => exp.active && exp.account === 'shared')
            .reduce((sum, exp) => sum + (exp.amount || 0), 0);
        
        totalVariable = (appData.variableExpenses || [])
            .filter(exp => exp.active && exp.account === 'shared')
            .reduce((sum, exp) => sum + (exp.amount || 0), 0);
        
        totalDebts = (appData.debts || [])
            .reduce((sum, debt) => sum + (debt.amount || 0), 0);
        
        income = calculateTransferIncome();
        balance = getRealTimeBalance('shared');
    }
    
    const totalExpenses = totalFixed + totalVariable;
    const available = income - totalExpenses;

    // Update displays
    const balanceDisplay = document.getElementById('balance-display');
    const wealthDisplay = document.getElementById('wealth-display');
    const incomeDisplay = document.getElementById('income-display');
    const totalExpensesDisplay = document.getElementById('total-expenses-display');
    const availableDisplay = document.getElementById('available-display');
    const fixedTotal = document.getElementById('fixed-total');
    const variableTotal = document.getElementById('variable-total');
    
    if (balanceDisplay) balanceDisplay.textContent = `CHF ${balance.toLocaleString('de-CH')}`;
    if (wealthDisplay) wealthDisplay.textContent = `CHF ${balance.toLocaleString('de-CH')}`;
    if (incomeDisplay) incomeDisplay.textContent = income.toLocaleString('de-CH');
    if (totalExpensesDisplay) totalExpensesDisplay.textContent = totalExpenses.toLocaleString('de-CH');
    if (availableDisplay) availableDisplay.textContent = available.toLocaleString('de-CH');
    if (fixedTotal) fixedTotal.textContent = `CHF ${totalFixed.toLocaleString('de-CH')}`;
    if (variableTotal) variableTotal.textContent = `CHF ${totalVariable.toLocaleString('de-CH')}`;
    
    const debtsDisplay = document.getElementById('debts-total');
    if (debtsDisplay) {
        debtsDisplay.textContent = `CHF ${totalDebts.toLocaleString('de-CH')}`;
    }

    const transfersDisplay = document.getElementById('transfers-display');
    if (transfersDisplay) {
        if (appData.currentProfile === 'sven') {
            transfersDisplay.textContent = transfers.fromSven.toLocaleString('de-CH');
        } else if (appData.currentProfile === 'franzi') {
            transfersDisplay.textContent = transfers.fromFranzi.toLocaleString('de-CH');
        } else {
            transfersDisplay.textContent = transfers.total.toLocaleString('de-CH');
        }
    }

    const balanceHero = document.querySelector('.balance-hero');
    if (balanceHero) {
        balanceHero.style.background = 'white';
        balanceHero.style.border = '1px solid #dee2e6';
    }

    const overviewLabel = document.getElementById('overview-account-label');
    if (overviewLabel) {
        if (appData.currentProfile === 'sven') {
            overviewLabel.textContent = 'SVEN PRIVAT';
        } else if (appData.currentProfile === 'franzi') {
            overviewLabel.textContent = 'FRANZI PRIVAT';
        } else {
            overviewLabel.textContent = 'GEMEINSCHAFTSKONTO';
        }
    }

    const trendElement = document.getElementById('balance-trend');
    const availableStat = document.getElementById('available-stat');
    
    if (trendElement) {
        if (available >= 0) {
            trendElement.innerHTML = `<span style="color: #0d7a5f;">+CHF ${available.toLocaleString('de-CH')}</span> monatlich`;
            trendElement.className = 'balance-trend';
            if (availableStat) {
                availableStat.style.background = '#f0fdf4';
                availableStat.style.border = '1px solid #0d7a5f';
            }
        } else {
            trendElement.innerHTML = `<span style="color: #c92a2a;">CHF ${available.toLocaleString('de-CH')}</span> monatlich`;
            trendElement.className = 'balance-trend';
            if (availableStat) {
                availableStat.style.background = '#fff5f5';
                availableStat.style.border = '1px solid #c92a2a';
            }
        }
    }

    // Update dashboard stats when calculations complete
    updateDashboardStats();
    updateRecommendations();
    updateCategoriesOverview();
    updateDebtCategories();
}

function getCurrentBalance() {
    // Return real-time balance for current profile
    return getRealTimeBalance(appData.currentProfile);
}

// ============= RECOMMENDATIONS ============= 
function updateRecommendations() {
    const container = document.getElementById('recommendations-container');
    if (!container) return;
    
    const recommendations = [];
    
    const balance = getCurrentBalance();
    let totalFixed = 0;
    let totalVariable = 0;
    let totalDebts = 0;
    let income = 0;
    
    const transfers = calculateTransfers();
    
    if (appData.currentProfile === 'sven') {
        totalFixed = appData.fixedExpenses.filter(exp => exp.active && exp.account === 'sven').reduce((sum, exp) => sum + exp.amount, 0);
        totalVariable = appData.variableExpenses.filter(exp => exp.active && exp.account === 'sven').reduce((sum, exp) => sum + exp.amount, 0);
        totalDebts = appData.debts.filter(debt => debt.owner === 'sven').reduce((sum, debt) => sum + debt.amount, 0);
        income = appData.profiles.sven.income;
    } else if (appData.currentProfile === 'franzi') {
        totalFixed = appData.fixedExpenses.filter(exp => exp.active && exp.account === 'franzi').reduce((sum, exp) => sum + exp.amount, 0);
        totalVariable = appData.variableExpenses.filter(exp => exp.active && exp.account === 'franzi').reduce((sum, exp) => sum + exp.amount, 0);
        totalDebts = appData.debts.filter(debt => debt.owner === 'franzi').reduce((sum, debt) => sum + debt.amount, 0);
        income = appData.profiles.franzi.income;
    } else {
        totalFixed = appData.fixedExpenses.filter(exp => exp.active && exp.account === 'shared').reduce((sum, exp) => sum + exp.amount, 0);
        totalVariable = appData.variableExpenses.filter(exp => exp.active && exp.account === 'shared').reduce((sum, exp) => sum + exp.amount, 0);
        totalDebts = appData.debts.reduce((sum, debt) => sum + debt.amount, 0);
        income = calculateTransferIncome();
    }
    
    const totalExpenses = totalFixed + totalVariable;
    const available = income - totalExpenses;
    
    const today = new Date();
    let overdueDebts = appData.debts.filter(debt => {
        if (!debt.dueDate) return false;
        const isOverdue = new Date(debt.dueDate) < today;
        if (appData.currentProfile === 'family') return isOverdue;
        return isOverdue && debt.owner === appData.currentProfile;
    });
    
    if (overdueDebts.length > 0) {
        recommendations.push({
            type: 'danger',
            title: 'Überfällige Schulden',
            text: `${overdueDebts.length} Rechnung(en) im Wert von CHF ${overdueDebts.reduce((sum, d) => sum + d.amount, 0).toLocaleString('de-CH')} sind überfällig.`
        });
    }
    
    if (balance < 1000) {
        recommendations.push({
            type: 'danger',
            title: 'Kritischer Kontostand',
            text: `Der Kontostand von CHF ${balance.toLocaleString('de-CH')} ist sehr niedrig. Notreserve empfohlen.`
        });
    } else if (balance < 5000 && appData.currentProfile !== 'family') {
        recommendations.push({
            type: 'warning',
            title: 'Kontostand aufbauen',
            text: `Mit CHF ${balance.toLocaleString('de-CH')} haben Sie eine Basis-Reserve. Ziel: CHF 5'000 für Sicherheit.`
        });
    }
    
    if (available < 0) {
        recommendations.push({
            type: 'danger',
            title: 'Budget-Überschreitung',
            text: `Sie überziehen um CHF ${Math.abs(available).toLocaleString('de-CH')}. Reduzieren Sie dringend Ihre Ausgaben.`
        });
    } else if (available < 500 && appData.currentProfile !== 'family') {
        recommendations.push({
            type: 'warning',
            title: 'Knappes Budget',
            text: `Nur CHF ${available.toLocaleString('de-CH')} verfügbar. Vorsicht bei zusätzlichen Ausgaben.`
        });
    } else if (balance >= 5000 && available >= 1000) {
        recommendations.push({
            type: 'success',
            title: 'Finanzen im grünen Bereich',
            text: `Solider Kontostand und CHF ${available.toLocaleString('de-CH')} verfügbar. Perfekt für Investitionen.`
        });
    }

    if (totalDebts > income * 2 && income > 0) {
        recommendations.push({
            type: 'warning',
            title: 'Hohe Schuldenlast',
            text: `Ihre Schulden betragen ${(totalDebts / income).toFixed(1)} Monatseinkommen. Priorisieren Sie den Schuldenabbau.`
        });
    }
    
    if (recommendations.length === 0) {
        recommendations.push({
            type: 'success',
            title: 'Alles im grünen Bereich',
            text: 'Ihre Finanzen sind gut organisiert.'
        });
    }
    
    container.innerHTML = recommendations.map(rec => `
        <div class="recommendation-card ${rec.type}">
            <div class="recommendation-title">${rec.title}</div>
            <div class="recommendation-text">${rec.text}</div>
        </div>
    `).join('');
}

// ============= CATEGORIES OVERVIEW ============= 
function updateCategoriesOverview() {
    const container = document.getElementById('categories-overview');
    if (!container) return;
    
    const categoryTotals = {};
    
    let expenses = [...appData.fixedExpenses, ...appData.variableExpenses];
    if (appData.currentProfile === 'sven') {
        expenses = expenses.filter(exp => exp.account === 'sven');
    } else if (appData.currentProfile === 'franzi') {
        expenses = expenses.filter(exp => exp.account === 'franzi');
    } else {
        expenses = expenses.filter(exp => exp.account === 'shared');
    }
    
    expenses
        .filter(exp => exp.active)
        .forEach(exp => {
            categoryTotals[exp.category] = (categoryTotals[exp.category] || 0) + exp.amount;
        });
    
    if (Object.keys(categoryTotals).length === 0) {
        container.innerHTML = '<div class="text-center" style="padding: 20px; color: #6c757d;">Noch keine Ausgaben kategorisiert</div>';
        return;
    }
    
    let income = 0;
    
    if (appData.currentProfile === 'sven') {
        income = appData.profiles.sven.income;
    } else if (appData.currentProfile === 'franzi') {
        income = appData.profiles.franzi.income;
    } else {
        income = calculateTransferIncome();
    }
    
    const sortedCategories = Object.entries(categoryTotals)
        .sort((a, b) => b[1] - a[1]);
    
    container.innerHTML = sortedCategories.map(([category, amount]) => {
        const percentage = income > 0 ? (amount / income) * 100 : 0;
        return `
            <div class="expense-item">
                <div class="expense-header">
                    <div class="expense-info">
                        <div class="expense-name">${category}</div>
                        <div class="expense-category">${percentage.toFixed(1)}% ${appData.currentProfile === 'family' ? 'der erfassten Überträge' : 'des Einkommens'}</div>
                    </div>
                    <div class="expense-amount">CHF ${amount.toLocaleString('de-CH')}</div>
                </div>
            </div>
        `;
    }).join('');
}

// ============= DEBT CATEGORIES ============= 
function updateDebtCategories() {
    const container = document.getElementById('debt-categories');
    if (!container) return;
    
    const debtsByType = {};
    
    let filteredDebts = appData.debts;
    if (appData.currentProfile === 'sven') {
        filteredDebts = appData.debts.filter(debt => debt.owner === 'sven');
    } else if (appData.currentProfile === 'franzi') {
        filteredDebts = appData.debts.filter(debt => debt.owner === 'franzi');
    }
    
    filteredDebts.forEach(debt => {
        if (!debtsByType[debt.type]) {
            debtsByType[debt.type] = 0;
        }
        debtsByType[debt.type] += debt.amount;
    });
    
    if (Object.keys(debtsByType).length === 0) {
        container.innerHTML = '<div class="text-center" style="padding: 20px; color: #6c757d;">Keine Schulden vorhanden</div>';
        return;
    }
    
    container.innerHTML = Object.entries(debtsByType)
        .sort((a, b) => b[1] - a[1])
        .map(([type, amount]) => `
            <div class="expense-item" style="margin-bottom: 10px;">
                <div class="expense-header">
                    <div class="expense-info">
                        <div class="expense-name">${type}</div>
                    </div>
                    <div class="expense-amount" style="color: #c92a2a;">CHF ${amount.toLocaleString('de-CH')}</div>
                </div>
            </div>
        `).join('');
}
