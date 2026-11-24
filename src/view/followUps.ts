import type { App, Component } from 'obsidian'
import type { WalletFile } from '../io/WalletFile'
import type { Transaction } from '../types'
import { t, tn } from '../i18n'
import { currentYearMonth, tagKey } from '../utils'
import { renderCard } from './components'
import { openTransactionEditor, renderNoteWithLinks, renderTransactionRow } from './txShared'

/**
 * The Follow-ups card: every transaction with `tag` (any month); click a row to
 * edit it. Used on the Overview and by the finance-followups code block.
 */
export function renderFollowUpsCard(
  parent: HTMLElement,
  opts: {
    app: App
    walletFile: WalletFile
    tag: string
    items: { tx: Transaction; yearMonth: string }[]
    dp: 0 | 2
    hoverParent: Component
    hoverSource: string
  },
): HTMLElement {
  const { app, walletFile, tag, items, dp } = opts
  const card = renderCard(parent, { className: 'pw-follow-up-card' })
  card.dataset['testid'] = 'follow-up-card'
  const head = card.createDiv('pw-card-title pw-follow-up-title')
  head.createSpan({ text: t('dash.followUps') })
  head.createSpan({ text: `#${tag} · ${items.length}`, cls: 'pw-follow-up-count' })

  if (items.length === 0) {
    card.createEl('p', { text: tn('dash.noFollowUps', { tag }), cls: 'pw-no-data' })
    return card
  }

  const list = card.createDiv('pw-follow-up-list')
  const thisYear = currentYearMonth().slice(0, 4)
  for (const { tx, yearMonth } of items) {
    const year = yearMonth.slice(0, 4)
    const row = renderTransactionRow(list, tx, {
      dp,
      // Follow-ups span months; show the year only when it isn't this year
      dateText: year === thisYear ? tx.date : `${year}/${tx.date}`,
      renderNote: (el, note) => renderNoteWithLinks(el, note, {
        app,
        sourcePath: walletFile.monthFilePath(yearMonth),
        hoverParent: opts.hoverParent,
        source: opts.hoverSource,
      }),
      onClick: () => openTransactionEditor(app, walletFile, tx, yearMonth),
    })
    row.dataset['testid'] = 'follow-up-row'
    // Every row has the follow-up tag; only show the others
    row.querySelectorAll<HTMLElement>('.pw-tx-tag-chip').forEach(chip => {
      if (tagKey(chip.dataset['tag'] ?? '') === tagKey(tag)) chip.remove()
    })
    row.querySelectorAll('.pw-tx-row-line4').forEach(line => {
      if (!line.querySelector('.pw-tx-tag-chip')) line.remove()
    })
  }
  return card
}

/** The tag a finance-followups block lists: its first line ("#" optional), else the follow-up tag from settings. */
export function parseFollowUpsEmbed(source: string, defaultTag: string): string {
  const first = source.split('\n').map(l => l.trim()).find(Boolean) ?? ''
  return first.replace(/^#/, '').trim() || defaultTag.trim()
}
