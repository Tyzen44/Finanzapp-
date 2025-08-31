// ============= TRANSFER SYSTEM WITH STRICT PROFILE FILTERING ============= 
async function createTransfer(fromProfile, amount, purpose, updateBalance = true) {
    const transfer = {
        id: Date.now(),
        from: fromProfile,
        to: 'shared',
        amount: amount,
        purpose: purpose || 'Übertrag',
        date: new Date().toISOString(),
        month: new Date().toLocaleDateString('de-CH', { year: 'numeric', month: 'long' })
    };
    
    appData.transfers.push(transfer);
    
    if (updateBalance) {
        if (fromProfile === 'sven') {
            appData.accounts.sven.balance -= amount;
            appData.accounts.shared.balance += amount;
        } else if (fromProfile === 'franzi') {
            appData.accounts.franzi.balance -= amount;
            appData.accounts.shared.balance += amount;
        }
    }
    
    await saveData();
    calculateAll();
    updateDashboard();
    updateTransferHistory();
    updateTransferTab();
    
    if (updateBalance) {
        showNotification(`✅ Übertrag von CHF ${amount.toFixed(2)} erfolgreich erstellt!`, 'success');
    }
}

async function addQuickTransfer() {
    if (appData.currentProfile === 'family') {
        alert('⚠️ Bitte wechseln Sie zu einem privaten Profil (Sven oder Franzi) um Überträge zu erstellen.');
        return;
    }

    const amount = parseFloat(prompt('Betrag für Übertrag zum Gemeinschaftskonto (CHF):'));
    const purpose = prompt('Zweck des Übertrags (optional):') || 'Übertrag';
    
    if (amount && amount > 0) {
        if (amount > getCurrentBalance()) {
            alert('⚠️ Nicht genügend Guthaben auf dem Konto!');
            return;
        }
        await createTransfer(appData.currentProfile, amount, purpose, true);
    }
}

function calculateTransfers() {
    const actualTransfers = appData.transfers || [];
    const fromSven = actualTransfers.filter(t => t.from === 'sven').reduce((sum, t) => sum + t.amount, 0);
    const fromFranzi = actualTransfers.filter(t => t.from === 'franzi').reduce((sum, t) => sum + t.amount, 0);
    const total = fromSven + fromFranzi;
    return { fromSven, fromFranzi, total };
}

// ============= FIXED TRANSFER CALCULATIONS ============= 
function calculateTransferIncome() {
    // Only count transfers that are actually recorded as ACTIVE expenses with category "Überträge"
    const allExpenses = [...(appData.fixedExpenses || []), ...(appData.variableExpenses || [])];
    const transferExpenses = allExpenses.filter(exp => 
        exp && 
        exp.active === true && 
        exp.category === 'Überträge' && 
        (exp.account === 'sven' || exp.account === 'franzi') &&
        exp.amount > 0
    );
    
    const total = transferExpenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
    console.log('💰 Transfer Income berechnet:', total, 'von', transferExpenses.length, 'aktiven Überträgen');
    return total;
}

function calculateTransfersByProfile() {
    const allExpenses = [...(appData.fixedExpenses || []), ...(appData.variableExpenses || [])];
    
    const fromSven = allExpenses.filter(exp => 
        exp && 
        exp.active === true && 
        exp.category === 'Überträge' && 
        exp.account === 'sven' &&
        exp.amount > 0
    ).reduce((sum, exp) => sum + (exp.amount || 0), 0);
    
    const fromFranzi = allExpenses.filter(exp => 
        exp && 
        exp.active === true && 
        exp.category === 'Überträge' && 
        exp.account === 'franzi' &&
        exp.amount > 0
    ).reduce((sum, exp) => sum + (exp.amount || 0), 0);
    
    const total = fromSven + fromFranzi;
    
    console.log('📊 Transfers by Profile:', { fromSven, fromFranzi, total });
    return { fromSven, fromFranzi, total };
}

