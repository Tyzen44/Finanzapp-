// ============= APP VERSION & CACHE MANAGEMENT =============
function checkAppVersion() {
    const metaVersion = document.querySelector('meta[name="app-version"]')?.content;
    const metaBuildTime = document.querySelector('meta[name="build-time"]')?.content;
    
    console.log(`📄 App Version: ${APP_VERSION}, Meta Version: ${metaVersion}`);
    console.log(`🕐 Build Time: ${BUILD_TIME}, Meta Build: ${metaBuildTime}`);
    
    localStorage.setItem('appVersion', APP_VERSION);
    localStorage.setItem('buildTime', BUILD_TIME);
}

function forceCacheReload() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then(function(registrations) {
            for(let registration of registrations) {
                registration.unregister();
            }
        });
    }
    
    if ('caches' in window) {
        caches.keys().then(function(names) {
            for (let name of names) {
                caches.delete(name);
            }
        });
    }
    
    setTimeout(() => {
        window.location.reload(true);
    }, 1000);
}

function addCacheBuster() {
    const timestamp = Date.now();
    const links = document.querySelectorAll('link[rel="stylesheet"], script[src]');
    
    links.forEach(link => {
        const url = new URL(link.href || link.src);
        url.searchParams.set('v', timestamp);
        if (link.href) link.href = url.toString();
        if (link.src) link.src = url.toString();
    });
}

function checkCacheStatus() {
    const cacheStatus = document.getElementById('cache-status');
    if (cacheStatus) {
        const appVersion = localStorage.getItem('appVersion');
        const buildTime = localStorage.getItem('buildTime');
        
        if (appVersion === APP_VERSION && buildTime === BUILD_TIME) {
            cacheStatus.textContent = 'Aktuell';
            cacheStatus.style.color = '#28a745';
        } else {
            cacheStatus.textContent = 'Veraltet';
            cacheStatus.style.color = '#dc3545';
        }
    }
}

function clearAppCache() {
    if (!confirm('🗑️ Cache wirklich leeren?\n\nDie App wird anschließend neu geladen.')) {
        return;
    }
    
    forceCacheReload();
    showNotification('✅ Cache gelöscht! App wird neu geladen...', 'success');
}

// ============= PROFILE MANAGEMENT ============= 
function toggleProfileDropdown() {
    const dropdown = document.getElementById('profile-dropdown');
    if (dropdown) {
        dropdown.classList.toggle('active');
    }
}

async function switchProfile(profile) {
    appData.currentProfile = profile;
    
    const profileName = document.getElementById('current-profile-name');
    const options = document.querySelectorAll('.profile-option');
    
    options.forEach(opt => opt.classList.remove('active'));
    
    if (profile === 'sven') {
        profileName.textContent = '👤 Sven';
        document.querySelector('.profile-option:nth-child(1)').classList.add('active');
    } else if (profile === 'franzi') {
        profileName.textContent = '👤 Franzi';
        document.querySelector('.profile-option:nth-child(2)').classList.add('active');
    } else {
        profileName.textContent = '👥 Familie';
        document.querySelector('.profile-option:nth-child(3)').classList.add('active');
    }

    const desktopProfile = document.getElementById('desktop-current-profile');
    if (desktopProfile) {
        desktopProfile.textContent = profile === 'sven' ? '👤 Sven' : 
                                     profile === 'franzi' ? '👤 Franzi' : '👥 Familie';
    }
    
    document.getElementById('profile-dropdown').classList.remove('active');
    
    calculateAll();
    updateDashboard();
    updateTransferTab();
    renderBalanceChart();
    renderExpenses('fixed');
    renderExpenses('variable');
    renderDebts();
    updateRecommendations();
    updateCategoriesOverview();
    updateDebtCategories();
    updateTransferHistory();
    
    // Safe call - check if function exists
    if (typeof renderIncomeList !== 'undefined') {
        renderIncomeList();
    }
    
    renderFoodPurchases();
    updateFoodBudgetDisplay();
    
    // WICHTIG: Savings-Komponenten neu rendern beim Profilwechsel
    if (typeof renderPillar3aSection !== 'undefined') {
        renderPillar3aSection();
        renderPerformanceChart();
        renderInvestmentsSection();
        updateSavingsRecommendations();
    }
    
    await saveData();
}

