import { Events, Notice, ObsidianProtocolData, Platform, Plugin, WorkspaceLeaf } from 'obsidian'
import { WalletFile } from './io/WalletFile'
import { TransactionModal } from './modal/TransactionModal'
import { MobileTransactionModal } from './modal/MobileTransactionModal'
import { DashboardView, DASHBOARD_VIEW_TYPE } from './view/DashboardView'
import { DetailView, DETAIL_VIEW_TYPE } from './view/DetailView'
import { BudgetView, BUDGET_VIEW_TYPE } from './view/BudgetView'
import { BUDGET_EMBED_LANG, BUDGET_EMBED_REFRESH, processBudgetEmbed } from './view/BudgetEmbed'
import { PennyWalletSettingTab } from './settings/SettingTab'
import { ValidationModal } from './modal/ValidationModal'
import { TransactionModalParams, TransactionType } from './types'
import { initI18n, t, translateCategory } from './i18n'
import { formatAmount, parseTagList } from './utils'
import { SubscriptionModal } from './modal/SubscriptionModal'
import { recordDueSubscriptions, saveSubscription } from './subscriptionRecorder'
import { toDateString } from './subscriptions'
import { formatDueIn, getUpcomingBills } from './view/UpcomingBills'

/** Device-local (not synced) record of the day the bill reminder last popped up. */
const REMINDER_SHOWN_KEY = 'penny-wallet-mod:bill-reminder-shown'
// Wait after startup so Obsidian Sync can bring in charges another device already recorded.
const SUBSCRIPTION_STARTUP_DELAY_MS = 15_000
const SUBSCRIPTION_CHECK_INTERVAL_MS = 60 * 60 * 1000

/** A notice with a heading line and one line per item. */
function noticeLines(heading: string, lines: string[]): DocumentFragment {
  return createFragment(frag => {
    frag.createDiv({ text: heading })
    for (const line of lines) frag.createDiv({ text: `• ${line}` })
  })
}

export default class PennyWalletPlugin extends Plugin {
  walletFile!: WalletFile

  async onload() {
    initI18n()

    // Settings live in the plugin's data.json so Obsidian Sync carries them
    // ("Installed community plugins" sync); see onExternalSettingsChange.
    this.walletFile = new WalletFile(this.app, {
      load: () => this.loadData(),
      save: (config) => this.saveData(config),
    })

    // ── All synchronous registrations FIRST (so ribbon/commands survive restart) ──
    this.registerView(DASHBOARD_VIEW_TYPE, (leaf) => new DashboardView(leaf, this.walletFile))
    this.registerView(DETAIL_VIEW_TYPE, (leaf) => new DetailView(leaf, this.walletFile))
    this.registerView(BUDGET_VIEW_TYPE, (leaf) => new BudgetView(leaf, this.walletFile))

    // ```finance-budget``` blocks in notes: one budget's progress bar
    this.registerMarkdownCodeBlockProcessor(BUDGET_EMBED_LANG, processBudgetEmbed(this.app, this.walletFile,
      (budget, yearMonth) => { void this.openOrRevealView(DETAIL_VIEW_TYPE, { yearMonth, filterBudget: budget, resetFilters: true }) }))

    this.addRibbonIcon('wallet', 'Finance tracker', () => { void this.openDashboard() })

    this.addCommand({ id: 'open-dashboard', name: 'Open finance overview', callback: () => { void this.openDashboard() } })
    this.addCommand({ id: 'open-detail', name: 'Open transactions', callback: () => { void this.openDetailView() } })
    this.addCommand({ id: 'open-budgets', name: 'Open budgets', callback: () => { void this.openOrRevealView(BUDGET_VIEW_TYPE) } })
    this.addCommand({ id: 'add-transaction', name: 'Add transaction', callback: () => this.openTransactionModal() })
    this.addCommand({ id: 'add-subscription', name: 'Add subscription or recurring bill', callback: () => {
      new SubscriptionModal(this.app, this.walletFile, null, async (saved) => {
        await saveSubscription(this.walletFile, saved)
        await this.checkSubscriptions()
        this.refreshViews()
      }).open()
    } })
    this.addCommand({ id: 'validate-data', name: 'Validate data', callback: () => void this.runValidation(true) })
    this.addCommand({ id: 'refresh', name: 'Refresh views', callback: () => {
      this.app.workspace.trigger('penny-wallet-mod:refresh')
    } })
    this.addCommand({ id: 'open-settings', name: 'Open settings', callback: () => {
      const setting = (this.app as unknown as { setting: { open(): void; openTabById(id: string): void } }).setting
      setting.open()
      setting.openTabById(this.manifest.id)
    } })

    this.addSettingTab(new PennyWalletSettingTab(this.app, this, this.walletFile))

    this.registerObsidianProtocolHandler('penny-wallet-mod', (params: ObsidianProtocolData) => {
      this.handleURI(params)
    })

    // ── Async work AFTER all synchronous registrations ──
    try {
      await this.walletFile.loadConfig()
      await this.walletFile.bootstrapFrontmatter()

      // First-launch onboarding: only when config is created in this load
      if (this.walletFile.didCreateDefaultConfigOnLastLoad()) {
        new Notice(t('onboard.welcome'), 8000)
      }

      if (this.walletFile.getConfig().autoValidateOnLoad) {
        void this.runValidation(false)
      }

      this.app.workspace.onLayoutReady(() => {
        const timer = window.setTimeout(() => { void this.checkSubscriptions() }, SUBSCRIPTION_STARTUP_DELAY_MS)
        this.register(() => window.clearTimeout(timer))
      })
      this.registerInterval(window.setInterval(() => { void this.checkSubscriptions() }, SUBSCRIPTION_CHECK_INTERVAL_MS))
      this.registerEvent((this.app.workspace as Events).on('penny-wallet-mod:subscriptions-changed', () => {
        void this.checkSubscriptions()
      }))
    } catch (e) {
      console.error('Finance Tracker: failed to load config', e)
      new Notice(t('notice.loadFailed'))
    }
  }

