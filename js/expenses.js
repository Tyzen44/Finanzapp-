// ============= EXPENSE MANAGEMENT WITH FOOD BUDGET & SAVINGS INTEGRATION ============= 

async function saveExpense() {
    const name = document.getElementById('expense-name').value.trim();
    const amount = parseFloat(document.getElementById('expense-amount').value);
    const category = document.getElementById('expense-category').value;
    const account = document.getElementById('expense-account').value;

    console.log('ðŸ’¾ Saving expense:', { name, amount, category, account });

    if (!name || !amount || !category) {
        alert('âš ï¸ Bitte fÃ¼llen Sie alle Felder aus');
        return;
    }

    if (amount <= 0) {
        alert('âš ï¸ Betrag muss grÃ¶ÃŸer als 0 sein');
        return;
    }

    // Ensure arrays exist
    if (!appData.fixedExpenses) appData.fixedExpenses = [];
    if (!appData.variableExpenses) appData.variableExpenses = [];

    if (currentExpense) {
        // Editing existing expense
        const wasTransfer = currentExpense.isTransfer && currentExpense.category === 'ÃœbertrÃ¤ge';
        const isNowTransfer = category === 'ÃœbertrÃ¤ge';
        
        // Check if it was food expense on shared account
        const wasFoodOnShared = currentExpense.category === 'Lebensmittel' && currentExpense.account === 'shared';
        const isNowFoodOnShared = category === 'Lebensmittel' && account === 'shared';
        
        // Check if it was savings expense
        const wasSavings = currentExpense.category === 'Sparen';
        const isNowSavings = category === 'Sparen';
        
        // Handle food budget changes
        if (wasFoodOnShared && !isNowFoodOnShared) {
            removeFoodExpenseFromBudget(currentExpense.amount);
        } else if (wasFoodOnShared && isNowFoodOnShared && currentExpense.amount !== amount) {
            removeFoodExpenseFromBudget(currentExpense.amount);
            addFoodExpenseToBudget(amount, name);
        } else if (!wasFoodOnShared && isNowFoodOnShared) {
            addFoodExpenseToBudget(amount, name);
        }
        
        // Handle savings changes
        if (wasSavings && !isNowSavings) {
            removeSavingsEntryFromExpense(currentExpense);
        } else if (wasSavings && isNowSavings && (currentExpense.amount !== amount || currentExpense.name !== name)) {
            removeSavingsEntryFromExpense(currentExpense);
            addSavingsEntryFromExpense(name, amount, account);
        } else if (!wasSavings && isNowSavings) {
            addSavingsEntryFromExpense(name, amount, account);
        }
        
        // Handle transfer changes
        if (wasTransfer && !isNowTransfer) {
            appData.transfers = appData.transfers.filter(transfer => 
                !(transfer.from === currentExpense.account && 
                  transfer.amount === currentExpense.amount && 
                  transfer.purpose === currentExpense.name)
            );
        }
        
        if (!wasTransfer && isNowTransfer && appData.currentProfile !== 'family') {
            await createTransfer(appData.currentProfile, amount, name, false);
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
                await createTransfer(appData.currentProfile, amount, name, false);
            }
        }
        
        currentExpense.name = name;
        currentExpense.amount = amount;
        currentExpense.category = category;
        currentExpense.account = account;
        currentExpense.isTransfer = isNowTransfer;
        currentExpense.lastModified = new Date().toISOString(); // Track modification date
        
        console.log('âœ… Expense updated:', currentExpense);
        showNotification('âœ… Ausgabe erfolgreich bearbeitet!', 'success');
    } else {
        // Adding new expense
        const newExpense = {
            id: Date.now(),
            name: name,
            amount: amount,
            category: category,
            account: account,
            active: true,
            isTransfer: category === 'ÃœbertrÃ¤ge',
            date: new Date().toISOString(), // ADD DATE
            month: getCurrentMonth() // ADD MONTH for filtering
        };

        console.log('âž• Adding new expense:', newExpense);
        console.log('Current expense type:', currentExpenseType);

        // Check if it's a food expense on shared account
        if (category === 'Lebensmittel' && account === 'shared') {
            addFoodExpenseToBudget(amount, name);
        }
        
        // Check if it's a savings expense
        if (category === 'Sparen') {
            addSavingsEntryFromExpense(name, amount, account);
        }

        if (category === 'ÃœbertrÃ¤ge' && appData.currentProfile !== 'family') {
            await createTransfer(appData.currentProfile, amount, name, false);
        }
        
        // Add to correct array
        if (currentExpenseType === 'fixed') {
            appData.fixedExpenses.push(newExpense);
            console.log('Added to fixedExpenses. New length:', appData.fixedExpenses.length);
        } else if (currentExpenseType === 'variable') {
            appData.variableExpenses.push(newExpense);
            console.log('Added to variableExpenses. New length:', appData.variableExpenses.length);
        } else {
            console.error('âš ï¸ Unknown expense type:', currentExpenseType);
            alert('âš ï¸ Fehler: Unbekannter Ausgaben-Typ');
            return;
        }
        
        showNotification('âœ… Ausgabe erfolgreich hinzugefÃ¼gt!', 'success');
    }

    // Save data and refresh UI
    await saveData();
    
    // Force re-render of expenses
    console.log('ðŸ”„ Re-rendering expenses...');
    renderExpenses(currentExpenseType);
    calculateAll();
    updateDashboard();
    updateTransferHistory();
    
    // Update food budget display if needed
    if (category === 'Lebensmittel' && account === 'shared') {
        renderFoodPurchases();
        updateFoodBudgetDisplay();
    }
    
    // Update savings display if needed
    if (category === 'Sparen') {
        if (typeof renderPillar3aSection !== 'undefined') renderPillar3aSection();
        if (typeof renderInvestmentsSection !== 'undefined') renderInvestmentsSection();
        if (typeof updateSavingsRecommendations !== 'undefined') updateSavingsRecommendations();
    }
    
    // Close modal
    closeModal('expense-modal');
    
    console.log('ðŸ’¾ Expense save completed');
}

