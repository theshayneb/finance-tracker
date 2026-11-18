import type { WalletFile } from './io/WalletFile'
import type { Subscription } from './types'
import { dueChargeDates, hasMatchingCharge, subscriptionTransaction } from './subscriptions'

export interface RecordedCharge {
  sub: Subscription
  date: string  // "yyyy-mm-dd"
}

// Runs one at a time, so overlapping checks can't record the same charge twice.
let queue: Promise<unknown> = Promise.resolve()

/**
 * Records every due charge of the subscriptions set to record automatically,
 * as an expense on the charge's date. A charge already in its month file (say,
 * recorded on another device) is not written again. Returns what was written.
 */
export function recordDueSubscriptions(walletFile: WalletFile, today: string): Promise<RecordedCharge[]> {
  const run = queue.then(() => recordDue(walletFile, today))
  queue = run.catch(() => undefined)
  return run
}

async function recordDue(walletFile: WalletFile, today: string): Promise<RecordedCharge[]> {
  // Start from what is saved now, merged with this device's settings.
  await walletFile.reconcileConfig()
  const recorded: RecordedCharge[] = []
  const lastById = new Map<string, string>()
  for (const sub of walletFile.getConfig().subscriptions ?? []) {
    if (!sub.autoRecord) continue
    for (const date of dueChargeDates(sub, today)) {
      const tx = subscriptionTransaction(sub, date)
      const written = await walletFile.writeTransactionIfAbsent(tx, date.substring(0, 7), rows => hasMatchingCharge(rows, tx))
      if (written) recorded.push({ sub, date })
      lastById.set(sub.id, date)
    }
  }
  if (lastById.size > 0) {
    // Re-read: writeTransaction may have saved new tags into the config.
    const subscriptions = (walletFile.getConfig().subscriptions ?? []).map(s => {
      const last = lastById.get(s.id)
      return last && (!s.lastRecorded || last > s.lastRecorded) ? { ...s, lastRecorded: last } : s
    })
    walletFile.updateConfig({ subscriptions })
    await walletFile.saveConfig()
  }
  return recorded
}

/** Marks a charge as handled (recorded by hand or skipped) so it stops showing as due. */
export async function markChargeHandled(walletFile: WalletFile, id: string, date: string): Promise<void> {
  const subscriptions = (walletFile.getConfig().subscriptions ?? []).map(s =>
    s.id === id && (!s.lastRecorded || date > s.lastRecorded) ? { ...s, lastRecorded: date } : s)
  walletFile.updateConfig({ subscriptions })
  await walletFile.saveConfig()
}

/** Adds the subscription, or replaces the one with the same id. */
export async function saveSubscription(walletFile: WalletFile, saved: Subscription): Promise<void> {
  const current = walletFile.getConfig().subscriptions ?? []
  const exists = current.some(s => s.id === saved.id)
  walletFile.updateConfig({ subscriptions: exists ? current.map(s => s.id === saved.id ? saved : s) : [...current, saved] })
  await walletFile.saveConfig()
}
