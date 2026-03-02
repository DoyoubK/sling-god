import Phaser from 'phaser'

export type BirdPattern = 'straight' | 'zigzag' | 'dive'
export type BirdType = 'sparrow' | 'pigeon' | 'parrot' | 'owl' | 'eagle'

interface BirdConfig {
  displaySize: number
  speedMult:   number
  hitRadius:   number
  wingSpeed:   number   // 날갯짓 속도
  wingAmp:     number   // 날갯짓 진폭 (px)
}

const BIRD_CONFIGS: Record<BirdType, BirdConfig> = {
  // 속도: sparrow < pigeon < parrot < owl < eagle
  sparrow: { displaySize: 64,  speedMult: 0.6, hitRadius: 32, wingSpeed: 9,  wingAmp: 10 },
  pigeon:  { displaySize: 72,  speedMult: 0.8, hitRadius: 36, wingSpeed: 7,  wingAmp: 12 },
  parrot:  { displaySize: 72,  speedMult: 1.0, hitRadius: 36, wingSpeed: 8,  wingAmp: 11 },
  owl:     { displaySize: 80,  speedMult: 1.3, hitRadius: 40, wingSpeed: 5,  wingAmp: 14 },
  eagle:   { displaySize: 92,  speedMult: 1.7, hitRadius: 46, wingSpeed: 4,  wingAmp: 18 },
}

export class Bird extends Phaser.GameObjects.Container {
  private pattern:     BirdPattern
  private cfg:         BirdConfig
  readonly birdType:   BirdType
  vx = 0; vy = 0
  private zigzagTimer = 0
  private zigzagDir   = 1
  private wingAngle   = 0
  private bodyGfx!:   Phaser.GameObjects.Graphics
  private wingTopGfx!: Phaser.GameObjects.Graphics
  private wingBotGfx!: Phaser.GameObjects.Graphics
  readonly hitRadius: number
  isHit = false

  constructor(scene: Phaser.Scene, x: number, y: number, speed: number, goRight = false) {
    super(scene, x, y)
    scene.add.existing(this)

    // 빈도: sparrow > pigeon > parrot > owl > eagle
    const types: BirdType[] = ['sparrow', 'pigeon', 'parrot', 'owl', 'eagle']
    const weights           = [40, 28, 17, 10, 5]
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

    // 날아가는 방향으로 머리가 향하도록 (기본 드로잉은 오른쪽 방향)
    // 왼쪽으로 날 때: scaleX -1 로 미러
    this.setScale(goRight ? 1 : -1, 1)

    // 그래픽 레이어: 아랫날개 → 몸통 → 윗날개
    this.wingBotGfx = scene.add.graphics()
    this.bodyGfx    = scene.add.graphics()
    this.wingTopGfx = scene.add.graphics()
    this.add([this.wingBotGfx, this.bodyGfx, this.wingTopGfx])

    this.drawBird(0)
    this.setDepth(10)
  }

  private weightedRandom<T>(items: T[], weights: number[]): T {
    const total = weights.reduce((a, b) => a + b, 0)
    let r = Math.random() * total
    for (let i = 0; i < items.length; i++) { r -= weights[i]; if (r <= 0) return items[i] }
    return items[items.length - 1]
  }

  // ── 메인 드로우 ──────────────────────────────────────────────────────────
  private drawBird(wingAngle: number) {
    this.bodyGfx.clear()
    this.wingTopGfx.clear()
    this.wingBotGfx.clear()

    switch (this.birdType) {
      case 'sparrow': this.drawSparrow(wingAngle); break
      case 'pigeon':  this.drawPigeon(wingAngle);  break
      case 'parrot':  this.drawParrot(wingAngle);  break
      case 'owl':     this.drawOwl(wingAngle);     break
      case 'eagle':   this.drawEagle(wingAngle);   break
    }
  }

