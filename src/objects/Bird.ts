import Phaser from 'phaser'

export type BirdPattern = 'straight' | 'zigzag' | 'dive' | 'accelerate'

export class Bird extends Phaser.GameObjects.Arc {
  private pattern: BirdPattern
  private speed: number
  private zigzagTimer: number = 0
  private zigzagDir: number = 1
  vx: number = 0
  vy: number = 0

  constructor(scene: Phaser.Scene, x: number, y: number, speed: number) {
    super(scene, x, y, 18, 0, 360, false, 0x4CAF50)
    scene.add.existing(this)

    this.speed = speed
    const patterns: BirdPattern[] = ['straight', 'zigzag', 'dive', 'accelerate']
    this.pattern = patterns[Phaser.Math.Between(0, patterns.length - 1)]

    switch (this.pattern) {
      case 'straight':
        this.vx = -speed; this.vy = 0; break
      case 'zigzag':
        this.vx = -speed * 0.8; this.vy = 0; break
      case 'dive':
        this.vx = -speed * 0.9; this.vy = speed * 0.3; break
      case 'accelerate':
        this.vx = -speed * 0.6; this.vy = 0; break
    }
  }

  update(delta: number) {
    const dt = delta / 1000

    if (this.pattern === 'zigzag') {
      this.zigzagTimer += dt
      if (this.zigzagTimer > 0.5) {
        this.zigzagDir *= -1
        this.zigzagTimer = 0
      }
      this.vy = this.zigzagDir * 80
    } else if (this.pattern === 'accelerate') {
      this.vx -= 20 * dt
    }

    this.x += this.vx * dt
    this.y += this.vy * dt
  }

  isOutOfBounds(): boolean {
    return this.x < -50 || this.y < -50 || this.y > this.scene.scale.height + 50
  }
}
