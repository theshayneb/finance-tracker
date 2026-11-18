import { describe, it, expect } from 'vitest'
import {
  chargeDate, daysBetween, dueChargeDates, hasMatchingCharge, isValidDateString, monthlyCost, nextChargeAfter,
  nextChargeDate, subscriptionTransaction, upcomingCharges, validateSubscriptionName,
} from '../../src/subscriptions'
import { recordDueSubscriptions, markChargeHandled } from '../../src/subscriptionRecorder'
import { WalletFile } from '../../src/io/WalletFile'
import { DEFAULT_CONFIG, type Subscription } from '../../src/types'
import { createMockApp } from '../helpers/mockApp'

const sub = (over: Partial<Subscription> = {}): Subscription => ({
  id: 's1', name: 'Streaming', amount: 15, frequency: 'monthly', startDate: '2026-01-31',
  wallet: 'Cash', category: 'entertainment', autoRecord: true, ...over,
})

describe('chargeDate', () => {
  it('keeps the day of the month, clamped to short months', () => {
    expect([0, 1, 2, 3].map(i => chargeDate('2026-01-31', 'monthly', i)))
      .toEqual(['2026-01-31', '2026-02-28', '2026-03-31', '2026-04-30'])
  })

  it('steps by 3 or 12 months', () => {
    expect(chargeDate('2026-11-15', 'quarterly', 1)).toBe('2027-02-15')
    expect(chargeDate('2024-02-29', 'yearly', 1)).toBe('2025-02-28')
    expect(chargeDate('2024-02-29', 'yearly', 4)).toBe('2028-02-29')
  })
})

describe('next and due charges', () => {
  it('starts at startDate when nothing is recorded yet', () => {
    expect(nextChargeDate(sub())).toBe('2026-01-31')
  })

  it('moves past the last recorded charge', () => {
    expect(nextChargeDate(sub({ lastRecorded: '2026-02-28' }))).toBe('2026-03-31')
  })

  it('lists every missed charge up to today', () => {
    expect(dueChargeDates(sub({ lastRecorded: '2026-01-31' }), '2026-04-30'))
      .toEqual(['2026-02-28', '2026-03-31', '2026-04-30'])
    expect(dueChargeDates(sub({ startDate: '2026-12-01' }), '2026-11-16')).toEqual([])
  })

  it('ignores invalid dates', () => {
    expect(isValidDateString('2026-02-30')).toBe(false)
    expect(nextChargeDate(sub({ startDate: 'nope' }))).toBeNull()
    expect(dueChargeDates(sub({ startDate: 'nope' }), '2026-11-16')).toEqual([])
  })
})

describe('upcomingCharges', () => {
  const today = '2026-11-16'
  it('shows charges within the reminder window, soonest first', () => {
    const subs = [
      sub({ id: 'a', name: 'A', startDate: '2026-11-19' }),
      sub({ id: 'b', name: 'B', startDate: '2026-11-17' }),
      sub({ id: 'c', name: 'C', startDate: '2026-11-25' }),
    ]
    expect(upcomingCharges(subs, today, 3).map(c => [c.sub.name, c.days])).toEqual([['B', 1], ['A', 3]])
  })

  it('keeps overdue bills recorded by hand, not automatic ones', () => {
    const subs = [
      sub({ id: 'a', name: 'Manual', startDate: '2026-11-10', autoRecord: false }),
      sub({ id: 'b', name: 'Auto', startDate: '2026-11-10' }),
    ]
    expect(upcomingCharges(subs, today, 3).map(c => [c.sub.name, c.days])).toEqual([['Manual', -6]])
  })
})

describe('nextChargeAfter', () => {
  const today = '2026-11-16'
  const subs = [
    sub({ id: 'a', name: 'A', startDate: '2026-11-17' }),
    sub({ id: 'b', name: 'B', startDate: '2026-12-02' }),
    sub({ id: 'c', name: 'C', startDate: '2026-11-25' }),
  ]

  it('skips the bills already listed', () => {
    const listed = upcomingCharges(subs, today, 3)
    expect(nextChargeAfter(subs, today, listed)).toMatchObject({ date: '2026-11-25', sub: { name: 'C' } })
  })

  it('gives the soonest charge when nothing is listed', () => {
    expect(nextChargeAfter(subs, today, [])?.sub.name).toBe('A')
    expect(nextChargeAfter([], today, [])).toBeNull()
  })
})

