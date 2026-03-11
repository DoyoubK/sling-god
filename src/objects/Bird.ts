import Phaser from 'phaser'

export type BirdPattern = 'straight' | 'zigzag' | 'dive' | 'bigzigzag' | 'arc' | 'swoop'
export type BirdType = 'sparrow' | 'pigeon' | 'parrot' | 'owl' | 'eagle'

interface BirdConfig {
  displaySize: number
  speedMult:   number
  hitRadius:   number
  wingSpeed:   number
  wingAmp:     number
  textureKey:  string
  sheetKey:    string        // 스프라이트시트 키 (없으면 textureKey 폴백)
  frameWidth:  number        // 스프라이트시트 프레임 너비
  frameHeight: number        // 스프라이트시트 프레임 높이
  frameRate:   number        // 날갯짓 FPS
}

const BIRD_CONFIGS: Record<BirdType, BirdConfig> = {
  sparrow: { displaySize: 64,  speedMult: 0.48, hitRadius: 32, wingSpeed: 14, wingAmp: 8,  textureKey: 'bird_sparrow_new', sheetKey: 'bird_sparrow_sheet', frameWidth: 1032, frameHeight: 1024, frameRate: 10 },
  pigeon:  { displaySize: 72,  speedMult: 0.64, hitRadius: 36, wingSpeed: 11, wingAmp: 10, textureKey: 'bird_pigeon_new',  sheetKey: 'bird_pigeon_sheet',  frameWidth: 1032, frameHeight: 1024, frameRate: 9  },
  parrot:  { displaySize: 72,  speedMult: 0.8, hitRadius: 36, wingSpeed: 12, wingAmp: 9,  textureKey: 'bird_parrot_new',  sheetKey: 'bird_parrot_sheet',  frameWidth: 1032, frameHeight: 1024, frameRate: 10 },
  owl:     { displaySize: 80,  speedMult: 1.04, hitRadius: 40, wingSpeed: 7,  wingAmp: 12, textureKey: 'bird_owl_new',     sheetKey: 'bird_owl_sheet',     frameWidth: 1032, frameHeight: 1024, frameRate: 7  },
  eagle:   { displaySize: 92,  speedMult: 1.36, hitRadius: 46, wingSpeed: 5,  wingAmp: 16, textureKey: 'bird_eagle_new',   sheetKey: 'bird_eagle_sheet',   frameWidth: 1032, frameHeight: 1024, frameRate: 6  },
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

  // 포물선(arc) / 급강하(swoop) 용
  private flightTime   = 0
  private startY       = 0
  private arcPeakDelta = 0

  private sprite!: Phaser.GameObjects.Image | Phaser.GameObjects.Sprite
  private baseScale!: number
  private useSheet = false

  constructor(scene: Phaser.Scene, x: number, y: number, speed: number, goRight = false, level = 1) {
    super(scene, x, y)
    scene.add.existing(this)

    const types: BirdType[]  = ['sparrow', 'pigeon', 'parrot', 'owl', 'eagle']
    const weights = this.getLevelWeights(level)
    this.birdType = this.weightedRandom(types, weights)
    this.cfg      = BIRD_CONFIGS[this.birdType]
    this.hitRadius = this.cfg.hitRadius

    // 새 종류별 고유 비행 패턴
    this.pattern = this.getPatternForType(this.birdType)

    const dir = goRight ? 1 : -1
    const s   = speed * this.cfg.speedMult
    this.startY = y

    switch (this.pattern) {
      case 'straight': this.vx = dir * s;       this.vy = 0; break
      case 'zigzag':   this.vx = dir * s * 0.8; this.vy = 0; break
      case 'dive':     this.vx = dir * s * 0.9; this.vy = s * 0.3; break
      case 'bigzigzag': // 앵무새: 큰 폭 위아래
        this.vx = dir * s * 0.75; this.vy = 0; break
      case 'arc': // 부엉이: 위→아래→위 포물선
        this.vx = dir * s * 0.7; this.vy = 0
        this.arcPeakDelta = 160; break
      case 'swoop': // 독수리: 대각선 급강하
        this.vx = dir * s * 0.8; this.vy = s * 0.6; break
    }

    // ── 스프라이트 생성: 시트 있으면 Sprite, 없으면 Image 폴백 ──
    const animKey = `${this.birdType}_fly`
    if (scene.textures.exists(this.cfg.sheetKey)) {
      this.useSheet = true
      const sp = scene.add.sprite(0, 0, this.cfg.sheetKey)

      // 애니메이션 미등록 시 한 번만 등록
      if (!scene.anims.exists(animKey)) {
        scene.anims.create({
          key:       animKey,
          frames:    scene.anims.generateFrameNumbers(this.cfg.sheetKey, { start: 0, end: 3 }),
          frameRate: this.cfg.frameRate,
          repeat:    -1,
          yoyo:      true,   // 0→1→2→3→2→1 핑퐁으로 더 부드럽게
        })
      }
      sp.play(animKey)
      this.sprite = sp
    } else {
      this.sprite = scene.add.image(0, 0, this.cfg.textureKey)
    }

    this.baseScale = this.cfg.displaySize / Math.max(this.sprite.width, this.sprite.height)
    this.sprite.setScale(this.baseScale)

    // 왼쪽으로 날 때 수평 반전
    if (!goRight) this.sprite.setFlipX(true)

    this.add(this.sprite)
    this.setDepth(10)
  }

  private getLevelWeights(level: number): number[] {
    // [sparrow, pigeon, parrot, owl, eagle]
    if (level === 1)  return [100,  0,  0,  0,  0]
    if (level === 2)  return [ 80, 20,  0,  0,  0]
    if (level === 3)  return [ 60, 40,  0,  0,  0]
    if (level === 4)  return [ 40, 35, 25,  0,  0]
    if (level === 5)  return [ 30, 30, 40,  0,  0]
    if (level === 6)  return [ 25, 25, 35, 15,  0]
    if (level === 7)  return [ 20, 20, 30, 30,  0]
    if (level === 8)  return [ 15, 15, 25, 30, 15]
    if (level === 9)  return [ 10, 15, 25, 30, 20]
    /* level >= 10 */ return [  5, 10, 25, 35, 25]
  }

  private getPatternForType(type: BirdType): BirdPattern {
    switch (type) {
      case 'sparrow': {
        const p: BirdPattern[] = ['straight', 'straight', 'zigzag']
        return p[Phaser.Math.Between(0, p.length - 1)]
      }
      case 'pigeon': {
        const p: BirdPattern[] = ['straight', 'zigzag', 'dive']
        return p[Phaser.Math.Between(0, p.length - 1)]
      }
      case 'parrot':  return 'bigzigzag'
      case 'owl':     return 'arc'
      case 'eagle':   return 'swoop'
    }
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
    this.flightTime += dt

    // 패턴별 이동
    switch (this.pattern) {
      case 'zigzag':
        this.zigzagTimer += dt
        if (this.zigzagTimer > 0.45) { this.zigzagDir *= -1; this.zigzagTimer = 0 }
        this.vy = this.zigzagDir * 90
        break

      case 'bigzigzag': // 앵무새: 큰 폭 위아래 (빠르고 넓게)
        this.zigzagTimer += dt
        if (this.zigzagTimer > 0.35) { this.zigzagDir *= -1; this.zigzagTimer = 0 }
        this.vy = this.zigzagDir * 180
        break

      case 'arc': { // 부엉이: 위→아래→위 포물선 (sin 곡선)
        // 횡단 시간 약 2~3초 기준 한 사이클
        const screenW = this.scene.scale.width + 200  // 화면+여백
        const progress = Math.abs(this.vx) * this.flightTime / screenW  // 0→1
        this.y = this.startY + Math.sin(progress * Math.PI) * this.arcPeakDelta
        break
      }

      case 'swoop': // 독수리: 급강하 (중력 가속)
        this.vy += 120 * dt  // 점점 빨라지는 하강
        break
    }

    this.x += this.vx * dt
    if (this.pattern !== 'arc') this.y += this.vy * dt

    // ── 날갯짓 애니메이션 ─────────────────────────────────────
    if (this.useSheet) {
      // 스프라이트시트: Phaser anims 자동 재생 중 → 몸통 bob/tilt만 추가
      this.wingAngle += dt * this.cfg.wingSpeed
      const beat = Math.sin(this.wingAngle)
      this.sprite.y     = -beat * this.cfg.wingAmp * 0.4
      this.sprite.angle = -beat * 5
    } else {
      // 폴백: 단일 이미지 수동 애니메이션
      this.wingAngle += dt * this.cfg.wingSpeed
      const raw  = Math.sin(this.wingAngle)
      const beat = Math.sign(raw) * Math.pow(Math.abs(raw), 0.6)
      this.sprite.y     = -beat * this.cfg.wingAmp * 0.55
      this.sprite.angle = -beat * 7
      this.sprite.setScale(this.baseScale)
    }
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
