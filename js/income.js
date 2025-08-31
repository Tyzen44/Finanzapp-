// ============= INCOME MANAGEMENT WITH SAVINGS INTEGRATION ============= 

// Savings categories constant (shared with expenses.js and savings.js)
const SAVINGS_CATEGORIES = ['Säule 3a', 'Säule 3b', 'Notgroschen', 'Investitionen/ETFs', 'Aktien/Trading', 'Sparkonto'];

// Add salary entry (main function)
function addSalaryEntry() {
    const amount = parseFloat(prompt('Monatliches Gehalt (CHF):'));
    if (!amount || amount <= 0) return;
    
    addSalaryEntryWithAmount(amount);
}

// Add salary with specific amount
function addSalaryEntryWithAmount(amount) {
    if (!amount || amount <= 0) {
        alert('⚠️ Bitte geben Sie einen gültigen Betrag ein');
        return;
    }
    
    // Update income for current profile
    if (appData.currentProfile === 'sven') {
        appData.profiles.sven.income = amount;
    } else if (appData.currentProfile === 'franzi') {
        appData.profiles.franzi.income = amount;
    } else {
        alert('⚠️ Bitte wechseln Sie zu einem privaten Profil (Sven oder Franzi) um Gehalt zu erfassen.');
        return;
    }
    
    // Clear input field
    const salaryInput = document.getElementById('salary-main-input');
    if (salaryInput) {
        salaryInput.value = '';
        salaryInput.style.display = 'none';
    }
    
    // Show in display mode
    const displayMode = document.getElementById('salary-display-mode');
    const amountDisplay = document.getElementById('salary-amount-display');
    if (displayMode && amountDisplay) {
        displayMode.style.display = 'block';
        amountDisplay.textContent = `CHF ${amount.toLocaleString()}`;
    }
    
    // Update status
    const statusDiv = document.getElementById('salary-status');
    if (statusDiv) {
        statusDiv.innerHTML = `<strong>✅ Status:</strong> Gehalt von CHF ${amount.toLocaleString()} erfasst`;
        statusDiv.style.background = 'rgba(255, 255, 255, 0.3)';
    }
    
    saveData();
    calculateAll();
    updateDashboard();
    renderSalaryHistory();
    
    showNotification(`✅ Gehalt von CHF ${amount.toLocaleString()} erfasst!`, 'success');
}