  // ── 참새 (Sparrow) ───────────────────────────────────────────────────────
  // 따뜻한 갈색 계열, 크림 배, 작고 통통한 체형
  private drawSparrow(wa: number) {
    const g = this.bodyGfx
    const wt = this.wingTopGfx
    const wb = this.wingBotGfx
    const dy = Math.sin(wa) * this.cfg.wingAmp

    // 윗날개 (날갯짓)
    wt.fillStyle(0x6B4C1A)
    wt.fillTriangle(-6, -4, -28, -8 - dy, 10, -6)
    wt.fillStyle(0x9A7030)
    wt.fillTriangle(-4, -3, -22, -6 - dy, 8, -5)
    // 날개 줄무늬
    wt.fillStyle(0xC0962A)
    wt.fillRect(-18, -7 - dy * 0.7, 12, 2)

    // 아랫날개 (살짝 접힌)
    wb.fillStyle(0x5C3D14)
    wb.fillTriangle(-6, 4, -20, 10 + dy * 0.4, 8, 6)

    // 꼬리
    g.fillStyle(0x5C3D14)
    g.fillTriangle(-22, -2, -32, -6, -22, 8)
    g.fillStyle(0x7A5520)
    g.fillTriangle(-20, -1, -28, -3, -20, 5)

    // 몸통
    g.fillStyle(0xA07838)
    g.fillEllipse(0, 2, 34, 20)
    // 배 (크림)
    g.fillStyle(0xEED8A8)
    g.fillEllipse(4, 5, 20, 12)

    // 머리
    g.fillStyle(0x8B6520)
    g.fillCircle(16, -6, 11)
    // 머리 윗부분 (다크 캡)
    g.fillStyle(0x4A2E0A)
    g.fillEllipse(16, -13, 14, 8)
    // 눈 줄무늬
    g.fillStyle(0x3D2410)
    g.fillRect(12, -10, 10, 2)

    // 눈
    g.fillStyle(0x111111)
    g.fillCircle(20, -7, 2.5)
    g.fillStyle(0xFFFFFF)
    g.fillCircle(21, -8, 1)

    // 부리
    g.fillStyle(0x3D2B10)
    g.fillTriangle(26, -7, 32, -6, 26, -3)
  }

  // ── 비둘기 (Pigeon) ──────────────────────────────────────────────────────
  // 블루그레이, 목 무지개 밴드, 붉은 눈
  private drawPigeon(wa: number) {
    const g = this.bodyGfx
    const wt = this.wingTopGfx
    const wb = this.wingBotGfx
    const dy = Math.sin(wa) * this.cfg.wingAmp

    // 윗날개
    wt.fillStyle(0x4A5565)
    wt.fillTriangle(-8, -4, -34, -10 - dy, 12, -6)
    wt.fillStyle(0x6B7A8A)
    wt.fillTriangle(-6, -3, -26, -7 - dy, 10, -5)
    // 날개 끝 다크
    wt.fillStyle(0x2E3040)
    wt.fillTriangle(-28, -9 - dy, -34, -10 - dy, -22, -6 - dy * 0.8)

    // 아랫날개
    wb.fillStyle(0x3A4555)
    wb.fillTriangle(-8, 5, -28, 12 + dy * 0.4, 10, 7)

    // 꼬리 (부채꼴)
    g.fillStyle(0x3A3A50)
    g.fillTriangle(-22, -4, -34, 2, -22, 8)
    g.fillStyle(0x4A4A60)
    g.fillTriangle(-20, -2, -30, 2, -20, 6)

    // 몸통
    g.fillStyle(0x5A6878)
    g.fillEllipse(0, 2, 38, 22)

    // 목 무지개 밴드 (비둘기 특징!)
    g.fillStyle(0x9030B0)
    g.fillEllipse(14, -4, 10, 5)
    g.fillStyle(0x20A050)
    g.fillEllipse(12, -1, 9, 4)
    g.fillStyle(0xD040A0)
    g.fillEllipse(10, 2, 8, 3)

    // 머리 (작고 둥근)
    g.fillStyle(0x5A6878)
    g.fillCircle(20, -8, 9)

    // 눈 (주황-빨간 홍채)
    g.fillStyle(0xCC4400)
    g.fillCircle(24, -9, 3.5)
    g.fillStyle(0x111111)
    g.fillCircle(24, -9, 2)
    g.fillStyle(0xFFFFFF)
    g.fillCircle(25, -10, 0.8)

    // 부리
    g.fillStyle(0x6A5870)
    g.fillTriangle(28, -9, 35, -8, 28, -6)
    g.fillStyle(0xD0C0B0)
    g.fillRect(28, -9, 5, 1)
  }

