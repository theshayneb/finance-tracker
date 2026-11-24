import { Events, Notice, ObsidianProtocolData, Platform, Plugin, WorkspaceLeaf } from 'obsidian'
import { WalletFile } from './io/WalletFile'
import { TransactionModal } from './modal/TransactionModal'
import { MobileTransactionModal } from './modal/MobileTransactionModal'
import { DashboardView, DASHBOARD_VIEW_TYPE } from './view/DashboardView'
import { DetailView, DETAIL_VIEW_TYPE } from './view/DetailView'
import { BudgetView, BUDGET_VIEW_TYPE } from './view/BudgetView'
import { BUDGET_EMBED_LANG, BUDGET_EMBED_REFRESH, processBudgetEmbed } from './view/BudgetEmbed'
import { FOLLOW_UPS_EMBED_LANG, processFollowUpsEmbed } from './view/FollowUpsEmbed'
import { PennyWalletSettingTab } from './settings/SettingTab'
import { ValidationModal } from './modal/ValidationModal'
import { TransactionModalParams, TransactionType } from './types'
import { initI18n, t, translateCategory } from './i18n'
import { formatAmount, parseTagList } from './utils'
import { SubscriptionModal } from './modal/SubscriptionModal'
import { recordDueSubscriptions, saveSubscription } from './subscriptionRecorder'
import { toDateString } from './subscriptions'
import { CONFIG_BACKUP_KEY, backgroundTasksEnabled, syncSettled } from './device'

const SUBSCRIPTION_CHECK_INTERVAL_MS = 60 * 60 * 1000
const SETTLE_RETRY_MS = 60 * 1000

/** A notice with a heading line and one line per item. */
function noticeLines(heading: string, lines: string[]): DocumentFragment {
  return createFragment(frag => {
    frag.createDiv({ text: heading })
    for (const line of lines) frag.createDiv({ text: `• ${line}` })
  })
}

export default class PennyWalletPlugin extends Plugin {
  walletFile!: WalletFile
  private lastSubscriptionCheckDay = ''
  private readonly startedAt = Date.now()
  private lastVaultChange = 0
  private settleTimer = 0

  async onload() {
    initI18n()

    // Settings live in the plugin's data.json so Obsidian Sync carries them
    // ("Installed community plugins" sync); see onExternalSettingsChange.
    this.walletFile = new WalletFile(this.app, {
      load: () => this.loadData(),
      save: (config) => this.saveData(config),
      loadBackup: () => this.app.loadLocalStorage(CONFIG_BACKUP_KEY) as unknown,
      saveBackup: (config) => this.app.saveLocalStorage(CONFIG_BACKUP_KEY, config),
    })

    // ── All synchronous registrations FIRST (so ribbon/commands survive restart) ──
    this.registerView(DASHBOARD_VIEW_TYPE, (leaf) => new DashboardView(leaf, this.walletFile))
    this.registerView(DETAIL_VIEW_TYPE, (leaf) => new DetailView(leaf, this.walletFile))
    this.registerView(BUDGET_VIEW_TYPE, (leaf) => new BudgetView(leaf, this.walletFile))

    // ```finance-budget``` blocks in notes: one budget's progress bar
    this.registerMarkdownCodeBlockProcessor(BUDGET_EMBED_LANG, processBudgetEmbed(this.app, this.walletFile,
      (budget, yearMonth) => { void this.openOrRevealView(DETAIL_VIEW_TYPE, { yearMonth, filterBudget: budget, resetFilters: true }) }))

    // ```finance-followups``` blocks in notes: the Overview's Follow-ups card
    this.registerMarkdownCodeBlockProcessor(FOLLOW_UPS_EMBED_LANG, processFollowUpsEmbed(this.app, this.walletFile))

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
      // Rewrites month files, so only on the device that does automatic work.
      if (backgroundTasksEnabled(this.app)) await this.walletFile.bootstrapFrontmatter()

      // First-launch onboarding: only when config is created in this load
      if (this.walletFile.didCreateDefaultConfigOnLastLoad()) {
        new Notice(t('onboard.welcome'), 8000)
      }

      if (this.walletFile.getConfig().autoValidateOnLoad) {
        void this.runValidation(false)
      }

      // Sync writes other devices' changes as file changes: automatic work waits
      // until the vault has been quiet for a while (see syncSettled).
      for (const name of ['modify', 'create', 'delete', 'rename'] as const) {
        this.registerEvent(this.app.vault.on(name as 'modify', () => { this.lastVaultChange = Date.now() }))
      }
      this.register(() => window.clearTimeout(this.settleTimer))
      this.app.workspace.onLayoutReady(() => { void this.checkSubscriptions() })
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
  // Merged with this device's settings, never simply loaded: the synced copy may be older.
  async onExternalSettingsChange() {
    await this.walletFile.reconcileConfig()
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

  /**
   * Refreshes the views when the day has changed, so the overview's Upcoming
   * bills card stays current in an Obsidian that is never closed. On the device
   * that runs background tasks, also records due subscription charges, once
   * Sync has settled (checked again every minute until it has).
   */
  async checkSubscriptions() {
    try {
      const dp = this.walletFile.getConfig().decimalPlaces ?? 0
      const today = toDateString(new Date())
      const newDay = this.lastSubscriptionCheckDay !== '' && this.lastSubscriptionCheckDay !== today
      this.lastSubscriptionCheckDay = today
      if (newDay) this.refreshViews()
      if (!backgroundTasksEnabled(this.app)) return
      if (!syncSettled(this.app, this.startedAt, this.lastVaultChange)) {
        window.clearTimeout(this.settleTimer)
        this.settleTimer = window.setTimeout(() => { void this.checkSubscriptions() }, SETTLE_RETRY_MS)
        return
      }
      const recorded = await recordDueSubscriptions(this.walletFile, today)
      if (recorded.length > 0) {
        const lines = recorded.map(({ sub, date }) => `${sub.name} · ${date} · ${formatAmount(sub.amount, dp)}`)
        new Notice(noticeLines(t('notice.subscriptionsRecorded'), lines), 10000)
      }
      if (recorded.length > 0) this.refreshViews()
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
