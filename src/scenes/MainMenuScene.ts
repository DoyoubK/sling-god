import Phaser from 'phaser'
import { GameManager } from '../utils/GameManager'
import { createButton } from '../ui/Button'
import { TDS } from '../constants/TDS'
import { Bird } from '../objects/Bird'

export class MainMenuScene extends Phaser.Scene {
  private menuBirds: Bird[] = []
  private tweetTimer  = 0
  private showTweet   = false
  private bubbleGfx!: Phaser.GameObjects.Graphics
  private tweetTxt!:  Phaser.GameObjects.Text

  constructor() { super({ key: 'MainMenuScene' }) }

  preload() {
    if (!this.textures.exists('saechong')) this.load.image('saechong', 'assets/saechong.png')
  }

  create() {
    GameManager.getInstance()
    const { width: w, height: h } = this.scale

    this.drawFlatSky(w, h)
    this.drawClouds(w, h)
    this.drawSlingshot(w, h)
    this.drawSparkle(w, h)
    this.drawGround(w, h)
    this.drawTitle(w, h)
    this.drawStartButton(w, h)
    this.initBirds(w, h)

    this.cameras.main.fadeIn(400, 20, 60, 120)
  }

  // ── 단색 하늘 (레퍼런스: #6CB4E6) ────────────────────────────────────────
  private drawFlatSky(w: number, h: number) {
    // 하늘: 위 딥블루 → 아래 밝은 스카이블루 (약간 그라디언트)
    const g = this.add.graphics().setDepth(0)
    const steps = 60
    for (let i = 0; i < steps; i++) {
      const t  = i / steps
      const r  = Math.round(0x3A + (0x6C - 0x3A) * t)
      const gv = Math.round(0x8A + (0xB4 - 0x8A) * t)
      const b  = Math.round(0xC8 + (0xE6 - 0xC8) * t)
      g.fillStyle(Phaser.Display.Color.GetColor(r, gv, b))
      g.fillRect(0, h * i / steps, w, h / steps + 1)
    }
  }

  // ── 뭉게구름 (레퍼런스: 좌상/우하/하단) ──────────────────────────────────
  private drawClouds(w: number, h: number) {
    const configs = [
      { x: w * 0.05, y: h * 0.10, s: 1.6 },
      { x: w * 0.78, y: h * 0.68, s: 1.2 },
      { x: w * 0.88, y: h * 0.85, s: 0.9 },
    ]
    configs.forEach(({ x, y, s }) => {
      const g = this.add.graphics().setDepth(1)
      this.paintCloud(g, x, y, s)
    })
  }

  private paintCloud(g: Phaser.GameObjects.Graphics, cx: number, cy: number, s: number) {
    const r = 32 * s
    // 그림자
    g.fillStyle(0xC8DCF0, 0.5)
    g.fillEllipse(cx, cy + r * 0.65, r * 3.6, r * 0.7)
    // 본체
    const puffs: [number, number, number][] = [
      [0, 0, 1.0], [r*1.0, r*0.12, 0.88], [-r*0.95, r*0.08, 0.85],
      [r*1.95, r*0.22, 0.72], [-r*1.85, r*0.18, 0.68],
      [r*0.35, -r*0.48, 0.62], [-r*0.28, -r*0.38, 0.58],
    ]
    g.fillStyle(0xFFFFFF, 0.96)
    puffs.forEach(([dx, dy, rs]) => g.fillCircle(cx + dx, cy + dy, r * rs))
    // 하이라이트
    g.fillStyle(0xFFFFFF, 1.0)
    g.fillCircle(cx + r * 0.1, cy - r * 0.35, r * 0.42)
  }

  // ── 새총 (birdgun.png, 기울여서 배치) ───────────────────────────────────
  private drawSlingshot(w: number, h: number) {
    if (!this.textures.exists('saechong')) return
    const sx = w * 0.38
    const sy = h * 0.62
    const img = this.add.image(sx, sy, 'saechong')
      .setDisplaySize(w * 0.44, w * 0.44)
      .setDepth(4)
      .setAngle(-18)  // 레퍼런스처럼 약간 기울임

    // 발사 이펙트 스파크 (새총 포크 위쪽)
    const fx = sx + w * 0.08
    const fy = sy - h * 0.14
    this.drawExplosion(fx, fy)

    return img
  }

