import Phaser from 'phaser'
import { GameManager } from '../utils/GameManager'
import { createButton } from '../ui/Button'
import { TDS } from '../constants/TDS'

export class MainMenuScene extends Phaser.Scene {
  constructor() { super({ key: 'MainMenuScene' }) }

  create() {
    const { width, height } = this.scale

    // ── 배경: 하늘 그라디언트 (위 밝은 파랑 → 아래 연한 하늘) ──
    this.drawSky(width, height)

    // ── 구름 ──
    this.drawClouds(width)

    // ── 나무/풀 (하단 장식) ──
    this.drawGround(width, height)

    // ── 장식 새들 ──
    this.drawDecoBirds(width, height)

    // ── 새총 장식 (타이틀 옆) ──
    this.drawDecoSlingshot(width, height)

    // ── 타이틀 패널 ──
    // 반투명 흰 카드
    const cardY = height * 0.42
    const card = this.add.graphics().setDepth(5)
    card.fillStyle(0xFFFFFF, 0.88)
    card.fillRoundedRect(width / 2 - 155, cardY - 70, 310, 150, 20)

    this.add.text(width / 2, cardY - 32, '새총의 신', {
      fontSize: '46px',
      fontFamily: TDS.font.family,
      color: TDS.color.css.dark,
      fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(6)

    this.add.text(width / 2, cardY + 22, '날아가는 새를 맞혀라!', {
      fontSize: '16px',
      fontFamily: TDS.font.family,
      color: TDS.color.css.gray,
    }).setOrigin(0.5).setDepth(6)

    // ── 최고 기록 ──
    const gm = GameManager.getInstance()
    if (gm.bestLevel > 1) {
      const badgeG = this.add.graphics().setDepth(6)
      badgeG.fillStyle(TDS.color.warning, 0.15)
      badgeG.fillRoundedRect(width / 2 - 90, height * 0.575, 180, 36, 10)
      this.add.text(width / 2, height * 0.593, `🏆  최고 기록  Lv.${gm.bestLevel}`, {
        fontSize: '15px',
        fontFamily: TDS.font.family,
        color: TDS.color.css.warning,
        fontStyle: 'bold',
      }).setOrigin(0.5).setDepth(7)
    }

    // ── 게임 시작 버튼 ──
    const btnY = gm.bestLevel > 1 ? height * 0.72 : height * 0.68
    const btn = createButton({
      scene: this,
      x: width / 2,
      y: btnY,
      width: 300,
      height: 58,
      label: '게임 시작',
      variant: 'primary',
      onClick: () => {
        GameManager.getInstance().fullReset()
        this.scene.start('GameScene')
      },
    }).setDepth(8)

    // 버튼 pulse 애니메이션
    this.tweens.add({
      targets: btn,
      scaleX: 1.03, scaleY: 1.03,
      duration: 900,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    })

    // ── 조작 힌트 ──
    this.add.text(width / 2, height * 0.84, '✦  드래그로 조준  →  손 떼면 발사  ✦', {
      fontSize: '13px',
      fontFamily: TDS.font.family,
      color: '#7CB3E0',
    }).setOrigin(0.5).setDepth(6)

    // ── 입장 애니메이션 ──
    this.cameras.main.fadeIn(400, 249, 250, 251)
  }

  // ── 하늘 그라디언트 ────────────────────────────
  private drawSky(width: number, height: number) {
    const g = this.add.graphics().setDepth(0)
    // 위쪽: 밝은 파랑
    for (let y = 0; y < height * 0.75; y += 2) {
      const t = y / (height * 0.75)
      const r = Math.round(135 + (200 - 135) * t)
      const gv = Math.round(195 + (230 - 195) * t)
      const b  = Math.round(235 + (255 - 235) * t)
      g.fillStyle(Phaser.Display.Color.GetColor(r, gv, b))
      g.fillRect(0, y, width, 2)
    }
    // 아래쪽: 연한 초록빛 (지평선)
    g.fillStyle(0xD4EDDA)
    g.fillRect(0, height * 0.75, width, height * 0.25)
  }

  // ── 구름 ───────────────────────────────────────
  private drawClouds(width: number) {
    const clouds = [
      { x: width * 0.18, y: 80,  s: 1.0 },
      { x: width * 0.72, y: 55,  s: 0.8 },
      { x: width * 0.45, y: 110, s: 0.65 },
      { x: width * 0.88, y: 140, s: 0.55 },
    ]
    clouds.forEach(c => {
      const g = this.add.graphics().setDepth(1).setAlpha(0.9)
      this.drawCloud(g, c.x, c.y, c.s)
      // 구름 천천히 흐르기
      this.tweens.add({
        targets: g,
        x: `-=${30 * c.s}`,
        duration: 12000 + c.s * 4000,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      })
    })
  }

  private drawCloud(g: Phaser.GameObjects.Graphics, x: number, y: number, scale: number) {
    const s = scale * 28
    g.fillStyle(0xFFFFFF, 0.92)
    g.fillCircle(x,        y,      s)
    g.fillCircle(x + s,    y - 6,  s * 0.85)
    g.fillCircle(x - s,    y - 4,  s * 0.75)
    g.fillCircle(x + s*1.8, y + 2, s * 0.65)
    g.fillRect(x - s * 1.3, y, s * 3.2, s * 0.9)
  }

  // ── 지면/나무 ──────────────────────────────────
  private drawGround(width: number, height: number) {
    const g = this.add.graphics().setDepth(2)

    // 초록 언덕
    g.fillStyle(0x5AB552)
    g.fillEllipse(width * 0.15, height * 0.82, 220, 80)
    g.fillEllipse(width * 0.85, height * 0.80, 180, 70)

    // 나무 왼쪽
    this.drawTree(g, width * 0.08, height * 0.76, 0.9)
    this.drawTree(g, width * 0.22, height * 0.79, 0.7)

    // 나무 오른쪽
    this.drawTree(g, width * 0.82, height * 0.75, 1.0)
    this.drawTree(g, width * 0.94, height * 0.78, 0.75)
  }

  private drawTree(g: Phaser.GameObjects.Graphics, x: number, y: number, scale: number) {
    const h = 55 * scale
    const r = 26 * scale
    // 기둥
    g.fillStyle(0x7A4F28)
    g.fillRect(x - 5 * scale, y - h * 0.5, 10 * scale, h * 0.65)
    // 잎
    g.fillStyle(0x2D8A2D)
    g.fillTriangle(x, y - h, x - r, y - h * 0.35, x + r, y - h * 0.35)
    g.fillStyle(0x3AA03A)
    g.fillTriangle(x, y - h * 1.15, x - r * 0.75, y - h * 0.6, x + r * 0.75, y - h * 0.6)
  }

  // ── 장식 새들 ──────────────────────────────────
  private drawDecoBirds(width: number, height: number) {
    // 하늘을 나는 작은 새 실루엣들
    const birds = [
      { x: width * 0.3,  y: height * 0.14, s: 1.0 },
      { x: width * 0.45, y: height * 0.10, s: 0.75 },
      { x: width * 0.58, y: height * 0.16, s: 0.85 },
    ]
    birds.forEach((b, idx) => {
      const g = this.add.graphics().setDepth(2).setAlpha(0.7)
      this.drawBirdSilhouette(g, b.x, b.y, b.s)
      // 살짝 위아래 흔들기
      this.tweens.add({
        targets: g,
        y: `+=${6 * b.s}`,
        x: `-=${10 * b.s}`,
        duration: 2000 + idx * 400,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      })
    })
  }

  private drawBirdSilhouette(g: Phaser.GameObjects.Graphics, x: number, y: number, scale: number) {
    const s = scale * 10
    g.fillStyle(0x333333)
    // 몸통
    g.fillEllipse(x, y, s * 2.2, s * 1.2)
    // 왼쪽 날개
    g.fillEllipse(x - s * 1.4, y - s * 0.3, s * 1.8, s * 0.7)
    // 오른쪽 날개
    g.fillEllipse(x + s * 1.4, y - s * 0.3, s * 1.8, s * 0.7)
  }

  // ── 새총 장식 ──────────────────────────────────
  private drawDecoSlingshot(width: number, height: number) {
    const g = this.add.graphics().setDepth(3)
    const sx = width * 0.5
    const sy = height * 0.28

    // 손잡이
    g.fillStyle(0x7A4F28)
    g.fillRect(sx - 4, sy, 8, 48)
    // 갈래
    g.fillStyle(0x5C3D1E)
    g.fillRect(sx - 18, sy - 28, 8, 34)
    g.fillRect(sx + 10, sy - 28, 8, 34)
    // 고무줄
    g.lineStyle(2.5, 0x444444, 0.7)
    g.beginPath(); g.moveTo(sx - 14, sy - 28); g.lineTo(sx, sy - 18); g.strokePath()
    g.beginPath(); g.moveTo(sx + 14, sy - 28); g.lineTo(sx, sy - 18); g.strokePath()
    // 돌멩이
    g.fillStyle(TDS.color.warning)
    g.fillCircle(sx, sy - 18, 7)
  }
}
