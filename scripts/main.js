// Password Protection
function checkPassword() {
    const passwordInput = document.getElementById('password-input');
    const errorMessage = document.getElementById('error-message');
    const correctPassword = 'breiflabb';
    
    if (passwordInput.value === correctPassword) {
        // Hide login screen and show main app
        document.getElementById('login-screen').style.display = 'none';
        document.getElementById('main-app').style.display = 'block';
        
        // Store login status in session
        sessionStorage.setItem('natthav-authenticated', 'true');
        
        // Initialize the app
        initializeApp();
    } else {
        // Show error message
        errorMessage.style.display = 'block';
        passwordInput.value = '';
        passwordInput.focus();
    }
}

// Check if user is already authenticated
function checkAuthentication() {
    if (sessionStorage.getItem('natthav-authenticated') === 'true') {
        document.getElementById('login-screen').style.display = 'none';
        document.getElementById('main-app').style.display = 'block';
        initializeApp();
    }
}

// Allow Enter key to submit password
document.addEventListener('DOMContentLoaded', function() {
    checkAuthentication();
    
    const passwordInput = document.getElementById('password-input');
    if (passwordInput) {
        passwordInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                checkPassword();
            }
        });
        passwordInput.focus();
    }
});

// Global variables
let expenseData = {
    participants: {
        kristoffer: { name: 'Kristoffer Bjekvik', budget: 15000 },
        guro: { name: 'Guro Kyte Solvik', budget: 12000 }
    },
    groups: [],
    yearlyData: []
};

// Default colors for groups
const defaultColors = ['#667eea', '#764ba2', '#f093fb', '#f5576c', '#4facfe', '#00f2fe', '#43e97b', '#38f9d7', '#ffecd2', '#fcb69f'];

let pieChart, lineChart, yearlyChart, yearlyPieChart;

function initializeApp() {
    initializeTabs();
    initializeExpenses();
    initializeCharts();
    initializeYearlyTab();
    loadSampleData();
}

function initializeTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetTab = button.getAttribute('data-tab');
            
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            button.classList.add('active');
            document.getElementById(targetTab + '-tab').classList.add('active');
        });
    });
}

function showBudgetWarning(participantName, overage) {
    const popup = document.createElement('div');
    popup.className = 'popup-overlay';
    popup.innerHTML = `
        <div class="popup">
            <h3>Budsjett overskredet!</h3>
            <p><strong>${participantName}</strong> overstiger budsjettet med <strong>${overage} kr</strong></p>
            <button onclick="this.parentElement.parentElement.remove()">Juster fordeling</button>
        </div>
    `;
    document.body.appendChild(popup);
    popup.style.display = 'flex';
}

function initializeExpenses() {
    updateBudgetDisplay();
    updateTotals();
    
    // Add budget input listeners
    const kristofferBudgetInput = document.getElementById('kristoffer-budget');
    const guroBudgetInput = document.getElementById('guro-budget');
    
    if (kristofferBudgetInput) {
        kristofferBudgetInput.addEventListener('input', function() {
            expenseData.participants.kristoffer.budget = parseInt(this.value) || 15000;
            updateBudgetDisplay();
            updateTotals();
        });
    }
    
    if (guroBudgetInput) {
        guroBudgetInput.addEventListener('input', function() {
            expenseData.participants.guro.budget = parseInt(this.value) || 12000;
            updateBudgetDisplay();
            updateTotals();
        });
    }
}

function updateBudgetDisplay() {
    const kristofferBudgetDisplay = document.getElementById('kristoffer-budget-display');
    const guroBudgetDisplay = document.getElementById('guro-budget-display');
    const kristofferBudgetDisplayFixed = document.getElementById('kristoffer-budget-display-fixed');
    const guroBudgetDisplayFixed = document.getElementById('guro-budget-display-fixed');
    
    const kristofferBudget = expenseData.participants.kristoffer.budget.toLocaleString();
    const guroBudget = expenseData.participants.guro.budget.toLocaleString();
    
    if (kristofferBudgetDisplay) kristofferBudgetDisplay.textContent = kristofferBudget;
    if (guroBudgetDisplay) guroBudgetDisplay.textContent = guroBudget;
    if (kristofferBudgetDisplayFixed) kristofferBudgetDisplayFixed.textContent = kristofferBudget;
    if (guroBudgetDisplayFixed) guroBudgetDisplayFixed.textContent = guroBudget;
}

function addNewGroup() {
    const groupName = prompt('Navn på ny hovedgruppe:');
    if (!groupName) return;
    
    const emoji = prompt('Emoji for gruppen (valgfritt):') || '📋';
    
    const colorIndex = expenseData.groups.length % defaultColors.length;
    const newGroup = {
        id: 'group_' + Date.now(),
        name: groupName,
        emoji: emoji,
        color: defaultColors[colorIndex],
        expenses: []
    };
    
    expenseData.groups.push(newGroup);
    renderExpenseGroups();
    updateTotals();
    updateCharts();
}

function addExpenseToGroup(groupId) {
    const expenseName = prompt('Navn på utgift:');
    if (!expenseName) return;
    
    const amount = parseFloat(prompt('Beløp (kr):'));
    if (!amount || amount <= 0) return;
    
    const newExpense = {
        id: 'expense_' + Date.now(),
        name: expenseName,
        amount: amount,
        shares: {
            kristoffer: Math.round(amount * 0.5),
            guro: Math.round(amount * 0.5)
        }
    };
    
    const group = expenseData.groups.find(g => g.id === groupId);
    if (group) {
        group.expenses.push(newExpense);
        renderExpenseGroups();
        updateTotals();
        updateCharts();
    }
}

function deleteGroup(groupId) {
    if (confirm('Er du sikker på at du vil slette denne hovedgruppen?')) {
        expenseData.groups = expenseData.groups.filter(g => g.id !== groupId);
        renderExpenseGroups();
        updateTotals();
        updateCharts();
    }
}

function deleteExpense(groupId, expenseId) {
    if (confirm('Er du sikker på at du vil slette denne utgiften?')) {
        const group = expenseData.groups.find(g => g.id === groupId);
        if (group) {
            group.expenses = group.expenses.filter(e => e.id !== expenseId);
            renderExpenseGroups();
            updateTotals();
            updateCharts();
        }
    }
}

function updateFromSlider(slider, groupId, expenseId) {
    const group = expenseData.groups.find(g => g.id === groupId);
    const expense = group?.expenses.find(e => e.id === expenseId);
    if (!expense) return;
    
    const percentage = parseInt(slider.value);
    const kristofferAmount = Math.round(expense.amount * percentage / 100);
    const guroAmount = expense.amount - kristofferAmount;
    
    expense.shares.kristoffer = kristofferAmount;
    expense.shares.guro = guroAmount;
    
    // Update only the specific expense item instead of re-rendering everything
    updateExpenseItemDisplay(groupId, expenseId);
    updateTotals();
    updateCharts();
}

