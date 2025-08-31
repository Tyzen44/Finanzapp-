// ============= SAVINGS & INVESTMENT MANAGEMENT WITH PROFILE FILTERING ============= 

// SÃ¤ule 3a Constants for 2025
const PILLAR_3A_MAX_2025 = 7056; // Maximum fÃ¼r Angestellte mit Pensionskasse
const TAX_SAVING_RATE = 0.25; // ~25% Steuerersparnis (Durchschnitt)

// REMOVED: SAVINGS_CATEGORIES declaration - now using from config.js

// Initialize savings data structure
function initializeSavingsData() {
    if (!window.appData) {
        console.error('appData not initialized!');
        return;
    }
    
    if (!appData.savings) {
        appData.savings = {
            pillar3a: {
                yearlyDeposits: 0,
                monthlyAmount: 588, // Standard monthly deposit (7056/12)
                fundValues: [], // Monthly fund values
                deposits: [] // Individual deposits
            },
            investments: [],
            goals: {
                emergency: 30000,
                yearly: 10000
            }
        };
        console.log('âœ… Savings data structure initialized');
    }
    
    // Ensure structure is complete even if partially exists
    if (!appData.savings.pillar3a) {
        appData.savings.pillar3a = {
            yearlyDeposits: 0,
            monthlyAmount: 588,
            fundValues: [],
            deposits: []
        };
    }
    if (!appData.savings.pillar3a.fundValues) {
        appData.savings.pillar3a.fundValues = [];
    }
    if (!appData.savings.pillar3a.deposits) {
        appData.savings.pillar3a.deposits = [];
    }
    if (!appData.savings.investments) {
        appData.savings.investments = [];
    }
}

// ============= PROFILE FILTERING HELPER =============
function getCurrentProfileFilter() {
    // For family profile, show all entries
    if (appData.currentProfile === 'family') {
        return null; // No filter, show everything
    }
    // For individual profiles, only show their entries
    return appData.currentProfile;
}

function filterByProfile(items) {
    const profile = getCurrentProfileFilter();
    if (!profile) {
        // Family profile - show all
        return items;
    }
    // Individual profile - filter by account/profile
    return items.filter(item => 
        item.account === profile || 
        item.profile === profile ||
        (!item.account && !item.profile) // Include items without profile info (legacy data)
    );
}

// ============= PILLAR 3A PERFORMANCE TRACKING =============
function addPillar3aValue() {
    // Initialize if needed
    if (!appData.savings || !appData.savings.pillar3a) {
        initializeSavingsData();
    }
    
    // Set default value for deposit input
    const depositInput = document.getElementById('pillar3a-deposit');
    if (depositInput) {
        depositInput.value = appData.savings.pillar3a.monthlyAmount || 588;
    }
    
    // Clear value input
    const valueInput = document.getElementById('pillar3a-value');
    if (valueInput) {
        const profile = getCurrentProfileFilter();
        const fundValues = filterByProfile(appData.savings.pillar3a.fundValues || []);
        const lastEntry = fundValues[fundValues.length - 1];
        valueInput.placeholder = lastEntry ? `Letzter Wert: CHF ${lastEntry.endValue}` : 'z.B. 15000';
        valueInput.value = '';
    }
    
    openModal('pillar3a-modal');
}

function savePillar3aValue() {
    const currentValue = parseFloat(document.getElementById('pillar3a-value').value);
    const monthlyDeposit = parseFloat(document.getElementById('pillar3a-deposit').value) || 0;
    
    if (!currentValue || currentValue <= 0) {
        alert('Bitte geben Sie einen gÃ¼ltigen Fondswert ein');
        return;
    }
    
    const currentMonth = getCurrentMonth();
    const monthName = new Date().toLocaleDateString('de-CH', { month: 'long', year: 'numeric' });
    
    // Initialize if needed
    if (!appData.savings || !appData.savings.pillar3a || !appData.savings.pillar3a.fundValues) {
        initializeSavingsData();
    }
    
    // Find last month's value for this profile
    const profile = appData.currentProfile === 'family' ? 'shared' : appData.currentProfile;
    const profileFundValues = filterByProfile(appData.savings.pillar3a.fundValues || []);
    const lastEntry = profileFundValues[profileFundValues.length - 1];
    const startValue = lastEntry ? lastEntry.endValue : 0;
    
    // Calculate performance
    let performance = 0;
    let profit = 0;
    
    if (startValue > 0) {
        // Performance = (Endwert - Startwert - Einzahlung) / Startwert
        profit = currentValue - startValue - monthlyDeposit;
        performance = (profit / startValue) * 100;
    }
    
    const entry = {
        id: Date.now() + Math.random(),
        month: currentMonth,
        monthName: monthName,
        startValue: startValue,
        deposit: monthlyDeposit,
        endValue: currentValue,
        profit: profit,
        performance: performance,
        date: new Date().toISOString(),
        profile: profile,
        account: profile
    };
    
    // Add to fund values
    appData.savings.pillar3a.fundValues.push(entry);
    
    // Update yearly deposits
    const yearlyDeposits = calculateYearlyPillar3aDeposits();
    appData.savings.pillar3a.yearlyDeposits = yearlyDeposits;
    
    // Update monthly amount for next time
    if (monthlyDeposit > 0) {
        appData.savings.pillar3a.monthlyAmount = monthlyDeposit;
    }
    
    saveData();
    renderPillar3aSection();
    renderPerformanceChart();
    updateSavingsRecommendations();
    
    closeModal('pillar3a-modal');
    
    showNotification(`âœ… Fondswert erfasst!\nPerformance ${monthName}: ${performance.toFixed(2)}%`, 'success');
}

