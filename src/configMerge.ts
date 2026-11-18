import type { Budget, PennyWalletConfig, Subscription, Wallet } from './types'

/**
 * Merging settings across synced devices.
 *
 * Obsidian Sync merges data.json per top-level key, so a device that has been
 * offline for days can send back a whole stale list. To merge per entry, the
 * saved copy (StoredConfig) carries edit times:
 * - wallets, budgets and subscriptions: `updatedAt` on each entry, and deleted
 *   entries stay in the list as tombstones (`deleted: true`);
 * - string lists (tags, custom and hidden categories): a stamp per member;
 * - every other setting: a stamp per key;
 * - list order: a stamp per list.
 * Nothing outside this file sees tombstones or stamps: the app works on the
 * live projection (`liveConfig`). Stamps come from comparing the live config
 * with the last stored copy at save time (`stampChanges`), so callers just edit
 * the config and save. The newest edit wins; a subscription's `lastRecorded`
 * takes the later date from either side, whichever edit wins.
 */

export interface MemberStamp {
  at: number
  deleted?: boolean
}

export interface SyncStamps {
  fields: Record<string, number>
  members: Record<string, Record<string, MemberStamp>>
  order: Record<string, number>
}

interface Stamped {
  updatedAt?: number
  deleted?: boolean
}

export type StoredWallet = Wallet & Stamped
export type StoredBudget = Budget & Stamped
export type StoredSubscription = Subscription & Stamped

export interface StoredConfig extends Omit<PennyWalletConfig, 'wallets' | 'budgets' | 'subscriptions'> {
  wallets: StoredWallet[]
  budgets: StoredBudget[]
  subscriptions: StoredSubscription[]
  syncStamps: SyncStamps
}

// ── Collections ──────────────────────────────────────────────────────────────

interface KeyedSpec<T extends Stamped> {
  name: 'wallets' | 'budgets' | 'subscriptions'
  key: (e: T) => string
  /** Content compared to decide whether an entry was edited. */
  content: (e: T) => string
}

const strip = <T extends Stamped>(e: T, drop: string[] = []): string => {
  const copy: Record<string, unknown> = { ...(e as unknown as Record<string, unknown>) }
  for (const k of ['updatedAt', 'deleted', ...drop]) delete copy[k]
  return stableStringify(copy)
}

const WALLETS: KeyedSpec<StoredWallet> = { name: 'wallets', key: w => w.name, content: w => strip(w) }
const BUDGETS: KeyedSpec<StoredBudget> = { name: 'budgets', key: b => b.name, content: b => strip(b) }
// lastRecorded is merged on its own, so recording a charge doesn't count as an edit
// (that would let it override an edit made on another device).
const SUBSCRIPTIONS: KeyedSpec<StoredSubscription> = { name: 'subscriptions', key: s => s.id, content: s => strip(s, ['lastRecorded']) }

// ── String lists ─────────────────────────────────────────────────────────────

type CategoryType = 'expense' | 'income' | 'transfer'

interface ListSpec {
  name: string
  get: (c: PennyWalletConfig | StoredConfig) => string[]
  set: (c: StoredConfig, list: string[]) => void
  sorted?: boolean
}

function categoryList(type: CategoryType, field: 'custom' | 'hidden'): ListSpec {
  return {
    name: `categories.${type}.${field}`,
    get: c => c.options?.categories?.[type]?.[field] ?? [],
    set: (c, list) => {
      c.options = {
        ...c.options,
        categories: { ...c.options.categories, [type]: { ...c.options.categories[type], [field]: list } },
      }
    },
  }
}

const LISTS: ListSpec[] = [
  { name: 'tags', get: c => c.tags ?? [], set: (c, list) => { c.tags = list }, sorted: true },
  {
    name: 'types.custom',
    get: c => c.options?.types?.custom ?? [],
    set: (c, list) => { c.options = { ...c.options, types: { ...c.options.types, custom: list } } },
  },
  ...(['expense', 'income', 'transfer'] as const).flatMap(type => [categoryList(type, 'custom'), categoryList(type, 'hidden')]),
]

/** Keys merged as a whole value, by their stamp. */
const SPECIAL_KEYS = new Set(['wallets', 'budgets', 'subscriptions', 'tags', 'options', 'syncStamps'])

function scalarKeys(...configs: object[]): string[] {
  const keys = new Set<string>()
  for (const c of configs) for (const k of Object.keys(c)) if (!SPECIAL_KEYS.has(k)) keys.add(k)
  return [...keys].sort()
}

// ── Helpers ──────────────────────────────────────────────────────────────────

/** JSON with object keys sorted, so equal values compare equal. */
export function stableStringify(value: unknown): string {
  return JSON.stringify(value, (_k, v: unknown) => {
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      return Object.fromEntries(Object.entries(v as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b)))
    }
    return v
  })
}

