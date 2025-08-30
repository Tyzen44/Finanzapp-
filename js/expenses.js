// ============= EXPENSE MANAGEMENT ============= 
function renderExpenses(type) {
    const container = document.getElementById(`${type}-expenses-list`);
    if (!container) {
        console.error('⚠️ Container not found:', `${type}-expenses-list`);
        return;
    }

    // Ensure data arrays exist
    if (!appData[`${type}Expenses`]) {
        console.warn('⚠️ Expense array not found, creating:', `${type}Expenses`);
        appData[`${type}Expenses`] = [];
    }

    const expenses = appData[`${type}Expenses`];
    console.log(`📊 Rendering ${type} expenses:`, expenses.length, 'items');
    
    let filteredExpenses = expenses;
    if (appData.currentProfile === 'sven') {
        filteredExpenses = expenses.filter(exp => exp.account === 'sven');
    } else if (appData.currentProfile === 'franzi') {
        filteredExpenses = expenses.filter(exp => exp.account === 'franzi');
    } else {
        filteredExpenses = expenses.filter(exp => exp.account === 'shared');
    }
    
    console.log(`📊 Filtered ${type} expenses for ${appData.currentProfile}:`, filteredExpenses.length, 'items');
    
    if (filteredExpenses.length === 0) {
        container.innerHTML = `
            <div class="text-center" style="padding: 40px 0; color: #666;">
                <p>Noch keine ${type === 'fixed' ? 'fixen' : 'variablen'} Ausgaben</p>
                <p style="font-size: 14px; margin-top: 10px;">Klicken Sie "Hinzufügen" um zu starten</p>
            </div>
        `;
        return;
    }

    const html = filteredExpenses.map(expense => `
        <div class="expense-item ${!expense.active ? 'text-muted' : ''}" id="expense-${expense.id}">
            <div class="expense-header">
                <div class="expense-info">
                    <div class="expense-name" style="${!expense.active ? 'text-decoration: line-through;' : ''}">${expense.name}</div>
                    <div class="expense-category">${expense.category}</div>
                    <div class="expense-account">Konto: ${getAccountDisplayName(expense.account)}</div>
                    ${expense.isTransfer ? '<div style="color: #4facfe; font-size: 11px;">💸 Übertrag</div>' : ''}
                </div>
                <div class="expense-amount" style="${!expense.active ? 'opacity: 0.5;' : ''}">
                    CHF ${expense.amount.toLocaleString()}
                </div>
                <div class="expense-actions">
                    <button class="action-btn edit" onclick="editExpense(${expense.id}, '${type}')" title="Bearbeiten">
                        ✏️
                    </button>
                    <button class="action-btn toggle ${expense.active ? '' : 'inactive'}" onclick="toggleExpense(${expense.id}, '${type}')" title="${expense.active ? 'Deaktivieren' : 'Aktivieren'}">
                        ${expense.active ? '👁️' : '👁️‍🗨️'}
                    </button>
                    <button class="action-btn delete" onclick="deleteExpense(${expense.id}, '${type}')" title="Löschen">
                        🗑️
                    </button>
                </div>
            </div>
        </div>
    `).join('');
    
    container.innerHTML = html;
    console.log(`✅ ${type} expenses rendered successfully`);
}

function getAccountDisplayName(account) {
    if (account === 'sven') return 'Sven Privat';
    if (account === 'franzi') return 'Franzi Privat';
    if (account === 'shared') return 'Gemeinschaftskonto';
    return account;
}

function addNewExpense(type) {
    currentExpenseType = type;
    currentExpense = null;
    
    document.getElementById('expense-modal-title').textContent = 
        `${type === 'fixed' ? 'Fixe' : 'Variable'} Ausgabe hinzufügen`;
    document.getElementById('expense-name').value = '';
    document.getElementById('expense-amount').value = '';
    document.getElementById('expense-category').value = '';
    
    if (appData.currentProfile === 'sven') {
        document.getElementById('expense-account').value = 'sven';
    } else if (appData.currentProfile === 'franzi') {
        document.getElementById('expense-account').value = 'franzi';
    } else {
        document.getElementById('expense-account').value = 'shared';
    }
    
    openModal('expense-modal');
}

function editExpense(id, type) {
    const expenses = appData[`${type}Expenses`];
    const expense = expenses.find(exp => exp.id === id);
    
    if (!expense) return;
    
    currentExpense = expense;
    currentExpenseType = type;
    
    document.getElementById('expense-modal-title').textContent = 
        `${type === 'fixed' ? 'Fixe' : 'Variable'} Ausgabe bearbeiten`;
    
    document.getElementById('expense-name').value = expense.name;
    document.getElementById('expense-amount').value = expense.amount;
    document.getElementById('expense-category').value = expense.category;
    document.getElementById('expense-account').value = expense.account;
    
    openModal('expense-modal');
}

