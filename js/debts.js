// ============= DEBT MANAGEMENT ============= 
function addNewDebt() {
    currentDebt = null;
    
    document.getElementById('debt-modal-title').textContent = 'Schulden/Rechnung hinzufügen';
    document.getElementById('debt-name').value = '';
    document.getElementById('debt-amount').value = '';
    document.getElementById('debt-type').value = '';
    
    if (appData.currentProfile === 'sven') {
        document.getElementById('debt-owner').value = 'sven';
    } else if (appData.currentProfile === 'franzi') {
        document.getElementById('debt-owner').value = 'franzi';
    } else {
        document.getElementById('debt-owner').value = 'shared';
    }
    
    document.getElementById('debt-due-date').value = '';
    openModal('debt-modal');
}

function editDebt(id) {
    const debt = appData.debts.find(d => d.id === id);
    if (!debt) return;
    
    currentDebt = debt;
    
    document.getElementById('debt-modal-title').textContent = 'Schulden bearbeiten';
    document.getElementById('debt-name').value = debt.name;
    document.getElementById('debt-amount').value = debt.amount;
    document.getElementById('debt-type').value = debt.type;
    document.getElementById('debt-owner').value = debt.owner || 'shared';
    document.getElementById('debt-due-date').value = debt.dueDate || '';
    
    openModal('debt-modal');
}

function saveDebt() {
    const name = document.getElementById('debt-name').value.trim();
    const amount = parseFloat(document.getElementById('debt-amount').value);
    const type = document.getElementById('debt-type').value;
    const owner = document.getElementById('debt-owner').value;
    const dueDate = document.getElementById('debt-due-date').value;

    if (!name || !amount || !type) {
        alert('⚠️ Bitte füllen Sie alle Pflichtfelder aus');
        return;
    }

    if (currentDebt) {
        currentDebt.name = name;
        currentDebt.amount = amount;
        currentDebt.type = type;
        currentDebt.owner = owner;
        currentDebt.dueDate = dueDate;
    } else {
        const newDebt = {
            id: Date.now(),
            name: name,
            amount: amount,
            type: type,
            owner: owner,
            dueDate: dueDate
        };
        
        appData.debts.push(newDebt);
    }

    saveData();
    renderDebts();
    calculateAll();
    updateDashboard();
    closeModal('debt-modal');
    
    const action = currentDebt ? 'bearbeitet' : 'hinzugefügt';
    showNotification(`✅ Schulden erfolgreich ${action}!`, 'success');
}

function deleteDebt(id) {
    if (!confirm('🗑️ Schulden wirklich löschen?')) return;
    
    appData.debts = appData.debts.filter(debt => debt.id !== id);
    
    saveData();
    renderDebts();
    calculateAll();
    updateDashboard();
    showNotification('✅ Schulden gelöscht!', 'success');
}

function renderDebts() {
    const container = document.getElementById('debts-list');
    if (!container) return;
    
    let filteredDebts = appData.debts;
    if (appData.currentProfile === 'sven') {
        filteredDebts = appData.debts.filter(debt => debt.owner === 'sven');
    } else if (appData.currentProfile === 'franzi') {
        filteredDebts = appData.debts.filter(debt => debt.owner === 'franzi');
    }
    
    if (filteredDebts.length === 0) {
        container.innerHTML = `
            <div class="text-center" style="padding: 40px 0; color: #666;">
                <p>Keine offenen Schulden oder Rechnungen</p>
                <p style="font-size: 14px; margin-top: 10px;">Klicken Sie "Hinzufügen" um Schulden zu erfassen</p>
            </div>
        `;
        return;
    }

    const today = new Date();
    container.innerHTML = filteredDebts.map(debt => {
        const dueDate = debt.dueDate ? new Date(debt.dueDate) : null;
        const isOverdue = dueDate && dueDate < today;
        
        return `
            <div class="debt-item ${isOverdue ? 'overdue' : ''}" id="debt-${debt.id}">
                <div class="debt-header">
                    <div class="debt-info">
                        <div class="debt-name">${debt.name}</div>
                        <div class="debt-due-date ${isOverdue ? 'overdue' : ''}">
                            ${debt.type} • ${getAccountDisplayName(debt.owner)} ${dueDate ? `• Fällig: ${dueDate.toLocaleDateString('de-CH')}` : ''}
                            ${isOverdue ? ' ⚠️ ÜBERFÄLLIG' : ''}
                        </div>
                    </div>
                    <div class="debt-amount">CHF ${debt.amount.toLocaleString()}</div>
                    <div class="expense-actions">
                        <button class="action-btn edit" onclick="editDebt(${debt.id})" title="Bearbeiten">
                            ✏️
                        </button>
                        <button class="action-btn delete" onclick="deleteDebt(${debt.id})" title="Löschen">
                            🗑️
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function updateDebtCategories() {
    const container = document.getElementById('debt-categories');
    if (!container) return;
    
    const debtsByType = {};
    
    let filteredDebts = appData.debts;
    if (appData.currentProfile === 'sven') {
        filteredDebts = appData.debts.filter(debt => debt.owner === 'sven');
    } else if (appData.currentProfile === 'franzi') {
        filteredDebts = appData.debts.filter(debt => debt.owner === 'franzi');
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
