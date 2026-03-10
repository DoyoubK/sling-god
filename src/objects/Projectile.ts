import Phaser from 'phaser'

// 돌 이미지 원본 크기 기준 표시 직경 (px)
const STONE_DISPLAY_DIAMETER = 36
const STONE_IMG_SIZE = 1536  // stone.png 높이 기준

export class Projectile extends Phaser.GameObjects.Container {
  vx: number
  vy: number
  private trail: { x: number; y: number }[] = []
  private spinAngle = 0
  private trailGfx: Phaser.GameObjects.Graphics
  private stoneImg: Phaser.GameObjects.Image

  constructor(scene: Phaser.Scene, x: number, y: number, vx: number, vy: number) {
    super(scene, x, y)
    scene.add.existing(this)
    this.vx = vx
    this.vy = vy
    this.setDepth(15)

    // 잔상용 Graphics (돌 뒤에 그려짐)
    this.trailGfx = scene.add.graphics().setDepth(14)

    // 돌 이미지
    const scale = STONE_DISPLAY_DIAMETER / STONE_IMG_SIZE
    this.stoneImg = scene.add.image(x, y, 'stone')
      .setScale(scale)
      .setDepth(15)
      .setOrigin(0.5, 0.5)
  }

  update(delta: number) {
    const dt = delta / 1000

    this.trail.push({ x: this.x, y: this.y })
    if (this.trail.length > 9) this.trail.shift()

    this.vy += 320 * dt
    this.x  += this.vx * dt
    this.y  += this.vy * dt

    // 속도에 비례한 스핀
    const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy)
    this.spinAngle += dt * (speed * 0.012)

    // 돌 이미지 위치 + 회전 업데이트
    this.stoneImg.setPosition(this.x, this.y)
    this.stoneImg.setRotation(this.spinAngle)

    // 잔상 그리기
    const R = STONE_DISPLAY_DIAMETER / 2
    this.trailGfx.clear()
    for (let i = 0; i < this.trail.length; i++) {
      const t  = i / this.trail.length
      const tr = R * (0.3 + t * 0.65)
      const ta = t * 0.18
      this.trailGfx.fillStyle(0x9A8060, ta)
      this.trailGfx.fillCircle(this.trail[i].x, this.trail[i].y, tr)
    }
  }

  isOutOfBounds(): boolean {
    const { width, height } = this.scene.scale
    return this.y < -100 || this.x < -100 || this.x > width + 100 || this.y > height + 100
  }

  destroy(fromScene?: boolean) {
    this.trailGfx.destroy()
    this.stoneImg.destroy()
    super.destroy(fromScene)
  }
}
