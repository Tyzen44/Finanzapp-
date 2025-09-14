// ============= INITIALIZE APP ============= 
async function initApp() {
    console.log('Initializing Swiss Finance App...');
    
    // Check app version and force update if needed
    checkAppVersion();
    
    // Initialize token first
    initializeToken();
    
    // Initialize savings data structure EARLY
    if (typeof initializeSavingsData !== 'undefined') {
        initializeSavingsData();
        console.log('✅ Savings data initialized early');
    }
    
    // Initialize sync state
    window.showSyncNotifications = true;
    syncState.lastSyncTime = localStorage.getItem('lastSyncTime');
    syncState.gistUrl = localStorage.getItem('swissFinanceGistUrl');
    
    try {
        // Load data (local + cloud with discovery)
        await loadData();
        console.log('Data loaded successfully');
        
        // Re-initialize savings after data load to ensure structure
        if (typeof initializeSavingsData !== 'undefined') {
            initializeSavingsData();
            console.log('✅ Savings data re-initialized after load');
        }
        
        // Test connection if online and token available
        if (navigator.onLine && hasValidToken()) {
            console.log('Testing GitHub connection on startup...');
            const connectionTest = await testGitHubConnection();
            if (connectionTest.success) {
                console.log('GitHub connection verified on startup');
                updateSyncStatusDisplay('Verbunden', 'success');
            } else {
                console.log('GitHub connection failed on startup:', connectionTest.error);
                updateSyncStatusDisplay('Verbindung fehlt', 'error');
            }
        } else if (!hasValidToken()) {
            console.log('No valid token available on startup');
            updateSyncStatusDisplay('Kein Token', 'error');
        }
        
    } catch (error) {
        console.error('Error during initialization:', error);
        updateSyncStatusDisplay('Init-Fehler', 'warning');
    }
    
    // Set profile UI based on saved profile
    const profileName = document.getElementById('current-profile-name');
    const options = document.querySelectorAll('.profile-option');
    
    if (profileName && options.length > 0) {
        options.forEach(opt => opt.classList.remove('active'));
        
        if (appData.currentProfile === 'sven') {
            profileName.textContent = '👤 Sven';
            const svenOption = document.querySelector('.profile-option:nth-child(1)');
            if (svenOption) svenOption.classList.add('active');
        } else if (appData.currentProfile === 'franzi') {
            profileName.textContent = '👤 Franzi';
            const franziOption = document.querySelector('.profile-option:nth-child(2)');
            if (franziOption) franziOption.classList.add('active');
        } else {
            profileName.textContent = '👥 Familie';
            const familyOption = document.querySelector('.profile-option:nth-child(3)');
            if (familyOption) familyOption.classList.add('active');
        }
    }

    // Initialize food budget input
    const foodBudgetInput = document.getElementById('food-budget-input');
    if (foodBudgetInput) {
        foodBudgetInput.value = appData.monthlyFoodBudget || 800;
    }
    
    // Initialize settings inputs
    const svenIncomeInput = document.getElementById('settings-income-sven');
    const franziIncomeInput = document.getElementById('settings-income-franzi');
    if (svenIncomeInput) svenIncomeInput.value = appData.profiles.sven.income;
    if (franziIncomeInput) franziIncomeInput.value = appData.profiles.franzi.income;
    
    // Initialize GitHub token input (show status but keep token hidden for security)
    const tokenInput = document.getElementById('github-token-input');
    if (tokenInput) {
        if (hasValidToken()) {
            tokenInput.placeholder = 'Token ist konfiguriert (klicken Sie "Token anzeigen")';
            tokenInput.style.background = '#f8f9fa';
        } else {
            tokenInput.placeholder = 'ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx';
            tokenInput.style.background = 'white';
        }
    }
    
    console.log('Rendering all content...');
    renderAllContent();
    setupEventListeners();
    calculateAll();
    updateDashboard();
    
    // Render savings sections specifically
    if (typeof renderPillar3aSection !== 'undefined') {
        renderPillar3aSection();
        renderPerformanceChart();
        renderInvestmentsSection();
        updateSavingsRecommendations();
        console.log('✅ Savings sections rendered');
    }
    
    // Render compound calculator
    if (typeof renderCompoundCalculator !== 'undefined') {
        renderCompoundCalculator();
        console.log('✅ Compound calculator rendered');
    }
    
    // REMOVED: setupAppResumeHandler();
    // REMOVED: setInterval(checkForAppUpdates, 300000);
    
    console.log('Swiss Finance App initialized successfully!');
}

