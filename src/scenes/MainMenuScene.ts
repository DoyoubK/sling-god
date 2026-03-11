import Phaser from 'phaser'
import { drawBackground } from '../ui/SceneBackground'
import { preloadBackgroundAssets, BG_ASSET_KEYS } from '../ui/SceneBackgroundSprite'
import { GameManager } from '../utils/GameManager'
import { TDS } from '../constants/TDS'
import { Bird } from '../objects/Bird'
import { MainMenuOverlay } from '../ui/overlays/MainMenuOverlay'

export class MainMenuScene extends Phaser.Scene {
  private menuBirds: Bird[] = []
  private tweetTimer = 0; private showTweet = false
  private bubbleGfx!: Phaser.GameObjects.Graphics
  private tweetTxt!:  Phaser.GameObjects.Text
  private overlay!: MainMenuOverlay

  constructor() { super({ key: 'MainMenuScene' }) }

  preload() {
    preloadBackgroundAssets(this)
    if (!this.textures.exists('saechong'))
      this.load.image('saechong', 'assets/saechong.png')
    if (!this.textures.exists('sling'))
      this.load.image('sling', 'assets/sling.png')
    if (!this.textures.exists('sling_new'))
      this.load.image('sling_new', 'assets/sling_new.png')
    if (!this.textures.exists('stone'))
      this.load.image('stone', 'assets/stone.png')
    if (!this.textures.exists('tree'))
      this.load.image('tree', 'assets/tree.png')
    // 새 스프라이트시트 로드
    const sheetMeta = [
      { b: 'sparrow', fw: 1032, fh: 1024 },
      { b: 'pigeon',  fw: 1032, fh: 1024 },
      { b: 'parrot',  fw: 1032, fh: 1024 },
      { b: 'owl',     fw: 1032, fh: 1024 },
      { b: 'eagle',   fw: 1032, fh: 1024 },
    ]
    for (const { b, fw, fh } of sheetMeta) {
      const sheetKey = `bird_${b}_sheet`
      if (!this.textures.exists(sheetKey))
        this.load.spritesheet(sheetKey, `assets/${b}_flying.png`, { frameWidth: fw, frameHeight: fh })
    }

    // 새 이미지 로드 (폴백용)
    const birds = ['sparrow', 'pigeon', 'parrot', 'owl', 'eagle']
    for (const b of birds) {
      const key = `bird_${b}_new`
      if (!this.textures.exists(key))
        this.load.image(key, `assets/${b}_new.png`)
    }
  }

  create() {
    const { width, height } = this.scale

    drawBackground(this, BG_ASSET_KEYS.homeMount)
    this.drawMenuTrees(width, height)
    this.initFlyBird(width, height)

    this.cameras.main.fadeIn(450, 74, 150, 204)

    this.overlay = new MainMenuOverlay(() => {
      GameManager.getInstance().fullReset()
      this.scene.start('GameScene')
    })
    this.overlay.show()
  }

  shutdown() {
    if (this.overlay) this.overlay.destroy()
  }

  private drawMenuTrees(w: number, h: number) {
    if (!this.textures.exists('tree')) return
    const groundY = h * 0.76

    // 원경 나무 (작고 흐리게)
    const farTrees = [
      { x: w*0.12, s: 0.42 * 1.3, tint: 0x88B898, flip: false, alpha: 0.54 },
      { x: w*0.82, s: 0.38 * 1.3, tint: 0x90C0A0, flip: true,  alpha: 0.50 },
    ]
    // 전경 나무 (크고 선명하게)
    const nearTrees = [
      { x: w*0.02,  s: 0.95 * 1.3, tint: 0xFFFFFF, flip: false, alpha: 0.80  },
      { x: w*0.98,  s: 1.00 * 1.3, tint: 0xEEF8EE, flip: true,  alpha: 0.80  },
    ]

    farTrees.forEach(({ x, s, tint, flip, alpha }) => {
      const dH = groundY * s * 0.27
      const dW = dH * (2816 / 1536)
      this.add.image(x, groundY, 'tree')
        .setDisplaySize(dW, dH).setOrigin(0.5, 0.91)
        .setTint(tint).setFlipX(flip).setAlpha(alpha).setDepth(1)
    })
    nearTrees.forEach(({ x, s, tint, flip, alpha }) => {
      const dH = groundY * s * 0.27
      const dW = dH * (2816 / 1536)
      this.add.image(x, groundY, 'tree')
        .setDisplaySize(dW, dH).setOrigin(0.5, 0.91)
        .setTint(tint).setFlipX(flip).setAlpha(alpha).setDepth(2)
    })
  }