  // ── 발사 이펙트 (레퍼런스의 폭발 이펙트) ─────────────────────────────────
  private drawExplosion(cx: number, cy: number) {
    const g = this.add.graphics().setDepth(5)
    const spikes = 10

    // 외곽 주황 스파이크
    g.fillStyle(0xFF8C1A)
    g.beginPath()
    for (let i = 0; i < spikes * 2; i++) {
      const angle = (i / (spikes * 2)) * Math.PI * 2 - Math.PI / 2
      const r = i % 2 === 0 ? 34 : 16
      const x = cx + Math.cos(angle) * r
      const y = cy + Math.sin(angle) * r
      i === 0 ? g.moveTo(x, y) : g.lineTo(x, y)
    }
    g.closePath()
    g.fillPath()

    // 내부 노란 스파이크
    g.fillStyle(0xFFE033)
    g.beginPath()
    for (let i = 0; i < spikes * 2; i++) {
      const angle = (i / (spikes * 2)) * Math.PI * 2 - Math.PI / 2
      const r = i % 2 === 0 ? 24 : 11
      const x = cx + Math.cos(angle) * r
      const y = cy + Math.sin(angle) * r
      i === 0 ? g.moveTo(x, y) : g.lineTo(x, y)
    }
    g.closePath()
    g.fillPath()

    // 중심 흰색
    g.fillStyle(0xFFFFFF)
    g.fillCircle(cx, cy, 9)

    // 파편 조각
    const debris = [
      { dx: 28, dy: -18, r: 5, c: 0xC8A882 },
      { dx: -22, dy: 10, r: 4, c: 0xB09870 },
      { dx: 16,  dy: 24, r: 3, c: 0xC8A882 },
      { dx: -30, dy: -8, r: 3.5, c: 0xA08860 },
    ]
    debris.forEach(({ dx, dy, r, c }) => {
      g.fillStyle(c)
      g.fillCircle(cx + dx, cy + dy, r)
    })

    // 연기
    g.fillStyle(0xD8D0C8, 0.55)
    g.fillCircle(cx + 22, cy - 8,  11)
    g.fillCircle(cx - 12, cy - 16, 9)
    g.fillStyle(0xE8E0D8, 0.4)
    g.fillCircle(cx + 10, cy - 24, 7)

    // 반짝임 별 (작은 x자)
    const sparkles = [
      { dx: 45, dy: -30 }, { dx: -40, dy: -20 },
      { dx: 38, dy: 20  }, { dx: -15, dy: -42 },
    ]
    sparkles.forEach(({ dx, dy }) => {
      g.fillStyle(0xFFFFFF, 0.9)
      g.fillRect(cx + dx - 1, cy + dy - 6, 2, 12)
      g.fillRect(cx + dx - 6, cy + dy - 1, 12, 2)
    })

    // 펄스 애니메이션
    this.tweens.add({
      targets: g, scaleX: 1.08, scaleY: 1.08,
      duration: 600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
    })
  }

  // ── 지면 (하단 풀밭 간단하게) ────────────────────────────────────────────
  private drawGround(w: number, h: number) {
    const g = this.add.graphics().setDepth(2)
    const gy = h * 0.88
    g.fillStyle(0x4A8C28)
    g.fillRect(0, gy, w, h - gy)
    g.fillStyle(0x5AAB30)
    g.fillRect(0, gy, w, 5)
    g.fillStyle(0x68C038)
    g.fillRect(0, gy, w, 2)
  }

  // ── 타이틀 ──────────────────────────────────────────────────────────────
  private drawTitle(w: number, h: number) {
    // 타이틀 배경 카드
    const g = this.add.graphics().setDepth(5)
    const cy = h * 0.18
    g.fillStyle(0x000000, 0.22)
    g.fillRoundedRect(w/2 - 158, cy - 32, 316, 72, 18)

    this.add.text(w/2, cy + 2, '🎯 Sling God', {
      fontSize: '36px', fontFamily: TDS.font.family,
      color: '#FFFFFF', fontStyle: 'bold',
      stroke: '#1A3A6A', strokeThickness: 5,
    }).setOrigin(0.5).setDepth(6)

    this.add.text(w/2, cy + 32, '새를 맞춰라!', {
      fontSize: '14px', fontFamily: TDS.font.family,
      color: '#D8F0FF',
    }).setOrigin(0.5).setDepth(6)
  }