function updateFromAmount(input, participant, groupId, expenseId) {
    const group = expenseData.groups.find(g => g.id === groupId);
    const expense = group?.expenses.find(e => e.id === expenseId);
    if (!expense) return;
    
    let currentAmount = parseInt(input.value) || 0;
    
    if (currentAmount > expense.amount) {
        currentAmount = expense.amount;
        input.value = currentAmount;
    } else if (currentAmount < 0) {
        currentAmount = 0;
        input.value = currentAmount;
    }
    
    if (participant === 'kristoffer') {
        expense.shares.kristoffer = currentAmount;
        expense.shares.guro = expense.amount - currentAmount;
    } else {
        expense.shares.guro = currentAmount;
        expense.shares.kristoffer = expense.amount - currentAmount;
    }
    
    // Update only the specific expense item instead of re-rendering everything
    updateExpenseItemDisplay(groupId, expenseId);
    updateTotals();
    updateCharts();
}

function updateExpenseAmount(input, groupId, expenseId) {
    const group = expenseData.groups.find(g => g.id === groupId);
    const expense = group?.expenses.find(e => e.id === expenseId);
    if (!expense) return;
    
    let newAmount = parseFloat(input.value) || 0;
    
    if (newAmount < 0) {
        newAmount = 0;
        input.value = newAmount;
    }
    
    const oldAmount = expense.amount;
    expense.amount = newAmount;
    
    // Maintain proportions when changing total amount
    if (oldAmount > 0) {
        const kristofferPercentage = expense.shares.kristoffer / oldAmount;
        expense.shares.kristoffer = Math.round(newAmount * kristofferPercentage);
        expense.shares.guro = newAmount - expense.shares.kristoffer;
    } else {
        // Default to 50/50 split for new amounts
        expense.shares.kristoffer = Math.round(newAmount * 0.5);
        expense.shares.guro = newAmount - expense.shares.kristoffer;
    }
    
    // Update only the specific expense item and group total
    updateExpenseItemDisplay(groupId, expenseId);
    updateGroupTotal(groupId);
    updateTotals();
    updateCharts();
}

function updateExpenseItemDisplay(groupId, expenseId) {
    const group = expenseData.groups.find(g => g.id === groupId);
    const expense = group?.expenses.find(e => e.id === expenseId);
    if (!expense) return;
    
    const expenseElement = document.querySelector(`[data-expense-id="${expenseId}"]`);
    if (!expenseElement) return;
    
    const kristofferPercentage = expense.amount > 0 ? Math.round((expense.shares.kristoffer / expense.amount) * 100) : 50;
    const guroPercentage = 100 - kristofferPercentage;
    
    // Update amount display
    const amountDisplay = expenseElement.querySelector('.expense-amount');
    if (amountDisplay) {
        amountDisplay.textContent = expense.amount.toLocaleString() + ' kr';
    }
    
    // Update share inputs
    const kristofferInput = expenseElement.querySelector('.share-input[data-participant="kristoffer"]');
    const guroInput = expenseElement.querySelector('.share-input[data-participant="guro"]');
    
    if (kristofferInput) kristofferInput.value = expense.shares.kristoffer;
    if (guroInput) guroInput.value = expense.shares.guro;
    
    // Update slider
    const slider = expenseElement.querySelector('.percentage-slider');
    if (slider) slider.value = kristofferPercentage;
    
    // Update percentage displays
    const percentageDisplays = expenseElement.querySelectorAll('.percentage-display');
    if (percentageDisplays[0]) percentageDisplays[0].textContent = kristofferPercentage + '%';
    if (percentageDisplays[1]) percentageDisplays[1].textContent = guroPercentage + '%';
}

function updateGroupTotal(groupId) {
    const group = expenseData.groups.find(g => g.id === groupId);
    if (!group) return;
    
    const groupTotal = group.expenses.reduce((sum, expense) => sum + expense.amount, 0);
    const groupElement = document.querySelector(`[data-group-id="${groupId}"]`);
    
    if (groupElement) {
        const totalDisplay = groupElement.querySelector('.group-total');
        if (totalDisplay) {
            totalDisplay.textContent = groupTotal.toLocaleString() + ' kr/mnd';
        }
    }
}

function updateGroupColor(groupId, color) {
    const group = expenseData.groups.find(g => g.id === groupId);
    if (group) {
        group.color = color;
        renderExpenseGroups();
        updateCharts();
    }
}

function renderExpenseGroups() {
    const container = document.getElementById('expense-groups');
    if (!container) return;
    
    container.innerHTML = '';
    
    expenseData.groups.forEach(group => {
        const groupTotal = group.expenses.reduce((sum, expense) => sum + expense.amount, 0);
        
        const groupElement = document.createElement('div');
        groupElement.className = 'expense-group';
        groupElement.setAttribute('data-group-id', group.id);
        groupElement.innerHTML = `
            <div class="group-header custom-color" style="--group-color: ${group.color}">
                <div class="group-title-section">
                    <input type="color" class="color-input" value="${group.color}" onchange="updateGroupColor('${group.id}', this.value)" title="Velg farge">
                    <h2>${group.emoji} ${group.name}</h2>
                </div>
                <div class="group-total">${groupTotal.toLocaleString()} kr/mnd</div>
                <button class="delete-group-btn" onclick="deleteGroup('${group.id}')" title="Slett hovedgruppe">×</button>
            </div>
            <div class="group-content">
                ${group.expenses.map(expense => {
                    const kristofferPercentage = expense.amount > 0 ? Math.round((expense.shares.kristoffer / expense.amount) * 100) : 50;
                    const guroPercentage = 100 - kristofferPercentage;
                    
                    return `
                        <div class="expense-item" data-expense-id="${expense.id}">
                            <div class="expense-details">
                                <input type="text" class="expense-name-input" value="${expense.name}" oninput="updateExpenseName(this, '${group.id}', '${expense.id}')" placeholder="Navn på utgift">
                                <input type="number" class="expense-amount-input" value="${expense.amount}" oninput="updateExpenseAmount(this, '${group.id}', '${expense.id}')" placeholder="Beløp">
                                <div class="expense-amount">${expense.amount.toLocaleString()} kr</div>
                            </div>
                            <div class="distribution-controls">
                                <div class="participant-share">
                                    <img src="assets/images/kristoffer.png" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'30\\' height=\\'30\\' viewBox=\\'0 0 30 30\\'%3E%3Ccircle cx=\\'15\\' cy=\\'15\\' r=\\'15\\' fill=\\'%23667eea\\'/%3E%3Ctext x=\\'15\\' y=\\'19\\' text-anchor=\\'middle\\' fill=\\'white\\' font-size=\\'12\\' font-family=\\'Arial\\'%3EK%3C/text%3E%3C/svg%3E'" alt="Kristoffer">
                                    <input type="number" class="share-input" data-participant="kristoffer" value="${expense.shares.kristoffer}" oninput="updateFromAmount(this, 'kristoffer', '${group.id}', '${expense.id}')">
                                </div>
                                <div class="slider-container">
                                    <div class="percentage-display">${kristofferPercentage}%</div>
                                    <input type="range" class="percentage-slider" min="0" max="100" value="${kristofferPercentage}" oninput="updateFromSlider(this, '${group.id}', '${expense.id}')">
                                    <div class="percentage-display">${guroPercentage}%</div>
                                </div>
                                <div class="participant-share">
                                    <input type="number" class="share-input" data-participant="guro" value="${expense.shares.guro}" oninput="updateFromAmount(this, 'guro', '${group.id}', '${expense.id}')">
                                    <img src="assets/images/guro.png" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'30\\' height=\\'30\\' viewBox=\\'0 0 30 30\\'%3E%3Ccircle cx=\\'15\\' cy=\\'15\\' r=\\'15\\' fill=\\'%23764ba2\\'/%3E%3Ctext x=\\'15\\' y=\\'19\\' text-anchor=\\'middle\\' fill=\\'white\\' font-size=\\'12\\' font-family=\\'Arial\\'%3EG%3C/text%3E%3C/svg%3E'" alt="Guro">
                                </div>
                            </div>
                            <button class="delete-expense-btn" onclick="deleteExpense('${group.id}', '${expense.id}')" title="Slett utgift">×</button>
                        </div>
                    `;
                }).join('')}
                <button class="add-expense-btn" onclick="addExpenseToGroup('${group.id}')">+ Legg til utgift</button>
            </div>
        `;
        
        container.appendChild(groupElement);
    });
}

