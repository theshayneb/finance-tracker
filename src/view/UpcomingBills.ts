import { App, Events, Platform } from 'obsidian'
import type { WalletFile } from '../io/WalletFile'
import { t, tn } from '../i18n'
import { formatAmount } from '../utils'
import { toDateString, upcomingCharges, type UpcomingCharge } from '../subscriptions'
import { markChargeHandled } from '../subscriptionRecorder'
import { TransactionModal } from '../modal/TransactionModal'
import { MobileTransactionModal } from '../modal/MobileTransactionModal'
import { renderCard } from './components'

/** "Today", "In 3 days", "2 days overdue"… */
export function formatDueIn(days: number): string {
  if (days === 0) return t('dash.billToday')
  if (days === 1) return t('dash.billTomorrow')
  if (days > 1) return tn('dash.billInDays', { days: String(days) })
  if (days === -1) return t('dash.billOverdueOne')
  return tn('dash.billOverdue', { days: String(-days) })
}

/** Bills within the reminder window, as of today. */
export function getUpcomingBills(walletFile: WalletFile): UpcomingCharge[] {
  const config = walletFile.getConfig()
  return upcomingCharges(config.subscriptions ?? [], toDateString(new Date()), config.billReminderDays ?? 3)
}

const refresh = (app: App) => (app.workspace as Events).trigger('penny-wallet-mod:refresh')

/**
 * Overview card listing bills due soon. Automatic ones are only listed; bills
 * recorded by hand get Record (opens the transaction form, pre-filled) and Skip.
 */
export function renderUpcomingBills(
  parent: HTMLElement,
  app: App,
  walletFile: WalletFile,
  bills: UpcomingCharge[],
  onManage: () => void,
): void {
  const dp = walletFile.getConfig().decimalPlaces ?? 0
  const card = renderCard(parent, { className: 'pw-bills-card' })
  card.dataset['testid'] = 'upcoming-bills'
  const head = card.createDiv('pw-card-title pw-bills-title')
  head.createSpan({ text: t('dash.upcomingBills') })
  const manage = head.createEl('button', { text: t('dash.billManage'), cls: 'pw-bills-manage clickable-icon' })
  manage.addEventListener('click', onManage)

  const list = card.createDiv('pw-bills-list')
  for (const { sub, date, days } of bills) {
    const row = list.createDiv('pw-bills-row' + (days < 0 ? ' is-overdue' : days === 0 ? ' is-today' : ''))
    row.dataset['testid'] = 'upcoming-bill'
    const main = row.createDiv('pw-bills-main')
    main.createDiv({ text: sub.name, cls: 'pw-bills-name' })
    const meta = main.createDiv({ cls: 'pw-bills-meta' })
    meta.createSpan({ text: formatDueIn(days), cls: 'pw-bills-due' })
    meta.createSpan({ text: ` · ${date}` })
    if (sub.autoRecord) meta.createSpan({ text: ` · ${t('dash.billAuto')}` })
    row.createDiv({ text: formatAmount(sub.amount, dp), cls: 'pw-bills-amount' })

    if (sub.autoRecord) continue
    const actions = row.createDiv('pw-bills-actions')
    const recordBtn = actions.createEl('button', { text: t('dash.billRecord'), cls: 'mod-cta' })
    recordBtn.addEventListener('click', () => {
      const ModalClass = Platform.isMobile ? MobileTransactionModal : TransactionModal
      new ModalClass(app, walletFile, {
        type: 'expense',
        amount: sub.amount,
        note: sub.name,
        tags: sub.tags,
        category: sub.category,
        wallet: sub.wallet,
        budget: sub.budget,
        date,
      }, null, null, () => {
        void markChargeHandled(walletFile, sub.id, date).then(() => refresh(app))
      }).open()
    })
    const skipBtn = actions.createEl('button', { text: t('dash.billSkip') })
    skipBtn.addEventListener('click', () => {
      skipBtn.disabled = true
      void markChargeHandled(walletFile, sub.id, date).then(() => refresh(app))
    })
  }
}
