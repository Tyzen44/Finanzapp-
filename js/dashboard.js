// ============= PROFESSIONAL DASHBOARD UPDATE ============= 

function updateDashboard() {
    const dashboardGrid = document.querySelector('.dashboard-grid');
    if (!dashboardGrid) return;

    // Clear existing content
    dashboardGrid.innerHTML = '';

    if (appData.currentProfile === 'family') {
        // Family profile shows ONLY shared account
        const sharedBalance = getRealTimeBalance('shared');
        
        const accountCard = `
            <div class="account-card" style="grid-column: span 3;">
                <div class="account-header">
                    <div class="account-title">
                        Gemeinschaftskonto
                    </div>
                    <button onclick="editAccountBalance('shared')" class="action-btn edit">✏️</button>
                </div>
                <div class="account-balance-hero">
                    CHF ${sharedBalance.toLocaleString()}
                </div>
                <div class="account-details">
                    Familien-Kontostand
                </div>
            </div>
        `;
        dashboardGrid.insertAdjacentHTML('beforeend', accountCard);

        // Hide family balance summary for family profile (redundant)
        const familyBalanceSummary = document.getElementById('family-balance-summary');
        if (familyBalanceSummary) {
            familyBalanceSummary.style.display = 'none';
        }
    } else {
        // Individual profile shows ONLY their own account
        const realTimeBalance = getRealTimeBalance(appData.currentProfile);
        const currentAccount = appData.accounts[appData.currentProfile];
        
        const accountCard = `
            <div class="account-card" style="grid-column: span 3;">
                <div class="account-header">
                    <div class="account-title">
                        ${currentAccount.name}
                    </div>
                    <button onclick="editAccountBalance('${appData.currentProfile}')" class="action-btn edit">✏️</button>
                </div>
                <div class="account-balance-hero">
                    CHF ${realTimeBalance.toLocaleString()}
                </div>
                <div class="account-details">
                    Persönlicher Kontostand (inkl. Verfügbar)
                </div>
            </div>
        `;
        dashboardGrid.insertAdjacentHTML('beforeend', accountCard);

        // Hide family balance summary for individual profiles
        const familyBalanceSummary = document.getElementById('family-balance-summary');
        if (familyBalanceSummary) {
            familyBalanceSummary.style.display = 'none';
        }
    }

    // Update professional stats
    updateDashboardStats();
    
    // Update donut chart
    renderExpenseDonutChart();
}

