// ============= INCOME MANAGEMENT ============= 

// Add salary entry (main function)
function addSalaryEntry() {
    const amount = parseFloat(prompt('Monatliches Gehalt (CHF):'));
    if (!amount || amount <= 0) return;
    
    addSalaryEntryWithAmount(amount);
}

// Add salary with specific amount
function addSalaryEntryWithAmount(amount) {
    if (!amount || amount <= 0) {
        alert('Ã¢Å¡ Ã¯Â¸Â Bitte geben Sie einen gÃƒÂ¼ltigen Betrag ein');
        return;
    }
    
    // Update income for current profile
    if (appData.currentProfile === 'sven') {
        appData.profiles.sven.income = amount;
    } else if (appData.currentProfile === 'franzi') {
        appData.profiles.franzi.income = amount;
    } else {
        alert('Ã¢Å¡ Ã¯Â¸Â Bitte wechseln Sie zu einem privaten Profil (Sven oder Franzi) um Gehalt zu erfassen.');
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
        statusDiv.innerHTML = `<strong>Ã¢Å“â€¦ Status:</strong> Gehalt von CHF ${amount.toLocaleString()} erfasst`;
        statusDiv.style.background = 'rgba(255, 255, 255, 0.3)';
    }
    
    saveData();
    calculateAll();
    updateDashboard();
    renderSalaryHistory();
    
    showNotification(`Ã¢Å“â€¦ Gehalt von CHF ${amount.toLocaleString()} erfasst!`, 'success');
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
                <div class="settings-title">Ã°Å¸â€œÅ“ Gehalts-Historie</div>
                <div class="text-center" style="padding: 20px; color: #666;">
                    <p>Noch kein Gehalt erfasst</p>
                </div>
            </div>
        `;
        return;
    }
    
    container.innerHTML = `
        <div class="settings-group">
            <div class="settings-title">Ã°Å¸â€œÅ“ Gehalts-Historie</div>
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
    document.getElementById('income-modal-title').textContent = 'Einnahme hinzufÃƒÂ¼gen';
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
        alert('Ã¢Å¡ Ã¯Â¸Â Bitte Beschreibung und gÃƒÂ¼ltigen Betrag eingeben');
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
    
    showNotification(`Ã¢Å“â€¦ Einnahme "${description}" fÃƒÂ¼r CHF ${amount} hinzugefÃƒÂ¼gt!`, 'success');
}

// Save income from modal
function saveIncome() {
    const description = document.getElementById('income-description').value.trim();
    const amount = parseFloat(document.getElementById('income-amount').value);
    const type = document.getElementById('income-type').value;
    const account = document.getElementById('income-account').value;
    
    if (!description || !amount || !type) {
        alert('Ã¢Å¡ Ã¯Â¸Â Bitte alle Felder ausfÃƒÂ¼llen');
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
    
    showNotification(`Ã¢Å“â€¦ Einnahme "${description}" erfolgreich hinzugefÃƒÂ¼gt!`, 'success');
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
    
    showNotification('Ã¢Å“â€¦ Einnahme bearbeitet!', 'success');
}

// Delete income entry
function deleteIncome(id) {
    if (!confirm('Ã°Å¸â€”â€˜Ã¯Â¸Â Einnahme wirklich lÃƒÂ¶schen?')) return;
    
    appData.additionalIncome = appData.additionalIncome?.filter(i => i.id !== id) || [];
    
    saveData();
    renderIncomeList();
    calculateAll();
    updateDashboard();
    
    showNotification('Ã¢Å“â€¦ Einnahme gelÃƒÂ¶scht!', 'success');
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
                <p>Keine zusÃƒÂ¤tzlichen Einnahmen diesen Monat</p>
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
                            Ã¢Å“ÂÃ¯Â¸Â
                        </button>
                        <button class="action-btn delete" onclick="deleteIncome(${income.id})" title="LÃƒÂ¶schen">
                            Ã°Å¸â€”â€˜Ã¯Â¸Â
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

// Close month
function closeMonth() {
    if (!confirm('Ã°Å¸â€œâ€¦ Monat wirklich abschlieÃƒÅ¸en?\n\nDas verfÃƒÂ¼gbare Geld wird auf Ihr Konto ÃƒÂ¼bertragen.')) return;
    
    const transfers = calculateTransfers();
    let income = 0;
    let totalExpenses = 0;
    
    if (appData.currentProfile === 'sven') {
        income = appData.profiles.sven.income;
        totalExpenses = appData.fixedExpenses.filter(exp => exp.active && exp.account === 'sven').reduce((sum, exp) => sum + exp.amount, 0) +
                       appData.variableExpenses.filter(exp => exp.active && exp.account === 'sven').reduce((sum, exp) => sum + exp.amount, 0);
    } else if (appData.currentProfile === 'franzi') {
        income = appData.profiles.franzi.income;
        totalExpenses = appData.fixedExpenses.filter(exp => exp.active && exp.account === 'franzi').reduce((sum, exp) => sum + exp.amount, 0) +
                       appData.variableExpenses.filter(exp => exp.active && exp.account === 'franzi').reduce((sum, exp) => sum + exp.amount, 0);
    } else {
        alert('Ã¢Å¡ Ã¯Â¸Â Bitte wechseln Sie zu einem privaten Profil um den Monat abzuschlieÃƒÅ¸en.');
        return;
    }
    
    const available = income - totalExpenses;
    
    if (available > 0) {
        if (appData.currentProfile === 'sven') {
            appData.accounts.sven.balance += available;
        } else if (appData.currentProfile === 'franzi') {
            appData.accounts.franzi.balance += available;
        }
        
        showNotification(`Ã¢Å“â€¦ Monat abgeschlossen!\n\nCHF ${available.toLocaleString()} auf Ihr Konto ÃƒÂ¼bertragen.`, 'success');
    } else {
        showNotification(`Ã¢Å¡ Ã¯Â¸Â Monat abgeschlossen.\n\nKein verfÃƒÂ¼gbares Geld zum ÃƒÅ“bertragen (CHF ${available.toLocaleString()}).`, 'warning');
    }
    
    // Reset income
    if (appData.currentProfile === 'sven') {
        appData.profiles.sven.income = 0;
    } else if (appData.currentProfile === 'franzi') {
        appData.profiles.franzi.income = 0;
    }
    
    // Reset additional income for new month
    appData.additionalIncome = [];
    
    saveData();
    calculateAll();
    updateDashboard();
    renderSalaryHistory();
    renderIncomeList();
    
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
        statusDiv.innerHTML = '<strong>Ã¢Å¡ Ã¯Â¸Â Status:</strong> Noch kein Gehalt erfasst';
        statusDiv.style.background = 'rgba(255, 255, 255, 0.2)';
    }
}
