import Phaser from 'phaser'

export type BirdPattern = 'straight' | 'zigzag' | 'dive' | 'accelerate'
export type BirdType = 'sparrow' | 'eagle' | 'pigeon' | 'parrot' | 'owl'

interface BirdConfig {
  textureKey: string | null   // null이면 Graphics로 폴백
  bodyColor:  number
  wingColor:  number
  beakColor:  number
  eyeColor:   number
  displaySize: number         // 화면에 표시할 크기 (px)
  speedMult:  number
  hitRadius:  number
}

const BIRD_CONFIGS: Record<BirdType, BirdConfig> = {
  sparrow: { textureKey: 'bird_sparrow', bodyColor: 0x8B6914, wingColor: 0x6B4C0A, beakColor: 0xF59E0B, eyeColor: 0x191F28, displaySize: 72,  speedMult: 1.2,  hitRadius: 36 },
  eagle:   { textureKey: null,           bodyColor: 0x4A3728, wingColor: 0x6B4C3B, beakColor: 0xF59E0B, eyeColor: 0xEF4444, displaySize: 90,  speedMult: 0.85, hitRadius: 45 },
  pigeon:  { textureKey: 'bird_pigeon',  bodyColor: 0x9CA3AF, wingColor: 0xE5E8EB, beakColor: 0xF59E0B, eyeColor: 0x191F28, displaySize: 78,  speedMult: 1.0,  hitRadius: 39 },
  parrot:  { textureKey: null,           bodyColor: 0x22C55E, wingColor: 0x16A34A, beakColor: 0xF59E0B, eyeColor: 0xEF4444, displaySize: 70,  speedMult: 1.1,  hitRadius: 35 },
  owl:     { textureKey: null,           bodyColor: 0x6B4C3B, wingColor: 0x4A3728, beakColor: 0xF59E0B, eyeColor: 0xF59E0B, displaySize: 88,  speedMult: 0.7,  hitRadius: 44 },
}

export class Bird extends Phaser.GameObjects.Container {
  private pattern:     BirdPattern
  private cfg:         BirdConfig
  readonly birdType:   BirdType
  vx = 0; vy = 0
  private zigzagTimer = 0
  private zigzagDir   = 1
  private wingAngle   = 0
  private leftWing!:  Phaser.GameObjects.Graphics
  private rightWing!: Phaser.GameObjects.Graphics
  private spriteImg?: Phaser.GameObjects.Image
  readonly hitRadius: number
  isHit = false

  constructor(scene: Phaser.Scene, x: number, y: number, speed: number) {
    super(scene, x, y)
    scene.add.existing(this)

    const types: BirdType[]  = ['sparrow', 'eagle', 'pigeon', 'parrot', 'owl']
    const weights             = [35, 25, 20, 15, 5]
    this.birdType = this.weightedRandom(types, weights)
    this.cfg      = BIRD_CONFIGS[this.birdType]
    this.hitRadius = this.cfg.hitRadius

    const patterns: BirdPattern[] = ['straight', 'zigzag', 'dive', 'accelerate']
    this.pattern = patterns[Phaser.Math.Between(0, patterns.length - 1)]

    const s = speed * this.cfg.speedMult
    switch (this.pattern) {
      case 'straight':   this.vx = -s;       this.vy = 0; break
      case 'zigzag':     this.vx = -s * 0.8; this.vy = 0; break
      case 'dive':       this.vx = -s * 0.9; this.vy = s * 0.3; break
      case 'accelerate': this.vx = -s * 0.6; this.vy = 0; break
    }

    this.drawBird()
    this.setDepth(4)
  }

  private weightedRandom<T>(items: T[], weights: number[]): T {
    const total = weights.reduce((a, b) => a + b, 0)
    let r = Math.random() * total
    for (let i = 0; i < items.length; i++) { r -= weights[i]; if (r <= 0) return items[i] }
    return items[items.length - 1]
  }

