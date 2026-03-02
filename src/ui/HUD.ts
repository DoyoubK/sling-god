import Phaser from 'phaser'
import { TDS } from '../constants/TDS'
import { GameManager } from '../utils/GameManager'

export class HUD {
  private scene: Phaser.Scene
  private bg!: Phaser.GameObjects.Rectangle
  private levelText!: Phaser.GameObjects.Text
  private scoreText!: Phaser.GameObjects.Text
  private missIcons: Phaser.GameObjects.GameObject[] = []

  constructor(scene: Phaser.Scene) {
    this.scene = scene
    const { width } = scene.scale

    this.bg = scene.add.rectangle(width / 2, 40, width, 80, TDS.color.white).setDepth(10)

    this.levelText = scene.add.text(20, 20, '', {
      fontSize: '18px', fontFamily: TDS.font.family,
      color: TDS.color.css.dark, fontStyle: 'bold',
    }).setDepth(11)

    this.scoreText = scene.add.text(width / 2, 20, '', {
      fontSize: '18px', fontFamily: TDS.font.family,
      color: TDS.color.css.blue, fontStyle: 'bold',
    }).setOrigin(0.5, 0).setDepth(11)
  }

  update(level: number, hits: number, target: number, misses: number) {
    this.levelText.setText(`Lv. ${level}`)
    this.scoreText.setText(`${hits} / ${target}`)
    this.refreshMissIcons(misses)
  }

  private refreshMissIcons(currentMisses: number) {
    const { width } = this.scene.scale
    this.missIcons.forEach(i => i.destroy())
    this.missIcons = []
    for (let i = 0; i < GameManager.MAX_MISSES; i++) {
      const x = width - 22 - i * 28
      const y = 38
      const broken = i < currentMisses
      const g = this.scene.add.graphics().setDepth(11)
      this.drawHeart(g, x, y, broken)
      this.missIcons.push(g)
    }
  }

  private drawHeart(g: Phaser.GameObjects.Graphics, cx: number, cy: number, broken: boolean) {
    const s = 9
    if (broken) {
      // 잃은 하트: 회색 테두리만
      g.lineStyle(1.5, 0xAAAAAA, 0.6)
      g.fillStyle(0xDDDDDD, 0.25)
    } else {
      // 남은 하트: 선명한 빨간 하트
      g.fillStyle(0xFF1744, 1)
    }
    // 하트 경로: 두 원 + 삼각형 조합
    g.fillCircle(cx - s*0.28, cy - s*0.05, s*0.38)
    g.fillCircle(cx + s*0.28, cy - s*0.05, s*0.38)
    // 하단 삼각형 (하트 뾰족한 부분)
    g.fillTriangle(
      cx - s*0.65, cy - s*0.05,
      cx + s*0.65, cy - s*0.05,
      cx,          cy + s*0.55
    )
    if (!broken) {
      // 하이라이트
      g.fillStyle(0xFF6B8A, 0.7)
      g.fillCircle(cx - s*0.18, cy - s*0.18, s*0.18)
    }
    if (broken) {
      g.strokeCircle(cx - s*0.28, cy - s*0.05, s*0.38)
      g.strokeCircle(cx + s*0.28, cy - s*0.05, s*0.38)
      g.strokeTriangle(
        cx - s*0.65, cy - s*0.05,
        cx + s*0.65, cy - s*0.05,
        cx,          cy + s*0.55
      )
    }
  }

  destroy() {
    this.bg.destroy()
    this.levelText.destroy()
    this.scoreText.destroy()
    this.missIcons.forEach(i => (i as Phaser.GameObjects.Graphics).destroy())
    this.missIcons = []
  }
}