function saveExpense() {
    const name = document.getElementById('expense-name').value.trim();
    const amount = parseFloat(document.getElementById('expense-amount').value);
    const category = document.getElementById('expense-category').value;
    const account = document.getElementById('expense-account').value;

    console.log('💾 Saving expense:', { name, amount, category, account });

    if (!name || !amount || !category) {
        alert('⚠️ Bitte füllen Sie alle Felder aus');
        return;
    }

    if (amount <= 0) {
        alert('⚠️ Betrag muss größer als 0 sein');
        return;
    }

    // Ensure arrays exist
    if (!appData.fixedExpenses) appData.fixedExpenses = [];
    if (!appData.variableExpenses) appData.variableExpenses = [];

    if (currentExpense) {
        // Editing existing expense
        const wasTransfer = currentExpense.isTransfer && currentExpense.category === 'Überträge';
        const isNowTransfer = category === 'Überträge';
        
        if (wasTransfer && !isNowTransfer) {
            appData.transfers = appData.transfers.filter(transfer => 
                !(transfer.from === currentExpense.account && 
                  transfer.amount === currentExpense.amount && 
                  transfer.purpose === currentExpense.name)
            );
        }
        
        if (!wasTransfer && isNowTransfer && appData.currentProfile !== 'family') {
            createTransfer(appData.currentProfile, amount, name, false);
        }
        
        if (wasTransfer && isNowTransfer) {
            const existingTransfer = appData.transfers.find(transfer => 
                transfer.from === currentExpense.account && 
                transfer.amount === currentExpense.amount && 
                transfer.purpose === currentExpense.name
            );
            
            if (existingTransfer) {
                existingTransfer.amount = amount;
                existingTransfer.purpose = name;
                existingTransfer.from = account;
            } else if (appData.currentProfile !== 'family') {
                createTransfer(appData.currentProfile, amount, name, false);
            }
        }
        
        currentExpense.name = name;
        currentExpense.amount = amount;
        currentExpense.category = category;
        currentExpense.account = account;
        currentExpense.isTransfer = isNowTransfer;
        
        console.log('✅ Expense updated:', currentExpense);
        showNotification('✅ Ausgabe erfolgreich bearbeitet!', 'success');
    } else {
        // Adding new expense
        const newExpense = {
            id: Date.now(),
            name: name,
            amount: amount,
            category: category,
            account: account,
            active: true,
            isTransfer: category === 'Überträge'
        };

        console.log('➕ Adding new expense:', newExpense);
        console.log('Current expense type:', currentExpenseType);

        if (category === 'Überträge' && appData.currentProfile !== 'family') {
            createTransfer(appData.currentProfile, amount, name, false);
        }
        
        // Add to correct array
        if (currentExpenseType === 'fixed') {
            appData.fixedExpenses.push(newExpense);
            console.log('Added to fixedExpenses. New length:', appData.fixedExpenses.length);
        } else if (currentExpenseType === 'variable') {
            appData.variableExpenses.push(newExpense);
            console.log('Added to variableExpenses. New length:', appData.variableExpenses.length);
        } else {
            console.error('⚠️ Unknown expense type:', currentExpenseType);
            alert('⚠️ Fehler: Unbekannter Ausgaben-Typ');
            return;
        }
        
        showNotification('✅ Ausgabe erfolgreich hinzugefügt!', 'success');
    }

    // Save data and refresh UI
    saveData();
    
    // Force re-render of expenses
    console.log('🔄 Re-rendering expenses...');
    renderExpenses(currentExpenseType);
    calculateAll();
    updateDashboard();
    updateTransferHistory();
    
    // Close modal
    closeModal('expense-modal');
    
    console.log('💾 Expense save completed');
}

function deleteExpense(id, type) {
    if (!confirm('🗑️ Ausgabe wirklich löschen?')) return;
    
    const expense = appData[`${type}Expenses`].find(exp => exp.id === id);
    
    if (expense && expense.isTransfer && expense.category === 'Überträge') {
        appData.transfers = appData.transfers.filter(transfer => 
            !(transfer.from === expense.account && 
              transfer.amount === expense.amount && 
              transfer.purpose === expense.name)
        );
    }
    
    appData[`${type}Expenses`] = appData[`${type}Expenses`].filter(exp => exp.id !== id);
    
    saveData();
    renderExpenses(type);
    calculateAll();
    updateDashboard();
    updateTransferHistory();
    showNotification('✅ Ausgabe gelöscht!', 'success');
}

function toggleExpense(id, type) {
    const expenses = appData[`${type}Expenses`];
    const expense = expenses.find(exp => exp.id === id);
    
    if (expense) {
        expense.active = !expense.active;
        saveData();
        renderExpenses(type);
        calculateAll();
        updateDashboard();
        
        const status = expense.active ? 'aktiviert' : 'deaktiviert';
        showNotification(`✅ Ausgabe ${status}!`, 'success');
    }
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
        container.innerHTML = '<div class="text-center" style="padding: 20px; color: #666;">Noch keine Ausgaben kategorisiert</div>';
        return;
    }
    
    let income = 0;
    const transfers = calculateTransfers();
    
    if (appData.currentProfile === 'sven') {
        income = appData.profiles.sven.income;
    } else if (appData.currentProfile === 'franzi') {
        income = appData.profiles.franzi.income;
    } else {
        income = calculateTransferIncome(); // Use corrected calculation
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
