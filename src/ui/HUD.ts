import Phaser from 'phaser'
import { TDS } from '../constants/TDS'
import { GameManager } from '../utils/GameManager'

export class HUD {
  private scene: Phaser.Scene
  private bg!: Phaser.GameObjects.Rectangle
  private levelText!: Phaser.GameObjects.Text
  private scoreText!: Phaser.GameObjects.Text
  private missIcons: Phaser.GameObjects.Text[] = []

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
      const icon = this.scene.add.text(
        width - 30 - i * 30, 20,
        i < currentMisses ? '✕' : '❤️',
        { fontSize: '18px' }
      ).setDepth(11)
      this.missIcons.push(icon)
    }
  }

  destroy() {
    this.bg.destroy()
    this.levelText.destroy()
    this.scoreText.destroy()
    this.missIcons.forEach(i => i.destroy())
    this.missIcons = []
  }
}