  // ── 앵무새 (Parrot - Scarlet Macaw) ─────────────────────────────────────
  // 빨강-노랑-파랑 3단, 긴 꼬리, 큰 갈고리 부리
  private drawParrot(wa: number) {
    const g = this.bodyGfx
    const wt = this.wingTopGfx
    const wb = this.wingBotGfx
    const dy = Math.sin(wa) * this.cfg.wingAmp

    // 윗날개 (3색 레이어)
    wt.fillStyle(0xB81818)
    wt.fillTriangle(-6, -4, -30, -8 - dy, 12, -6)
    wt.fillStyle(0xD8B808)
    wt.fillTriangle(-4, -2, -24, -5 - dy * 0.85, 14, -3)
    wt.fillStyle(0x1840A0)
    wt.fillTriangle(-2, 0, -18, -2 - dy * 0.7, 16, 0)

    // 아랫날개 (파란 비행깃)
    wb.fillStyle(0x1840A0)
    wb.fillTriangle(-6, 6, -26, 14 + dy * 0.4, 12, 7)
    wb.fillStyle(0x102858)
    wb.fillTriangle(-18, 10 + dy * 0.35, -26, 14 + dy * 0.4, -10, 10 + dy * 0.3)

    // 긴 꼬리 (파랑+빨강)
    g.fillStyle(0x1840A0)
    g.fillTriangle(-20, -3, -42, 2, -18, 2)
    g.fillStyle(0xB81818)
    g.fillTriangle(-18, 0, -36, 3, -16, 4)

    // 몸통 (빨강)
    g.fillStyle(0xCC2020)
    g.fillEllipse(2, 2, 36, 20)

    // 머리 (빨강)
    g.fillStyle(0xCC2020)
    g.fillCircle(18, -6, 12)

    // 눈 흰 피부 패치 (Macaw 특징)
    g.fillStyle(0xF0E8E0)
    g.fillEllipse(20, -5, 12, 9)
    // 눈
    g.fillStyle(0x111111)
    g.fillCircle(20, -6, 3)
    g.fillStyle(0xFFFFFF)
    g.fillCircle(21, -7, 1.2)

    // 갈고리 부리 (크림 위 + 검정 아래)
    g.fillStyle(0xECDFC0)
    g.fillTriangle(28, -10, 38, -7, 28, -5)
    g.fillStyle(0x222222)
    g.fillTriangle(28, -5, 36, -4, 28, -1)
  }

  // ── 올빼미 (Owl) ─────────────────────────────────────────────────────────
  // 황갈색, 크고 둥근 황금 눈, 귀깃, 넓은 날개
  private drawOwl(wa: number) {
    const g = this.bodyGfx
    const wt = this.wingTopGfx
    const wb = this.wingBotGfx
    const dy = Math.sin(wa) * this.cfg.wingAmp

    // 윗날개 (넓게)
    wt.fillStyle(0x6B5030)
    wt.fillTriangle(-10, -5, -38, -12 - dy, 14, -8)
    wt.fillStyle(0x9A7848)
    wt.fillTriangle(-8, -3, -30, -8 - dy, 12, -5)
    // 날개 안쪽 밝은 부분
    wt.fillStyle(0xC0A870)
    wt.fillTriangle(-6, -2, -20, -5 - dy * 0.8, 10, -3)

    // 아랫날개
    wb.fillStyle(0x7A6040)
    wb.fillTriangle(-10, 6, -36, 16 + dy * 0.4, 12, 8)
    wb.fillStyle(0xB09868)
    wb.fillTriangle(-8, 5, -26, 12 + dy * 0.35, 10, 6)

    // 꼬리
    g.fillStyle(0x6B5030)
    g.fillTriangle(-20, -4, -32, 2, -20, 8)
    g.fillStyle(0x9A7848)
    g.fillTriangle(-18, -2, -28, 2, -18, 6)

    // 몸통 (통통)
    g.fillStyle(0x9A7D58)
    g.fillEllipse(0, 3, 36, 26)
    // 가슴 반점 패턴
    g.fillStyle(0xC8A870)
    g.fillEllipse(4, 6, 22, 16)
    g.fillStyle(0x7A6040, 0.6)
    for (let i = 0; i < 4; i++) {
      g.fillRect(-2 + i * 4, 2 + i * 3, 3, 2)
    }

    // 머리 (크고 둥근 - 올빼미 특징)
    g.fillStyle(0x8B7050)
    g.fillCircle(14, -8, 14)
    // 얼굴 디스크
    g.fillStyle(0xC0A878)
    g.fillEllipse(16, -7, 18, 16)
    // 얼굴 디스크 테두리
    g.lineStyle(1.5, 0x6B5030)
    g.strokeEllipse(16, -7, 18, 16)

    // 귀깃 (ear tufts) — 올빼미 특징!
    g.fillStyle(0x5A4028)
    g.fillTriangle(8, -18, 6, -26, 12, -18)
    g.fillTriangle(20, -18, 18, -26, 24, -18)

    // 크고 둥근 황금 눈 (가장 특징적!)
    g.fillStyle(0xE8C020)
    g.fillCircle(13, -8, 5)
    g.fillCircle(21, -8, 5)
    g.fillStyle(0x111111)
    g.fillCircle(13, -8, 3)
    g.fillCircle(21, -8, 3)
    g.fillStyle(0xFFFFFF)
    g.fillCircle(14, -9, 1.2)
    g.fillCircle(22, -9, 1.2)

    // 부리 (작은 갈고리, 얼굴 중앙)
    g.fillStyle(0x8B7050)
    g.fillTriangle(15, -4, 19, -4, 17, 0)
  }