function updateTotals() {
    let kristofferTotal = 0;
    let guroTotal = 0;
    
    expenseData.groups.forEach(group => {
        group.expenses.forEach(expense => {
            kristofferTotal += expense.shares.kristoffer;
            guroTotal += expense.shares.guro;
        });
    });
    
    // Update both regular and fixed total displays
    const kristofferTotalEl = document.getElementById('kristoffer-total');
    const guroTotalEl = document.getElementById('samboer-total');
    const kristofferTotalFixedEl = document.getElementById('kristoffer-total-fixed');
    const guroTotalFixedEl = document.getElementById('samboer-total-fixed');
    
    const kristofferTotalText = kristofferTotal.toLocaleString() + ' kr';
    const guroTotalText = guroTotal.toLocaleString() + ' kr';
    
    if (kristofferTotalEl) kristofferTotalEl.textContent = kristofferTotalText;
    if (guroTotalEl) guroTotalEl.textContent = guroTotalText;
    if (kristofferTotalFixedEl) kristofferTotalFixedEl.textContent = kristofferTotalText;
    if (guroTotalFixedEl) guroTotalFixedEl.textContent = guroTotalText;
    
    checkBudgets(kristofferTotal, guroTotal);
    updateStatsCards(kristofferTotal, guroTotal);
}

function updateStatsCards(kristofferTotal, guroTotal) {
    const totalMonthly = kristofferTotal + guroTotal;
    const yearlyTotal = totalMonthly * 12;
    
    const totalMonthlyEl = document.getElementById('total-monthly');
    const kristofferMonthlyEl = document.getElementById('kristoffer-monthly');
    const guroMonthlyEl = document.getElementById('guro-monthly');
    const yearlyTotalEl = document.getElementById('yearly-total');
    
    if (totalMonthlyEl) totalMonthlyEl.textContent = totalMonthly.toLocaleString() + ' kr';
    if (kristofferMonthlyEl) kristofferMonthlyEl.textContent = kristofferTotal.toLocaleString() + ' kr';
    if (guroMonthlyEl) guroMonthlyEl.textContent = guroTotal.toLocaleString() + ' kr';
    if (yearlyTotalEl) yearlyTotalEl.textContent = yearlyTotal.toLocaleString() + ' kr';
}

function checkBudgets(kristofferTotal, guroTotal) {
    const kristofferBudget = expenseData.participants.kristoffer.budget;
    const guroBudget = expenseData.participants.guro.budget;
    
    const kristofferBudgetInput = document.getElementById('kristoffer-budget');
    const guroBudgetInput = document.getElementById('guro-budget');
    const kristofferEmoji = document.getElementById('kristoffer-emoji');
    const guroEmoji = document.getElementById('guro-emoji');
    const kristofferStatus = document.getElementById('kristoffer-status');
    const guroStatus = document.getElementById('guro-status');
    
    if (kristofferBudgetInput) kristofferBudgetInput.classList.remove('budget-exceeded');
    if (guroBudgetInput) guroBudgetInput.classList.remove('budget-exceeded');
    
    // Kristoffer budget check
    const kristofferDiff = kristofferBudget - kristofferTotal;
    if (kristofferDiff < 0) {
        if (kristofferBudgetInput) kristofferBudgetInput.classList.add('budget-exceeded');
        if (kristofferEmoji) kristofferEmoji.textContent = '😭';
        if (kristofferStatus) {
            kristofferStatus.textContent = Math.abs(kristofferDiff).toLocaleString() + ' kr';
            kristofferStatus.className = 'budget-status negative';
        }
    } else if (kristofferDiff < 500) {
        if (kristofferEmoji) kristofferEmoji.textContent = '😐';
        if (kristofferStatus) {
            kristofferStatus.textContent = '+' + kristofferDiff.toLocaleString() + ' kr';
            kristofferStatus.className = 'budget-status positive';
        }
    } else {
        if (kristofferEmoji) kristofferEmoji.textContent = '😊';
        if (kristofferStatus) {
            kristofferStatus.textContent = '+' + kristofferDiff.toLocaleString() + ' kr';
            kristofferStatus.className = 'budget-status positive';
        }
    }
    
    // Guro budget check
    const guroDiff = guroBudget - guroTotal;
    if (guroDiff < 0) {
        if (guroBudgetInput) guroBudgetInput.classList.add('budget-exceeded');
        if (guroEmoji) guroEmoji.textContent = '😭';
        if (guroStatus) {
            guroStatus.textContent = Math.abs(guroDiff).toLocaleString() + ' kr';
            guroStatus.className = 'budget-status negative';
        }
    } else if (guroDiff < 500) {
        if (guroEmoji) guroEmoji.textContent = '😐';
        if (guroStatus) {
            guroStatus.textContent = '+' + guroDiff.toLocaleString() + ' kr';
            guroStatus.className = 'budget-status positive';
        }
    } else {
        if (guroEmoji) guroEmoji.textContent = '😊';
        if (guroStatus) {
            guroStatus.textContent = '+' + guroDiff.toLocaleString() + ' kr';
            guroStatus.className = 'budget-status positive';
        }
    }
}

