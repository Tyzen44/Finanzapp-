// ============= SAVINGS & INVESTMENT MANAGEMENT ============= 

// Säule 3a Constants for 2025
const PILLAR_3A_MAX_2025 = 7056; // Maximum für Angestellte mit Pensionskasse
const TAX_SAVING_RATE = 0.25; // ~25% Steuerersparnis (Durchschnitt)

// Initialize savings data structure
if (!appData.savings) {
    appData.savings = {
        pillar3a: {
            yearlyDeposits: 0,
            monthlyAmount: 200, // Standard monthly deposit
            fundValues: [], // Monthly fund values
            deposits: [] // Individual deposits
        },
        investments: [],
        goals: {
            emergency: 30000,
            yearly: 10000
        }
    };
}

// ============= PILLAR 3A PERFORMANCE TRACKING =============
function addPillar3aValue() {
    const currentMonth = getCurrentMonth();
    const monthName = new Date().toLocaleDateString('de-CH', { month: 'long', year: 'numeric' });
    
    const currentValue = parseFloat(prompt(`Aktueller Fondswert (Ende ${monthName}):`, ''));
    const monthlyDeposit = parseFloat(prompt('Einzahlung diesen Monat (CHF):', appData.savings.pillar3a.monthlyAmount));
    
    if (!currentValue || currentValue <= 0) {
        alert('Bitte geben Sie einen gültigen Fondswert ein');
        return;
    }
    
    // Find last month's value
    const lastEntry = appData.savings.pillar3a.fundValues[appData.savings.pillar3a.fundValues.length - 1];
    const startValue = lastEntry ? lastEntry.endValue : 0;
    
    // Calculate performance
    let performance = 0;
    let profit = 0;
    
    if (startValue > 0) {
        // Performance = (Endwert - Startwert - Einzahlung) / Startwert
        profit = currentValue - startValue - (monthlyDeposit || 0);
        performance = (profit / startValue) * 100;
    }
    
    const entry = {
        month: currentMonth,
        monthName: monthName,
        startValue: startValue,
        deposit: monthlyDeposit || 0,
        endValue: currentValue,
        profit: profit,
        performance: performance,
        date: new Date().toISOString()
    };
    
    // Add to fund values
    appData.savings.pillar3a.fundValues.push(entry);
    
    // Update yearly deposits
    const currentYear = new Date().getFullYear();
    const yearlyDeposits = appData.savings.pillar3a.fundValues
        .filter(v => new Date(v.date).getFullYear() === currentYear)
        .reduce((sum, v) => sum + v.deposit, 0);
    appData.savings.pillar3a.yearlyDeposits = yearlyDeposits;
    
    saveData();
    renderPillar3aSection();
    renderPerformanceChart();
    updateSavingsRecommendations();
    
    showNotification(`✅ Fondswert erfasst!\nPerformance ${monthName}: ${performance.toFixed(2)}%`, 'success');
}

