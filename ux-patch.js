// ============= UX OVERHAUL PATCH =============
// Replaces alert/confirm/prompt with modern UI
// Fixes double-deduction bug for fixed expenses
// Adds month-close wizard

(function() {
    'use strict';

    const waitForApp = setInterval(() => {
        if (typeof app === 'undefined' || !app.state) return;
        clearInterval(waitForApp);

        console.log('🎨 UX Overhaul loading...');

        // =============================================
        // 1. TOAST NOTIFICATION SYSTEM
        // =============================================
        
        // Create toast container
        const toastContainer = document.createElement('div');
        toastContainer.id = 'toast-container';
        toastContainer.style.cssText = `
            position: fixed;
            top: 16px;
            left: 50%;
            transform: translateX(-50%);
            z-index: 2000;
            display: flex;
            flex-direction: column;
            gap: 8px;
            pointer-events: none;
            width: calc(100% - 32px);
            max-width: 420px;
        `;
        document.body.appendChild(toastContainer);

        // Toast function - replaces alert()
        app.toast = function(message, type = 'success', duration = 2500) {
            const toast = document.createElement('div');
            
            const icons = { success: '✅', error: '❌', warning: '⚠️', info: '💡' };
            const colors = {
                success: { bg: 'var(--success-light)', border: 'var(--success)', text: 'var(--success-dark)' },
                error:   { bg: 'var(--error-light)',   border: 'var(--error)',   text: 'var(--error-dark)' },
                warning: { bg: 'var(--warning-light)', border: 'var(--warning)', text: 'var(--warning-dark)' },
                info:    { bg: 'var(--info-light)',     border: 'var(--info)',    text: 'var(--info-dark)' }
            };
            const c = colors[type] || colors.success;
            
            toast.style.cssText = `
                background: var(--bg-secondary);
                border: 1px solid ${c.border};
                border-left: 4px solid ${c.border};
                border-radius: 12px;
                padding: 14px 18px;
                display: flex;
                align-items: flex-start;
                gap: 10px;
                box-shadow: 0 8px 24px rgba(0,0,0,0.15);
                pointer-events: auto;
                opacity: 0;
                transform: translateY(-12px);
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                cursor: pointer;
                font-size: 14px;
                line-height: 1.5;
                color: var(--text-primary);
            `;
            
            toast.innerHTML = `
                <span style="font-size: 18px; flex-shrink: 0; line-height: 1;">${icons[type]}</span>
                <span style="flex: 1;">${message}</span>
            `;
            
            toast.onclick = () => dismissToast(toast);
            toastContainer.appendChild(toast);
            
            // Animate in
            requestAnimationFrame(() => {
                toast.style.opacity = '1';
                toast.style.transform = 'translateY(0)';
            });
            
            // Auto dismiss
            const timer = setTimeout(() => dismissToast(toast), duration);
            toast._timer = timer;
            
            function dismissToast(el) {
                clearTimeout(el._timer);
                el.style.opacity = '0';
                el.style.transform = 'translateY(-12px)';
                setTimeout(() => el.remove(), 300);
            }
            
            return toast;
        };

        // =============================================
        // 2. CONFIRM MODAL - replaces confirm()
        // =============================================
        
        app.confirmAction = function(title, message, onConfirm, options = {}) {
            const {
                confirmLabel = '✅ Bestätigen',
                cancelLabel = '↩ Abbrechen',
                danger = false
            } = options;
            
            this.showModal(title, `
                <div style="font-size: 14px; line-height: 1.7; color: var(--text-secondary); margin-bottom: 8px;">
                    ${message}
                </div>
            `, [
                { label: cancelLabel, action: 'app.closeModal()' },
                { label: confirmLabel, primary: true, action: `app._pendingConfirm()` }
            ]);
            
            // Dynamically attach the confirm callback
            app._pendingConfirm = () => {
                app.closeModal();
                onConfirm();
            };
            
            // Style danger button if needed
            if (danger) {
                requestAnimationFrame(() => {
                    const btns = document.querySelectorAll('.form-buttons .btn-primary');
                    const btn = btns[btns.length - 1];
                    if (btn) {
                        btn.style.background = 'var(--error)';
                        btn.style.color = 'white';
                    }
                });
            }
        };

        // =============================================
        // 3. BUG FIX: EXPENSE BALANCE HANDLING
        // Fixed: Only variable expenses affect balance immediately
        // Fixed expenses are handled exclusively at month close
        // =============================================

        app.saveExpenseFromModal = function(type) {
            const name = document.getElementById('exp-name').value.trim();
            const amount = parseFloat(document.getElementById('exp-amount').value);
            const category = document.getElementById('exp-category').value;

            if (!name || !amount || !category) {
                app.toast('Bitte alle Felder ausfüllen', 'warning');
                return;
            }

            this.state.update(data => {
                data.expenses.push({
                    id: Date.now(),
                    name,
                    amount,
                    category,
                    type,
                    account: data.currentProfile,
                    active: true,
                    date: new Date().toISOString()
                });

                // BUG FIX: Only variable expenses reduce balance immediately
                // Fixed expenses are recurring → deducted at month close
                if (type === 'variable') {
                    data.accounts[data.currentProfile].balance -= amount;
                }
            });

            this.closeModal();
            app.toast(`${type === 'fixed' ? 'Fixe' : 'Variable'} Ausgabe "${name}" hinzugefügt (CHF ${amount.toLocaleString()})`);
        };

        app.updateExpenseFromModal = function(id) {
            const name = document.getElementById('exp-name').value.trim();
            const amount = parseFloat(document.getElementById('exp-amount').value);
            const category = document.getElementById('exp-category').value;

            if (!name || !amount || !category) {
                app.toast('Bitte alle Felder ausfüllen', 'warning');
                return;
            }

            this.state.update(data => {
                const exp = data.expenses.find(e => e.id === id);
                if (exp) {
                    // BUG FIX: Only adjust balance for variable expenses
                    if (exp.type === 'variable') {
                        const diff = amount - exp.amount;
                        data.accounts[exp.account].balance -= diff;
                    }
                    exp.name = name;
                    exp.amount = amount;
                    exp.category = category;
                }
            });

            this.closeModal();
            app.toast(`Ausgabe "${name}" aktualisiert`);
        };

        app.deleteExpense = function(id) {
            const exp = this.state.data.expenses.find(e => e.id === id);
            if (!exp) return;

            app.confirmAction(
                '🗑️ Ausgabe löschen',
                `<strong>"${exp.name}"</strong> (CHF ${exp.amount.toLocaleString()}) wirklich löschen?`,
                () => {
                    this.state.update(data => {
                        const e = data.expenses.find(e => e.id === id);
                        if (e) {
                            // BUG FIX: Only refund variable expenses
                            if (e.type === 'variable') {
                                data.accounts[e.account].balance += e.amount;
                            }
                        }
                        data.expenses = data.expenses.filter(e => e.id !== id);
                    });
                    app.toast('Ausgabe gelöscht');
                },
                { confirmLabel: '🗑️ Löschen', danger: true }
            );
        };

        // =============================================
        // 4. MONTH-CLOSE WIZARD (multi-step modal)
        // =============================================

        app.closeMonth = function() {
            const profile = this.state.data.currentProfile;

            if (profile === 'family') {
                app.toast('Bitte wechseln Sie zu Sven oder Franzi', 'warning');
                return;
            }

            // Gather data for wizard
            const data = this.state.data;
            const currentMonth = new Date().toISOString().slice(0, 7);
            const monthName = new Date().toLocaleDateString('de-CH', { month: 'long', year: 'numeric' });

            const additionalIncome = data.additionalIncome
                .filter(i => i.account === profile && i.month === currentMonth)
                .reduce((sum, i) => sum + i.amount, 0);

            const fixedExpenses = this.state.filterByProfile(data.expenses)
                .filter(e => e.active && e.type === 'fixed')
                .reduce((sum, e) => sum + e.amount, 0);

            const variableExpenses = this.state.filterByProfile(data.expenses)
                .filter(e => e.active && e.type === 'variable')
                .reduce((sum, e) => sum + e.amount, 0);

            const pillar3aExpenses = this.state.filterByProfile(data.expenses)
                .filter(e => e.active && e.category === 'Säule 3a')
                .reduce((sum, e) => sum + e.amount, 0);

            const lastFundValue = data.savings.pillar3a.fundValues
                .filter(fv => fv.profile === profile)
                .sort((a, b) => new Date(b.date) - new Date(a.date))[0];
            const previousFundValue = lastFundValue ? lastFundValue.value : 0;

            const defaultSalary = data.profiles[profile].income || '';

            // Store wizard state
            app._wizard = {
                profile,
                monthName,
                currentMonth,
                additionalIncome,
                fixedExpenses,
                variableExpenses,
                pillar3aExpenses,
                previousFundValue,
                step: 1,
                salary: null,
                fundValue: null
            };

            this._renderWizardStep1(defaultSalary);
        };

        // Step 1: Salary input
        app._renderWizardStep1 = function(defaultSalary) {
            const w = this._wizard;
            this.showModal(`📅 Monatsabschluss – Schritt 1/3`, `
                <div style="text-align: center; margin-bottom: 20px;">
                    <div style="font-size: 13px; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 0.5px;">Monat</div>
                    <div style="font-size: 22px; font-weight: 700; margin-top: 4px;">${w.monthName}</div>
                </div>

                <div class="form-row">
                    <label class="form-label">💰 Ihr tatsächliches Gehalt diesen Monat (CHF)</label>
                    <input type="number" id="wizard-salary" class="form-input" 
                           value="${defaultSalary}" placeholder="z.B. 6500" 
                           style="font-size: 24px; font-weight: 700; text-align: center;" autofocus>
                </div>

                ${w.additionalIncome > 0 ? `
                    <div class="info-box success">
                        ✨ <strong>Zusätzliche Einnahmen:</strong> CHF ${w.additionalIncome.toLocaleString()}<br>
                        <small>Werden automatisch berücksichtigt</small>
                    </div>
                ` : ''}

                <div style="display: flex; justify-content: space-between; margin-top: 20px; padding-top: 16px; border-top: 1px solid var(--glass-border);">
                    <div style="font-size: 13px; color: var(--text-tertiary);">
                        🏢 Fixkosten: CHF ${w.fixedExpenses.toLocaleString()}<br>
                        🛒 Variable: CHF ${w.variableExpenses.toLocaleString()}
                    </div>
                    <div style="text-align: right; font-size: 13px; color: var(--text-tertiary);">
                        Schritt 1 von 3
                    </div>
                </div>
            `, [
                { label: '↩ Abbrechen', action: 'app.closeModal()' },
                { label: 'Weiter →', primary: true, action: 'app._wizardStep2()' }
            ]);
        };

        // Step 2: Fund value input
        app._wizardStep2 = function() {
            const salary = parseFloat(document.getElementById('wizard-salary').value);
            if (!salary || salary <= 0) {
                app.toast('Bitte geben Sie Ihr Gehalt ein', 'warning');
                return;
            }
            this._wizard.salary = salary;

            const w = this._wizard;
            this.showModal(`🏛️ Monatsabschluss – Schritt 2/3`, `
                <div style="text-align: center; margin-bottom: 20px;">
                    <div style="font-size: 13px; color: var(--text-tertiary); text-transform: uppercase;">Säule 3a Fondswert</div>
                </div>

                <div class="form-row">
                    <label class="form-label">📈 Aktueller Fondswert (CHF)</label>
                    <input type="number" id="wizard-fund" class="form-input" 
                           value="${w.previousFundValue || ''}" placeholder="z.B. 6830" step="10"
                           style="font-size: 24px; font-weight: 700; text-align: center;" autofocus>
                    <small style="color: var(--text-tertiary); font-size: 12px; margin-top: 6px; display: block;">
                        Letzter bekannter Wert: CHF ${w.previousFundValue.toLocaleString()}
                    </small>
                </div>

                ${w.pillar3aExpenses > 0 ? `
                    <div class="info-box info">
                        💰 <strong>Monatliche Einzahlung:</strong> CHF ${w.pillar3aExpenses.toLocaleString()}<br>
                        <small>Wird automatisch für ${new Date().getFullYear()} eingetragen</small>
                    </div>
                ` : `
                    <div class="info-box warning">
                        ⚠️ Keine Säule 3a Ausgabe gefunden. Falls Sie monatlich einzahlen, tragen Sie diese als fixe Ausgabe ein.
                    </div>
                `}

                <div style="text-align: right; margin-top: 16px; font-size: 13px; color: var(--text-tertiary);">
                    Schritt 2 von 3
                </div>
            `, [
                { label: '← Zurück', action: 'app._renderWizardStep1(' + w.salary + ')' },
                { label: 'Weiter →', primary: true, action: 'app._wizardStep3()' }
            ]);
        };

        // Step 3: Summary & Confirm
        app._wizardStep3 = function() {
            const fundValue = parseFloat(document.getElementById('wizard-fund').value);
            if (fundValue === null || isNaN(fundValue) || fundValue < 0) {
                app.toast('Bitte geben Sie einen gültigen Fondswert ein', 'warning');
                return;
            }
            this._wizard.fundValue = fundValue;

            const w = this._wizard;
            const totalIncome = w.salary + w.additionalIncome;
            const totalExpenses = w.fixedExpenses + w.variableExpenses;
            const surplus = totalIncome - totalExpenses;

            // Fund performance
            let performance = 0;
            let performancePercent = 0;
            if (w.previousFundValue > 0) {
                performance = w.fundValue - w.previousFundValue - w.pillar3aExpenses;
                performancePercent = (performance / w.previousFundValue) * 100;
            }

            // Store calculated values
            w.totalIncome = totalIncome;
            w.totalExpenses = totalExpenses;
            w.surplus = surplus;
            w.performance = performance;
            w.performancePercent = performancePercent;

            this.showModal(`📊 Monatsabschluss – Zusammenfassung`, `
                <div style="margin-bottom: 20px;">
                    <div style="text-align: center; font-size: 13px; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">
                        ${w.monthName}
                    </div>
                </div>

                <!-- Income -->
                <div style="background: var(--success-light); border: 1px solid var(--success); border-radius: 12px; padding: 16px; margin-bottom: 12px;">
                    <div style="font-size: 13px; font-weight: 600; color: var(--success-dark); margin-bottom: 8px;">💰 EINNAHMEN</div>
                    <div style="display: flex; justify-content: space-between; font-size: 14px; margin-bottom: 4px;">
                        <span>Gehalt</span>
                        <span style="font-weight: 600;">CHF ${w.salary.toLocaleString()}</span>
                    </div>
                    ${w.additionalIncome > 0 ? `
                        <div style="display: flex; justify-content: space-between; font-size: 14px; margin-bottom: 4px;">
                            <span>Zusätzlich</span>
                            <span style="font-weight: 600;">CHF ${w.additionalIncome.toLocaleString()}</span>
                        </div>
                    ` : ''}
                    <div style="display: flex; justify-content: space-between; font-size: 16px; font-weight: 700; padding-top: 8px; border-top: 1px solid var(--success); margin-top: 8px;">
                        <span>Gesamt</span>
                        <span>CHF ${totalIncome.toLocaleString()}</span>
                    </div>
                </div>

                <!-- Expenses -->
                <div style="background: var(--error-light); border: 1px solid var(--error); border-radius: 12px; padding: 16px; margin-bottom: 12px;">
                    <div style="font-size: 13px; font-weight: 600; color: var(--error-dark); margin-bottom: 8px;">💸 AUSGABEN</div>
                    <div style="display: flex; justify-content: space-between; font-size: 14px; margin-bottom: 4px;">
                        <span>Fixkosten</span>
                        <span style="font-weight: 600;">CHF ${w.fixedExpenses.toLocaleString()}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; font-size: 14px; margin-bottom: 4px;">
                        <span>Variable Kosten</span>
                        <span style="font-weight: 600;">CHF ${w.variableExpenses.toLocaleString()}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; font-size: 16px; font-weight: 700; padding-top: 8px; border-top: 1px solid var(--error); margin-top: 8px;">
                        <span>Gesamt</span>
                        <span>CHF ${totalExpenses.toLocaleString()}</span>
                    </div>
                </div>

                <!-- Surplus -->
                <div style="background: ${surplus >= 0 ? 'linear-gradient(135deg, var(--navy-800), var(--navy-900))' : 'linear-gradient(135deg, #e74c3c, #c0392b)'}; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 12px;">
                    <div style="font-size: 12px; color: rgba(255,255,255,0.7); text-transform: uppercase; letter-spacing: 0.5px;">Überschuss</div>
                    <div style="font-size: 32px; font-weight: 800; color: white; letter-spacing: -1px;">
                        ${surplus >= 0 ? '+' : ''}CHF ${surplus.toLocaleString()}
                    </div>
                    <div style="font-size: 12px; color: rgba(255,255,255,0.7); margin-top: 4px;">
                        wird zum Kontostand addiert
                    </div>
                </div>

                ${w.previousFundValue > 0 ? `
                    <!-- Fund Performance -->
                    <div style="background: ${performance >= 0 ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)'}; border: 1px solid ${performance >= 0 ? 'var(--success)' : 'var(--error)'}; border-radius: 12px; padding: 16px; margin-bottom: 12px;">
                        <div style="font-size: 13px; font-weight: 600; margin-bottom: 8px;">🏛️ SÄULE 3A</div>
                        <div style="display: flex; justify-content: space-between; font-size: 14px; margin-bottom: 4px;">
                            <span>Fondswert</span>
                            <span style="font-weight: 600;">${w.previousFundValue.toLocaleString()} → ${w.fundValue.toLocaleString()}</span>
                        </div>
                        ${w.pillar3aExpenses > 0 ? `
                            <div style="display: flex; justify-content: space-between; font-size: 14px; margin-bottom: 4px;">
                                <span>Einzahlung</span>
                                <span style="font-weight: 600;">CHF ${w.pillar3aExpenses.toLocaleString()}</span>
                            </div>
                        ` : ''}
                        <div style="display: flex; justify-content: space-between; font-size: 14px; font-weight: 700; padding-top: 8px; border-top: 1px solid var(--glass-border); margin-top: 8px;">
                            <span>Performance</span>
                            <span style="color: ${performance >= 0 ? 'var(--success)' : 'var(--error)'};">
                                ${performance >= 0 ? '+' : ''}${performance.toFixed(2)} CHF (${performancePercent >= 0 ? '+' : ''}${performancePercent.toFixed(2)}%)
                            </span>
                        </div>
                    </div>
                ` : ''}

                <!-- What happens -->
                <div class="info-box info">
                    <strong>Was passiert:</strong><br>
                    ✅ Überschuss → Kontostand<br>
                    🗑️ Variable Ausgaben werden gelöscht<br>
                    ${w.pillar3aExpenses > 0 ? `🏛️ CHF ${w.pillar3aExpenses.toLocaleString()} → Säule 3a (${new Date().getFullYear()})<br>` : ''}
                    📊 Eintrag in Vermögensverlauf
                </div>

                <div style="text-align: right; margin-top: 12px; font-size: 13px; color: var(--text-tertiary);">
                    Schritt 3 von 3
                </div>
            `, [
                { label: '← Zurück', action: 'app._wizardStep3Back()' },
                { label: '✅ Monat abschließen', primary: true, action: 'app._executeMonthClose()' }
            ]);
        };

        app._wizardStep3Back = function() {
            const w = this._wizard;
            // Go back to step 2, re-render
            this.showModal(`🏛️ Monatsabschluss – Schritt 2/3`, `
                <div style="text-align: center; margin-bottom: 20px;">
                    <div style="font-size: 13px; color: var(--text-tertiary); text-transform: uppercase;">Säule 3a Fondswert</div>
                </div>
                <div class="form-row">
                    <label class="form-label">📈 Aktueller Fondswert (CHF)</label>
                    <input type="number" id="wizard-fund" class="form-input" 
                           value="${w.fundValue || w.previousFundValue || ''}" placeholder="z.B. 6830" step="10"
                           style="font-size: 24px; font-weight: 700; text-align: center;" autofocus>
                    <small style="color: var(--text-tertiary); font-size: 12px; margin-top: 6px; display: block;">
                        Letzter bekannter Wert: CHF ${w.previousFundValue.toLocaleString()}
                    </small>
                </div>
                <div style="text-align: right; margin-top: 16px; font-size: 13px; color: var(--text-tertiary);">
                    Schritt 2 von 3
                </div>
            `, [
                { label: '← Zurück', action: 'app._renderWizardStep1(' + w.salary + ')' },
                { label: 'Weiter →', primary: true, action: 'app._wizardStep3()' }
            ]);
        };

        // Execute the actual month close
        app._executeMonthClose = function() {
            const w = this._wizard;
            const profile = w.profile;

            this.state.update(data => {
                // Save month data
                data.wealthHistory = data.wealthHistory.filter(h =>
                    !(h.month === w.monthName && h.profile === profile)
                );

                data.wealthHistory.push({
                    month: w.monthName,
                    date: new Date().toISOString(),
                    profile,
                    income: w.salary,
                    additionalIncome: w.additionalIncome,
                    expenses: w.totalExpenses,
                    balance: w.surplus,
                    totalBalance: data.accounts[profile].balance + w.surplus
                });

                // Add Säule 3a deposits
                if (w.pillar3aExpenses > 0) {
                    const now = new Date();
                    data.savings.pillar3a.deposits.push({
                        id: Date.now(),
                        amount: w.pillar3aExpenses,
                        year: now.getFullYear(),
                        date: now.toISOString(),
                        month: now.toLocaleDateString('de-CH', { month: 'long' }),
                        autoAdded: true
                    });
                }

                // Save fund value
                data.savings.pillar3a.fundValues.push({
                    id: Date.now() + 1,
                    profile,
                    value: w.fundValue,
                    deposit: w.pillar3aExpenses,
                    performance: w.performance,
                    performancePercent: w.performancePercent,
                    date: new Date().toISOString(),
                    month: w.monthName
                });

                // Delete variable expenses
                const beforeCount = data.expenses.length;
                data.expenses = data.expenses.filter(e =>
                    !(e.type === 'variable' && e.account === profile)
                );
                const deletedCount = beforeCount - data.expenses.length;

                // BUG FIX: Add surplus (income - ALL expenses) to balance
                // Variable expenses were already deducted when added
                // Fixed expenses are deducted HERE (once per month) → no double deduction
                // So: balance += salary + additional - fixedExpenses
                // (variable already reflected in balance)
                data.accounts[profile].balance += w.salary + w.additionalIncome - w.fixedExpenses;

                // Update income reference
                data.profiles[profile].income = w.salary;

                console.log(`✅ Monat abgeschlossen: ${deletedCount} variable Ausgaben gelöscht`);
            });

            this.closeModal();
            this._wizard = null;

            // Show success toast
            app.toast(
                `Monat abgeschlossen! ${w.surplus >= 0 ? '+' : ''}CHF ${w.surplus.toLocaleString()} Überschuss`,
                w.surplus >= 0 ? 'success' : 'warning',
                4000
            );
        };

        // =============================================
        // 5. REPLACE ALL OTHER alert/confirm CALLS
        // =============================================

        // Save Income
        const origSaveIncome = app.saveIncome.bind(app);
        app.saveIncome = function() {
            const input = document.getElementById('income-input');
            const amount = parseFloat(input.value);
            if (!amount || amount <= 0) {
                app.toast('Bitte geben Sie ein gültiges Gehalt ein', 'warning');
                return;
            }
            this.state.update(data => {
                data.profiles[data.currentProfile].income = amount;
            });
            app.toast(`Gehalt von CHF ${amount.toLocaleString()} gespeichert`);
        };

        // Save Additional Income
        app.saveAdditionalIncomeFromModal = function() {
            const name = document.getElementById('additional-income-name').value.trim();
            const amount = parseFloat(document.getElementById('additional-income-amount').value);
            const type = document.getElementById('additional-income-type').value;
            if (!name || !amount || !type) {
                app.toast('Bitte alle Felder ausfüllen', 'warning');
                return;
            }
            this.state.update(data => {
                data.additionalIncome.push({
                    id: Date.now(),
                    name, amount, type,
                    account: data.currentProfile,
                    month: new Date().toISOString().slice(0, 7),
                    date: new Date().toISOString()
                });
            });
            this.closeModal();
            app.toast(`CHF ${amount.toLocaleString()} Zusatzeinnahme "${name}" hinzugefügt`);
        };

        // Delete Additional Income
        app.deleteAdditionalIncome = function(id) {
            const entry = this.state.data.additionalIncome.find(i => i.id === id);
            const name = entry ? entry.name : 'Eintrag';
            app.confirmAction(
                '🗑️ Zusatzeinnahme löschen',
                `"<strong>${name}</strong>" wirklich löschen?`,
                () => {
                    this.state.update(data => {
                        data.additionalIncome = data.additionalIncome.filter(i => i.id !== id);
                    });
                    app.toast('Zusatzeinnahme gelöscht');
                },
                { confirmLabel: '🗑️ Löschen', danger: true }
            );
        };

        // Save Debt
        app.saveDebtFromModal = function() {
            const name = document.getElementById('debt-name').value.trim();
            const amount = parseFloat(document.getElementById('debt-amount').value);
            const type = document.getElementById('debt-type').value;
            const dueDate = document.getElementById('debt-date').value;
            if (!name || !amount || !type) {
                app.toast('Bitte alle Pflichtfelder ausfüllen', 'warning');
                return;
            }
            this.state.update(data => {
                data.debts.push({
                    id: Date.now(), name, amount, type, dueDate,
                    owner: data.currentProfile,
                    date: new Date().toISOString()
                });
            });
            this.closeModal();
            app.toast(`Schulden "${name}" (CHF ${amount.toLocaleString()}) hinzugefügt`);
        };

        app.updateDebtFromModal = function(id) {
            const name = document.getElementById('debt-name').value.trim();
            const amount = parseFloat(document.getElementById('debt-amount').value);
            const type = document.getElementById('debt-type').value;
            const dueDate = document.getElementById('debt-date').value;
            if (!name || !amount || !type) {
                app.toast('Bitte alle Pflichtfelder ausfüllen', 'warning');
                return;
            }
            this.state.update(data => {
                const debt = data.debts.find(d => d.id === id);
                if (debt) { debt.name = name; debt.amount = amount; debt.type = type; debt.dueDate = dueDate; }
            });
            this.closeModal();
            app.toast(`Schulden "${name}" aktualisiert`);
        };

        app.deleteDebt = function(id) {
            const debt = this.state.data.debts.find(d => d.id === id);
            const name = debt ? debt.name : 'Eintrag';
            app.confirmAction(
                '🗑️ Schulden löschen',
                `"<strong>${name}</strong>" wirklich löschen?`,
                () => {
                    this.state.update(data => {
                        data.debts = data.debts.filter(d => d.id !== id);
                    });
                    app.toast('Schulden gelöscht');
                },
                { confirmLabel: '🗑️ Löschen', danger: true }
            );
        };

        // Balance
        app.saveBalanceFromModal = function() {
            const balance = parseFloat(document.getElementById('balance-input').value);
            if (isNaN(balance)) {
                app.toast('Bitte geben Sie einen gültigen Betrag ein', 'warning');
                return;
            }
            this.state.update(data => {
                data.accounts[data.currentProfile].balance = balance;
            });
            this.closeModal();
            app.toast(`Kontostand auf CHF ${balance.toLocaleString()} aktualisiert`);
        };

        // Pillar 3a
        app.savePillar3aValueFromModal = function() {
            const value = parseFloat(document.getElementById('pillar-value').value);
            const profile = this.state.data.currentProfile;
            if (!value || value <= 0) {
                app.toast('Bitte geben Sie einen gültigen Fondswert ein', 'warning');
                return;
            }
            const myFundValues = this.state.data.savings.pillar3a.fundValues.filter(fv => fv.profile === profile);
            const lastFundValue = myFundValues.length > 0 ? myFundValues[myFundValues.length - 1] : null;
            const previousValue = lastFundValue ? lastFundValue.value : 0;
            const isFirstEntry = myFundValues.length === 0;
            const performance = isFirstEntry ? 0 : (value - previousValue);
            const performancePercent = isFirstEntry ? 0 : (previousValue > 0 ? (performance / previousValue) * 100 : 0);

            this.state.update(data => {
                data.savings.pillar3a.fundValues.push({
                    id: Date.now(), profile, value, deposit: 0,
                    performance, performancePercent,
                    date: new Date().toISOString(),
                    month: new Date().toLocaleDateString('de-CH', { month: 'long', year: 'numeric' }),
                    manual: true, isStartValue: isFirstEntry
                });
            });
            this.closeModal();
            if (isFirstEntry) {
                app.toast(`Startwert CHF ${value.toLocaleString()} gespeichert`, 'info');
            } else {
                app.toast(`Fondswert CHF ${value.toLocaleString()} (${performance >= 0 ? '+' : ''}${performance.toFixed(0)} CHF)`);
            }
        };

        app.savePillar3aDepositFromModal = function() {
            const amount = parseFloat(document.getElementById('deposit-amount').value);
            const month = document.getElementById('deposit-month').value.trim();
            if (!amount || amount <= 0) { app.toast('Bitte geben Sie einen gültigen Betrag ein', 'warning'); return; }
            if (!month) { app.toast('Bitte geben Sie einen Monat ein', 'warning'); return; }
            this.state.update(data => {
                data.savings.pillar3a.deposits.push({
                    id: Date.now(), amount, year: new Date().getFullYear(),
                    date: new Date().toISOString(), month, autoAdded: false
                });
            });
            this.closeModal();
            app.toast(`Einzahlung CHF ${amount.toLocaleString()} für ${month} hinzugefügt`);
        };

        // Investments
        app.saveInvestmentFromModal = function() {
            const name = document.getElementById('inv-name').value.trim();
            const invested = parseFloat(document.getElementById('inv-invested').value);
            const currentValue = parseFloat(document.getElementById('inv-value').value);
            const type = document.getElementById('inv-type').value;
            const amount = parseFloat(document.getElementById('inv-amount').value) || null;
            if (!name || !invested || !currentValue) {
                app.toast('Bitte alle Pflichtfelder ausfüllen', 'warning');
                return;
            }
            this.state.update(data => {
                const performance = ((currentValue - invested) / invested * 100);
                const profit = currentValue - invested;
                const investment = { id: Date.now(), name, invested, currentValue, type, performance, profit, account: data.currentProfile, date: new Date().toISOString() };
                if (amount !== null && amount > 0) investment.amount = amount;
                data.savings.investments.push(investment);
            });
            this.closeModal();
            app.toast(`Investment "${name}" hinzugefügt`);
        };

        app.updateInvestment = function(id) {
            const name = document.getElementById('inv-name').value.trim();
            const invested = parseFloat(document.getElementById('inv-invested').value);
            const currentValue = parseFloat(document.getElementById('inv-value').value);
            const type = document.getElementById('inv-type').value;
            const amount = parseFloat(document.getElementById('inv-amount').value) || null;
            if (!name || !invested || !currentValue) {
                app.toast('Bitte alle Felder ausfüllen', 'warning');
                return;
            }
            this.state.update(data => {
                const inv = data.savings.investments.find(i => i.id === id);
                if (inv) {
                    inv.name = name; inv.invested = invested; inv.currentValue = currentValue; inv.type = type;
                    if (amount !== null && amount > 0) inv.amount = amount;
                    else if (inv.amount !== undefined) delete inv.amount;
                    inv.performance = ((currentValue - invested) / invested * 100);
                    inv.profit = currentValue - invested;
                }
            });
            this.closeModal();
            app.toast(`Investment "${name}" aktualisiert`);
            this.render();
        };

        app.deleteInvestment = function(id) {
            const inv = this.state.data.savings.investments.find(i => i.id === id);
            const name = inv ? inv.name : 'Investment';
            app.confirmAction(
                '🗑️ Investment löschen',
                `"<strong>${name}</strong>" wirklich löschen?`,
                () => {
                    this.state.update(data => {
                        data.savings.investments = data.savings.investments.filter(i => i.id !== id);
                    });
                    app.toast('Investment gelöscht');
                },
                { confirmLabel: '🗑️ Löschen', danger: true }
            );
        };

        app.saveAddToInvestment = function(id) {
            const additionalAmount = parseFloat(document.getElementById('add-amount')?.value) || 0;
            const additionalInvested = parseFloat(document.getElementById('add-invested').value);
            const newCurrentValue = parseFloat(document.getElementById('add-current-value').value);
            if (!additionalInvested || additionalInvested <= 0) {
                app.toast('Bitte den zusätzlich investierten Betrag eingeben', 'warning'); return;
            }
            if (!newCurrentValue || newCurrentValue <= 0) {
                app.toast('Bitte den aktuellen Gesamtwert eingeben', 'warning'); return;
            }
            this.state.update(data => {
                const inv = data.savings.investments.find(i => i.id === id);
                if (!inv) return;
                if (additionalAmount > 0) inv.amount = (inv.amount || 0) + additionalAmount;
                inv.invested += additionalInvested;
                inv.currentValue = newCurrentValue;
                inv.profit = inv.currentValue - inv.invested;
                inv.performance = (inv.profit / inv.invested) * 100;
                if (!inv.history) inv.history = [];
                inv.history.push({ date: new Date().toISOString(), type: 'addition', amountAdded: additionalAmount, investedAdded: additionalInvested, totalInvested: inv.invested, totalValue: inv.currentValue, performance: inv.performance });
            });
            this.closeModal();
            app.toast(`Investment aufgestockt (+CHF ${additionalInvested.toLocaleString()})`);
            this.render();
        };

        // Food
        app.addFoodPurchase = function() {
            const shop = document.getElementById('food-shop').value.trim();
            const amount = parseFloat(document.getElementById('food-amount').value);
            if (!shop || !amount || amount <= 0) {
                app.toast('Bitte Laden und Betrag eingeben', 'warning'); return;
            }
            this.state.update(data => {
                data.foodBudget.purchases.push({
                    id: Date.now(), shop, amount,
                    date: new Date().toISOString(),
                    month: new Date().toISOString().slice(0, 7)
                });
            });
            document.getElementById('food-shop').value = '';
            document.getElementById('food-amount').value = '';
            app.toast(`${shop}: CHF ${amount.toFixed(2)} erfasst`);
        };

        app.deleteFoodPurchase = function(id) {
            const purchase = this.state.data.foodBudget.purchases.find(p => p.id === id);
            const name = purchase ? purchase.shop : 'Einkauf';
            app.confirmAction(
                '🗑️ Einkauf löschen',
                `Einkauf bei "<strong>${name}</strong>" löschen?`,
                () => {
                    this.state.update(data => {
                        data.foodBudget.purchases = data.foodBudget.purchases.filter(p => p.id !== id);
                    });
                    app.toast('Einkauf gelöscht');
                },
                { confirmLabel: '🗑️ Löschen', danger: true }
            );
        };

        // Token
        const origSaveToken = app.saveToken.bind(app);
        app.saveToken = async function() {
            const input = document.getElementById('github-token');
            const token = input.value.trim();
            if (!token || !token.startsWith('ghp_')) {
                app.toast('Ungültiges Token-Format (muss mit ghp_ beginnen)', 'error');
                return;
            }
            this.state.github.token = token;
            localStorage.setItem('githubToken', token);
            await this.state.findGist();
            const success = await this.state.save();
            if (success) {
                app.toast('Token gespeichert – Cloud-Sync aktiv!');
                this.render();
            } else {
                app.toast('Token gespeichert, aber Sync fehlgeschlagen', 'warning');
            }
        };

        app.removeToken = function() {
            app.confirmAction(
                '🗑️ Token löschen',
                'GitHub Token wirklich löschen?<br>Cloud-Sync wird deaktiviert.',
                () => {
                    this.state.github.token = '';
                    this.state.github.gistId = null;
                    localStorage.removeItem('githubToken');
                    localStorage.removeItem('gistId');
                    app.toast('Token gelöscht');
                    this.render();
                },
                { confirmLabel: '🗑️ Löschen', danger: true }
            );
        };

        app.syncNow = async function() {
            if (!this.state.github.token) {
                app.toast('Kein GitHub Token konfiguriert', 'warning');
                this.switchTab('settings');
                return;
            }
            try {
                const saved = await this.state.save();
                await this.state.load();
                if (saved) {
                    app.toast('Synchronisiert!');
                    this.render();
                } else {
                    app.toast('Sync fehlgeschlagen', 'error');
                }
            } catch (error) {
                app.toast('Sync fehlgeschlagen: ' + error.message, 'error');
            }
        };

        // Emergency Months
        app.saveEmergencyMonths = function() {
            const input = document.getElementById('emergency-months');
            const months = parseInt(input.value);
            if (!months || months < 1 || months > 12) {
                app.toast('Bitte Wert zwischen 1 und 12 eingeben', 'warning'); return;
            }
            this.state.update(data => {
                if (!data.settings) data.settings = {};
                data.settings.emergencyFundMonths = months;
            });
            app.toast(`Notgroschen auf ${months} Monate gesetzt`);
        };

        // Delete fund value & deposit
        app.deleteFundValue = function(id) {
            app.confirmAction('🗑️ Fondswert löschen', 'Fondswert-Eintrag wirklich löschen?', () => {
                this.state.update(data => {
                    data.savings.pillar3a.fundValues = data.savings.pillar3a.fundValues.filter(fv => fv.id !== id);
                });
                app.toast('Fondswert gelöscht');
                this.render();
            }, { confirmLabel: '🗑️ Löschen', danger: true });
        };

        app.deleteDeposit = function(id) {
            app.confirmAction('🗑️ Einzahlung löschen', 'Einzahlung wirklich löschen?', () => {
                this.state.update(data => {
                    data.savings.pillar3a.deposits = data.savings.pillar3a.deposits.filter(d => d.id !== id);
                });
                app.toast('Einzahlung gelöscht');
                this.render();
            }, { confirmLabel: '🗑️ Löschen', danger: true });
        };

        // Goals
        app.createGoal = function() {
            const name = document.getElementById('goal-name').value.trim();
            const target = parseFloat(document.getElementById('goal-target').value);
            const current = parseFloat(document.getElementById('goal-current').value) || 0;
            const desc = document.getElementById('goal-desc').value.trim();
            const icon = document.getElementById('goal-icon').value.trim() || '🎯';
            if (!name || !target || target <= 0) {
                app.toast('Bitte Namen und Zielbetrag eingeben', 'warning'); return;
            }
            this.state.update(data => {
                if (!data.goals) data.goals = [];
                data.goals.push({ id: Date.now(), name, target, current, description: desc, icon, created: new Date().toISOString() });
            });
            this.closeModal();
            app.toast(`Ziel "${name}" erstellt`);
            this.render();
        };

        app.deleteGoal = function(id) {
            const goal = (this.state.data.goals || []).find(g => g.id === id);
            const name = goal ? goal.name : 'Ziel';
            app.confirmAction('🗑️ Ziel löschen', `"<strong>${name}</strong>" wirklich löschen?`, () => {
                this.state.update(data => { data.goals = (data.goals || []).filter(g => g.id !== id); });
                app.toast('Ziel gelöscht');
                this.render();
            }, { confirmLabel: '🗑️ Löschen', danger: true });
        };

        // Backup
        app.downloadBackup = function() {
            try {
                const timestamp = new Date().toISOString().split('T')[0];
                const filename = `swiss-finance-backup-${timestamp}.json`;
                const backup = { version: '2.2.0', exportDate: new Date().toISOString(), data: this.state.data };
                const json = JSON.stringify(backup, null, 2);
                const blob = new Blob([json], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url; a.download = filename; a.click();
                URL.revokeObjectURL(url);
                app.toast(`Backup heruntergeladen: ${filename}`, 'success', 3500);
            } catch (error) {
                app.toast('Fehler beim Backup: ' + error.message, 'error');
            }
        };

        app.uploadBackup = function() {
            const input = document.createElement('input');
            input.type = 'file'; input.accept = '.json';
            input.onchange = (e) => {
                const file = e.target.files[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = (event) => {
                    try {
                        const backup = JSON.parse(event.target.result);
                        if (!backup.data || !backup.version) throw new Error('Ungültige Backup-Datei');
                        const date = new Date(backup.exportDate).toLocaleDateString('de-CH');
                        app.confirmAction(
                            '📤 Backup wiederherstellen',
                            `<strong>⚠️ Alle aktuellen Daten werden überschrieben!</strong><br><br>Backup vom: ${date}<br>Version: ${backup.version}`,
                            () => {
                                app.state.update(d => { Object.assign(d, backup.data); });
                                app.toast('Backup wiederhergestellt! Seite wird neu geladen...', 'success', 2000);
                                setTimeout(() => location.reload(), 2000);
                            },
                            { confirmLabel: '📤 Wiederherstellen', danger: true }
                        );
                    } catch (error) {
                        app.toast('Fehler: ' + error.message, 'error');
                    }
                };
                reader.readAsText(file);
            };
            input.click();
        };

        console.log('✅ UX Overhaul active – Toasts, Confirm Modals, Wizard, Bug Fixes');

    }, 150);
})();
