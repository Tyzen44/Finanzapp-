// ============= APP VERSION & CACHE MANAGEMENT =============
const APP_VERSION = '2.1.1';
const BUILD_TIME = '2025-01-28T12:00:00Z';

// ============= GLOBAL CONSTANTS =============
// Define savings categories ONCE here for all files to use
const SAVINGS_CATEGORIES = ['Säule 3a', 'Säule 3b', 'Notgroschen', 'Investitionen/ETFs', 'Aktien/Trading', 'Sparkonto'];

// ============= GITHUB GIST CONFIG ============= 
const GITHUB_CONFIG = {
    token: '', // Always load from localStorage
    gistId: null, 
    filename: 'swiss-finance-sven-franzi.json'
};

// ============= GLOBAL VARIABLES ============= 
let appData = {
    currentProfile: 'family', // 'sven', 'franzi', 'family'
    profiles: {
        sven: {
            name: 'Sven',
            income: 0
        },
        franzi: {
            name: 'Franzi',
            income: 0
        }
    },
    accounts: {
        sven: { balance: 0, name: 'Sven Privat' },
        franzi: { balance: 0, name: 'Franzi Privat' },
        shared: { balance: 0, name: 'Gemeinschaftskonto' }
    },
    fixedExpenses: [],
    variableExpenses: [],
    debts: [],
    transfers: [],
    wealthHistory: [],
    monthlyFoodBudget: 800,
    currentMonthFoodSpent: 0,
    foodPurchases: []
};

// Global Sync State
let syncState = {
    isOnline: navigator.onLine,
    lastSyncTime: null,
    syncInProgress: false,
    syncErrors: 0,
    gistUrl: null
};

// Current editing states
let currentExpense = null;
let currentExpenseType = null;
let currentDebt = null;
let currentEditAccount = null;

// App visibility state for resume handling
let lastResumeCheck = 0;
let isAppVisible = true;