/** a is newer than b; equal times fall back to the content, so every device picks the same one. */
function newer(aAt: number, bAt: number, aContent: string, bContent: string): boolean {
  if (aAt !== bAt) return aAt > bAt
  return aContent > bContent
}

function clone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v)) as T
}

// ── Public API ───────────────────────────────────────────────────────────────

/** A stored copy from data.json (any version); entries without edit times count as time 0. */
export function toStored(config: PennyWalletConfig | StoredConfig): StoredConfig {
  const c = clone(config) as StoredConfig
  const s = (c as Partial<StoredConfig>).syncStamps
  c.syncStamps = {
    fields: { ...(s?.fields ?? {}) },
    members: { ...(s?.members ?? {}) },
    order: { ...(s?.order ?? {}) },
  }
  c.wallets ??= []
  c.budgets ??= []
  c.subscriptions ??= []
  return c
}

/** The config the app works with: no tombstones or stamps. */
export function liveConfig(stored: StoredConfig): PennyWalletConfig {
  const c = clone(stored) as Partial<StoredConfig>
  delete c.syncStamps
  const live = <T extends Stamped>(list: T[]) => list.filter(e => !e.deleted).map(e => {
    const copy = { ...e }
    delete copy.deleted
    delete copy.updatedAt
    return copy
  })
  return {
    ...(c as PennyWalletConfig),
    wallets: live(stored.wallets),
    budgets: live(stored.budgets),
    subscriptions: live(stored.subscriptions),
  }
}

/**
 * The stored copy for `live`, given the last stored copy (`base`): whatever
 * differs from `base` is stamped `now`; removed entries become tombstones.
 */
export function stampChanges(base: StoredConfig, live: PennyWalletConfig, now: number): StoredConfig {
  const baseLive = liveConfig(base)
  const out = toStored({ ...clone(live), syncStamps: base.syncStamps } as StoredConfig)

  for (const key of scalarKeys(live, baseLive)) {
    const a = (live as unknown as Record<string, unknown>)[key]
    const b = (baseLive as unknown as Record<string, unknown>)[key]
    if (stableStringify(a) !== stableStringify(b)) out.syncStamps.fields[key] = now
  }

  out.wallets = stampKeyed(WALLETS, base.wallets, live.wallets, now, out.syncStamps)
  out.budgets = stampKeyed(BUDGETS, base.budgets, live.budgets, now, out.syncStamps)
  out.subscriptions = stampKeyed(SUBSCRIPTIONS, base.subscriptions, live.subscriptions ?? [], now, out.syncStamps)

  for (const list of LISTS) {
    const before = new Set(list.get(baseLive))
    const after = list.get(live)
    const afterSet = new Set(after)
    const stamps = { ...(out.syncStamps.members[list.name] ?? {}) }
    for (const m of after) if (!before.has(m)) stamps[m] = { at: now }
    for (const m of before) if (!afterSet.has(m)) stamps[m] = { at: now, deleted: true }
    if (Object.keys(stamps).length > 0) out.syncStamps.members[list.name] = stamps
    if (!list.sorted && sameMembersDifferentOrder(list.get(baseLive), after)) out.syncStamps.order[list.name] = now
  }
  return out
}

function stampKeyed<T extends Stamped>(
  spec: KeyedSpec<T>,
  base: T[],
  live: T[],
  now: number,
  stamps: SyncStamps,
): T[] {
  const baseByKey = new Map(base.map(e => [spec.key(e), e]))
  const liveKeys = new Set(live.map(spec.key))
  const result: T[] = live.map(e => {
    const prev = baseByKey.get(spec.key(e))
    const edited = !prev || prev.deleted || spec.content(prev) !== spec.content(e)
    return { ...e, updatedAt: edited ? now : (prev.updatedAt ?? 0) }
  })
  for (const prev of base) {
    if (liveKeys.has(spec.key(prev))) continue
    result.push(prev.deleted ? prev : { ...prev, deleted: true, updatedAt: now })
  }
  const baseOrder = base.filter(e => !e.deleted).map(spec.key)
  if (sameMembersDifferentOrder(baseOrder, live.map(spec.key))) stamps.order[spec.name] = now
  return result
}

/** Whether the shared members of `a` and `b` appear in a different order. */
function sameMembersDifferentOrder(a: string[], b: string[]): boolean {
  const inB = new Set(b)
  const inA = new Set(a)
  const sa = a.filter(x => inB.has(x))
  const sb = b.filter(x => inA.has(x))
  return sa.some((x, i) => x !== sb[i])
}

