// ============= SAVINGS & INVESTMENT MANAGEMENT WITH PROFILE FILTERING ============= 

// Säule 3a Constants for 2025
const PILLAR_3A_MAX_2025 = 7056; // Maximum für Angestellte mit Pensionskasse
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
            },
            compoundCalculator: {
                lastCalculation: null,
                savedCalculations: []
            }
        };
        console.log('✅ Savings data structure initialized');
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
    if (!appData.savings.compoundCalculator) {
        appData.savings.compoundCalculator = {
            lastCalculation: null,
            savedCalculations: []
        };
    }
    if (!appData.savings.compoundCalculator.savedCalculations) {
        appData.savings.compoundCalculator.savedCalculations = [];
    }
}

// ============= COMPOUND INTEREST CALCULATOR =============
function calculateCompoundInterest() {
    const startCapital = parseFloat(document.getElementById('calc-start-capital').value) || 0;
    const monthlySavings = parseFloat(document.getElementById('calc-monthly-savings').value) || 0;
    const annualReturn = parseFloat(document.getElementById('calc-annual-return').value) || 0;
    const duration = parseInt(document.getElementById('calc-duration').value) || 0;
    const frequency = document.getElementById('calc-frequency').value;
    const inflation = parseFloat(document.getElementById('calc-inflation').value) || 0;
    
    if (duration <= 0) {
        alert('⚠️ Bitte geben Sie eine gültige Laufzeit ein');
        return;
    }
    
    // Initialize savings data if needed
    if (!appData.savings) {
        initializeSavingsData();
    }
    if (!appData.savings.compoundCalculator) {
        appData.savings.compoundCalculator = {
            lastCalculation: null,
            savedCalculations: []
        };
    }
    
    // Save calculation parameters
    const calculationParams = {
        startCapital,
        monthlySavings,
        annualReturn,
        duration,
        frequency,
        inflation,
        date: new Date().toISOString()
    };
    
    appData.savings.compoundCalculator.lastCalculation = calculationParams;
    
    // Perform calculations
    const results = performCompoundCalculation(calculationParams);
    
    // Display results
    displayCalculationResults(results, calculationParams);
    
    saveData();
}

function performCompoundCalculation(params) {
    const { startCapital, monthlySavings, annualReturn, duration, frequency, inflation } = params;
    
    const monthlyReturn = annualReturn / 100 / 12;
    const months = duration * 12;
    const yearlyInflation = inflation / 100;
    
    let futureValue = startCapital;
    let totalDeposits = startCapital;
    let yearByYear = [];
    
    // Calculate compound growth with regular deposits
    if (frequency === 'monthly') {
        for (let month = 1; month <= months; month++) {
            // Add monthly savings
            futureValue += monthlySavings;
            totalDeposits += monthlySavings;
            
            // Apply monthly compound interest
            futureValue *= (1 + monthlyReturn);
            
            // Save yearly snapshots
            if (month % 12 === 0) {
                const year = month / 12;
                const realValue = futureValue / Math.pow(1 + yearlyInflation, year);
                yearByYear.push({
                    year: year,
                    futureValue: futureValue,
                    realValue: realValue,
                    totalDeposits: totalDeposits,
                    interestEarned: futureValue - totalDeposits
                });
            }
        }
    } else {
        // Yearly deposits
        const yearlySavings = monthlySavings * 12;
        for (let year = 1; year <= duration; year++) {
            futureValue += yearlySavings;
            totalDeposits += yearlySavings;
            futureValue *= Math.pow(1 + annualReturn / 100, 1);
            
            const realValue = futureValue / Math.pow(1 + yearlyInflation, year);
            yearByYear.push({
                year: year,
                futureValue: futureValue,
                realValue: realValue,
                totalDeposits: totalDeposits,
                interestEarned: futureValue - totalDeposits
            });
        }
    }
    
    const totalInterest = futureValue - totalDeposits;
    const realFutureValue = futureValue / Math.pow(1 + yearlyInflation, duration);
    const averageMonthlyGain = totalInterest / months;
    
    return {
        futureValue,
        totalDeposits,
        totalInterest,
        realFutureValue,
        averageMonthlyGain,
        yearByYear,
        effectiveReturn: ((futureValue / totalDeposits - 1) * 100).toFixed(2)
    };
}