function renderPillar3aSection() {
    const container = document.getElementById('pillar3a-content');
    if (!container) return;
    
    const currentYear = new Date().getFullYear();
    const yearlyDeposits = appData.savings.pillar3a.yearlyDeposits || 0;
    const remaining = PILLAR_3A_MAX_2025 - yearlyDeposits;
    const taxSaving = yearlyDeposits * TAX_SAVING_RATE;
    const maxTaxSaving = PILLAR_3A_MAX_2025 * TAX_SAVING_RATE;
    
    // Get current fund value
    const lastEntry = appData.savings.pillar3a.fundValues[appData.savings.pillar3a.fundValues.length - 1];
    const currentFundValue = lastEntry ? lastEntry.endValue : 0;
    
    // Calculate total performance
    const totalDeposits = appData.savings.pillar3a.fundValues.reduce((sum, v) => sum + v.deposit, 0);
    const totalProfit = currentFundValue - totalDeposits;
    const totalPerformance = totalDeposits > 0 ? (totalProfit / totalDeposits) * 100 : 0;
    
    container.innerHTML = `
        <div class="settings-group">
            <div class="settings-title">🏦 Säule 3a - BEKB Vorsorgefonds</div>
            
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
            
            <!-- Tax Savings -->
            <div class="recommendation-card ${remaining > 0 ? 'warning' : 'success'}" style="margin-bottom: 20px;">
                <div class="recommendation-title">
                    💰 Steuerersparnis ${currentYear}
                </div>
                <div class="recommendation-text">
                    Aktuelle Ersparnis: <strong>CHF ${taxSaving.toFixed(0)}</strong><br>
                    ${remaining > 0 ? 
                        `Mögliche zusätzliche Ersparnis: <strong>CHF ${(remaining * TAX_SAVING_RATE).toFixed(0)}</strong><br>
                         Noch einzuzahlen für Maximum: <strong>CHF ${remaining.toLocaleString()}</strong>` :
                        `✅ Maximum erreicht! Maximale Steuerersparnis von CHF ${maxTaxSaving.toFixed(0)} gesichert.`
                    }
                </div>
            </div>
            
            <!-- Monthly Performance -->
            <div style="margin-bottom: 20px;">
                <h4 style="margin-bottom: 15px;">📊 Monatliche Performance</h4>
                <div id="performance-list" style="max-height: 300px; overflow-y: auto;">
                    ${renderPerformanceList()}
                </div>
            </div>
            
            <!-- Action Buttons -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                <button class="btn btn-primary" onclick="addPillar3aValue()">
                    📈 Fondswert eintragen
                </button>
                <button class="btn btn-secondary" onclick="addPillar3aDeposit()">
                    💵 Einzahlung erfassen
                </button>
            </div>
        </div>
    `;
}

