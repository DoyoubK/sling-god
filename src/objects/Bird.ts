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
    const scale = this.cfg.displaySize / Math.max(this.sprite.width, this.sprite.height)
    this.sprite.setScale(scale)

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

    // 날갯짓: 위아래 bobbing
    this.wingAngle += dt * this.cfg.wingSpeed
    this.sprite.y = Math.sin(this.wingAngle) * this.cfg.wingAmp * 0.3
  }

  isOutOfBounds(): boolean {
    const { width, height } = this.scene.scale
    return this.x < -100 || this.x > width + 100 || this.y < -100 || this.y > height + 100
  }

  playHitAnimation(onComplete: () => void) {
    this.isHit = true
    this.vx = 0; this.vy = 0

    const xg = this.scene.add.graphics()
    xg.lineStyle(3, 0xFF2222, 1)
    const er = 10
    xg.beginPath(); xg.moveTo(-er, -er); xg.lineTo(er, er); xg.strokePath()
    xg.beginPath(); xg.moveTo(er, -er);  xg.lineTo(-er, er); xg.strokePath()
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
