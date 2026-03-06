/**
 * HTMLOverlay — base manager for HTML div overlays
 * placed on top of the Phaser canvas inside #ui-layer.
 */
export class HTMLOverlay {
  protected el: HTMLDivElement
  private uiLayer: HTMLElement

  constructor(id: string) {
    this.uiLayer = document.getElementById('ui-layer') as HTMLElement
    if (!this.uiLayer) {
      // fallback: create the layer if missing
      this.uiLayer = document.createElement('div')
      this.uiLayer.id = 'ui-layer'
      Object.assign(this.uiLayer.style, {
        position: 'absolute',
        inset: '0',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        pointerEvents: 'none',
        zIndex: '10',
      })
      document.body.appendChild(this.uiLayer)
    }

    const existing = document.getElementById(id)
    if (existing) existing.remove()

    this.el = document.createElement('div')
    this.el.id = id
    this.el.style.display = 'none'
    this.uiLayer.appendChild(this.el)
  }

  show() {
    this.el.style.display = 'flex'
    this.uiLayer.style.pointerEvents = 'auto'
  }

  hide() {
    this.el.style.display = 'none'
    // disable pointer events on layer when no overlay is visible
    const visibleChildren = Array.from(this.uiLayer.children).filter(
      (c) => (c as HTMLElement).style.display !== 'none'
    )
    if (visibleChildren.length === 0) {
      this.uiLayer.style.pointerEvents = 'none'
    }
  }

  destroy() {
    this.el.remove()
  }
}
