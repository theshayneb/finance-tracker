import { App, Modal, Notice, Setting } from 'obsidian'
import type { WalletFile } from '../io/WalletFile'
import type { Subscription, SubscriptionFrequency } from '../types'
import { t } from '../i18n'
import { parseTagList } from '../utils'
import { getBudgetOptions, getCategoryOptions, resolveDefaultWallet } from './transactionState'
import { isValidDateString, newSubscriptionId, nextChargeDate, toDateString, validateSubscriptionName } from '../subscriptions'

const FREQUENCIES: SubscriptionFrequency[] = ['monthly', 'quarterly', 'yearly']

/** Adds or edits a subscription. `onSave` gets the finished subscription. */
export class SubscriptionModal extends Modal {
  private walletFile: WalletFile
  private editing: Subscription | null
  private onSave: (sub: Subscription) => void | Promise<void>

  private name = ''
  private amount = ''
  private frequency: SubscriptionFrequency = 'monthly'
  private nextDate = ''
  private wallet = ''
  private category = ''
  private budget = ''
  private tags = ''
  private autoRecord = true

  constructor(
    app: App,
    walletFile: WalletFile,
    editing: Subscription | null,
    onSave: (sub: Subscription) => void | Promise<void>,
  ) {
    super(app)
    this.walletFile = walletFile
    this.editing = editing
    this.onSave = onSave
  }

  onOpen() {
    const config = this.walletFile.getConfig()
    const sub = this.editing
    const initialNext = sub ? nextChargeDate(sub) ?? sub.startDate : toDateString(new Date())
    this.name = sub?.name ?? ''
    this.amount = sub ? String(sub.amount) : ''
    this.frequency = sub?.frequency ?? 'monthly'
    this.nextDate = initialNext
    this.wallet = sub?.wallet ?? resolveDefaultWallet(config, 'expense')
    const categories = getCategoryOptions(config, 'expense', sub?.category ?? '')
    this.category = sub?.category ?? categories[0]?.key ?? ''
    this.budget = sub?.budget ?? ''
    this.tags = (sub?.tags ?? []).join(', ')
    this.autoRecord = sub?.autoRecord ?? true

    const { contentEl } = this
    contentEl.addClass('pw-modal', 'pw-subscription-modal')
    this.setTitle(t(sub ? 'sub.editTitle' : 'sub.addTitle'))

    new Setting(contentEl)
      .setName(t('sub.name'))
      .setDesc(t('sub.nameDesc'))
      .addText(text => text
        .setPlaceholder(t('sub.namePlaceholder'))
        .setValue(this.name)
        .onChange(v => { this.name = v }))

    new Setting(contentEl)
      .setName(t('modal.amount'))
      .addText(text => {
        text.inputEl.type = 'number'
        text.inputEl.min = '0'
        text.inputEl.step = 'any'
        text.setValue(this.amount).onChange(v => { this.amount = v })
      })

    new Setting(contentEl)
      .setName(t('sub.frequency'))
      .addDropdown(drop => {
        for (const f of FREQUENCIES) drop.addOption(f, t(`label.freq.${f}`))
        drop.setValue(this.frequency).onChange(v => { this.frequency = v as SubscriptionFrequency })
      })

    new Setting(contentEl)
      .setName(t('sub.nextCharge'))
      .setDesc(t('sub.nextChargeDesc'))
      .addText(text => {
        text.inputEl.type = 'date'
        text.setValue(this.nextDate).onChange(v => { this.nextDate = v })
      })

    new Setting(contentEl)
      .setName(t('modal.wallet'))
      .addDropdown(drop => {
        const names = config.wallets.filter(w => w.status === 'active').map(w => w.name)
        if (this.wallet && !names.includes(this.wallet)) names.push(this.wallet)
        for (const name of names) drop.addOption(name, name)
        drop.setValue(this.wallet).onChange(v => { this.wallet = v })
      })

    new Setting(contentEl)
      .setName(t('modal.category'))
      .addDropdown(drop => {
        for (const { key, label } of categories) drop.addOption(key, label)
        drop.setValue(this.category).onChange(v => { this.category = v })
      })

    const budgets = getBudgetOptions(config, this.budget)
    if (budgets.length > 0) {
      new Setting(contentEl)
        .setName(t('modal.budget'))
        .addDropdown(drop => {
          drop.addOption('', t('sub.noBudget'))
          for (const { key, label } of budgets) drop.addOption(key, label)
          drop.setValue(this.budget).onChange(v => { this.budget = v })
        })
    }

    new Setting(contentEl)
      .setName(t('modal.tags'))
      .addText(text => text
        .setPlaceholder(t('sub.tagsPlaceholder'))
        .setValue(this.tags)
        .onChange(v => { this.tags = v }))

    new Setting(contentEl)
      .setName(t('sub.autoRecord'))
      .setDesc(t('sub.autoRecordDesc'))
      .addToggle(toggle => toggle.setValue(this.autoRecord).onChange(v => { this.autoRecord = v }))

    new Setting(contentEl)
      .addButton(btn => btn.setButtonText(t('ui.cancel')).onClick(() => this.close()))
      .addButton(btn => btn.setButtonText(t('ui.save')).setCta().onClick(() => {
        const result = this.build(initialNext)
        if (typeof result === 'string') { new Notice(result); return }
        void this.onSave(result)
        this.close()
      }))
  }

  /** The subscription to save, or an error message. */
  private build(initialNext: string): Subscription | string {
    const name = this.name.trim()
    const nameErr = validateSubscriptionName(name)
    if (nameErr) return t(nameErr)

    const amount = parseFloat(this.amount)
    if (!this.amount.trim()) return t('err.amountRequired')
    if (!Number.isFinite(amount) || amount <= 0) return t('err.amountPositive')
    if ((this.walletFile.getConfig().decimalPlaces ?? 0) === 0 && !Number.isInteger(amount)) return t('err.amountInteger')

    if (!isValidDateString(this.nextDate)) return t('err.invalidDate')
    if (!this.wallet) return t('err.walletRequired')

    const tags = parseTagList(this.tags)
    const base = this.editing
    // A new next-charge date restarts the schedule from it, and frequency changes
    // count from the next charge too; otherwise keep the original day of the month.
    const restart = !base || this.nextDate !== initialNext || this.frequency !== base.frequency
    return {
      id: base?.id ?? newSubscriptionId(),
      name,
      amount,
      frequency: this.frequency,
      startDate: restart ? this.nextDate : base.startDate,
      wallet: this.wallet,
      category: this.category,
      ...(tags.length ? { tags } : {}),
      ...(this.budget ? { budget: this.budget } : {}),
      autoRecord: this.autoRecord,
      ...(!restart && base.lastRecorded ? { lastRecorded: base.lastRecorded } : {}),
    }
  }

  onClose() {
    this.contentEl.empty()
  }
}