// Data Management Functions
function saveData() {
    const dataToSave = {
        ...expenseData,
        savedDate: new Date().toISOString(),
        version: '1.0'
    };
    
    localStorage.setItem('natthav-expense-data', JSON.stringify(dataToSave));
    
    const popup = document.createElement('div');
    popup.className = 'popup-overlay';
    popup.innerHTML = `
        <div class="popup">
            <h3>Data lagret!</h3>
            <p>Alle utgifter og innstillinger er lagret lokalt i nettleseren.</p>
            <button onclick="this.parentElement.parentElement.remove()">OK</button>
        </div>
    `;
    document.body.appendChild(popup);
    popup.style.display = 'flex';
}

function loadData() {
    const savedData = localStorage.getItem('natthav-expense-data');
    if (!savedData) {
        alert('Ingen lagret data funnet.');
        return;
    }
    
    try {
        const data = JSON.parse(savedData);
        expenseData = {
            participants: data.participants || expenseData.participants,
            groups: data.groups || [],
            yearlyData: data.yearlyData || []
        };
        
        const kristofferBudgetInput = document.getElementById('kristoffer-budget');
        const guroBudgetInput = document.getElementById('guro-budget');
        
        if (kristofferBudgetInput) kristofferBudgetInput.value = expenseData.participants.kristoffer.budget;
        if (guroBudgetInput) guroBudgetInput.value = expenseData.participants.guro.budget;
        
        renderExpenseGroups();
        updateBudgetDisplay();
        updateTotals();
        updateCharts();
        renderYearlyTable();
        if (yearlyChart) updateYearlyChart();
        
        const popup = document.createElement('div');
        popup.className = 'popup-overlay';
        popup.innerHTML = `
            <div class="popup">
                <h3>Data lastet!</h3>
                <p>Tidligere lagrede utgifter og innstillinger er gjenopprettet.</p>
                <p><small>Lagret: ${new Date(data.savedDate).toLocaleString('no-NO')}</small></p>
                <button onclick="this.parentElement.parentElement.remove()">OK</button>
            </div>
        `;
        document.body.appendChild(popup);
        popup.style.display = 'flex';
        
    } catch (error) {
        alert('Feil ved lasting av data: ' + error.message);
    }
}

