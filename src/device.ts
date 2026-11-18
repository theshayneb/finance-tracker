import { App, Platform } from 'obsidian'

/** Device-local (never synced) switch: whether this device runs automatic work. */
const BACKGROUND_KEY = 'penny-wallet-mod:background-tasks'

/** On by default on a computer, off on a phone or tablet. */
export function backgroundTasksEnabled(app: App): boolean {
  try {
    const value: unknown = app.loadLocalStorage(BACKGROUND_KEY)
    return typeof value === 'boolean' ? value : !Platform.isMobile
  } catch {
    return !Platform.isMobile
  }
}

export function setBackgroundTasksEnabled(app: App, on: boolean): void {
  app.saveLocalStorage(BACKGROUND_KEY, on)
}

/** This device's backup of the last merged settings (see ConfigStore). */
export const CONFIG_BACKUP_KEY = 'penny-wallet-mod:config-backup'

/** Automatic work waits this long after Obsidian starts, and for the vault to be this long without changes (ms). */
export const SETTLE_AFTER_START_MS = 3 * 60 * 1000
export const SETTLE_QUIET_MS = 60 * 1000

/**
 * Whether Obsidian Sync has likely caught up: Obsidian has been open a few
 * minutes, no file has changed for a minute (Sync writes what other devices did
 * as file changes), and Sync, where it says so, isn't syncing.
 */
export function syncSettled(app: App, startedAt: number, lastVaultChange: number, now = Date.now()): boolean {
  if (now - startedAt < SETTLE_AFTER_START_MS || now - lastVaultChange < SETTLE_QUIET_MS) return false
  const sync = (app as unknown as { internalPlugins?: { getPluginById?: (id: string) => { enabled?: boolean, instance?: { syncing?: unknown } } | null } })
    .internalPlugins?.getPluginById?.('sync')
  return !(sync?.enabled && sync.instance?.syncing === true)
}
