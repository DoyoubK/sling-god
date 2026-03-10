import { SoundManager } from '../utils/SoundManager'
import Phaser from 'phaser'
import { drawBackground } from '../ui/SceneBackground'
import { preloadBackgroundAssets } from '../ui/SceneBackgroundSprite'
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
    this.drawMenuTrees(width, height)
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

  private drawMenuTrees(w: number, h: number) {
    if (!this.textures.exists('tree')) return
    const groundY = h * 0.76

    // 원경 나무 (작고 흐리게)
    const farTrees = [
      { x: w*0.12, s: 0.42, tint: 0x88B898, flip: false, alpha: 0.55 },
      { x: w*0.82, s: 0.38, tint: 0x90C0A0, flip: true,  alpha: 0.50 },
    ]
    // 전경 나무 (크고 선명하게)
    const nearTrees = [
      { x: w*0.02,  s: 0.95, tint: 0xFFFFFF, flip: false, alpha: 1.0  },
      { x: w*0.98,  s: 1.00, tint: 0xEEF8EE, flip: true,  alpha: 1.0  },
    ]

    farTrees.forEach(({ x, s, tint, flip, alpha }) => {
      const dH = groundY * s * 0.425   // 절반
      const dW = dH * (2816 / 1536)
      this.add.image(x, groundY, 'tree')
        .setDisplaySize(dW, dH).setOrigin(0.5, 0.91)
        .setTint(tint).setFlipX(flip).setAlpha(alpha).setDepth(1)
    })
    nearTrees.forEach(({ x, s, tint, flip, alpha }) => {
      const dH = groundY * s * 0.425   // 절반
      const dW = dH * (2816 / 1536)
      this.add.image(x, groundY, 'tree')
        .setDisplaySize(dW, dH).setOrigin(0.5, 0.91)
        .setTint(tint).setFlipX(flip).setAlpha(alpha).setDepth(2)
    })
  }

  private drawSlingshot(w: number, h: number) {
    // ── sling_new.png 기준 상수 ──────────────────────────────
    const IMG_W    = 2816
    const IMG_H    = 1536
    // 이미지 분석: 손잡이 하단 x=28%, y=88%
    const ORIGIN_X = 0.28
    const ORIGIN_Y = 0.88
    // 갈래 끝 픽셀 좌표 (이미지 분석 기준)
    const L_FORK   = { x: Math.round(0.32 * IMG_W), y: Math.round(0.08 * IMG_H) }  // x=901, y=123
    const R_FORK   = { x: Math.round(0.62 * IMG_W), y: Math.round(0.18 * IMG_H) }  // x=1746, y=276

    // ── 새총 위치: 버튼 위로 충분히 높게 ───────────────────
    const slingshotX = w * 0.46
    const slingshotY = h * 0.68   // 버튼 위 여유있게

    const displayW = w * 0.825
    const imgScale = displayW / IMG_W

    // 화면좌표 변환 함수
    const toScreen = (px: number, py: number) => ({
      x: slingshotX + (px - IMG_W * ORIGIN_X) * imgScale,
      y: slingshotY + (py - IMG_H * ORIGIN_Y) * imgScale,
    })

    // 갈래 끝 화면 좌표
    const L = toScreen(L_FORK.x, L_FORK.y)
    const R = toScreen(R_FORK.x, R_FORK.y)

    // 파우치 기본 위치 (갈래 두 끝점 중간)
    const restX = (L.x + R.x) / 2
    const restY = (L.y + R.y) / 2 + 20

    // 당겨진 돌 위치: 왼쪽 아래 대각선
    const pullX = restX - w * 0.13
    const pullY = restY + h * 0.07

    // ── 그림자 ───────────────────────────────────────────────
    this.add.graphics().setDepth(3)
      .fillStyle(0x000000, 0.12)
      .fillEllipse(slingshotX + w * 0.02, slingshotY + 6, w * 0.18, 10)

    // ── 고무줄 (새총 뒤에: depth 4) ─────────────────────────
    const rubber = this.add.graphics().setDepth(10)
    // 외곽선
    rubber.lineStyle(5, 0x1A0A00, 0.9)
    rubber.beginPath(); rubber.moveTo(L.x, L.y); rubber.lineTo(pullX, pullY); rubber.strokePath()
    rubber.beginPath(); rubber.moveTo(R.x, R.y); rubber.lineTo(pullX, pullY); rubber.strokePath()
    // 내부 색상
    rubber.lineStyle(3, 0x7B3B0A, 0.95)
    rubber.beginPath(); rubber.moveTo(L.x, L.y); rubber.lineTo(pullX, pullY); rubber.strokePath()
    rubber.beginPath(); rubber.moveTo(R.x, R.y); rubber.lineTo(pullX, pullY); rubber.strokePath()
    // 파우치
    rubber.fillStyle(0x2A1200); rubber.fillRect(pullX - 9, pullY - 4, 18, 12)
    rubber.fillStyle(0x5C2800); rubber.fillRect(pullX - 7, pullY - 2, 14, 9)
    rubber.fillStyle(0x7A3A10); rubber.fillRect(pullX - 5, pullY,     10, 5)

    // ── 새총 이미지 (depth 5, 고무줄 앞) ────────────────────
    this.add.image(slingshotX, slingshotY, 'sling_new')
      .setScale(imgScale)
      .setOrigin(ORIGIN_X, ORIGIN_Y)
      .setDepth(11)

    // ── 돌 이미지 (depth 6, 새총 앞) ────────────────────────
    const stoneImg = this.add.image(pullX, pullY - 10, 'stone')
      .setScale(54 / 1536)
      .setOrigin(0.5, 0.5)
      .setDepth(12)

    // ── 미세 떨림 애니메이션 ─────────────────────────────────
    this.tweens.add({
      targets: stoneImg,
      x: `+=4`, y: `+=3`,
      duration: 200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
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