// ============= MODALS ============= 
function openModal(modalId) {
    document.getElementById(modalId).classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
    document.body.style.overflow = 'auto';
    
    if (modalId === 'expense-modal') {
        currentExpense = null;
        currentExpenseType = null;
    } else if (modalId === 'balance-modal') {
        currentEditAccount = null;
    } else if (modalId === 'debt-modal') {
        currentDebt = null;
    }
}

// ============= NAVIGATION ============= 
function setupEventListeners() {
    console.log('🔧 Setting up event listeners...');
    
    // Mobile navigation
    document.querySelectorAll('.nav-button').forEach((button) => {
        button.addEventListener('click', function() {
            console.log('Nav button clicked:', this.dataset.tab);
            const tabName = this.dataset.tab;
            switchTab(tabName);
            
            // Update active button
            document.querySelectorAll('.nav-button').forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
        });
    });
    
    // Desktop navigation
    document.querySelectorAll('.desktop-nav-item').forEach((item) => {
        item.addEventListener('click', function() {
            console.log('Desktop nav clicked:', this.dataset.tab);
            const tabName = this.dataset.tab;
            switchTab(tabName);
            
            // Update active item
            document.querySelectorAll('.desktop-nav-item').forEach(it => it.classList.remove('active'));
            this.classList.add('active');
        });
    });

    // Close modals when clicking outside
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                closeModal(this.id);
            }
        });
    });

    // Close profile dropdown when clicking outside
    document.addEventListener('click', function(e) {
        const profileSwitcher = document.querySelector('.profile-switcher');
        const profileDropdown = document.getElementById('profile-dropdown');
        
        if (profileSwitcher && profileDropdown && !profileSwitcher.contains(e.target)) {
            profileDropdown.classList.remove('active');
        }
    });

    console.log('✅ Event listeners set up complete');
}

function switchTab(tabName) {
    console.log('Switching to tab:', tabName);
    
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Show selected tab
    const targetTab = document.getElementById('tab-' + tabName);
    if (targetTab) {
        targetTab.classList.add('active');
        console.log('Tab switched to:', tabName);
        
        // Special handling for transfers tab
        if (tabName === 'transfers') {
            updateTransferTab();
        }
    } else {
        console.error('Tab not found:', 'tab-' + tabName);
    }
}

// ============= UTILITY FUNCTIONS ============= 
function showNotification(message, type = 'info') {
    alert(message);
}

function renderAllContent() {
    renderExpenses('fixed');
    renderExpenses('variable');
    renderDebts();
    renderWealthHistory();
    renderFoodPurchases();
    updateFoodBudgetDisplay();
    updateRecommendations();
    updateCategoriesOverview();
    updateDebtCategories();
    updateTransferHistory();
    updateTransferTab();
    renderBalanceChart();
    updateDashboard();
    updateSyncStatus();
    updateGistLinkDisplay();
    
    // Safe calls - check if functions exist before calling
    if (typeof renderIncomeList !== 'undefined') {
        renderIncomeList();
    }
    
    if (typeof renderSalaryHistory !== 'undefined') {
        renderSalaryHistory();
    }
    
    // Auch Savings-Komponenten rendern
    if (typeof renderPillar3aSection !== 'undefined') {
        renderPillar3aSection();
        renderPerformanceChart();
        renderInvestmentsSection();
        updateSavingsRecommendations();
    }
}

// ============= DATA PERSISTENCE WITH LOCK ============= 
// Use global lock variable
window.saveInProgress = window.saveInProgress || false;

async function saveData() {
    // Prevent concurrent saves
    if (window.saveInProgress) {
        console.log('⏳ Save already in progress, skipping...');
        return false;
    }

    if (!navigator.onLine) {
        showNotification('Keine Internetverbindung - Änderungen können nicht gespeichert werden!', 'error');
        return false;
    }

    if (!hasValidToken()) {
        showNotification('GitHub Token fehlt - Änderungen können nicht gespeichert werden!', 'error');
        return false;
    }
    
    window.saveInProgress = true;
    
    try {
        // CLOUD ONLY - no local storage
        console.log('☁️ Speichere direkt in Cloud...');
        const success = await saveDataToGist();
        
        if (!success) {
            showNotification('Cloud-Speichern fehlgeschlagen! Versuchen Sie es erneut.', 'error');
            return false;
        }
        
        // Wait a bit to prevent race conditions
        await new Promise(resolve => setTimeout(resolve, 300));
        
        return true;
    } finally {
        window.saveInProgress = false;
    }
}