  private initFlyBird(w: number, h: number) {
    this.tweetTimer = 0; this.showTweet = false
    this.menuBirds = []

    // 새는 타이틀(~h*0.38) ~ 버튼(~h*0.65) 사이에서 날아다님
    const MIN_DIST = 90
    const minY = Math.floor(h * 0.40)
    const maxY = Math.floor(h * 0.62)
    const y1 = Phaser.Math.Between(minY, maxY)
    let y2 = Phaser.Math.Between(minY, maxY)
    for (let i = 0; i < 10; i++) {
      if (Math.abs(y2 - y1) >= MIN_DIST) break
      y2 = Phaser.Math.Between(minY, maxY)
    }

    const b1 = new Bird(this, w + 60, y1, 80, false)
    b1.setDepth(9)
    this.menuBirds.push(b1)

    const b2 = new Bird(this, -60, y2, 65, true)
    b2.setDepth(9)
    this.menuBirds.push(b2)

    this.bubbleGfx = this.add.graphics().setDepth(9)
    this.tweetTxt = this.add.text(0, 0, '짹!', {
      fontSize: '12px', fontFamily: TDS.font.family, color: '#191F28', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(10).setVisible(false)
  }

  update(_t: number, delta: number) {
    if (!this.bubbleGfx) return
    const { width, height } = this.scale
    const dt = delta / 1000

    for (let i = this.menuBirds.length - 1; i >= 0; i--) {
      const b = this.menuBirds[i]
      b.update(delta)
      if (b.isOutOfBounds()) {
        const goRight = Math.random() < 0.5
        b.destroy()
        const nb = new Bird(this,
          goRight ? -60 : width + 60,
          (() => {
            const mn = Math.floor(height * 0.40), mx = Math.floor(height * 0.62)
            const others = this.menuBirds.filter((_, idx2) => idx2 !== i)
            let ry = Phaser.Math.Between(mn, mx)
            for (let t = 0; t < 10; t++) {
              if (others.every(o => Math.abs(o.y - ry) >= 90)) break
              ry = Phaser.Math.Between(mn, mx)
            }
            return ry
          })(),
          Phaser.Math.Between(60, 100), goRight)
        nb.setDepth(9)
        this.menuBirds[i] = nb
      }
    }

    this.bubbleGfx.clear()
    this.tweetTimer += dt
    if (this.tweetTimer > 2.8 && !this.showTweet) {
      this.showTweet = true; this.tweetTimer = 0
      const tweets = ['짹!', '짹짹!', '짹~♪', '짹짹짹!']
      this.tweetTxt.setText(tweets[Phaser.Math.Between(0, tweets.length-1)])
    }
    if (this.showTweet && this.menuBirds[0] && this.tweetTimer < 1.3) {
      const alpha = this.tweetTimer < 0.9 ? 1 : 1-(this.tweetTimer-0.9)/0.4
      const bx = this.menuBirds[0].x, by = this.menuBirds[0].y
      this.bubbleGfx.fillStyle(0xFFFFFF, alpha); this.bubbleGfx.fillRoundedRect(bx-22, by-36, 44, 20, 6)
      this.bubbleGfx.fillStyle(0xFFFFFF, alpha); this.bubbleGfx.fillTriangle(bx-4, by-16, bx+4, by-16, bx, by-10)
      this.tweetTxt.setPosition(bx, by-26).setAlpha(alpha).setVisible(true)
    } else if (this.tweetTimer >= 1.3) {
      this.showTweet = false; this.tweetTxt.setVisible(false)
    }
  }
}