  // Called by Obsidian when data.json changes on disk, e.g. synced from another device.
  async onExternalSettingsChange() {
    await this.walletFile.loadConfig()
    this.refreshViews()
  }

  // ── Validation ──────────────────────────────────────────────────────────────

  async runValidation(showNoticeIfClean: boolean) {
    const issues = await this.walletFile.validateAllData()
    if (issues.length === 0) {
      if (showNoticeIfClean) new Notice(t('notice.validationClean'))
      return
    }
    new ValidationModal(this.app, this.walletFile, issues).open()
  }

  // ── Subscriptions ─────────────────────────────────────────────────────────

  /** Records due subscription charges, then pops up the daily reminder of bills due soon. */
  async checkSubscriptions() {
    try {
      const dp = this.walletFile.getConfig().decimalPlaces ?? 0
      const recorded = await recordDueSubscriptions(this.walletFile, toDateString(new Date()))
      if (recorded.length > 0) {
        const lines = recorded.map(({ sub, date }) => `${sub.name} · ${date} · ${formatAmount(sub.amount, dp)}`)
        new Notice(noticeLines(t('notice.subscriptionsRecorded'), lines), 10000)
        this.refreshViews()
      }

      const config = this.walletFile.getConfig()
      const today = toDateString(new Date())
      if (!(config.billReminderNotice ?? true) || this.app.loadLocalStorage(REMINDER_SHOWN_KEY) === today) return
      const bills = getUpcomingBills(this.walletFile)
      if (bills.length === 0) return
      const lines = bills.map(({ sub, days }) => `${sub.name} · ${formatDueIn(days)} · ${formatAmount(sub.amount, dp)}`)
      new Notice(noticeLines(t('notice.billsComingUp'), lines), 15000)
      this.app.saveLocalStorage(REMINDER_SHOWN_KEY, today)
    } catch (e) {
      console.error('Finance Tracker: subscription check failed', e)
    }
  }

  // ── Open Views ──────────────────────────────────────────────────────────────

  async openDashboard() {
    await this.openOrRevealView(DASHBOARD_VIEW_TYPE)
  }

  async openDetailView(yearMonth?: string) {
    await this.openOrRevealView(DETAIL_VIEW_TYPE, yearMonth ? { yearMonth } : undefined)
  }

  openTransactionModal(params: TransactionModalParams = {}) {
    const ModalClass = Platform.isMobile ? MobileTransactionModal : TransactionModal
    new ModalClass(
      this.app,
      this.walletFile,
      params,
      null,
      null,
      () => this.refreshViews(),
    ).open()
  }

  // ── URI Handler ─────────────────────────────────────────────────────────────

  private handleURI(data: ObsidianProtocolData) {
    const params: TransactionModalParams = {}

    if (data['type']) params.type = data['type'] as TransactionType
    if (data['amount']) {
      const amount = parseFloat(data['amount'])
      if (!Number.isNaN(amount)) params.amount = amount
    }
    if (data['note']) params.note = data['note']
    if (data['tags']) params.tags = parseTagList(data['tags'])
    if (data['category']) params.category = this.resolveCategory(data['category'], params.type ?? 'expense')
    if (data['wallet']) params.wallet = data['wallet']
    if (data['fromWallet']) params.fromWallet = data['fromWallet']
    if (data['toWallet']) params.toWallet = data['toWallet']
    if (data['budget']) {
      const name = data['budget']
      const budgets = this.walletFile.getConfig().budgets ?? []
      params.budget = budgets.find(b => b.name.toLowerCase() === name.toLowerCase())?.name ?? name
    }
    if (data['date']) params.date = data['date']

    this.openTransactionModal(params)
  }

  /** Accepts a category's key or its label as shown in the app (any case). */
  private resolveCategory(value: string, type: TransactionType): string {
    const group = this.walletFile.getConfig().options.categories[type]
    const keys = group ? [...group.default, ...group.custom] : []
    const wanted = value.trim().toLowerCase()
    return keys.find(k => k.toLowerCase() === wanted)
      ?? keys.find(k => translateCategory(k).toLowerCase() === wanted)
      ?? value
  }

  // ── Refresh ─────────────────────────────────────────────────────────────────

  private refreshViews() {
    this.app.workspace.trigger(BUDGET_EMBED_REFRESH)
    // Refresh all open plugin leaves
    this.app.workspace.getLeavesOfType(DASHBOARD_VIEW_TYPE).forEach((leaf: WorkspaceLeaf) => {
      void (leaf.view as DashboardView).render()
    })
    this.app.workspace.getLeavesOfType(DETAIL_VIEW_TYPE).forEach((leaf: WorkspaceLeaf) => {
      void (leaf.view as DetailView).render()
    })
    this.app.workspace.getLeavesOfType(BUDGET_VIEW_TYPE).forEach((leaf: WorkspaceLeaf) => {
      void (leaf.view as BudgetView).render()
    })
  }

  private async openOrRevealView(type: string, state?: Record<string, unknown>) {
    const existing = this.app.workspace.getLeavesOfType(type)
    const leaf = existing[0] ?? this.app.workspace.getLeaf('tab')

    await leaf.setViewState({
      type,
      active: true,
      state,
    })

    void this.app.workspace.revealLeaf(leaf)
  }
}
