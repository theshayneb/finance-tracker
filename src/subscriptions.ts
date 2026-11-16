import type { Subscription, SubscriptionFrequency, Transaction } from './types'

/** Months between two charges. */
export const FREQUENCY_MONTHS: Record<SubscriptionFrequency, number> = {
  monthly: 1,
  quarterly: 3,
  yearly: 12,
}

/** Local date as "yyyy-mm-dd". */
export function toDateString(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function isValidDateString(s: string): boolean {
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!m) return false
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])]
  const date = new Date(y, mo - 1, d)
  return date.getFullYear() === y && date.getMonth() === mo - 1 && date.getDate() === d
}

/**
 * The `index`-th charge counted from `startDate` (index 0 = startDate). The day
 * of the month follows startDate, moved back to the month's last day when the
 * month is shorter: a bill on Jan 31 is charged Feb 28, then Mar 31.
 */
export function chargeDate(startDate: string, frequency: SubscriptionFrequency, index: number): string {
  const [y, m, d] = startDate.split('-').map(Number)
  const first = new Date(y, m - 1 + index * FREQUENCY_MONTHS[frequency], 1)
  const lastDay = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate()
  first.setDate(Math.min(d, lastDay))
  return toDateString(first)
}

// Enough for a monthly bill to run for 200 years; stops runaway loops on bad data.
const MAX_CHARGES = 2400

/** The next charge not yet recorded or skipped; null if the data is unusable. */
export function nextChargeDate(sub: Subscription): string | null {
  if (!isValidDateString(sub.startDate)) return null
  for (let i = 0; i < MAX_CHARGES; i++) {
    const date = chargeDate(sub.startDate, sub.frequency, i)
    if (!sub.lastRecorded || date > sub.lastRecorded) return date
  }
  return null
}

/** Charges that are due (on or before `today`) and not yet recorded or skipped, oldest first. */
export function dueChargeDates(sub: Subscription, today: string): string[] {
  if (!isValidDateString(sub.startDate)) return []
  const dates: string[] = []
  for (let i = 0; i < MAX_CHARGES; i++) {
    const date = chargeDate(sub.startDate, sub.frequency, i)
    if (date > today) break
    if (!sub.lastRecorded || date > sub.lastRecorded) dates.push(date)
  }
  return dates
}

/** Whole days from `from` to `to` (both "yyyy-mm-dd"); negative when `to` is earlier. */
export function daysBetween(from: string, to: string): number {
  const [fy, fm, fd] = from.split('-').map(Number)
  const [ty, tm, td] = to.split('-').map(Number)
  return Math.round((Date.UTC(ty, tm - 1, td) - Date.UTC(fy, fm - 1, fd)) / 86_400_000)
}

export interface UpcomingCharge {
  sub: Subscription
  date: string  // "yyyy-mm-dd"
  days: number  // days from today; negative = overdue (only for bills recorded by hand)
}

/**
 * Charges to remind about: each subscription's next charge when it falls
 * within `reminderDays` of today. Bills recorded by hand also show while overdue.
 */
export function upcomingCharges(subs: readonly Subscription[], today: string, reminderDays: number): UpcomingCharge[] {
  const result: UpcomingCharge[] = []
  for (const sub of subs) {
    const date = nextChargeDate(sub)
    if (!date) continue
    const days = daysBetween(today, date)
    if (days > reminderDays) continue
    // Automatic ones are recorded on the day, so anything overdue is about to be.
    if (days < 0 && sub.autoRecord) continue
    result.push({ sub, date, days })
  }
  return result.sort((a, b) => a.date.localeCompare(b.date) || a.sub.name.localeCompare(b.sub.name))
}

/** Cost spread over a month, for the "about X a month" total. */
export function monthlyCost(sub: Subscription): number {
  return sub.amount / FREQUENCY_MONTHS[sub.frequency]
}

/** The expense a charge is recorded as. `date` is "yyyy-mm-dd". */
export function subscriptionTransaction(sub: Subscription, date: string): Transaction {
  return {
    date: date.substring(5).replace('-', '/'),
    type: 'expense',
    wallet: sub.wallet,
    category: sub.category,
    note: sub.name,
    amount: sub.amount,
    ...(sub.tags?.length ? { tags: [...sub.tags] } : {}),
    ...(sub.budget ? { budget: sub.budget } : {}),
  }
}

/**
 * Whether the month already holds this charge, e.g. recorded on another device
 * before this one synced. Matches the date, the note and the amount.
 */
export function hasMatchingCharge(monthTransactions: readonly Transaction[], tx: Transaction): boolean {
  return monthTransactions.some(existing =>
    existing.type === 'expense' &&
    existing.date === tx.date &&
    existing.note === tx.note &&
    existing.amount === tx.amount)
}

export type SubscriptionNameError = 'err.subscriptionNameEmpty' | 'err.subscriptionNameInvalid'

/** The name becomes the transaction note, stored in a markdown table cell, so `|` is not allowed. */
export function validateSubscriptionName(name: string): SubscriptionNameError | null {
  if (!name.trim()) return 'err.subscriptionNameEmpty'
  if (name.includes('|')) return 'err.subscriptionNameInvalid'
  return null
}

export function newSubscriptionId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}
