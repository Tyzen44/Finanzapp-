// ============= TOKEN MANAGEMENT =============
function initializeToken() {
    const savedToken = localStorage.getItem('githubToken');
    if (savedToken) {
        GITHUB_CONFIG.token = savedToken;
        console.log('🔑 Token aus localStorage geladen');
    } else {
        GITHUB_CONFIG.token = '';
        console.log('⚠️ Kein Token in localStorage gefunden');
    }
}

function setGitHubToken(token) {
    GITHUB_CONFIG.token = token;
    localStorage.setItem('githubToken', token);
    console.log('🔑 GitHub Token gespeichert und aktiviert');
}

function removeGitHubToken() {
    GITHUB_CONFIG.token = '';
    localStorage.removeItem('githubToken');
    localStorage.removeItem('swissFinanceGistId');
    localStorage.removeItem('swissFinanceGistUrl');
    localStorage.removeItem('lastSyncTime');
    console.log('🗑️ GitHub Token und alle Sync-Daten entfernt');
}

function hasValidToken() {
    return GITHUB_CONFIG.token && 
           GITHUB_CONFIG.token.length > 20 && 
           GITHUB_CONFIG.token.startsWith('ghp_');
}

// ============= GIST DISCOVERY & SYNC FUNCTIONS =============
async function findExistingGist() {
    if (!hasValidToken()) {
        console.log('⚠️ Kein Token verfügbar für Gist-Suche');
        return null;
    }

    try {
        console.log('🔍 Suche nach existierendem Swiss Finance Gist...');
        
        const response = await fetch('https://api.github.com/gists', {
            headers: {
                'Authorization': `token ${GITHUB_CONFIG.token}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });

        if (!response.ok) {
            throw new Error(`GitHub API Fehler: ${response.status}`);
        }

        const gists = await response.json();
        console.log(`📋 ${gists.length} Gists gefunden, durchsuche nach Swiss Finance...`);
        
        const swissFinanceGist = gists.find(gist => {
            const hasCorrectFile = gist.files && gist.files[GITHUB_CONFIG.filename];
            const hasCorrectDescription = gist.description && gist.description.includes('Swiss Finance');
            return hasCorrectFile || hasCorrectDescription;
        });

        if (swissFinanceGist) {
            console.log('✅ Existierendes Swiss Finance Gist gefunden:', swissFinanceGist.html_url);
            GITHUB_CONFIG.gistId = swissFinanceGist.id;
            localStorage.setItem('swissFinanceGistId', swissFinanceGist.id);
            localStorage.setItem('swissFinanceGistUrl', swissFinanceGist.html_url);
            syncState.gistUrl = swissFinanceGist.html_url;
            
            updateGistLinkDisplay();
            return swissFinanceGist;
        } else {
            console.log('❓ Kein existierendes Swiss Finance Gist gefunden');
            return null;
        }

    } catch (error) {
        console.error('❌ Fehler beim Suchen nach Gist:', error);
        return null;
    }
}

async function loadDataFromGist() {
    if (!hasValidToken() || !GITHUB_CONFIG.gistId) {
        console.log('⚠️ Kein Token oder Gist ID für Daten-Loading');
        return false;
    }

    try {
        console.log('📥 Lade Daten von Gist:', GITHUB_CONFIG.gistId);
        
        const response = await fetch(`https://api.github.com/gists/${GITHUB_CONFIG.gistId}`, {
            headers: {
                'Authorization': `token ${GITHUB_CONFIG.token}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });

        if (!response.ok) {
            throw new Error(`Gist Loading Fehler: ${response.status}`);
        }

        const gistData = await response.json();
        
        if (!gistData.files || !gistData.files[GITHUB_CONFIG.filename]) {
            console.log('⚠️ Swiss Finance Datei nicht im Gist gefunden');
            return false;
        }

        const fileContent = gistData.files[GITHUB_CONFIG.filename].content;
        const cloudData = JSON.parse(fileContent);
        
        if (cloudData.data) {
            console.log('✅ Daten erfolgreich vom Gist geladen');
            
            appData = { ...appData, ...cloudData.data };
            validateDataIntegrity();
            
            console.log('📊 Geladene Daten:', {
                profile: appData.currentProfile,
                fixedExpenses: appData.fixedExpenses?.length || 0,
                variableExpenses: appData.variableExpenses?.length || 0,
                transfers: appData.transfers?.length || 0,
                debts: appData.debts?.length || 0
            });

            return true;
        } else {
            console.log('⚠️ Keine gültigen Daten im Gist gefunden');
            return false;
        }

    } catch (error) {
        console.error('❌ Fehler beim Laden von Gist:', error);
        return false;
    }
}

async function saveDataToGist() {
    if (!hasValidToken()) {
        console.log('⚠️ GitHub Token nicht gültig konfiguriert - nur lokale Speicherung');
        updateSyncStatusDisplay('⚠️ Kein Token', 'error');
        return false;
    }

    if (syncState.syncInProgress) {
        console.log('🔄 Sync bereits in Bearbeitung...');
        return false;
    }

    syncState.syncInProgress = true;
    updateSyncStatusDisplay('🔄 Speichere...', 'syncing');

    try {
        const connectionTest = await testGitHubConnection();
        if (!connectionTest.success) {
            throw new Error(`Connection failed: ${connectionTest.error}`);
        }

        const dataToSave = {
            data: {
                ...appData,
                fixedExpenses: appData.fixedExpenses || [],
                variableExpenses: appData.variableExpenses || [],
                debts: appData.debts || [],
                transfers: appData.transfers || [],
                wealthHistory: appData.wealthHistory || [],
                foodPurchases: appData.foodPurchases || []
            },
            lastUpdated: new Date().toISOString(),
            device: getDeviceInfo(),
            version: '2.1',
            syncId: Date.now()
        };
        
        console.log('💾 Speichere vollständige Daten:', {
            fixedExpenses: dataToSave.data.fixedExpenses.length,
            variableExpenses: dataToSave.data.variableExpenses.length,
            transfers: dataToSave.data.transfers.length,
            debts: dataToSave.data.debts.length,
            profile: dataToSave.data.currentProfile
        });
        
        const payload = {
            description: '🇨🇭 Swiss Finance - Sven & Franzi Finanzdaten (PRIVAT)',
            public: false,
            files: {
                [GITHUB_CONFIG.filename]: {
                    content: JSON.stringify(dataToSave, null, 2)
                }
            }
        };
        
        let url, method;
        
        if (GITHUB_CONFIG.gistId) {
            url = `https://api.github.com/gists/${GITHUB_CONFIG.gistId}`;
            method = 'PATCH';
            console.log('🔍 Updating existing Gist:', GITHUB_CONFIG.gistId);
        } else {
            url = 'https://api.github.com/gists';
            method = 'POST';
            console.log('🆕 Creating new Gist...');
        }
        
        const response = await fetch(url, {
            method: method,
            headers: {
                'Authorization': `token ${GITHUB_CONFIG.token}`,
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });
        
        if (response.ok) {
            const gistData = await response.json();
            
            if (!GITHUB_CONFIG.gistId) {
                GITHUB_CONFIG.gistId = gistData.id;
                localStorage.setItem('swissFinanceGistId', gistData.id);
                console.log('🎉 Neues GitHub Gist erstellt:', gistData.html_url);
                syncState.gistUrl = gistData.html_url;
                localStorage.setItem('swissFinanceGistUrl', gistData.html_url);
                updateGistLinkDisplay();
            }
            
            syncState.lastSyncTime = new Date().toISOString();
            syncState.syncErrors = 0;
            localStorage.setItem('lastSyncTime', syncState.lastSyncTime);
            
            console.log('✅ Daten erfolgreich in GitHub Gist gespeichert');
            updateSyncStatusDisplay('✅ Synchronisiert', 'success');
            updateSyncStatus();
            return true;
        } else {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(`GitHub API Error: ${response.status} - ${errorData.message || 'Unknown error'}`);
        }
    } catch (error) {
        console.error('⚠️ Fehler beim Speichern in Gist:', error);
        syncState.syncErrors++;
        updateSyncStatusDisplay('⚠️ Sync Fehler', 'error');
        
        if (error.message.includes('INVALID_TOKEN')) {
            showNotification('🔑 GitHub Token ungültig! Bitte neuen Token in den Einstellungen konfigurieren.', 'error');
        } else if (error.message.includes('NETWORK_ERROR')) {
            showNotification('📶 Keine Internetverbindung für Sync verfügbar.', 'warning');
        } else {
            showNotification(`⚠️ Sync Fehler: ${error.message}`, 'error');
        }
        
        return false;
    } finally {
        syncState.syncInProgress = false;
    }
}

async function testGitHubConnection() {
    if (!hasValidToken()) {
        console.log('⚠️ Kein gültiger GitHub Token');
        return { success: false, error: 'NO_TOKEN' };
    }

    try {
        const response = await fetch('https://api.github.com/user', {
            headers: {
                'Authorization': `token ${GITHUB_CONFIG.token}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });

        if (response.ok) {
            const userData = await response.json();
            console.log('✅ GitHub API Connected as:', userData.login);
            return { success: true, user: userData.login };
        } else if (response.status === 401) {
            console.log('⚠️ GitHub Token ungültig oder abgelaufen');
            return { success: false, error: 'INVALID_TOKEN' };
        } else {
            console.log('⚠️ GitHub API Fehler:', response.status);
            return { success: false, error: 'API_ERROR' };
        }
    } catch (error) {
        console.log('⚠️ Netzwerk-Fehler:', error.message);
        return { success: false, error: 'NETWORK_ERROR' };
    }
}

function getDeviceInfo() {
    const ua = navigator.userAgent;
    if (ua.includes('iPhone')) return 'iPhone';
    if (ua.includes('iPad')) return 'iPad';
    if (ua.includes('Android')) return 'Android';
    if (ua.includes('Windows')) return 'Windows PC';
    if (ua.includes('Mac')) return 'Mac';
    return 'Unbekanntes Gerät';
}

// ============= MANUAL SYNC ============= 
async function manualSync() {
    if (!navigator.onLine) {
        showNotification('📶 Keine Internetverbindung verfügbar!', 'warning');
        return;
    }

    const syncBtn = document.getElementById('sync-btn');
    const originalHTML = syncBtn ? syncBtn.innerHTML : '';
    
    if (syncBtn) {
        syncBtn.innerHTML = '<span class="nav-icon">⏳</span>Sync...';
        syncBtn.disabled = true;
    }
    
    try {
        console.log('🔄 Manuelle Synchronisation gestartet...');
        
        const connectionTest = await testGitHubConnection();
        if (!connectionTest.success) {
            throw new Error(`GitHub Verbindung fehlgeschlagen: ${connectionTest.error}`);
        }

        let changesMade = false;
        
        if (!GITHUB_CONFIG.gistId) {
            console.log('🔍 Suche nach existierendem Gist...');
            await findExistingGist();
        }
        
        console.log('💾 Speichere aktuelle Daten in Cloud...');
        const saved = await saveDataToGist();
        if (saved) {
            changesMade = true;
            console.log('✅ Lokale Daten erfolgreich in Cloud gespeichert');
        }
        
        if (changesMade) {
            if (syncBtn) syncBtn.innerHTML = '<span class="nav-icon">✅</span>Sync!';
            showNotification('🔄 Erfolgreich synchronisiert! Daten sind jetzt auf allen Geräten aktuell.', 'success');
        } else {
            if (syncBtn) syncBtn.innerHTML = '<span class="nav-icon">💾</span>Aktuell';
            showNotification('💾 Sync erfolgreich - Daten sind auf dem neuesten Stand.', 'info');
        }
        
    } catch (error) {
        console.error('⚠️ Sync fehlgeschlagen:', error);
        if (syncBtn) syncBtn.innerHTML = '<span class="nav-icon">⚠️</span>Fehler';
        
        if (error.message.includes('INVALID_TOKEN')) {
            showNotification('🔑 GitHub Token ungültig oder abgelaufen!\n\nBitte erstellen Sie einen neuen Token unter:\ngithub.com/settings/tokens', 'error');
        } else if (error.message.includes('NETWORK_ERROR')) {
            showNotification('📶 Netzwerk-Fehler: Überprüfen Sie Ihre Internetverbindung.', 'warning');
        } else {
            showNotification(`⚠️ Synchronisation fehlgeschlagen:\n${error.message}`, 'error');
        }
    } finally {
        setTimeout(() => {
            if (syncBtn) {
                syncBtn.innerHTML = originalHTML;
                syncBtn.disabled = false;
            }
        }, 3000);
    }
}

// ============= APP RESUME HANDLER =============
async function checkForUpdatesOnResume() {
    if (!navigator.onLine || !hasValidToken()) {
        return;
    }

    try {
        updateSyncStatusDisplay('🔄 Prüfe Updates...', 'syncing');
        
        const cloudData = await getCurrentCloudData();
        
        if (cloudData) {
            const cloudTimestamp = new Date(cloudData.lastUpdated).getTime();
            const currentDataTimestamp = appData.lastUpdated ? new Date(appData.lastUpdated).getTime() : 0;
            
            if (cloudTimestamp > currentDataTimestamp) {
                console.log('📥 Neue Cloud-Daten gefunden - aktualisiere App...');
                
                await loadDataFromGist();
                
                renderAllContent();
                calculateAll();
                updateDashboard();
                
                showNotification('🔄 App aktualisiert!\n\nNeue Änderungen vom anderen Gerät wurden geladen.', 'success');
                updateSyncStatusDisplay('✅ Aktualisiert', 'success');
            } else {
                console.log('✅ Daten sind aktuell');
                updateSyncStatusDisplay('✅ Aktuell', 'success');
            }
        } else {
            updateSyncStatusDisplay('⚠️ Prüfung fehlgeschlagen', 'warning');
        }
        
    } catch (error) {
        console.error('⚠️ Fehler beim Prüfen auf Updates:', error);
        updateSyncStatusDisplay('⚠️ Update-Check failed', 'warning');
    }
}

async function getCurrentCloudData() {
    if (!hasValidToken() || !GITHUB_CONFIG.gistId) {
        return null;
    }

    try {
        const response = await fetch(`https://api.github.com/gists/${GITHUB_CONFIG.gistId}`, {
            headers: {
                'Authorization': `token ${GITHUB_CONFIG.token}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });

        if (response.ok) {
            const gistData = await response.json();
            
            if (gistData.files && gistData.files[GITHUB_CONFIG.filename]) {
                const fileContent = gistData.files[GITHUB_CONFIG.filename].content;
                return JSON.parse(fileContent);
            }
        }
        
        return null;
    } catch (error) {
        console.error('Fehler beim Laden der Cloud-Daten für Update-Check:', error);
        return null;
    }
}