// Calculate yearly deposits for current profile INCLUDING EXPENSES
function calculateYearlyPillar3aDeposits() {
    const currentYear = new Date().getFullYear();
    const profile = getCurrentProfileFilter();
    
    // Get filtered deposits (manual entries)
    const deposits = filterByProfile(appData.savings?.pillar3a?.deposits || []);
    const depositsTotal = deposits
        .filter(d => d.year === currentYear)
        .reduce((sum, d) => sum + d.amount, 0);
    
    // Get filtered fund values
    const fundValues = filterByProfile(appData.savings?.pillar3a?.fundValues || []);
    const fundValuesTotal = fundValues
        .filter(v => new Date(v.date).getFullYear() === currentYear)
        .reduce((sum, v) => sum + v.deposit, 0);
    
    // NEW: Get active Säule 3a expenses but don't auto-calculate yearly total
    let expensesTotal = 0;
    const allExpenses = [...(appData.fixedExpenses || []), ...(appData.variableExpenses || [])];
    const pillar3aExpenses = allExpenses.filter(exp => {
        if (profile) {
            // Individual profile: filter by account and category
            return exp.active && exp.category === 'SÃ¤ule 3a' && exp.account === profile;
        } else {
            // Family profile: all SÃ¤ule 3a expenses
            return exp.active && exp.category === 'SÃ¤ule 3a';
        }
    });
    
    // Don't calculate expenses here - they should only be counted when actually deposited via month close
    // expensesTotal stays 0 - we only count actual deposits, not planned ones
    
    console.log('ðŸ"Š SÃ¤ule 3a Berechnung:', {
        depositsTotal,
        fundValuesTotal,
        expensesTotal,
        total: depositsTotal + fundValuesTotal + expensesTotal
    });
    
    return depositsTotal + fundValuesTotal + expensesTotal;
}

// Edit Pillar 3a deposit
function editPillar3aDeposit(id) {
    const deposit = appData.savings?.pillar3a?.deposits?.find(d => d.id === id);
    if (!deposit) return;
    
    const newAmount = parseFloat(prompt('Neuer Betrag (CHF):', deposit.amount));
    if (!newAmount || newAmount <= 0) return;
    
    const newDescription = prompt('Beschreibung:', deposit.description || 'Einzahlung');
    
    deposit.amount = newAmount;
    deposit.description = newDescription;
    deposit.lastModified = new Date().toISOString();
    
    // Update yearly total
    const yearlyDeposits = calculateYearlyPillar3aDeposits();
    appData.savings.pillar3a.yearlyDeposits = yearlyDeposits;
    
    saveData();
    renderPillar3aSection();
    updateSavingsRecommendations();
    
    showNotification('âœ… Einzahlung aktualisiert!', 'success');
}

// Delete Pillar 3a deposit
function deletePillar3aDeposit(id) {
    if (!confirm('Einzahlung wirklich lÃ¶schen?')) return;
    
    if (!appData.savings || !appData.savings.pillar3a || !appData.savings.pillar3a.deposits) return;
    
    appData.savings.pillar3a.deposits = appData.savings.pillar3a.deposits.filter(d => d.id !== id);
    
    // Update yearly total
    const yearlyDeposits = calculateYearlyPillar3aDeposits();
    appData.savings.pillar3a.yearlyDeposits = yearlyDeposits;
    
    saveData();
    renderPillar3aSection();
    updateSavingsRecommendations();
    
    showNotification('âœ… Einzahlung gelÃ¶scht!', 'success');
}

// Edit fund value
function editFundValue(id) {
    const fundValue = appData.savings?.pillar3a?.fundValues?.find(v => v.id === id);
    if (!fundValue) return;
    
    const newValue = parseFloat(prompt(`Neuer Fondswert fÃ¼r ${fundValue.monthName}:`, fundValue.endValue));
    if (!newValue || newValue <= 0) return;
    
    // Recalculate performance
    const profit = newValue - fundValue.startValue - fundValue.deposit;
    const performance = fundValue.startValue > 0 ? (profit / fundValue.startValue) * 100 : 0;
    
    fundValue.endValue = newValue;
    fundValue.profit = profit;
    fundValue.performance = performance;
    fundValue.lastModified = new Date().toISOString();
    
    saveData();
    renderPillar3aSection();
    renderPerformanceChart();
    
    showNotification('âœ… Fondswert aktualisiert!', 'success');
}

// Delete fund value
function deleteFundValue(id) {
    if (!confirm('Fondswert-Eintrag wirklich lÃ¶schen?')) return;
    
    if (!appData.savings || !appData.savings.pillar3a || !appData.savings.pillar3a.fundValues) return;
    
    appData.savings.pillar3a.fundValues = appData.savings.pillar3a.fundValues.filter(v => v.id !== id);
    
    saveData();
    renderPillar3aSection();
    renderPerformanceChart();
    
    showNotification('âœ… Fondswert gelÃ¶scht!', 'success');
}

