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

  // 드래그 상태
  private wasDown    = false
  private dragStartX = 0
  private dragStartY = 0
  private dragVx     = 0
  private dragVy     = 0
  private dragPower  = 0
  private isDragging = false

  // 그래픽
  private slingshotImg!:  Phaser.GameObjects.Image
  private trajectoryGfx!: Phaser.GameObjects.Graphics
  private rubberGfx!:     Phaser.GameObjects.Graphics

  // 새 스폰
  private birdSpawnTimer    = 0
  private birdSpawnInterval = 2000

  constructor() { super({ key: 'GameScene' }) }

  preload() {
    if (!this.textures.exists('saechong')) {
      this.load.image('saechong', 'assets/saechong.png')
    }
  }

  create() {
    this.gm = GameManager.getInstance()
    this.birds = []; this.projectiles = []
    this.wasDown = false; this.isDragging = false
    this.dragPower = 0; this.birdSpawnTimer = 0; this.birdSpawnInterval = 2000

    const { width, height } = this.scale
    this.slingshotX = width / 2
    this.slingshotY = height - 100

    // 배경
    this.add.rectangle(width / 2, height / 2, width, height, TDS.color.bg)

    // 그래픽 레이어
    this.trajectoryGfx = this.add.graphics().setDepth(3)
    this.rubberGfx     = this.add.graphics().setDepth(6)

    // 새총 이미지 (하단 중앙)
    const imgDisplaySize = width * 0.38
    const imgScale = imgDisplaySize / 2048
    this.slingshotImg = this.add.image(this.slingshotX, this.slingshotY, 'saechong')
      .setScale(imgScale)
      .setDepth(5)
      .setOrigin(0.5, 0.82)  // 손잡이 하단 기준으로 위치

    // 고무줄 + 돌 (이미지 위에 덮어서 표현)
    this.rubberGfx.setDepth(6)

    this.hud = new HUD(this)
    this.hud.update(this.gm.currentLevel, this.gm.currentHits,
      this.gm.getTargetHits(this.gm.currentLevel), this.gm.currentMisses)
    this.gaugeBar = new GaugeBar(this)

    this.drawRubber(0, 0)
  }

  // ── 발사 포인트 (새총 갈래 사이) ──
  private get forkX() { return this.slingshotX }
  private get forkY() { return this.slingshotY - this.slingshotImg.displayHeight * 0.52 }

  // ── 고무줄 + 돌 그리기 ──
  private drawRubber(offsetX: number, offsetY: number) {
    const rb = this.rubberGfx
    rb.clear()

    const fx = this.forkX
    const fy = this.forkY
    // 이미지 기반 갈래 끝 위치 (이미지 비율로 추정)
    const imgW = this.slingshotImg.displayWidth
    const leftX  = fx - imgW * 0.12
    const rightX = fx + imgW * 0.12
    const forkTopY = fy - this.slingshotImg.displayHeight * 0.08

    rb.lineStyle(3, 0x3A2010, 0.95)

    if (this.isDragging) {
      const bx = fx + offsetX
      const by = fy + offsetY
      rb.beginPath(); rb.moveTo(leftX,  forkTopY); rb.lineTo(bx, by); rb.strokePath()
      rb.beginPath(); rb.moveTo(rightX, forkTopY); rb.lineTo(bx, by); rb.strokePath()
      // 돌멩이
      rb.fillStyle(0x707880); rb.fillRect(bx - 9, by - 9, 18, 18)
      rb.fillStyle(0x909AA0); rb.fillRect(bx - 7, by - 7, 12, 10)
      rb.fillStyle(0xB0B8C0); rb.fillRect(bx - 5, by - 5, 6, 5)
      // 불꽃
      rb.fillStyle(0xF8D848); rb.fillRect(bx - 4, by - 16, 8, 8)
      rb.fillStyle(0xF8A030); rb.fillRect(bx - 3, by - 12, 6, 6)
      rb.fillStyle(0xE86420); rb.fillRect(bx - 2, by - 9,  4, 4)
    } else {
      // 기본 (장전 대기 상태)
      const stoneX = fx, stoneY = fy + 4
      rb.beginPath(); rb.moveTo(leftX,  forkTopY); rb.lineTo(stoneX, stoneY); rb.strokePath()
      rb.beginPath(); rb.moveTo(rightX, forkTopY); rb.lineTo(stoneX, stoneY); rb.strokePath()
      rb.fillStyle(0x707880); rb.fillRect(stoneX - 8, stoneY - 8, 16, 16)
      rb.fillStyle(0x909AA0); rb.fillRect(stoneX - 6, stoneY - 6, 10, 9)
      rb.fillStyle(0xB0B8C0); rb.fillRect(stoneX - 4, stoneY - 4, 5, 4)
    }
  }

  // ── 점선 궤적 ──
  private drawTrajectory(vx: number, vy: number) {
    const g = this.trajectoryGfx
    g.clear()
    if (!this.isDragging || this.dragPower < 0.05) return
    let px = this.forkX, py = this.forkY
    let pvx = vx, pvy = vy
    const dt = 0.05
    for (let i = 0; i < 30; i++) {
      pvy += GRAVITY * dt; px += pvx * dt; py += pvy * dt
      if (py > this.scale.height + 50 || px < -50 || px > this.scale.width + 50) break
      if (i % 2 === 0) {
        g.fillStyle(0xF8A030, (1 - i / 30) * 0.8)
        g.fillCircle(px, py, Math.max(2, 4 - i * 0.08))
      }
    }
  }

  // ── 발사 ──
  private fire(vx: number, vy: number) {
    this.projectiles.push(new Projectile(this, this.forkX, this.forkY, vx, vy))
  }

  // ── 스폰 ──
  private spawnBird() {
    const { width } = this.scale
    this.birds.push(new Bird(this, width + 50, Phaser.Math.Between(110, 620),
      this.gm.getBirdSpeed(this.gm.currentLevel)))
  }

  // ── 명중 이펙트 ──
  private spawnHitEffect(x: number, y: number) {
    const g = this.add.graphics().setDepth(20)
    g.fillStyle(0xF8A030, 0.8); g.fillCircle(0, 0, 28); g.setPosition(x, y)
    const txt = this.add.text(x, y - 20, '💥', { fontSize: '28px' }).setOrigin(0.5).setDepth(21)
    this.tweens.add({
      targets: [g, txt], alpha: 0, scaleX: 2.2, scaleY: 2.2,
      duration: 380, ease: 'Power2',
      onComplete: () => { g.destroy(); txt.destroy() },
    })
  }

  // ── 메인 업데이트 ──
  update(_time: number, delta: number) {
    const ptr    = this.input.activePointer
    const isDown = ptr.isDown

    if (isDown && !this.wasDown) {
      this.isDragging = true
      this.dragStartX = ptr.x; this.dragStartY = ptr.y
      this.dragVx = 0; this.dragVy = 0; this.dragPower = 0
    }

    if (isDown && this.isDragging) {
      const dx   = ptr.x - this.dragStartX
      const dy   = ptr.y - this.dragStartY
      const dist = Math.min(Math.sqrt(dx * dx + dy * dy), MAX_DRAG)
      this.dragPower = dist / MAX_DRAG
      if (dist > 2) {
        const angle = Math.atan2(dy, dx)
        const speed = this.dragPower * SLING_BASE_SPEED
        this.dragVx = -Math.cos(angle) * speed
        this.dragVy = -Math.sin(angle) * speed
        const r = dist / Math.sqrt(dx * dx + dy * dy)
        this.drawRubber(dx * r * (dist / MAX_DRAG) * 0.65, dy * r * (dist / MAX_DRAG) * 0.65)
        this.drawTrajectory(this.dragVx, this.dragVy)
        this.gaugeBar.setPower(this.dragPower * 100)

        // 새총 이미지 조준 방향으로 약간 기울기
        const tiltAngle = Phaser.Math.RadToDeg(Math.atan2(dy, dx)) * 0.08
        this.slingshotImg.setAngle(Phaser.Math.Clamp(tiltAngle, -12, 12))
      }
    }

    if (!isDown && this.wasDown && this.isDragging) {
      if (this.dragPower > 0.04) this.fire(this.dragVx, this.dragVy)
      this.isDragging = false; this.dragPower = 0
      this.drawRubber(0, 0)
      this.trajectoryGfx.clear()
      this.gaugeBar.setPower(0)
      this.slingshotImg.setAngle(0)
    }

    this.wasDown = isDown

    // 새 스폰
    this.birdSpawnTimer += delta
    if (this.birdSpawnTimer >= this.birdSpawnInterval) {
      this.spawnBird(); this.birdSpawnTimer = 0
      this.birdSpawnInterval = Math.max(700, this.birdSpawnInterval - 40)
    }

    // 새 업데이트
    for (let i = this.birds.length - 1; i >= 0; i--) {
      const bird = this.birds[i]
      bird.update(delta)
      if (bird.isOutOfBounds()) {
        bird.destroy(); this.birds.splice(i, 1)
        const result = this.gm.onMiss()
        this.hud.update(this.gm.currentLevel, this.gm.currentHits,
          this.gm.getTargetHits(this.gm.currentLevel), this.gm.currentMisses)
        if (result === 'gameover') { this.scene.start('GameOverScene'); return }
      }
    }

    // 투사체 업데이트 + 충돌
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const proj = this.projectiles[i]
      proj.update(delta)
      if (proj.isOutOfBounds()) { proj.destroy(); this.projectiles.splice(i, 1); continue }
      for (let j = this.birds.length - 1; j >= 0; j--) {
        const bird = this.birds[j]
        if (Phaser.Math.Distance.Between(proj.x, proj.y, bird.x, bird.y) < bird.hitRadius) {
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
