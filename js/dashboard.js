// ============= DASHBOARD UPDATE ============= 
function updateDashboard() {
    const dashboardGrid = document.querySelector('.dashboard-grid');
    if (!dashboardGrid) return;

    // Clear existing content
    dashboardGrid.innerHTML = '';

    if (appData.currentProfile === 'family') {
        // Family profile shows all three accounts
        const accounts = [
            { id: 'sven', name: 'Sven Privat', icon: '👤', balance: appData.accounts.sven.balance },
            { id: 'franzi', name: 'Franzi Privat', icon: '👤', balance: appData.accounts.franzi.balance },
            { id: 'shared', name: 'Gemeinschaftskonto', icon: '👥', balance: appData.accounts.shared.balance }
        ];

        accounts.forEach(account => {
            const accountCard = `
                <div class="account-card">
                    <div class="account-header">
                        <div class="account-title">
                            <span>${account.icon}</span>
                            ${account.name}
                        </div>
                        <button onclick="editAccountBalance('${account.id}')" class="action-btn edit">✏️</button>
                    </div>
                    <div class="account-balance" style="color: ${account.balance >= 0 ? '#28a745' : '#dc3545'}">
                        CHF ${account.balance.toLocaleString()}
                    </div>
                    <div class="account-details">
                        ${account.balance >= 0 ? '✅ Positiv' : '⚠️ Negativ'}
                    </div>
                </div>
            `;
            dashboardGrid.insertAdjacentHTML('beforeend', accountCard);
        });

        // Update family balance summary
        const totalFamilyBalance = appData.accounts.sven.balance + appData.accounts.franzi.balance + appData.accounts.shared.balance;
        const familyBalanceElement = document.getElementById('total-family-balance');
        const familyBalanceSummary = document.getElementById('family-balance-summary');
        
        if (familyBalanceElement) {
            familyBalanceElement.textContent = `CHF ${totalFamilyBalance.toLocaleString()}`;
        }
        
        if (familyBalanceSummary) {
            familyBalanceSummary.style.display = 'block';
            if (totalFamilyBalance >= 0) {
                familyBalanceSummary.style.background = 'linear-gradient(135deg, #28a745, #34ce57)';
            } else {
                familyBalanceSummary.style.background = 'linear-gradient(135deg, #dc3545, #e74c3c)';
            }
        }
    } else {
        // Individual profile shows single account
        const currentAccount = appData.accounts[appData.currentProfile];
        const accountCard = `
            <div class="account-card">
                <div class="account-header">
                    <div class="account-title">
                        <span>${appData.currentProfile === 'sven' ? '👤' : '👤'}</span>
                        ${currentAccount.name}
                    </div>
                    <button onclick="editAccountBalance()" class="action-btn edit">✏️</button>
                </div>
                <div class="account-balance" style="color: ${currentAccount.balance >= 0 ? '#28a745' : '#dc3545'}">
                    CHF ${currentAccount.balance.toLocaleString()}
                </div>
                <div class="account-details">
                    Aktueller Kontostand
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

    // Update transfer box
    updateTransferBox();
}

function updateTransferBox() {
    const transferBox = document.getElementById('transfer-box');
    const transferAmount = document.getElementById('transfer-amount');
    const transferText = document.getElementById('transfer-text');
    const transferButton = document.getElementById('transfer-button');

    if (!transferBox) return;

    const transfers = calculateTransfers();

    if (appData.currentProfile === 'sven') {
        transferAmount.textContent = `CHF ${transfers.fromSven.toLocaleString()}`;
        transferText.textContent = `Überträge von Sven zum Gemeinschaftskonto`;
        transferButton.textContent = '💸 Übertrag erstellen';
        transferButton.style.display = 'block';
    } else if (appData.currentProfile === 'franzi') {
        transferAmount.textContent = `CHF ${transfers.fromFranzi.toLocaleString()}`;
        transferText.textContent = `Überträge von Franzi zum Gemeinschaftskonto`;
        transferButton.textContent = '💸 Übertrag erstellen';
        transferButton.style.display = 'block';
    } else {
        transferAmount.textContent = `CHF ${transfers.total.toLocaleString()}`;
        transferText.textContent = `Gesamt-Zuflüsse von privaten Konten`;
        transferButton.style.display = 'none';
    }
}

// ============= CALCULATIONS ============= 
function calculateAll() {
    let totalFixed = 0;
    let totalVariable = 0;
    let totalDebts = 0;
    let income = 0;
    let balance = 0;
    
    const transfers = calculateTransfersByProfile(); // Use the fixed calculation
    
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
        balance = appData.accounts.sven.balance || 0;
        
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
        balance = appData.accounts.franzi.balance || 0;
        
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
        
        // Use the corrected transfer income calculation
        income = calculateTransferIncome();
        balance = appData.accounts.shared.balance || 0;
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

    // Debug output
    console.log('💰 Calculations completed:', {
        profile: appData.currentProfile,
        income,
        totalExpenses,
        available,
        transfers
    });

    updateRecommendations();
    updateCategoriesOverview();
    updateDebtCategories();
}

function getCurrentBalance() {
    if (appData.currentProfile === 'sven') {
        return appData.accounts.sven.balance;
    } else if (appData.currentProfile === 'franzi') {
        return appData.accounts.franzi.balance;
    } else {
        return appData.accounts.shared.balance;
    }
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
        income = calculateTransferIncome(); // Use the corrected calculation
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