// UPDATED: Dashboard statistics with strict profile filtering
function updateDashboardStats() {
    // Calculate available
    let income = 0;
    let totalExpenses = 0;
    let totalDebts = 0;
    let actualSavings = 0;
    
    if (appData.currentProfile === 'sven') {
        income = getTotalIncome('sven');
        totalExpenses = appData.fixedExpenses.filter(exp => exp.active && exp.account === 'sven').reduce((sum, exp) => sum + exp.amount, 0) +
                       appData.variableExpenses.filter(exp => exp.active && exp.account === 'sven').reduce((sum, exp) => sum + exp.amount, 0);
        totalDebts = appData.debts.filter(debt => debt.owner === 'sven').reduce((sum, debt) => sum + debt.amount, 0);
        
        actualSavings = appData.fixedExpenses.filter(exp => exp.active && exp.account === 'sven' && SAVINGS_CATEGORIES.includes(exp.category))
                           .reduce((sum, exp) => sum + exp.amount, 0) +
                       appData.variableExpenses.filter(exp => exp.active && exp.account === 'sven' && SAVINGS_CATEGORIES.includes(exp.category))
                           .reduce((sum, exp) => sum + exp.amount, 0);
                           
    } else if (appData.currentProfile === 'franzi') {
        income = getTotalIncome('franzi');
        totalExpenses = appData.fixedExpenses.filter(exp => exp.active && exp.account === 'franzi').reduce((sum, exp) => sum + exp.amount, 0) +
                       appData.variableExpenses.filter(exp => exp.active && exp.account === 'franzi').reduce((sum, exp) => sum + exp.amount, 0);
        totalDebts = appData.debts.filter(debt => debt.owner === 'franzi').reduce((sum, debt) => sum + debt.amount, 0);
        
        actualSavings = appData.fixedExpenses.filter(exp => exp.active && exp.account === 'franzi' && SAVINGS_CATEGORIES.includes(exp.category))
                           .reduce((sum, exp) => sum + exp.amount, 0) +
                       appData.variableExpenses.filter(exp => exp.active && exp.account === 'franzi' && SAVINGS_CATEGORIES.includes(exp.category))
                           .reduce((sum, exp) => sum + exp.amount, 0);
                           
    } else {
        // Family profile - ONLY shared account
        income = calculateTransferIncome();
        totalExpenses = appData.fixedExpenses.filter(exp => exp.active && exp.account === 'shared').reduce((sum, exp) => sum + exp.amount, 0) +
                       appData.variableExpenses.filter(exp => exp.active && exp.account === 'shared').reduce((sum, exp) => sum + exp.amount, 0);
        totalDebts = appData.debts.filter(debt => debt.owner === 'shared').reduce((sum, debt) => sum + debt.amount, 0);
        
        actualSavings = appData.fixedExpenses.filter(exp => exp.active && exp.account === 'shared' && SAVINGS_CATEGORIES.includes(exp.category))
                           .reduce((sum, exp) => sum + exp.amount, 0) +
                       appData.variableExpenses.filter(exp => exp.active && exp.account === 'shared' && SAVINGS_CATEGORIES.includes(exp.category))
                           .reduce((sum, exp) => sum + exp.amount, 0);
    }
    
    const available = income - totalExpenses;
    const savingsRate = income > 0 ? Math.max(0, Math.round((actualSavings / income) * 100)) : 0;
    
    // Update stat displays
    const availableElement = document.getElementById('dashboard-available');
    const debtsElement = document.getElementById('dashboard-debts');
    const savingsRateElement = document.getElementById('dashboard-savings-rate');
    
    if (availableElement) {
        availableElement.textContent = `CHF ${available.toLocaleString()}`;
        if (available < 0) {
            availableElement.classList.add('negative');
        } else {
            availableElement.classList.remove('negative');
        }
    }
    
    if (debtsElement) {
        debtsElement.textContent = `CHF ${totalDebts.toLocaleString()}`;
    }
    
    if (savingsRateElement) {
        if (actualSavings > 0) {
            savingsRateElement.innerHTML = `
                <div style="font-size: 20px; line-height: 1.2;">
                    <strong>${savingsRate}%</strong>
                    <div style="font-size: 12px; opacity: 0.9; margin-top: 2px;">
                        CHF ${actualSavings.toLocaleString()}/Monat
                    </div>
                </div>
            `;
        } else {
            savingsRateElement.innerHTML = `
                <div style="font-size: 20px; line-height: 1.2;">
                    <strong>0%</strong>
                    <div style="font-size: 12px; opacity: 0.9; margin-top: 2px;">
                        Keine Sparausgaben
                    </div>
                </div>
            `;
        }
        
        if (savingsRate >= 20) {
            savingsRateElement.style.color = 'var(--success)';
        } else if (savingsRate >= 10) {
            savingsRateElement.style.color = 'var(--gray-900)';
        } else if (savingsRate > 0) {
            savingsRateElement.style.color = 'var(--warning)';
        } else {
            savingsRateElement.style.color = 'var(--error)';
        }
    }
}

