export type TransactionType = 'expense' | 'income' | 'transfer'
export type WalletType = 'cash' | 'bank' | 'creditCard'

export interface Transaction {
  date: string        // MM/DD format as stored in markdown (e.g. "04/03")
  type: TransactionType
  wallet?: string     // expense / income
  fromWallet?: string // transfer / repayment
  toWallet?: string   // transfer / repayment
  category?: string   // expense / income; default categories stored as key (e.g. "food"), custom as raw string
  note: string
  tags?: string[]
  amount: number
  createdAt?: string  // ISO 8601 timestamp; absent in data written before this field was added
  budget?: string     // expense only; name of a Budget in config.budgets
}

export interface Budget {
  name: string
  amount: number  // monthly amount; resets every month
}

export type SubscriptionFrequency = 'monthly' | 'quarterly' | 'yearly'

/** A recurring bill; each charge is recorded as an expense on its date. */
export interface Subscription {
  id: string
  name: string            // also the note on the recorded expense
  amount: number
  frequency: SubscriptionFrequency
  startDate: string       // yyyy-mm-dd: the first charge; later ones follow from its day of the month
  wallet: string
  category: string
  tags?: string[]
  budget?: string
  autoRecord: boolean     // false: only remind; the charge is recorded by hand
  lastRecorded?: string   // yyyy-mm-dd of the latest charge recorded or skipped
}

export interface Wallet {
  name: string
  type: WalletType
  initialBalance: number  // creditCard: positive number = debt amount
  status: 'active' | 'archived'
  includeInNetAsset: boolean  // active wallets always true; archived wallets can be toggled
}

export interface MonthSummary {
  income: number
  expense: number
  netAsset: number
}

export interface WalletBalance {
  wallet: Wallet
  balance: number   // creditCard: positive = debt owed (displayed as negative in net asset)
}

export interface OptionsListGroup {
  default: string[]   // built-in, immutable
  custom: string[]    // user-defined
  hidden?: string[]   // built-in keys the user removed from pickers
}

export interface PennyWalletOptions {
  types: OptionsListGroup
  categories: {
    expense: OptionsListGroup
    income: OptionsListGroup
    transfer: OptionsListGroup
  }
}

export interface PennyWalletConfig {
  wallets: Wallet[]
  defaultWallet: string
  folderName: string
  decimalPlaces: 0 | 2
  options: PennyWalletOptions
  tags: string[]
  budgets: Budget[]
  autoValidateOnLoad: boolean
  chartExcludedTags: string[]  // tags left out of the Overview's tag chart
  followUpTag: string          // tag listed in the Overview's Follow-ups card ('' = hide it)
  subscriptions: Subscription[]
  billReminderDays: number     // how many days ahead upcoming bills are shown
  billReminderNotice: boolean  // also pop up a notice (once a day) about upcoming bills
}

export interface TransactionModalParams {
  type?: TransactionType
  amount?: number
  note?: string
  tags?: string[]
  category?: string
  wallet?: string
  fromWallet?: string
  toWallet?: string
  budget?: string
  date?: string  // yyyy-mm-dd
}

// Default category keys
export const DEFAULT_EXPENSE_CATEGORIES = [
  'food', 'clothing', 'housing', 'transport', 'education',
  'entertainment', 'shopping', 'medical', 'cash_expense',
  'insurance', 'fees', 'tax',
] as const

export const DEFAULT_INCOME_CATEGORIES = [
  'salary', 'interest', 'side_income', 'bonus', 'lottery',
  'rent', 'cashback', 'dividend', 'investment_profit',
  'insurance_income', 'pension',
] as const

export const DEFAULT_TRANSFER_CATEGORIES = [
  'account_transfer', 'credit_card_payment',
  'investment_trade',
] as const

export const DEFAULT_CONFIG: PennyWalletConfig = {
  wallets: [
    {
      name: 'Default Wallet',
      type: 'cash',
      initialBalance: 0,
      status: 'active',
      includeInNetAsset: true,
    }
  ],
  defaultWallet: 'Default Wallet',
  folderName: 'PennyWallet',
  decimalPlaces: 0,
  options: {
    types: {
      default: ['expense', 'income', 'transfer'],
      custom: [],
    },
    categories: {
      expense: {
        default: [...DEFAULT_EXPENSE_CATEGORIES],
        custom: [],
      },
      income: {
        default: [...DEFAULT_INCOME_CATEGORIES],
        custom: [],
      },
      transfer: {
        default: [...DEFAULT_TRANSFER_CATEGORIES],
        custom: [],
      },
    },
  },
  tags: [],
  budgets: [],
  autoValidateOnLoad: true,
  chartExcludedTags: ['follow_up'],
  followUpTag: 'follow_up',
  subscriptions: [],
  billReminderDays: 3,
  billReminderNotice: true,
}

export interface FrontmatterIssue {
  type: 'frontmatter'
  yearMonth: string
  storedIncome: number
  storedExpense: number
  actualIncome: number
  actualExpense: number
}

export interface OrphanedWalletIssue {
  type: 'orphanedWallet'
  walletName: string
  transactionCount: number
  yearMonths: string[]
}

export type ValidationIssue = FrontmatterIssue | OrphanedWalletIssue
