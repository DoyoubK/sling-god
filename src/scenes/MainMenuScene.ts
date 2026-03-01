import Phaser from 'phaser'
import { GameManager } from '../utils/GameManager'
import { createButton } from '../ui/Button'
import { TDS } from '../constants/TDS'

export class MainMenuScene extends Phaser.Scene {
  constructor() { super({ key: 'MainMenuScene' }) }

  // ── 이미지 미리 로드 ────────────────────────────
  preload() {
    this.load.image('sling_god', 'assets/sling_god.png')
  }

  create() {
    const { width, height } = this.scale

    // ── 배경 ──
    this.drawSky(width, height)
    this.drawClouds(width)
    this.drawGround(width, height)

    // ── sling_god 이미지 (중앙 상단) ──
    const imgSize = width * 0.52   // 화면 폭의 52%
    const imgY    = height * 0.28
    const logo = this.add.image(width / 2, imgY, 'sling_god')
      .setDisplaySize(imgSize, imgSize)
      .setDepth(4)

    // float 애니메이션 (위아래 부드럽게)
    this.tweens.add({
      targets: logo,
      y: imgY + 10,
      duration: 1800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    })

    // ── 타이틀 카드 ──
    const cardY = height * 0.575
    const card  = this.add.graphics().setDepth(5)
    card.fillStyle(0xFFFFFF, 0.88)
    card.fillRoundedRect(width / 2 - 155, cardY - 42, 310, 86, 18)

    this.add.text(width / 2, cardY - 14, '새총의 신', {
      fontSize: '40px', fontFamily: TDS.font.family,
      color: TDS.color.css.dark, fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(6)

    this.add.text(width / 2, cardY + 30, '날아가는 새를 맞혀라!', {
      fontSize: '15px', fontFamily: TDS.font.family,
      color: TDS.color.css.gray,
    }).setOrigin(0.5).setDepth(6)

    // ── 최고 기록 ──
    const gm = GameManager.getInstance()
    if (gm.bestLevel > 1) {
      const badgeG = this.add.graphics().setDepth(6)
      badgeG.fillStyle(TDS.color.warning, 0.15)
      badgeG.fillRoundedRect(width / 2 - 90, height * 0.682, 180, 34, 10)
      this.add.text(width / 2, height * 0.699, `🏆  최고 기록  Lv.${gm.bestLevel}`, {
        fontSize: '14px', fontFamily: TDS.font.family,
        color: TDS.color.css.warning, fontStyle: 'bold',
      }).setOrigin(0.5).setDepth(7)
    }

    // ── 게임 시작 버튼 ──
    const btnY = gm.bestLevel > 1 ? height * 0.79 : height * 0.75
    const btn  = createButton({
      scene: this, x: width / 2, y: btnY,
      width: 300, height: 58,
      label: '게임 시작', variant: 'primary',
      onClick: () => { GameManager.getInstance().fullReset(); this.scene.start('GameScene') },
    }).setDepth(8)

    this.tweens.add({
      targets: btn, scaleX: 1.03, scaleY: 1.03,
      duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
    })

    // ── 조작 힌트 ──
    this.add.text(width / 2, height * 0.895, '✦  드래그로 조준  →  손 떼면 발사  ✦', {
      fontSize: '12px', fontFamily: TDS.font.family, color: '#7CB3E0',
    }).setOrigin(0.5).setDepth(6)

    // ── 날아다니는 새 + 짹짹 ──
    this.spawnFlyingBird(width, height)

    // ── 페이드인 ──
    this.cameras.main.fadeIn(400, 249, 250, 251)
  }

  // ── 새 한 마리 날아다니기 ──────────────────────
  private spawnFlyingBird(width: number, height: number) {
    // 새 컨테이너
    const container = this.add.container(width + 60, height * 0.18).setDepth(9)

    // 몸통
    const body = this.add.graphics()
    body.fillStyle(0x8B6914)
    body.fillCircle(0, 0, 13)
    // 부리
    body.fillStyle(0xF59E0B)
    body.fillTriangle(-14, -2, -22, -2, -14, 6)
    // 눈
    body.fillStyle(0x191F28)
    body.fillCircle(-5, -4, 3)
    body.fillStyle(0xFFFFFF)
    body.fillCircle(-4, -5, 1.2)
    // 꼬리
    body.fillStyle(0x6B4C0A)
    body.fillTriangle(12, -2, 22, -8, 12, 6)

    // 날개 (Graphics, 매 프레임 업데이트)
    const wing = this.add.graphics()

    container.add([body, wing])

    // 말풍선 + 짹짹 텍스트
    const bubble = this.add.graphics().setDepth(10)
    const tweet  = this.add.text(0, 0, '짹!', {
      fontSize: '13px', fontFamily: TDS.font.family,
      color: TDS.color.css.dark, fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(10)

    // 날개짓 타이머
    let wingAngle = 0
    const wingTimer = this.time.addEvent({
      delay: 16,
      loop: true,
      callback: () => {
        wingAngle += 0.22
        wing.clear()
        const dy = Math.sin(wingAngle) * 7
        // 위 날개
        wing.fillStyle(0x6B4C0A)
        wing.fillEllipse(-2, -dy - 6, 22, 9)
        // 아래 날개 (접혀있음)
        wing.fillStyle(0x8B6914)
        wing.fillEllipse(-2, dy + 6, 18, 7)

        // 말풍선 위치 (새 위)
        const cx = container.x
        const cy = container.y
        bubble.clear()
        bubble.fillStyle(0xFFFFFF, 0.92)
        bubble.fillRoundedRect(cx - 22, cy - 44, 44, 26, 8)
        bubble.fillStyle(0xFFFFFF, 0.92)
        bubble.fillTriangle(cx - 6, cy - 18, cx + 6, cy - 18, cx, cy - 10)
        tweet.setPosition(cx, cy - 31)
      },
    })

    // 왼쪽으로 날아가는 tween
    const flyAcross = () => {
      container.setPosition(width + 60, Phaser.Math.Between(
        Math.floor(height * 0.12),
        Math.floor(height * 0.32)
      ))

      // 짹짹 랜덤하게
      const tweets = ['짹!', '짹짹!', '짹~', '짹짹짹!']
      tweet.setText(tweets[Phaser.Math.Between(0, tweets.length - 1)])

      this.tweens.add({
        targets: container,
        x: -80,
        duration: Phaser.Math.Between(4500, 6500),
        ease: 'Linear',
        onUpdate: () => {
          // 살짝 위아래 흔들며 비행
          container.y += Math.sin(wingAngle * 0.4) * 0.6
        },
        onComplete: () => {
          // 잠깐 쉬었다 다시 날아옴
          this.time.delayedCall(Phaser.Math.Between(1200, 2800), flyAcross)
        },
      })
    }

    flyAcross()

    // 씬 종료 시 정리
    this.events.once('shutdown', () => {
      wingTimer.remove()
      bubble.destroy()
      tweet.destroy()
    })
  }

  // ── 하늘 그라디언트 ────────────────────────────
  private drawSky(width: number, height: number) {
    const g = this.add.graphics().setDepth(0)
    for (let y = 0; y < height * 0.75; y += 2) {
      const t  = y / (height * 0.75)
      const r  = Math.round(135 + (200 - 135) * t)
      const gv = Math.round(195 + (230 - 195) * t)
      const b  = Math.round(235 + (255 - 235) * t)
      g.fillStyle(Phaser.Display.Color.GetColor(r, gv, b))
      g.fillRect(0, y, width, 2)
    }
    g.fillStyle(0xD4EDDA)
    g.fillRect(0, height * 0.75, width, height * 0.25)
  }

  // ── 구름 ───────────────────────────────────────
  private drawClouds(width: number) {
    const clouds = [
      { x: width * 0.18, y: 80,  s: 1.0 },
      { x: width * 0.72, y: 55,  s: 0.8 },
      { x: width * 0.45, y: 115, s: 0.6 },
      { x: width * 0.88, y: 145, s: 0.55 },
    ]
    clouds.forEach(c => {
      const g = this.add.graphics().setDepth(1).setAlpha(0.88)
      this.drawCloud(g, c.x, c.y, c.s)
      this.tweens.add({
        targets: g, x: `-=${28 * c.s}`,
        duration: 12000 + c.s * 4000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
      })
    })
  }

  private drawCloud(g: Phaser.GameObjects.Graphics, x: number, y: number, scale: number) {
    const s = scale * 28
    g.fillStyle(0xFFFFFF, 0.92)
    g.fillCircle(x,          y,      s)
    g.fillCircle(x + s,      y - 6,  s * 0.85)
    g.fillCircle(x - s,      y - 4,  s * 0.75)
    g.fillCircle(x + s * 1.8, y + 2, s * 0.65)
    g.fillRect(x - s * 1.3,  y,      s * 3.2, s * 0.9)
  }

  // ── 지면/나무 ──────────────────────────────────
  private drawGround(width: number, height: number) {
    const g = this.add.graphics().setDepth(2)
    g.fillStyle(0x5AB552)
    g.fillEllipse(width * 0.15, height * 0.82, 220, 80)
    g.fillEllipse(width * 0.85, height * 0.80, 180, 70)
    this.drawTree(g, width * 0.08,  height * 0.76, 0.9)
    this.drawTree(g, width * 0.22,  height * 0.79, 0.7)
    this.drawTree(g, width * 0.82,  height * 0.75, 1.0)
    this.drawTree(g, width * 0.94,  height * 0.78, 0.75)
  }

  private drawTree(g: Phaser.GameObjects.Graphics, x: number, y: number, scale: number) {
    const h = 55 * scale, r = 26 * scale
    g.fillStyle(0x7A4F28)
    g.fillRect(x - 5 * scale, y - h * 0.5, 10 * scale, h * 0.65)
    g.fillStyle(0x2D8A2D)
    g.fillTriangle(x, y - h, x - r, y - h * 0.35, x + r, y - h * 0.35)
    g.fillStyle(0x3AA03A)
    g.fillTriangle(x, y - h * 1.15, x - r * 0.75, y - h * 0.6, x + r * 0.75, y - h * 0.6)
  }
}
