import Phaser from 'phaser'
import { TDS } from '../constants/TDS'

export class GaugeBar {
  private scene: Phaser.Scene
  private bg!: Phaser.GameObjects.Rectangle
  private bar!: Phaser.GameObjects.Rectangle

  constructor(scene: Phaser.Scene) {
    this.scene = scene
    const { width, height } = scene.scale
    this.bg  = scene.add.rectangle(width / 2, height - 20, width, 40, TDS.color.lightGray).setDepth(10)
    this.bar = scene.add.rectangle(0, height - 20, 0, 36, TDS.color.blue).setOrigin(0, 0.5).setDepth(11)
  }

  setPower(power: number) {
    const { width } = this.scene.scale
    const ratio = Math.max(0, Math.min(power, 100)) / 100
    this.bar.width = ratio * width

    // 파란 → 빨간 interpolate
    const r = Math.round(TDS.rgb.blue.r + (TDS.rgb.danger.r - TDS.rgb.blue.r) * ratio)
    const g = Math.round(TDS.rgb.blue.g + (TDS.rgb.danger.g - TDS.rgb.blue.g) * ratio)
    const b = Math.round(TDS.rgb.blue.b + (TDS.rgb.danger.b - TDS.rgb.blue.b) * ratio)
    this.bar.setFillStyle(Phaser.Display.Color.GetColor(r, g, b))
  }

  destroy() {
    this.bg.destroy()
    this.bar.destroy()
  }
}