function renderPillar3aSection() {
    const container = document.getElementById('pillar3a-content');
    if (!container) {
        console.log('pillar3a-content container not found');
        return;
    }
    
    // Initialize data if not exists
    if (!appData.savings || !appData.savings.pillar3a) {
        initializeSavingsData();
    }
    
    const currentYear = new Date().getFullYear();
    const yearlyDeposits = calculateYearlyPillar3aDeposits();
    const remaining = PILLAR_3A_MAX_2025 - yearlyDeposits;
    const taxSaving = yearlyDeposits * TAX_SAVING_RATE;
    const maxTaxSaving = PILLAR_3A_MAX_2025 * TAX_SAVING_RATE;
    
    // Get filtered fund values
    const fundValues = filterByProfile(appData.savings?.pillar3a?.fundValues || []);
    const lastEntry = fundValues[fundValues.length - 1];
    const currentFundValue = lastEntry ? lastEntry.endValue : 0;
    
    // Calculate total performance
    const deposits = filterByProfile(appData.savings?.pillar3a?.deposits || []);
    const totalDeposits = yearlyDeposits;
    const totalProfit = currentFundValue - totalDeposits;
    const totalPerformance = totalDeposits > 0 ? (totalProfit / totalDeposits) * 100 : 0;
    
    // Profile indicator
    const profileName = appData.currentProfile === 'sven' ? 'Sven' : 
                       appData.currentProfile === 'franzi' ? 'Franzi' : 'Familie';
    
    // Get active SÃ¤ule 3a expenses for display purposes
    const profile = getCurrentProfileFilter();
    const allExpenses = [...(appData.fixedExpenses || []), ...(appData.variableExpenses || [])];
    const pillar3aExpenses = allExpenses.filter(exp => {
        if (profile) {
            return exp.active && exp.category === 'SÃ¤ule 3a' && exp.account === profile;
        } else {
            return exp.active && exp.category === 'SÃ¤ule 3a';
        }
    });
    
    const monthlyExpensesTotal = pillar3aExpenses.reduce((sum, exp) => sum + exp.amount, 0);
    
    container.innerHTML = `
        <div class="settings-group">
            <div class="settings-title">
                ðŸ¦… SÃ¤ule 3a - Vorsorgefonds
                <span style="font-size: 14px; font-weight: normal; color: #666; margin-left: 10px;">
                    (${profileName})
                </span>
            </div>
            
            <!-- Current Status -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px;">
                <div class="expense-item" style="text-align: center; padding: 20px;">
                    <div class="expense-category">Aktueller Fondswert</div>
                    <div class="expense-amount" style="font-size: 24px; color: #4facfe;">
                        CHF ${currentFundValue.toLocaleString()}
                    </div>
                    <small style="color: ${totalProfit >= 0 ? '#28a745' : '#dc3545'}">
                        ${totalProfit >= 0 ? '+' : ''}CHF ${totalProfit.toFixed(2)} (${totalPerformance.toFixed(2)}%)
                    </small>
                </div>
                
                <div class="expense-item" style="text-align: center; padding: 20px;">
                    <div class="expense-category">Eingezahlt ${currentYear}</div>
                    <div class="expense-amount" style="font-size: 24px;">
                        CHF ${yearlyDeposits.toLocaleString()}
                    </div>
                    <div style="width: 100%; height: 8px; background: #f0f0f0; border-radius: 4px; margin: 10px 0;">
                        <div style="height: 100%; background: linear-gradient(90deg, #28a745, #4facfe); 
                                    width: ${(yearlyDeposits / PILLAR_3A_MAX_2025 * 100)}%; 
                                    border-radius: 4px; transition: width 0.5s;"></div>
                    </div>
                    <small>von CHF ${PILLAR_3A_MAX_2025.toLocaleString()} Maximum</small>
                </div>
            </div>
            
            <!-- NEW: Show automatic monthly deposits from expenses -->
            ${monthlyExpensesTotal > 0 ? `
                <div class="recommendation-card info" style="margin-bottom: 20px;">
                    <div class="recommendation-title">
                        🔄 Geplante monatliche Einzahlungen
                    </div>
                    <div class="recommendation-text">
                        <strong>CHF ${monthlyExpensesTotal.toLocaleString()}</strong> pro Monat aus Fixkosten<br>
                        ${pillar3aExpenses.map(exp => `• ${exp.name}: CHF ${exp.amount}`).join('<br>')}<br>
                        <small style="opacity: 0.8;">⚠️ Diese Beträge werden beim Monatsabschluss tatsächlich eingezahlt</small>
                    </div>
                </div>
            ` : ''}
            
            <!-- Tax Savings -->
            <div class="recommendation-card ${remaining > 0 ? 'warning' : 'success'}" style="margin-bottom: 20px;">
                <div class="recommendation-title">
                    ðŸ'° Steuerersparnis ${currentYear}
                </div>
                <div class="recommendation-text">
                    Aktuelle Ersparnis: <strong>CHF ${taxSaving.toFixed(0)}</strong><br>
                    ${remaining > 0 ? 
                        `MÃ¶gliche zusÃ¤tzliche Ersparnis: <strong>CHF ${(remaining * TAX_SAVING_RATE).toFixed(0)}</strong><br>
                         Noch einzuzahlen fÃ¼r Maximum: <strong>CHF ${remaining.toLocaleString()}</strong>` :
                        `âœ… Maximum erreicht! Maximale Steuerersparnis von CHF ${maxTaxSaving.toFixed(0)} gesichert.`
                    }
                </div>
            </div>
            
            <!-- Recent Deposits -->
            <div style="margin-bottom: 20px;">
                <h4 style="margin-bottom: 15px;">ðŸ'µ Letzte Einzahlungen</h4>
                <div style="max-height: 200px; overflow-y: auto;">
                    ${renderPillar3aDeposits()}
                </div>
            </div>
            
            <!-- Monthly Performance -->
            <div style="margin-bottom: 20px;">
                <h4 style="margin-bottom: 15px;">ðŸ"Š Monatliche Performance</h4>
                <div id="performance-list" style="max-height: 300px; overflow-y: auto;">
                    ${renderPerformanceList()}
                </div>
            </div>
            
            <!-- Action Buttons -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                <button class="btn btn-primary" onclick="addPillar3aValue()">
                    ðŸ"ˆ Fondswert eintragen
                </button>
                <button class="btn btn-secondary" onclick="addPillar3aDeposit()">
                    ðŸ'µ Einzahlung erfassen
                </button>
            </div>
        </div>
    `;
}

