import Phaser from 'phaser'
import { GameManager } from '../utils/GameManager'
import { Bird } from '../objects/Bird'
import { Projectile } from '../objects/Projectile'
import { HUD } from '../ui/HUD'
import { GaugeBar } from '../ui/GaugeBar'
import { TDS } from '../constants/TDS'

const SLING_BASE_SPEED = 520   // 최대 발사 속도
const MAX_DRAG        = 150   // 최대 드래그 거리(px)
const GRAVITY         = 320   // 궤적 시뮬 중력

export class GameScene extends Phaser.Scene {
  private gm!: GameManager
  private birds: Bird[] = []
  private projectiles: Projectile[] = []

  private hud!: HUD
  private gaugeBar!: GaugeBar

  // 새총 위치
  private slingshotX!: number
  private slingshotY!: number

  // 드래그 상태
  private isDragging = false
  private dragStartX = 0
  private dragStartY = 0
  private dragVx = 0
  private dragVy = 0
  private dragPower = 0   // 0~100

  // 새총 그래픽
  private slingshotGfx!: Phaser.GameObjects.Graphics
  private trajectoryGfx!: Phaser.GameObjects.Graphics
  private rubberGfx!: Phaser.GameObjects.Graphics

  // 새 스폰
  private birdSpawnTimer = 0
  private birdSpawnInterval = 2000

  constructor() { super({ key: 'GameScene' }) }

  create() {
    this.gm = GameManager.getInstance()
    this.birds = []
    this.projectiles = []
    this.isDragging = false
    this.birdSpawnTimer = 0
    this.birdSpawnInterval = 2000

    const { width, height } = this.scale
    this.slingshotX = width / 2
    this.slingshotY = height - 130

    // 배경
    this.add.rectangle(width / 2, height / 2, width, height, TDS.color.bg)

    // 그래픽 레이어
    this.trajectoryGfx = this.add.graphics().setDepth(3)
    this.rubberGfx     = this.add.graphics().setDepth(6)
    this.slingshotGfx  = this.add.graphics().setDepth(5)
    this.drawSlingshot(0, 0)

    this.hud = new HUD(this)
    this.hud.update(
      this.gm.currentLevel,
      this.gm.currentHits,
      this.gm.getTargetHits(this.gm.currentLevel),
      this.gm.currentMisses
    )
    this.gaugeBar = new GaugeBar(this)

    this.setupInput()
  }

  // ──────────────────────────────────────────────
  //  새총 그리기
  // ──────────────────────────────────────────────
  private drawSlingshot(offsetX: number, offsetY: number) {
    const g = this.slingshotGfx
    g.clear()
    const sx = this.slingshotX
    const sy = this.slingshotY

    const forkColor = 0x5C3D1E
    const baseColor = 0x7A4F28

    // 손잡이
    g.fillStyle(baseColor)
    g.fillRect(sx - 5, sy, 10, 70)

    // 왼쪽 갈래
    g.fillStyle(forkColor)
    g.fillRect(sx - 22, sy - 38, 10, 45)

    // 오른쪽 갈래
    g.fillRect(sx + 12, sy - 38, 10, 45)

    // 고무줄 (드래그 시 당겨지는 표현)
    const rb = this.rubberGfx
    rb.clear()
    rb.lineStyle(3, 0x333333, 0.9)

    if (this.isDragging) {
      const ballX = sx + offsetX
      const ballY = sy - 30 + offsetY
      rb.beginPath()
      rb.moveTo(sx - 17, sy - 38)
      rb.lineTo(ballX, ballY)
      rb.strokePath()
      rb.beginPath()
      rb.moveTo(sx + 17, sy - 38)
      rb.lineTo(ballX, ballY)
      rb.strokePath()

      // 돌멩이
      rb.fillStyle(TDS.color.warning)
      rb.fillCircle(ballX, ballY, 10)
      rb.fillStyle(0xFFFFFF, 0.4)
      rb.fillCircle(ballX - 2, ballY - 2, 4)
    } else {
      // 기본 고무줄
      rb.beginPath()
      rb.moveTo(sx - 17, sy - 38)
      rb.lineTo(sx, sy - 30)
      rb.strokePath()
      rb.beginPath()
      rb.moveTo(sx + 17, sy - 38)
      rb.lineTo(sx, sy - 30)
      rb.strokePath()

      // 대기 중 돌멩이
      rb.fillStyle(TDS.color.warning)
      rb.fillCircle(sx, sy - 30, 10)
      rb.fillStyle(0xFFFFFF, 0.4)
      rb.fillCircle(sx - 2, sy - 32, 4)
    }
  }

  // ──────────────────────────────────────────────
  //  점선 궤적 미리보기
  // ──────────────────────────────────────────────
  private drawTrajectory(vx: number, vy: number) {
    const g = this.trajectoryGfx
    g.clear()
    if (!this.isDragging) return

    const sx = this.slingshotX
    const sy = this.slingshotY - 30

    let px = sx
    let py = sy
    let pvx = vx
    let pvy = vy
    const dt = 0.05
    const steps = 28

    for (let i = 0; i < steps; i++) {
      pvy += GRAVITY * dt
      px += pvx * dt
      py += pvy * dt

      if (py > this.scale.height + 50) break

      // 짝수 스텝만 점으로 표시 → 점선 효과
      if (i % 2 === 0) {
        const alpha = 1 - i / steps
        const r = 4 - i * 0.1
        g.fillStyle(TDS.color.warning, alpha * 0.85)
        g.fillCircle(px, py, Math.max(r, 2))
      }
    }
  }

