// ============= INCOME MANAGEMENT WITH STRICT PROFILE FILTERING ============= 

// Helper function to determine investment type from category
function getInvestmentTypeFromCategory(category) {
    switch(category) {
        case 'Investitionen/ETFs':
            return 'ETF';
        case 'Aktien/Trading':
            return 'Aktien';
        case 'Säule 3b':
            return 'Säule 3b';
        case 'Notgroschen':
            return 'Notgroschen';
        case 'Sparkonto':
            return 'Sparkonto';
        default:
            return 'Andere';
    }
}

// Add salary entry (main function)
function addSalaryEntry() {
    // Only allow for individual profiles
    if (appData.currentProfile === 'family') {
        alert('⚠️ Bitte wechseln Sie zu einem privaten Profil (Sven oder Franzi) um Gehalt zu erfassen.');
        return;
    }
    
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
    
    // Only allow for individual profiles
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
    
    // STRICT PROFILE FILTERING - Only show for individual profiles
    if (appData.currentProfile === 'sven') {
        income = appData.profiles.sven.income || 0;
        profileName = 'Sven';
    } else if (appData.currentProfile === 'franzi') {
        income = appData.profiles.franzi.income || 0;
        profileName = 'Franzi';
    } else {
        // Family profile doesn't have salary
        container.innerHTML = `
            <div class="settings-group">
                <div class="settings-title">📜 Gehalts-Historie</div>
                <div class="text-center" style="padding: 20px; color: #666;">
                    <p>Gehälter werden in den privaten Profilen erfasst</p>
                    <p style="font-size: 14px; margin-top: 10px;">Wechseln Sie zu Sven oder Franzi</p>
                </div>
            </div>
        `;
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
    
    // Set default account based on current profile
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

// Render income list with STRICT PROFILE FILTERING
function renderIncomeList() {
    const container = document.getElementById('additional-income-list');
    if (!container) return;
    
    const currentMonth = new Date().toLocaleDateString('de-CH', { year: 'numeric', month: 'long' });
    let incomes = appData.additionalIncome || [];
    
    // STRICT PROFILE FILTERING
    if (appData.currentProfile === 'sven') {
        incomes = incomes.filter(i => i.account === 'sven');
    } else if (appData.currentProfile === 'franzi') {
        incomes = incomes.filter(i => i.account === 'franzi');
    } else {
        // Family profile shows ONLY shared income
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

// ============= COMPLETELY REDESIGNED CLOSE MONTH FUNCTION =============
function closeMonth() {
    // Only allow for individual profiles
    if (appData.currentProfile === 'family') {
        alert('⚠️ Bitte wechseln Sie zu einem privaten Profil um den Monat abzuschließen.');
        return;
    }
    
    // STEP 1: Ask for THIS month's salary FIRST
    const salaryInput = prompt('💰 Ihr Gehalt für diesen Monat (CHF):', 
        appData.profiles[appData.currentProfile].income || '');
    
    if (salaryInput === null) return; // User cancelled
    
    const salary = parseFloat(salaryInput);
    if (!salary || salary <= 0) {
        alert('⚠️ Bitte geben Sie ein gültiges Gehalt ein');
        return;
    }
    
    // STEP 2: Calculate current expenses (before deletion)
    const fixedExpenses = appData.fixedExpenses
        .filter(exp => exp.active && exp.account === appData.currentProfile)
        .reduce((sum, exp) => sum + exp.amount, 0);
    
    const variableExpenses = appData.variableExpenses
        .filter(exp => exp.active && exp.account === appData.currentProfile)
        .reduce((sum, exp) => sum + exp.amount, 0);
    
    const totalExpenses = fixedExpenses + variableExpenses;
    const available = salary - totalExpenses;
    
    // STEP 3: Show detailed confirmation
    const confirmMessage = `📅 Monat abschließen?\n\n` +
        `💰 Gehalt: CHF ${salary.toLocaleString()}\n` +
        `🏢 Fixkosten: CHF ${fixedExpenses.toLocaleString()}\n` +
        `🛒 Variable: CHF ${variableExpenses.toLocaleString()}\n` +
        `➖ ─────────────\n` +
        `✅ Verfügbar: CHF ${available.toLocaleString()}\n\n` +
        `📋 Was passiert:\n` +
        `✓ Variable Ausgaben werden gelöscht\n` +
        `✓ Verfügbares wird auf Konto übertragen\n` +
        `✓ Spar-Ausgaben werden erfasst\n` +
        `✓ Neuer Monat startet`;
    
    if (!confirm(confirmMessage)) return;
    
    // STEP 4: Process savings expenses (existing logic)
    const currentMonth = new Date().toLocaleDateString('de-CH', { year: 'numeric', month: 'long' });
    const savingsExpenses = [...appData.fixedExpenses, ...appData.variableExpenses]
        .filter(exp => exp.active && 
                      exp.account === appData.currentProfile && 
                      SAVINGS_CATEGORIES.includes(exp.category));
    
    console.log('📊 Processing savings expenses for month close:', savingsExpenses.length);
    
    // Initialize savings if needed
    if (!appData.savings) {
        if (typeof initializeSavingsData !== 'undefined') {
            initializeSavingsData();
        }
    }
    
    let savingsMessage = '';
    if (savingsExpenses.length > 0) {
        savingsExpenses.forEach(expense => {
            const closingEntry = {
                month: currentMonth,
                profile: appData.currentProfile
            };
            
            if (expense.category === 'Säule 3a') {
                if (!appData.savings.pillar3a.deposits) {
                    appData.savings.pillar3a.deposits = [];
                }
                
                const alreadyRecorded = appData.savings.pillar3a.deposits.some(d => 
                    d.closingEntry && 
                    d.closingEntry.month === currentMonth && 
                    d.closingEntry.profile === appData.currentProfile &&
                    d.description === expense.name
                );
                
                if (!alreadyRecorded) {
                    const deposit = {
                        id: Date.now() + Math.random(),
                        amount: expense.amount,
                        date: new Date().toISOString(),
                        year: new Date().getFullYear(),
                        month: currentMonth,
                        description: `Monatsabschluss: ${expense.name}`,
                        account: appData.currentProfile,
                        closingEntry: closingEntry
                    };
                    
                    appData.savings.pillar3a.deposits.push(deposit);
                    console.log('💰 Recorded Säule 3a deposit:', deposit);
                }
                
            } else if (expense.category === 'Investitionen/ETFs' || 
                      expense.category === 'Aktien/Trading' || 
                      expense.category === 'Säule 3b' ||
                      expense.category === 'Notgroschen' ||
                      expense.category === 'Sparkonto') {
                if (!appData.savings.investments) {
                    appData.savings.investments = [];
                }
                
                const alreadyRecorded = appData.savings.investments.some(inv => 
                    inv.closingEntry && 
                    inv.closingEntry.month === currentMonth && 
                    inv.closingEntry.profile === appData.currentProfile &&
                    inv.name === expense.name
                );
                
                if (!alreadyRecorded) {
                    const investmentType = getInvestmentTypeFromCategory(expense.category);
                    const investment = {
                        id: Date.now() + Math.random(),
                        name: `Monatsabschluss: ${expense.name}`,
                        invested: expense.amount,
                        currentValue: expense.amount,
                        type: investmentType,
                        performance: 0,
                        profit: 0,
                        date: new Date().toISOString(),
                        month: currentMonth,
                        account: appData.currentProfile,
                        closingEntry: closingEntry
                    };
                    
                    appData.savings.investments.push(investment);
                    console.log('📈 Recorded investment:', investment);
                }
            }
        });
        
        const totalSavings = savingsExpenses.reduce((sum, exp) => sum + exp.amount, 0);
        savingsMessage = `\n\n💰 Spar-Ausgaben von CHF ${totalSavings.toLocaleString()} wurden als tatsächliche Einzahlungen erfasst.`;
    }
    
    // STEP 5: DELETE all variable expenses for this profile
    const variableExpensesCount = appData.variableExpenses.filter(exp => exp.account === appData.currentProfile).length;
    appData.variableExpenses = appData.variableExpenses.filter(exp => 
        exp.account !== appData.currentProfile
    );
    console.log(`🗑️ Deleted ${variableExpensesCount} variable expenses for ${appData.currentProfile}`);
    
    // STEP 6: Transfer available amount to account balance
    if (available > 0) {
        appData.accounts[appData.currentProfile].balance += available;
        console.log(`💳 Added CHF ${available.toLocaleString()} to ${appData.currentProfile} balance`);
    }
    
    // STEP 7: Save the NEW salary for next month
    appData.profiles[appData.currentProfile].income = salary;
    console.log(`💰 Saved salary CHF ${salary.toLocaleString()} for next month`);
    
    // STEP 8: Reset additional income for new month
    appData.additionalIncome = appData.additionalIncome?.filter(inc => 
        inc.account !== appData.currentProfile
    ) || [];
    
    // STEP 9: Save everything
    saveData();
    
    // STEP 10: Update all UI elements
    calculateAll();
    updateDashboard();
    renderSalaryHistory();
    renderIncomeList();
    renderExpenses('variable'); // Show now-empty variable expenses
    renderExpenses('fixed');
    
    // Update savings displays
    if (typeof renderPillar3aSection !== 'undefined') renderPillar3aSection();
    if (typeof renderInvestmentsSection !== 'undefined') renderInvestmentsSection();
    if (typeof updateSavingsRecommendations !== 'undefined') updateSavingsRecommendations();
    
    // STEP 11: Reset salary input display to show the new salary
    const salaryInput = document.getElementById('salary-main-input');
    const displayMode = document.getElementById('salary-display-mode');
    const amountDisplay = document.getElementById('salary-amount-display');
    
    if (salaryInput && displayMode && amountDisplay) {
        salaryInput.value = '';
        salaryInput.style.display = 'none';
        displayMode.style.display = 'block';
        amountDisplay.textContent = `CHF ${salary.toLocaleString()}`;
    }
    
    const statusDiv = document.getElementById('salary-status');
    if (statusDiv) {
        statusDiv.innerHTML = `<strong>✅ Status:</strong> Neuer Monat gestartet mit CHF ${salary.toLocaleString()}`;
        statusDiv.style.background = 'rgba(255, 255, 255, 0.3)';
    }
    
    // STEP 12: Show success notification
    const resultMessage = available > 0 
        ? `✅ Monat erfolgreich abgeschlossen!\n\n💳 CHF ${available.toLocaleString()} auf Ihr Konto übertragen.\n🗑️ ${variableExpensesCount} variable Ausgaben gelöscht.\n💰 Neuer Monat startet mit CHF ${salary.toLocaleString()}.${savingsMessage}`
        : `⚠️ Monat abgeschlossen.\n\n${available === 0 ? 'Kein' : 'Negatives'} verfügbares Geld (CHF ${available.toLocaleString()}).\n🗑️ ${variableExpensesCount} variable Ausgaben gelöscht.\n💰 Neuer Monat startet mit CHF ${salary.toLocaleString()}.${savingsMessage}`;
    
    showNotification(resultMessage, available > 0 ? 'success' : 'warning');
}
