import Phaser from 'phaser'

export class Projectile extends Phaser.GameObjects.Graphics {
  vx: number
  vy: number
  private trail: { x: number; y: number }[] = []
  private spinAngle = 0

  constructor(scene: Phaser.Scene, x: number, y: number, vx: number, vy: number) {
    super(scene, { x, y })
    scene.add.existing(this)
    this.vx = vx
    this.vy = vy
    this.setDepth(15)
    this.drawBall()
  }

  private drawBall() {
    this.clear()
    const R = 10

    // ── 모션 블러 잔상 ─────────────────────────────────────────
    for (let i = 0; i < this.trail.length; i++) {
      const t  = i / this.trail.length
      const tx = this.trail[i].x - this.x
      const ty = this.trail[i].y - this.y

      // 잔상 크기: 앞쪽 클수록 작아짐 (모션블러 느낌)
      const tr = R * (0.3 + t * 0.65)
      const ta = t * 0.25

      // 흙먼지 색 잔상
      this.fillStyle(0x9A8060, ta)
      this.fillCircle(tx, ty, tr)

      // 공기 저항 흰 잔상 (뒤쪽에만)
      if (t > 0.6) {
        this.fillStyle(0xDDDDDD, ta * 0.5)
        this.fillCircle(tx + (Math.random() - 0.5) * 4, ty - 2, tr * 0.6)
      }
    }

    // ── 돌멩이 본체 (스핀 회전 반영) ────────────────────────────
    const cos = Math.cos(this.spinAngle)
    const sin = Math.sin(this.spinAngle)

    // 외곽 그림자
    this.fillStyle(0x111010, 0.4)
    this.fillCircle(1.5, 2, R + 1.5)

    // 돌 기본 — 어두운 청회색
    this.fillStyle(0x545460)
    this.fillCircle(0, 0, R)

    // 돌 미드톤
    this.fillStyle(0x6E6E7C)
    this.fillCircle(-0.5, -0.5, R - 1.5)

    // 표면 무늬 (스핀에 따라 회전)
    const spots = [
      { ox: 3.5,  oy: 1.5,  r: 2.2, c: 0x3E3E48 },
      { ox: -3,   oy: 2,    r: 1.8, c: 0x404048 },
      { ox: 1,    oy: -3.5, r: 1.6, c: 0x3A3A44 },
      { ox: -1.5, oy: 3,    r: 1.3, c: 0x424250 },
      { ox: 4,    oy: -2,   r: 1.1, c: 0x38384A },
    ]
    spots.forEach(({ ox, oy, r, c }) => {
      const rx = ox * cos - oy * sin
      const ry = ox * sin + oy * cos
      this.fillStyle(c, 0.75)
      this.fillCircle(rx, ry, r)
    })

    // 광택 면 (스핀 반영)
    const lx = -3.5 * cos - (-3.5) * sin
    const ly = -3.5 * sin + (-3.5) * cos
    this.fillStyle(0x9898A8, 0.9)
    this.fillCircle(lx, ly, 4)
    this.fillStyle(0xBBBBC8, 0.75)
    this.fillCircle(lx - 0.8, ly - 0.8, 2.5)
    this.fillStyle(0xE8E8F0, 0.85)
    this.fillCircle(lx - 1.5, ly - 1.5, 1.4)
  }

  update(delta: number) {
    const dt = delta / 1000

    this.trail.push({ x: this.x, y: this.y })
    if (this.trail.length > 9) this.trail.shift()

    this.vy += 320 * dt
    this.x  += this.vx * dt
    this.y  += this.vy * dt

    // 속도에 비례한 스핀 (자연스러운 돌 회전)
    const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy)
    this.spinAngle += dt * (speed * 0.012)

    this.drawBall()
  }

  isOutOfBounds(): boolean {
    const { width, height } = this.scene.scale
    return this.y < -100 || this.x < -100 || this.x > width + 100 || this.y > height + 100
  }
}