// NEW FUNCTIONS FOR SAVINGS INTEGRATION
function addSavingsEntryFromExpense(name, amount, account) {
    // Initialize savings if needed
    if (!appData.savings) {
        if (typeof initializeSavingsData !== 'undefined') {
            initializeSavingsData();
        }
    }
    
    // Determine savings type based on expense name
    const lowerName = name.toLowerCase();
    
    if (lowerName.includes('sÃ¤ule 3a') || lowerName.includes('3a') || lowerName.includes('pillar')) {
        // Add to SÃ¤ule 3a deposits
        if (!appData.savings.pillar3a.deposits) {
            appData.savings.pillar3a.deposits = [];
        }
        
        const deposit = {
            id: Date.now() + Math.random(),
            amount: amount,
            date: new Date().toISOString(),
            year: new Date().getFullYear(),
            month: getCurrentMonth(),
            fromExpense: true,
            description: name,
            account: account
        };
        
        appData.savings.pillar3a.deposits.push(deposit);
        
        // Update yearly total
        const currentYear = new Date().getFullYear();
        const yearlyDeposits = appData.savings.pillar3a.deposits
            .filter(d => d.year === currentYear)
            .reduce((sum, d) => sum + d.amount, 0);
        appData.savings.pillar3a.yearlyDeposits = yearlyDeposits;
        
        console.log('ðŸ’° Added to SÃ¤ule 3a:', deposit);
        
    } else if (lowerName.includes('etf') || lowerName.includes('aktien') || 
               lowerName.includes('trading') || lowerName.includes('investment') ||
               lowerName.includes('bitcoin') || lowerName.includes('crypto')) {
        // Add to investments
        if (!appData.savings.investments) {
            appData.savings.investments = [];
        }
        
        // Determine investment type
        let investmentType = 'Andere';
        if (lowerName.includes('etf')) investmentType = 'ETF';
        else if (lowerName.includes('aktien')) investmentType = 'Aktien';
        else if (lowerName.includes('bitcoin')) investmentType = 'Bitcoin';
        else if (lowerName.includes('crypto')) investmentType = 'Crypto';
        
        const investment = {
            id: Date.now() + Math.random(),
            name: name,
            invested: amount,
            currentValue: amount, // Initially same as invested
            type: investmentType,
            performance: 0,
            profit: 0,
            date: new Date().toISOString(),
            month: getCurrentMonth(),
            fromExpense: true,
            account: account
        };
        
        appData.savings.investments.push(investment);
        console.log('ðŸ“ˆ Added to investments:', investment);
        
    } else if (lowerName.includes('notgroschen') || lowerName.includes('sparkonto')) {
        // Track as emergency fund or savings account
        // For now, just increase the balance
        console.log('ðŸ’µ Savings entry for emergency fund/savings account:', name, amount);
    }
}

