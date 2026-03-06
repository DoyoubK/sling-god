import Phaser from 'phaser'

export type BirdPattern = 'straight' | 'zigzag' | 'dive'
export type BirdType = 'sparrow' | 'pigeon' | 'parrot' | 'owl' | 'eagle'

interface BirdConfig {
  displaySize: number
  speedMult:   number
  hitRadius:   number
  wingSpeed:   number
  wingAmp:     number
  textureKey:  string
}

const BIRD_CONFIGS: Record<BirdType, BirdConfig> = {
  sparrow: { displaySize: 64,  speedMult: 0.6, hitRadius: 32, wingSpeed: 9,  wingAmp: 10, textureKey: 'bird_sparrow_new' },
  pigeon:  { displaySize: 72,  speedMult: 0.8, hitRadius: 36, wingSpeed: 7,  wingAmp: 12, textureKey: 'bird_pigeon_new'  },
  parrot:  { displaySize: 72,  speedMult: 1.0, hitRadius: 36, wingSpeed: 8,  wingAmp: 11, textureKey: 'bird_parrot_new'  },
  owl:     { displaySize: 80,  speedMult: 1.3, hitRadius: 40, wingSpeed: 5,  wingAmp: 14, textureKey: 'bird_owl_new'     },
  eagle:   { displaySize: 92,  speedMult: 1.7, hitRadius: 46, wingSpeed: 4,  wingAmp: 18, textureKey: 'bird_eagle_new'   },
}

export class Bird extends Phaser.GameObjects.Container {
  private pattern:     BirdPattern
  private cfg:         BirdConfig
  readonly birdType:   BirdType
  vx = 0; vy = 0
  private zigzagTimer = 0
  private zigzagDir   = 1
  private wingAngle   = 0
  readonly hitRadius: number
  isHit = false

  private sprite!: Phaser.GameObjects.Image
  private baseScale!: number

  constructor(scene: Phaser.Scene, x: number, y: number, speed: number, goRight = false, level = 1) {
    super(scene, x, y)
    scene.add.existing(this)

    const types: BirdType[]  = ['sparrow', 'pigeon', 'parrot', 'owl', 'eagle']
    const weights = this.getLevelWeights(level)
    this.birdType = this.weightedRandom(types, weights)
    this.cfg      = BIRD_CONFIGS[this.birdType]
    this.hitRadius = this.cfg.hitRadius

    const patterns: BirdPattern[] = ['straight', 'straight', 'zigzag', 'dive']
    this.pattern = patterns[Phaser.Math.Between(0, patterns.length - 1)]

    const dir = goRight ? 1 : -1
    const s   = speed * this.cfg.speedMult
    switch (this.pattern) {
      case 'straight': this.vx = dir * s;       this.vy = 0; break
      case 'zigzag':   this.vx = dir * s * 0.8; this.vy = 0; break
      case 'dive':     this.vx = dir * s * 0.9; this.vy = s * 0.3; break
    }

    // 스프라이트 생성
    this.sprite = scene.add.image(0, 0, this.cfg.textureKey)
    this.baseScale = this.cfg.displaySize / Math.max(this.sprite.width, this.sprite.height)
    this.sprite.setScale(this.baseScale)

    // 왼쪽으로 날 때 수평 반전
    if (!goRight) this.sprite.setFlipX(true)

    this.add(this.sprite)
    this.setDepth(10)
  }

  private getLevelWeights(level: number): number[] {
    if (level === 1) return [100,  0,  0,  0,  0]
    if (level === 2) return [ 75, 25,  0,  0,  0]
    if (level === 3) return [ 55, 28, 17,  0,  0]
    if (level === 4) return [ 40, 27, 20, 13,  0]
    if (level === 5) return [ 30, 25, 22, 15,  8]
    const extra = Math.min(level - 5, 5)
    return [
      Math.max(20, 30 - extra * 2),
      Math.max(18, 25 - extra),
      22 + extra,
      15 + extra,
      8  + extra,
    ]
  }

