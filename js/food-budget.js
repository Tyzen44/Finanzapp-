// ============= FOOD BUDGET MANAGEMENT ============= 
function getCurrentMonth() {
    return new Date().toISOString().slice(0, 7);
}

function addQuickPurchase() {
    const shopName = document.getElementById('quick-shop-name').value.trim();
    const amount = parseFloat(document.getElementById('quick-shop-amount').value);
    
    if (!shopName || !amount || amount <= 0) {
        alert('⚠️ Bitte Laden und gültigen Betrag eingeben');
        return;
    }

    const purchase = {
        id: Date.now(),
        shop: shopName,
        amount: amount,
        date: new Date().toISOString(),
        month: getCurrentMonth()
    };

    if (!appData.foodPurchases) {
        appData.foodPurchases = [];
    }
    
    appData.foodPurchases.push(purchase);
    updateCurrentMonthSpent();
    
    document.getElementById('quick-shop-name').value = '';
    document.getElementById('quick-shop-amount').value = '';
    
    saveData();
    renderFoodPurchases();
    updateFoodBudgetDisplay();
    
    showNotification(`✅ Einkauf bei ${shopName} für CHF ${amount.toFixed(2)} hinzugefügt!`, 'success');
}

function updateCurrentMonthSpent() {
    const currentMonth = getCurrentMonth();
    appData.currentMonthFoodSpent = (appData.foodPurchases || [])
        .filter(purchase => purchase.month === currentMonth)
        .reduce((total, purchase) => total + purchase.amount, 0);
}

function updateFoodBudgetDisplay() {
    updateCurrentMonthSpent();
    
    const budgetTotal = appData.monthlyFoodBudget || 800;
    const spent = appData.currentMonthFoodSpent || 0;
    const remaining = budgetTotal - spent;
    const percentage = (spent / budgetTotal) * 100;
    
    const foodBudgetTotal = document.getElementById('food-budget-total');
    const foodSpentTotal = document.getElementById('food-spent-total');
    const foodRemainingDisplay = document.getElementById('food-remaining-display');
    const progressBar = document.getElementById('food-progress-bar');
    const statusDisplay = document.getElementById('food-budget-status');
    
    if (foodBudgetTotal) foodBudgetTotal.textContent = budgetTotal.toLocaleString();
    if (foodSpentTotal) foodSpentTotal.textContent = spent.toFixed(2);
    if (foodRemainingDisplay) foodRemainingDisplay.textContent = `CHF ${remaining.toFixed(2)}`;
    
    if (progressBar) {
        progressBar.style.width = Math.min(percentage, 100) + '%';
    }
    
    if (foodRemainingDisplay && statusDisplay) {
        if (remaining <= 0) {
            foodRemainingDisplay.style.color = '#dc3545';
            statusDisplay.style.background = '#f8d7da';
            statusDisplay.style.color = '#721c24';
            statusDisplay.textContent = '🚨 Budget überschritten!';
        } else if (remaining <= budgetTotal * 0.2) {
            foodRemainingDisplay.style.color = '#ffc107';
            statusDisplay.style.background = '#fff3cd';
            statusDisplay.style.color = '#856404';
            statusDisplay.textContent = '⚠️ Budget wird knapp';
        } else if (remaining <= budgetTotal * 0.5) {
            foodRemainingDisplay.style.color = '#17a2b8';
            statusDisplay.style.background = '#d1ecf1';
            statusDisplay.style.color = '#0c5460';
            statusDisplay.textContent = '💙 Budget zur Hälfte verbraucht';
        } else {
            foodRemainingDisplay.style.color = '#28a745';
            statusDisplay.style.background = '#d4edda';
            statusDisplay.style.color = '#155724';
            statusDisplay.textContent = '✅ Budget im grünen Bereich';
        }
    }
}

function renderFoodPurchases() {
    const container = document.getElementById('food-purchases-list');
    if (!container) return;
    
    const currentMonth = getCurrentMonth();
    const purchases = (appData.foodPurchases || [])
        .filter(purchase => purchase.month === currentMonth)
        .sort((a, b) => new Date(b.date) - new Date(a.date));
    
    if (purchases.length === 0) {
        container.innerHTML = `
            <div class="text-center" style="padding: 40px 0; color: #666;">
                <p>🛒 Noch keine Einkäufe erfasst</p>
                <p style="font-size: 14px; margin-top: 10px;">Nutzen Sie den Schnell-Eintrag oben</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = purchases.map(purchase => {
        const date = new Date(purchase.date);
        const formattedDate = date.toLocaleDateString('de-CH', { 
            weekday: 'short', 
            day: '2-digit', 
            month: '2-digit' 
        });
        
        return `
            <div class="expense-item" id="purchase-${purchase.id}">
                <div class="expense-header">
                    <div class="expense-info">
                        <div class="expense-name">🛍️ ${purchase.shop}</div>
                        <div class="expense-category">${formattedDate}</div>
                    </div>
                    <div class="expense-amount">CHF ${purchase.amount.toFixed(2)}</div>
                    <div class="expense-actions">
                        <button class="action-btn edit" onclick="editFoodPurchase(${purchase.id})" title="Bearbeiten">
                            ✏️
                        </button>
                        <button class="action-btn delete" onclick="deleteFoodPurchase(${purchase.id})" title="Löschen">
                            🗑️
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function editFoodPurchase(id) {
    const purchase = (appData.foodPurchases || []).find(p => p.id === id);
    if (!purchase) return;
    
    const newShop = prompt('Laden/Geschäft:', purchase.shop);
    const newAmount = parseFloat(prompt('Betrag (CHF):', purchase.amount));
    
    if (newShop && newAmount > 0) {
        purchase.shop = newShop.trim();
        purchase.amount = newAmount;
        
        saveData();
        renderFoodPurchases();
        updateFoodBudgetDisplay();
        
        showNotification('✅ Einkauf bearbeitet!', 'success');
    }
}

function deleteFoodPurchase(id) {
    if (!confirm('🗑️ Einkauf wirklich löschen?')) return;
    
    appData.foodPurchases = (appData.foodPurchases || []).filter(p => p.id !== id);
    
    saveData();
    renderFoodPurchases();
    updateFoodBudgetDisplay();
    
    showNotification('✅ Einkauf gelöscht!', 'success');
}

function updateFoodBudget(value) {
    appData.monthlyFoodBudget = parseFloat(value) || 800;
    saveData();
    updateFoodBudgetDisplay();
}

function resetFoodBudget() {
    if (!confirm('🔄 Alle Einkäufe des aktuellen Monats löschen?')) return;
    
    const currentMonth = getCurrentMonth();
    appData.foodPurchases = (appData.foodPurchases || []).filter(p => p.month !== currentMonth);
    appData.currentMonthFoodSpent = 0;
    
    saveData();
    renderFoodPurchases();
    updateFoodBudgetDisplay();
    
    showNotification('✅ Lebensmittel-Budget zurückgesetzt!', 'success');
}

function newMonthReset() {
    if (!confirm('📅 Neuen Monat starten? (Aktueller Monat wird archiviert)')) return;
    
    appData.currentMonthFoodSpent = 0;
    
    saveData();
    renderFoodPurchases();
    updateFoodBudgetDisplay();
    
    showNotification('✅ Neuer Monat gestartet!', 'success');
}