  private drawBird() {
    const cfg = this.cfg

    // ── PNG 스프라이트가 있으면 이미지 사용 ──
    if (cfg.textureKey && this.scene.textures.exists(cfg.textureKey)) {
      const size = cfg.displaySize
      this.spriteImg = this.scene.add.image(0, 0, cfg.textureKey)
        .setDisplaySize(size, size)
        .setFlipX(true)   // 이미지가 오른쪽→왼쪽 비행 방향으로 반전
      this.add(this.spriteImg)
      return
    }

    // ── PNG 없으면 Graphics 폴백 ──
    const g = this.scene.add.graphics()
    const r = Math.round(cfg.displaySize / 4)

    this.leftWing  = this.scene.add.graphics()
    this.rightWing = this.scene.add.graphics()
    this.add([this.leftWing, this.rightWing, g])

    this.drawWingsGraphics(0)

    g.fillStyle(cfg.bodyColor); g.fillCircle(0, 0, r)
    if (this.birdType === 'pigeon') { g.fillStyle(cfg.wingColor); g.fillCircle(0, r*0.3, r*0.6) }
    if (this.birdType === 'parrot') { g.fillStyle(0xEF4444);      g.fillCircle(r*0.4, r*0.2, r*0.3) }
    if (this.birdType === 'owl') {
      g.fillStyle(cfg.eyeColor)
      g.fillCircle(-r*0.35, -r*0.15, r*0.35); g.fillCircle(r*0.35, -r*0.15, r*0.35)
      g.fillStyle(0x191F28)
      g.fillCircle(-r*0.35, -r*0.15, r*0.15); g.fillCircle(r*0.35, -r*0.15, r*0.15)
    } else {
      g.fillStyle(cfg.eyeColor); g.fillCircle(r*0.3, -r*0.2, r*0.22)
      g.fillStyle(0xFFFFFF);     g.fillCircle(r*0.37, -r*0.25, r*0.1)
    }
    g.fillStyle(cfg.beakColor)
    if (this.birdType === 'owl') {
      g.fillTriangle(-r*0.15, r*0.15, r*0.15, r*0.15, 0, r*0.45)
    } else {
      g.fillTriangle(r*0.65, -r*0.05, r*1.1, -r*0.05, r*0.65, r*0.2)
    }
    g.fillStyle(cfg.wingColor)
    g.fillTriangle(-r*0.7, -r*0.1, -r*1.2, -r*0.35, -r*0.7, r*0.15)
  }

  private drawWingsGraphics(angle: number) {
    if (!this.leftWing) return
    const r    = Math.round(this.cfg.displaySize / 4)
    const span = this.birdType === 'eagle' ? r * 1.8 : r * 1.2
    const amp  = this.birdType === 'eagle' ? r * 0.5  : r * 0.35
    const dy   = Math.sin(angle) * amp
    this.leftWing.clear()
    this.leftWing.fillStyle(this.cfg.wingColor)
    this.leftWing.fillTriangle(-r*0.4, -r*0.1, -span, -dy, -r*0.4, r*0.3)
    this.rightWing.clear()
    if (this.birdType === 'eagle') {
      this.rightWing.fillStyle(this.cfg.wingColor)
      this.rightWing.fillTriangle(r*0.4, -r*0.1, span, -dy, r*0.4, r*0.3)
    }
  }

  update(delta: number) {
    if (this.isHit) return
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

    // PNG 스프라이트: scaleY로 날갯짓 표현
    if (this.spriteImg) {
      this.wingAngle += dt * 8
      const wingScale = 0.82 + Math.abs(Math.sin(this.wingAngle)) * 0.36
      this.spriteImg.setScale(this.cfg.displaySize / 2048, (this.cfg.displaySize / 2048) * wingScale)
    } else {
      this.wingAngle += dt * (this.birdType === 'eagle' ? 4 : 7)
      this.drawWingsGraphics(this.wingAngle)
    }
  }

  isOutOfBounds(): boolean {
    const h = this.scene.scale.height
    return this.x < -80 || this.y < -80 || this.y > h + 80
  }

  playHitAnimation(onComplete: () => void) {
    this.isHit = true
    this.vx = 0; this.vy = 0

    // X 눈 오버레이 (PNG면 이미지 위에 그래픽 덮기)
    const r = this.cfg.displaySize / 4
    const xg = this.scene.add.graphics()
    xg.lineStyle(3, 0xFF2222, 1)
    const er = r * 0.5
    xg.beginPath(); xg.moveTo(-er, -er); xg.lineTo(er, er); xg.strokePath()
    xg.beginPath(); xg.moveTo(er, -er);  xg.lineTo(-er, er); xg.strokePath()
    this.add(xg)
    this.setDepth(15)

    this.scene.tweens.add({
      targets: this,
      y: this.scene.scale.height + 60,
      angle: this.x > this.scene.scale.width / 2 ? 90 : -90,
      duration: 700, ease: 'Power2.easeIn',
      onComplete: () => { this.destroy(); onComplete() },
    })
  }
}
