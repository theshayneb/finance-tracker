import { App, Modal, Notice } from 'obsidian'
import { WalletFile } from '../io/WalletFile'
import type { ValidationIssue } from '../types'
import { t, tn } from '../i18n'
import { formatAmount } from '../utils'
import { DETAIL_VIEW_TYPE } from '../view/DetailView'

export class ValidationModal extends Modal {
  private issues: ValidationIssue[]
  private walletFile: WalletFile

  constructor(app: App, walletFile: WalletFile, issues: ValidationIssue[]) {
    super(app)
    this.walletFile = walletFile
    this.issues = issues
  }

  onOpen() {
    const { contentEl } = this
    contentEl.empty()
    contentEl.addClass('pw-validation-modal')

    // Header: [X] [title] [spacer]
    const header = contentEl.createDiv('pw-validation-header')
    const closeBtn = header.createDiv('pw-validation-close-btn')
    closeBtn.setText('✕')
    closeBtn.addEventListener('click', () => this.close())
    header.createEl('h2', { text: t('validation.modalTitle'), cls: 'pw-validation-title' })
    header.createDiv('pw-validation-header-spacer')

    // Content
    const content = contentEl.createDiv('pw-validation-content')
    this.renderIssues(content)

    // Divider + footer (duplicate charges are only flagged, so not without other issues)
    if (!this.issues.some(i => i.type !== 'duplicateCharge')) return
    contentEl.createDiv('pw-validation-divider')
    const footer = contentEl.createDiv('pw-validation-footer')
    const fixAllBtn = footer.createEl('button', {
      text: t('validation.fixAll'),
      cls: 'pw-validation-fix-all-btn',
    })
    fixAllBtn.addEventListener('click', () => void this.fixAll())
  }

  private renderIssues(container: HTMLElement) {
    const frontmatterIssues = this.issues.filter(i => i.type === 'frontmatter')
    const orphanIssues = this.issues.filter(i => i.type === 'orphanedWallet')
    const duplicateIssues = this.issues.filter(i => i.type === 'duplicateCharge')

    // Flagged only: "Fix all" leaves these alone, and nothing here deletes a row.
    if (duplicateIssues.length > 0) {
      const section = container.createDiv('pw-validation-section')
      section.dataset['testid'] = 'duplicate-charges'
      section.createEl('span', { text: t('validation.duplicateSection'), cls: 'pw-validation-section-label' })
      const dp = this.walletFile.getConfig().decimalPlaces ?? 0
      for (const issue of duplicateIssues) {
        if (issue.type !== 'duplicateCharge') continue
        const card = section.createDiv('pw-validation-card')
        card.createEl('p', {
          text: tn('validation.duplicateDesc', {
            month: issue.yearMonth,
            name: issue.name,
            count: String(issue.transactions.length),
            date: issue.date,
          }),
          cls: 'pw-validation-card-text',
        })
        const rows = card.createDiv('pw-validation-dup-rows')
        for (const tx of issue.transactions) {
          rows.createDiv({ text: [tx.date, tx.wallet ?? '', formatAmount(tx.amount, dp)].filter(Boolean).join(' · ') })
        }
        const cardFooter = card.createDiv('pw-validation-card-footer')
        const btn = cardFooter.createEl('button', { text: t('validation.showInTransactions'), cls: 'pw-validation-fix-btn' })
        btn.addEventListener('click', () => void this.showInTransactions(issue.yearMonth, issue.name))
      }
      section.createEl('p', { text: t('validation.duplicateHint'), cls: 'pw-validation-dup-hint' })
    }

    if (frontmatterIssues.length > 0) {
      const sectionA = container.createDiv('pw-validation-section')
      sectionA.createEl('span', { text: t('validation.frontmatterSection'), cls: 'pw-validation-section-label' })
      for (const issue of frontmatterIssues) {
        if (issue.type !== 'frontmatter') continue
        const card = sectionA.createDiv('pw-validation-card')
        card.createEl('p', {
          text: tn('validation.frontmatterDesc', {
            month: issue.yearMonth,
            actualIncome: String(issue.actualIncome),
            storedIncome: String(issue.storedIncome),
            actualExpense: String(issue.actualExpense),
            storedExpense: String(issue.storedExpense),
          }),
          cls: 'pw-validation-card-text',
        })
        const cardFooter = card.createDiv('pw-validation-card-footer')
        const btn = cardFooter.createEl('button', { text: t('validation.fix'), cls: 'pw-validation-fix-btn' })
        btn.addEventListener('click', () => void (async () => {
          await this.walletFile.recalculateFrontmatter(issue.yearMonth)
          btn.setText('✓')
          btn.disabled = true
        })())
      }
    }

    if (orphanIssues.length > 0) {
      const sectionB = container.createDiv('pw-validation-section')
      sectionB.createEl('span', { text: t('validation.orphanSection'), cls: 'pw-validation-section-label' })
      const activeWallets = this.walletFile.getConfig().wallets.filter(w => w.status === 'active')
      for (const issue of orphanIssues) {
        if (issue.type !== 'orphanedWallet') continue
        const card = sectionB.createDiv('pw-validation-card')
        card.createEl('p', {
          text: tn('validation.orphanDesc', {
            wallet: issue.walletName,
            count: String(issue.transactionCount),
            months: issue.yearMonths.join(', '),
          }),
          cls: 'pw-validation-card-text',
        })
        const actions = card.createDiv('pw-validation-card-actions')
        const select = actions.createEl('select', { cls: 'pw-validation-remap-select' })
        select.createEl('option', { value: '', text: `— ${t('validation.remapTo')} —` })
        for (const w of activeWallets) {
          select.createEl('option', { value: w.name, text: w.name })
        }
        const fixBtn = actions.createEl('button', { text: t('validation.fix'), cls: 'pw-validation-fix-btn' })
        fixBtn.addEventListener('click', () => void (async () => {
          const remapTarget = select.value
          if (remapTarget) {
            await this.walletFile.renameWalletInTransactions(issue.walletName, remapTarget)
          } else {
            await this.walletFile.repairOrphanedWallet(issue.walletName)
          }
          fixBtn.setText('✓')
          fixBtn.disabled = true
          select.disabled = true
        })())
      }
    }
  }

  private async showInTransactions(yearMonth: string, note: string) {
    const leaf = this.app.workspace.getLeavesOfType(DETAIL_VIEW_TYPE)[0] ?? this.app.workspace.getLeaf('tab')
    await leaf.setViewState({ type: DETAIL_VIEW_TYPE, active: true, state: { yearMonth, filterSearch: note, resetFilters: true } })
    void this.app.workspace.revealLeaf(leaf)
    this.close()
  }

  private async fixAll() {
    let count = 0
    for (const issue of this.issues) {
      if (issue.type === 'frontmatter') {
        await this.walletFile.recalculateFrontmatter(issue.yearMonth)
        count++
      } else if (issue.type === 'orphanedWallet') {
        await this.walletFile.repairOrphanedWallet(issue.walletName)
        count++
      }
    }
    new Notice(tn('validation.repaired', { count: String(count) }))
    this.close()
  }

  onClose() {
    this.contentEl.empty()
  }
}