  // ── 게임 시작 버튼 ───────────────────────────────────────────────────────
  private drawStartButton(w: number, h: number) {
    const btn = createButton({
      scene: this,
      x: w / 2, y: h * 0.80,
      width: 240, height: 58,
      label: '▶  게임 시작',
      onClick: () => {
        GameManager.getInstance().resetForRetry()
        this.cameras.main.fadeOut(250, 0, 0, 0)
        this.cameras.main.once('camerafadeoutcomplete', () => {
          this.menuBirds.forEach(b => b.destroy())
          this.menuBirds = []
          this.scene.start('GameScene')
        })
      },
    })
    btn.setDepth(10)

    // 부유 애니메이션
    this.tweens.add({
      targets: btn, y: h * 0.80 + 6,
      duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
    })
  }

  // ── 반짝임 장식 ──────────────────────────────────────────────────────────
  private drawSparkle(w: number, h: number) {
    const g = this.add.graphics().setDepth(3)
    const pts = [
      { x: w*0.72, y: h*0.25 }, { x: w*0.85, y: h*0.18 },
      { x: w*0.65, y: h*0.35 }, { x: w*0.15, y: h*0.55 },
    ]
    pts.forEach(({ x, y }) => {
      g.fillStyle(0xFFFFFF, 0.85)
      g.fillRect(x - 1, y - 7, 2, 14)
      g.fillRect(x - 7, y - 1, 14, 2)
      g.fillStyle(0xFFFFFF, 0.45)
      g.fillRect(x - 1, y - 5, 2, 10)
      g.fillRect(x - 5, y - 1, 10, 2)
    })
    this.tweens.add({
      targets: g, alpha: 0.3,
      duration: 1200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
    })
  }

  // ── 데코 새 2마리 ────────────────────────────────────────────────────────
  private initBirds(w: number, h: number) {
    this.tweetTimer = 0; this.showTweet = false
    this.menuBirds = []

    const b1 = new Bird(this, w + 60, Phaser.Math.Between(80, Math.floor(h * 0.30)), 80, false)
    b1.setDepth(7)
    this.menuBirds.push(b1)

    const b2 = new Bird(this, -60, Phaser.Math.Between(60, Math.floor(h * 0.28)), 65, true)
    b2.setDepth(7)
    this.menuBirds.push(b2)

    this.bubbleGfx = this.add.graphics().setDepth(8)
    this.tweetTxt  = this.add.text(0, 0, '짹!', {
      fontSize: '12px', fontFamily: TDS.font.family, color: '#191F28', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(9).setVisible(false)
  }

  update(_t: number, delta: number) {
    if (!this.bubbleGfx) return
    const { width, height } = this.scale
    const dt = delta / 1000

    // 새 업데이트 + 화면 벗어나면 리스폰
    for (let i = this.menuBirds.length - 1; i >= 0; i--) {
      const b = this.menuBirds[i]
      b.update(delta)
      if (b.isOutOfBounds()) {
        const goRight = Math.random() < 0.5
        b.destroy()
        const nb = new Bird(this,
          goRight ? -60 : width + 60,
          Phaser.Math.Between(60, Math.floor(height * 0.35)),
          Phaser.Math.Between(60, 100), goRight)
        nb.setDepth(7)
        this.menuBirds[i] = nb
      }
    }

    // 짹짹 말풍선
    this.bubbleGfx.clear()
    this.tweetTimer += dt
    if (this.tweetTimer > 2.8 && !this.showTweet) {
      this.showTweet = true; this.tweetTimer = 0
      const tweets = ['짹!', '짹짹!', '짹~♪', '짹짹짹!']
      this.tweetTxt.setText(tweets[Phaser.Math.Between(0, tweets.length - 1)])
    }
    if (this.showTweet && this.menuBirds[0] && this.tweetTimer < 1.3) {
      const alpha = this.tweetTimer < 0.9 ? 1 : 1 - (this.tweetTimer - 0.9) / 0.4
      const bx = this.menuBirds[0].x, by = this.menuBirds[0].y
      this.bubbleGfx.fillStyle(0xFFFFFF, alpha)
      this.bubbleGfx.fillRoundedRect(bx - 22, by - 36, 44, 20, 6)
      this.bubbleGfx.fillStyle(0xFFFFFF, alpha)
      this.bubbleGfx.fillTriangle(bx - 4, by - 16, bx + 4, by - 16, bx, by - 10)
      this.tweetTxt.setPosition(bx, by - 26).setAlpha(alpha).setVisible(true)
    } else if (this.tweetTimer >= 1.3) {
      this.showTweet = false; this.tweetTxt.setVisible(false)
    }
  }
}
