import Phaser from 'phaser'
import { TDS } from '../constants/TDS'
import { GameManager } from '../utils/GameManager'

export class HUD {
  private scene: Phaser.Scene
  private bg!: Phaser.GameObjects.Rectangle
  private levelText!: Phaser.GameObjects.Text
  private scoreText!: Phaser.GameObjects.Text
  private missIcons: Phaser.GameObjects.Image[] = []

  constructor(scene: Phaser.Scene) {
    this.scene = scene
    const { width } = scene.scale

    // 배경: 게임 하늘 색과 어울리는 반투명 다크 네이비
    this.bg = scene.add.rectangle(width / 2, 40, width, 80, 0x0A1C32)
      .setAlpha(0.72)
      .setDepth(10)

    // 하단 경계선 (미묘한 하이라이트)
    scene.add.rectangle(width / 2, 80, width, 1.5, 0x3182F6)
      .setAlpha(0.35)
      .setDepth(10)

    this.levelText = scene.add.text(20, 20, '', {
      fontSize: '22px', fontFamily: TDS.font.family,
      color: '#FFFFFF', fontStyle: 'bold',
    }).setDepth(11)

    this.scoreText = scene.add.text(width / 2, 20, '', {
      fontSize: '22px', fontFamily: TDS.font.family,
      color: '#7EC8FF', fontStyle: 'bold',
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

    const SIZE = 32 * 1.6 * 1.2    // 표시 크기 (px, 1.2배 적용)
    const IMG_W = 2816       // heart.png 원본 너비
    const scale = SIZE / IMG_W

    for (let i = 0; i < GameManager.MAX_MISSES; i++) {
      const x = width - 20 - i * (SIZE / 2 + 4)
      const y = 38
      const broken = i < currentMisses

      const img = this.scene.add.image(x, y, 'heart')
        .setScale(scale)
        .setOrigin(0.5, 0.5)
        .setDepth(11)

      if (broken) {
        // 흑백: 채도 제거 + 반투명
        img.setTint(0x888888)
        img.setAlpha(0.45)
      }

      this.missIcons.push(img)
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
