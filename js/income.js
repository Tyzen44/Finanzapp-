<!-- NEW TAB: INCOME -->
<div id="tab-income" class="tab-content">
    <!-- PROMINENT SALARY HERO SECTION -->
    <div class="salary-section" style="background: linear-gradient(135deg, #10b981, #059669); color: white; border-radius: 16px; padding: 40px; margin-bottom: 32px; box-shadow: 0 10px 25px rgba(16, 185, 129, 0.3);">
        <h2 style="font-size: 28px; font-weight: 700; margin-bottom: 32px; text-align: center;">
            💰 Monatliches Gehalt
        </h2>
        
        <!-- Current Month Display -->
        <div style="text-align: center; margin-bottom: 24px;">
            <div style="font-size: 16px; opacity: 0.9; margin-bottom: 8px;">
                <span id="current-month-display"></span>
            </div>
        </div>
        
        <!-- Main Salary Input Area -->
        <div style="background: rgba(255, 255, 255, 0.15); backdrop-filter: blur(10px); border-radius: 12px; padding: 32px; margin-bottom: 24px;">
            <!-- Big Salary Display/Input -->
            <div id="salary-input-container" style="text-align: center;">
                <div style="font-size: 14px; opacity: 0.9; margin-bottom: 16px; text-transform: uppercase; letter-spacing: 1px;">
                    Ihr Monatsgehalt (CHF)
                </div>
                
                <!-- Large Input Field -->
                <input type="number" 
                       id="salary-main-input" 
                       placeholder="0" 
                       style="background: rgba(255, 255, 255, 0.95); 
                              border: 3px solid rgba(255, 255, 255, 0.3); 
                              border-radius: 12px; 
                              padding: 20px; 
                              font-size: 48px; 
                              font-weight: 700; 
                              text-align: center; 
                              color: #059669; 
                              width: 100%; 
                              max-width: 400px;
                              transition: all 0.3s ease;"
                       onkeyup="updateSalaryPreview()"
                       onfocus="this.style.borderColor='white'; this.style.boxShadow='0 0 0 4px rgba(255,255,255,0.3)';"
                       onblur="this.style.borderColor='rgba(255,255,255,0.3)'; this.style.boxShadow='none';">
                
                <!-- OR: Display Mode for Already Entered Salary -->
                <div id="salary-display-mode" style="display: none;">
                    <div style="font-size: 56px; font-weight: 700; margin: 16px 0;">
                        <span id="salary-amount-display">CHF 0</span>
                    </div>
                    <button onclick="editSalaryAmount()" style="background: rgba(255, 255, 255, 0.2); border: 1px solid rgba(255, 255, 255, 0.3); color: white; padding: 8px 16px; border-radius: 8px; cursor: pointer; font-size: 14px;">
                        ✏️ Bearbeiten
                    </button>
                </div>
            </div>
        </div>
        
        <!-- Live Preview Section -->
        <div id="salary-preview" style="background: rgba(255, 255, 255, 0.1); border-radius: 12px; padding: 20px; margin-bottom: 24px; display: none;">
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin-bottom: 16px;">
                <div>
                    <div style="font-size: 13px; opacity: 0.8;">Fixkosten</div>
                    <div style="font-size: 20px; font-weight: 600;" id="preview-fixed">CHF 0</div>
                </div>
                <div>
                    <div style="font-size: 13px; opacity: 0.8;">Variable Kosten</div>
                    <div style="font-size: 20px; font-weight: 600;" id="preview-variable">CHF 0</div>
                </div>
            </div>
            <div style="border-top: 2px solid rgba(255, 255, 255, 0.2); padding-top: 16px; text-align: center;">
                <div style="font-size: 14px; opacity: 0.9; margin-bottom: 8px;">Verfügbar nach Abzügen</div>
                <div style="font-size: 32px; font-weight: 700;" id="preview-available">CHF 0</div>
            </div>
        </div>
        
        <!-- Status Display -->
        <div id="salary-status" style="background: rgba(255, 255, 255, 0.2); border-radius: 8px; padding: 12px; margin-bottom: 20px; text-align: center;">
            <strong>⚠️ Status:</strong> Noch kein Gehalt erfasst
        </div>
        
        <!-- Main Action Button -->
        <button id="salary-save-button" 
                onclick="saveSalaryFromInput()" 
                style="width: 100%; 
                       background: white; 
                       color: #059669; 
                       border: none; 
                       border-radius: 12px; 
                       padding: 20px; 
                       font-size: 18px; 
                       font-weight: 700; 
                       cursor: pointer; 
                       transition: all 0.3s ease; 
                       box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);"
                onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 8px 12px rgba(0, 0, 0, 0.15)';"
                onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 6px rgba(0, 0, 0, 0.1)';">
            💰 Gehalt speichern & Monat abschließen
        </button>
        
        <p style="margin-top: 16px; font-size: 13px; opacity: 0.9; text-align: center;">
            Nach dem Speichern wird der Monat abgeschlossen und das verfügbare Geld auf Ihr Konto übertragen
        </p>
    </div>
    
    <!-- SALARY HISTORY (Smaller Section) -->
    <div id="salary-history" style="margin-bottom: 24px;">
        <!-- Will be filled by renderSalaryHistory() -->
    </div>
    
    <!-- ADDITIONAL INCOME (Secondary Section) -->
    <div class="settings-group" style="background: white; border-radius: 12px; padding: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
        <div class="section-header">
            <div class="section-title">💵 Zusätzliche Einnahmen</div>
        </div>
        
        <!-- Quick Income Entry -->
        <div style="margin-bottom: 20px;">
            <div style="display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 10px;">
                <input type="text" class="form-input" id="quick-income-desc" placeholder="z.B. Bonus, Geschenk">
                <input type="number" class="form-input" id="quick-income-amount" placeholder="Betrag" step="10">
                <button onclick="addQuickIncome()" class="btn btn-primary">➕ Hinzufügen</button>
            </div>
        </div>

        <div id="additional-income-list">
            <!-- Additional income entries will be generated here -->
        </div>
        
        <div class="total-card" style="background: linear-gradient(135deg, #60a5fa, #3b82f6); margin-top: 20px;">
            <div class="total-amount" id="income-total">CHF 0</div>
            <div class="total-label">Zusätzliche Einnahmen diesen Monat</div>
        </div>
    </div>
