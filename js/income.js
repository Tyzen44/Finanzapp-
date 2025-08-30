// ============= INCOME MANAGEMENT ============= 
let currentIncome = null;

// Add income entries to appData structure
if (!appData.incomeEntries) {
    appData.incomeEntries = [];
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
    
    // Add to account balance immediately
    if (newIncome.account === 'sven') {
        appData.accounts.sven.balance += amount;
    } else if (newIncome.account === 'franzi') {
        appData.accounts.franzi.balance += amount;
    } else {
        appData.accounts.shared.balance += amount;
    }
    
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
        // Editing existing income - first revert the old amount
        if (currentIncome.account === 'sven') {
            appData.accounts.sven.balance -= currentIncome.amount;
        } else if (currentIncome.account === 'franzi') {
            appData.accounts.franzi.balance -= currentIncome.amount;
        } else {
            appData.accounts.shared.balance -= currentIncome.amount;
        }
        
        // Update income entry
        currentIncome.description = description;
        currentIncome.amount = amount;
        currentIncome.type = type;
        currentIncome.account = account;
        
        // Add new amount to potentially different account
        if (account === 'sven') {
            appData.accounts.sven.balance += amount;
        } else if (account === 'franzi') {
            appData.accounts.franzi.balance += amount;
        } else {
            appData.accounts.shared.balance += amount;
        }
        
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
        
        // Add to account balance
        if (account === 'sven') {
            appData.accounts.sven.balance += amount;
        } else if (account === 'franzi') {
            appData.accounts.franzi.balance += amount;
        } else {
            appData.accounts.shared.balance += amount;
        }
        
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
    
    const income = appData.incomeEntries.find(inc => inc.id === id);
    if (!income) return;
    
    // Revert balance change
    if (income.account === 'sven') {
        appData.accounts.sven.balance -= income.amount;
    } else if (income.account === 'franzi') {
        appData.accounts.franzi.balance -= income.amount;
    } else {
        appData.accounts.shared.balance -= income.amount;
    }
    
    // Remove from array
    appData.incomeEntries = appData.incomeEntries.filter(inc => inc.id !== id);
    
    saveData();
    renderIncomeList();
    calculateAll();
    updateDashboard();
    
    showNotification('✅ Einnahme gelöscht!', 'success');
}

function renderIncomeList() {
    const container = document.getElementById('income-list');
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
    
    if (filteredIncome.length === 0) {
        container.innerHTML = `
            <div class="text-center" style="padding: 40px 0; color: #666;">
                <p>Noch keine zusätzlichen Einnahmen diesen Monat</p>
                <p style="font-size: 14px; margin-top: 10px;">Nutzen Sie den Schnell-Eintrag oder "Hinzufügen"</p>
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
                        <div class="expense-name">💰 ${income.description}</div>
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
    
    const available = income - fixedExpenses - variableExpenses;
    
    const confirmMessage = `🏁 Monat abschließen für ${profileName}?\n\n` +
        `Verfügbarer Betrag: CHF ${available.toFixed(2)}\n` +
        `Dieser Betrag wird auf Ihr Privatkonto übertragen.\n\n` +
        `⚠️ Alle variablen Ausgaben werden gelöscht!\n` +
        `(Fixkosten bleiben für nächsten Monat bestehen)`;
    
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
window.saveIncome = saveIncome;
window.editIncome = editIncome;
window.deleteIncome = deleteIncome;
window.closeMonth = closeMonth;