function removeSavingsEntryFromExpense(expense) {
    if (!expense || expense.category !== 'Sparen') return;
    
    const lowerName = expense.name.toLowerCase();
    const expenseMonth = expense.month || getCurrentMonth();
    
    if (lowerName.includes('sÃ¤ule 3a') || lowerName.includes('3a')) {
        // Remove from SÃ¤ule 3a deposits
        if (appData.savings && appData.savings.pillar3a && appData.savings.pillar3a.deposits) {
            appData.savings.pillar3a.deposits = appData.savings.pillar3a.deposits.filter(deposit => 
                !(deposit.fromExpense && deposit.amount === expense.amount && deposit.month === expenseMonth)
            );
            
            // Update yearly total
            const currentYear = new Date().getFullYear();
            const yearlyDeposits = appData.savings.pillar3a.deposits
                .filter(d => d.year === currentYear)
                .reduce((sum, d) => sum + d.amount, 0);
            appData.savings.pillar3a.yearlyDeposits = yearlyDeposits;
            
            console.log('ðŸ—‘ï¸ Removed from SÃ¤ule 3a');
        }
    } else if (lowerName.includes('etf') || lowerName.includes('aktien') || 
               lowerName.includes('investment') || lowerName.includes('bitcoin')) {
        // Remove from investments
        if (appData.savings && appData.savings.investments) {
            appData.savings.investments = appData.savings.investments.filter(inv => 
                !(inv.fromExpense && inv.invested === expense.amount && inv.month === expenseMonth)
            );
            console.log('ðŸ—‘ï¸ Removed from investments');
        }
    }
}

// Functions for food budget integration (unchanged)
function addFoodExpenseToBudget(amount, description) {
    const purchase = {
        id: Date.now() + Math.random(),
        shop: description || 'Lebensmittel-Ausgabe',
        amount: amount,
        date: new Date().toISOString(),
        month: getCurrentMonth(),
        fromExpense: true
    };
    
    if (!appData.foodPurchases) {
        appData.foodPurchases = [];
    }
    
    appData.foodPurchases.push(purchase);
    updateCurrentMonthSpent();
    
    console.log('ðŸ›’ Added to food budget:', purchase);
}

function removeFoodExpenseFromBudget(amount) {
    const currentMonth = getCurrentMonth();
    const index = appData.foodPurchases.findIndex(purchase => 
        purchase.fromExpense && 
        purchase.amount === amount && 
        purchase.month === currentMonth
    );
    
    if (index > -1) {
        appData.foodPurchases.splice(index, 1);
        updateCurrentMonthSpent();
        console.log('ðŸ—‘ï¸ Removed from food budget:', amount);
    }
}

function getCurrentMonth() {
    return new Date().toISOString().slice(0, 7);
}