function displayCalculationResults(results, params) {
    const container = document.getElementById('calculation-results');
    const { futureValue, totalDeposits, totalInterest, realFutureValue, averageMonthlyGain, yearByYear, effectiveReturn } = results;
    
    container.innerHTML = `
        <div style="background: linear-gradient(135deg, #667eea, #764ba2); color: white; padding: 25px; border-radius: 15px; margin-bottom: 20px;">
            <h3 style="margin-bottom: 20px; text-align: center;">🎯 Ergebnis nach ${params.duration} Jahren</h3>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
                <div style="text-align: center;">
                    <div style="font-size: 14px; opacity: 0.9; margin-bottom: 5px;">Endkapital (nominal)</div>
                    <div style="font-size: 28px; font-weight: 700;">CHF ${futureValue.toLocaleString('de-CH', {maximumFractionDigits: 0})}</div>
                </div>
                <div style="text-align: center;">
                    <div style="font-size: 14px; opacity: 0.9; margin-bottom: 5px;">Endkapital (real)</div>
                    <div style="font-size: 28px; font-weight: 700;">CHF ${realFutureValue.toLocaleString('de-CH', {maximumFractionDigits: 0})}</div>
                </div>
            </div>
            
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-bottom: 20px;">
                <div style="text-align: center; background: rgba(255,255,255,0.1); padding: 15px; border-radius: 10px;">
                    <div style="font-size: 12px; opacity: 0.9;">Eingezahlt</div>
                    <div style="font-size: 18px; font-weight: 600;">CHF ${totalDeposits.toLocaleString('de-CH', {maximumFractionDigits: 0})}</div>
                </div>
                <div style="text-align: center; background: rgba(255,255,255,0.1); padding: 15px; border-radius: 10px;">
                    <div style="font-size: 12px; opacity: 0.9;">Zinserträge</div>
                    <div style="font-size: 18px; font-weight: 600; color: #90EE90;">CHF ${totalInterest.toLocaleString('de-CH', {maximumFractionDigits: 0})}</div>
                </div>
                <div style="text-align: center; background: rgba(255,255,255,0.1); padding: 15px; border-radius: 10px;">
                    <div style="font-size: 12px; opacity: 0.9;">Ø Monatlich</div>
                    <div style="font-size: 18px; font-weight: 600;">CHF ${averageMonthlyGain.toLocaleString('de-CH', {maximumFractionDigits: 0})}</div>
                </div>
            </div>
            
            <div style="text-align: center; background: rgba(255,255,255,0.1); padding: 15px; border-radius: 10px;">
                <div style="font-size: 14px; opacity: 0.9; margin-bottom: 5px;">Gesamtrendite</div>
                <div style="font-size: 24px; font-weight: 700;">${effectiveReturn}%</div>
                <div style="font-size: 12px; opacity: 0.8; margin-top: 5px;">
                    ${((totalInterest / totalDeposits) * 100).toFixed(1)}x Ihr eingesetztes Kapital
                </div>
            </div>
        </div>
        
        <!-- Chart Visualization -->
        <div style="background: white; border-radius: 12px; padding: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); margin-bottom: 20px;">
            <h4 style="margin-bottom: 15px;">📊 Kapitalentwicklung</h4>
            ${renderCompoundChart(yearByYear)}
        </div>
        
        <div style="background: white; border-radius: 12px; padding: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h4 style="margin-bottom: 15px;">📋 Entwicklung Jahr für Jahr</h4>
            <div style="max-height: 300px; overflow-y: auto;">
                <table style="width: 100%; border-collapse: collapse;">
                    <thead>
                        <tr style="background: #f8f9fa;">
                            <th style="padding: 8px; text-align: left; font-size: 12px;">Jahr</th>
                            <th style="padding: 8px; text-align: right; font-size: 12px;">Eingezahlt</th>
                            <th style="padding: 8px; text-align: right; font-size: 12px;">Wert (nominal)</th>
                            <th style="padding: 8px; text-align: right; font-size: 12px;">Zinsen</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${yearByYear.map(year => `
                            <tr style="border-bottom: 1px solid #eee;">
                                <td style="padding: 8px; font-size: 13px;">${year.year}</td>
                                <td style="padding: 8px; text-align: right; font-size: 13px;">CHF ${year.totalDeposits.toLocaleString('de-CH', {maximumFractionDigits: 0})}</td>
                                <td style="padding: 8px; text-align: right; font-size: 13px; font-weight: 600;">CHF ${year.futureValue.toLocaleString('de-CH', {maximumFractionDigits: 0})}</td>
                                <td style="padding: 8px; text-align: right; font-size: 13px; color: #28a745;">+CHF ${year.interestEarned.toLocaleString('de-CH', {maximumFractionDigits: 0})}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
        
        <div style="margin-top: 20px;">
            <button class="btn btn-primary" onclick="saveCalculationResult()" style="width: 100%;">
                💾 Berechnung speichern
            </button>
        </div>
    `;
    
    container.style.display = 'block';
}

function renderCompoundChart(yearByYear) {
    if (yearByYear.length === 0) return '<p>Keine Daten verfügbar</p>';
    
    const maxValue = Math.max(...yearByYear.map(y => y.futureValue));
    const chartHeight = 200;
    
    return `
        <div style="position: relative; height: ${chartHeight + 30}px; padding: 10px; background: #f8f9fa; border-radius: 8px;">
            <!-- Chart bars -->
            <div style="display: flex; align-items: end; height: ${chartHeight}px; gap: 6px;">
                ${yearByYear.map(year => {
                    const totalHeight = (year.futureValue / maxValue) * (chartHeight - 60);
                    const depositsHeight = (year.totalDeposits / maxValue) * (chartHeight - 60);
                    const interestHeight = totalHeight - depositsHeight;
                    
                    return `
                        <div style="flex: 1; display: flex; flex-direction: column; align-items: center; height: 100%; position: relative;">
                            <!-- Total value label above bar -->
                            <div style="
                                position: absolute; 
                                top: ${chartHeight - totalHeight - 25}px; 
                                left: 50%; 
                                transform: translateX(-50%);
                                font-size: 9px; 
                                font-weight: 600; 
                                color: #333;
                                background: rgba(255,255,255,0.9);
                                padding: 2px 4px;
                                border-radius: 3px;
                                border: 1px solid #ddd;
                                white-space: nowrap;
                                z-index: 10;
                            ">
                                CHF ${Math.round(year.futureValue / 1000)}k
                            </div>
                            
                            <!-- Interest portion (top) -->
                            <div style="
                                width: 100%; 
                                height: ${interestHeight}px; 
                                background: linear-gradient(180deg, #4facfe, #00f2fe); 
                                border-radius: 2px 2px 0 0;
                                margin-bottom: 0;
                            " title="Zinserträge: CHF ${year.interestEarned.toLocaleString()}"></div>
                            
                            <!-- Deposits portion (bottom) -->
                            <div style="
                                width: 100%; 
                                height: ${depositsHeight}px; 
                                background: linear-gradient(180deg, #28a745, #20c997); 
                                border-radius: 0 0 2px 2px;
                                margin-bottom: 5px;
                            " title="Eingezahlt: CHF ${year.totalDeposits.toLocaleString()}"></div>
                            
                            <!-- Year label -->
                            <div style="font-size: 10px; color: #666; text-align: center;">
                                ${year.year}
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        </div>
        <div style="display: flex; justify-content: center; gap: 20px; margin-top: 10px; font-size: 12px;">
            <div style="display: flex; align-items: center; gap: 5px;">
                <div style="width: 12px; height: 12px; background: linear-gradient(135deg, #28a745, #20c997); border-radius: 2px;"></div>
                <span>Eingezahltes Kapital</span>
            </div>
            <div style="display: flex; align-items: center; gap: 5px;">
                <div style="width: 12px; height: 12px; background: linear-gradient(135deg, #4facfe, #00f2fe); border-radius: 2px;"></div>
                <span>Zinserträge</span>
            </div>
        </div>
    `;
}

function saveCalculationResult() {
    if (!appData.savings?.compoundCalculator?.lastCalculation) return;
    
    const calc = appData.savings.compoundCalculator.lastCalculation;
    const results = performCompoundCalculation(calc);
    
    const savedCalculation = {
        id: Date.now(),
        name: `Berechnung ${new Date().toLocaleDateString('de-CH')}`,
        params: calc,
        results: results,
        date: new Date().toISOString()
    };
    
    if (!appData.savings.compoundCalculator.savedCalculations) {
        appData.savings.compoundCalculator.savedCalculations = [];
    }
    
    appData.savings.compoundCalculator.savedCalculations.push(savedCalculation);
    
    saveData();
    renderCompoundCalculator();
    
    showNotification('✅ Berechnung gespeichert!', 'success');
}

function deleteSavedCalculation(id) {
    if (!confirm('🗑️ Gespeicherte Berechnung wirklich löschen?')) return;
    
    if (appData.savings?.compoundCalculator?.savedCalculations) {
        appData.savings.compoundCalculator.savedCalculations = 
            appData.savings.compoundCalculator.savedCalculations.filter(calc => calc.id !== id);
    }
    
    saveData();
    renderCompoundCalculator();
    showNotification('✅ Berechnung gelöscht!', 'success');
}

function renderCompoundCalculator() {
    const container = document.getElementById('compound-calculator-content');
    if (!container) return;
    
    // Ensure savings data is initialized
    if (!appData.savings) {
        initializeSavingsData();
    }
    if (!appData.savings.compoundCalculator) {
        appData.savings.compoundCalculator = {
            lastCalculation: null,
            savedCalculations: []
        };
    }
    
    const savedCalculations = appData.savings?.compoundCalculator?.savedCalculations || [];
    const lastCalc = appData.savings?.compoundCalculator?.lastCalculation;
    
    container.innerHTML = `
        <div class="settings-group">
            <div class="settings-title">
                🧮 Zinseszins-Rechner
                <span style="font-size: 14px; font-weight: normal; color: #666; margin-left: 10px;">
                    Planen Sie Ihre finanzielle Zukunft
                </span>
            </div>
            
            <!-- Calculator Interface -->
            <div style="background: linear-gradient(135deg, #4facfe, #00f2fe); color: white; padding: 25px; border-radius: 15px; margin-bottom: 20px;">
                <div style="font-size: 18px; font-weight: 600; margin-bottom: 15px; text-align: center;">
                    📈 Zinseszinsrechnung
                </div>
                
                <!-- Input Grid -->
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px;">
                    <div>
                        <label style="display: block; font-size: 12px; margin-bottom: 5px; opacity: 0.9;">Startkapital (CHF)</label>
                        <input type="number" id="calc-start-capital" value="${lastCalc?.startCapital || 0}" step="100" 
                               style="width: 100%; padding: 8px; border-radius: 6px; border: none; font-size: 14px;">
                    </div>
                    <div>
                        <label style="display: block; font-size: 12px; margin-bottom: 5px; opacity: 0.9;">Monatliche Sparrate (CHF)</label>
                        <input type="number" id="calc-monthly-savings" value="${lastCalc?.monthlySavings || 500}" step="10"
                               style="width: 100%; padding: 8px; border-radius: 6px; border: none; font-size: 14px;">
                    </div>
                    <div>
                        <label style="display: block; font-size: 12px; margin-bottom: 5px; opacity: 0.9;">Jährliche Rendite (%)</label>
                        <input type="number" id="calc-annual-return" value="${lastCalc?.annualReturn || 7}" step="0.1"
                               style="width: 100%; padding: 8px; border-radius: 6px; border: none; font-size: 14px;">
                    </div>
                    <div>
                        <label style="display: block; font-size: 12px; margin-bottom: 5px; opacity: 0.9;">Laufzeit (Jahre)</label>
                        <input type="number" id="calc-duration" value="${lastCalc?.duration || 20}" step="1" min="1" max="50"
                               style="width: 100%; padding: 8px; border-radius: 6px; border: none; font-size: 14px;">
                    </div>
                    <div>
                        <label style="display: block; font-size: 12px; margin-bottom: 5px; opacity: 0.9;">Spar-Rhythmus</label>
                        <select id="calc-frequency" style="width: 100%; padding: 8px; border-radius: 6px; border: none; font-size: 14px;">
                            <option value="monthly" ${lastCalc?.frequency === 'monthly' ? 'selected' : ''}>Monatlich</option>
                            <option value="yearly" ${lastCalc?.frequency === 'yearly' ? 'selected' : ''}>Jährlich</option>
                        </select>
                    </div>
                    <div>
                        <label style="display: block; font-size: 12px; margin-bottom: 5px; opacity: 0.9;">Inflation (%)</label>
                        <input type="number" id="calc-inflation" value="${lastCalc?.inflation || 2}" step="0.1"
                               style="width: 100%; padding: 8px; border-radius: 6px; border: none; font-size: 14px;">
                    </div>
                </div>
                
                <!-- Calculate Button -->
                <button onclick="calculateCompoundInterest()" 
                        style="width: 100%; background: white; color: #4facfe; border: none; padding: 15px; border-radius: 8px; font-size: 16px; font-weight: 700; cursor: pointer; transition: all 0.3s ease;"
                        onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 8px rgba(0,0,0,0.15)';"
                        onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='none';">
                    🧮 Berechnen
                </button>
            </div>
            
            <!-- Results Area -->
            <div id="calculation-results" style="display: none;">
                <!-- Results will be shown here -->
            </div>
            
            ${savedCalculations.length > 0 ? `
                <div style="margin-top: 20px;">
                    <h4 style="margin-bottom: 15px;">💾 Gespeicherte Berechnungen</h4>
                    <div style="max-height: 300px; overflow-y: auto;">
                        ${savedCalculations.slice(-10).reverse().map(calc => `
                            <div class="expense-item" style="margin-bottom: 10px;">
                                <div class="expense-header">
                                    <div class="expense-info">
                                        <div class="expense-name">
                                            📊 ${calc.name}
                                        </div>
                                        <div class="expense-category">
                                            ${calc.params.startCapital.toLocaleString()} CHF Start + 
                                            ${calc.params.monthlySavings} CHF/${calc.params.frequency === 'monthly' ? 'Monat' : 'Jahr'} • 
                                            ${calc.params.annualReturn}% Rendite • 
                                            ${calc.params.duration} Jahre
                                        </div>
                                    </div>
                                    <div style="display: flex; align-items: center; gap: 10px;">
                                        <div class="expense-amount" style="color: #28a745;">
                                            CHF ${calc.results.futureValue.toLocaleString('de-CH', {maximumFractionDigits: 0})}
                                            <div style="font-size: 12px; color: #666;">
                                                ${calc.results.effectiveReturn}% Gesamtrendite
                                            </div>
                                        </div>
                                        <div class="expense-actions">
                                            <button class="action-btn delete" onclick="deleteSavedCalculation(${calc.id})" title="Löschen">
                                                🗑️
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            ` : ''}
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 12px; margin-top: 20px;">
                <h4 style="margin-bottom: 15px;">💡 Tipps für optimales Sparen</h4>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; font-size: 13px;">
                    <div>
                        <strong>📅 Früh anfangen:</strong><br>
                        Zeit ist beim Zinseszins der wichtigste Faktor
                    </div>
                    <div>
                        <strong>🔄 Regelmäßig sparen:</strong><br>
                        Monatliche Sparraten nutzen den Durchschnittskosteneffekt
                    </div>
                    <div>
                        <strong>💰 Langfristig denken:</strong><br>
                        Mindestens 10-15 Jahre für optimale Ergebnisse
                    </div>
                    <div>
                        <strong>📈 Realistische Rendite:</strong><br>
                        5-8% sind für ETFs langfristig realistisch
                    </div>
                </div>
            </div>
        </div>
    `;
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
        alert('Bitte geben Sie einen gültigen Fondswert ein');
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
    
    showNotification(`✅ Fondswert erfasst!\nPerformance ${monthName}: ${performance.toFixed(2)}%`, 'success');
}

// Calculate yearly deposits for current profile (ONLY ACTUAL DEPOSITS, NO PLANNED EXPENSES)
function calculateYearlyPillar3aDeposits() {
    const currentYear = new Date().getFullYear();
    const profile = getCurrentProfileFilter();
    
    // Get filtered deposits (manual entries + entries from month closing)
    const deposits = filterByProfile(appData.savings?.pillar3a?.deposits || []);
    const depositsTotal = deposits
        .filter(d => d.year === currentYear)
        .reduce((sum, d) => sum + d.amount, 0);
    
    // Get filtered fund values (these contain the monthly deposits when fund value is recorded)
    const fundValues = filterByProfile(appData.savings?.pillar3a?.fundValues || []);
    const fundValuesTotal = fundValues
        .filter(v => new Date(v.date).getFullYear() === currentYear)
        .reduce((sum, v) => sum + v.deposit, 0);
    
    // NO automatic calculation from expenses - only count what was actually deposited
    
    console.log('📊 Säule 3a Berechnung (nur tatsächliche Einzahlungen):', {
        depositsTotal,
        fundValuesTotal,
        total: depositsTotal + fundValuesTotal
    });
    
    return depositsTotal + fundValuesTotal;
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
    
    showNotification('✅ Einzahlung aktualisiert!', 'success');
}

// Delete Pillar 3a deposit
function deletePillar3aDeposit(id) {
    if (!confirm('Einzahlung wirklich löschen?')) return;
    
    if (!appData.savings || !appData.savings.pillar3a || !appData.savings.pillar3a.deposits) return;
    
    appData.savings.pillar3a.deposits = appData.savings.pillar3a.deposits.filter(d => d.id !== id);
    
    // Update yearly total
    const yearlyDeposits = calculateYearlyPillar3aDeposits();
    appData.savings.pillar3a.yearlyDeposits = yearlyDeposits;
    
    saveData();
    renderPillar3aSection();
    updateSavingsRecommendations();
    
    showNotification('✅ Einzahlung gelöscht!', 'success');
}

// Edit fund value
function editFundValue(id) {
    const fundValue = appData.savings?.pillar3a?.fundValues?.find(v => v.id === id);
    if (!fundValue) return;
    
    const newValue = parseFloat(prompt(`Neuer Fondswert für ${fundValue.monthName}:`, fundValue.endValue));
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
    
    showNotification('✅ Fondswert aktualisiert!', 'success');
}

// Delete fund value
function deleteFundValue(id) {
    if (!confirm('Fondswert-Eintrag wirklich löschen?')) return;
    
    if (!appData.savings || !appData.savings.pillar3a || !appData.savings.pillar3a.fundValues) return;
    
    appData.savings.pillar3a.fundValues = appData.savings.pillar3a.fundValues.filter(v => v.id !== id);
    
    saveData();
    renderPillar3aSection();
    renderPerformanceChart();
    
    showNotification('✅ Fondswert gelöscht!', 'success');
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
    
    // Get active Säule 3a expenses
    const profile = getCurrentProfileFilter();
    const allExpenses = [...(appData.fixedExpenses || []), ...(appData.variableExpenses || [])];
    const pillar3aExpenses = allExpenses.filter(exp => {
        if (profile) {
            return exp.active && exp.category === 'Säule 3a' && exp.account === profile;
        } else {
            return exp.active && exp.category === 'Säule 3a';
        }
    });
    
    const monthlyExpensesTotal = pillar3aExpenses.reduce((sum, exp) => sum + exp.amount, 0);
    
    container.innerHTML = `
        <div class="settings-group">
            <div class="settings-title">
                🏛️ Säule 3a - Vorsorgefonds
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
            
            <!-- Removed automatic monthly deposits display - only show actual deposits -->
            
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
            
            <!-- Recent Deposits -->
            <div style="margin-bottom: 20px;">
                <h4 style="margin-bottom: 15px;">💵 Letzte Einzahlungen</h4>
                <div style="max-height: 200px; overflow-y: auto;">
                    ${renderPillar3aDeposits()}
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
                            ${deposit.fromExpense ? '🔄 ' : '💵 '}
                            ${deposit.description || 'Einzahlung'}
                        </div>
                        <div class="expense-category">
                            ${formattedDate}
                            ${deposit.fromExpense ? ' • Aus Ausgaben' : ''}
                        </div>
                    </div>
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <div class="expense-amount" style="color: #28a745;">
                            CHF ${deposit.amount.toLocaleString()}
                        </div>
                        ${!deposit.fromExpense ? `
                            <div class="expense-actions">
                                <button class="action-btn edit" onclick="editPillar3aDeposit(${deposit.id})" title="Bearbeiten">
                                    ✏️
                                </button>
                                <button class="action-btn delete" onclick="deletePillar3aDeposit(${deposit.id})" title="Löschen">
                                    🗑️
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
                            ✏️
                        </button>
                        <button class="action-btn delete" onclick="deleteFundValue(${entry.id})" title="Löschen">
                            🗑️
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
        alert('Bitte alle Felder ausfüllen');
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
    showNotification(`✅ Investment "${name}" hinzugefügt!`, 'success');
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
    
    showNotification(`✅ Investment "${newName}" aktualisiert!`, 'success');
}

function updateInvestmentValue(id) {
    const investment = appData.savings?.investments?.find(inv => inv.id === id);
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
    
    if (!appData.savings || !appData.savings.investments) return;
    
    appData.savings.investments = appData.savings.investments.filter(inv => inv.id !== id);
    saveData();
    renderInvestmentsSection();
    updateSavingsRecommendations();
    
    showNotification('✅ Investment gelöscht!', 'success');
}

function renderInvestmentsSection() {
    const container = document.getElementById('investments-content');
    if (!container) return;
    
    const allInvestments = appData.savings?.investments || [];
    const investments = filterByProfile(allInvestments);
    
    // Get active savings expenses that are not Säule 3a
    const profile = getCurrentProfileFilter();
    const allExpenses = [...(appData.fixedExpenses || []), ...(appData.variableExpenses || [])];
    const investmentExpenses = allExpenses.filter(exp => {
        const isInvestmentCategory = exp.category === 'Investitionen/ETFs' || 
                                     exp.category === 'Aktien/Trading' || 
                                     exp.category === 'Säule 3b' ||
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
                💎 Investment Portfolio
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
                    ${totalProfit >= 0 ? '📈' : '📉'} 
                    ${totalProfit >= 0 ? '+' : ''}CHF ${totalProfit.toFixed(2)} 
                    (${totalPerformance.toFixed(2)}%)
                </div>
            </div>
            
            <!-- Removed automatic monthly investments display - only show actual investments -->
            
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
                                        ${inv.fromExpense ? ' 🔄' : ''}
                                    </div>
                                    <div class="expense-category">
                                        Investiert: CHF ${inv.invested.toLocaleString()} | 
                                        Wert: CHF ${inv.currentValue.toLocaleString()}
                                        ${inv.fromExpense ? ' • Aus Ausgaben' : ''}
                                        ${inv.category ? ` • ${inv.category}` : ''}
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
                                                ✏️
                                            </button>
                                        ` : ''}
                                        <button class="action-btn edit" onclick="updateInvestmentValue(${inv.id})" title="Wert aktualisieren">
                                            📊
                                        </button>
                                        ${!inv.fromExpense ? `
                                            <button class="action-btn delete" onclick="deleteInvestment(${inv.id})" title="Löschen">
                                                🗑️
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
        'Säule 3b': '🏛️',
        'Notgroschen': '🚨',
        'Sparkonto': '💰',
        'Andere': '💰'
    };
    return icons[type] || '💰';
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
            title: `👤 Persönliche Ansicht`,
            text: `Sie sehen nur Ihre eigenen Spar- und Investment-Einträge. Wechseln Sie zu "Familie" für Gesamtübersicht.`
        });
    }
    
    // Säule 3a recommendations
    if (remaining3a > 0 && new Date().getMonth() >= 9) { // Oktober oder später
        recommendations.push({
            type: 'warning',
            title: '⏰ Säule 3a Jahresende',
            text: `Nur noch ${12 - new Date().getMonth()} Monate! Zahlen Sie CHF ${remaining3a.toLocaleString()} ein für CHF ${(remaining3a * TAX_SAVING_RATE).toFixed(0)} Steuerersparnis.`
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
            title: '💰 Aktive Spar-Ausgaben',
            text: `Sie haben ${savingsExpenses.length} Spar-Posten mit CHF ${totalSavingsExpenses.toLocaleString()} monatlich erfasst. Diese werden automatisch getrackt!`
        });
    }
    
    // Emergency fund check
    const emergencyGoal = appData.savings?.goals?.emergency || 30000;
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
    
    // Asset allocation (only for current profile's investments)
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
    const savingsRate = monthlyIncome > 0 ? ((appData.savings?.pillar3a?.monthlyAmount || 0) / monthlyIncome * 100) : 0;
    
    if (savingsRate < 10 && monthlyIncome > 0 && appData.currentProfile !== 'family') {
        recommendations.push({
            type: 'info',
            title: '📈 Sparquote erhöhen',
            text: `Ihre Sparquote ist ${savingsRate.toFixed(0)}%. Ziel: Mindestens 10-20% des Einkommens sparen.`
        });
    } else if (savingsRate >= 20 && appData.currentProfile !== 'family') {
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
    
    showNotification(`✅ Einzahlung von CHF ${amount} erfasst!`, 'success');
}

// ============= MAKE FUNCTIONS GLOBALLY AVAILABLE =============
// REMOVED: window.openCompoundCalculator
window.calculateCompoundInterest = calculateCompoundInterest;
window.saveCalculationResult = saveCalculationResult;
window.deleteSavedCalculation = deleteSavedCalculation;
window.renderCompoundCalculator = renderCompoundCalculator;
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
console.log('💰 Savings module loading...');
if (typeof appData !== 'undefined') {
    initializeSavingsData();
    console.log('✅ Savings module initialized with appData');
} else {
    console.log('⏳ Waiting for appData...');
    // Try again when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            initializeSavingsData();
            console.log('✅ Savings module initialized on DOM ready');
        });
    }
}

console.log('✅ Savings module fully loaded');