// ============= DONUT CHART FOR EXPENSE CATEGORIES =============
function renderExpenseDonutChart() {
    const container = document.getElementById('expense-donut-chart');
    if (!container) return;

    // Get expenses with strict profile filtering
    const categoryTotals = {};
    let expenses = [...appData.fixedExpenses, ...appData.variableExpenses];
    
    // STRICT PROFILE FILTERING
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
        container.innerHTML = `
            <div style="text-align: center; color: #666; height: 100%; display: flex; align-items: center; justify-content: center; flex-direction: column;">
                <p style="font-size: 18px; margin-bottom: 10px;">📊 Noch keine Ausgaben</p>
                <p style="font-size: 14px;">Erfassen Sie Ausgaben um die Kategorienverteilung zu sehen</p>
            </div>
        `;
        return;
    }

    // Color-blind friendly colors (blue, yellow, red, green, purple, orange, gray, pink)
    const colors = [
        '#2563eb', // Blue
        '#f59e0b', // Yellow
        '#e74c3c', // Red
        '#10b981', // Green
        '#8b5cf6', // Purple
        '#f97316', // Orange
        '#6b7280', // Gray
        '#ec4899', // Pink
        '#14b8a6', // Teal
        '#f472b6'  // Light Pink
    ];

    // Sort categories by amount (largest first)
    const sortedCategories = Object.entries(categoryTotals)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10); // Limit to top 10 categories

    const total = sortedCategories.reduce((sum, [_, amount]) => sum + amount, 0);
    
    // Create SVG donut chart
    const size = 280;
    const strokeWidth = 40;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    
    let currentAngle = 0;
    const centerX = size / 2;
    const centerY = size / 2;

    // Build SVG paths for donut segments
    let svgPaths = '';
    let legendHTML = '';
    
    sortedCategories.forEach(([category, amount], index) => {
        const percentage = (amount / total) * 100;
        const angle = (amount / total) * 360;
        const color = colors[index % colors.length];
        
        // Calculate path for donut segment
        const startAngle = currentAngle;
        const endAngle = currentAngle + angle;
        
        const startAngleRad = (startAngle - 90) * Math.PI / 180;
        const endAngleRad = (endAngle - 90) * Math.PI / 180;
        
        const x1 = centerX + radius * Math.cos(startAngleRad);
        const y1 = centerY + radius * Math.sin(startAngleRad);
        const x2 = centerX + radius * Math.cos(endAngleRad);
        const y2 = centerY + radius * Math.sin(endAngleRad);
        
        const largeArcFlag = angle > 180 ? 1 : 0;
        
        const pathData = [
            `M ${centerX} ${centerY}`,
            `L ${x1} ${y1}`,
            `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
            'Z'
        ].join(' ');
        
        svgPaths += `
            <path d="${pathData}" 
                  fill="${color}" 
                  stroke="white" 
                  stroke-width="2"
                  style="cursor: pointer; transition: opacity 0.2s;"
                  onmouseover="this.style.opacity='0.8'"
                  onmouseout="this.style.opacity='1'"
                  title="${category}: CHF ${amount.toLocaleString()} (${percentage.toFixed(1)}%)">
            </path>
        `;
        
        legendHTML += `
            <div style="display: flex; align-items: center; margin-bottom: 8px; font-size: 13px;">
                <div style="width: 16px; height: 16px; background: ${color}; border-radius: 3px; margin-right: 10px; flex-shrink: 0;"></div>
                <div style="flex: 1; min-width: 0;">
                    <div style="font-weight: 500; color: #333; truncate">${category}</div>
                    <div style="color: #666; font-size: 12px;">CHF ${amount.toLocaleString()} (${percentage.toFixed(1)}%)</div>
                </div>
            </div>
        `;
        
        currentAngle += angle;
    });

    // Profile indicator
    const profileName = appData.currentProfile === 'sven' ? 'Sven' : 
                       appData.currentProfile === 'franzi' ? 'Franzi' : 'Familie';

    container.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: center; height: 100%; gap: 30px;">
            <!-- Donut Chart -->
            <div style="position: relative; flex-shrink: 0;">
                <svg width="${size}" height="${size}" style="transform: rotate(-90deg);">
                    ${svgPaths}
                </svg>
                <!-- Center Text -->
                <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); text-align: center; pointer-events: none;">
                    <div style="font-size: 24px; font-weight: 700; color: #333; margin-bottom: 4px;">
                        CHF ${total.toLocaleString()}
                    </div>
                    <div style="font-size: 12px; color: #666; font-weight: 500;">
                        Monatliche Ausgaben
                    </div>
                    <div style="font-size: 11px; color: #999; margin-top: 2px;">
                        ${profileName}
                    </div>
                </div>
            </div>
            
            <!-- Legend -->
            <div style="flex: 1; max-width: 200px; max-height: 250px; overflow-y: auto;">
                <h4 style="margin: 0 0 15px 0; font-size: 14px; font-weight: 600; color: #333;">
                    Kategorien (${sortedCategories.length})
                </h4>
                <div style="font-size: 13px;">
                    ${legendHTML}
                </div>
                ${sortedCategories.length === 10 ? `
                    <div style="font-size: 11px; color: #999; margin-top: 10px; font-style: italic;">
                        Nur die Top 10 Kategorien werden angezeigt
                    </div>
                ` : ''}
            </div>
        </div>
    `;
}

// Helper function to get total income including additional income
function getTotalIncome(profile) {
    let baseIncome = 0;
    if (profile === 'sven') {
        baseIncome = appData.profiles.sven.income || 0;
    } else if (profile === 'franzi') {
        baseIncome = appData.profiles.franzi.income || 0;
    }
    
    const currentMonth = new Date().toLocaleDateString('de-CH', { year: 'numeric', month: 'long' });
    const additionalIncome = (appData.additionalIncome || [])
        .filter(income => income.account === profile && income.month === currentMonth)
        .reduce((sum, income) => sum + income.amount, 0);
    
    return baseIncome + additionalIncome;
}

// Get real-time balance function  
function getRealTimeBalance(profile) {
    let baseBalance = 0;
    let available = 0;
    
    if (profile === 'sven') {
        baseBalance = appData.accounts.sven.balance || 0;
        
        const income = getTotalIncome('sven');
        const fixedExpenses = (appData.fixedExpenses || [])
            .filter(exp => exp.active && exp.account === 'sven')
            .reduce((sum, exp) => sum + exp.amount, 0);
        const variableExpenses = (appData.variableExpenses || [])
            .filter(exp => exp.active && exp.account === 'sven')
            .reduce((sum, exp) => sum + exp.amount, 0);
        
        available = income - fixedExpenses - variableExpenses;
        
    } else if (profile === 'franzi') {
        baseBalance = appData.accounts.franzi.balance || 0;
        
        const income = getTotalIncome('franzi');
        const fixedExpenses = (appData.fixedExpenses || [])
            .filter(exp => exp.active && exp.account === 'franzi')
            .reduce((sum, exp) => sum + exp.amount, 0);
        const variableExpenses = (appData.variableExpenses || [])
            .filter(exp => exp.active && exp.account === 'franzi')
            .reduce((sum, exp) => sum + exp.amount, 0);
        
        available = income - fixedExpenses - variableExpenses;
        
    } else if (profile === 'shared') {
        baseBalance = appData.accounts.shared.balance || 0;
        available = 0; // No additional available for shared account
    }
    
    return baseBalance + available;
}

// ============= CALCULATIONS WITH STRICT PROFILE FILTERING ============= 
function calculateAll() {
    let totalFixed = 0;
    let totalVariable = 0;
    let totalDebts = 0;
    let income = 0;
    let balance = 0;
    
    const transfers = calculateTransfersByProfile();
    
    // STRICT PROFILE FILTERING
    if (appData.currentProfile === 'sven') {
        totalFixed = (appData.fixedExpenses || [])
            .filter(exp => exp.active && exp.account === 'sven')
            .reduce((sum, exp) => sum + (exp.amount || 0), 0);
        
        totalVariable = (appData.variableExpenses || [])
            .filter(exp => exp.active && exp.account === 'sven')
            .reduce((sum, exp) => sum + (exp.amount || 0), 0);
        
        totalDebts = (appData.debts || [])
            .filter(debt => debt.owner === 'sven')
            .reduce((sum, debt) => sum + (debt.amount || 0), 0);
        
        income = getTotalIncome('sven');
        balance = getRealTimeBalance('sven');
        
    } else if (appData.currentProfile === 'franzi') {
        totalFixed = (appData.fixedExpenses || [])
            .filter(exp => exp.active && exp.account === 'franzi')
            .reduce((sum, exp) => sum + (exp.amount || 0), 0);
        
        totalVariable = (appData.variableExpenses || [])
            .filter(exp => exp.active && exp.account === 'franzi')
            .reduce((sum, exp) => sum + (exp.amount || 0), 0);
        
        totalDebts = (appData.debts || [])
            .filter(debt => debt.owner === 'franzi')
            .reduce((sum, debt) => sum + (debt.amount || 0), 0);
        
        income = getTotalIncome('franzi');
        balance = getRealTimeBalance('franzi');
        
    } else {
        // Family profile - ONLY shared
        totalFixed = (appData.fixedExpenses || [])
            .filter(exp => exp.active && exp.account === 'shared')
            .reduce((sum, exp) => sum + (exp.amount || 0), 0);
        
        totalVariable = (appData.variableExpenses || [])
            .filter(exp => exp.active && exp.account === 'shared')
            .reduce((sum, exp) => sum + (exp.amount || 0), 0);
        
        totalDebts = (appData.debts || [])
            .filter(debt => debt.owner === 'shared')
            .reduce((sum, debt) => sum + (debt.amount || 0), 0);
        
        income = calculateTransferIncome();
        balance = getRealTimeBalance('shared');
    }
    
    const totalExpenses = totalFixed + totalVariable;
    const available = income - totalExpenses;

    // Update displays
    const balanceDisplay = document.getElementById('balance-display');
    const wealthDisplay = document.getElementById('wealth-display');
    const incomeDisplay = document.getElementById('income-display');
    const totalExpensesDisplay = document.getElementById('total-expenses-display');
    const availableDisplay = document.getElementById('available-display');
    const fixedTotal = document.getElementById('fixed-total');
    const variableTotal = document.getElementById('variable-total');
    
    if (balanceDisplay) balanceDisplay.textContent = `CHF ${balance.toLocaleString()}`;
    if (wealthDisplay) wealthDisplay.textContent = `CHF ${balance.toLocaleString()}`;
    if (incomeDisplay) incomeDisplay.textContent = income.toLocaleString();
    if (totalExpensesDisplay) totalExpensesDisplay.textContent = totalExpenses.toLocaleString();
    if (availableDisplay) availableDisplay.textContent = available.toLocaleString();
    if (fixedTotal) fixedTotal.textContent = `CHF ${totalFixed.toLocaleString()}`;
    if (variableTotal) variableTotal.textContent = `CHF ${totalVariable.toLocaleString()}`;
    
    const debtsDisplay = document.getElementById('debts-total');
    if (debtsDisplay) {
        debtsDisplay.textContent = `CHF ${totalDebts.toLocaleString()}`;
    }

    const transfersDisplay = document.getElementById('transfers-display');
    if (transfersDisplay) {
        if (appData.currentProfile === 'sven') {
            transfersDisplay.textContent = transfers.fromSven.toLocaleString();
        } else if (appData.currentProfile === 'franzi') {
            transfersDisplay.textContent = transfers.fromFranzi.toLocaleString();
        } else {
            transfersDisplay.textContent = transfers.total.toLocaleString();
        }
    }

    const balanceHero = document.querySelector('.balance-hero');
    if (balanceHero) {
        if (balance < 1000) {
            balanceHero.style.background = 'linear-gradient(135deg, #e74c3c, #c0392b)';
        } else if (balance < 5000) {
            balanceHero.style.background = 'linear-gradient(135deg, #f39c12, #e67e22)';
        } else {
            balanceHero.style.background = 'linear-gradient(135deg, #27ae60, #229954)';
        }
    }

    const overviewLabel = document.getElementById('overview-account-label');
    if (overviewLabel) {
        if (appData.currentProfile === 'sven') {
            overviewLabel.textContent = 'Sven Privat';
        } else if (appData.currentProfile === 'franzi') {
            overviewLabel.textContent = 'Franzi Privat';
        } else {
            overviewLabel.textContent = 'Gemeinschaftskonto';
        }
    }

    const trendElement = document.getElementById('balance-trend');
    const availableStat = document.getElementById('available-stat');
    
    if (trendElement) {
        if (available >= 0) {
            trendElement.textContent = `📈 +CHF ${available.toLocaleString()} monatlich`;
            trendElement.className = 'balance-trend text-success';
            if (availableStat) {
                availableStat.style.background = 'linear-gradient(135deg, #d4edda, #c3e6cb)';
            }
        } else {
            trendElement.textContent = `📉 CHF ${available.toLocaleString()} monatlich`;
            trendElement.className = 'balance-trend text-danger';
            if (availableStat) {
                availableStat.style.background = 'linear-gradient(135deg, #f8d7da, #f5c6cb)';
            }
        }
    }

    updateDashboardStats();
    updateRecommendations();
    updateCategoriesOverview();
    updateDebtCategories();
    
    // Update donut chart when calculations change
    renderExpenseDonutChart();
}

function getCurrentBalance() {
    return getRealTimeBalance(appData.currentProfile);
}

// ============= RECOMMENDATIONS WITH STRICT PROFILE FILTERING ============= 
function updateRecommendations() {
    const container = document.getElementById('recommendations-container');
    if (!container) return;
    
    const recommendations = [];
    
    const balance = getCurrentBalance();
    let totalFixed = 0;
    let totalVariable = 0;
    let totalDebts = 0;
    let income = 0;
    
    const transfers = calculateTransfers();
    
    // STRICT PROFILE FILTERING
    if (appData.currentProfile === 'sven') {
        totalFixed = appData.fixedExpenses.filter(exp => exp.active && exp.account === 'sven').reduce((sum, exp) => sum + exp.amount, 0);
        totalVariable = appData.variableExpenses.filter(exp => exp.active && exp.account === 'sven').reduce((sum, exp) => sum + exp.amount, 0);
        totalDebts = appData.debts.filter(debt => debt.owner === 'sven').reduce((sum, debt) => sum + debt.amount, 0);
        income = getTotalIncome('sven');
    } else if (appData.currentProfile === 'franzi') {
        totalFixed = appData.fixedExpenses.filter(exp => exp.active && exp.account === 'franzi').reduce((sum, exp) => sum + exp.amount, 0);
        totalVariable = appData.variableExpenses.filter(exp => exp.active && exp.account === 'franzi').reduce((sum, exp) => sum + exp.amount, 0);
        totalDebts = appData.debts.filter(debt => debt.owner === 'franzi').reduce((sum, debt) => sum + debt.amount, 0);
        income = getTotalIncome('franzi');
    } else {
        totalFixed = appData.fixedExpenses.filter(exp => exp.active && exp.account === 'shared').reduce((sum, exp) => sum + exp.amount, 0);
        totalVariable = appData.variableExpenses.filter(exp => exp.active && exp.account === 'shared').reduce((sum, exp) => sum + exp.amount, 0);
        totalDebts = appData.debts.filter(debt => debt.owner === 'shared').reduce((sum, debt) => sum + debt.amount, 0);
        income = calculateTransferIncome();
    }
    
    const totalExpenses = totalFixed + totalVariable;
    const available = income - totalExpenses;
    
    const today = new Date();
    let overdueDebts = appData.debts.filter(debt => {
        if (!debt.dueDate) return false;
        const isOverdue = new Date(debt.dueDate) < today;
        // Strict profile filtering for overdue debts
        if (appData.currentProfile === 'sven') return isOverdue && debt.owner === 'sven';
        if (appData.currentProfile === 'franzi') return isOverdue && debt.owner === 'franzi';
        if (appData.currentProfile === 'family') return isOverdue && debt.owner === 'shared';
        return false;
    });
    
    if (overdueDebts.length > 0) {
        recommendations.push({
            type: 'danger',
            title: '⚠️ Überfällige Schulden',
            text: `${overdueDebts.length} Rechnung(en) im Wert von CHF ${overdueDebts.reduce((sum, d) => sum + d.amount, 0).toLocaleString()}.- sind überfällig!`
        });
    }
    
    if (balance < 1000) {
        recommendations.push({
            type: 'danger',
            title: '🚨 Kritischer Kontostand',
            text: `Der Kontostand von CHF ${balance.toLocaleString()}.- ist sehr niedrig. Notreserve empfohlen!`
        });
    } else if (balance < 5000 && appData.currentProfile !== 'family') {
        recommendations.push({
            type: 'warning',
            title: '⚠️ Kontostand aufbauen',
            text: `Mit CHF ${balance.toLocaleString()}.- haben Sie eine Basis-Reserve. Ziel: CHF 5'000.- für Sicherheit.`
        });
    }
    
    if (available < 0) {
        recommendations.push({
            type: 'danger',
            title: '🚨 Budget-Überschreitung',
            text: `Sie überziehen um CHF ${Math.abs(available).toLocaleString()}.-. Reduzieren Sie dringend Ihre Ausgaben.`
        });
    } else if (available < 500 && appData.currentProfile !== 'family') {
        recommendations.push({
            type: 'warning',
            title: '⚠️ Knappes Budget',
            text: `Nur CHF ${available.toLocaleString()}.- verfügbar. Vorsicht bei zusätzlichen Ausgaben!`
        });
    } else if (balance >= 5000 && available >= 1000) {
        recommendations.push({
            type: 'success',
            title: '✅ Finanzen im grünen Bereich',
            text: `Solider Kontostand und CHF ${available.toLocaleString()}.- verfügbar. Perfekt für Investitionen!`
        });
    }

    if (totalDebts > income * 2 && income > 0) {
        recommendations.push({
            type: 'warning',
            title: '📋 Hohe Schuldenlast',
            text: `Ihre Schulden betragen ${(totalDebts / income).toFixed(1)} Monatseinkommen. Priorisieren Sie den Schuldenabbau.`
        });
    }

    if (appData.currentProfile === 'family' && income === 0) {
        recommendations.push({
            type: 'warning',
            title: '💸 Keine Überträge als Ausgaben erfasst',
            text: 'Gemeinschaftskonto hat keine aktiven Übertrag-Ausgaben. Erfassen Sie Überträge als "Überträge" Kategorie in den privaten Profilen.'
        });
    }

    if (appData.currentProfile !== 'family' && calculateTransfers()[appData.currentProfile === 'sven' ? 'fromSven' : 'fromFranzi'] === 0) {
        recommendations.push({
            type: 'info',
            title: '💡 Überträge erstellen',
            text: 'Sie können Geld von Ihrem privaten Konto zum Gemeinschaftskonto übertragen.'
        });
    }
    
    if (recommendations.length === 0) {
        recommendations.push({
            type: 'success',
            title: '🎉 Alles im grünen Bereich',
            text: 'Ihre Finanzen sind gut organisiert. Weiter so!'
        });
    }
    
    container.innerHTML = recommendations.map(rec => `
        <div class="recommendation-card ${rec.type}">
            <div class="recommendation-title">${rec.title}</div>
            <div class="recommendation-text">${rec.text}</div>
        </div>
    `).join('');
}

// ============= CATEGORIES OVERVIEW WITH STRICT PROFILE FILTERING ============= 
function updateCategoriesOverview() {
    const container = document.getElementById('categories-overview');
    if (!container) return;
    
    const categoryTotals = {};
    
    let expenses = [...appData.fixedExpenses, ...appData.variableExpenses];
    
    // STRICT PROFILE FILTERING
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
    
    if (appData.currentProfile === 'sven') {
        income = getTotalIncome('sven');
    } else if (appData.currentProfile === 'franzi') {
        income = getTotalIncome('franzi');
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
                        <div class="expense-category">${percentage.toFixed(1)}% ${appData.currentProfile === 'family' ? 'der erfassten Überträge' : 'des Einkommens'}</div>
                    </div>
                    <div class="expense-amount">CHF ${amount.toLocaleString()}</div>
                </div>
            </div>
        `;
    }).join('');
}

// ============= DEBT CATEGORIES WITH STRICT PROFILE FILTERING ============= 
function updateDebtCategories() {
    const container = document.getElementById('debt-categories');
    if (!container) return;
    
    const debtsByType = {};
    
    let filteredDebts = appData.debts;
    
    // STRICT PROFILE FILTERING
    if (appData.currentProfile === 'sven') {
        filteredDebts = appData.debts.filter(debt => debt.owner === 'sven');
    } else if (appData.currentProfile === 'franzi') {
        filteredDebts = appData.debts.filter(debt => debt.owner === 'franzi');
    } else {
        filteredDebts = appData.debts.filter(debt => debt.owner === 'shared');
    }
    
    filteredDebts.forEach(debt => {
        if (!debtsByType[debt.type]) {
            debtsByType[debt.type] = 0;
        }
        debtsByType[debt.type] += debt.amount;
    });
    
    if (Object.keys(debtsByType).length === 0) {
        container.innerHTML = '<div class="text-center" style="padding: 20px; color: #666;">Keine Schulden vorhanden</div>';
        return;
    }
    
    container.innerHTML = Object.entries(debtsByType)
        .sort((a, b) => b[1] - a[1])
        .map(([type, amount]) => `
            <div class="expense-item" style="margin-bottom: 10px;">
                <div class="expense-header">
                    <div class="expense-info">
                        <div class="expense-name">${type}</div>
                    </div>
                    <div class="expense-amount" style="color: #e74c3c;">CHF ${amount.toLocaleString()}</div>
                </div>
            </div>
        `).join('');
}