async function loadData() {
    console.log('☁️ Lade Daten direkt aus Cloud...');
    
    if (!navigator.onLine) {
        showNotification('Keine Internetverbindung - App kann nicht gestartet werden!', 'error');
        validateDataIntegrity();
        return;
    }

    if (!hasValidToken()) {
        console.log('Kein Token verfügbar - verwende leere Daten');
        validateDataIntegrity();
        return;
    }
    
    const savedGistId = localStorage.getItem('swissFinanceGistId');
    const savedGistUrl = localStorage.getItem('swissFinanceGistUrl');
    if (savedGistId) {
        GITHUB_CONFIG.gistId = savedGistId;
        syncState.gistUrl = savedGistUrl;
    }
    
    let cloudDataLoaded = false;
    
    if (GITHUB_CONFIG.gistId) {
        console.log('☁️ Lade Daten von bekanntem Gist...');
        cloudDataLoaded = await loadDataFromGist();
    } 
    
    if (!cloudDataLoaded) {
        console.log('🔍 Suche nach existierendem Gist...');
        const existingGist = await findExistingGist();
        if (existingGist) {
            cloudDataLoaded = await loadDataFromGist();
        }
    }
    
    if (!cloudDataLoaded) {
        console.log('🆕 Keine Cloud-Daten gefunden - starte mit leeren Daten');
        showNotification('Keine Daten in der Cloud gefunden. Starte mit leerer Finanzverwaltung.', 'info');
    } else {
        console.log('✅ Cloud-Daten erfolgreich geladen');
    }
    
    validateDataIntegrity();
    
    console.log('✅ Cloud-Loading abgeschlossen');
}

function validateDataIntegrity() {
    if (!['sven', 'franzi', 'family'].includes(appData.currentProfile)) {
        appData.currentProfile = 'family';
    }
    if (!appData.transfers) appData.transfers = [];
    if (!appData.debts) appData.debts = [];
    if (!appData.foodPurchases) appData.foodPurchases = [];
    if (!appData.monthlyFoodBudget) appData.monthlyFoodBudget = 800;
    if (!appData.currentMonthFoodSpent) appData.currentMonthFoodSpent = 0;
    
    if (!appData.fixedExpenses) appData.fixedExpenses = [];
    if (!appData.variableExpenses) appData.variableExpenses = [];
    if (!appData.wealthHistory) appData.wealthHistory = [];
    
    if (!appData.profiles) {
        appData.profiles = {
            sven: { name: 'Sven', income: 0 },
            franzi: { name: 'Franzi', income: 0 }
        };
    }
    if (!appData.accounts) {
        appData.accounts = {
            sven: { balance: 0, name: 'Sven Privat' },
            franzi: { balance: 0, name: 'Franzi Privat' },
            shared: { balance: 0, name: 'Gemeinschaftskonto' }
        };
    }
    
    console.log('✅ Data integrity validated:', {
        fixedExpenses: appData.fixedExpenses.length,
        variableExpenses: appData.variableExpenses.length,
        debts: appData.debts.length,
        transfers: appData.transfers.length
    });
}