  // ── 독수리 (Eagle) ───────────────────────────────────────────────────────
  // 흰 머리, 진한 갈색 몸, 큰 노란 갈고리 부리, 거대한 날개
  private drawEagle(wa: number) {
    const g = this.bodyGfx
    const wt = this.wingTopGfx
    const wb = this.wingBotGfx
    const dy = Math.sin(wa) * this.cfg.wingAmp

    // 윗날개 (매우 넓게)
    wt.fillStyle(0x3A2818)
    wt.fillTriangle(-12, -6, -46, -14 - dy, 16, -8)
    wt.fillStyle(0x5A3E28)
    wt.fillTriangle(-10, -4, -36, -10 - dy, 14, -6)
    wt.fillStyle(0x7A5E40)
    wt.fillTriangle(-8, -2, -24, -6 - dy * 0.8, 12, -4)
    // 날개 끝 깃털 (갈라진 형태)
    wt.fillStyle(0x2A1A0A)
    for (let i = 0; i < 4; i++) {
      const fx = -32 - i * 3
      const fy = -10 - dy - i * 1.5
      wt.fillTriangle(fx, fy, fx - 5, fy - 5, fx + 4, fy + 3)
    }

    // 아랫날개 (큰)
    wb.fillStyle(0x3A2818)
    wb.fillTriangle(-12, 7, -44, 20 + dy * 0.4, 14, 9)
    wb.fillStyle(0x5A3E28)
    wb.fillTriangle(-10, 6, -34, 15 + dy * 0.35, 12, 7)

    // 흰 꼬리 (Bald Eagle 특징)
    g.fillStyle(0xEEEEEE)
    g.fillTriangle(-22, -4, -38, 2, -22, 8)
    g.fillStyle(0xCCCCCC)
    g.fillTriangle(-20, -2, -32, 2, -20, 6)

    // 몸통 (다크 브라운)
    g.fillStyle(0x4A3828)
    g.fillEllipse(0, 2, 40, 24)

    // 흰 머리 (Bald Eagle 가장 큰 특징!)
    g.fillStyle(0xF0F0F0)
    g.fillCircle(18, -8, 13)
    // 흰 목
    g.fillStyle(0xE8E8E8)
    g.fillEllipse(14, -2, 12, 12)

    // 눈 (노란 홍채)
    g.fillStyle(0xE8C020)
    g.fillCircle(23, -9, 4)
    g.fillStyle(0x111111)
    g.fillCircle(23, -9, 2.5)
    g.fillStyle(0xFFFFFF)
    g.fillCircle(24, -10, 1)

    // 눈썹 뼈대 (날카로운 인상)
    g.fillStyle(0xC8C0A0)
    g.fillRect(18, -14, 10, 2)

    // 큰 노란 갈고리 부리 (독수리 특징!)
    g.fillStyle(0xF0C020)
    g.fillTriangle(30, -11, 42, -7, 30, -4)
    g.fillStyle(0xD0A010)
    g.fillTriangle(30, -7, 40, -5, 30, -2)
    // 부리 윗 갈고리
    g.fillStyle(0xE8B818)
    g.fillTriangle(36, -11, 44, -8, 36, -7)
  }

  // ── 업데이트 ─────────────────────────────────────────────────────────────
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

    // 날갯짓 애니메이션
    this.wingAngle += dt * this.cfg.wingSpeed
    this.drawBird(this.wingAngle)
  }

  isOutOfBounds(): boolean {
    const { width, height } = this.scene.scale
    return this.x < -100 || this.x > width + 100 || this.y < -100 || this.y > height + 100
  }

  playHitAnimation(onComplete: () => void) {
    this.isHit = true
    this.vx = 0; this.vy = 0

    // X 눈 오버레이
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
