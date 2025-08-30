// ============= PROFESSIONAL DASHBOARD UPDATE ============= 
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
                name: 'Sven Privat', 
                balance: getRealTimeBalance('sven')
            },
            { 
                id: 'franzi', 
                name: 'Franzi Privat', 
                balance: getRealTimeBalance('franzi')
            },
            { 
                id: 'shared', 
                name: 'Gemeinschaftskonto', 
                balance: getRealTimeBalance('shared')
            }
        ];

        accounts.forEach(account => {
            const accountCard = `
                <div class="account-card">
                    <div class="account-header">
                        <div class="account-title">
                            ${account.name}
                        </div>
                        <button onclick="editAccountBalance('${account.id}')" class="action-btn edit">✏️</button>
                    </div>
                    <div class="account-balance">
                        CHF ${account.balance.toLocaleString()}
                    </div>
                    <div class="account-status ${account.balance >= 0 ? 'positive' : 'negative'}">
                        ${account.balance >= 0 ? 'Positiv' : 'Negativ'}
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
            familyBalanceElement.textContent = `CHF ${totalFamilyBalance.toLocaleString()}`;
        }
        
        if (familyBalanceSummary) {
            familyBalanceSummary.style.display = 'block';
        }
    } else {
        // Individual profile shows single account with professional card
        const realTimeBalance = getRealTimeBalance(appData.currentProfile);
        const currentAccount = appData.accounts[appData.currentProfile];
        
        const accountCard = `
            <div class="account-card" style="grid-column: span 3;">
                <div class="account-header">
                    <div class="account-title">
                        ${currentAccount.name}
                    </div>
                    <button onclick="editAccountBalance()" class="action-btn edit">✏️</button>
                </div>
                <div class="account-balance-hero">
                    CHF ${realTimeBalance.toLocaleString()}
                </div>
                <div class="account-details">
                    Aktueller Kontostand (inkl. Verfügbar)
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

// NEW FUNCTION: Update dashboard statistics
function updateDashboardStats() {
    // Calculate available
    let income = 0;
    let totalExpenses = 0;
    let totalDebts = 0;
    let actualSavings = 0; // NEU: Tatsächliche Sparrate
    
    if (appData.currentProfile === 'sven') {
        income = appData.profiles.sven.income || 0;
        totalExpenses = appData.fixedExpenses.filter(exp => exp.active && exp.account === 'sven').reduce((sum, exp) => sum + exp.amount, 0) +
                       appData.variableExpenses.filter(exp => exp.active && exp.account === 'sven').reduce((sum, exp) => sum + exp.amount, 0);
        totalDebts = appData.debts.filter(debt => debt.owner === 'sven').reduce((sum, debt) => sum + debt.amount, 0);
        
        // Berechne tatsächliche Sparrate (Ausgaben mit Kategorie "Sparen")
        actualSavings = appData.fixedExpenses.filter(exp => exp.active && exp.account === 'sven' && exp.category === 'Sparen')
                           .reduce((sum, exp) => sum + exp.amount, 0) +
                       appData.variableExpenses.filter(exp => exp.active && exp.account === 'sven' && exp.category === 'Sparen')
                           .reduce((sum, exp) => sum + exp.amount, 0);
                           
    } else if (appData.currentProfile === 'franzi') {
        income = appData.profiles.franzi.income || 0;
        totalExpenses = appData.fixedExpenses.filter(exp => exp.active && exp.account === 'franzi').reduce((sum, exp) => sum + exp.amount, 0) +
                       appData.variableExpenses.filter(exp => exp.active && exp.account === 'franzi').reduce((sum, exp) => sum + exp.amount, 0);
        totalDebts = appData.debts.filter(debt => debt.owner === 'franzi').reduce((sum, debt) => sum + debt.amount, 0);
        
        // Berechne tatsächliche Sparrate (Ausgaben mit Kategorie "Sparen")
        actualSavings = appData.fixedExpenses.filter(exp => exp.active && exp.account === 'franzi' && exp.category === 'Sparen')
                           .reduce((sum, exp) => sum + exp.amount, 0) +
                       appData.variableExpenses.filter(exp => exp.active && exp.account === 'franzi' && exp.category === 'Sparen')
                           .reduce((sum, exp) => sum + exp.amount, 0);
                           
    } else {
        // Family profile
        income = calculateTransferIncome();
        totalExpenses = appData.fixedExpenses.filter(exp => exp.active && exp.account === 'shared').reduce((sum, exp) => sum + exp.amount, 0) +
                       appData.variableExpenses.filter(exp => exp.active && exp.account === 'shared').reduce((sum, exp) => sum + exp.amount, 0);
        totalDebts = appData.debts.reduce((sum, debt) => sum + debt.amount, 0);
        
        // Bei Familie: Sparrate aus gemeinsamen Spar-Ausgaben
        actualSavings = appData.fixedExpenses.filter(exp => exp.active && exp.account === 'shared' && exp.category === 'Sparen')
                           .reduce((sum, exp) => sum + exp.amount, 0) +
                       appData.variableExpenses.filter(exp => exp.active && exp.account === 'shared' && exp.category === 'Sparen')
                           .reduce((sum, exp) => sum + exp.amount, 0);
    }
    
    const available = income - totalExpenses;
    const savingsRate = income > 0 ? Math.max(0, Math.round((actualSavings / income) * 100)) : 0;
    
    // Update stat displays
    const availableElement = document.getElementById('dashboard-available');
    const debtsElement = document.getElementById('dashboard-debts');
    const savingsRateElement = document.getElementById('dashboard-savings-rate');
    
    if (availableElement) {
        availableElement.textContent = `CHF ${available.toLocaleString()}`;
        if (available < 0) {
            availableElement.classList.add('negative');
        } else {
            availableElement.classList.remove('negative');
        }
    }
    
    if (debtsElement) {
        debtsElement.textContent = `CHF ${totalDebts.toLocaleString()}`;
    }
    
    if (savingsRateElement) {
        // ANGEPASSTE ANZEIGE: Zeige tatsächliche Sparrate UND Sparbetrag
        if (actualSavings > 0) {
            savingsRateElement.innerHTML = `
                <div style="font-size: 20px; line-height: 1.2;">
                    <strong>${savingsRate}%</strong>
                    <div style="font-size: 12px; opacity: 0.9; margin-top: 2px;">
                        CHF ${actualSavings.toLocaleString()}/Monat
                    </div>
                </div>
            `;
        } else {
            savingsRateElement.innerHTML = `
                <div style="font-size: 20px; line-height: 1.2;">
                    <strong>0%</strong>
                    <div style="font-size: 12px; opacity: 0.9; margin-top: 2px;">
                        Keine Sparausgaben
                    </div>
                </div>
            `;
        }
        
        // Color coding für Sparrate basierend auf tatsächlichen Werten
        if (savingsRate >= 20) {
            savingsRateElement.style.color = 'var(--success)';
        } else if (savingsRate >= 10) {
            savingsRateElement.style.color = 'var(--gray-900)';
        } else if (savingsRate > 0) {
            savingsRateElement.style.color = 'var(--warning)';
        } else {
            savingsRateElement.style.color = 'var(--error)';
        }
    }
}

// KEEP EXISTING: Get real-time balance function
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
    
    if (balanceDisplay) balanceDisplay.textContent = `CHF ${balance.toLocaleString()}`;
    if (wealthDisplay) wealthDisplay.textContent = `CHF ${balance.toLocaleString()}`;
    if (incomeDisplay) incomeDisplay.textContent = income.toLocaleString();
    if (totalExpensesDisplay) totalExpensesDisplay.textContent = totalExpenses.toLocaleString();
    if (availableDisplay) availableDisplay.textContent = available.toLocaleString();
    if (fixedTotal) fixedTotal.textContent = `CHF ${totalFixed.toLocaleString()}`;
    if (variableTotal) variableTotal.textContent = `CHF ${totalVariable.toLocaleString()}`;
    
    const debtsDisplay = document.getElementById('debts-total');
    if (debtsDisplay) {
        debtsDisplay.textContent = `CHF ${totalDebts.toLocaleString()}`;
    }

    const transfersDisplay = document.getElementById('transfers-display');
    if (transfersDisplay) {
        if (appData.currentProfile === 'sven') {
            transfersDisplay.textContent = transfers.fromSven.toLocaleString();
        } else if (appData.currentProfile === 'franzi') {
            transfersDisplay.textContent = transfers.fromFranzi.toLocaleString();
        } else {
            transfersDisplay.textContent = transfers.total.toLocaleString();
        }
    }

    const balanceHero = document.querySelector('.balance-hero');
    if (balanceHero) {
        if (balance < 1000) {
            balanceHero.style.background = 'linear-gradient(135deg, #e74c3c, #c0392b)';
        } else if (balance < 5000) {
            balanceHero.style.background = 'linear-gradient(135deg, #f39c12, #e67e22)';
        } else {
            balanceHero.style.background = 'linear-gradient(135deg, #27ae60, #229954)';
        }
    }

    const overviewLabel = document.getElementById('overview-account-label');
    if (overviewLabel) {
        if (appData.currentProfile === 'sven') {
            overviewLabel.textContent = 'Sven Privat';
        } else if (appData.currentProfile === 'franzi') {
            overviewLabel.textContent = 'Franzi Privat';
        } else {
            overviewLabel.textContent = 'Gemeinschaftskonto';
        }
    }

    const trendElement = document.getElementById('balance-trend');
    const availableStat = document.getElementById('available-stat');
    
    if (trendElement) {
        if (available >= 0) {
            trendElement.textContent = `📈 +CHF ${available.toLocaleString()} monatlich`;
            trendElement.className = 'balance-trend text-success';
            if (availableStat) {
                availableStat.style.background = 'linear-gradient(135deg, #d4edda, #c3e6cb)';
            }
        } else {
            trendElement.textContent = `📉 CHF ${available.toLocaleString()} monatlich`;
            trendElement.className = 'balance-trend text-danger';
            if (availableStat) {
                availableStat.style.background = 'linear-gradient(135deg, #f8d7da, #f5c6cb)';
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

// ============= RECOMMENDATIONS (KEEP EXISTING) ============= 
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
            title: '⚠️ Überfällige Schulden',
            text: `${overdueDebts.length} Rechnung(en) im Wert von CHF ${overdueDebts.reduce((sum, d) => sum + d.amount, 0).toLocaleString()}.- sind überfällig!`
        });
    }
    
    if (balance < 1000) {
        recommendations.push({
            type: 'danger',
            title: '🚨 Kritischer Kontostand',
            text: `Der Kontostand von CHF ${balance.toLocaleString()}.- ist sehr niedrig. Notreserve empfohlen!`
        });
    } else if (balance < 5000 && appData.currentProfile !== 'family') {
        recommendations.push({
            type: 'warning',
            title: '⚠️ Kontostand aufbauen',
            text: `Mit CHF ${balance.toLocaleString()}.- haben Sie eine Basis-Reserve. Ziel: CHF 5'000.- für Sicherheit.`
        });
    }
    
    if (available < 0) {
        recommendations.push({
            type: 'danger',
            title: '🚨 Budget-Überschreitung',
            text: `Sie überziehen um CHF ${Math.abs(available).toLocaleString()}.-. Reduzieren Sie dringend Ihre Ausgaben.`
        });
    } else if (available < 500 && appData.currentProfile !== 'family') {
        recommendations.push({
            type: 'warning',
            title: '⚠️ Knappes Budget',
            text: `Nur CHF ${available.toLocaleString()}.- verfügbar. Vorsicht bei zusätzlichen Ausgaben!`
        });
    } else if (balance >= 5000 && available >= 1000) {
        recommendations.push({
            type: 'success',
            title: '✅ Finanzen im grünen Bereich',
            text: `Solider Kontostand und CHF ${available.toLocaleString()}.- verfügbar. Perfekt für Investitionen!`
        });
    }

    if (totalDebts > income * 2 && income > 0) {
        recommendations.push({
            type: 'warning',
            title: '📋 Hohe Schuldenlast',
            text: `Ihre Schulden betragen ${(totalDebts / income).toFixed(1)} Monatseinkommen. Priorisieren Sie den Schuldenabbau.`
        });
    } else if (totalDebts > 0 && totalDebts < income * 0.5) {
        recommendations.push({
            type: 'info',
            title: '📋 Schulden manageable',
            text: `Schulden von CHF ${totalDebts.toLocaleString()}.- sind gut kontrollierbar.`
        });
    }

    if (appData.currentProfile === 'family' && income === 0) {
        recommendations.push({
            type: 'warning',
            title: '💸 Keine Überträge als Ausgaben erfasst',
            text: 'Gemeinschaftskonto hat keine aktiven Übertrag-Ausgaben. Erfassen Sie Überträge als "Überträge" Kategorie in den privaten Profilen.'
        });
    }

    if (appData.currentProfile !== 'family' && calculateTransfers()[appData.currentProfile === 'sven' ? 'fromSven' : 'fromFranzi'] === 0) {
        recommendations.push({
            type: 'info',
            title: '💡 Überträge erstellen',
            text: 'Sie können Geld von Ihrem privaten Konto zum Gemeinschaftskonto übertragen.'
        });
    }
    
    if (recommendations.length === 0) {
        recommendations.push({
            type: 'success',
            title: '🎉 Alles im grünen Bereich',
            text: 'Ihre Finanzen sind gut organisiert. Weiter so!'
        });
    }
    
    container.innerHTML = recommendations.map(rec => `
        <div class="recommendation-card ${rec.type}">
            <div class="recommendation-title">${rec.title}</div>
            <div class="recommendation-text">${rec.text}</div>
        </div>
    `).join('');
}

// ============= CATEGORIES OVERVIEW (KEEP EXISTING) ============= 
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
        container.innerHTML = '<div class="text-center" style="padding: 20px; color: #666;">Noch keine Ausgaben kategorisiert</div>';
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
                    <div class="expense-amount">CHF ${amount.toLocaleString()}</div>
                </div>
            </div>
        `;
    }).join('');
}

// ============= DEBT CATEGORIES (KEEP EXISTING) ============= 
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
        container.innerHTML = '<div class="text-center" style="padding: 20px; color: #666;">Keine Schulden vorhanden</div>';
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
                    <div class="expense-amount" style="color: #e74c3c;">CHF ${amount.toLocaleString()}</div>
                </div>
            </div>
        `).join('');
}
