// ============= WEALTH TRACKING WITH STRICT PROFILE FILTERING ============= 
function saveMonthData() {
    const monthName = new Date().toLocaleDateString('de-CH', { 
        year: 'numeric', 
        month: 'long' 
    });
    
    const balance = getCurrentBalance();
    let income = 0;
    let totalExpenses = 0;
    
    const transfers = calculateTransfers();
    
    // STRICT PROFILE FILTERING
    if (appData.currentProfile === 'sven') {
        income = appData.profiles.sven.income;
        totalExpenses = appData.fixedExpenses.filter(exp => exp.active && exp.account === 'sven').reduce((sum, exp) => sum + exp.amount, 0) +
                       appData.variableExpenses.filter(exp => exp.active && exp.account === 'sven').reduce((sum, exp) => sum + exp.amount, 0);
    } else if (appData.currentProfile === 'franzi') {
        income = appData.profiles.franzi.income;
        totalExpenses = appData.fixedExpenses.filter(exp => exp.active && exp.account === 'franzi').reduce((sum, exp) => sum + exp.amount, 0) +
                       appData.variableExpenses.filter(exp => exp.active && exp.account === 'franzi').reduce((sum, exp) => sum + exp.amount, 0);
    } else {
        // Family profile - ONLY shared
        income = calculateTransferIncome();
        totalExpenses = appData.fixedExpenses.filter(exp => exp.active && exp.account === 'shared').reduce((sum, exp) => sum + exp.amount, 0) +
                       appData.variableExpenses.filter(exp => exp.active && exp.account === 'shared').reduce((sum, exp) => sum + exp.amount, 0);
    }
    
    const monthlyBalance = income - totalExpenses;
    
    const monthEntry = {
        month: monthName,
        date: new Date().toISOString(),
        profile: appData.currentProfile,
        income: income,
        expenses: totalExpenses,
        balance: monthlyBalance,
        totalBalance: balance
    };
    
    // Unified behavior: If on individual profile, perform full month close first
    if (appData.currentProfile === 'sven' || appData.currentProfile === 'franzi') {
        const confirmed = confirm('📅 Monat wirklich abschließen?\n\nDies überträgt das verfügbare Geld, löscht variable Ausgaben und erfasst Spar-Einzahlungen.');
        if (!confirmed) return;
        if (typeof performMonthClose === 'function') {
            // Run the centralized close; afterwards recompute balance for accurate snapshot
            performMonthClose(appData.currentProfile).then(() => {
                const newBalance = getCurrentBalance();
                const newEntry = {
                    ...monthEntry,
                    totalBalance: newBalance
                };
                appData.wealthHistory = appData.wealthHistory.filter(entry => 
                    !(entry.month === monthName && entry.profile === appData.currentProfile)
                );
                appData.wealthHistory.push(newEntry);
                appData.wealthHistory.sort((a, b) => new Date(b.date) - new Date(a.date));
                saveData();
                renderWealthHistory();
                renderBalanceChart();
                calculateAll();
                updateDashboard();
                showNotification(`✅ ${monthName} abgeschlossen & gespeichert!\nMonatssaldo: CHF ${monthlyBalance.toLocaleString()}`, 'success');
            });
            return;
        }
    }

    // Family profile or fallback: only store snapshot
    appData.wealthHistory = appData.wealthHistory.filter(entry => 
        !(entry.month === monthName && entry.profile === appData.currentProfile)
    );
    appData.wealthHistory.push(monthEntry);
    appData.wealthHistory.sort((a, b) => new Date(b.date) - new Date(a.date));
    saveData();
    renderWealthHistory();
    renderBalanceChart();
    calculateAll();
    updateDashboard();
    showNotification(`✅ ${monthName} erfolgreich gespeichert!\nMonatssaldo: CHF ${monthlyBalance.toLocaleString()}`, 'success');
}