// ============= TOKEN MANAGEMENT UI FUNCTIONS =============
async function saveGitHubToken() {
    const tokenInput = document.getElementById('github-token-input');
    const token = tokenInput.value.trim();
    
    if (!token) {
        alert('⚠️ Bitte geben Sie einen Token ein');
        return;
    }
    
    if (!token.startsWith('ghp_') || token.length < 30) {
        alert('⚠️ Ungültiges Token-Format.\nEin GitHub Token beginnt mit "ghp_" und ist mindestens 30 Zeichen lang.');
        return;
    }
    
    updateSyncStatusDisplay('🔄 Token testen...', 'syncing');
    
    setGitHubToken(token);
    tokenInput.value = '';
    
    try {
        console.log('🧪 Teste neuen GitHub Token...');
        const connectionTest = await testGitHubConnection();
        
        if (connectionTest.success) {
            console.log('✅ Token Test erfolgreich für Benutzer:', connectionTest.user);
            
            const existingGist = await findExistingGist();
            
            if (existingGist) {
                console.log('🔥 Versuche Daten vom existierenden Gist zu laden...');
                const dataLoaded = await loadDataFromGist();
                
                if (dataLoaded) {
                    renderAllContent();
                    calculateAll();
                    updateDashboard();
                    
                    showNotification('🎉 Existierendes Gist gefunden und Daten geladen!\n\n✅ Alle Ihre Geräte sind jetzt synchronisiert.', 'success');
                    updateSyncStatusDisplay('✅ Synchronisiert', 'success');
                } else {
                    showNotification('🎉 Existierendes Gist gefunden!\n\n⚠️ Daten konnten nicht geladen werden, aber Sync ist aktiv.', 'warning');
                    updateSyncStatusDisplay('⚠️ Gist gefunden, Daten-Fehler', 'warning');
                }
            } else {
                showNotification('🎉 GitHub Token erfolgreich gespeichert!\n\n💡 Beim ersten Speichern wird automatisch ein neues Gist erstellt.', 'success');
                updateSyncStatusDisplay('✅ Token gültig', 'success');
            }
            
            updateSyncStatus();
            
        } else {
            removeGitHubToken();
            
            let errorMsg = '⚠️ Token-Test fehlgeschlagen.\n\n';
            switch (connectionTest.error) {
                case 'INVALID_TOKEN':
                    errorMsg += 'Der Token ist ungültig oder abgelaufen.\nBitte erstellen Sie einen neuen Token.';
                    break;
                case 'NETWORK_ERROR':
                    errorMsg += 'Netzwerk-Fehler.\nBitte prüfen Sie Ihre Internetverbindung.';
                    break;
                default:
                    errorMsg += `Fehler: ${connectionTest.error}`;
            }
            
            alert(errorMsg);
            updateSyncStatusDisplay('⚠️ Token ungültig', 'error');
            updateSyncStatus();
        }
    } catch (error) {
        console.error('⚠️ Fehler beim Token-Test:', error);
        removeGitHubToken();
        alert('⚠️ Fehler beim Testen des Tokens.\nBitte versuchen Sie es erneut.');
        updateSyncStatusDisplay('⚠️ Test fehlgeschlagen', 'error');
        updateSyncStatus();
    }
}

function toggleTokenVisibility() {
    const tokenInput = document.getElementById('github-token-input');
    const toggleBtn = document.getElementById('toggle-token-btn');
    
    if (tokenInput.type === 'password') {
        if (GITHUB_CONFIG.token) {
            tokenInput.value = GITHUB_CONFIG.token;
            tokenInput.type = 'text';
            tokenInput.style.fontFamily = 'monospace';
            toggleBtn.textContent = '🔒 Token verstecken';
        } else {
            alert('❓ Kein Token gespeichert');
        }
    } else {
        tokenInput.type = 'password';
        tokenInput.value = '';
        tokenInput.style.fontFamily = '';
        toggleBtn.textContent = '👁️ Token anzeigen';
    }
}

function removeTokenConfirm() {
    if (!confirm('🗑️ GitHub Token wirklich löschen?\n\nDies deaktiviert die Cloud-Synchronisation komplett.')) {
        return;
    }
    
    removeGitHubToken();
    
    const tokenInput = document.getElementById('github-token-input');
    if (tokenInput) {
        tokenInput.value = '';
        tokenInput.type = 'password';
        tokenInput.style.fontFamily = '';
        tokenInput.placeholder = 'ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx';
        tokenInput.style.background = 'white';
    }
    
    const toggleBtn = document.getElementById('toggle-token-btn');
    if (toggleBtn) {
        toggleBtn.textContent = '👁️ Token anzeigen';
    }
    
    const gistLinkDisplay = document.getElementById('gist-link-display');
    if (gistLinkDisplay) {
        gistLinkDisplay.style.display = 'none';
    }
    
    showNotification('🗑️ GitHub Token gelöscht. Cloud-Sync ist jetzt deaktiviert.', 'warning');
    updateSyncStatus();
}