function updateTransferHistory() {
    const container = document.getElementById('transfers-history');
    const containerDetailed = document.getElementById('transfers-history-detailed');
    const actualTransfers = appData.transfers || [];
    
    // STRICT PROFILE FILTERING
    let filteredTransfers = actualTransfers;
    if (appData.currentProfile === 'sven') {
        filteredTransfers = actualTransfers.filter(t => t.from === 'sven');
    } else if (appData.currentProfile === 'franzi') {
        filteredTransfers = actualTransfers.filter(t => t.from === 'franzi');
    }
    // Family profile shows NO transfers (they receive them, not send them)
    else if (appData.currentProfile === 'family') {
        filteredTransfers = [];
    }
    
    if (filteredTransfers.length === 0) {
        const noTransfersHTML = `
            <div class="text-center" style="padding: 40px 0; color: #666;">
                <p>${appData.currentProfile === 'family' ? 
                    'Überträge werden in den privaten Profilen erstellt' : 
                    'Noch keine Überträge erstellt'}</p>
                <p style="font-size: 14px; margin-top: 10px;">
                    ${appData.currentProfile === 'family' ? 
                        'Wechseln Sie zu Sven oder Franzi um Überträge zu sehen' :
                        'Erstellen Sie Überträge über das Dashboard'}
                </p>
            </div>
        `;
        if (container) container.innerHTML = noTransfersHTML;
        if (containerDetailed) containerDetailed.innerHTML = noTransfersHTML;
        return;
    }

    const transferHTML = filteredTransfers.slice(-10).reverse().map(transfer => {
        const date = new Date(transfer.date);
        const formattedDate = date.toLocaleDateString('de-CH', { 
            day: '2-digit', 
            month: '2-digit',
            year: '2-digit'
        });
        
        return `
            <div class="transfer-item">
                <div class="transfer-info">
                    <div class="transfer-name">💸 ${transfer.purpose}</div>
                    <div class="transfer-details">
                        ${transfer.from === 'sven' ? '👤 Sven' : '👤 Franzi'} → 👥 Gemeinschaftskonto • ${formattedDate}
                    </div>
                </div>
                <div class="transfer-amount-display">CHF ${transfer.amount.toLocaleString()}</div>
                <div class="expense-actions">
                    <button class="action-btn delete" onclick="deleteTransfer(${transfer.id})" title="Löschen">
                        🗑️
                    </button>
                </div>
            </div>
        `;
    }).join('');

    if (container) container.innerHTML = transferHTML;
    if (containerDetailed) containerDetailed.innerHTML = transferHTML;
}

function updateTransferTab() {
    const quickTransferArea = document.getElementById('quick-transfer-area');
    const totalTransfersAmount = document.getElementById('total-transfers-amount');
    const transferBalanceOverview = document.getElementById('transfer-balance-overview');
    
    if (!quickTransferArea) return;
    
    const transfers = calculateTransfers();
    
    // Update quick transfer area based on current profile
    if (appData.currentProfile === 'family') {
        quickTransferArea.innerHTML = `
            <div class="text-center" style="color: #666;">
                <p>👥 Im Familienprofil können keine Überträge erstellt werden</p>
                <p style="font-size: 12px; margin-top: 5px;">Wechseln Sie zu Sven oder Franzi</p>
            </div>
        `;
    } else {
        const currentBalance = getCurrentBalance();
        quickTransferArea.innerHTML = `
            <div style="margin-bottom: 15px;">
                <div style="font-size: 14px; color: #666; margin-bottom: 5px;">Verfügbarer Kontostand:</div>
                <div style="font-size: 18px; font-weight: bold;">CHF ${currentBalance.toLocaleString()}</div>
            </div>
            <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 10px;">
                <input type="number" class="form-input" id="quick-transfer-amount" placeholder="Betrag (CHF)" step="10" style="margin-bottom: 0;">
                <button onclick="createQuickTransferFromTab()" class="btn btn-primary" style="margin-bottom: 0;">💸 Übertrag</button>
            </div>
            <input type="text" class="form-input" id="quick-transfer-purpose" placeholder="Zweck (optional)" style="margin-top: 10px;">
        `;
    }
    
    // Update total transfers amount - STRICT PROFILE FILTERING
    if (totalTransfersAmount) {
        if (appData.currentProfile === 'sven') {
            totalTransfersAmount.textContent = `CHF ${transfers.fromSven.toLocaleString()}`;
        } else if (appData.currentProfile === 'franzi') {
            totalTransfersAmount.textContent = `CHF ${transfers.fromFranzi.toLocaleString()}`;
        } else {
            // Family profile doesn't send transfers
            totalTransfersAmount.textContent = `CHF 0`;
        }
    }
    
    // Update transfer balance overview - ONLY SHOW FOR INDIVIDUAL PROFILES
    if (transferBalanceOverview) {
        if (appData.currentProfile === 'sven' || appData.currentProfile === 'franzi') {
            const currentProfileTransfers = appData.currentProfile === 'sven' ? transfers.fromSven : transfers.fromFranzi;
            const balanceHTML = `
                <div class="expense-item" style="text-align: center; padding: 20px;">
                    <div class="expense-name">Ihre Überträge diesen Monat</div>
                    <div class="expense-amount" style="font-size: 24px; color: #4facfe;">
                        CHF ${currentProfileTransfers.toLocaleString()}
                    </div>
                </div>
            `;
            transferBalanceOverview.innerHTML = balanceHTML;
        } else {
            // Family profile shows received transfers
            const balanceHTML = `
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                    <div class="expense-item" style="text-align: center; padding: 20px;">
                        <div class="expense-name">Von Sven empfangen</div>
                        <div class="expense-amount">CHF ${transfers.fromSven.toLocaleString()}</div>
                    </div>
                    <div class="expense-item" style="text-align: center; padding: 20px;">
                        <div class="expense-name">Von Franzi empfangen</div>
                        <div class="expense-amount">CHF ${transfers.fromFranzi.toLocaleString()}</div>
                    </div>
                </div>
                <div class="total-card" style="margin-top: 15px;">
                    <div class="total-amount">CHF ${transfers.total.toLocaleString()}</div>
                    <div class="total-label">Gesamt empfangen</div>
                </div>
            `;
            transferBalanceOverview.innerHTML = balanceHTML;
        }
    }
}

