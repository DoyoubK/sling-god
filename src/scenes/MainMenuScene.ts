import Phaser from 'phaser'
import { GameManager } from '../utils/GameManager'
import { createButton } from '../ui/Button'
import { TDS } from '../constants/TDS'



const CLOUD1     = 0xE8EEF2
const CLOUD2     = 0xC8D8E4

const WOOD2      = 0x6B4226
const GROUND1    = 0x7A6244
const GROUND2    = 0x5C4830
const FIRE1      = 0xF8D848
const FIRE2      = 0xF8A030

export class MainMenuScene extends Phaser.Scene {
  private flyBirdX  = 0
  private flyBirdY  = 0
  private flyBirdVx = 0
  private wingPhase = 0
  private tweetTimer = 0
  private showTweet  = false
  private birdGfx!:   Phaser.GameObjects.Graphics
  private bubbleGfx!: Phaser.GameObjects.Graphics
  private tweetTxt!:  Phaser.GameObjects.Text

  constructor() { super({ key: 'MainMenuScene' }) }

  preload() {
    this.load.image('saechong', 'assets/saechong.png')
  }

  create() {
    const { width, height } = this.scale

    // 하늘
    this.drawPixelSky(width, height)
    this.drawPixelClouds(width)
    this.drawGround(width, height)

    // ── 새총 이미지 (하단 중앙) ──
    const slingshotImg = this.add.image(width / 2, height * 0.72, 'saechong')
    // 이미지가 2048x2048이므로 적절히 축소
    const imgScale = (width * 0.5) / 2048
    slingshotImg.setScale(imgScale).setDepth(3)
    // 살짝 좌우로 흔들기
    this.tweens.add({
      targets: slingshotImg,
      angle: -3,
      duration: 1600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    })

    // ── 불꽃 이펙트 (새총 위) ──
    this.drawFireEffect(width, height)

    // ── 타이틀 카드 ──
    this.drawTitleCard(width, height)

    // ── 날아다니는 새 ──
    this.initFlyingBird(width, height)

    this.cameras.main.fadeIn(450, 74, 150, 204)
  }

  private drawPixelSky(w: number, h: number) {
    const g = this.add.graphics().setDepth(0)
    const steps = 40
    const skyH  = h * 0.78
    for (let i = 0; i < steps; i++) {
      const t  = i / steps
      const y  = (skyH / steps) * i
      const r  = Math.round(0x4A + (0x7E - 0x4A) * t)
      const gv = Math.round(0x96 + (0xC4 - 0x96) * t)
      const b  = Math.round(0xCC + (0xE8 - 0xCC) * t)
      g.fillStyle(Phaser.Display.Color.GetColor(r, gv, b))
      g.fillRect(0, y, w, skyH / steps + 1)
    }
  }

