import { App, Events, MarkdownPostProcessorContext, MarkdownRenderChild, TAbstractFile, debounce } from 'obsidian'
import { WalletFile } from '../io/WalletFile'
import { t } from '../i18n'
import { BUDGET_EMBED_REFRESH } from './BudgetEmbed'
import { parseFollowUpsEmbed, renderFollowUpsCard } from './followUps'

export const FOLLOW_UPS_EMBED_LANG = 'finance-followups'

/** The Overview's Follow-ups card inside a note; redraws when transactions change. */
export class FollowUpsEmbed extends MarkdownRenderChild {
  private readonly refresh = debounce(() => { void this.render() }, 300, true)

  constructor(
    private app: App,
    containerEl: HTMLElement,
    private walletFile: WalletFile,
    private source: string,
  ) {
    super(containerEl)
  }

  onload() {
    const onFileChange = (file: TAbstractFile) => {
      if (file.path.startsWith(this.walletFile.folderName + '/')) this.refresh()
    }
    this.registerEvent(this.app.vault.on('modify', onFileChange))
    this.registerEvent(this.app.vault.on('create', onFileChange))
    this.registerEvent(this.app.vault.on('delete', onFileChange))
    this.registerEvent((this.app.workspace as Events).on('penny-wallet-mod:refresh', () => this.refresh()))
    this.registerEvent((this.app.workspace as Events).on(BUDGET_EMBED_REFRESH, () => this.refresh()))
    void this.render()
  }

  private async render() {
    const config = this.walletFile.getConfig()
    const tag = parseFollowUpsEmbed(this.source, config.followUpTag ?? '')
    const el = this.containerEl
    el.addClass('pw-follow-ups-embed')
    if (!tag) {
      el.empty()
      el.createDiv({ text: t('embed.noFollowUpTag'), cls: 'pw-budget-embed-error' })
      return
    }
    const items = await this.walletFile.findTransactionsByTag(tag)
    el.empty()
    renderFollowUpsCard(el, {
      app: this.app,
      walletFile: this.walletFile,
      tag,
      items,
      dp: config.decimalPlaces ?? 0,
      hoverParent: this,
      hoverSource: 'preview',
    })
  }
}

export function processFollowUpsEmbed(app: App, walletFile: WalletFile) {
  return (source: string, el: HTMLElement, ctx: MarkdownPostProcessorContext) => {
    ctx.addChild(new FollowUpsEmbed(app, el, walletFile, source))
  }
}
