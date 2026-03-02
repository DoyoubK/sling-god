import Phaser from 'phaser'

export class Projectile extends Phaser.GameObjects.Graphics {
  vx: number
  vy: number
  private trail: { x: number; y: number }[] = []

  constructor(scene: Phaser.Scene, x: number, y: number, vx: number, vy: number) {
    super(scene, { x, y })
    scene.add.existing(this)
    this.vx = vx
    this.vy = vy
    this.setDepth(6)
    this.drawBall()
  }

  private drawBall() {
    this.clear()
    // 궤적 잔상
    for (let i = 0; i < this.trail.length; i++) {
      const alpha = (i / this.trail.length) * 0.3
      const r = 4 + (i / this.trail.length) * 4
      this.fillStyle(0xF59E0B, alpha)
      this.fillCircle(this.trail[i].x - this.x, this.trail[i].y - this.y, r)
    }
    // 본체
    this.fillStyle(0xF59E0B, 1)
    this.fillCircle(0, 0, 10)
    this.fillStyle(0xFFFFFF, 0.4)
    this.fillCircle(-3, -3, 4)
  }

  update(delta: number) {
    const dt = delta / 1000
    this.trail.push({ x: this.x, y: this.y })
    if (this.trail.length > 6) this.trail.shift()

    this.vy += 320 * dt  // 중력
    this.x  += this.vx * dt
    this.y  += this.vy * dt
    this.drawBall()
  }

  isOutOfBounds(): boolean {
    const { width, height } = this.scene.scale
    return this.y < -100 || this.x < -100 || this.x > width + 100 || this.y > height + 100
  }
}