</div>

<script>
// Update current month display
document.addEventListener('DOMContentLoaded', function() {
    const monthDisplay = document.getElementById('current-month-display');
    if (monthDisplay) {
        const currentMonth = new Date().toLocaleDateString('de-CH', { month: 'long', year: 'numeric' });
        monthDisplay.textContent = currentMonth;
    }
});

// Live preview function
function updateSalaryPreview() {
    const input = document.getElementById('salary-main-input');
    const preview = document.getElementById('salary-preview');
    const amount = parseFloat(input.value) || 0;
    
    if (amount > 0) {
        preview.style.display = 'block';
        
        // Calculate expenses (this should come from your actual data)
        const fixedExpenses = appData.fixedExpenses
            .filter(exp => exp.active && exp.account === appData.currentProfile)
            .reduce((sum, exp) => sum + exp.amount, 0);
        const variableExpenses = appData.variableExpenses
            .filter(exp => exp.active && exp.account === appData.currentProfile)
            .reduce((sum, exp) => sum + exp.amount, 0);
        const available = amount - fixedExpenses - variableExpenses;
        
        document.getElementById('preview-fixed').textContent = `CHF ${fixedExpenses.toLocaleString()}`;
        document.getElementById('preview-variable').textContent = `CHF ${variableExpenses.toLocaleString()}`;
        document.getElementById('preview-available').textContent = `CHF ${available.toLocaleString()}`;
        
        // Color code the available amount
        const availableElement = document.getElementById('preview-available');
        if (available < 0) {
            availableElement.style.color = '#fca5a5';
        } else if (available < 500) {
            availableElement.style.color = '#fde047';
        } else {
            availableElement.style.color = 'white';
        }
    } else {
        preview.style.display = 'none';
    }
}

// Save salary from the big input field
function saveSalaryFromInput() {
    const input = document.getElementById('salary-main-input');
    const amount = parseFloat(input.value);
    
    if (!amount || amount <= 0) {
        alert('⚠️ Bitte geben Sie Ihr Gehalt ein');
        input.focus();
        return;
    }
    
    // Call the existing addSalaryEntry with the amount
    if (typeof addSalaryEntryWithAmount === 'function') {
        addSalaryEntryWithAmount(amount);
    } else {
        // Fallback to prompt-based entry
        addSalaryEntry();
    }
}

// Edit already entered salary
function editSalaryAmount() {
    document.getElementById('salary-input-container').querySelector('#salary-display-mode').style.display = 'none';
    document.getElementById('salary-main-input').style.display = 'block';
    document.getElementById('salary-main-input').focus();
}
</script>
