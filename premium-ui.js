// ============= SWISS FINANCE PREMIUM UI ADDON =============
// Erweitert die bestehende app.js mit Premium Features
// Einfach NACH app.js laden in index.html

(function() {
    'use strict';
    
    console.log('🎨 Premium UI Addon geladen');
    
    // ============= DARK MODE =============
    class DarkModeManager {
        constructor() {
            this.darkMode = localStorage.getItem('darkMode') === 'true';
            this.init();
        }
        
        init() {
            if (this.darkMode) {
                document.documentElement.setAttribute('data-theme', 'dark');
            }
            this.addToggleToSidebar();
        }
        
        toggle() {
            this.darkMode = !this.darkMode;
            localStorage.setItem('darkMode', this.darkMode);
            
            if (this.darkMode) {
                document.documentElement.setAttribute('data-theme', 'dark');
            } else {
                document.documentElement.removeAttribute('data-theme');
            }
        }
        
        addToggleToSidebar() {
            const sidebar = document.querySelector('.desktop-sidebar');
            if (!sidebar) return;
            
            const toggleHTML = `
                <div class="theme-toggle" id="theme-toggle">
                    <span class="theme-toggle-label">
                        <span id="theme-icon">${this.darkMode ? '🌙' : '☀️'}</span>
                        Dark Mode
                    </span>
                    <div class="theme-toggle-switch"></div>
                </div>
            `;
            
            const profileBox = sidebar.querySelector('.profile-box');
            if (profileBox) {
                profileBox.insertAdjacentHTML('afterend', toggleHTML);
                
                document.getElementById('theme-toggle').addEventListener('click', () => {
                    this.toggle();
                    document.getElementById('theme-icon').textContent = this.darkMode ? '🌙' : '☀️';
                });
            }
        }
    }
    
    // ============= PROFILE & KONTEN TAB =============
    function renderProfilesTab(app) {
        const data = app.state.data;
        
        const profiles = [
            { 
                id: 'sven', 
                name: 'Sven', 
                icon: '👤',
                emoji: '💼',
                color: '--info'
            },
            { 
                id: 'franzi', 
                name: 'Franzi', 
                icon: '👤',
                emoji: '🌸',
                color: '--warning'
            },
            { 
                id: 'family', 
                name: 'Familie', 
                icon: '👥',
                emoji: '🏠',
                color: '--success'
            }
        ];
        
        const getProfileStats = (profileId) => {
            const profile = data.profiles[profileId];
            const account = data.accounts[profileId];
            
            const income = profile.income || 0;
            const balance = account.balance || 0;
            
            // Ausgaben für dieses Profil
            const expenses = data.expenses
                .filter(e => e.active && e.account === profileId)
                .reduce((sum, e) => sum + e.amount, 0);
            
            // Verfügbar berechnen
            const available = app.state.getCurrentBalance ? 
                (profileId === data.currentProfile ? app.state.getCurrentBalance() : balance) : 
                balance;
            
            return { income, balance, expenses, available };
        };
        
        return `
            <div style="margin-bottom: 24px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 32px;">
                    <div>
                        <h2 style="font-size: 28px; font-weight: 800; color: var(--text-primary); margin: 0; letter-spacing: -0.5px;">
                            👥 Profile & Konten
                        </h2>
                        <p style="color: var(--text-tertiary); font-size: 14px; margin-top: 8px;">
                            Verwalten Sie Ihre 3 Konten und übertragen Sie Geld
                        </p>
                    </div>
                    <button class="btn btn-gold" onclick="alert('Transfer-Feature kommt!')">
                        💸 Geld übertragen
                    </button>
                </div>
                
                <div class="dashboard-grid">
                    ${profiles.map(profile => {
                        const stats = getProfileStats(profile.id);
                        const isActive = profile.id === data.currentProfile;
                        
                        return `
                            <div class="account-card ${isActive ? 'active-profile' : ''}" 
                                 style="cursor: pointer; ${isActive ? 'border: 2px solid var(--gold);' : ''}"
                                 onclick="app.switchProfile('${profile.id}')">
                                <div class="account-header">
                                    <div>
                                        <div style="font-size: 32px; margin-bottom: 8px;">${profile.emoji}</div>
                                        <div class="account-title">${profile.name}</div>
                                        <div style="font-size: 11px; color: var(--text-tertiary); margin-top: 4px;">
                                            ${data.accounts[profile.id].name}
                                        </div>
                                    </div>
                                    ${isActive ? `
                                        <div style="background: var(--gold); color: var(--navy-900); padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 700; text-transform: uppercase;">
                                            Aktiv
                                        </div>
                                    ` : ''}
                                </div>
                                
                                <div style="margin: 24px 0;">
                                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                                        <div>
                                            <div style="font-size: 11px; color: var(--text-tertiary); margin-bottom: 4px; font-weight: 600;">
                                                💰 KONTOSTAND
                                            </div>
                                            <div style="font-size: 24px; font-weight: 700; color: var(--text-primary);">
                                                CHF ${stats.balance.toLocaleString()}
                                            </div>
                                        </div>
                                        <div>
                                            <div style="font-size: 11px; color: var(--text-tertiary); margin-bottom: 4px; font-weight: 600;">
                                                📊 EINKOMMEN
                                            </div>
                                            <div style="font-size: 24px; font-weight: 700; color: var(--success);">
                                                CHF ${stats.income.toLocaleString()}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                <div style="padding-top: 16px; border-top: 1px solid var(--glass-border);">
                                    <div style="display: flex; justify-content: space-between; align-items: center; font-size: 13px;">
                                        <span style="color: var(--text-tertiary); font-weight: 500;">Monatliche Ausgaben</span>
                                        <span style="color: var(--error); font-weight: 700;">CHF ${stats.expenses.toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
                
                <div class="glass-card" style="margin-top: 32px; padding: 24px;">
                    <h3 style="font-size: 18px; font-weight: 700; margin-bottom: 16px; color: var(--text-primary);">
                        💡 Wie funktioniert das Multi-Konto-System?
                    </h3>
                    <div style="font-size: 14px; color: var(--text-secondary); line-height: 1.8;">
                        <p style="margin-bottom: 12px;">
                            <strong>• Sven & Franzi:</strong> Persönliche Konten für individuelle Einnahmen und Ausgaben
                        </p>
                        <p style="margin-bottom: 12px;">
                            <strong>• Familie:</strong> Gemeinsames Konto für Haushaltsausgaben
                        </p>
                        <p style="margin-bottom: 12px;">
                            <strong>• Transfers:</strong> Überweisen Sie Geld zwischen den Konten, z.B. von Sven → Familie
                        </p>
                        <p style="margin-bottom: 12px;">
                            <strong>• Profile wechseln:</strong> Klicken Sie auf ein Profil oder nutzen Sie das Dropdown in der Sidebar
                        </p>
                        <p>
                            <strong>• Namen anpassen:</strong> Klicken Sie auf das Stift-Symbol um Namen zu personalisieren
                        </p>
                    </div>
                </div>
            </div>
        `;
    }
    
    // ============= VERBESSERTES DASHBOARD =============
    function renderPremiumDashboard(app) {
        const data = app.state.data;
        const profile = data.currentProfile;
        const profileData = data.profiles[profile];
        const accountData = data.accounts[profile];
        
        const balance = app.state.getCurrentBalance();
        const salary = profileData.income;
        
        const activeExpenses = data.expenses
            .filter(e => e.active && e.account === profile)
            .reduce((sum, e) => sum + e.amount, 0);
        
        const activeDebts = data.debts
            .filter(d => d.account === profile)
            .reduce((sum, d) => sum + d.amount, 0);
        
        const savings = data.expenses
            .filter(e => e.active && e.account === profile && 
                   (e.category.includes('Säule') || e.category.includes('ETF') || e.category.includes('Sparkonto')))
            .reduce((sum, e) => sum + e.amount, 0);
        
        const savingsRate = salary > 0 ? ((savings / salary) * 100).toFixed(1) : 0;
        
        const profileName = profile === 'sven' ? 'Sven' : profile === 'franzi' ? 'Franzi' : 'Familie';
        const profileEmoji = profile === 'sven' ? '👨‍💼' : profile === 'franzi' ? '👩‍💼' : '👨‍👩‍👧‍👦';
        
        return `
            <div style="margin-bottom: 32px;">
                <h2 style="font-size: 32px; font-weight: 800; color: var(--text-primary); margin: 0; letter-spacing: -1px; display: flex; align-items: center; gap: 12px;">
                    Willkommen zurück, ${profileName}! ${profileEmoji}
                </h2>
                <p style="color: var(--text-tertiary); font-size: 14px; margin-top: 8px;">
                    Hier ist Ihre finanzielle Übersicht für ${profileName.toLowerCase()}
                </p>
            </div>
            
            <!-- Hauptmetriken -->
            <div class="dashboard-grid" style="margin-bottom: 32px;">
                <div class="account-card">
                    <div class="account-header">
                        <span class="account-title">💳 Kontostand</span>
                        <span class="account-icon">💰</span>
                    </div>
                    <div class="account-balance-hero">CHF ${accountData.balance.toLocaleString()}</div>
                    <div class="account-details">${accountData.name}</div>
                </div>
                
                <div class="account-card">
                    <div class="account-header">
                        <span class="account-title">✅ Verfügbar</span>
                        <span class="account-icon">📊</span>
                    </div>
                    <div class="account-balance-hero" style="color: ${balance >= 0 ? 'var(--success)' : 'var(--error)'};">
                        CHF ${balance.toLocaleString()}
                    </div>
                    <div class="account-details">Pro Monat nach Ausgaben</div>
                </div>
                
                <div class="account-card">
                    <div class="account-header">
                        <span class="account-title">📉 Ausgaben</span>
                        <span class="account-icon">💸</span>
                    </div>
                    <div class="account-balance-hero" style="color: var(--error);">
                        CHF ${activeExpenses.toLocaleString()}
                    </div>
                    <div class="account-details">Monatliche Fixkosten</div>
                </div>
                
                <div class="account-card">
                    <div class="account-header">
                        <span class="account-title">📋 Schulden</span>
                        <span class="account-icon">⚠️</span>
                    </div>
                    <div class="account-balance-hero" style="color: ${activeDebts > 0 ? 'var(--warning)' : 'var(--success)'};">
                        CHF ${activeDebts.toLocaleString()}
                    </div>
                    <div class="account-details">
                        ${data.debts.filter(d => d.account === profile).length} Offene Positionen
                    </div>
                </div>
            </div>
            
            <!-- Finanz-Zusammenfassung -->
            <div class="glass-card" style="margin-bottom: 32px;">
                <h3 style="font-size: 20px; font-weight: 700; margin-bottom: 24px; color: var(--text-primary); display: flex; align-items: center; gap: 8px;">
                    📊 Finanz-Zusammenfassung
                </h3>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 24px;">
                    <div>
                        <div style="font-size: 12px; color: var(--text-tertiary); margin-bottom: 8px; font-weight: 600; text-transform: uppercase;">
                            Gesamteinkommen
                        </div>
                        <div style="font-size: 28px; font-weight: 800; color: var(--success);">
                            CHF ${salary.toLocaleString()}
                        </div>
                    </div>
                    <div>
                        <div style="font-size: 12px; color: var(--text-tertiary); margin-bottom: 8px; font-weight: 600; text-transform: uppercase;">
                            Gesamtausgaben
                        </div>
                        <div style="font-size: 28px; font-weight: 800; color: var(--error);">
                            CHF ${activeExpenses.toLocaleString()}
                        </div>
                    </div>
                    <div>
                        <div style="font-size: 12px; color: var(--text-tertiary); margin-bottom: 8px; font-weight: 600; text-transform: uppercase;">
                            Sparquote
                        </div>
                        <div style="font-size: 28px; font-weight: 800; color: ${savingsRate >= 20 ? 'var(--success)' : 'var(--warning)'};">
                            ${savingsRate}%
                        </div>
                    </div>
                    <div>
                        <div style="font-size: 12px; color: var(--text-tertiary); margin-bottom: 8px; font-weight: 600; text-transform: uppercase;">
                            Nettovermögen
                        </div>
                        <div style="font-size: 28px; font-weight: 800; color: var(--navy-700);">
                            CHF ${(accountData.balance - activeDebts).toLocaleString()}
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Schnellaktionen -->
            <div style="margin-bottom: 32px;">
                <h3 style="font-size: 20px; font-weight: 700; margin-bottom: 20px; color: var(--text-primary);">
                    ⚡ Schnellaktionen
                </h3>
                <div class="dashboard-actions">
                    <div class="action-card" onclick="app.switchTab('income')">
                        <div class="action-icon">💵</div>
                        <div class="action-label">Einnahmen</div>
                    </div>
                    <div class="action-card" onclick="app.switchTab('expenses')">
                        <div class="action-icon">💸</div>
                        <div class="action-label">Ausgabe</div>
                    </div>
                    <div class="action-card" onclick="app.switchTab('savings')">
                        <div class="action-icon">🏦</div>
                        <div class="action-label">Sparen</div>
                    </div>
                    <div class="action-card" onclick="app.switchTab('debts')">
                        <div class="action-icon">📋</div>
                        <div class="action-label">Schulden</div>
                    </div>
                </div>
            </div>
        `;
    }
    
    // ============= VERBESSERTES EINKOMMEN =============
    function renderPremiumIncome(app) {
        const data = app.state.data;
        const profile = data.currentProfile;
        const salary = data.profiles[profile].income;
        
        // Berechnungen
        const yearlyIncome = salary * 12;
        const monthlyIncome = salary;
        const dailyIncome = (salary * 12 / 365).toFixed(2);
        const hourlyIncome = (salary * 12 / 365 / 8).toFixed(2);
        
        // Zusätzliche Einnahmen
        const currentMonth = new Date().toISOString().slice(0, 7);
        const additionalThisMonth = data.additionalIncome
            .filter(i => i.account === profile && i.month === currentMonth)
            .reduce((sum, i) => sum + i.amount, 0);
        
        const profileName = profile === 'sven' ? 'Sven' : profile === 'franzi' ? 'Franzi' : 'die Familie';
        
        return `
            <div style="margin-bottom: 24px;">
                <h2 style="font-size: 28px; font-weight: 800; color: var(--text-primary); margin: 0; letter-spacing: -0.5px;">
                    💵 Monatliches Einkommen
                </h2>
                <p style="color: var(--text-tertiary); font-size: 14px; margin-top: 8px;">
                    Verwalten Sie Ihr Einkommen für ${profileName}
                </p>
            </div>
            
            <!-- Haupteinkommen -->
            <div class="glass-card" style="margin-bottom: 32px; background: linear-gradient(135deg, var(--success-light) 0%, var(--success-light) 100%); border: 2px solid var(--success);">
                <div style="text-align: center; padding: 20px 0;">
                    <div style="font-size: 14px; color: var(--success-dark); font-weight: 600; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px;">
                        Aktuelles monatliches Einkommen
                    </div>
                    <div style="font-size: 56px; font-weight: 900; color: var(--success-dark); letter-spacing: -2px; margin-bottom: 16px;">
                        CHF ${monthlyIncome.toLocaleString()}
                    </div>
                    <button class="btn btn-success" onclick="app.showEditIncomeModal()">
                        ✏️ Einkommen bearbeiten
                    </button>
                </div>
            </div>
            
            <!-- Einkommens-Breakdown -->
            <div class="dashboard-grid" style="margin-bottom: 32px;">
                <div class="metric-card">
                    <div style="font-size: 28px; margin-bottom: 12px;">📊</div>
                    <div class="metric-label">Jährliches Einkommen</div>
                    <div class="metric-value positive">CHF ${yearlyIncome.toLocaleString()}</div>
                    <div style="font-size: 12px; color: var(--text-tertiary); margin-top: 8px;">
                        (${monthlyIncome.toLocaleString()} × 12 Monate)
                    </div>
                </div>
                
                <div class="metric-card">
                    <div style="font-size: 28px; margin-bottom: 12px;">📅</div>
                    <div class="metric-label">Tägliches Einkommen</div>
                    <div class="metric-value positive">CHF ${dailyIncome}</div>
                    <div style="font-size: 12px; color: var(--text-tertiary); margin-top: 8px;">
                        (Ø 6 Arbeitstage)
                    </div>
                </div>
                
                <div class="metric-card">
                    <div style="font-size: 28px; margin-bottom: 12px;">⏰</div>
                    <div class="metric-label">Stündlicher Lohn</div>
                    <div class="metric-value positive">CHF ${hourlyIncome}</div>
                    <div style="font-size: 12px; color: var(--text-tertiary); margin-top: 8px;">
                        (176 Monat • 2080h/Jahr)
                    </div>
                </div>
            </div>
            
            ${salary > 0 ? `
                <div class="glass-card" style="margin-bottom: 32px; background: var(--info-light); border: 1px solid var(--info);">
                    <div style="display: flex; align-items: center; gap: 16px;">
                        <div style="font-size: 40px;">💡</div>
                        <div>
                            <div style="font-weight: 700; color: var(--info-dark); margin-bottom: 4px;">
                                Hinweis: Der 13. Gehalt wird beim Monatsabschluss automatisch hinzugefügt, wenn Sie es erhalten haben.
                            </div>
                            <div style="font-size: 13px; color: var(--info-dark); opacity: 0.8;">
                                Geben Sie Ihr 13. Monatslohn als "Zusätzliche Einnahme" ein, sobald Sie es erhalten.
                            </div>
                        </div>
                    </div>
                </div>
            ` : ''}
            
            <!-- Zusätzliche Einnahmen -->
            <div class="expense-section">
                <div class="section-header">
                    <h3 class="section-title">✨ Zusätzliche Einnahmen (${new Date().toLocaleDateString('de-CH', { month: 'long', year: 'numeric' })})</h3>
                    <button class="add-button" onclick="app.showAddAdditionalIncomeModal()">
                        + Hinzufügen
                    </button>
                </div>
                
                ${additionalThisMonth > 0 ? `
                    <div style="background: var(--success-light); padding: 16px; border-radius: 12px; margin-bottom: 16px; border: 1px solid var(--success);">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <div>
                                <div style="font-size: 12px; color: var(--success-dark); font-weight: 600; text-transform: uppercase; margin-bottom: 4px;">
                                    Zusätzliche Einnahmen diesen Monat
                                </div>
                                <div style="font-size: 24px; font-weight: 800; color: var(--success-dark);">
                                    CHF ${additionalThisMonth.toLocaleString()}
                                </div>
                            </div>
                            <div style="font-size: 32px;">💰</div>
                        </div>
                    </div>
                ` : ''}
                
                ${data.additionalIncome.filter(i => i.account === profile && i.month === currentMonth).length > 0 ? 
                    data.additionalIncome
                        .filter(i => i.account === profile && i.month === currentMonth)
                        .map(income => `
                            <div class="expense-item">
                                <div class="expense-header">
                                    <div class="expense-info">
                                        <div class="expense-name">${income.type}</div>
                                        <div class="expense-category">
                                            ${income.description || 'Keine Beschreibung'}
                                        </div>
                                    </div>
                                    <div class="expense-amount" style="color: var(--success);">
                                        +CHF ${income.amount.toLocaleString()}
                                    </div>
                                    <div class="expense-actions">
                                        <button class="action-btn delete" onclick="app.deleteAdditionalIncome(${income.id})" title="Löschen">
                                            🗑️
                                        </button>
                                    </div>
                                </div>
                            </div>
                        `).join('') 
                    : '<p style="text-align: center; color: var(--text-tertiary); padding: 40px 0;">Keine zusätzlichen Einnahmen für diesen Monat erfasst.</p>'
                }
            </div>
            
            <!-- Tipps -->
            <div class="glass-card" style="margin-top: 32px;">
                <h3 style="font-size: 18px; font-weight: 700; margin-bottom: 16px; color: var(--text-primary);">
                    💡 Tipp: Geben Sie Ihr Netto-Gehalt (nach Abzug von Steuern und Sozialversicherung) ein, um Ihren verfügbaren Mittel genau zu berechnen.
                </h3>
                <div style="font-size: 14px; color: var(--text-secondary); line-height: 1.8;">
                    <p>Berücksichtigen Sie dabei bereits von Lohn abgezogene Steuern, Krankenversicherung, Pensionskasse etc.</p>
                </div>
            </div>
        `;
    }
    
    // ============= INTEGRATION =============
    // Warte bis app geladen ist
    const checkApp = setInterval(() => {
        if (typeof app !== 'undefined' && app.state) {
            clearInterval(checkApp);
            
            // Dark Mode initialisieren
            window.darkModeManager = new DarkModeManager();
            
            // Originale Render-Funktion sichern
            const originalRender = app.render.bind(app);
            
            // Render-Funktion erweitern
            app.render = function() {
                originalRender();
                
                // Premium UI anwenden basierend auf aktuellem Tab
                const currentTab = this.currentTab;
                const content = document.getElementById('tab-content');
                
                if (currentTab === 'profiles') {
                    content.innerHTML = renderProfilesTab(this);
                } else if (currentTab === 'dashboard') {
                    content.innerHTML = renderPremiumDashboard(this);
                } else if (currentTab === 'income') {
                    content.innerHTML = renderPremiumIncome(this);
                }
            };
            
            // Initial render
            app.render();
            
            console.log('✅ Premium UI aktiv');
        }
    }, 100);
    
})();
