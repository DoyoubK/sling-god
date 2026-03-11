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
  sparrow: { displaySize: 77,  speedMult: 0.48, hitRadius: 38, wingSpeed: 14, wingAmp: 8,  textureKey: 'bird_sparrow_new', sheetKey: 'bird_sparrow_sheet', frameWidth: 1032, frameHeight: 1024, frameRate: 10 },
  pigeon:  { displaySize: 86,  speedMult: 0.64, hitRadius: 43, wingSpeed: 11, wingAmp: 10, textureKey: 'bird_pigeon_new',  sheetKey: 'bird_pigeon_sheet',  frameWidth: 1032, frameHeight: 1024, frameRate: 9  },
  parrot:  { displaySize: 86,  speedMult: 0.8, hitRadius: 43, wingSpeed: 12, wingAmp: 9,  textureKey: 'bird_parrot_new',  sheetKey: 'bird_parrot_sheet',  frameWidth: 1032, frameHeight: 1024, frameRate: 10 },
  owl:     { displaySize: 96,  speedMult: 1.35, hitRadius: 48, wingSpeed: 7,  wingAmp: 12, textureKey: 'bird_owl_new',     sheetKey: 'bird_owl_sheet',     frameWidth: 1032, frameHeight: 1024, frameRate: 7  },
  eagle:   { displaySize: 92,  speedMult: 1.77, hitRadius: 46, wingSpeed: 5,  wingAmp: 16, textureKey: 'bird_eagle_new',   sheetKey: 'bird_eagle_sheet',   frameWidth: 1032, frameHeight: 1024, frameRate: 6  },
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

  // 경로 계산용
  private flightTime   = 0
  private startY       = 0
  private arcPeakDelta = 0
  private startX       = 0
  private endX         = 0
  private endY         = 0
  private flightDuration = 0  // 전체 비행 시간(초)

  private sprite!: Phaser.GameObjects.Image | Phaser.GameObjects.Sprite
  private baseScale!: number
  private useSheet = false

  constructor(scene: Phaser.Scene, x: number, y: number, speed: number, goRight = false, level = 1, customWeights?: number[]) {
    super(scene, x, y)
    scene.add.existing(this)

    const types: BirdType[]  = ['sparrow', 'pigeon', 'parrot', 'owl', 'eagle']
    const weights = customWeights ?? this.getLevelWeights(level)
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
      case 'arc': { // 부엉이: U자형 — 한쪽 상단 3/4 → 중앙 중간 → 반대쪽 상단 3/4
        const h = scene.scale.height
        const w = scene.scale.width
        const topY = h * 0.15          // 상단 높이
        const midY = h * 0.45          // 중앙 중간 높이 (최저점)
        this.startX = goRight ? -50 : w + 50
        this.endX   = goRight ? w + 50 : -50
        this.x = this.startX
        this.y = topY
        this.startY = topY
        this.endY = topY               // 끝점도 같은 높이
        this.arcPeakDelta = midY - topY // 최저점까지의 낙차
        this.flightDuration = (w + 100) / (s * 0.7)  // 비행 총 시간
        this.vx = 0; this.vy = 0; break  // update에서 직접 위치 계산
      }
      case 'swoop': { // 독수리: 대각선 직선 — 한쪽 최상단 → 반대쪽 지면
        const sw = scene.scale.width
        const sh = scene.scale.height
        this.startX = goRight ? -50 : sw + 50
        this.endX   = goRight ? sw + 50 : -50
        this.x = this.startX
        this.y = sh * 0.05             // 최상단
        this.startY = this.y
        this.endY = sh * 0.76 - 10     // 지면 바로 위
        this.flightDuration = (sw + 100) / (s * 0.9)
        this.vx = 0; this.vy = 0; break  // update에서 직접 위치 계산
      }
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
      case 'sparrow':  return 'straight'
      case 'pigeon':   return 'zigzag'
      case 'parrot':   return 'bigzigzag'
      case 'owl':      return 'arc'
      case 'eagle':    return 'swoop'
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

      case 'bigzigzag': // 앵무새: 부드러운 sin 웨이브 위아래
        this.y = this.startY + Math.sin(this.flightTime * 2.5) * 80
        break

      case 'arc': { // 부엉이: U자형 포물선 (상단→중간→상단)
        const p = Math.min(this.flightTime / this.flightDuration, 1)
        this.x = this.startX + (this.endX - this.startX) * p
        // sin 포물선: 0→1→0 으로 최저점 도달 후 복귀
        this.y = this.startY + Math.sin(p * Math.PI) * this.arcPeakDelta
        break
      }

      case 'swoop': { // 독수리: 대각선 직선 급강하 (상단→지면)
        const p = Math.min(this.flightTime / this.flightDuration, 1)
        this.x = this.startX + (this.endX - this.startX) * p
        this.y = this.startY + (this.endY - this.startY) * p
        break
      }
    }

    const directPatterns: BirdPattern[] = ['arc', 'swoop', 'bigzigzag']
    if (!directPatterns.includes(this.pattern)) {
      this.x += this.vx * dt
      this.y += this.vy * dt
    } else if (this.pattern === 'bigzigzag') {
      this.x += this.vx * dt
    }

    // 지면 아래로 내려가지 않도록 클램프
    const maxY = this.scene.scale.height * 0.76 - 10
    if (this.y > maxY) this.y = maxY

    // ── 비행 애니메이션 ─────────────────────────────────────
    this.wingAngle += dt * this.cfg.wingSpeed

    if (this.useSheet) {
      // 스프라이트시트: 부드러운 bob만
      const bob = Math.sin(this.wingAngle) * this.cfg.wingAmp * 0.3
      this.sprite.y = -bob
      this.sprite.angle = Math.sin(this.wingAngle * 0.5) * 3
    } else {
      // 단일 이미지: 가벼운 상하 bobbing + 미세 기울기
      const bob = Math.sin(this.wingAngle) * this.cfg.wingAmp * 0.35
      this.sprite.y = -bob

      if (this.pattern === 'swoop') {
        // 독수리: 대각선 방향으로 기울기
        const dx = this.endX - this.startX
        const dy = this.endY - this.startY
        const angle = Math.atan2(dy, dx) * (180 / Math.PI)
        this.sprite.angle = angle
      } else {
        this.sprite.angle = Math.sin(this.wingAngle * 0.5) * 3
      }
      this.sprite.setScale(this.baseScale)
    }
  }

  isOutOfBounds(): boolean {
    const { width, height } = this.scene.scale
    // arc/swoop는 flightDuration 초과 시 완료
    if ((this.pattern === 'arc' || this.pattern === 'swoop') && this.flightTime > this.flightDuration) {
      return true
    }
    return this.x < -100 || this.x > width + 100 || this.y < -100 || this.y > height + 100
  }

  playHitAnimation(onComplete: () => void) {
    this.isHit = true
    this.vx = 0; this.vy = 0


































    this.scene.tweens.add({
      targets: this,
      y: this.scene.scale.height + 80,
      angle: this.x > this.scene.scale.width / 2 ? 90 : -90,
      duration: 700, ease: 'Power2.easeIn',
      onComplete: () => { this.destroy(); onComplete() },
    })
  }
}