// ============= SYNC STATUS DISPLAY =============
function updateSyncStatusDisplay(message, type) {
    const syncBtn = document.getElementById('sync-btn');
    if (syncBtn && syncBtn.querySelector('.nav-icon')) {
        const icon = syncBtn.querySelector('.nav-icon');
        
        switch (type) {
            case 'syncing':
                icon.textContent = '⏳';
                break;
            case 'success':
                icon.textContent = '✅';
                setTimeout(() => icon.textContent = '🔄', 3000);
                break;
            case 'error':
                icon.textContent = '⚠️';
                setTimeout(() => icon.textContent = '🔄', 5000);
                break;
            case 'warning':
                icon.textContent = '⚠️';
                setTimeout(() => icon.textContent = '🔄', 3000);
                break;
            case 'info':
                icon.textContent = '💾';
                setTimeout(() => icon.textContent = '🔄', 2000);
                break;
            default:
                icon.textContent = '🔄';
        }
    }
}

function updateSyncStatus() {
    const syncStatusContent = document.getElementById('sync-status-content');
    const syncStatus = document.getElementById('sync-status');
    
    if (!syncStatusContent || !syncStatus) return;
    
    const hasToken = hasValidToken();
    const hasGistId = GITHUB_CONFIG.gistId || localStorage.getItem('swissFinanceGistId');
    const gistUrl = syncState.gistUrl || localStorage.getItem('swissFinanceGistUrl');
    
    if (hasToken && hasGistId) {
        syncStatus.style.background = '#d4edda';
        syncStatus.style.color = '#155724';
        syncStatus.style.border = '2px solid #28a745';
        
        let statusHTML = `
            <strong>✅ Cloud-Sync aktiv!</strong><br>
            <small>Daten werden automatisch synchronisiert</small>
        `;
        
        if (syncState.lastSyncTime) {
            const lastSync = new Date(syncState.lastSyncTime);
            const timeAgo = Math.round((Date.now() - lastSync.getTime()) / 60000);
            statusHTML += `<br><small>Letzte Sync: vor ${timeAgo} Min.</small>`;
        }
        
        if (gistUrl) {
            statusHTML += `<br><a href="${gistUrl}" target="_blank" style="color: #155724; text-decoration: underline; font-size: 12px;">🔗 Gist ansehen</a>`;
        }
        
        syncStatusContent.innerHTML = statusHTML;
        
    } else if (hasToken && !hasGistId) {
        syncStatus.style.background = '#fff3cd';
        syncStatus.style.color = '#856404';
        syncStatus.style.border = '2px solid #ffc107';
        syncStatusContent.innerHTML = `
            <strong>⚠️ Token konfiguriert</strong><br>
            <small>Gist wird beim ersten Speichern automatisch erstellt</small><br>
            <small>Klicken Sie "Jetzt synchronisieren" um zu starten</small>
        `;
    } else {
        syncStatus.style.background = '#f8d7da';
        syncStatus.style.color = '#721c24';
        syncStatus.style.border = '2px solid #dc3545';
        
        let statusHTML = `<strong>⚠️ Kein Cloud-Sync</strong><br>`;
        
        if (GITHUB_CONFIG.token && !GITHUB_CONFIG.token.startsWith('ghp_')) {
            statusHTML += `<small>Token ungültig (falsches Format)</small>`;
        } else if (GITHUB_CONFIG.token) {
            statusHTML += `<small>Token möglicherweise abgelaufen</small>`;
        } else {
            statusHTML += `<small>Kein GitHub Token konfiguriert</small>`;
        }
        
        statusHTML += `<br><small>Geben Sie einen gültigen Token oben ein</small>`;
        syncStatusContent.innerHTML = statusHTML;
    }
}

function updateGistLinkDisplay() {
    const gistLinkDisplay = document.getElementById('gist-link-display');
    const gistLink = document.getElementById('gist-link');
    
    if (syncState.gistUrl && gistLinkDisplay && gistLink) {
        gistLinkDisplay.style.display = 'block';
        gistLink.href = syncState.gistUrl;
        console.log('🔗 Gist Link UI aktualisiert:', syncState.gistUrl);
    } else if (gistLinkDisplay) {
        gistLinkDisplay.style.display = 'none';
    }
}
