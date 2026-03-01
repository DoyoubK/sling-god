import Phaser from 'phaser'
import { GameManager } from '../utils/GameManager'
import { Bird } from '../objects/Bird'
import { Projectile } from '../objects/Projectile'
import { HUD } from '../ui/HUD'
import { GaugeBar } from '../ui/GaugeBar'
import { TDS } from '../constants/TDS'

const SLING_BASE_SPEED = 520
const MAX_DRAG        = 140
const GRAVITY         = 320

export class GameScene extends Phaser.Scene {
  private gm!: GameManager
  private birds: Bird[] = []
  private projectiles: Projectile[] = []

  private hud!: HUD
  private gaugeBar!: GaugeBar

  private slingshotX!: number
  private slingshotY!: number

  // 드래그 상태 (이벤트 X, update 폴링으로 처리)
  private wasDown       = false
  private dragStartX    = 0
  private dragStartY    = 0
  private dragVx        = 0
  private dragVy        = 0
  private dragPower     = 0   // 0~1
  private isDragging    = false

  // 그래픽
  private slingshotGfx!: Phaser.GameObjects.Graphics
  private trajectoryGfx!: Phaser.GameObjects.Graphics
  private rubberGfx!:     Phaser.GameObjects.Graphics

  // 새 스폰
  private birdSpawnTimer    = 0
  private birdSpawnInterval = 2000

  constructor() { super({ key: 'GameScene' }) }

  create() {
    this.gm = GameManager.getInstance()
    this.birds       = []
    this.projectiles = []
    this.wasDown     = false
    this.isDragging  = false
    this.dragPower   = 0
    this.birdSpawnTimer    = 0
    this.birdSpawnInterval = 2000

    const { width, height } = this.scale
    this.slingshotX = width / 2
    this.slingshotY = height - 130

    // 배경
    this.add.rectangle(width / 2, height / 2, width, height, TDS.color.bg)

    // 그래픽 레이어 순서
    this.trajectoryGfx = this.add.graphics().setDepth(3)
    this.rubberGfx     = this.add.graphics().setDepth(6)
    this.slingshotGfx  = this.add.graphics().setDepth(5)

    this.hud = new HUD(this)
    this.hud.update(this.gm.currentLevel, this.gm.currentHits,
      this.gm.getTargetHits(this.gm.currentLevel), this.gm.currentMisses)

    this.gaugeBar = new GaugeBar(this)

    this.drawSlingshot(0, 0)
  }

  // ── 새총 그리기 ────────────────────────────────
  private drawSlingshot(offsetX: number, offsetY: number) {
    const g  = this.slingshotGfx
    const rb = this.rubberGfx
    g.clear()
    rb.clear()

    const sx = this.slingshotX
    const sy = this.slingshotY

    // 손잡이
    g.fillStyle(0x7A4F28)
    g.fillRect(sx - 5, sy, 10, 70)

    // 왼쪽·오른쪽 갈래
    g.fillStyle(0x5C3D1E)
    g.fillRect(sx - 22, sy - 38, 10, 46)
    g.fillRect(sx + 12, sy - 38, 10, 46)

    // 고무줄
    rb.lineStyle(3.5, 0x333333, 0.9)

    if (this.isDragging) {
      const bx = sx + offsetX
      const by = sy - 30 + offsetY
      rb.beginPath(); rb.moveTo(sx - 17, sy - 38); rb.lineTo(bx, by); rb.strokePath()
      rb.beginPath(); rb.moveTo(sx + 17, sy - 38); rb.lineTo(bx, by); rb.strokePath()
      // 돌멩이
      rb.fillStyle(TDS.color.warning)
      rb.fillCircle(bx, by, 10)
      rb.fillStyle(0xFFFFFF, 0.4)
      rb.fillCircle(bx - 2, by - 2, 4)
    } else {
      // 기본 (안 당겨진 상태)
      rb.beginPath(); rb.moveTo(sx - 17, sy - 38); rb.lineTo(sx, sy - 30); rb.strokePath()
      rb.beginPath(); rb.moveTo(sx + 17, sy - 38); rb.lineTo(sx, sy - 30); rb.strokePath()
      rb.fillStyle(TDS.color.warning)
      rb.fillCircle(sx, sy - 30, 10)
      rb.fillStyle(0xFFFFFF, 0.4)
      rb.fillCircle(sx - 2, sy - 32, 4)
    }
  }

  // ── 점선 궤적 미리보기 ─────────────────────────
  private drawTrajectory(vx: number, vy: number) {
    const g = this.trajectoryGfx
    g.clear()
    if (!this.isDragging || this.dragPower < 0.05) return

    let px = this.slingshotX
    let py = this.slingshotY - 30
    let pvx = vx, pvy = vy
    const dt = 0.05

    for (let i = 0; i < 30; i++) {
      pvy += GRAVITY * dt
      px  += pvx * dt
      py  += pvy * dt
      if (py > this.scale.height + 50 || px < -50 || px > this.scale.width + 50) break
      if (i % 2 === 0) {
        const alpha = (1 - i / 30) * 0.85
        const r     = Math.max(2, 4 - i * 0.08)
        g.fillStyle(TDS.color.warning, alpha)
        g.fillCircle(px, py, r)
      }
    }
  }