// Render salary history
function renderSalaryHistory() {
    const container = document.getElementById('salary-history');
    if (!container) return;
    
    let income = 0;
    let profileName = '';
    
    if (appData.currentProfile === 'sven') {
        income = appData.profiles.sven.income || 0;
        profileName = 'Sven';
    } else if (appData.currentProfile === 'franzi') {
        income = appData.profiles.franzi.income || 0;
        profileName = 'Franzi';
    } else {
        container.innerHTML = '';
        return;
    }
    
    if (income === 0) {
        container.innerHTML = `
            <div class="settings-group">
                <div class="settings-title">📜 Gehalts-Historie</div>
                <div class="text-center" style="padding: 20px; color: #666;">
                    <p>Noch kein Gehalt erfasst</p>
                </div>
            </div>
        `;
        return;
    }
    
    container.innerHTML = `
        <div class="settings-group">
            <div class="settings-title">📜 Gehalts-Historie</div>
            <div class="expense-item">
                <div class="expense-header">
                    <div class="expense-info">
                        <div class="expense-name">Aktuelles Monatsgehalt</div>
                        <div class="expense-category">${profileName}</div>
                    </div>
                    <div class="expense-amount" style="color: #28a745;">
                        CHF ${income.toLocaleString()}
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Add additional income
function addNewIncome() {
    document.getElementById('income-modal-title').textContent = 'Einnahme hinzufügen';
    document.getElementById('income-description').value = '';
    document.getElementById('income-amount').value = '';
    document.getElementById('income-type').value = '';
    
    if (appData.currentProfile === 'sven') {
        document.getElementById('income-account').value = 'sven';
    } else if (appData.currentProfile === 'franzi') {
        document.getElementById('income-account').value = 'franzi';
    } else {
        document.getElementById('income-account').value = 'shared';
    }
    
    openModal('income-modal');
}

// Quick income entry
function addQuickIncome() {
    const description = document.getElementById('quick-income-desc').value.trim();
    const amount = parseFloat(document.getElementById('quick-income-amount').value);
    
    if (!description || !amount || amount <= 0) {
        alert('⚠️ Bitte Beschreibung und gültigen Betrag eingeben');
        return;
    }
    
    const incomeEntry = {
        id: Date.now(),
        description: description,
        amount: amount,
        type: 'Sonstiges',
        account: appData.currentProfile === 'family' ? 'shared' : appData.currentProfile,
        date: new Date().toISOString(),
        month: new Date().toLocaleDateString('de-CH', { year: 'numeric', month: 'long' })
    };
    
    if (!appData.additionalIncome) {
        appData.additionalIncome = [];
    }
    
    appData.additionalIncome.push(incomeEntry);
    
    // Clear inputs
    document.getElementById('quick-income-desc').value = '';
    document.getElementById('quick-income-amount').value = '';
    
    saveData();
    renderIncomeList();
    calculateAll();
    updateDashboard();
    
    showNotification(`✅ Einnahme "${description}" für CHF ${amount} hinzugefügt!`, 'success');
}

// Save income from modal
function saveIncome() {
    const description = document.getElementById('income-description').value.trim();
    const amount = parseFloat(document.getElementById('income-amount').value);
    const type = document.getElementById('income-type').value;
    const account = document.getElementById('income-account').value;
    
    if (!description || !amount || !type) {
        alert('⚠️ Bitte alle Felder ausfüllen');
        return;
    }
    
    const incomeEntry = {
        id: Date.now(),
        description: description,
        amount: amount,
        type: type,
        account: account,
        date: new Date().toISOString(),
        month: new Date().toLocaleDateString('de-CH', { year: 'numeric', month: 'long' })
    };
    
    if (!appData.additionalIncome) {
        appData.additionalIncome = [];
    }
    
    appData.additionalIncome.push(incomeEntry);
    
    saveData();
    renderIncomeList();
    calculateAll();
    updateDashboard();
    closeModal('income-modal');
    
    showNotification(`✅ Einnahme "${description}" erfolgreich hinzugefügt!`, 'success');
}

// Edit income entry
function editIncome(id) {
    const income = appData.additionalIncome?.find(i => i.id === id);
    if (!income) return;
    
    const newDescription = prompt('Beschreibung:', income.description);
    if (!newDescription) return;
    
    const newAmount = parseFloat(prompt('Betrag (CHF):', income.amount));
    if (!newAmount || newAmount <= 0) return;
    
    income.description = newDescription;
    income.amount = newAmount;
    
    saveData();
    renderIncomeList();
    calculateAll();
    updateDashboard();
    
    showNotification('✅ Einnahme bearbeitet!', 'success');
}

// Delete income entry
function deleteIncome(id) {
    if (!confirm('🗑️ Einnahme wirklich löschen?')) return;
    
    appData.additionalIncome = appData.additionalIncome?.filter(i => i.id !== id) || [];
    
    saveData();
    renderIncomeList();
    calculateAll();
    updateDashboard();
    
    showNotification('✅ Einnahme gelöscht!', 'success');
}

// Render income list
function renderIncomeList() {
    const container = document.getElementById('additional-income-list');
    if (!container) return;
    
    const currentMonth = new Date().toLocaleDateString('de-CH', { year: 'numeric', month: 'long' });
    let incomes = appData.additionalIncome || [];
    
    // Filter by profile
    if (appData.currentProfile !== 'family') {
        incomes = incomes.filter(i => i.account === appData.currentProfile);
    } else {
        incomes = incomes.filter(i => i.account === 'shared');
    }
    
    // Filter by current month
    incomes = incomes.filter(i => i.month === currentMonth);
    
    if (incomes.length === 0) {
        container.innerHTML = `
            <div class="text-center" style="padding: 20px; color: #666;">
                <p>Keine zusätzlichen Einnahmen diesen Monat</p>
            </div>
        `;
    } else {
        container.innerHTML = incomes.map(income => `
            <div class="expense-item">
                <div class="expense-header">
                    <div class="expense-info">
                        <div class="expense-name">${income.description}</div>
                        <div class="expense-category">${income.type}</div>
                    </div>
                    <div class="expense-amount" style="color: #28a745;">
                        CHF ${income.amount.toLocaleString()}
                    </div>
                    <div class="expense-actions">
                        <button class="action-btn edit" onclick="editIncome(${income.id})" title="Bearbeiten">
                            ✏️
                        </button>
                        <button class="action-btn delete" onclick="deleteIncome(${income.id})" title="Löschen">
                            🗑️
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    }
    
    // Update total
    const total = incomes.reduce((sum, income) => sum + income.amount, 0);
    const totalElement = document.getElementById('income-total');
    if (totalElement) {
        totalElement.textContent = `CHF ${total.toLocaleString()}`;
    }
}

