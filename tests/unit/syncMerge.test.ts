import { describe, it, expect } from 'vitest'
import { Platform } from 'obsidian'
import { liveConfig, mergeStored, stampChanges, toStored, type StoredConfig } from '../../src/configMerge'
import { WalletFile, TransactionChangedError, buildMonthContent, detectDuplicateCharges } from '../../src/io/WalletFile'
import { recordDueSubscriptions } from '../../src/subscriptionRecorder'
import { subscriptionTransaction } from '../../src/subscriptions'
import { backgroundTasksEnabled, setBackgroundTasksEnabled, syncSettled, SETTLE_AFTER_START_MS, SETTLE_QUIET_MS } from '../../src/device'
import { DEFAULT_CONFIG, type PennyWalletConfig, type Subscription, type Transaction } from '../../src/types'
import { createMockApp } from '../helpers/mockApp'

const CASH = { name: 'Cash', type: 'cash' as const, initialBalance: 0, status: 'active' as const, includeInNetAsset: true }

const sub = (over: Partial<Subscription> = {}): Subscription => ({
  id: 's1', name: 'Streaming', amount: 15, frequency: 'monthly', startDate: '2026-10-05',
  wallet: 'Cash', category: 'entertainment', autoRecord: true, ...over,
})

const base = (over: Partial<PennyWalletConfig> = {}): PennyWalletConfig => ({
  ...DEFAULT_CONFIG, wallets: [CASH], defaultWallet: 'Cash', ...over,
})

/** A device's saved copy after editing `from` into `to` at time `at`. */
const edit = (from: StoredConfig, to: PennyWalletConfig, at: number) => stampChanges(from, to, at)

describe('config merge', () => {
  const start = toStored(base({ subscriptions: [sub()], budgets: [{ name: 'Food', amount: 100 }], tags: ['a'] }))

  it('keeps the newest edit of each entry, from either device', () => {
    const desktop = edit(start, base({ subscriptions: [sub({ amount: 20 })], budgets: [{ name: 'Food', amount: 100 }], tags: ['a'] }), 2000)
    const phone = edit(start, base({ subscriptions: [sub()], budgets: [{ name: 'Food', amount: 150 }], tags: ['a'] }), 1000)
    for (const merged of [mergeStored(desktop, phone), mergeStored(phone, desktop)]) {
      const live = liveConfig(merged)
      expect(live.subscriptions[0].amount).toBe(20)
      expect(live.budgets[0].amount).toBe(150)
    }
  })

  it('a newer delete beats an older edit, and a newer edit beats an older delete', () => {
    const deleted = edit(start, base({ subscriptions: [], budgets: [{ name: 'Food', amount: 100 }], tags: ['a'] }), 2000)
    const editedEarlier = edit(start, base({ subscriptions: [sub({ amount: 30 })], budgets: [{ name: 'Food', amount: 100 }], tags: ['a'] }), 1000)
    expect(liveConfig(mergeStored(deleted, editedEarlier)).subscriptions).toEqual([])
    const editedLater = edit(start, base({ subscriptions: [sub({ amount: 30 })], budgets: [{ name: 'Food', amount: 100 }], tags: ['a'] }), 3000)
    expect(liveConfig(mergeStored(deleted, editedLater)).subscriptions[0].amount).toBe(30)
  })

  it('lastRecorded takes the later date, whichever edit wins', () => {
    const recorded = edit(start, { ...liveConfig(start), subscriptions: [sub({ lastRecorded: '2026-11-05' })] }, 1000)
    const staleEdit = edit(start, { ...liveConfig(start), subscriptions: [sub({ amount: 18 })] }, 2000)
    const live = liveConfig(mergeStored(staleEdit, recorded))
    expect(live.subscriptions[0]).toMatchObject({ amount: 18, lastRecorded: '2026-11-05' })
  })

  it('recording a charge does not count as an edit of the subscription', () => {
    const recorded = edit(start, { ...liveConfig(start), subscriptions: [sub({ lastRecorded: '2026-11-05' })] }, 5000)
    expect(recorded.subscriptions[0].updatedAt ?? 0).toBe(0)
  })

  it('merges tag additions from both devices and keeps a newer removal', () => {
    const desktop = edit(start, { ...liveConfig(start), tags: ['a', 'b'] }, 1000)
    const phone = edit(start, { ...liveConfig(start), tags: [] }, 2000) // removed "a"
    const tags = liveConfig(mergeStored(desktop, phone)).tags
    expect(tags).toEqual(['b'])
  })

  it('settings: the newest change wins, and unstamped defaults never beat an edit', () => {
    const edited = edit(start, { ...liveConfig(start), decimalPlaces: 2 }, 1000)
    const fresh = toStored(base({ subscriptions: [sub()] }))
    expect(liveConfig(mergeStored(fresh, edited)).decimalPlaces).toBe(2)
    expect(liveConfig(mergeStored(edited, fresh)).decimalPlaces).toBe(2)
  })

  it('a renamed wallet is replaced, not doubled', () => {
    const renamed = edit(start, { ...liveConfig(start), wallets: [{ ...CASH, name: 'Wallet' }] }, 1000)
    const stale = toStored(liveConfig(start))
    expect(liveConfig(mergeStored(stale, renamed)).wallets.map(w => w.name)).toEqual(['Wallet'])
  })

  it('keeps the order set last', () => {
    const two = toStored(base({ wallets: [CASH, { ...CASH, name: 'Bank' }] }))
    const reordered = edit(two, { ...liveConfig(two), wallets: [{ ...CASH, name: 'Bank' }, CASH] }, 1000)
    expect(liveConfig(mergeStored(two, reordered)).wallets.map(w => w.name)).toEqual(['Bank', 'Cash'])
    expect(liveConfig(mergeStored(reordered, two)).wallets.map(w => w.name)).toEqual(['Bank', 'Cash'])
  })
})