  // ── 발사 ──────────────────────────────────────
  private fire(vx: number, vy: number) {
    const p = new Projectile(this, this.slingshotX, this.slingshotY - 30, vx, vy)
    this.projectiles.push(p)
  }

  // ── 스폰 ──────────────────────────────────────
  private spawnBird() {
    const { width } = this.scale
    const y = Phaser.Math.Between(110, 620)
    this.birds.push(new Bird(this, width + 50, y, this.gm.getBirdSpeed(this.gm.currentLevel)))
  }

  // ── 명중 이펙트 ───────────────────────────────
  private spawnHitEffect(x: number, y: number) {
    const g = this.add.graphics().setDepth(20)
    g.fillStyle(TDS.color.warning, 0.8)
    g.fillCircle(0, 0, 28)
    g.setPosition(x, y)
    const txt = this.add.text(x, y - 20, '💥', { fontSize: '28px' }).setOrigin(0.5).setDepth(21)
    this.tweens.add({
      targets: [g, txt], alpha: 0, scaleX: 2.2, scaleY: 2.2,
      duration: 380, ease: 'Power2',
      onComplete: () => { g.destroy(); txt.destroy() },
    })
  }

  // ── 메인 업데이트 ─────────────────────────────
  update(_time: number, delta: number) {
    const ptr    = this.input.activePointer
    const isDown = ptr.isDown

    // ── 포인터 상태 폴링 (이벤트 대신) ──
    if (isDown && !this.wasDown) {
      // 터치/클릭 시작
      this.isDragging = true
      this.dragStartX = ptr.x
      this.dragStartY = ptr.y
      this.dragVx = 0; this.dragVy = 0; this.dragPower = 0
    }

    if (isDown && this.isDragging) {
      // 드래그 중 → 방향·파워 계산
      const dx   = ptr.x - this.dragStartX
      const dy   = ptr.y - this.dragStartY
      const dist = Math.min(Math.sqrt(dx * dx + dy * dy), MAX_DRAG)
      this.dragPower = dist / MAX_DRAG

      if (dist > 2) {
        const angle = Math.atan2(dy, dx)
        const speed = this.dragPower * SLING_BASE_SPEED
        this.dragVx = -Math.cos(angle) * speed
        this.dragVy = -Math.sin(angle) * speed

        const clampRatio = dist / Math.sqrt(dx * dx + dy * dy)
        const cdx = dx * clampRatio * (dist / MAX_DRAG)
        const cdy = dy * clampRatio * (dist / MAX_DRAG)
        this.drawSlingshot(cdx * 0.65, cdy * 0.65)
        this.drawTrajectory(this.dragVx, this.dragVy)
        this.gaugeBar.setPower(this.dragPower * 100)
      }
    }

    if (!isDown && this.wasDown && this.isDragging) {
      // 손 뗌 → 발사
      if (this.dragPower > 0.04) {
        this.fire(this.dragVx, this.dragVy)
      }
      this.isDragging = false
      this.dragPower  = 0
      this.drawSlingshot(0, 0)
      this.trajectoryGfx.clear()
      this.gaugeBar.setPower(0)
    }

    this.wasDown = isDown

    // ── 새 스폰 ──
    this.birdSpawnTimer += delta
    if (this.birdSpawnTimer >= this.birdSpawnInterval) {
      this.spawnBird()
      this.birdSpawnTimer    = 0
      this.birdSpawnInterval = Math.max(700, this.birdSpawnInterval - 40)
    }

    // ── 새 업데이트 ──
    for (let i = this.birds.length - 1; i >= 0; i--) {
      const bird = this.birds[i]
      bird.update(delta)
      if (bird.isOutOfBounds()) {
        bird.destroy()
        this.birds.splice(i, 1)
        const result = this.gm.onMiss()
        this.hud.update(this.gm.currentLevel, this.gm.currentHits,
          this.gm.getTargetHits(this.gm.currentLevel), this.gm.currentMisses)
        if (result === 'gameover') { this.scene.start('GameOverScene'); return }
      }
    }

    // ── 투사체 업데이트 + 충돌 ──
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const proj = this.projectiles[i]
      proj.update(delta)
      if (proj.isOutOfBounds()) { proj.destroy(); this.projectiles.splice(i, 1); continue }

      for (let j = this.birds.length - 1; j >= 0; j--) {
        const bird = this.birds[j]
        const dist = Phaser.Math.Distance.Between(proj.x, proj.y, bird.x, bird.y)
        if (dist < bird.hitRadius) {
          this.spawnHitEffect(bird.x, bird.y)
          proj.destroy(); this.projectiles.splice(i, 1)
          bird.destroy(); this.birds.splice(j, 1)
          const result = this.gm.onHit()
          this.hud.update(this.gm.currentLevel, this.gm.currentHits,
            this.gm.getTargetHits(this.gm.currentLevel), this.gm.currentMisses)
          if (result === 'levelup') { this.gm.levelUp(); this.scene.start('LevelUpScene'); return }
          break
        }
      }
    }
  }
}