// Render Pillar 3a deposits with profile filtering
function renderPillar3aDeposits() {
    const allDeposits = appData.savings?.pillar3a?.deposits || [];
    const deposits = filterByProfile(allDeposits);
    
    if (deposits.length === 0) {
        return '<div class="text-center" style="padding: 20px; color: #666;">Noch keine Einzahlungen erfasst</div>';
    }
    
    // Sort by date, newest first
    const sorted = [...deposits].sort((a, b) => new Date(b.date) - new Date(a.date));
    
    return sorted.slice(0, 10).map(deposit => {
        const date = new Date(deposit.date);
        const formattedDate = date.toLocaleDateString('de-CH', { 
            day: '2-digit', 
            month: '2-digit',
            year: '2-digit'
        });
        
        return `
            <div class="expense-item" style="margin-bottom: 10px;">
                <div class="expense-header">
                    <div class="expense-info">
                        <div class="expense-name">
                            ${deposit.fromExpense ? 'ðŸ"„ ' : 'ðŸ'µ '}
                            ${deposit.description || 'Einzahlung'}
                        </div>
                        <div class="expense-category">
                            ${formattedDate}
                            ${deposit.fromExpense ? ' â€¢ Aus Ausgaben' : ''}
                        </div>
                    </div>
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <div class="expense-amount" style="color: #28a745;">
                            CHF ${deposit.amount.toLocaleString()}
                        </div>
                        ${!deposit.fromExpense ? `
                            <div class="expense-actions">
                                <button class="action-btn edit" onclick="editPillar3aDeposit(${deposit.id})" title="Bearbeiten">
                                    âœï¸
                                </button>
                                <button class="action-btn delete" onclick="deletePillar3aDeposit(${deposit.id})" title="LÃ¶schen">
                                    ðŸ—'ï¸
                                </button>
                            </div>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function renderPerformanceList() {
    const allValues = appData.savings?.pillar3a?.fundValues || [];
    const values = filterByProfile(allValues);
    
    if (values.length === 0) {
        return '<div class="text-center" style="padding: 20px; color: #666;">Noch keine Werte erfasst</div>';
    }
    
    // Sort by date, newest first
    const sorted = [...values].sort((a, b) => new Date(b.date) - new Date(a.date));
    
    return sorted.slice(0, 12).map(entry => `
        <div class="expense-item" style="margin-bottom: 10px;">
            <div class="expense-header">
                <div class="expense-info">
                    <div class="expense-name">${entry.monthName}</div>
                    <div class="expense-category">
                        Einzahlung: CHF ${entry.deposit} | 
                        Wert: CHF ${entry.endValue.toLocaleString()}
                    </div>
                </div>
                <div style="display: flex; align-items: center; gap: 10px;">
                    <div class="expense-amount" style="color: ${entry.performance >= 0 ? '#28a745' : '#dc3545'}">
                        ${entry.performance >= 0 ? '+' : ''}${entry.performance.toFixed(2)}%
                        <div style="font-size: 12px;">
                            ${entry.profit >= 0 ? '+' : ''}CHF ${entry.profit.toFixed(2)}
                        </div>
                    </div>
                    <div class="expense-actions">
                        <button class="action-btn edit" onclick="editFundValue(${entry.id})" title="Wert bearbeiten">
                            âœï¸
                        </button>
                        <button class="action-btn delete" onclick="deleteFundValue(${entry.id})" title="LÃ¶schen">
                            ðŸ—'ï¸
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

function renderPerformanceChart() {
    const container = document.getElementById('performance-chart');
    if (!container) return;
    
    const allValues = appData.savings?.pillar3a?.fundValues || [];
    const values = filterByProfile(allValues);
    
    if (values.length < 2) {
        container.innerHTML = `
            <div style="text-align: center; color: #666; padding: 40px;">
                <p>ðŸ"Š Noch nicht genug Daten fÃ¼r Chart</p>
                <small>Mindestens 2 Monate erforderlich</small>
            </div>
        `;
        return;
    }
    
    // Take last 12 months
    const chartData = values.slice(-12);
    const maxPerf = Math.max(...chartData.map(v => v.performance));
    const minPerf = Math.min(...chartData.map(v => v.performance));
    const range = Math.max(Math.abs(maxPerf), Math.abs(minPerf)) * 1.2 || 1;
    
    container.innerHTML = `
        <div style="padding: 15px;">
            <div style="display: flex; align-items: center; height: 150px; gap: 8px;">
                ${chartData.map(entry => {
                    const height = Math.abs(entry.performance / range * 60);
                    const isPositive = entry.performance >= 0;
                    return `
                        <div style="flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%;">
                            ${isPositive ? 
                                `<div style="flex: 1;"></div>
                                 <div style="width: 100%; height: ${height}px; 
                                      background: linear-gradient(180deg, #28a745, #34ce57); 
                                      border-radius: 2px 2px 0 0; margin-bottom: 1px;"
                                      title="${entry.monthName}: ${entry.performance.toFixed(2)}%"></div>` :
                                `<div style="width: 100%; height: ${height}px; 
                                      background: linear-gradient(180deg, #e74c3c, #dc3545); 
                                      border-radius: 0 0 2px 2px; margin-top: 1px;"
                                      title="${entry.monthName}: ${entry.performance.toFixed(2)}%"></div>
                                 <div style="flex: 1;"></div>`
                            }
                        </div>
                    `;
                }).join('')}
            </div>
            <div style="border-top: 1px solid #ddd; margin: 0 -5px;"></div>
            <div style="display: flex; gap: 8px; margin-top: 5px;">
                ${chartData.map(entry => `
                    <div style="flex: 1; font-size: 9px; color: #666; text-align: center;">
                        ${entry.monthName.substr(0, 3)}
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

// ============= OTHER INVESTMENTS =============
function addInvestment() {
    // Set default values
    document.getElementById('investment-name').value = '';
    document.getElementById('investment-amount').value = '';
    document.getElementById('investment-value').value = '';
    document.getElementById('investment-type').value = 'ETF';
    
    openModal('investment-modal');
}

function saveInvestment() {
    const name = document.getElementById('investment-name').value.trim();
    const amount = parseFloat(document.getElementById('investment-amount').value);
    const currentValue = parseFloat(document.getElementById('investment-value').value);
    const type = document.getElementById('investment-type').value;
    
    if (!name || !amount || !currentValue) {
        alert('Bitte alle Felder ausfÃ¼llen');
        return;
    }
    
    // Initialize if needed
    if (!appData.savings || !appData.savings.investments) {
        initializeSavingsData();
    }
    
    const profile = appData.currentProfile === 'family' ? 'shared' : appData.currentProfile;
    
    const investment = {
        id: Date.now(),
        name: name,
        invested: amount,
        currentValue: currentValue,
        type: type,
        performance: ((currentValue - amount) / amount * 100),
        profit: currentValue - amount,
        date: new Date().toISOString(),
        month: getCurrentMonth(),
        profile: profile,
        account: profile
    };
    
    appData.savings.investments.push(investment);
    saveData();
    renderInvestmentsSection();
    updateSavingsRecommendations();
    
    closeModal('investment-modal');
    showNotification(`âœ… Investment "${name}" hinzugefÃ¼gt!`, 'success');
}

// Edit investment
function editInvestment(id) {
    const investment = appData.savings?.investments?.find(inv => inv.id === id);
    if (!investment) return;
    
    const newName = prompt('Investment Name:', investment.name);
    if (!newName) return;
    
    const newInvested = parseFloat(prompt('Investierter Betrag (CHF):', investment.invested));
    if (!newInvested || newInvested <= 0) return;
    
    const newValue = parseFloat(prompt('Aktueller Wert (CHF):', investment.currentValue));
    if (!newValue || newValue <= 0) return;
    
    investment.name = newName;
    investment.invested = newInvested;
    investment.currentValue = newValue;
    investment.performance = ((newValue - newInvested) / newInvested * 100);
    investment.profit = newValue - newInvested;
    investment.lastUpdate = new Date().toISOString();
    
    saveData();
    renderInvestmentsSection();
    updateSavingsRecommendations();
    
    showNotification(`âœ… Investment "${newName}" aktualisiert!`, 'success');
}

function updateInvestmentValue(id) {
    const investment = appData.savings?.investments?.find(inv => inv.id === id);
    if (!investment) return;
    
    const newValue = parseFloat(prompt(`Neuer Wert fÃ¼r ${investment.name}:`, investment.currentValue));
    if (!newValue || newValue <= 0) return;
    
    investment.currentValue = newValue;
    investment.performance = ((newValue - investment.invested) / investment.invested * 100);
    investment.profit = newValue - investment.invested;
    investment.lastUpdate = new Date().toISOString();
    
    saveData();
    renderInvestmentsSection();
    updateSavingsRecommendations();
    
    showNotification(`âœ… ${investment.name} aktualisiert!`, 'success');
}

function deleteInvestment(id) {
    if (!confirm('Investment wirklich lÃ¶schen?')) return;
    
    if (!appData.savings || !appData.savings.investments) return;
    
    appData.savings.investments = appData.savings.investments.filter(inv => inv.id !== id);
    saveData();
    renderInvestmentsSection();
    updateSavingsRecommendations();
    
    showNotification('âœ… Investment gelÃ¶scht!', 'success');
}

function renderInvestmentsSection() {
    const container = document.getElementById('investments-content');
    if (!container) return;
    
    const allInvestments = appData.savings?.investments || [];
    const investments = filterByProfile(allInvestments);
    
    // Get active savings expenses that are not SÃ¤ule 3a for display purposes
    const profile = getCurrentProfileFilter();
    const allExpenses = [...(appData.fixedExpenses || []), ...(appData.variableExpenses || [])];
    const investmentExpenses = allExpenses.filter(exp => {
        const isInvestmentCategory = exp.category === 'Investitionen/ETFs' || 
                                     exp.category === 'Aktien/Trading' || 
                                     exp.category === 'SÃ¤ule 3b' ||
                                     exp.category === 'Notgroschen' ||
                                     exp.category === 'Sparkonto';
        if (profile) {
            return exp.active && isInvestmentCategory && exp.account === profile;
        } else {
            return exp.active && isInvestmentCategory;
        }
    });
    
    const monthlyInvestmentExpenses = investmentExpenses.reduce((sum, exp) => sum + exp.amount, 0);
    
    const totalInvested = investments.reduce((sum, inv) => sum + inv.invested, 0);
    const totalValue = investments.reduce((sum, inv) => sum + inv.currentValue, 0);
    const totalProfit = totalValue - totalInvested;
    const totalPerformance = totalInvested > 0 ? (totalProfit / totalInvested * 100) : 0;
    
    // Profile indicator
    const profileName = appData.currentProfile === 'sven' ? 'Sven' : 
                       appData.currentProfile === 'franzi' ? 'Franzi' : 'Familie';
    
    container.innerHTML = `
        <div class="settings-group">
            <div class="settings-title">
                ðŸ'Ž Investment Portfolio
                <span style="font-size: 14px; font-weight: normal; color: #666; margin-left: 10px;">
                    (${profileName})
                </span>
            </div>
            
            <!-- Portfolio Summary -->
            <div style="background: linear-gradient(135deg, #667eea, #764ba2); 
                        color: white; padding: 20px; border-radius: 15px; 
                        text-align: center; margin-bottom: 20px;">
                <div style="font-size: 14px; opacity: 0.9;">Portfolio Gesamtwert</div>
                <div style="font-size: 32px; font-weight: bold; margin: 10px 0;">
                    CHF ${totalValue.toLocaleString()}
                </div>
                <div style="font-size: 16px; color: ${totalProfit >= 0 ? '#90EE90' : '#FFB6C1'}">
                    ${totalProfit >= 0 ? 'ðŸ"ˆ' : 'ðŸ"‰'} 
                    ${totalProfit >= 0 ? '+' : ''}CHF ${totalProfit.toFixed(2)} 
                    (${totalPerformance.toFixed(2)}%)
                </div>
            </div>
            
            <!-- NEW: Show automatic monthly investments from expenses -->
            ${monthlyInvestmentExpenses > 0 ? `
                <div class="recommendation-card info" style="margin-bottom: 20px;">
                    <div class="recommendation-title">
                        🔄 Geplante monatliche Investments
                    </div>
                    <div class="recommendation-text">
                        <strong>CHF ${monthlyInvestmentExpenses.toLocaleString()}</strong> pro Monat aus Fixkosten<br>
                        ${investmentExpenses.map(exp => `• ${exp.name} (${exp.category}): CHF ${exp.amount}`).join('<br>')}<br>
                        <small style="opacity: 0.8;">⚠️ Diese Beträge werden beim Monatsabschluss tatsächlich investiert</small>
                    </div>
                </div>
            ` : ''}
            
            <!-- Investment List -->
            <div id="investment-list">
                ${investments.length === 0 ? 
                    '<div class="text-center" style="padding: 40px 0; color: #666;">Noch keine Investments erfasst</div>' :
                    investments.map(inv => `
                        <div class="expense-item" style="margin-bottom: 10px;">
                            <div class="expense-header">
                                <div class="expense-info">
                                    <div class="expense-name">
                                        ${getInvestmentIcon(inv.type)} ${inv.name}
                                        ${inv.fromExpense ? ' ðŸ"„' : ''}
                                    </div>
                                    <div class="expense-category">
                                        Investiert: CHF ${inv.invested.toLocaleString()} | 
                                        Wert: CHF ${inv.currentValue.toLocaleString()}
                                        ${inv.fromExpense ? ' â€¢ Aus Ausgaben' : ''}
                                        ${inv.category ? ` â€¢ ${inv.category}` : ''}
                                    </div>
                                </div>
                                <div style="display: flex; align-items: center; gap: 10px;">
                                    <div class="expense-amount" style="color: ${inv.profit >= 0 ? '#28a745' : '#dc3545'}">
                                        ${inv.profit >= 0 ? '+' : ''}${inv.performance.toFixed(2)}%
                                        <div style="font-size: 12px;">
                                            ${inv.profit >= 0 ? '+' : ''}CHF ${inv.profit.toFixed(2)}
                                        </div>
                                    </div>
                                    <div class="expense-actions">
                                        ${!inv.fromExpense ? `
                                            <button class="action-btn edit" onclick="editInvestment(${inv.id})" title="Bearbeiten">
                                                âœï¸
                                            </button>
                                        ` : ''}
                                        <button class="action-btn edit" onclick="updateInvestmentValue(${inv.id})" title="Wert aktualisieren">
                                            ðŸ"Š
                                        </button>
                                        ${!inv.fromExpense ? `
                                            <button class="action-btn delete" onclick="deleteInvestment(${inv.id})" title="LÃ¶schen">
                                                ðŸ—'ï¸
                                            </button>
                                        ` : ''}
                                    </div>
                                </div>
                            </div>
                        </div>
                    `).join('')
                }
            </div>
            
            <!-- Add Investment Button -->
            <button class="btn btn-primary" onclick="addInvestment()" style="width: 100%; margin-top: 15px;">
                âž• Investment hinzufÃ¼gen
            </button>
        </div>
    `;
}

function getInvestmentIcon(type) {
    const icons = {
        'Bitcoin': 'â‚¿',
        'ETF': 'ðŸ"Š',
        'Aktien': 'ðŸ"ˆ',
        'Gold': 'ðŸ¥‡',
        'Crypto': 'ðŸª™',
        'Immobilien': 'ðŸ ',
        'SÃ¤ule 3b': 'ðŸ›ï¸',
        'Notgroschen': 'ðŸš¨',
        'Sparkonto': 'ðŸ'°',
        'Andere': 'ðŸ'°'
    };
    return icons[type] || 'ðŸ'°';
}

function getAccountDisplayName(account) {
    if (account === 'sven') return 'Sven';
    if (account === 'franzi') return 'Franzi';
    if (account === 'shared') return 'Gemeinsam';
    return account;
}

// ============= SAVINGS RECOMMENDATIONS =============
function updateSavingsRecommendations() {
    const container = document.getElementById('savings-recommendations');
    if (!container) return;
    
    const recommendations = [];
    
    // Get current wealth status
    const balance = getCurrentBalance();
    const yearlyDeposits = calculateYearlyPillar3aDeposits();
    const remaining3a = PILLAR_3A_MAX_2025 - yearlyDeposits;
    
    // Get filtered investment totals
    const allInvestments = appData.savings?.investments || [];
    const investments = filterByProfile(allInvestments);
    const totalInvested = investments.reduce((sum, inv) => sum + inv.invested, 0);
    const totalValue = investments.reduce((sum, inv) => sum + inv.currentValue, 0);
    
    // Profile-specific message
    if (appData.currentProfile !== 'family') {
        recommendations.push({
            type: 'info',
            title: `ðŸ'¤ PersÃ¶nliche Ansicht`,
            text: `Sie sehen nur Ihre eigenen Spar- und Investment-EintrÃ¤ge. Wechseln Sie zu "Familie" fÃ¼r GesamtÃ¼bersicht.`
        });
    }
    
    // SÃ¤ule 3a recommendations
    if (remaining3a > 0 && new Date().getMonth() >= 9) { // Oktober oder spÃ¤ter
        recommendations.push({
            type: 'warning',
            title: 'â° SÃ¤ule 3a Jahresende',
            text: `Nur noch ${12 - new Date().getMonth()} Monate! Zahlen Sie CHF ${remaining3a.toLocaleString()} ein fÃ¼r CHF ${(remaining3a * TAX_SAVING_RATE).toFixed(0)} Steuerersparnis.`
        });
    }
    
    // Check for expenses marked as Sparen (profile filtered)
    const savingsExpenses = [...(appData.fixedExpenses || []), ...(appData.variableExpenses || [])]
        .filter(exp => {
            if (appData.currentProfile === 'family') {
                return exp.active && SAVINGS_CATEGORIES.includes(exp.category);
            } else {
                return exp.active && SAVINGS_CATEGORIES.includes(exp.category) && exp.account === appData.currentProfile;
            }
        });
    
    if (savingsExpenses.length > 0) {
        const totalSavingsExpenses = savingsExpenses.reduce((sum, exp) => sum + exp.amount, 0);
        recommendations.push({
            type: 'success',
            title: 'ðŸ'° Aktive Spar-Ausgaben',
            text: `Sie haben ${savingsExpenses.length} Spar-Posten mit CHF ${totalSavingsExpenses.toLocaleString()} monatlich erfasst. Diese werden automatisch getrackt!`
        });
    }
    
    // Emergency fund check
    const emergencyGoal = appData.savings?.goals?.emergency || 30000;
    if (balance < emergencyGoal * 0.5) {
        recommendations.push({
            type: 'danger',
            title: 'ðŸš¨ Notgroschen aufbauen',
            text: `Ihr Notgroschen (CHF ${balance.toLocaleString()}) ist unter 50% des Ziels. Priorisieren Sie den Aufbau auf CHF ${emergencyGoal.toLocaleString()}.`
        });
    } else if (balance < emergencyGoal) {
        recommendations.push({
            type: 'warning',
            title: 'ðŸ'° Notgroschen erhÃ¶hen',
            text: `Noch CHF ${(emergencyGoal - balance).toLocaleString()} bis zum Notgroschen-Ziel von CHF ${emergencyGoal.toLocaleString()}.`
        });
    }
    
    // Investment diversification
    if (totalInvested === 0 && balance > emergencyGoal) {
        recommendations.push({
            type: 'info',
            title: 'ðŸ"Š Zeit fÃ¼r Investments',
            text: 'Notgroschen erreicht! Beginnen Sie mit ETF-SparplÃ¤nen oder anderen Investments fÃ¼r langfristigen VermÃ¶gensaufbau.'
        });
    }
    
    // Asset allocation (only for current profile's investments)
    if (totalInvested > 0) {
        const bitcoinAmount = investments.filter(inv => inv.type === 'Bitcoin').reduce((sum, inv) => sum + inv.currentValue, 0);
        const bitcoinPercentage = (bitcoinAmount / totalValue) * 100;
        
        if (bitcoinPercentage > 20) {
            recommendations.push({
                type: 'warning',
                title: 'âš–ï¸ Portfolio diversifizieren',
                text: `Bitcoin macht ${bitcoinPercentage.toFixed(0)}% Ihres Portfolios aus. ErwÃ¤gen Sie mehr Diversifikation fÃ¼r Risikominimierung.`
            });
        }
    }
    
    // Savings rate
    const monthlyIncome = appData.profiles[appData.currentProfile]?.income || 0;
    const savingsRate = monthlyIncome > 0 ? ((appData.savings?.pillar3a?.monthlyAmount || 0) / monthlyIncome * 100) : 0;
    
    if (savingsRate < 10 && monthlyIncome > 0 && appData.currentProfile !== 'family') {
        recommendations.push({
            type: 'info',
            title: 'ðŸ"ˆ Sparquote erhÃ¶hen',
            text: `Ihre Sparquote ist ${savingsRate.toFixed(0)}%. Ziel: Mindestens 10-20% des Einkommens sparen.`
        });
    } else if (savingsRate >= 20 && appData.currentProfile !== 'family') {
        recommendations.push({
            type: 'success',
            title: 'ðŸŒŸ Exzellente Sparquote',
            text: `Mit ${savingsRate.toFixed(0)}% Sparquote sind Sie auf dem besten Weg zum VermÃ¶gensaufbau!`
        });
    }
    
    if (recommendations.length === 0) {
        recommendations.push({
            type: 'success',
            title: 'âœ… Alles im grÃ¼nen Bereich',
            text: 'Ihre Spar-Strategie ist gut aufgestellt. Weiter so!'
        });
    }
    
    container.innerHTML = recommendations.map(rec => `
        <div class="recommendation-card ${rec.type}">
            <div class="recommendation-title">${rec.title}</div>
            <div class="recommendation-text">${rec.text}</div>
        </div>
    `).join('');
}

// ============= HELPER FUNCTIONS =============
function getCurrentMonth() {
    return new Date().toISOString().slice(0, 7);
}

function getCurrentBalance() {
    if (appData.currentProfile === 'sven') {
        return appData.accounts.sven.balance || 0;
    } else if (appData.currentProfile === 'franzi') {
        return appData.accounts.franzi.balance || 0;
    } else {
        return appData.accounts.shared.balance || 0;
    }
}

function addPillar3aDeposit() {
    const amount = parseFloat(prompt('Einzahlungsbetrag (CHF):', appData.savings?.pillar3a?.monthlyAmount || 588));
    if (!amount || amount <= 0) return;
    
    const description = prompt('Beschreibung (optional):', 'Manuelle Einzahlung') || 'Manuelle Einzahlung';
    
    // Initialize if needed
    if (!appData.savings || !appData.savings.pillar3a) {
        initializeSavingsData();
    }
    
    const profile = appData.currentProfile === 'family' ? 'shared' : appData.currentProfile;
    
    const deposit = {
        id: Date.now() + Math.random(),
        amount: amount,
        date: new Date().toISOString(),
        year: new Date().getFullYear(),
        month: getCurrentMonth(),
        description: description,
        profile: profile,
        account: profile
    };
    
    if (!appData.savings.pillar3a.deposits) {
        appData.savings.pillar3a.deposits = [];
    }
    
    appData.savings.pillar3a.deposits.push(deposit);
    
    // Update yearly total
    const yearlyDeposits = calculateYearlyPillar3aDeposits();
    appData.savings.pillar3a.yearlyDeposits = yearlyDeposits;
    
    saveData();
    renderPillar3aSection();
    updateSavingsRecommendations();
    
    showNotification(`âœ… Einzahlung von CHF ${amount} erfasst!`, 'success');
}

// ============= MAKE FUNCTIONS GLOBALLY AVAILABLE =============
window.addPillar3aValue = addPillar3aValue;
window.savePillar3aValue = savePillar3aValue;
window.addPillar3aDeposit = addPillar3aDeposit;
window.editPillar3aDeposit = editPillar3aDeposit;
window.deletePillar3aDeposit = deletePillar3aDeposit;
window.editFundValue = editFundValue;
window.deleteFundValue = deleteFundValue;
window.addInvestment = addInvestment;
window.saveInvestment = saveInvestment;
window.editInvestment = editInvestment;
window.updateInvestmentValue = updateInvestmentValue;
window.deleteInvestment = deleteInvestment;
window.renderPillar3aSection = renderPillar3aSection;
window.renderPerformanceChart = renderPerformanceChart;
window.renderInvestmentsSection = renderInvestmentsSection;
window.updateSavingsRecommendations = updateSavingsRecommendations;
window.initializeSavingsData = initializeSavingsData;
window.calculateYearlyPillar3aDeposits = calculateYearlyPillar3aDeposits;

// Initialize immediately
console.log('ðŸ'° Savings module loading...');
if (typeof appData !== 'undefined') {
    initializeSavingsData();
    console.log('âœ… Savings module initialized with appData');
} else {
    console.log('â³ Waiting for appData...');
    // Try again when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            initializeSavingsData();
            console.log('âœ… Savings module initialized on DOM ready');
        });
    }
}

console.log('âœ… Savings module fully loaded');
