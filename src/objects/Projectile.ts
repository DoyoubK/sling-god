import Phaser from 'phaser'

export class Projectile extends Phaser.GameObjects.Arc {
  vx: number
  vy: number

  constructor(scene: Phaser.Scene, x: number, y: number, power: number) {
    super(scene, x, y, 10, 0, 360, false, 0xF59E0B)
    scene.add.existing(this)

    // 파워에 따라 위쪽으로 발사 (세로형 게임)
    const speed = 400 + power * 4
    this.vx = (Math.random() - 0.5) * 100
    this.vy = -speed
  }

  update(delta: number) {
    const dt = delta / 1000
    this.vy += 300 * dt // 중력
    this.x += this.vx * dt
    this.y += this.vy * dt
  }

  isOutOfBounds(): boolean {
    return this.y < -50 || this.x < -50 || this.x > this.scene.scale.width + 50
  }
}