  private drawPixelClouds(w: number) {
    const clouds = [
      { x: w * 0.14, y: 62,  s: 1.0, spd: 13000 },
      { x: w * 0.65, y: 42,  s: 0.8, spd: 18000 },
      { x: w * 0.84, y: 95,  s: 0.6, spd: 22000 },
    ]
    clouds.forEach(c => {
      const g = this.add.graphics().setDepth(1).setAlpha(0.88)
      const px = 7 * c.s
      const blocks = [[1,1],[2,1],[3,1],[4,1],[0,0],[1,0],[2,0],[3,0],[4,0],[5,0],[1,-1],[2,-1],[3,-1]]
      blocks.forEach(([bx, by]) => {
        g.fillStyle(CLOUD1); g.fillRect(c.x + bx * px, c.y + by * px, px, px)
        if (by === 1) { g.fillStyle(CLOUD2); g.fillRect(c.x + bx * px, c.y + by * px + px * 0.6, px, px * 0.4) }
      })
      this.tweens.add({ targets: g, x: `-=${22 * c.s}`, duration: c.spd, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' })
    })
  }

  private drawGround(w: number, h: number) {
    const g  = this.add.graphics().setDepth(2)
    const gy = h * 0.82
    g.fillStyle(GROUND1); g.fillRect(0, gy, w, h - gy)
    g.fillStyle(GROUND2); g.fillRect(0, gy, w, 5)
    g.fillStyle(0x8DB85A)
    for (let x = 0; x < w; x += 12) {
      g.fillRect(x, gy - 3, 6, 3)
      g.fillRect(x + 4, gy - 5, 4, 2)
    }
    // 나무
    const drawTree = (x: number, y: number, sc: number) => {
      const th = 50 * sc, tr = 24 * sc
      g.fillStyle(WOOD2); g.fillRect(x - 4 * sc, y - th * 0.4, 8 * sc, th * 0.55)
      g.fillStyle(0x2D8A2D); g.fillTriangle(x, y - th, x - tr, y - th * 0.35, x + tr, y - th * 0.35)
      g.fillStyle(0x3AA03A); g.fillTriangle(x, y - th * 1.12, x - tr * 0.75, y - th * 0.6, x + tr * 0.75, y - th * 0.6)
    }
    drawTree(w * 0.08,  h * 0.80, 0.9)
    drawTree(w * 0.20,  h * 0.83, 0.65)
    drawTree(w * 0.84,  h * 0.79, 1.0)
    drawTree(w * 0.94,  h * 0.82, 0.7)
  }

  private drawFireEffect(w: number, h: number) {
    const g   = this.add.graphics().setDepth(4)
    const bx  = w / 2
    const by  = h * 0.72 - (w * 0.5 / 2048) * 2048 * 0.38  // 새총 이미지 상단 근처
    const flames = [
      { dx: 0,   dy: -12, c: FIRE1, s: 7 },
      { dx: -7,  dy: -8,  c: FIRE2, s: 5 },
      { dx: 7,   dy: -8,  c: FIRE2, s: 5 },
      { dx: -3,  dy: -16, c: 0xE86420, s: 4 },
      { dx: 3,   dy: -18, c: FIRE1, s: 3 },
    ]
    flames.forEach(f => { g.fillStyle(f.c); g.fillRect(bx + f.dx - f.s / 2, by + f.dy, f.s, f.s) })
    const sparks = [
      { dx: -18, dy: -20, c: 0xFFFFCC }, { dx: -22, dy: -14, c: FIRE1 },
      { dx: 16,  dy: -24, c: 0xFFFFCC }, { dx: 22,  dy: -16, c: FIRE2 },
    ]
    sparks.forEach(s => { g.fillStyle(s.c); g.fillRect(bx + s.dx, by + s.dy, 3, 3) })
    this.tweens.add({ targets: g, alpha: 0.65, duration: 220, yoyo: true, repeat: -1, ease: 'Stepped' })
  }

  private drawTitleCard(w: number, h: number) {
    const cy = h * 0.165

    const card = this.add.graphics().setDepth(5)
    card.fillStyle(0x1A2A3A, 0.84)
    card.fillRect(w / 2 - 152, cy - 36, 304, 82)
    card.lineStyle(3, 0xFFFFFF, 0.9)
    card.strokeRect(w / 2 - 152, cy - 36, 304, 82)
    // 코너 금색
    const corners = [{x: w/2-152, y: cy-36},{x: w/2+146, y: cy-36},{x: w/2-152, y: cy+40},{x: w/2+146, y: cy+40}]
    corners.forEach(c => { card.fillStyle(FIRE1); card.fillRect(c.x, c.y, 6, 6) })

    // 그림자
    this.add.text(w / 2 + 3, cy - 6, '새총의 신', {
      fontSize: '40px', fontFamily: TDS.font.family, color: '#000000', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(6).setAlpha(0.4)
    this.add.text(w / 2, cy - 8, '새총의 신', {
      fontSize: '40px', fontFamily: TDS.font.family, color: '#FFFFFF', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(7)
    this.add.text(w / 2, cy + 28, '날아가는 새를 맞혀라!', {
      fontSize: '14px', fontFamily: TDS.font.family, color: '#A8D4F0',
    }).setOrigin(0.5).setDepth(7)

    // 최고 기록
    const gm = GameManager.getInstance()
    if (gm.bestLevel > 1) {
      const bg2 = this.add.graphics().setDepth(5)
      bg2.fillStyle(FIRE2, 0.9)
      bg2.fillRect(w / 2 - 82, h * 0.318, 164, 28)
      bg2.lineStyle(2, FIRE1); bg2.strokeRect(w / 2 - 82, h * 0.318, 164, 28)
      this.add.text(w / 2, h * 0.332, `★  최고 기록  Lv.${gm.bestLevel}`, {
        fontSize: '14px', fontFamily: TDS.font.family, color: '#FFFFFF', fontStyle: 'bold',
      }).setOrigin(0.5).setDepth(6)
    }

    // 버튼
    const btnY = h * 0.9
    const btn  = createButton({
      scene: this, x: w / 2, y: btnY,
      width: 260, height: 54, label: '▶  게임 시작', variant: 'primary',
      onClick: () => { GameManager.getInstance().fullReset(); this.scene.start('GameScene') },
    }).setDepth(8)
    const btnDeco = this.add.graphics().setDepth(7)
    btnDeco.lineStyle(2, FIRE1, 0.7)
    btnDeco.strokeRect(w / 2 - 132, btnY - 28, 264, 56)
    this.tweens.add({ targets: btn, scaleX: 1.04, scaleY: 1.04, duration: 800, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' })

    this.add.text(w / 2, h * 0.962, '드래그로 조준  ✦  손 떼면 발사', {
      fontSize: '12px', fontFamily: TDS.font.family, color: '#7CB3E0',
    }).setOrigin(0.5).setDepth(6)
  }

  private initFlyingBird(w: number, h: number) {
    this.flyBirdX  = w + 50
    this.flyBirdY  = h * 0.22
    this.flyBirdVx = -(Phaser.Math.Between(55, 85))
    this.wingPhase = 0; this.tweetTimer = 0; this.showTweet = false
    this.birdGfx   = this.add.graphics().setDepth(9)
    this.bubbleGfx = this.add.graphics().setDepth(9)
    this.tweetTxt  = this.add.text(0, 0, '짹!', {
      fontSize: '11px', fontFamily: TDS.font.family, color: '#191F28', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(10).setVisible(false)
  }

  update(_time: number, delta: number) {
    if (!this.birdGfx) return
    const { width, height } = this.scale
    const dt = delta / 1000
    this.flyBirdX  += this.flyBirdVx * dt
    this.wingPhase += dt * 8
    if (this.flyBirdX < -60) {
      this.flyBirdX  = width + 50
      this.flyBirdY  = Phaser.Math.Between(55, Math.floor(height * 0.32))
      this.flyBirdVx = -(Phaser.Math.Between(55, 85))
    }
    const bx = this.flyBirdX, by = this.flyBirdY
    this.birdGfx.clear()
    const wingDy = Math.sin(this.wingPhase) * 5
    this.birdGfx.fillStyle(0x6B4C0A); this.birdGfx.fillRect(bx - 14, by - 4 - wingDy, 12, 5)
    this.birdGfx.fillStyle(0x6B4C0A); this.birdGfx.fillRect(bx + 4,  by - 4 - wingDy, 10, 5)
    this.birdGfx.fillStyle(0x8B6914); this.birdGfx.fillRect(bx - 6, by - 5, 14, 10)
    this.birdGfx.fillStyle(0xA07820); this.birdGfx.fillRect(bx - 4, by - 4, 10, 6)
    this.birdGfx.fillStyle(0x191F28); this.birdGfx.fillRect(bx - 3, by - 3, 3, 3)
    this.birdGfx.fillStyle(0xFFFFFF); this.birdGfx.fillRect(bx - 2, by - 3, 1, 1)
    this.birdGfx.fillStyle(FIRE2);    this.birdGfx.fillRect(bx - 10, by - 1, 5, 3)
    this.birdGfx.fillStyle(0x6B4C0A); this.birdGfx.fillRect(bx + 7, by - 2, 6, 3)
    this.bubbleGfx.clear()
    this.tweetTimer += dt
    if (this.tweetTimer > 2.5 && !this.showTweet) {
      this.showTweet = true; this.tweetTimer = 0
      const tweets = ['짹!', '짹짹!', '짹~♪', '짹짹짹!']
      this.tweetTxt.setText(tweets[Phaser.Math.Between(0, tweets.length - 1)])
    }
    if (this.showTweet && this.tweetTimer < 1.2) {
      const alpha = this.tweetTimer < 0.8 ? 1 : 1 - (this.tweetTimer - 0.8) / 0.4
      this.bubbleGfx.fillStyle(0xFFFFFF, alpha); this.bubbleGfx.fillRect(bx - 20, by - 28, 40, 18)
      this.bubbleGfx.fillStyle(0xCCCCCC, alpha); this.bubbleGfx.fillRect(bx - 20, by - 28, 40, 2)
      this.bubbleGfx.fillStyle(0xFFFFFF, alpha); this.bubbleGfx.fillRect(bx - 4, by - 10, 8, 5)
      this.tweetTxt.setPosition(bx, by - 19).setAlpha(alpha).setVisible(true)
    } else if (this.tweetTimer >= 1.2) {
      this.showTweet = false; this.tweetTxt.setVisible(false)
    }
  }
}