function renderPerformanceList() {
    const values = appData.savings.pillar3a.fundValues || [];
    
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
                <div class="expense-amount" style="color: ${entry.performance >= 0 ? '#28a745' : '#dc3545'}">
                    ${entry.performance >= 0 ? '+' : ''}${entry.performance.toFixed(2)}%
                    <div style="font-size: 12px;">
                        ${entry.profit >= 0 ? '+' : ''}CHF ${entry.profit.toFixed(2)}
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

function renderPerformanceChart() {
    const container = document.getElementById('performance-chart');
    if (!container) return;
    
    const values = appData.savings.pillar3a.fundValues || [];
    
    if (values.length < 2) {
        container.innerHTML = `
            <div style="text-align: center; color: #666; padding: 40px;">
                <p>📊 Noch nicht genug Daten für Chart</p>
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
    const name = prompt('Investment Name (z.B. Bitcoin, MSCI World ETF):');
    const amount = parseFloat(prompt('Investierter Betrag (CHF):'));
    const currentValue = parseFloat(prompt('Aktueller Wert (CHF):'));
    const type = prompt('Typ (Bitcoin/ETF/Aktien/Gold/Andere):', 'Andere');
    
    if (!name || !amount || !currentValue) {
        alert('Bitte alle Felder ausfüllen');
        return;
    }
    
    const investment = {
        id: Date.now(),
        name: name,
        invested: amount,
        currentValue: currentValue,
        type: type,
        performance: ((currentValue - amount) / amount * 100),
        profit: currentValue - amount,
        date: new Date().toISOString()
    };
    
    appData.savings.investments.push(investment);
    saveData();
    renderInvestmentsSection();
    updateSavingsRecommendations();
    
    showNotification(`✅ Investment "${name}" hinzugefügt!`, 'success');
}

function updateInvestmentValue(id) {
    const investment = appData.savings.investments.find(inv => inv.id === id);
    if (!investment) return;
    
    const newValue = parseFloat(prompt(`Neuer Wert für ${investment.name}:`, investment.currentValue));
    if (!newValue || newValue <= 0) return;
    
    investment.currentValue = newValue;
    investment.performance = ((newValue - investment.invested) / investment.invested * 100);
    investment.profit = newValue - investment.invested;
    investment.lastUpdate = new Date().toISOString();
    
    saveData();
    renderInvestmentsSection();
    updateSavingsRecommendations();
    
    showNotification(`✅ ${investment.name} aktualisiert!`, 'success');
}

function deleteInvestment(id) {
    if (!confirm('Investment wirklich löschen?')) return;
    
    appData.savings.investments = appData.savings.investments.filter(inv => inv.id !== id);
    saveData();
    renderInvestmentsSection();
    updateSavingsRecommendations();
    
    showNotification('✅ Investment gelöscht!', 'success');
}

function renderInvestmentsSection() {
    const container = document.getElementById('investments-content');
    if (!container) return;
    
    const investments = appData.savings.investments || [];
    const totalInvested = investments.reduce((sum, inv) => sum + inv.invested, 0);
    const totalValue = investments.reduce((sum, inv) => sum + inv.currentValue, 0);
    const totalProfit = totalValue - totalInvested;
    const totalPerformance = totalInvested > 0 ? (totalProfit / totalInvested * 100) : 0;
    
    container.innerHTML = `
        <div class="settings-group">
            <div class="settings-title">💎 Investment Portfolio</div>
            
            <!-- Portfolio Summary -->
            <div style="background: linear-gradient(135deg, #667eea, #764ba2); 
                        color: white; padding: 20px; border-radius: 15px; 
                        text-align: center; margin-bottom: 20px;">
                <div style="font-size: 14px; opacity: 0.9;">Portfolio Gesamtwert</div>
                <div style="font-size: 32px; font-weight: bold; margin: 10px 0;">
                    CHF ${totalValue.toLocaleString()}
                </div>
                <div style="font-size: 16px; color: ${totalProfit >= 0 ? '#90EE90' : '#FFB6C1'}">
                    ${totalProfit >= 0 ? '📈' : '📉'} 
                    ${totalProfit >= 0 ? '+' : ''}CHF ${totalProfit.toFixed(2)} 
                    (${totalPerformance.toFixed(2)}%)
                </div>
            </div>
            
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
                                    </div>
                                    <div class="expense-category">
                                        Investiert: CHF ${inv.invested.toLocaleString()} | 
                                        Wert: CHF ${inv.currentValue.toLocaleString()}
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
                                        <button class="action-btn edit" onclick="updateInvestmentValue(${inv.id})" title="Wert aktualisieren">
                                            📊
                                        </button>
                                        <button class="action-btn delete" onclick="deleteInvestment(${inv.id})" title="Löschen">
                                            🗑️
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    `).join('')
                }
            </div>
            
            <!-- Add Investment Button -->
            <button class="btn btn-primary" onclick="addInvestment()" style="width: 100%; margin-top: 15px;">
                ➕ Investment hinzufügen
            </button>
        </div>
    `;
}

function getInvestmentIcon(type) {
    const icons = {
        'Bitcoin': '₿',
        'ETF': '📊',
        'Aktien': '📈',
        'Gold': '🥇',
        'Crypto': '🪙',
        'Immobilien': '🏠',
        'Andere': '💰'
    };
    return icons[type] || '💰';
}

// ============= SAVINGS RECOMMENDATIONS =============
function updateSavingsRecommendations() {
    const container = document.getElementById('savings-recommendations');
    if (!container) return;
    
    const recommendations = [];
    
    // Get current wealth status
    const balance = getCurrentBalance();
    const yearlyDeposits = appData.savings.pillar3a.yearlyDeposits || 0;
    const remaining3a = PILLAR_3A_MAX_2025 - yearlyDeposits;
    
    // Get investment totals
    const investments = appData.savings.investments || [];
    const totalInvested = investments.reduce((sum, inv) => sum + inv.invested, 0);
    const totalValue = investments.reduce((sum, inv) => sum + inv.currentValue, 0);
    
    // Säule 3a recommendations
    if (remaining3a > 0 && new Date().getMonth() >= 9) { // Oktober oder später
        recommendations.push({
            type: 'warning',
            title: '⏰ Säule 3a Jahresende',
            text: `Nur noch ${12 - new Date().getMonth()} Monate! Zahlen Sie CHF ${remaining3a.toLocaleString()} ein für CHF ${(remaining3a * TAX_SAVING_RATE).toFixed(0)} Steuerersparnis.`
        });
    }
    
    // Emergency fund check
    const emergencyGoal = appData.savings.goals.emergency || 30000;
    if (balance < emergencyGoal * 0.5) {
        recommendations.push({
            type: 'danger',
            title: '🚨 Notgroschen aufbauen',
            text: `Ihr Notgroschen (CHF ${balance.toLocaleString()}) ist unter 50% des Ziels. Priorisieren Sie den Aufbau auf CHF ${emergencyGoal.toLocaleString()}.`
        });
    } else if (balance < emergencyGoal) {
        recommendations.push({
            type: 'warning',
            title: '💰 Notgroschen erhöhen',
            text: `Noch CHF ${(emergencyGoal - balance).toLocaleString()} bis zum Notgroschen-Ziel von CHF ${emergencyGoal.toLocaleString()}.`
        });
    }
    
    // Investment diversification
    if (totalInvested === 0 && balance > emergencyGoal) {
        recommendations.push({
            type: 'info',
            title: '📊 Zeit für Investments',
            text: 'Notgroschen erreicht! Beginnen Sie mit ETF-Sparplänen oder anderen Investments für langfristigen Vermögensaufbau.'
        });
    }
    
    // Asset allocation
    if (totalInvested > 0) {
        const bitcoinAmount = investments.filter(inv => inv.type === 'Bitcoin').reduce((sum, inv) => sum + inv.currentValue, 0);
        const bitcoinPercentage = (bitcoinAmount / totalValue) * 100;
        
        if (bitcoinPercentage > 20) {
            recommendations.push({
                type: 'warning',
                title: '⚖️ Portfolio diversifizieren',
                text: `Bitcoin macht ${bitcoinPercentage.toFixed(0)}% Ihres Portfolios aus. Erwägen Sie mehr Diversifikation für Risikominimierung.`
            });
        }
    }
    
    // Savings rate
    const monthlyIncome = appData.profiles[appData.currentProfile]?.income || 0;
    const savingsRate = monthlyIncome > 0 ? ((appData.savings.pillar3a.monthlyAmount || 0) / monthlyIncome * 100) : 0;
    
    if (savingsRate < 10 && monthlyIncome > 0) {
        recommendations.push({
            type: 'info',
            title: '📈 Sparquote erhöhen',
            text: `Ihre Sparquote ist ${savingsRate.toFixed(0)}%. Ziel: Mindestens 10-20% des Einkommens sparen.`
        });
    } else if (savingsRate >= 20) {
        recommendations.push({
            type: 'success',
            title: '🌟 Exzellente Sparquote',
            text: `Mit ${savingsRate.toFixed(0)}% Sparquote sind Sie auf dem besten Weg zum Vermögensaufbau!`
        });
    }
    
    if (recommendations.length === 0) {
        recommendations.push({
            type: 'success',
            title: '✅ Alles im grünen Bereich',
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
    const amount = parseFloat(prompt('Einzahlungsbetrag (CHF):', appData.savings.pillar3a.monthlyAmount));
    if (!amount || amount <= 0) return;
    
    const deposit = {
        id: Date.now(),
        amount: amount,
        date: new Date().toISOString(),
        year: new Date().getFullYear()
    };
    
    if (!appData.savings.pillar3a.deposits) {
        appData.savings.pillar3a.deposits = [];
    }
    
    appData.savings.pillar3a.deposits.push(deposit);
    
    // Update yearly total
    const currentYear = new Date().getFullYear();
    const yearlyDeposits = appData.savings.pillar3a.deposits
        .filter(d => d.year === currentYear)
        .reduce((sum, d) => sum + d.amount, 0);
    appData.savings.pillar3a.yearlyDeposits = yearlyDeposits;
    
    saveData();
    renderPillar3aSection();
    updateSavingsRecommendations();
    
    showNotification(`✅ Einzahlung von CHF ${amount} erfasst!`, 'success');
}

// Make functions globally available
window.addPillar3aValue = addPillar3aValue;
window.addPillar3aDeposit = addPillar3aDeposit;
window.addInvestment = addInvestment;
window.updateInvestmentValue = updateInvestmentValue;
window.deleteInvestment = deleteInvestment;