// ============= DOM READY ============= 
document.addEventListener('DOMContentLoaded', async function() {
    console.log('📄 DOM Content Loaded - Starting Swiss Finance...');
    
    // Quick test to ensure JavaScript is working
    try {
        const testElement = document.querySelector('.header h1');
        if (testElement) {
            console.log('✅ DOM elements accessible');
        } else {
            console.error('⚠️ Cannot access DOM elements');
        }

        await initApp();
        
        // Show loading complete with sync info
        setTimeout(() => {
            const hasToken = hasValidToken();
            const hasConnection = syncState.lastSyncTime || syncState.gistUrl;
            
            let message = '';
            let type = 'info';
            
            if (hasToken && hasConnection) {
                message = '✅ Swiss Finance geladen - Cloud-Sync aktiv!\n📄 Daten werden beim Speichern synchronisiert.';
                type = 'success';
            } else if (hasToken && !hasConnection) {
                message = '⚠️ Swiss Finance geladen - Cloud-Sync wird eingerichtet...\n💡 Klicken Sie auf "Jetzt synchronisieren" um zu starten.';
                type = 'warning';
            } else {
                message = '📱 Swiss Finance geladen - nur lokaler Modus\n🔐 GitHub Token benötigt für Cloud-Sync zwischen Geräten.';
                type = 'info';
            }
            
            console.log(message);
            showNotification(message, type);
        }, 2000);
        
    } catch (error) {
        console.error('⚠️ Fehler beim Initialisieren der App:', error);
        showNotification('⚠️ App geladen, aber Sync-Probleme', 'warning');
    }
});

// ============= MAKE FUNCTIONS GLOBALLY AVAILABLE ============= 
// Profile & Navigation
window.toggleProfileDropdown = toggleProfileDropdown;
window.switchProfile = switchProfile;
window.switchTab = switchTab;

// Transfers
window.addQuickTransfer = addQuickTransfer;
window.createQuickTransferFromTab = createQuickTransferFromTab;
window.deleteTransfer = deleteTransfer;

// Account Management
window.editAccountBalance = editAccountBalance;
window.updateBalanceFromModal = updateBalanceFromModal;
window.updateBalance = updateBalance;
window.updateProfileIncome = updateProfileIncome;

// Expenses
window.addNewExpense = addNewExpense;
window.editExpense = editExpense;
window.deleteExpense = deleteExpense;
window.toggleExpense = toggleExpense;
window.saveExpense = saveExpense;

// Income
window.addNewIncome = addNewIncome;
window.addQuickIncome = addQuickIncome;
window.saveIncome = saveIncome;
window.editIncome = editIncome;
window.deleteIncome = deleteIncome;
window.closeMonth = closeMonth;
window.addSalaryEntry = addSalaryEntry;
window.addSalaryEntryWithAmount = addSalaryEntryWithAmount;

// Debts
window.addNewDebt = addNewDebt;
window.editDebt = editDebt;
window.deleteDebt = deleteDebt;
window.saveDebt = saveDebt;

// Food Budget
window.addQuickPurchase = addQuickPurchase;
window.editFoodPurchase = editFoodPurchase;
window.deleteFoodPurchase = deleteFoodPurchase;
window.updateFoodBudget = updateFoodBudget;
window.resetFoodBudget = resetFoodBudget;
window.newMonthReset = newMonthReset;

// Wealth Tracking
window.saveMonthData = saveMonthData;
window.deleteWealthEntry = deleteWealthEntry;
window.clearAllWealthHistory = clearAllWealthHistory;

// Savings & Compound Calculator
window.openCompoundCalculator = openCompoundCalculator;
window.calculateCompoundInterest = calculateCompoundInterest;
window.saveCalculationResult = saveCalculationResult;
window.deleteSavedCalculation = deleteSavedCalculation;
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

// Modals
window.openModal = openModal;
window.closeModal = closeModal;

// Sync & Token Management
window.manualSync = manualSync;
window.saveGitHubToken = saveGitHubToken;
window.toggleTokenVisibility = toggleTokenVisibility;
window.removeTokenConfirm = removeTokenConfirm;

// Debug & Cache Functions
window.resetAllTransferData = resetAllTransferData;
window.showTransferDebugInfo = showTransferDebugInfo;
window.debugTransferData = debugTransferData;
window.checkCacheStatus = checkCacheStatus;
window.clearAppCache = clearAppCache;

console.log('🚀 Swiss Finance JavaScript loaded successfully!');
