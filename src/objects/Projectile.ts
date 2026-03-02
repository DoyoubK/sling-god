import Phaser from 'phaser'

export class Projectile extends Phaser.GameObjects.Graphics {
  vx: number
  vy: number
  private trail: { x: number; y: number; vx: number; vy: number }[] = []

  constructor(scene: Phaser.Scene, x: number, y: number, vx: number, vy: number) {
    super(scene, { x, y })
    scene.add.existing(this)
    this.vx = vx
    this.vy = vy
    this.setDepth(15)  // 나무(7), 새(10) 위
    this.drawBall()
  }

  private drawBall() {
    this.clear()

    // ── 잔상 궤적 (먼지 + 연기) ──────────────────────────────
    for (let i = 0; i < this.trail.length; i++) {
      const t     = i / this.trail.length
      const tx    = this.trail[i].x - this.x
      const ty    = this.trail[i].y - this.y
      const alpha = t * 0.35
      const r     = 3 + t * 5

      // 먼지 입자
      this.fillStyle(0xB0956A, alpha)
      this.fillCircle(tx + (i%3 - 1)*3, ty - 2, r * 0.7)
      this.fillStyle(0xD4B896, alpha * 0.6)
      this.fillCircle(tx - (i%2)*4,     ty + 1, r * 0.5)

      // 연기 (옅은 흰)
      if (i > this.trail.length * 0.5) {
        this.fillStyle(0xEEEEEE, alpha * 0.4)
        this.fillCircle(tx, ty, r * 0.9)
      }
    }

    // ── 돌멩이 본체 ──────────────────────────────────────────
    const R = 10

    // 외곽 그림자 (아래쪽)
    this.fillStyle(0x1A1410, 0.45)
    this.fillCircle(1, 2, R + 1)

    // 돌 기본색 (어두운 청회색)
    this.fillStyle(0x5A5A60)
    this.fillCircle(0, 0, R)

    // 돌 미드톤
    this.fillStyle(0x747480)
    this.fillCircle(-1, -1, R - 2)

    // 돌 표면 무늬 (불규칙 어두운 반점)
    this.fillStyle(0x42424A, 0.7)
    this.fillCircle(3,  2,  2.5)
    this.fillCircle(-3, 1,  2)
    this.fillCircle(1, -3,  1.8)
    this.fillStyle(0x35353D, 0.5)
    this.fillCircle(-1, 3,  1.5)
    this.fillCircle(4, -1,  1.2)

    // 돌 밝은 면 (상단 왼쪽 광택)
    this.fillStyle(0xA0A0AC, 0.9)
    this.fillCircle(-3, -3, 4.5)
    this.fillStyle(0xC4C4CC, 0.7)
    this.fillCircle(-4, -4, 2.8)

    // 포인트 하이라이트
    this.fillStyle(0xEEEEF5, 0.85)
    this.fillCircle(-5, -5, 1.8)
  }

  update(delta: number) {
    const dt = delta / 1000
    this.trail.push({ x: this.x, y: this.y, vx: this.vx, vy: this.vy })
    if (this.trail.length > 8) this.trail.shift()

    this.vy += 320 * dt
    this.x  += this.vx * dt
    this.y  += this.vy * dt

    // 날아가는 방향으로 약간 회전
    const angle = Math.atan2(this.vy, this.vx)
    this.setRotation(angle * 0.3)

    this.drawBall()
  }

  isOutOfBounds(): boolean {
    const { width, height } = this.scene.scale
    return this.y < -100 || this.x < -100 || this.x > width + 100 || this.y > height + 100
  }
}
