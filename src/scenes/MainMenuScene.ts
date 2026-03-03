import { SoundManager } from '../utils/SoundManager'
import Phaser from 'phaser'
import { drawBackground } from '../ui/SceneBackground'
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
    if (!this.textures.exists('saechong'))
      this.load.image('saechong', 'assets/saechong.png')
    // 새 이미지 로드 추가!
    const birds = ['sparrow', 'pigeon', 'parrot', 'owl', 'eagle']
    for (const b of birds) {
      const key = `bird_${b}_new`
      if (!this.textures.exists(key))
        this.load.image(key, `assets/${b}_new.png`)
    }
  }

  create() {
    const { width, height } = this.scale

    drawBackground(this)
    this.drawSlingshot(width, height)
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

  private drawSlingshot(w: number, h: number) {
    if (!this.textures.exists('saechong')) return
    const g = this.add.graphics().setDepth(3)
    const sx = w * 0.5
    const sy = h * 0.72

    g.fillStyle(0x000000, 0.18)
    g.fillEllipse(sx - w*0.02, sy+4, w*0.14, 10)

    const img = this.add.image(sx - w*0.02, sy, 'saechong')
      .setDisplaySize(w*0.44, w*0.44)
      .setOrigin(0.5, 0.93)
      .setDepth(4)

    this.tweens.add({
      targets: img, angle: -2, duration: 2200,
      yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
    })
  }

  private initFlyBird(w: number, h: number) {
    this.tweetTimer = 0; this.showTweet = false
    this.menuBirds = []

    const b1 = new Bird(this, w + 60,
      Phaser.Math.Between(50, Math.floor(h * 0.28)), 80, false)
    b1.setDepth(9)
    this.menuBirds.push(b1)

    const b2 = new Bird(this, -60,
      Phaser.Math.Between(Math.floor(h * 0.10), Math.floor(h * 0.35)), 65, true)
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
          Phaser.Math.Between(50, Math.floor(height * 0.35)),
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