async function createQuickTransferFromTab() {
    if (appData.currentProfile === 'family') {
        alert('⚠️ Bitte wechseln Sie zu einem privaten Profil um Überträge zu erstellen.');
        return;
    }
    
    const amountInput = document.getElementById('quick-transfer-amount');
    const purposeInput = document.getElementById('quick-transfer-purpose');
    
    const amount = parseFloat(amountInput.value);
    const purpose = purposeInput.value.trim() || 'Übertrag';
    
    if (!amount || amount <= 0) {
        alert('⚠️ Bitte geben Sie einen gültigen Betrag ein');
        return;
    }
    
    if (amount > getCurrentBalance()) {
        alert('⚠️ Nicht genügend Guthaben auf dem Konto!');
        return;
    }
    
    await createTransfer(appData.currentProfile, amount, purpose, true);
    
    // Clear inputs
    amountInput.value = '';
    purposeInput.value = '';
}

async function deleteTransfer(transferId) {
    if (!confirm('🗑️ Übertrag wirklich löschen?')) return;
    
    const transfer = appData.transfers.find(t => t.id === transferId);
    if (transfer) {
        // Revert balance changes
        if (transfer.from === 'sven') {
            appData.accounts.sven.balance += transfer.amount;
            appData.accounts.shared.balance -= transfer.amount;
        } else if (transfer.from === 'franzi') {
            appData.accounts.franzi.balance += transfer.amount;
            appData.accounts.shared.balance -= transfer.amount;
        }
        
        // Remove transfer from array
        appData.transfers = appData.transfers.filter(t => t.id !== transferId);
        
        await saveData();
        calculateAll();
        updateDashboard();
        updateTransferHistory();
        updateTransferTab();
        
        showNotification('✅ Übertrag gelöscht!', 'success');
    }
}

// DEBUG & CLEANUP FUNCTIONS
async function resetAllTransferData() {
    if (!confirm('🗑️ Alle Transfer-Daten zurücksetzen?\n\nDies entfernt alle Überträge und setzt die Zuflüsse auf 0.')) {
        return;
    }
    
    console.log('🧹 Resetting all transfer data...');
    
    // Clear transfers array
    appData.transfers = [];
    
    // Remove all transfer expenses from both arrays
    appData.fixedExpenses = appData.fixedExpenses.filter(exp => exp.category !== 'Überträge');
    appData.variableExpenses = appData.variableExpenses.filter(exp => exp.category !== 'Überträge');
    
    // Save and refresh
    await saveData();
    renderAllContent();
    calculateAll();
    updateDashboard();
    
    showNotification('✅ Alle Transfer-Daten wurden zurückgesetzt!', 'success');
}

function showTransferDebugInfo() {
    console.log('=== TRANSFER DEBUG INFO ===');
    debugTransferData();
    
    const transfers = calculateTransfersByProfile();
    alert(`Transfer Debug Info (siehe Konsole für Details):

📊 Berechnete Transfers:
- Von Sven: CHF ${transfers.fromSven}
- Von Franzi: CHF ${transfers.fromFranzi}  
- Gesamt: CHF ${transfers.total}

🔍 Prüfen Sie die Browser-Konsole (F12) für detaillierte Informationen.`);
}

function debugTransferData() {
    const allExpenses = [...(appData.fixedExpenses || []), ...(appData.variableExpenses || [])];
    const transferExpenses = allExpenses.filter(exp => exp && exp.category === 'Überträge');
    
    console.log('🔍 Debug Transfer Data:');
    console.log('- Total expenses:', allExpenses.length);
    console.log('- Transfer expenses found:', transferExpenses.length);
    console.log('- Transfer expenses:', transferExpenses);
    
    if (transferExpenses.length > 0) {
        transferExpenses.forEach((exp, index) => {
            console.log(`  ${index + 1}. ${exp.name}: CHF ${exp.amount} - Account: ${exp.account} - Active: ${exp.active}`);
        });
    }
    
    console.log('- Actual transfers array:', appData.transfers || []);
}

// Function to get current balance
function getCurrentBalance() {
    if (appData.currentProfile === 'sven') {
        return appData.accounts.sven.balance || 0;
    } else if (appData.currentProfile === 'franzi') {
        return appData.accounts.franzi.balance || 0;
    } else {
        return appData.accounts.shared.balance || 0;
    }
}