describe('helpers', () => {
  it('daysBetween crosses months and DST', () => {
    expect(daysBetween('2026-10-30', '2026-11-02')).toBe(3)
    expect(daysBetween('2026-03-07', '2026-03-09')).toBe(2)
    expect(daysBetween('2026-11-16', '2026-11-10')).toBe(-6)
  })

  it('monthlyCost spreads yearly and quarterly bills', () => {
    expect(monthlyCost(sub({ amount: 120, frequency: 'yearly' }))).toBe(10)
    expect(monthlyCost(sub({ amount: 30, frequency: 'quarterly' }))).toBe(10)
  })

  it('builds the expense with optional tags and budget', () => {
    expect(subscriptionTransaction(sub({ tags: ['tv'], budget: 'Fun' }), '2026-11-05')).toEqual({
      date: '11/05', type: 'expense', wallet: 'Cash', category: 'entertainment',
      note: 'Streaming', amount: 15, tags: ['tv'], budget: 'Fun',
    })
    expect(subscriptionTransaction(sub(), '2026-11-05')).not.toHaveProperty('tags')
  })

  it('matches an existing charge by date and note, whatever the amount', () => {
    const tx = subscriptionTransaction(sub(), '2026-11-05')
    expect(hasMatchingCharge([{ ...tx, createdAt: 'x', wallet: 'Bank' }], tx)).toBe(true)
    expect(hasMatchingCharge([{ ...tx, amount: 16 }], tx)).toBe(true)
    expect(hasMatchingCharge([{ ...tx, date: '11/06' }], tx)).toBe(false)
    expect(hasMatchingCharge([{ ...tx, type: 'income' }], tx)).toBe(false)
  })

  it('validates names', () => {
    expect(validateSubscriptionName(' ')).toBe('err.subscriptionNameEmpty')
    expect(validateSubscriptionName('a|b')).toBe('err.subscriptionNameInvalid')
    expect(validateSubscriptionName('Phone')).toBeNull()
  })
})

describe('recordDueSubscriptions', () => {
  async function setup(subscriptions: Subscription[], files: Record<string, string> = {}) {
    const config = { ...DEFAULT_CONFIG, wallets: [{ ...DEFAULT_CONFIG.wallets[0], name: 'Cash' }], defaultWallet: 'Cash', subscriptions }
    const { app } = createMockApp({ '.penny-wallet.json': JSON.stringify(config), ...files })
    const wf = new WalletFile(app)
    await wf.loadConfig()
    return wf
  }

  it('records missed charges once and remembers the last one', async () => {
    const wf = await setup([
      sub({ startDate: '2026-10-05' }),
      sub({ id: 'm', name: 'Power', startDate: '2026-10-05', autoRecord: false }),
    ])
    const recorded = await recordDueSubscriptions(wf, '2026-11-16')
    expect(recorded.map(r => r.date)).toEqual(['2026-10-05', '2026-11-05'])
    expect((await wf.readMonth('2026-10')).map(t => t.note)).toEqual(['Streaming'])
    expect((await wf.readMonth('2026-11'))[0]).toMatchObject({ date: '11/05', amount: 15, type: 'expense' })
    expect(wf.getConfig().subscriptions.find(s => s.id === 's1')?.lastRecorded).toBe('2026-11-05')
    expect(wf.getConfig().subscriptions.find(s => s.id === 'm')?.lastRecorded).toBeUndefined()

    expect(await recordDueSubscriptions(wf, '2026-11-20')).toEqual([])
    expect(await wf.readMonth('2026-11')).toHaveLength(1)
  })

  it('does not duplicate a charge another device already recorded', async () => {
    const wf = await setup([sub({ startDate: '2026-11-05' })])
    await wf.writeTransaction(subscriptionTransaction(sub(), '2026-11-05'), '2026-11')
    expect(await recordDueSubscriptions(wf, '2026-11-16')).toEqual([])
    expect(await wf.readMonth('2026-11')).toHaveLength(1)
    expect(wf.getConfig().subscriptions[0].lastRecorded).toBe('2026-11-05')
  })

  it('markChargeHandled moves a manual bill on', async () => {
    const wf = await setup([sub({ autoRecord: false, startDate: '2026-11-05' })])
    await markChargeHandled(wf, 's1', '2026-11-05')
    expect(nextChargeDate(wf.getConfig().subscriptions[0])).toBe('2026-12-05')
  })
})