  private weightedRandom<T>(items: T[], weights: number[]): T {
    const total = weights.reduce((a, b) => a + b, 0)
    let r = Math.random() * total
    for (let i = 0; i < items.length; i++) { r -= weights[i]; if (r <= 0) return items[i] }
    return items[items.length - 1]
  }

  update(delta: number) {
    if (this.isHit) return
    const dt = delta / 1000

    if (this.pattern === 'zigzag') {
      this.zigzagTimer += dt
      if (this.zigzagTimer > 0.45) { this.zigzagDir *= -1; this.zigzagTimer = 0 }
      this.vy = this.zigzagDir * 90
    }

    this.x += this.vx * dt
    this.y += this.vy * dt

    // 날갯짓: 2프레임 스타일 - sin 기반 scaleY 오실레이션
    this.wingAngle += dt * this.cfg.wingSpeed
    const sinVal = Math.sin(this.wingAngle)

    // 세로 bobbing
    this.sprite.y = sinVal * this.cfg.wingAmp * 0.25

    // 날갯짓: 날개 올림(압축) / 날개 내림(팽창) 교대
    const wingPhase = (sinVal + 1) / 2  // 0 ~ 1
    const scaleFlap = 1.0 - wingPhase * 0.18  // 0.82 ~ 1.0
    this.sprite.setScale(this.baseScale, this.baseScale * scaleFlap)

    // 몸통 약간 기울기
    this.sprite.angle = sinVal * 3
  }

  isOutOfBounds(): boolean {
    const { width, height } = this.scene.scale
    return this.x < -100 || this.x > width + 100 || this.y < -100 || this.y > height + 100
  }

  playHitAnimation(onComplete: () => void) {
    this.isHit = true
    this.vx = 0; this.vy = 0

    // 눈X 표정: 새 크기에 맞게 X 오버레이
    const eyeOffsetY = -this.cfg.displaySize * 0.15  // 눈 위치 (상단)
    const xSize = this.cfg.displaySize * 0.22

    const xg = this.scene.add.graphics()
    // 흰색 테두리 (가독성)
    xg.lineStyle(6, 0xFFFFFF, 0.9)
    xg.beginPath(); xg.moveTo(-xSize, eyeOffsetY - xSize); xg.lineTo(xSize, eyeOffsetY + xSize); xg.strokePath()
    xg.beginPath(); xg.moveTo(xSize, eyeOffsetY - xSize); xg.lineTo(-xSize, eyeOffsetY + xSize); xg.strokePath()
    // 빨간 X
    xg.lineStyle(4, 0xFF2222, 1)
    xg.beginPath(); xg.moveTo(-xSize, eyeOffsetY - xSize); xg.lineTo(xSize, eyeOffsetY + xSize); xg.strokePath()
    xg.beginPath(); xg.moveTo(xSize, eyeOffsetY - xSize); xg.lineTo(-xSize, eyeOffsetY + xSize); xg.strokePath()

    // 별 이펙트 (명중 순간)
    const starGfx = this.scene.add.graphics()
    starGfx.fillStyle(0xFFFF00, 1)
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2
      const r1 = xSize * 1.8, r2 = xSize * 0.9
      starGfx.fillTriangle(
        Math.cos(a) * r1, Math.sin(a) * r1,
        Math.cos(a + Math.PI / 6) * r2, Math.sin(a + Math.PI / 6) * r2,
        Math.cos(a - Math.PI / 6) * r2, Math.sin(a - Math.PI / 6) * r2,
      )
    }
    starGfx.setPosition(0, eyeOffsetY)
    starGfx.setDepth(19)
    this.scene.tweens.add({ targets: starGfx, alpha: 0, scale: 2, duration: 400, onComplete: () => starGfx.destroy() })

    this.add(xg)
    this.setDepth(20)

    this.scene.tweens.add({
      targets: this,
      y: this.scene.scale.height + 80,
      angle: this.x > this.scene.scale.width / 2 ? 90 : -90,
      duration: 700, ease: 'Power2.easeIn',
      onComplete: () => { this.destroy(); onComplete() },
    })
  }
}
