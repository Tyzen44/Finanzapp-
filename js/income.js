// ============= INCOME MANAGEMENT WITH PROMINENT SALARY TRACKING ============= 
let currentIncome = null;

// Add income entries to appData structure
if (!appData.incomeEntries) {
    appData.incomeEntries = [];
}

// Add salary tracking
if (!appData.salaryHistory) {
    appData.salaryHistory = [];
}

function addNewIncome() {
    currentIncome = null;
    
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

// ENHANCED: Add salary entry function with better UX
function addSalaryEntry() {
    if (appData.currentProfile === 'family') {
        alert('⚠️ Gehaltseingabe nur für private Profile (Sven/Franzi) möglich.');
        return;
    }
    
    const profileName = appData.currentProfile === 'sven' ? 'Sven' : 'Franzi';
    const currentMonth = new Date().toLocaleDateString('de-CH', { month: 'long', year: 'numeric' });
    
    // Check if salary already exists for this month
    const existingSalary = appData.salaryHistory.find(s => 
        s.profile === appData.currentProfile && 
        s.month === getCurrentMonth()
    );
    
    if (existingSalary) {
        if (!confirm(`⚠️ Es wurde bereits ein Gehalt für ${currentMonth} erfasst (CHF ${existingSalary.amount.toLocaleString()}).\n\nMöchten Sie es überschreiben?`)) {
            return;
        }
    }
    
    const salaryAmount = parseFloat(prompt(`💰 Gehalt für ${profileName} im ${currentMonth}:\n\n(Nach Eingabe wird der Monat automatisch abgeschlossen)`));
    
    if (!salaryAmount || salaryAmount <= 0) return;
    
    // Remove existing salary for this month if exists
    appData.salaryHistory = appData.salaryHistory.filter(s => 
        !(s.profile === appData.currentProfile && s.month === getCurrentMonth())
    );
    
    // Save salary to history
    const salaryEntry = {
        id: Date.now(),
        profile: appData.currentProfile,
        amount: salaryAmount,
        month: getCurrentMonth(),
        monthName: currentMonth,
        date: new Date().toISOString()
    };
    
    appData.salaryHistory.push(salaryEntry);
    
    // Calculate available amount (salary - expenses)
    const fixedExpenses = appData.fixedExpenses
        .filter(exp => exp.active && exp.account === appData.currentProfile)
        .reduce((sum, exp) => sum + exp.amount, 0);
    const variableExpenses = appData.variableExpenses
        .filter(exp => exp.active && exp.account === appData.currentProfile)
        .reduce((sum, exp) => sum + exp.amount, 0);
    
    // Add additional income from this month
    const additionalIncome = appData.incomeEntries
        .filter(inc => inc.account === appData.currentProfile && inc.month === getCurrentMonth())
        .reduce((sum, inc) => sum + inc.amount, 0);
    
    const totalIncome = salaryAmount + additionalIncome;
    const totalExpenses = fixedExpenses + variableExpenses;
    const available = totalIncome - totalExpenses;
    
    // Show summary with better formatting
    const confirmMessage = `📊 Monatsabschluss ${currentMonth}\n\n` +
        `✅ Gehalt: CHF ${salaryAmount.toFixed(2)}\n` +
        `➕ Zusätzliche Einnahmen: CHF ${additionalIncome.toFixed(2)}\n` +
        `➖ Ausgaben: CHF ${totalExpenses.toFixed(2)}\n` +
        `━━━━━━━━━━━━━━━━━━━\n` +
        `💰 Verfügbar: CHF ${available.toFixed(2)}\n\n` +
        `Dieser Betrag wird auf Ihr Privatkonto übertragen.\n` +
        `⚠️ Variable Ausgaben werden zurückgesetzt.`;
    
    if (!confirm(confirmMessage)) return;
    
    // Add available amount to account balance
    if (appData.currentProfile === 'sven') {
        appData.accounts.sven.balance += available;
    } else {
        appData.accounts.franzi.balance += available;
    }
    
    // Clear variable expenses for this profile
    appData.variableExpenses = appData.variableExpenses.filter(exp => 
        exp.account !== appData.currentProfile
    );
    
    // Clear income entries for this month
    appData.incomeEntries = appData.incomeEntries.filter(inc => 
        inc.account !== appData.currentProfile || inc.month !== getCurrentMonth()
    );
    
    // Save and update
    saveData();
    renderExpenses('variable');
    renderIncomeList();
    renderSalaryHistory();
    updateSalaryDisplay();
    calculateAll();
    updateDashboard();
    
    showNotification(
        `✅ Gehalt erfasst und Monat abgeschlossen!\n\n` +
        `CHF ${available.toFixed(2)} wurden auf Ihr Privatkonto übertragen.`,
        'success'
    );
}

// NEW: Update salary display in the prominent section
function updateSalaryDisplay() {
    const currentSalaryDisplay = document.getElementById('current-salary-display');
    const salaryStatus = document.getElementById('salary-status');
    
    if (!currentSalaryDisplay || !salaryStatus) return;
    
    const currentMonth = getCurrentMonth();
    const currentProfileSalaries = appData.salaryHistory.filter(s => 
        s.profile === appData.currentProfile && s.month === currentMonth
    );
    
    if (currentProfileSalaries.length > 0) {
        const latestSalary = currentProfileSalaries[currentProfileSalaries.length - 1];
        currentSalaryDisplay.textContent = `CHF ${latestSalary.amount.toLocaleString()}`;
        salaryStatus.innerHTML = `
            <strong>✅ Status:</strong> Gehalt für ${latestSalary.monthName} erfasst<br>
            <small>Erfasst am ${new Date(latestSalary.date).toLocaleDateString('de-CH')}</small>
        `;
        salaryStatus.style.background = 'rgba(255, 255, 255, 0.3)';
    } else {
        const monthName = new Date().toLocaleDateString('de-CH', { month: 'long', year: 'numeric' });
        currentSalaryDisplay.textContent = 'CHF 0';
        salaryStatus.innerHTML = `
            <strong>⚠️ Status:</strong> Noch kein Gehalt für ${monthName} erfasst<br>
            <small>Klicken Sie den Button um Ihr Gehalt einzutragen</small>
        `;
        salaryStatus.style.background = 'rgba(255, 255, 255, 0.2)';
    }
}

function addQuickIncome() {
    const description = document.getElementById('quick-income-desc').value.trim();
    const amount = parseFloat(document.getElementById('quick-income-amount').value);
    
    if (!description || !amount || amount <= 0) {
        alert('⚠️ Bitte Beschreibung und gültigen Betrag eingeben');
        return;
    }
    
    const newIncome = {
        id: Date.now(),
        description: description,
        amount: amount,
        type: 'Sonstiges',
        account: appData.currentProfile === 'family' ? 'shared' : appData.currentProfile,
        date: new Date().toISOString(),
        month: getCurrentMonth()
    };
    
    // Add to income entries
    appData.incomeEntries.push(newIncome);
    
    // Clear inputs
    document.getElementById('quick-income-desc').value = '';
    document.getElementById('quick-income-amount').value = '';
    
    saveData();
    renderIncomeList();
    calculateAll();
    updateDashboard();
    
    showNotification(`✅ Einnahme von CHF ${amount.toFixed(2)} hinzugefügt!`, 'success');
}

function saveIncome() {
    const description = document.getElementById('income-description').value.trim();
    const amount = parseFloat(document.getElementById('income-amount').value);
    const type = document.getElementById('income-type').value;
    const account = document.getElementById('income-account').value;
    
    if (!description || !amount || !type) {
        alert('⚠️ Bitte füllen Sie alle Felder aus');
        return;
    }
    
    if (amount <= 0) {
        alert('⚠️ Betrag muss größer als 0 sein');
        return;
    }
    
    if (currentIncome) {
        // Editing existing income
        currentIncome.description = description;
        currentIncome.amount = amount;
        currentIncome.type = type;
        currentIncome.account = account;
        
        showNotification('✅ Einnahme erfolgreich bearbeitet!', 'success');
    } else {
        // Adding new income
        const newIncome = {
            id: Date.now(),
            description: description,
            amount: amount,
            type: type,
            account: account,
            date: new Date().toISOString(),
            month: getCurrentMonth()
        };
        
        appData.incomeEntries.push(newIncome);
        
        showNotification('✅ Einnahme erfolgreich hinzugefügt!', 'success');
    }
    
    saveData();
    renderIncomeList();
    calculateAll();
    updateDashboard();
    closeModal('income-modal');
}

function editIncome(id) {
    const income = appData.incomeEntries.find(inc => inc.id === id);
    if (!income) return;
    
    currentIncome = income;
    
    document.getElementById('income-modal-title').textContent = 'Einnahme bearbeiten';
    document.getElementById('income-description').value = income.description;
    document.getElementById('income-amount').value = income.amount;
    document.getElementById('income-type').value = income.type;
    document.getElementById('income-account').value = income.account;
    
    openModal('income-modal');
}

function deleteIncome(id) {
    if (!confirm('🗑️ Einnahme wirklich löschen?')) return;
    
    // Remove from array
    appData.incomeEntries = appData.incomeEntries.filter(inc => inc.id !== id);
    
    saveData();
    renderIncomeList();
    calculateAll();
    updateDashboard();
    
    showNotification('✅ Einnahme gelöscht!', 'success');
}

// ENHANCED: Render salary history with better layout
function renderSalaryHistory() {
    const container = document.getElementById('salary-history');
    if (!container) return;
    
    const currentMonth = getCurrentMonth();
    const allSalaries = appData.salaryHistory.filter(s => s.profile === appData.currentProfile);
    
    // Update the main salary display
    updateSalaryDisplay();
    
    if (allSalaries.length === 0) {
        container.innerHTML = '';
        return;
    }
    
    // Show last 3 months of salary history
    const recentSalaries = allSalaries.slice(-3).reverse();
    
    container.innerHTML = `
        <div class="settings-group">
            <div class="settings-title">📊 Gehalts-Historie</div>
            ${recentSalaries.map(salary => {
                const isCurrentMonth = salary.month === currentMonth;
                return `
                    <div class="expense-item" style="${isCurrentMonth ? 'background: #e8f5e9; border: 2px solid #4caf50;' : ''}">
                        <div class="expense-header">
                            <div class="expense-info">
                                <div class="expense-name">
                                    💰 ${salary.monthName}
                                    ${isCurrentMonth ? '<span style="color: #4caf50; font-size: 11px; margin-left: 8px;">AKTUELL</span>' : ''}
                                </div>
                                <div class="expense-category">
                                    Erfasst am ${new Date(salary.date).toLocaleDateString('de-CH')}
                                </div>
                            </div>
                            <div class="expense-amount" style="color: #2e7d32; font-size: 20px;">
                                CHF ${salary.amount.toLocaleString()}
                            </div>
                        </div>
                    </div>
                `;
            }).join('')}
        </div>
    `;
}

function renderIncomeList() {
    const container = document.getElementById('additional-income-list');
    if (!container) return;
    
    const currentMonth = getCurrentMonth();
    let filteredIncome = appData.incomeEntries.filter(inc => inc.month === currentMonth);
    
    // Filter by profile
    if (appData.currentProfile === 'sven') {
        filteredIncome = filteredIncome.filter(inc => inc.account === 'sven');
    } else if (appData.currentProfile === 'franzi') {
        filteredIncome = filteredIncome.filter(inc => inc.account === 'franzi');
    } else {
        // Family shows all
        filteredIncome = filteredIncome;
    }
    
    // First render salary history and update display
    renderSalaryHistory();
    
    if (filteredIncome.length === 0) {
        container.innerHTML = `
            <div class="text-center" style="padding: 20px; color: #666;">
                <p>Keine zusätzlichen Einnahmen diesen Monat</p>
            </div>
        `;
        
        // Update total
        const totalElement = document.getElementById('income-total');
        if (totalElement) totalElement.textContent = 'CHF 0';
        
        return;
    }
    
    // Sort by date (newest first)
    filteredIncome.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    container.innerHTML = filteredIncome.map(income => {
        const date = new Date(income.date);
        const formattedDate = date.toLocaleDateString('de-CH', { 
            day: '2-digit', 
            month: '2-digit',
            year: '2-digit'
        });
        
        return `
            <div class="expense-item" id="income-${income.id}">
                <div class="expense-header">
                    <div class="expense-info">
                        <div class="expense-name">💵 ${income.description}</div>
                        <div class="expense-category">${income.type}</div>
                        <div class="expense-account">
                            ${getAccountDisplayName(income.account)} • ${formattedDate}
                        </div>
                    </div>
                    <div class="expense-amount" style="color: #28a745;">
                        +CHF ${income.amount.toLocaleString()}
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
        `;
    }).join('');
    
    // Update total
    const total = filteredIncome.reduce((sum, inc) => sum + inc.amount, 0);
    const totalElement = document.getElementById('income-total');
    if (totalElement) {
        totalElement.textContent = `CHF ${total.toLocaleString()}`;
    }
}

function getCurrentMonth() {
    return new Date().toISOString().slice(0, 7); // YYYY-MM format
}

function getAccountDisplayName(account) {
    if (account === 'sven') return 'Sven Privat';
    if (account === 'franzi') return 'Franzi Privat';
    if (account === 'shared') return 'Gemeinschaftskonto';
    return account;
}

// ============= MONTH CLOSING FUNCTION =============
function closeMonth() {
    const profileName = appData.currentProfile === 'sven' ? 'Sven' : 
                       appData.currentProfile === 'franzi' ? 'Franzi' : 'Familie';
    
    if (appData.currentProfile === 'family') {
        alert('⚠️ Monatsabschluss nur für private Profile (Sven/Franzi) möglich.\n\nBitte wechseln Sie zu einem privaten Profil.');
        return;
    }
    
    // Calculate available amount (income - expenses)
    const income = appData.profiles[appData.currentProfile].income || 0;
    const fixedExpenses = appData.fixedExpenses
        .filter(exp => exp.active && exp.account === appData.currentProfile)
        .reduce((sum, exp) => sum + exp.amount, 0);
    const variableExpenses = appData.variableExpenses
        .filter(exp => exp.active && exp.account === appData.currentProfile)
        .reduce((sum, exp) => sum + exp.amount, 0);
    
    // Add additional income
    const additionalIncome = appData.incomeEntries
        .filter(inc => inc.account === appData.currentProfile && inc.month === getCurrentMonth())
        .reduce((sum, inc) => sum + inc.amount, 0);
    
    const totalIncome = income + additionalIncome;
    const available = totalIncome - fixedExpenses - variableExpenses;
    
    const confirmMessage = `📋 Monat abschließen für ${profileName}?\n\n` +
        `Einkommen: CHF ${income.toFixed(2)}\n` +
        `Zusätzlich: CHF ${additionalIncome.toFixed(2)}\n` +
        `Verfügbar: CHF ${available.toFixed(2)}\n\n` +
        `Dieser Betrag wird auf Ihr Privatkonto übertragen.\n` +
        `⚠️ Alle variablen Ausgaben werden gelöscht!`;
    
    if (!confirm(confirmMessage)) return;
    
    // Add available amount to account balance
    if (appData.currentProfile === 'sven') {
        appData.accounts.sven.balance += available;
    } else if (appData.currentProfile === 'franzi') {
        appData.accounts.franzi.balance += available;
    }
    
    // Clear variable expenses for this profile
    appData.variableExpenses = appData.variableExpenses.filter(exp => 
        exp.account !== appData.currentProfile
    );
    
    // Clear income entries for new month
    appData.incomeEntries = appData.incomeEntries.filter(inc => 
        inc.account !== appData.currentProfile || inc.month !== getCurrentMonth()
    );
    
    // Save and update
    saveData();
    renderExpenses('variable');
    renderIncomeList();
    calculateAll();
    updateDashboard();
    
    showNotification(
        `✅ Monat erfolgreich abgeschlossen!\n\n` +
        `CHF ${available.toFixed(2)} wurden auf Ihr Privatkonto übertragen.\n` +
        `Variable Ausgaben wurden zurückgesetzt.`,
        'success'
    );
}

// Make functions globally available
window.addNewIncome = addNewIncome;
window.addQuickIncome = addQuickIncome;
window.addSalaryEntry = addSalaryEntry;
window.saveIncome = saveIncome;
window.editIncome = editIncome;
window.deleteIncome = deleteIncome;
window.closeMonth = closeMonth;
window.updateSalaryDisplay = updateSalaryDisplay;
