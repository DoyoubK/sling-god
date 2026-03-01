import Phaser from 'phaser'

export type BirdPattern = 'straight' | 'zigzag' | 'dive' | 'accelerate'
export type BirdType = 'sparrow' | 'eagle' | 'pigeon' | 'parrot' | 'owl'

interface BirdConfig {
  bodyColor: number
  wingColor: number
  beakColor: number
  eyeColor: number
  radius: number
  speedMult: number   // 속도 배율
  hitRadius: number   // 충돌 판정 반지름
}

const BIRD_CONFIGS: Record<BirdType, BirdConfig> = {
  sparrow: { bodyColor: 0x8B6914, wingColor: 0x6B4C0A, beakColor: 0xF59E0B, eyeColor: 0x191F28, radius: 13, speedMult: 1.2,  hitRadius: 20 },
  eagle:   { bodyColor: 0x4A3728, wingColor: 0x6B4C3B, beakColor: 0xF59E0B, eyeColor: 0xEF4444, radius: 18, speedMult: 0.85, hitRadius: 36 },
  pigeon:  { bodyColor: 0x9CA3AF, wingColor: 0xE5E8EB, beakColor: 0xF59E0B, eyeColor: 0x191F28, radius: 15, speedMult: 1.0,  hitRadius: 24 },
  parrot:  { bodyColor: 0x22C55E, wingColor: 0x16A34A, beakColor: 0xF59E0B, eyeColor: 0xEF4444, radius: 14, speedMult: 1.1,  hitRadius: 22 },
  owl:     { bodyColor: 0x6B4C3B, wingColor: 0x4A3728, beakColor: 0xF59E0B, eyeColor: 0xF59E0B, radius: 20, speedMult: 0.7,  hitRadius: 30 },
}

export class Bird extends Phaser.GameObjects.Container {
  private pattern: BirdPattern
  private cfg: BirdConfig
  readonly birdType: BirdType
  vx: number = 0
  vy: number = 0
  private zigzagTimer: number = 0
  private zigzagDir: number = 1
  private wingAngle: number = 0
  private leftWing!: Phaser.GameObjects.Graphics
  private rightWing!: Phaser.GameObjects.Graphics
  readonly hitRadius: number

  constructor(scene: Phaser.Scene, x: number, y: number, speed: number) {
    super(scene, x, y)
    scene.add.existing(this)

    // 새 타입 랜덤 (owl은 희귀하게)
    const types: BirdType[] = ['sparrow', 'eagle', 'pigeon', 'parrot', 'owl']
    const weights = [35, 25, 20, 15, 5]
    this.birdType = this.weightedRandom(types, weights)
    this.cfg = BIRD_CONFIGS[this.birdType]
    this.hitRadius = this.cfg.hitRadius

    const patterns: BirdPattern[] = ['straight', 'zigzag', 'dive', 'accelerate']
    this.pattern = patterns[Phaser.Math.Between(0, patterns.length - 1)]

    const s = speed * this.cfg.speedMult
    switch (this.pattern) {
      case 'straight':   this.vx = -s;        this.vy = 0; break
      case 'zigzag':     this.vx = -s * 0.8;  this.vy = 0; break
      case 'dive':       this.vx = -s * 0.9;  this.vy = s * 0.3; break
      case 'accelerate': this.vx = -s * 0.6;  this.vy = 0; break
    }

    this.drawBird()
    this.setDepth(4)
  }

  private weightedRandom<T>(items: T[], weights: number[]): T {
    const total = weights.reduce((a, b) => a + b, 0)
    let r = Math.random() * total
    for (let i = 0; i < items.length; i++) {
      r -= weights[i]
      if (r <= 0) return items[i]
    }
    return items[items.length - 1]
  }