function updateCurrentMonthSpent() {
    const currentMonth = getCurrentMonth();
    appData.currentMonthFoodSpent = (appData.foodPurchases || [])
        .filter(purchase => purchase.month === currentMonth)
        .reduce((total, purchase) => total + purchase.amount, 0);
}

async function deleteExpense(id, type) {
    if (!confirm('ðŸ—‘ï¸ Ausgabe wirklich lÃ¶schen?')) return;
    
    const expense = appData[`${type}Expenses`].find(exp => exp.id === id);
    
    // Handle food budget if it was a food expense on shared account
    if (expense && expense.category === 'Lebensmittel' && expense.account === 'shared') {
        removeFoodExpenseFromBudget(expense.amount);
    }
    
    // Handle savings if it was a savings expense
    if (expense && expense.category === 'Sparen') {
        removeSavingsEntryFromExpense(expense);
    }
    
    if (expense && expense.isTransfer && expense.category === 'ÃœbertrÃ¤ge') {
        appData.transfers = appData.transfers.filter(transfer => 
            !(transfer.from === expense.account && 
              transfer.amount === expense.amount && 
              transfer.purpose === expense.name)
        );
    }
    
    appData[`${type}Expenses`] = appData[`${type}Expenses`].filter(exp => exp.id !== id);
    
    await saveData();
    renderExpenses(type);
    calculateAll();
    updateDashboard();
    updateTransferHistory();
    
    // Update displays if needed
    if (expense && expense.category === 'Lebensmittel' && expense.account === 'shared') {
        renderFoodPurchases();
        updateFoodBudgetDisplay();
    }
    
    if (expense && expense.category === 'Sparen') {
        if (typeof renderPillar3aSection !== 'undefined') renderPillar3aSection();
        if (typeof renderInvestmentsSection !== 'undefined') renderInvestmentsSection();
    }
    
    showNotification('âœ… Ausgabe gelÃ¶scht!', 'success');
}