function renderWealthHistory() {
    const container = document.getElementById('wealth-history');
    if (!container) return;
    
    // STRICT PROFILE FILTERING - ONLY show current profile's history
    const filteredHistory = appData.wealthHistory.filter(entry => entry.profile === appData.currentProfile);
    
    if (filteredHistory.length === 0) {
        container.innerHTML = `
            <div class="text-center" style="padding: 40px 0; color: #666;">
                <p>Noch keine Verlaufsdaten für ${appData.currentProfile === 'sven' ? 'Sven' : 
                   appData.currentProfile === 'franzi' ? 'Franzi' : 'Familie'}</p>
                <p style="font-size: 14px; margin-top: 10px;">Schließen Sie einen Monat ab, um den Verlauf zu sehen</p>
            </div>
        `;
        return;
    }
    
    const clearAllButton = filteredHistory.length > 0 ? `
        <div style="text-align: center; margin-bottom: 15px;">
            <button onclick="clearAllWealthHistory()" class="btn btn-secondary" style="padding: 8px 16px; font-size: 12px;">
                🗑️ Alle Verlaufsdaten löschen
            </button>
        </div>
    ` : '';
    
    container.innerHTML = clearAllButton + filteredHistory.slice(0, 12).map(entry => `
        <div class="expense-item">
            <div class="expense-header">
                <div class="expense-info">
                    <div class="expense-name">${entry.month}</div>
                    <div class="expense-category">Ein: ${entry.income.toLocaleString()} | Aus: ${entry.expenses.toLocaleString()}</div>
                </div>
                <div style="display: flex; align-items: center; gap: 10px;">
                    <div class="expense-amount" style="color: ${entry.balance >= 0 ? '#28a745' : '#dc3545'}">
                        ${entry.balance >= 0 ? '+' : ''}CHF ${entry.balance.toLocaleString()}
                        <div style="font-size: 12px; color: #666; margin-top: 2px;">Stand: CHF ${entry.totalBalance.toLocaleString()}</div>
                    </div>
                    <button class="action-btn delete" onclick="deleteWealthEntry('${entry.month}', '${entry.profile}')" title="Eintrag löschen">
                        🗑️
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

function deleteWealthEntry(month, profile) {
    if (!confirm(`🗑️ Verlaufsdaten für ${month} wirklich löschen?`)) return;
    
    appData.wealthHistory = appData.wealthHistory.filter(entry => 
        !(entry.month === month && entry.profile === profile)
    );
    
    saveData();
    renderWealthHistory();
    renderBalanceChart();
    showNotification(`✅ Verlaufsdaten für ${month} gelöscht!`, 'success');
}

function clearAllWealthHistory() {
    const filteredHistory = appData.wealthHistory.filter(entry => entry.profile === appData.currentProfile);
    
    if (filteredHistory.length === 0) {
        showNotification('❓ Keine Verlaufsdaten zum Löschen vorhanden', 'info');
        return;
    }
    
    const profileName = appData.currentProfile === 'sven' ? 'Sven' : 
                       appData.currentProfile === 'franzi' ? 'Franzi' : 'Familie';
    
    if (!confirm(`🗑️ Wirklich ALLE Verlaufsdaten für ${profileName} löschen?\n\n${filteredHistory.length} Einträge werden unwiderruflich gelöscht!`)) return;
    
    appData.wealthHistory = appData.wealthHistory.filter(entry => entry.profile !== appData.currentProfile);
    
    saveData();
    renderWealthHistory();
    renderBalanceChart();
    showNotification(`✅ Alle Verlaufsdaten für ${profileName} gelöscht!`, 'success');
}

function updateBalance() {
    const newBalance = parseFloat(document.getElementById('balance-input').value);
    if (isNaN(newBalance)) {
        alert('⚠️ Bitte geben Sie einen gültigen Betrag ein');
        return;
    }

    // Update balance for current profile only
    if (appData.currentProfile === 'sven') {
        appData.accounts.sven.balance = newBalance;
    } else if (appData.currentProfile === 'franzi') {
        appData.accounts.franzi.balance = newBalance;
    } else {
        appData.accounts.shared.balance = newBalance;
    }
    
    saveData();
    calculateAll();
    updateDashboard();
    renderBalanceChart();
    document.getElementById('balance-input').value = '';
    showNotification('✅ Kontostand aktualisiert!', 'success');
}

function editAccountBalance(account) {
    // Use current profile if no account specified
    currentEditAccount = account || appData.currentProfile;
    
    const accountNames = {
        'sven': 'Sven Privat',
        'franzi': 'Franzi Privat', 
        'shared': 'Gemeinschaftskonto'
    };
    
    const currentBalance = appData.accounts[currentEditAccount].balance;
    
    document.getElementById('balance-modal-title').textContent = `💰 ${accountNames[currentEditAccount]} bearbeiten`;
    document.getElementById('balance-modal-label').textContent = `Neuer Kontostand ${accountNames[currentEditAccount]} (CHF)`;
    document.getElementById('balance-modal-input').value = currentBalance;
    
    openModal('balance-modal');
}

function updateBalanceFromModal() {
    const newBalance = parseFloat(document.getElementById('balance-modal-input').value);
    if (isNaN(newBalance)) {
        alert('⚠️ Bitte geben Sie einen gültigen Betrag ein');
        return;
    }

    if (currentEditAccount) {
        appData.accounts[currentEditAccount].balance = newBalance;
        
        saveData();
        calculateAll();
        updateDashboard();
        renderBalanceChart();
        closeModal('balance-modal');
        
        showNotification('✅ Kontostand erfolgreich aktualisiert!', 'success');
    }
}

function updateProfileIncome(profile, value) {
    appData.profiles[profile].income = parseFloat(value) || 0;
    
    const totalIncome = appData.profiles.sven.income + appData.profiles.franzi.income;
    const totalFamilyIncomeElement = document.getElementById('total-family-income');
    if (totalFamilyIncomeElement) {
        totalFamilyIncomeElement.textContent = totalIncome.toLocaleString();
    }
    
    saveData();
    calculateAll();
    updateDashboard();
}

// ============= BALANCE CHART WITH STRICT PROFILE FILTERING ============= 
function renderBalanceChart() {
    const container = document.getElementById('balance-chart');
    if (!container) return;
    
    // STRICT PROFILE FILTERING - ONLY show current profile's data
    const filteredHistory = appData.wealthHistory.filter(entry => entry.profile === appData.currentProfile);
    
    if (filteredHistory.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; color: #666;">
                <p>📊 Noch keine Daten verfügbar</p>
                <p style="font-size: 12px; margin-top: 5px;">Speichern Sie Monatsdaten im Vermögen-Tab</p>
            </div>
        `;
        return;
    }
    
    const sortedHistory = filteredHistory.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    const maxBalance = Math.max(...sortedHistory.map(entry => entry.totalBalance));
    const minBalance = Math.min(...sortedHistory.map(entry => entry.totalBalance));
    const range = maxBalance - minBalance || 1;
    
    const profileLabel = appData.currentProfile === 'sven' ? 'Sven' : 
                        appData.currentProfile === 'franzi' ? 'Franzi' : 'Gemeinschaftskonto';
    
    const chartHTML = `
        <div style="padding: 15px;">
            <div style="font-size: 12px; font-weight: 600; margin-bottom: 10px; color: #333;">
                Kontostand-Entwicklung (${profileLabel})
            </div>
            <div style="display: flex; align-items: end; height: 120px; gap: 8px;">
                ${sortedHistory.slice(-12).map(entry => {
                    const height = Math.max(10, ((entry.totalBalance - minBalance) / range) * 100);
                    const isPositive = entry.balance >= 0;
                    return `
                        <div style="flex: 1; display: flex; flex-direction: column; align-items: center;">
                            <div style="
                                width: 100%; 
                                height: ${height}px; 
                                background: linear-gradient(180deg, ${isPositive ? '#28a745' : '#dc3545'}, ${isPositive ? '#34ce57' : '#e74c3c'}); 
                                border-radius: 2px;
                                margin-bottom: 4px;
                                position: relative;
                                cursor: pointer;
                            " title="CHF ${entry.totalBalance.toLocaleString()}">
                            </div>
                            <div style="font-size: 8px; color: #666; text-align: center; writing-mode: vertical-lr; text-orientation: mixed;">
                                ${entry.month.substr(0, 3)}
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
            <div style="display: flex; justify-content: space-between; margin-top: 10px; font-size: 11px; color: #666;">
                <span>Min: CHF ${minBalance.toLocaleString()}</span>
                <span>Max: CHF ${maxBalance.toLocaleString()}</span>
            </div>
        </div>
    `;
    
    container.innerHTML = chartHTML;
}

// Helper function
function getCurrentBalance() {
    if (appData.currentProfile === 'sven') {
        return appData.accounts.sven.balance || 0;
    } else if (appData.currentProfile === 'franzi') {
        return appData.accounts.franzi.balance || 0;
    } else {
        return appData.accounts.shared.balance || 0;
    }
}