// Close month - ENHANCED WITH SAVINGS PROCESSING
function closeMonth() {
    if (!confirm('📅 Monat wirklich abschließen?\n\nDas verfügbare Geld wird auf Ihr Konto übertragen und alle Spar-Ausgaben werden als Einzahlungen erfasst.')) return;
    
    const transfers = calculateTransfers();
    let income = 0;
    let totalExpenses = 0;
    
    // Get current profile
    const currentProfile = appData.currentProfile;
    
    if (currentProfile === 'sven') {
        income = appData.profiles.sven.income;
        totalExpenses = appData.fixedExpenses.filter(exp => exp.active && exp.account === 'sven').reduce((sum, exp) => sum + exp.amount, 0) +
                       appData.variableExpenses.filter(exp => exp.active && exp.account === 'sven').reduce((sum, exp) => sum + exp.amount, 0);
    } else if (currentProfile === 'franzi') {
        income = appData.profiles.franzi.income;
        totalExpenses = appData.fixedExpenses.filter(exp => exp.active && exp.account === 'franzi').reduce((sum, exp) => sum + exp.amount, 0) +
                       appData.variableExpenses.filter(exp => exp.active && exp.account === 'franzi').reduce((sum, exp) => sum + exp.amount, 0);
    } else {
        alert('⚠️ Bitte wechseln Sie zu einem privaten Profil um den Monat abzuschließen.');
        return;
    }
    
    const available = income - totalExpenses;
    
    // PROCESS SAVINGS EXPENSES AS REAL DEPOSITS
    const currentMonth = getCurrentMonth();
    const currentYear = new Date().getFullYear();
    
    // Get all active savings expenses for current profile
    const allExpenses = [...(appData.fixedExpenses || []), ...(appData.variableExpenses || [])];
    const savingsExpenses = allExpenses.filter(exp => 
        exp.active && 
        exp.account === currentProfile && 
        SAVINGS_CATEGORIES.includes(exp.category)
    );
    
    console.log(`💰 Processing ${savingsExpenses.length} savings expenses for month close`);
    
    // Process each savings expense
    savingsExpenses.forEach(expense => {
        console.log(`Processing savings expense: ${expense.name} (${expense.category}): CHF ${expense.amount}`);
        
        if (expense.category === 'Säule 3a') {
            // Add to Säule 3a deposits
            if (!appData.savings) initializeSavingsData();
            if (!appData.savings.pillar3a.deposits) appData.savings.pillar3a.deposits = [];
            
            // Check if already processed this month
            const alreadyProcessed = appData.savings.pillar3a.deposits.some(dep => 
                dep.month === currentMonth && 
                dep.fromMonthClose && 
                dep.expenseId === expense.id
            );
            
            if (!alreadyProcessed) {
                const deposit = {
                    id: Date.now() + Math.random(),
                    amount: expense.amount,
                    date: new Date().toISOString(),
                    year: currentYear,
                    month: currentMonth,
                    fromMonthClose: true,
                    fromExpense: true,
                    expenseId: expense.id,
                    description: `Monatsabschluss: ${expense.name}`,
                    account: currentProfile,
                    profile: currentProfile
                };
                
                appData.savings.pillar3a.deposits.push(deposit);
                console.log('✅ Added Säule 3a deposit:', deposit);
            }
            
        } else if (['Investitionen/ETFs', 'Aktien/Trading', 'Säule 3b'].includes(expense.category)) {
            // Add to investments
            if (!appData.savings) initializeSavingsData();
            if (!appData.savings.investments) appData.savings.investments = [];
            
            // Check if already processed this month
            const alreadyProcessed = appData.savings.investments.some(inv => 
                inv.month === currentMonth && 
                inv.fromMonthClose && 
                inv.expenseId === expense.id
            );
            
            if (!alreadyProcessed) {
                let investmentType = 'Andere';
                if (expense.category === 'Investitionen/ETFs') investmentType = 'ETF';
                else if (expense.category === 'Aktien/Trading') investmentType = 'Aktien';
                else if (expense.category === 'Säule 3b') investmentType = 'Säule 3b';
                
                const investment = {
                    id: Date.now() + Math.random(),
                    name: `Monatsabschluss: ${expense.name}`,
                    invested: expense.amount,
                    currentValue: expense.amount, // Initially same as invested
                    type: investmentType,
                    performance: 0,
                    profit: 0,
                    date: new Date().toISOString(),
                    month: currentMonth,
                    fromMonthClose: true,
                    fromExpense: true,
                    expenseId: expense.id,
                    account: currentProfile,
                    profile: currentProfile,
                    category: expense.category
                };
                
                appData.savings.investments.push(investment);
                console.log('✅ Added investment:', investment);
            }
            
        } else if (expense.category === 'Notgroschen' || expense.category === 'Sparkonto') {
            // Track in a simple way (could be enhanced with separate tracking)
            console.log(`✅ Processed ${expense.category}: ${expense.name} - CHF ${expense.amount}`);
        }
    });
    
    // Update Säule 3a yearly total if needed
    if (appData.savings && appData.savings.pillar3a) {
        const yearlyDeposits = appData.savings.pillar3a.deposits
            .filter(d => d.year === currentYear)
            .reduce((sum, d) => sum + d.amount, 0);
        appData.savings.pillar3a.yearlyDeposits = yearlyDeposits;
    }
    
    // Transfer available money to account
    if (available > 0) {
        if (currentProfile === 'sven') {
            appData.accounts.sven.balance += available;
        } else if (currentProfile === 'franzi') {
            appData.accounts.franzi.balance += available;
        }
        
        showNotification(`✅ Monat abgeschlossen!\n\n💰 CHF ${available.toLocaleString()} auf Ihr Konto übertragen.\n💎 ${savingsExpenses.length} Spar-Ausgaben als Einzahlungen erfasst.`, 'success');
    } else {
        showNotification(`⚠️ Monat abgeschlossen.\n\nKein verfügbares Geld zum Übertragen (CHF ${available.toLocaleString()}).\n💎 ${savingsExpenses.length} Spar-Ausgaben als Einzahlungen erfasst.`, 'warning');
    }
    
    // Reset income
    if (currentProfile === 'sven') {
        appData.profiles.sven.income = 0;
    } else if (currentProfile === 'franzi') {
        appData.profiles.franzi.income = 0;
    }
    
    // Reset additional income for new month
    appData.additionalIncome = [];
    
    saveData();
    calculateAll();
    updateDashboard();
    renderSalaryHistory();
    renderIncomeList();
    
    // Update savings displays
    if (typeof renderPillar3aSection !== 'undefined') renderPillar3aSection();
    if (typeof renderInvestmentsSection !== 'undefined') renderInvestmentsSection();
    if (typeof updateSavingsRecommendations !== 'undefined') updateSavingsRecommendations();
    
    // Update salary input display
    const salaryInput = document.getElementById('salary-main-input');
    const displayMode = document.getElementById('salary-display-mode');
    if (salaryInput && displayMode) {
        salaryInput.value = '';
        salaryInput.style.display = 'block';
        displayMode.style.display = 'none';
    }
    
    const statusDiv = document.getElementById('salary-status');
    if (statusDiv) {
        statusDiv.innerHTML = '<strong>⚠️ Status:</strong> Noch kein Gehalt erfasst';
        statusDiv.style.background = 'rgba(255, 255, 255, 0.2)';
    }
}

// Helper function
function getCurrentMonth() {
    return new Date().toISOString().slice(0, 7);
}