function renderExpenses(type) {
    const container = document.getElementById(`${type}-expenses-list`);
    if (!container) {
        console.error('âš ï¸ Container not found:', `${type}-expenses-list`);
        return;
    }

    // Ensure data arrays exist
    if (!appData[`${type}Expenses`]) {
        console.warn('âš ï¸ Expense array not found, creating:', `${type}Expenses`);
        appData[`${type}Expenses`] = [];
    }

    const expenses = appData[`${type}Expenses`];
    console.log(`ðŸ“Š Rendering ${type} expenses:`, expenses.length, 'items');
    
    let filteredExpenses = expenses;
    if (appData.currentProfile === 'sven') {
        filteredExpenses = expenses.filter(exp => exp.account === 'sven');
    } else if (appData.currentProfile === 'franzi') {
        filteredExpenses = expenses.filter(exp => exp.account === 'franzi');
    } else {
        filteredExpenses = expenses.filter(exp => exp.account === 'shared');
    }
    
    console.log(`ðŸ“Š Filtered ${type} expenses for ${appData.currentProfile}:`, filteredExpenses.length, 'items');
    
    if (filteredExpenses.length === 0) {
        container.innerHTML = `
            <div class="text-center" style="padding: 40px 0; color: #666;">
                <p>Noch keine ${type === 'fixed' ? 'fixen' : 'variablen'} Ausgaben</p>
                <p style="font-size: 14px; margin-top: 10px;">Klicken Sie "HinzufÃ¼gen" um zu starten</p>
            </div>
        `;
        return;
    }

    // Sort by date (newest first)
    filteredExpenses.sort((a, b) => {
        const dateA = a.date ? new Date(a.date) : new Date(0);
        const dateB = b.date ? new Date(b.date) : new Date(0);
        return dateB - dateA;
    });

    const html = filteredExpenses.map(expense => {
        // Format date if available
        let dateDisplay = '';
        if (expense.date) {
            const date = new Date(expense.date);
            dateDisplay = date.toLocaleDateString('de-CH', { 
                day: '2-digit', 
                month: '2-digit',
                year: '2-digit'
            });
        }
        
        return `
        <div class="expense-item ${!expense.active ? 'text-muted' : ''}" id="expense-${expense.id}">
            <div class="expense-header">
                <div class="expense-info">
                    <div class="expense-name" style="${!expense.active ? 'text-decoration: line-through;' : ''}">${expense.name}</div>
                    <div class="expense-category">${expense.category}</div>
                    <div class="expense-account">
                        ${getAccountDisplayName(expense.account)}
                        ${dateDisplay ? ` â€¢ ${dateDisplay}` : ''}
                    </div>
                    ${expense.isTransfer ? '<div style="color: #4facfe; font-size: 11px;">ðŸ’¸ Ãœbertrag</div>' : ''}
                    ${expense.category === 'Lebensmittel' && expense.account === 'shared' ? '<div style="color: #28a745; font-size: 11px;">ðŸ›’ Im Food-Budget</div>' : ''}
                    ${expense.category === 'Sparen' ? '<div style="color: #667eea; font-size: 11px;">ðŸ’° Im Spar-Tracking</div>' : ''}
                </div>
                <div class="expense-amount" style="${!expense.active ? 'opacity: 0.5;' : ''}">
                    CHF ${expense.amount.toLocaleString()}
                </div>
                <div class="expense-actions">
                    <button class="action-btn edit" onclick="editExpense(${expense.id}, '${type}')" title="Bearbeiten">
                        âœï¸
                    </button>
                    <button class="action-btn toggle ${expense.active ? '' : 'inactive'}" onclick="toggleExpense(${expense.id}, '${type}')" title="${expense.active ? 'Deaktivieren' : 'Aktivieren'}">
                        ${expense.active ? 'ðŸ‘ï¸' : 'ðŸ‘ï¸â€ðŸ—¨ï¸'}
                    </button>
                    <button class="action-btn delete" onclick="deleteExpense(${expense.id}, '${type}')" title="LÃ¶schen">
                        ðŸ—‘ï¸
                    </button>
                </div>
            </div>
        </div>
        `;
    }).join('');
    
    container.innerHTML = html;
    console.log(`âœ… ${type} expenses rendered successfully`);
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
        `${type === 'fixed' ? 'Fixe' : 'Variable'} Ausgabe hinzufÃ¼gen`;
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

async function toggleExpense(id, type) {
    const expenses = appData[`${type}Expenses`];
    const expense = expenses.find(exp => exp.id === id);
    
    if (expense) {
        expense.active = !expense.active;
        
        // If toggling a food expense on shared account, update food budget
        if (expense.category === 'Lebensmittel' && expense.account === 'shared') {
            if (expense.active) {
                addFoodExpenseToBudget(expense.amount, expense.name);
            } else {
                removeFoodExpenseFromBudget(expense.amount);
            }
            renderFoodPurchases();
            updateFoodBudgetDisplay();
        }
        
        // If toggling a savings expense, update savings
        if (expense.category === 'Sparen') {
            if (expense.active) {
                addSavingsEntryFromExpense(expense.name, expense.amount, expense.account);
            } else {
                removeSavingsEntryFromExpense(expense);
            }
            if (typeof renderPillar3aSection !== 'undefined') renderPillar3aSection();
            if (typeof renderInvestmentsSection !== 'undefined') renderInvestmentsSection();
        }
        
        await saveData();
        renderExpenses(type);
        calculateAll();
        updateDashboard();
        
        const status = expense.active ? 'aktiviert' : 'deaktiviert';
        showNotification(`âœ… Ausgabe ${status}!`, 'success');
    }
}

// Categories overview function remains the same
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
                        <div class="expense-category">${percentage.toFixed(1)}% ${appData.currentProfile === 'family' ? 'der erfassten ÃœbertrÃ¤ge' : 'des Einkommens'}</div>
                    </div>
                    <div class="expense-amount">CHF ${amount.toLocaleString()}</div>
                </div>
            </div>
        `;
    }).join('');
}