/** Merges two stored copies: newest edit per entry, member and setting. Order of arguments doesn't matter. */
export function mergeStored(a: StoredConfig, b: StoredConfig): StoredConfig {
  a = toStored(a)
  b = toStored(b)
  const fieldsA = a.syncStamps.fields
  const fieldsB = b.syncStamps.fields
  const out = toStored(a)
  const outRec = out as unknown as Record<string, unknown>
  const aRec = a as unknown as Record<string, unknown>
  const bRec = b as unknown as Record<string, unknown>

  for (const key of scalarKeys(a, b)) {
    if (!(key in bRec)) continue
    if (!(key in aRec) || newer(fieldsB[key] ?? 0, fieldsA[key] ?? 0, stableStringify(bRec[key]), stableStringify(aRec[key]))) {
      outRec[key] = clone(bRec[key])
    }
    out.syncStamps.fields[key] = Math.max(fieldsA[key] ?? 0, fieldsB[key] ?? 0)
  }

  out.wallets = mergeKeyed(WALLETS, a, b, out.syncStamps)
  out.budgets = mergeKeyed(BUDGETS, a, b, out.syncStamps)
  out.subscriptions = mergeKeyed(SUBSCRIPTIONS, a, b, out.syncStamps)
  // The later "handled up to" date always wins, so a stale copy can't make a
  // charge look unrecorded.
  const lastById = new Map<string, string>()
  for (const s of [...a.subscriptions, ...b.subscriptions]) {
    const prev = lastById.get(s.id)
    if (s.lastRecorded && (!prev || s.lastRecorded > prev)) lastById.set(s.id, s.lastRecorded)
  }
  out.subscriptions = out.subscriptions.map(s => {
    const last = lastById.get(s.id)
    return last ? { ...s, lastRecorded: last } : s
  })

  for (const list of LISTS) {
    const sa = a.syncStamps.members[list.name] ?? {}
    const sb = b.syncStamps.members[list.name] ?? {}
    const la = list.get(a)
    const lb = list.get(b)
    const stampOf = (stamps: Record<string, MemberStamp>, l: string[], m: string): MemberStamp =>
      stamps[m] ?? (l.includes(m) ? { at: 0 } : { at: -1, deleted: true })
    const merged: Record<string, MemberStamp> = {}
    const present = new Set<string>()
    for (const m of new Set([...la, ...lb, ...Object.keys(sa), ...Object.keys(sb)])) {
      const ma = stampOf(sa, la, m)
      const mb = stampOf(sb, lb, m)
      const win = newer(mb.at, ma.at, mb.deleted ? '0' : '1', ma.deleted ? '0' : '1') ? mb : ma
      if (sa[m] || sb[m]) merged[m] = win
      if (!win.deleted) present.add(m)
    }
    if (Object.keys(merged).length > 0) out.syncStamps.members[list.name] = merged
    else delete out.syncStamps.members[list.name]
    const [first, second] = orderedSides(list.name, a, b, la, lb)
    const ordered = [...first, ...second].filter((m, i, arr) => present.has(m) && arr.indexOf(m) === i)
    list.set(out, list.sorted ? [...ordered].sort() : ordered)
  }
  return out
}

/** Order of the side whose order was set last, then anything only the other side has. */
function orderedSides<T>(name: string, a: StoredConfig, b: StoredConfig, la: T[], lb: T[]): [T[], T[]] {
  const oa = a.syncStamps.order[name] ?? 0
  const ob = b.syncStamps.order[name] ?? 0
  return newer(ob, oa, JSON.stringify(lb), JSON.stringify(la)) ? [lb, la] : [la, lb]
}

function mergeKeyed<T extends Stamped>(spec: KeyedSpec<T>, a: StoredConfig, b: StoredConfig, stamps: SyncStamps): T[] {
  const la = a[spec.name] as unknown as T[]
  const lb = b[spec.name] as unknown as T[]
  const byKeyB = new Map(lb.map(e => [spec.key(e), e]))
  const byKeyA = new Map(la.map(e => [spec.key(e), e]))
  const pick = (k: string): T => {
    const ea = byKeyA.get(k)
    const eb = byKeyB.get(k)
    if (!ea) return eb!
    if (!eb) return ea
    return newer(eb.updatedAt ?? 0, ea.updatedAt ?? 0, stableStringify(eb), stableStringify(ea)) ? eb : ea
  }
  const [first, second] = orderedSides(spec.name, a, b, la.map(spec.key), lb.map(spec.key))
  const keys = [...first, ...second].filter((k, i, arr) => arr.indexOf(k) === i)
  stamps.order[spec.name] = Math.max(a.syncStamps.order[spec.name] ?? 0, b.syncStamps.order[spec.name] ?? 0)
  if (stamps.order[spec.name] === 0) delete stamps.order[spec.name]
  return keys.map(pick).map(e => clone(e))
}

/** Whether two stored copies hold the same data. */
export function sameStored(a: StoredConfig, b: StoredConfig): boolean {
  return stableStringify(a) === stableStringify(b)
}