  // ──────────────────────────────────────────────
  //  입력 처리
  // ──────────────────────────────────────────────
  private setupInput() {
    this.input.on('pointerdown', (ptr: Phaser.Input.Pointer) => {
      this.isDragging = true
      this.dragStartX = ptr.x
      this.dragStartY = ptr.y
    })

    this.input.on('pointermove', (ptr: Phaser.Input.Pointer) => {
      if (!this.isDragging) return

      // 드래그 벡터 (손가락 위치 - 시작 위치)
      const dx = ptr.x - this.dragStartX
      const dy = ptr.y - this.dragStartY
      const dist = Math.min(Math.sqrt(dx * dx + dy * dy), MAX_DRAG)
      this.dragPower = dist / MAX_DRAG

      // 발사 방향 = 드래그 반대 방향 (새총 원리)
      const angle = Math.atan2(dy, dx)
      const speed = this.dragPower * SLING_BASE_SPEED
      this.dragVx = -Math.cos(angle) * speed
      this.dragVy = -Math.sin(angle) * speed

      // 돌멩이 오프셋 (드래그 방향으로 당겨짐)
      const clampedDx = Math.cos(angle) * dist
      const clampedDy = Math.sin(angle) * dist

      this.drawSlingshot(clampedDx * 0.6, clampedDy * 0.6)
      this.drawTrajectory(this.dragVx, this.dragVy)
      this.gaugeBar.setPower(this.dragPower * 100)
    })

    this.input.on('pointerup', () => {
      if (!this.isDragging) return
      this.isDragging = false

      if (this.dragPower > 0.05) {
        this.fire(this.dragVx, this.dragVy)
      }

      this.dragPower = 0
      this.drawSlingshot(0, 0)
      this.trajectoryGfx.clear()
      this.gaugeBar.setPower(0)
    })
  }

  // ──────────────────────────────────────────────
  //  발사
  // ──────────────────────────────────────────────
  private fire(vx: number, vy: number) {
    const p = new Projectile(
      this,
      this.slingshotX,
      this.slingshotY - 30,
      vx,
      vy
    )
    this.projectiles.push(p)
  }

  // ──────────────────────────────────────────────
  //  새 스폰
  // ──────────────────────────────────────────────
  private spawnBird() {
    const { width } = this.scale
    const y = Phaser.Math.Between(110, 620)
    const bird = new Bird(this, width + 50, y, this.gm.getBirdSpeed(this.gm.currentLevel))
    this.birds.push(bird)
  }

  // ──────────────────────────────────────────────
  //  업데이트
  // ──────────────────────────────────────────────
  update(_time: number, delta: number) {
    // 새 스폰
    this.birdSpawnTimer += delta
    if (this.birdSpawnTimer >= this.birdSpawnInterval) {
      this.spawnBird()
      this.birdSpawnTimer = 0
      this.birdSpawnInterval = Math.max(700, this.birdSpawnInterval - 40)
    }

    // 새 업데이트
    for (let i = this.birds.length - 1; i >= 0; i--) {
      const bird = this.birds[i]
      bird.update(delta)
      if (bird.isOutOfBounds()) {
        bird.destroy()
        this.birds.splice(i, 1)
        const result = this.gm.onMiss()
        this.hud.update(this.gm.currentLevel, this.gm.currentHits, this.gm.getTargetHits(this.gm.currentLevel), this.gm.currentMisses)
        if (result === 'gameover') {
          this.scene.start('GameOverScene')
          return
        }
      }
    }

    // 투사체 업데이트 + 충돌
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const proj = this.projectiles[i]
      proj.update(delta)

      if (proj.isOutOfBounds()) {
        proj.destroy()
        this.projectiles.splice(i, 1)
        continue
      }

      for (let j = this.birds.length - 1; j >= 0; j--) {
        const bird = this.birds[j]
        const dist = Phaser.Math.Distance.Between(proj.x, proj.y, bird.x, bird.y)
        if (dist < bird.hitRadius) {
          // 명중 이펙트
          this.spawnHitEffect(bird.x, bird.y)
          proj.destroy(); this.projectiles.splice(i, 1)
          bird.destroy(); this.birds.splice(j, 1)

          const result = this.gm.onHit()
          this.hud.update(this.gm.currentLevel, this.gm.currentHits, this.gm.getTargetHits(this.gm.currentLevel), this.gm.currentMisses)

          if (result === 'levelup') {
            this.gm.levelUp()
            this.scene.start('LevelUpScene')
            return
          }
          break
        }
      }
    }
  }

  // ──────────────────────────────────────────────
  //  명중 이펙트
  // ──────────────────────────────────────────────
  private spawnHitEffect(x: number, y: number) {
    const g = this.add.graphics().setDepth(20)
    g.fillStyle(TDS.color.warning, 0.9)
    g.fillCircle(0, 0, 30)
    g.setPosition(x, y)

    // 텍스트
    const txt = this.add.text(x, y - 20, '💥', {
      fontSize: '28px'
    }).setOrigin(0.5).setDepth(21)

    this.tweens.add({
      targets: [g, txt],
      alpha: 0,
      scaleX: 2,
      scaleY: 2,
      duration: 350,
      ease: 'Power2',
      onComplete: () => { g.destroy(); txt.destroy() }
    })
  }
}