/** data.json shared by devices; `land` puts another device's copy on disk, as Sync does. */
function sharedStore(initial: unknown) {
  let data: unknown = initial
  let backup: unknown = null
  return {
    store: {
      load: async () => data,
      save: async (c: unknown) => { data = JSON.parse(JSON.stringify(c)) },
      loadBackup: () => backup,
      saveBackup: (c: unknown) => { backup = JSON.parse(JSON.stringify(c)) },
    },
    land: (copy: unknown) => { data = JSON.parse(JSON.stringify(copy)) },
    get data() { return data as StoredConfig },
  }
}

describe('WalletFile with a stale copy synced in', () => {
  it('reconcileConfig merges instead of adopting the older copy, and saves the result', async () => {
    const s = sharedStore(base({ subscriptions: [sub()] }))
    const { app } = createMockApp()
    const desktop = new WalletFile(app, s.store)
    await desktop.loadConfig()
    const staleCopy = JSON.parse(JSON.stringify(s.data))

    desktop.updateConfig({ subscriptions: [sub({ lastRecorded: '2026-11-05' })], budgets: [{ name: 'New', amount: 5 }] })
    await desktop.saveConfig()

    s.land(staleCopy) // the phone's older data.json replaces the file
    await desktop.reconcileConfig()
    expect(desktop.getConfig().subscriptions[0].lastRecorded).toBe('2026-11-05')
    expect(desktop.getConfig().budgets.map(b => b.name)).toEqual(['New'])
    expect(liveConfig(s.data).budgets.map(b => b.name)).toEqual(['New'])
  })

  it('a stale device saving (say, a tagged expense) cannot roll lastRecorded back', async () => {
    const s = sharedStore(base({ subscriptions: [sub({ lastRecorded: '2026-10-05' })] }))
    const phoneApp = createMockApp().app
    const phone = new WalletFile(phoneApp, s.store)
    await phone.loadConfig()
    // Meanwhile the desktop records November and its copy syncs in
    s.land({ ...s.data, subscriptions: [{ ...sub(), lastRecorded: '2026-11-05' }] })

    await phone.writeTransaction({ date: '11/10', type: 'expense', wallet: 'Cash', category: 'food', note: 'x', amount: 3, tags: ['new'] }, '2026-11')
    expect(liveConfig(s.data).subscriptions[0].lastRecorded).toBe('2026-11-05')
    expect(liveConfig(s.data).tags).toContain('new')
  })

  it('edits only this device held survive a restart after data.json was replaced', async () => {
    const s = sharedStore(base())
    const app = createMockApp().app
    const first = new WalletFile(app, s.store)
    await first.loadConfig()
    const stale = JSON.parse(JSON.stringify(s.data))
    first.updateConfig({ budgets: [{ name: 'Kept', amount: 1 }] })
    await first.saveConfig()
    s.land(stale)
    const restarted = new WalletFile(app, s.store)
    await restarted.loadConfig()
    expect(restarted.getConfig().budgets.map(b => b.name)).toEqual(['Kept'])
  })

  it('recording starts from the saved copy: a later lastRecorded on disk means nothing to record', async () => {
    const s = sharedStore(base({ subscriptions: [sub({ startDate: '2026-11-05' })] }))
    const { app, store } = createMockApp()
    const wf = new WalletFile(app, s.store)
    await wf.loadConfig()
    s.land({ ...s.data, subscriptions: [{ ...sub({ startDate: '2026-11-05' }), lastRecorded: '2026-11-05' }] })
    expect(await recordDueSubscriptions(wf, '2026-11-16')).toEqual([])
    expect([...store.keys()].some(k => k.endsWith('2026-11.md'))).toBe(false)
  })
})

