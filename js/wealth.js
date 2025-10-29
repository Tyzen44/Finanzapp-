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

// ============= BALANCE CHART WITH STRICT PROFILE FILTERING - FIXED ============= 
function renderBalanceChart() {
    const container = document.getElementById('balance-chart');
    if (!container) {
        console.log('⚠️ Balance chart container not found');
        return;
    }
    
    // STRICT PROFILE FILTERING - ONLY show current profile's data
    const filteredHistory = (appData.wealthHistory || []).filter(entry => 
        entry && entry.profile === appData.currentProfile
    );
    
    console.log('📊 Rendering balance chart for', appData.currentProfile, '- Found', filteredHistory.length, 'entries');
    
    if (filteredHistory.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 60px 20px; color: #666;">
                <div style="font-size: 48px; margin-bottom: 16px;">📊</div>
                <p style="font-size: 16px; font-weight: 500; margin-bottom: 8px;">Noch keine Daten verfügbar</p>
                <p style="font-size: 14px; color: #999;">Schließen Sie einen Monat ab im Tab "Einnahmen" um den Verlauf zu sehen</p>
            </div>
        `;
        return;
    }
    
    // Sort by date ascending for chart
    const sortedHistory = [...filteredHistory].sort((a, b) => new Date(a.date) - new Date(b.date));
    
    // Calculate min/max for scaling
    const balances = sortedHistory.map(entry => entry.totalBalance || 0);
    const maxBalance = Math.max(...balances, 0);
    const minBalance = Math.min(...balances, 0);
    const range = maxBalance - minBalance || 1000; // Prevent division by zero
    
    const profileLabel = appData.currentProfile === 'sven' ? 'Sven' : 
                        appData.currentProfile === 'franzi' ? 'Franzi' : 'Gemeinschaftskonto';
    
    // Take last 12 months for display
    const displayData = sortedHistory.slice(-12);
    
    const chartHTML = `
        <div style="padding: 20px 15px;">
            <div style="font-size: 14px; font-weight: 600; margin-bottom: 16px; color: #333; text-align: center;">
                Kontostand-Entwicklung (${profileLabel})
            </div>
            <div style="display: flex; align-items: end; height: 140px; gap: 6px; padding: 0 8px;">
                ${displayData.map(entry => {
                    const balance = entry.totalBalance || 0;
                    const heightPercent = range > 0 ? Math.max(5, ((balance - minBalance) / range) * 100) : 50;
                    const isPositiveChange = (entry.balance || 0) >= 0;
                    const monthShort = entry.month.substring(0, 3);
                    
                    return `
                        <div style="flex: 1; display: flex; flex-direction: column; align-items: center; gap: 6px;">
                            <div style="
                                width: 100%; 
                                height: ${heightPercent}%; 
                                background: linear-gradient(180deg, 
                                    ${isPositiveChange ? '#10b981' : '#ef4444'}, 
                                    ${isPositiveChange ? '#059669' : '#dc3545'}
                                ); 
                                border-radius: 4px 4px 0 0;
                                position: relative;
                                cursor: pointer;
                                transition: all 0.2s ease;
                                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                            " 
                            onmouseover="this.style.opacity='0.8'; this.style.transform='translateY(-2px)'"
                            onmouseout="this.style.opacity='1'; this.style.transform='translateY(0)'"
                            title="${entry.month}&#10;Stand: CHF ${balance.toLocaleString()}&#10;Saldo: ${(entry.balance || 0) >= 0 ? '+' : ''}CHF ${(entry.balance || 0).toLocaleString()}">
                            </div>
                            <div style="
                                font-size: 9px; 
                                color: #666; 
                                text-align: center;
                                transform: rotate(-45deg);
                                transform-origin: center;
                                white-space: nowrap;
                                margin-top: 8px;
                            ">
                                ${monthShort}
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
            
            <!-- Legend -->
            <div style="display: flex; justify-content: center; gap: 20px; margin-top: 20px; padding-top: 15px; border-top: 1px solid #e5e7eb; font-size: 11px;">
                <div style="display: flex; align-items: center; gap: 6px;">
                    <div style="width: 12px; height: 12px; background: linear-gradient(135deg, #10b981, #059669); border-radius: 2px;"></div>
                    <span style="color: #666;">Positiv</span>
                </div>
                <div style="display: flex; align-items: center; gap: 6px;">
                    <div style="width: 12px; height: 12px; background: linear-gradient(135deg, #ef4444, #dc3545); border-radius: 2px;"></div>
                    <span style="color: #666;">Negativ</span>
                </div>
            </div>
            
            <!-- Stats -->
            <div style="display: flex; justify-content: space-between; margin-top: 20px; padding-top: 15px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #666;">
                <div>
                    <div style="color: #999; font-size: 10px; margin-bottom: 4px;">Minimum</div>
                    <div style="font-weight: 600; color: #333;">CHF ${minBalance.toLocaleString()}</div>
                </div>
                <div style="text-align: center;">
                    <div style="color: #999; font-size: 10px; margin-bottom: 4px;">Durchschnitt</div>
                    <div style="font-weight: 600; color: #333;">CHF ${Math.round(balances.reduce((a, b) => a + b, 0) / balances.length).toLocaleString()}</div>
                </div>
                <div style="text-align: right;">
                    <div style="color: #999; font-size: 10px; margin-bottom: 4px;">Maximum</div>
                    <div style="font-weight: 600; color: #333;">CHF ${maxBalance.toLocaleString()}</div>
                </div>
            </div>
        </div>
    `;
    
    container.innerHTML = chartHTML;
    console.log('✅ Balance chart rendered successfully');
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