function exportData() {
    const dataToExport = {
        ...expenseData,
        exportDate: new Date().toISOString(),
        version: '1.0'
    };
    
    const dataStr = JSON.stringify(dataToExport, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `natthav-utgifter-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
}

function importData(input) {
    const file = input.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            
            if (confirm('Dette vil erstatte alle nåværende data. Er du sikker?')) {
                expenseData = {
                    participants: data.participants || expenseData.participants,
                    groups: data.groups || [],
                    yearlyData: data.yearlyData || []
                };
                
                const kristofferBudgetInput = document.getElementById('kristoffer-budget');
                const guroBudgetInput = document.getElementById('guro-budget');
                
                if (kristofferBudgetInput) kristofferBudgetInput.value = expenseData.participants.kristoffer.budget;
                if (guroBudgetInput) guroBudgetInput.value = expenseData.participants.guro.budget;
                
                renderExpenseGroups();
                updateBudgetDisplay();
                updateTotals();
                updateCharts();
                renderYearlyTable();
                if (yearlyChart) updateYearlyChart();
                
                alert('Data importert!');
            }
            
        } catch (error) {
            alert('Feil ved import av data: ' + error.message);
        }
    };
    reader.readAsText(file);
    
    input.value = '';
}

function updateExpenseName(input, groupId, expenseId) {
    const group = expenseData.groups.find(g => g.id === groupId);
    const expense = group?.expenses.find(e => e.id === expenseId);
    if (!expense) return;
    
    expense.name = input.value;
}

function loadSampleData() {
    if (expenseData.groups.length === 0) {
        expenseData.groups = [
            {
                id: 'group_bolig',
                name: 'Bolig',
                emoji: '🏠',
                color: '#667eea',
                expenses: [
                    {
                        id: 'expense_avdrag',
                        name: 'Månedlig avdrag',
                        amount: 12500,
                        shares: { kristoffer: 6250, guro: 6250 }
                    }
                ]
            },
            {
                id: 'group_energi',
                name: 'Energi',
                emoji: '⚡',
                color: '#764ba2',
                expenses: [
                    {
                        id: 'expense_strom',
                        name: 'Månedlig strømregning',
                        amount: 1500,
                        shares: { kristoffer: 750, guro: 750 }
                    },
                    {
                        id: 'expense_elbil',
                        name: 'Elbillader tillegg',
                        amount: 300,
                        shares: { kristoffer: 240, guro: 60 }
                    }
                ]
            }
        ];
        
        renderExpenseGroups();
        updateTotals();
    }
    
    // Load sample yearly data if none exists
    if (expenseData.yearlyData.length === 0) {
        expenseData.yearlyData = [
            { year: 2023, kristoffer: 125000, guro: 108000, total: 233000 },
            { year: 2024, kristoffer: 135000, guro: 115000, total: 250000 }
        ];
        
        renderYearlyTable();
        if (yearlyChart) updateYearlyChart();
    }
}

// Charts functionality
function initializeCharts() {
    if (typeof Chart === 'undefined') {
        setTimeout(initializeCharts, 100);
        return;
    }
    
    const pieCtx = document.getElementById('pieChart');
    const lineCtx = document.getElementById('lineChart');
    
    if (!pieCtx || !lineCtx) {
        return;
    }
    
    pieChart = new Chart(pieCtx, {
        type: 'doughnut',
        data: {
            labels: [],
            datasets: [{
                data: [],
                backgroundColor: [],
                borderWidth: 0,
                hoverBorderWidth: 3,
                hoverBorderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 20,
                        usePointStyle: true,
                        font: { size: 12 }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const value = context.parsed;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((value / total) * 100).toFixed(1);
                            return [`${context.label}: ${value.toLocaleString()} kr`, `${percentage}% av total`];
                        }
                    }
                }
            },
            cutout: '50%'
        }
    });
    
    lineChart = new Chart(lineCtx, {
        type: 'line',
        data: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'Mai', 'Jun'],
            datasets: [{
                label: 'Kristoffer Bjekvik',
                data: [],
                borderColor: '#667eea',
                backgroundColor: 'rgba(102, 126, 234, 0.1)',
                borderWidth: 3,
                fill: false,
                tension: 0.4,
                pointBackgroundColor: '#667eea',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointRadius: 6
            }, {
                label: 'Guro Kyte Solvik',
                data: [],
                borderColor: '#764ba2',
                backgroundColor: 'rgba(118, 75, 162, 0.1)',
                borderWidth: 3,
                fill: false,
                tension: 0.4,
                pointBackgroundColor: '#764ba2',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `${context.dataset.label}: ${context.parsed.y.toLocaleString()} kr`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return value.toLocaleString() + ' kr';
                        }
                    },
                    grid: { color: 'rgba(0,0,0,0.1)' }
                },
                x: {
                    grid: { color: 'rgba(0,0,0,0.1)' }
                }
            },
            interaction: {
                intersect: false,
                mode: 'index'
            }
        }
    });
    
    updateCharts();
}

function updateCharts() {
    if (!pieChart || !lineChart) return;
    
    const pieLabels = [];
    const pieData = [];
    const pieColors = [];
    
    expenseData.groups.forEach(group => {
        const total = group.expenses.reduce((sum, expense) => sum + expense.amount, 0);
        if (total > 0) {
            pieLabels.push(`${group.emoji} ${group.name}`);
            pieData.push(total);
            pieColors.push(group.color || '#667eea');
        }
    });
    
    pieChart.data.labels = pieLabels;
    pieChart.data.datasets[0].data = pieData;
    pieChart.data.datasets[0].backgroundColor = pieColors;
    pieChart.update();
    
    let kristofferMonthly = 0;
    let guroMonthly = 0;
    
    expenseData.groups.forEach(group => {
        group.expenses.forEach(expense => {
            kristofferMonthly += expense.shares.kristoffer;
            guroMonthly += expense.shares.guro;
        });
    });
    
    const kristofferCumulative = [];
    const guroCumulative = [];
    
    for (let i = 0; i < 6; i++) {
        kristofferCumulative.push(kristofferMonthly * (i + 1));
        guroCumulative.push(guroMonthly * (i + 1));
    }
    
    lineChart.data.datasets[0].data = kristofferCumulative;
    lineChart.data.datasets[1].data = guroCumulative;
    lineChart.update();
}

function updateTimeRange(range) {
    document.querySelectorAll('.time-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    
    let kristofferMonthly = 0;
    let guroMonthly = 0;
    
    expenseData.groups.forEach(group => {
        group.expenses.forEach(expense => {
            kristofferMonthly += expense.shares.kristoffer;
            guroMonthly += expense.shares.guro;
        });
    });
    
    let labels, kristofferData, guroData;
    
    switch(range) {
        case '6m':
            labels = ['Jan', 'Feb', 'Mar', 'Apr', 'Mai', 'Jun'];
            kristofferData = Array.from({length: 6}, (_, i) => kristofferMonthly * (i + 1));
            guroData = Array.from({length: 6}, (_, i) => guroMonthly * (i + 1));
            break;
        case '1y':
            labels = ['Jan', 'Feb', 'Mar', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Des'];
            kristofferData = Array.from({length: 12}, (_, i) => kristofferMonthly * (i + 1));
            guroData = Array.from({length: 12}, (_, i) => guroMonthly * (i + 1));
            break;
        case '2y':
            labels = ['Jan-23', 'Mar-23', 'Mai-23', 'Jul-23', 'Sep-23', 'Nov-23', 'Jan-24', 'Mar-24', 'Mai-24', 'Jul-24', 'Sep-24', 'Nov-24'];
            kristofferData = Array.from({length: 12}, (_, i) => kristofferMonthly * (i + 7));
            guroData = Array.from({length: 12}, (_, i) => guroMonthly * (i + 7));
            break;
    }
    
    lineChart.data.labels = labels;
    lineChart.data.datasets[0].data = kristofferData;
    lineChart.data.datasets[1].data = guroData;
    lineChart.update('active');
}

// PDF Generation Function
function generatePDF() {
    // Simple window.print() approach for now
    // Create a new window with formatted content
    const printWindow = window.open('', '_blank');
    
    // Calculate monthly totals
    let kristofferTotal = 0;
    let guroTotal = 0;
    let totalMonthly = 0;
    
    expenseData.groups.forEach(group => {
        group.expenses.forEach(expense => {
            kristofferTotal += expense.shares.kristoffer;
            guroTotal += expense.shares.guro;
            totalMonthly += expense.amount;
        });
    });
    
    // Calculate yearly totals
    const yearlyTotalKristoffer = expenseData.yearlyData.reduce((sum, data) => sum + data.kristoffer, 0);
    const yearlyTotalGuro = expenseData.yearlyData.reduce((sum, data) => sum + data.guro, 0);
    const grandYearlyTotal = yearlyTotalKristoffer + yearlyTotalGuro;
    
    const currentDate = new Date().toLocaleDateString('no-NO');
    
    // Generate HTML content for printing
    const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Natthav - Komplett Utgiftsrapport</title>
            <style>
                body { 
                    font-family: Arial, sans-serif; 
                    margin: 20px; 
                    color: #333; 
                    line-height: 1.4;
                }
                .header { 
                    text-align: center; 
                    margin-bottom: 30px; 
                    border-bottom: 2px solid #667eea;
                    padding-bottom: 15px;
                }
                .header h1 { 
                    color: #667eea; 
                    margin: 0; 
                    font-size: 28px;
                }
                .header p { 
                    color: #666; 
                    margin: 5px 0; 
                    font-size: 14px;
                }
                .section { 
                    margin: 30px 0; 
                    page-break-inside: avoid;
                }
                .section h2 { 
                    color: #667eea; 
                    border-bottom: 2px solid #667eea;
                    padding-bottom: 8px;
                    font-size: 20px;
                    margin-bottom: 15px;
                }
                .section h3 { 
                    color: #764ba2; 
                    border-bottom: 1px solid #ddd;
                    padding-bottom: 5px;
                    font-size: 16px;
                    margin: 20px 0 10px 0;
                }
                .participant { 
                    margin: 10px 0; 
                    padding: 12px;
                    background: #f8f9fa;
                    border-radius: 8px;
                    border-left: 4px solid #667eea;
                }
                .expense-group { 
                    margin: 15px 0; 
                    border: 1px solid #e0e0e0;
                    border-radius: 8px;
                    overflow: hidden;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                }
                .group-header { 
                    background: #667eea; 
                    color: white; 
                    padding: 12px; 
                    font-weight: bold;
                    font-size: 16px;
                }
                .expense-item { 
                    padding: 10px 15px; 
                    border-bottom: 1px solid #f0f0f0;
                }
                .expense-item:last-child { 
                    border-bottom: none; 
                }
                .summary { 
                    background: #f8f9fa; 
                    padding: 20px; 
                    border-radius: 8px;
                    margin: 20px 0;
                    border: 1px solid #e0e0e0;
                }
                .stats-grid {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 15px;
                    margin: 15px 0;
                }
                .stat-box {
                    background: white;
                    padding: 15px;
                    border-radius: 8px;
                    border: 1px solid #e0e0e0;
                    text-align: center;
                }
                .stat-value {
                    font-size: 20px;
                    font-weight: bold;
                    color: #667eea;
                    margin-bottom: 5px;
                }
                .stat-label {
                    font-size: 12px;
                    color: #666;
                }
                .yearly-table {
                    width: 100%;
                    border-collapse: collapse;
                    margin: 15px 0;
                    background: white;
                    border-radius: 8px;
                    overflow: hidden;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                }
                .yearly-table th {
                    background: #667eea;
                    color: white;
                    padding: 12px;
                    text-align: left;
                    font-weight: 600;
                }
                .yearly-table td {
                    padding: 10px 12px;
                    border-bottom: 1px solid #f0f0f0;
                }
                .yearly-table tr:last-child td {
                    border-bottom: none;
                }
                .yearly-amount {
                    font-weight: 600;
                    color: #667eea;
                }
                .yearly-total {
                    font-weight: bold;
                    color: #333;
                    font-size: 14px;
                }
                .chart-placeholder {
                    background: #f8f9fa;
                    border: 2px dashed #667eea;
                    padding: 40px;
                    text-align: center;
                    color: #667eea;
                    border-radius: 8px;
                    margin: 15px 0;
                }
                @media print {
                    body { margin: 0; font-size: 12px; }
                    .no-print { display: none; }
                    .section { page-break-inside: avoid; }
                    .header h1 { font-size: 24px; }
                    .section h2 { font-size: 18px; }
                }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>Natthav - Komplett Utgiftsrapport</h1>
                <p>Generert: ${currentDate}</p>
                <p>Omfattende oversikt over alle utgifter, budsjetter og årlige data</p>
            </div>
            
            <div class="section">
                <h2>📊 Hovedoversikt</h2>
                <div class="stats-grid">
                    <div class="stat-box">
                        <div class="stat-value">${totalMonthly.toLocaleString()} kr</div>
                        <div class="stat-label">Totale månedlige utgifter</div>
                    </div>
                    <div class="stat-box">
                        <div class="stat-value">${(totalMonthly * 12).toLocaleString()} kr</div>
                        <div class="stat-label">Årlige totalkostnader (estimert)</div>
                    </div>
                    <div class="stat-box">
                        <div class="stat-value">${kristofferTotal.toLocaleString()} kr</div>
                        <div class="stat-label">Kristoffer månedlig (${totalMonthly > 0 ? Math.round(kristofferTotal/totalMonthly*100) : 0}%)</div>
                    </div>
                    <div class="stat-box">
                        <div class="stat-value">${guroTotal.toLocaleString()} kr</div>
                        <div class="stat-label">Guro månedlig (${totalMonthly > 0 ? Math.round(guroTotal/totalMonthly*100) : 0}%)</div>
                    </div>
                </div>
            </div>

            <div class="section">
                <h2>👥 Deltakere og Budsjett</h2>
                <div class="participant">
                    <strong>${expenseData.participants.kristoffer.name}</strong><br>
                    <strong>Månedlig budsjett:</strong> ${expenseData.participants.kristoffer.budget.toLocaleString()} kr<br>
                    <strong>Faktiske utgifter:</strong> ${kristofferTotal.toLocaleString()} kr<br>
                    <strong>Budsjett-status:</strong> ${expenseData.participants.kristoffer.budget - kristofferTotal >= 0 ? 
                        `+${(expenseData.participants.kristoffer.budget - kristofferTotal).toLocaleString()} kr tilgjengelig` : 
                        `${Math.abs(expenseData.participants.kristoffer.budget - kristofferTotal).toLocaleString()} kr over budsjett`}
                </div>
                <div class="participant">
                    <strong>${expenseData.participants.guro.name}</strong><br>
                    <strong>Månedlig budsjett:</strong> ${expenseData.participants.guro.budget.toLocaleString()} kr<br>
                    <strong>Faktiske utgifter:</strong> ${guroTotal.toLocaleString()} kr<br>
                    <strong>Budsjett-status:</strong> ${expenseData.participants.guro.budget - guroTotal >= 0 ? 
                        `+${(expenseData.participants.guro.budget - guroTotal).toLocaleString()} kr tilgjengelig` : 
                        `${Math.abs(expenseData.participants.guro.budget - guroTotal).toLocaleString()} kr over budsjett`}
                </div>
            </div>
            
            <div class="section">
                <h2>Utgiftsgrupper</h2>
                ${expenseData.groups.map(group => {
                    const groupTotal = group.expenses.reduce((sum, expense) => sum + expense.amount, 0);
                    return `
                        <div class="expense-group">
                            <div class="group-header">
                                ${group.emoji} ${group.name} - ${groupTotal.toLocaleString()} kr/mnd
                            </div>
                            ${group.expenses.map(expense => {
                                const kristofferPercentage = Math.round((expense.shares.kristoffer / expense.amount) * 100);
                                const guroPercentage = 100 - kristofferPercentage;
                                return `
                                    <div class="expense-item">
                                        <strong>${expense.name}:</strong> ${expense.amount.toLocaleString()} kr<br>
                                        &nbsp;&nbsp;• ${expenseData.participants.kristoffer.name}: ${expense.shares.kristoffer.toLocaleString()} kr (${kristofferPercentage}%)<br>
                                        &nbsp;&nbsp;• ${expenseData.participants.guro.name}: ${expense.shares.guro.toLocaleString()} kr (${guroPercentage}%)
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    `;
                }).join('')}
            </div>
            
            ${expenseData.yearlyData.length > 0 ? `
            <div class="section">
                <h2>📅 Årlig Oversikt</h2>
                
                <h3>Registrerte årlige data</h3>
                <table class="yearly-table">
                    <thead>
                        <tr>
                            <th>År</th>
                            <th>Kristoffer</th>
                            <th>Guro</th>
                            <th>Totalt</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${expenseData.yearlyData.map(data => `
                            <tr>
                                <td><strong>${data.year}</strong></td>
                                <td class="yearly-amount">${data.kristoffer.toLocaleString()} kr</td>
                                <td class="yearly-amount">${data.guro.toLocaleString()} kr</td>
                                <td class="yearly-total">${data.total.toLocaleString()} kr</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
                
                <h3>Årlig sammendrag</h3>
                <div class="summary">
                    <strong>Total årlige utgifter (alle år):</strong> ${grandYearlyTotal.toLocaleString()} kr<br>
                    <strong>Kristoffers andel:</strong> ${yearlyTotalKristoffer.toLocaleString()} kr (${grandYearlyTotal > 0 ? Math.round(yearlyTotalKristoffer/grandYearlyTotal*100) : 0}%)<br>
                    <strong>Guros andel:</strong> ${yearlyTotalGuro.toLocaleString()} kr (${grandYearlyTotal > 0 ? Math.round(yearlyTotalGuro/grandYearlyTotal*100) : 0}%)<br>
                    <strong>Gjennomsnitt per år:</strong> ${expenseData.yearlyData.length > 0 ? Math.round(grandYearlyTotal / expenseData.yearlyData.length).toLocaleString() : 0} kr
                </div>
            </div>
            ` : ''}
            
            
            <div class="no-print" style="margin-top: 30px; text-align: center;">
                <button onclick="window.print()" style="padding: 10px 20px; background: #667eea; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 16px;">
                    📄 Skriv ut som PDF
                </button>
                <button onclick="window.close()" style="padding: 10px 20px; background: #6c757d; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 16px; margin-left: 10px;">
                    Lukk
                </button>
            </div>
        </body>
        </html>
    `;
    
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    
    // Auto-focus the new window
    printWindow.focus();
}

// PDF Report Generation with Charts
async function generatePDFReport() {
    try {
        // Disable button during generation
        const btn = document.querySelector('.pdf-download-btn');
        btn.disabled = true;
        btn.textContent = 'Genererer PDF...';
        
        // Initialize jsPDF
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('p', 'mm', 'a4');
        
        // Page dimensions
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const margin = 20;
        
        // Colors
        const primaryColor = [102, 126, 234]; // #667eea
        const secondaryColor = [118, 75, 162]; // #764ba2
        
        // Header with gradient effect
        doc.setFillColor(...primaryColor);
        doc.rect(0, 0, pageWidth, 40, 'F');
        
        // Title
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(24);
        doc.setFont('helvetica', 'bold');
        doc.text('NATTHAV', margin, 25);
        
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.text('Utgiftsrapport for felles utgifter', margin, 32);
        
        // Date
        const now = new Date();
        const dateStr = now.toLocaleDateString('no-NO', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
        doc.text(`Generert: ${dateStr}`, pageWidth - margin, 25, { align: 'right' });
        
        let yPos = 55;
        
        // Reset text color
        doc.setTextColor(0, 0, 0);
        
        // Calculate totals
        let kristofferTotal = 0;
        let guroTotal = 0;
        let totalMonthly = 0;
        
        expenseData.groups.forEach(group => {
            group.expenses.forEach(expense => {
                kristofferTotal += expense.shares.kristoffer;
                guroTotal += expense.shares.guro;
                totalMonthly += expense.amount;
            });
        });
        
        // Summary section
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...primaryColor);
        doc.text('SAMMENDRAG', margin, yPos);
        yPos += 10;
        
        doc.setFontSize(11);
        doc.setTextColor(0, 0, 0);
        doc.setFont('helvetica', 'normal');
        
        // Summary boxes
        const boxWidth = (pageWidth - 3 * margin) / 2;
        const boxHeight = 25;
        
        // Kristoffer box
        doc.setFillColor(240, 248, 255);
        doc.rect(margin, yPos, boxWidth, boxHeight, 'F');
        doc.setDrawColor(...primaryColor);
        doc.rect(margin, yPos, boxWidth, boxHeight);
        
        doc.setFont('helvetica', 'bold');
        doc.text('Kristoffer Bjekvik', margin + 5, yPos + 8);
        doc.setFont('helvetica', 'normal');
        doc.text(`Månedlig: ${kristofferTotal.toLocaleString('no-NO')} kr`, margin + 5, yPos + 15);
        doc.text(`Budsjett: ${expenseData.participants.kristoffer.budget.toLocaleString('no-NO')} kr`, margin + 5, yPos + 20);
        
        // Guro box
        const gurobBoxX = margin + boxWidth + margin/2;
        doc.setFillColor(248, 240, 255);
        doc.rect(gurobBoxX, yPos, boxWidth, boxHeight, 'F');
        doc.setDrawColor(...secondaryColor);
        doc.rect(gurobBoxX, yPos, boxWidth, boxHeight);
        
        doc.setFont('helvetica', 'bold');
        doc.text('Guro Kyte Solvik', gurobBoxX + 5, yPos + 8);
        doc.setFont('helvetica', 'normal');
        doc.text(`Månedlig: ${guroTotal.toLocaleString('no-NO')} kr`, gurobBoxX + 5, yPos + 15);
        doc.text(`Budsjett: ${expenseData.participants.guro.budget.toLocaleString('no-NO')} kr`, gurobBoxX + 5, yPos + 20);
        
        yPos += 35;
        
        // Total
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.text(`Total månedlige utgifter: ${totalMonthly.toLocaleString('no-NO')} kr`, margin, yPos);
        yPos += 15;
        
        // Add spacing before detailed breakdown
        yPos += 10;
        
        // Detailed breakdown
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...primaryColor);
        doc.text('DETALJERT OVERSIKT', margin, yPos);
        yPos += 15;
        
        // Group details
        expenseData.groups.forEach(group => {
            if (yPos > pageHeight - 40) {
                doc.addPage();
                yPos = margin;
            }
            
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(...secondaryColor);
            doc.text(`${group.name}`, margin, yPos);
            yPos += 8;
            
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(0, 0, 0);
            
            group.expenses.forEach(expense => {
                if (yPos > pageHeight - 30) {
                    doc.addPage();
                    yPos = margin;
                }
                
                const kristofferAmount = expense.shares.kristoffer.toLocaleString('no-NO');
                const guroAmount = expense.shares.guro.toLocaleString('no-NO');
                
                doc.text(`- ${expense.name}: ${expense.amount.toLocaleString('no-NO')} kr`, margin + 5, yPos);
                doc.text(`  Kristoffer: ${kristofferAmount} kr | Guro: ${guroAmount} kr`, margin + 5, yPos + 4);
                yPos += 10;
            });
            
            yPos += 5;
        });
        
        // Footer
        const footerY = pageHeight - 15;
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        doc.text('Generert av Natthav - Felles utgifter for samboere', margin, footerY);
        doc.text(`Side 1 av ${doc.getNumberOfPages()}`, pageWidth - margin, footerY, { align: 'right' });
        
        // Save the PDF
        doc.save(`Natthav-rapport-${now.toISOString().split('T')[0]}.pdf`);
        
        // Reset button
        btn.disabled = false;
        btn.innerHTML = 'Last ned PDF-rapport';
        
    } catch (error) {
        console.error('PDF generation error:', error);
        alert('Det oppstod en feil ved generering av PDF. Prøv igjen.');
        
        // Reset button
        const btn = document.querySelector('.pdf-download-btn');
        btn.disabled = false;
        btn.innerHTML = 'Last ned PDF-rapport';
    }
}

// Function to switch to charts tab
function switchToChartsTab() {
    // Remove active class from all tabs and content
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    
    // Activate charts tab
    const chartsTabBtn = document.querySelector('[data-tab="charts"]');
    const chartsTabContent = document.getElementById('charts-tab');
    
    if (chartsTabBtn) chartsTabBtn.classList.add('active');
    if (chartsTabContent) chartsTabContent.classList.add('active');
    
    // Update charts if they exist
    if (typeof updateCharts === 'function') {
        setTimeout(updateCharts, 100); // Small delay to ensure tab is visible
    }
}

// Function to switch to yearly tab
function switchToYearlyTab() {
    // Remove active class from all tabs and content
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    
    // Activate yearly tab
    const yearlyTabBtn = document.querySelector('[data-tab="yearly"]');
    const yearlyTabContent = document.getElementById('yearly-tab');
    
    if (yearlyTabBtn) yearlyTabBtn.classList.add('active');
    if (yearlyTabContent) yearlyTabContent.classList.add('active');
    
    // Update yearly chart if it exists
    if (typeof updateYearlyChart === 'function') {
        setTimeout(updateYearlyChart, 100); // Small delay to ensure tab is visible
    }
}

// Yearly Overview Functions
function initializeYearlyTab() {
    renderYearlyTable();
    if (typeof Chart !== 'undefined') {
        initializeYearlyChart();
    } else {
        setTimeout(initializeYearlyTab, 100);
    }
}

function addYearlyData() {
    const yearInput = document.getElementById('year-input');
    const kristofferInput = document.getElementById('kristoffer-yearly');
    const guroInput = document.getElementById('guro-yearly');
    
    const year = parseInt(yearInput.value);
    const kristofferAmount = parseFloat(kristofferInput.value);
    const guroAmount = parseFloat(guroInput.value);
    
    if (!year || year < 2020 || year > 2030) {
        alert('Vennligst skriv inn et gyldig år (2020-2030)');
        return;
    }
    
    if (!kristofferAmount || kristofferAmount < 0) {
        alert('Vennligst skriv inn et gyldig beløp for Kristoffer');
        return;
    }
    
    if (!guroAmount || guroAmount < 0) {
        alert('Vennligst skriv inn et gyldig beløp for Guro');
        return;
    }
    
    // Check if year already exists
    const existingIndex = expenseData.yearlyData.findIndex(data => data.year === year);
    
    if (existingIndex !== -1) {
        if (confirm(`Data for ${year} eksisterer allerede. Vil du oppdatere den?`)) {
            expenseData.yearlyData[existingIndex] = {
                year: year,
                kristoffer: kristofferAmount,
                guro: guroAmount,
                total: kristofferAmount + guroAmount
            };
        } else {
            return;
        }
    } else {
        expenseData.yearlyData.push({
            year: year,
            kristoffer: kristofferAmount,
            guro: guroAmount,
            total: kristofferAmount + guroAmount
        });
    }
    
    // Sort by year
    expenseData.yearlyData.sort((a, b) => a.year - b.year);
    
    // Clear inputs
    kristofferInput.value = '';
    guroInput.value = '';
    yearInput.value = new Date().getFullYear();
    
    // Update display
    renderYearlyTable();
    updateYearlyChart();
}

function deleteYearlyData(year) {
    if (confirm(`Er du sikker på at du vil slette data for ${year}?`)) {
        expenseData.yearlyData = expenseData.yearlyData.filter(data => data.year !== year);
        renderYearlyTable();
        updateYearlyChart();
    }
}

function renderYearlyTable() {
    const tbody = document.getElementById('yearly-table-body');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    if (expenseData.yearlyData.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align: center; color: #666; font-style: italic;">
                    Ingen årlige data registrert ennå
                </td>
            </tr>
        `;
        return;
    }
    
    expenseData.yearlyData.forEach(data => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><strong>${data.year}</strong></td>
            <td class="yearly-amount">${data.kristoffer.toLocaleString()} kr</td>
            <td class="yearly-amount">${data.guro.toLocaleString()} kr</td>
            <td class="yearly-total">${data.total.toLocaleString()} kr</td>
            <td>
                <button class="delete-yearly-btn" onclick="deleteYearlyData(${data.year})">
                    🗑️ Slett
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function initializeYearlyChart() {
    const yearlyCtx = document.getElementById('yearlyChart');
    const yearlyPieCtx = document.getElementById('yearlyPieChart');
    
    if (yearlyCtx) {
        yearlyChart = new Chart(yearlyCtx, {
            type: 'bar',
            data: {
                labels: [],
                datasets: [{
                    label: 'Kristoffer Bjekvik',
                    data: [],
                    backgroundColor: '#667eea',
                    borderColor: '#667eea',
                    borderWidth: 1
                }, {
                    label: 'Guro Kyte Solvik',
                    data: [],
                    backgroundColor: '#764ba2',
                    borderColor: '#764ba2',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 20,
                            usePointStyle: true,
                            font: { size: 12 }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `${context.dataset.label}: ${context.parsed.y.toLocaleString()} kr`;
                            },
                            footer: function(tooltipItems) {
                                const year = tooltipItems[0].label;
                                const yearData = expenseData.yearlyData.find(data => data.year.toString() === year);
                                return yearData ? `Total: ${yearData.total.toLocaleString()} kr` : '';
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        stacked: true,
                        grid: { color: 'rgba(0,0,0,0.1)' }
                    },
                    y: {
                        stacked: true,
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return value.toLocaleString() + ' kr';
                            }
                        },
                        grid: { color: 'rgba(0,0,0,0.1)' }
                    }
                }
            }
        });
    }
    
    if (yearlyPieCtx) {
        yearlyPieChart = new Chart(yearlyPieCtx, {
            type: 'doughnut',
            data: {
                labels: ['Kristoffer Bjekvik', 'Guro Kyte Solvik'],
                datasets: [{
                    data: [0, 0],
                    backgroundColor: ['#667eea', '#764ba2'],
                    borderWidth: 0,
                    hoverBorderWidth: 3,
                    hoverBorderColor: '#fff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 20,
                            usePointStyle: true,
                            font: { size: 12 }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const value = context.parsed;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                                return [`${context.label}: ${value.toLocaleString()} kr`, `${percentage}% av total`];
                            }
                        }
                    }
                },
                cutout: '50%'
            }
        });
    }
    
    updateYearlyChart();
}

function updateYearlyChart() {
    // Update bar chart
    if (yearlyChart) {
        const labels = expenseData.yearlyData.map(data => data.year.toString());
        const kristofferData = expenseData.yearlyData.map(data => data.kristoffer);
        const guroData = expenseData.yearlyData.map(data => data.guro);
        
        yearlyChart.data.labels = labels;
        yearlyChart.data.datasets[0].data = kristofferData;
        yearlyChart.data.datasets[1].data = guroData;
        yearlyChart.update();
    }
    
    // Update pie chart with total distribution
    if (yearlyPieChart) {
        const totalKristoffer = expenseData.yearlyData.reduce((sum, data) => sum + data.kristoffer, 0);
        const totalGuro = expenseData.yearlyData.reduce((sum, data) => sum + data.guro, 0);
        
        yearlyPieChart.data.datasets[0].data = [totalKristoffer, totalGuro];
        yearlyPieChart.update();
    }
}