describe('month file writes', () => {
  const path = 'PennyWallet/2026-11.md'
  const row = (note: string, date = '11/02'): Transaction => ({ date, type: 'expense', wallet: 'Cash', category: 'food', note, amount: 5, createdAt: `c-${note}` })
  const file = (txs: Transaction[]) => buildMonthContent('2026-11', txs, { income: 0, expense: 0, netAsset: 0 })

  it('keeps a row that synced in just before the write', async () => {
    const { app, store } = createMockApp({ [path]: file([row('mine')]) })
    const process = app.vault.process
    let landed = false
    app.vault.process = async (f: { path: string }, fn: (data: string) => string) => {
      if (f.path === path && !landed) {
        landed = true // Sync writes the phone's offline expense into the file
        store.set(path, file([row('mine'), row('from phone', '11/03')]))
      }
      return process(f, fn)
    }
    const wf = new WalletFile(app)
    await wf.writeTransaction(row('new', '11/04'), '2026-11')
    expect((await wf.readMonth('2026-11')).map(t => t.note)).toEqual(['mine', 'from phone', 'new'])
  })

  it('an edit of a row that changed elsewhere is refused, not lost or doubled', async () => {
    const { app, store } = createMockApp({ [path]: file([row('changed on phone')]) })
    const wf = new WalletFile(app)
    const before = store.get(path)
    await expect(wf.updateTransaction(row('old'), '2026-11', row('mine'), '2026-11')).rejects.toBeInstanceOf(TransactionChangedError)
    await expect(wf.updateTransaction(row('old'), '2026-11', row('mine'), '2026-12')).rejects.toBeInstanceOf(TransactionChangedError)
    expect(store.get(path)).toBe(before)
    expect(store.has('PennyWallet/2026-12.md')).toBe(false)
  })

  it('auto-recording checks for the charge in the same step as the write', async () => {
    const s = sub({ startDate: '2026-11-05' })
    const existing = { ...subscriptionTransaction(s, '2026-11-05'), amount: 99 }
    const { app } = createMockApp({ [path]: file([existing]) })
    const wf = new WalletFile(app)
    wf.updateConfig({ wallets: [CASH], subscriptions: [s] })
    expect(await recordDueSubscriptions(wf, '2026-11-16')).toEqual([])
    expect(await wf.readMonth('2026-11')).toHaveLength(1)
    expect(wf.getConfig().subscriptions[0].lastRecorded).toBe('2026-11-05')
  })
})

describe('detectDuplicateCharges', () => {
  it('flags same-date expenses named after a subscription, any amount, and nothing else', () => {
    const s = sub()
    const tx = subscriptionTransaction(s, '2026-11-05')
    const months = new Map<string, Transaction[]>([
      ['2026-11', [tx, { ...tx, amount: 16 }, { ...tx, date: '11/06' }, { ...tx, note: 'Other' }, { ...tx, note: 'Other' }]],
      ['2026-10', [{ ...tx, date: '10/05' }]],
    ])
    const issues = detectDuplicateCharges(months, [s])
    expect(issues).toHaveLength(1)
    expect(issues[0]).toMatchObject({ type: 'duplicateCharge', yearMonth: '2026-11', date: '11/05', name: 'Streaming' })
    expect(issues[0].transactions).toHaveLength(2)
  })

  it('is part of validation and never changes the files', async () => {
    const tx = subscriptionTransaction(sub(), '2026-11-05')
    const content = buildMonthContent('2026-11', [tx, tx], { income: 0, expense: 30, netAsset: 0 })
    const { app, store } = createMockApp({ 'PennyWallet/2026-11.md': content })
    const wf = new WalletFile(app)
    wf.updateConfig({ wallets: [CASH], subscriptions: [sub()] })
    const issues = await wf.validateAllData()
    expect(issues.filter(i => i.type === 'duplicateCharge')).toHaveLength(1)
    expect(store.get('PennyWallet/2026-11.md')).toBe(content)
  })
})

describe('this device', () => {
  const appWithStorage = () => {
    const local = new Map<string, unknown>()
    return {
      loadLocalStorage: (k: string) => local.get(k) ?? null,
      saveLocalStorage: (k: string, v: unknown) => { local.set(k, v) },
    } as never
  }

  it('background tasks default on for a computer and off for a phone, and the switch is kept locally', () => {
    const app = appWithStorage()
    expect(backgroundTasksEnabled(app)).toBe(true)
    ;(Platform as { isMobile: boolean }).isMobile = true
    try {
      expect(backgroundTasksEnabled(app)).toBe(false)
      setBackgroundTasksEnabled(app, true)
      expect(backgroundTasksEnabled(app)).toBe(true)
    } finally {
      ;(Platform as { isMobile: boolean }).isMobile = false
    }
  })

  it('waits for Sync: a few minutes after start, a quiet vault, and Sync not syncing', () => {
    const syncing = { syncing: true }
    const app = { internalPlugins: { getPluginById: () => ({ enabled: true, instance: syncing }) } } as never
    const start = 0
    const late = SETTLE_AFTER_START_MS + SETTLE_QUIET_MS
    expect(syncSettled(app, start, 0, SETTLE_AFTER_START_MS - 1)).toBe(false)
    expect(syncSettled(app, start, late - 10, late)).toBe(false)
    expect(syncSettled(app, start, 0, late)).toBe(false)
    syncing.syncing = false
    expect(syncSettled(app, start, 0, late)).toBe(true)
  })
})