  private drawBird() {
    const g = this.scene.add.graphics()
    const c = this.cfg
    const r = c.radius

    // 날개 (독수리는 크게)
    this.leftWing  = this.scene.add.graphics()
    this.rightWing = this.scene.add.graphics()
    this.add([g, this.leftWing, this.rightWing])

    // 날개 그리기
    this.drawWings(0)

    // 몸통
    g.fillStyle(c.bodyColor)
    g.fillCircle(0, 0, r)

    // 가슴 (비둘기만 밝게)
    if (this.birdType === 'pigeon') {
      g.fillStyle(c.wingColor)
      g.fillCircle(0, r * 0.3, r * 0.6)
    }

    // 앵무새 볼 빨간 점
    if (this.birdType === 'parrot') {
      g.fillStyle(0xEF4444)
      g.fillCircle(r * 0.4, r * 0.2, r * 0.3)
    }

    // 올빼미 눈 (크고 노랗게)
    if (this.birdType === 'owl') {
      g.fillStyle(c.eyeColor)
      g.fillCircle(-r * 0.35, -r * 0.15, r * 0.35)
      g.fillCircle( r * 0.35, -r * 0.15, r * 0.35)
      g.fillStyle(0x191F28)
      g.fillCircle(-r * 0.35, -r * 0.15, r * 0.15)
      g.fillCircle( r * 0.35, -r * 0.15, r * 0.15)
    } else {
      // 일반 눈
      g.fillStyle(c.eyeColor)
      g.fillCircle(r * 0.3, -r * 0.2, r * 0.22)
      g.fillStyle(0xFFFFFF)
      g.fillCircle(r * 0.37, -r * 0.25, r * 0.1)
    }

    // 부리 (오른쪽, 이동 방향 기준으로 앞쪽)
    g.fillStyle(c.beakColor)
    if (this.birdType === 'owl') {
      // 올빼미: 아래 삼각형 부리
      g.fillTriangle(
        -r * 0.15, r * 0.15,
         r * 0.15, r * 0.15,
         0,        r * 0.45
      )
    } else {
      // 일반 새: 옆 삼각형 부리
      g.fillTriangle(
        r * 0.65, -r * 0.05,
        r * 1.1,  -r * 0.05,
        r * 0.65,  r * 0.2
      )
    }

    // 꼬리 (왼쪽)
    g.fillStyle(c.wingColor)
    g.fillTriangle(
      -r * 0.7, -r * 0.1,
      -r * 1.2, -r * 0.35,
      -r * 0.7,  r * 0.15
    )
  }

  private drawWings(angle: number) {
    const c = this.cfg
    const r = c.radius
    const wSpan = this.birdType === 'eagle' ? r * 1.8 : r * 1.2
    const wAmp  = this.birdType === 'eagle' ? r * 0.5  : r * 0.35

    this.leftWing.clear()
    this.rightWing.clear()

    this.leftWing.fillStyle(c.wingColor)
    this.rightWing.fillStyle(c.wingColor)

    const dy = Math.sin(angle) * wAmp

    // 왼쪽 날개
    this.leftWing.fillTriangle(
      -r * 0.4, -r * 0.1,
      -wSpan,   -dy,
      -r * 0.4,  r * 0.3
    )
    // 오른쪽 날개 (독수리 빼고 접혀있음)
    if (this.birdType === 'eagle') {
      this.rightWing.fillTriangle(
        r * 0.4, -r * 0.1,
        wSpan,   -dy,
        r * 0.4,  r * 0.3
      )
    }
  }

  update(delta: number) {
    const dt = delta / 1000

    if (this.pattern === 'zigzag') {
      this.zigzagTimer += dt
      if (this.zigzagTimer > 0.45) { this.zigzagDir *= -1; this.zigzagTimer = 0 }
      this.vy = this.zigzagDir * 90
    } else if (this.pattern === 'accelerate') {
      this.vx -= 25 * dt
    }

    this.x += this.vx * dt
    this.y += this.vy * dt

    // 날갯짓 애니메이션
    this.wingAngle += dt * (this.birdType === 'eagle' ? 4 : 7)
    this.drawWings(this.wingAngle)
  }

  isOutOfBounds(): boolean {
    const h = this.scene.scale.height
    return this.x < -80 || this.y < -80 || this.y > h + 80
  }
}
