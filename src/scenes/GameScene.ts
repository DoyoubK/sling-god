import Phaser from 'phaser'
import { drawBackground } from '../ui/SceneBackground'
import { GameManager } from '../utils/GameManager'
import { Bird } from '../objects/Bird'
import { Projectile } from '../objects/Projectile'
import { HUD } from '../ui/HUD'
import { GaugeBar } from '../ui/GaugeBar'

const SLING_BASE_SPEED = 900
const MAX_DRAG         = 130
const GRAVITY          = 320

// ── birdgun.png (2048x2048) 실측 상수 ──────────────
const IMG_SIZE     = 2048
const ORIGIN_X     = 0.649   // 손잡이 수평 중심 (64.9%)
const ORIGIN_Y     = 0.950   // 손잡이 하단 (95%)

// 갈래 끝 고무줄 연결 지점 (픽셀 좌표)
const L_FORK = { x: 992,  y: 310 }   // 왼쪽 갈래 내측 상단
const R_FORK = { x: 1582, y: 310 }   // 오른쪽 갈래 내측 상단
// ──────────────────────────────────────────────────

export class GameScene extends Phaser.Scene {
  private gm!: GameManager
  private birds: Bird[] = []
  private projectiles: Projectile[] = []
  private hud!: HUD
  private gaugeBar!: GaugeBar

  // 새총
  private slingshotImg!: Phaser.GameObjects.Image
  private imgScale!:     number
  private slingshotX!:   number
  private slingshotY!:   number

  // 갈래 끝 화면 좌표 (create 시 계산)
  private lfx!: number; private lfy!: number   // left fork
  private rfx!: number; private rfy!: number   // right fork

  // 돌 위치
  private stoneRestX!: number
  private stoneRestY!: number
  private stoneX!:     number
  private stoneY!:     number

  // 드래그
  private wasDown    = false
  private dragStartX = 0
  private dragStartY = 0
  private isDragging = false
  private dragPower  = 0

  // 그래픽
  private rubberGfx!:     Phaser.GameObjects.Graphics
  private trajectoryGfx!: Phaser.GameObjects.Graphics

  // 스폰
  private birdSpawnTimer    = 0

  constructor() { super({ key: 'GameScene' }) }

  preload() {
    if (!this.textures.exists('bird_sparrow')) { this.load.image('bird_sparrow', 'assets/bird_sparrow.png') }
    if (!this.textures.exists('bird_pigeon'))  { this.load.image('bird_pigeon',  'assets/bird_pigeon.png')  }
    if (!this.textures.exists('birdgun'))
      this.load.image('birdgun', 'assets/birdgun.png')
  }

  create() {
    this.gm = GameManager.getInstance()
    this.birds = []; this.projectiles = []
    this.wasDown = false; this.isDragging = false
    this.dragPower = 0; this.birdSpawnTimer = 0

    const { width, height } = this.scale

    // 새총 배치 기준점 (손잡이 중심이 여기에 앉음)
    this.slingshotX = width * 0.44   // 이미지 offset 보정 (우측 치우침 보상)
    this.slingshotY = height - 18

    // 배경
    drawBackground(this)

    // 그래픽 레이어
    this.trajectoryGfx = this.add.graphics().setDepth(3)
    this.rubberGfx     = this.add.graphics().setDepth(7)

    // 새총 이미지
    const displayW    = width * 0.60
    this.imgScale     = displayW / IMG_SIZE

    this.slingshotImg = this.add.image(this.slingshotX, this.slingshotY, 'birdgun')
      .setScale(this.imgScale)
      .setOrigin(ORIGIN_X, ORIGIN_Y)
      .setDepth(5)

    // 갈래 끝 화면 좌표 계산
    this.calcForks()

    // 돌 기본 위치 (갈래 중간 파우치)
    this.stoneRestX = (this.lfx + this.rfx) / 2
    this.stoneRestY = (this.lfy + this.rfy) / 2 + 16
    this.stoneX = this.stoneRestX
    this.stoneY = this.stoneRestY

    // UI
    this.hud = new HUD(this)
    this.hud.update(this.gm.currentLevel, this.gm.currentHits,
      this.gm.getTargetHits(this.gm.currentLevel), this.gm.currentMisses)
    this.gaugeBar = new GaugeBar(this)

    this.drawRubber()
  }

  // ── 이미지 픽셀 → 화면 좌표 ──────────────────
  private imgPxToScreen(px: number, py: number) {
    return {
      x: this.slingshotX + (px - IMG_SIZE * ORIGIN_X) * this.imgScale,
      y: this.slingshotY + (py - IMG_SIZE * ORIGIN_Y) * this.imgScale,
    }
  }

  private calcForks() {
    const L = this.imgPxToScreen(L_FORK.x, L_FORK.y)
    const R = this.imgPxToScreen(R_FORK.x, R_FORK.y)
    this.lfx = L.x; this.lfy = L.y
    this.rfx = R.x; this.rfy = R.y
  }

  // ── 고무줄 + 돌 그리기 ────────────────────────
  private drawRubber() {
    const rb = this.rubberGfx
    rb.clear()
    const sx = this.stoneX, sy = this.stoneY

    // 고무줄 외곽 (두꺼운 어두운 선)
    rb.lineStyle(5, 0x1A0A00, 0.9)
    rb.beginPath(); rb.moveTo(this.lfx, this.lfy); rb.lineTo(sx, sy); rb.strokePath()
    rb.beginPath(); rb.moveTo(this.rfx, this.rfy); rb.lineTo(sx, sy); rb.strokePath()

    // 고무줄 내부 (밝은 갈색)
    rb.lineStyle(3, 0x7B3B0A, 0.95)
    rb.beginPath(); rb.moveTo(this.lfx, this.lfy); rb.lineTo(sx, sy); rb.strokePath()
    rb.beginPath(); rb.moveTo(this.rfx, this.rfy); rb.lineTo(sx, sy); rb.strokePath()

    // 파우치
    rb.fillStyle(0x2A1200); rb.fillRect(sx - 8,  sy - 3,  16, 11)
    rb.fillStyle(0x5C2800); rb.fillRect(sx - 6,  sy - 1,  12, 8)
    rb.fillStyle(0x7A3A10); rb.fillRect(sx - 4,  sy,      8,  5)

    // 돌멩이
    rb.fillStyle(0x4A5058); rb.fillRect(sx - 10, sy - 12, 20, 20)
    rb.fillStyle(0x6A7480); rb.fillRect(sx - 8,  sy - 10, 16, 16)
    rb.fillStyle(0x8A9AA4); rb.fillRect(sx - 5,  sy - 8,  10, 10)
    rb.fillStyle(0xAABAC4); rb.fillRect(sx - 3,  sy - 7,  5,  5)
    rb.fillStyle(0xCCDCE4); rb.fillRect(sx - 2,  sy - 6,  2,  2)   // 하이라이트

    // 파워 세질수록 불꽃
    if (this.isDragging && this.dragPower > 0.12) {
      const p = this.dragPower
      rb.fillStyle(0xF8D848, p);    rb.fillRect(sx - 5, sy - 22, 10, 11)
      rb.fillStyle(0xF8A030, p);    rb.fillRect(sx - 4, sy - 18, 8,  9)
      rb.fillStyle(0xE86420, p);    rb.fillRect(sx - 3, sy - 14, 6,  7)
      rb.fillStyle(0xFFFFCC, p*0.7); rb.fillRect(sx-11, sy-16,  2,  2)
      rb.fillStyle(0xFFFFCC, p*0.7); rb.fillRect(sx+9,  sy-14,  2,  2)
    }
  }

  // ── 점선 궤적 ────────────────────────────────
  private drawTrajectory(vx: number, vy: number) {
    const g = this.trajectoryGfx
    g.clear()
    if (!this.isDragging || this.dragPower < 0.05) return
    let px = this.stoneX, py = this.stoneY
    let pvx = vx, pvy = vy
    const dt = 0.05
    for (let i = 0; i < 28; i++) {
      pvy += GRAVITY * dt; px += pvx * dt; py += pvy * dt
      if (py > this.scale.height + 50 || px < -50 || px > this.scale.width + 50) break
      if (i % 2 === 0) {
        g.fillStyle(0xF8A030, (1 - i / 28) * 0.72)
        g.fillCircle(px, py, Math.max(2, 4 - i * 0.1))
      }
    }
  }

  // ── 발사 ─────────────────────────────────────
  private fire(vx: number, vy: number) {
    this.projectiles.push(new Projectile(this, this.stoneX, this.stoneY, vx, vy))
    this.tweens.add({
      targets: this.slingshotImg,
      angle: -5, duration: 70, yoyo: true, ease: 'Power3',
    })
  }

  // ── 새 스폰 ──────────────────────────────────
  private spawnBird() {
    this.birds.push(new Bird(this,
      this.scale.width + 50,
      Phaser.Math.Between(100, 600),
      this.gm.getBirdSpeed(this.gm.currentLevel)))
  }

  // ── 명중 이펙트 ──────────────────────────────
  private spawnHitEffect(x: number, y: number) {
    const g = this.add.graphics().setDepth(20)
    g.fillStyle(0xF8A030, 0.8); g.fillCircle(0, 0, 28); g.setPosition(x, y)
    const txt = this.add.text(x, y - 20, '💥', { fontSize: '28px' }).setOrigin(0.5).setDepth(21)
    this.tweens.add({
      targets: [g, txt], alpha: 0, scaleX: 2.2, scaleY: 2.2, duration: 380, ease: 'Power2',
      onComplete: () => { g.destroy(); txt.destroy() },
    })
  }

  // ── 업데이트 ─────────────────────────────────
  update(_t: number, delta: number) {
    const ptr    = this.input.activePointer
    const isDown = ptr.isDown

    // 드래그 시작
    if (isDown && !this.wasDown) {
      this.isDragging = true
      this.dragStartX = ptr.x; this.dragStartY = ptr.y
      this.dragPower  = 0
    }

    // 드래그 중
    if (isDown && this.isDragging) {
      const dx   = ptr.x - this.dragStartX
      const dy   = ptr.y - this.dragStartY
      const dist = Math.sqrt(dx * dx + dy * dy)
      const clamped = Math.min(dist, MAX_DRAG)
      this.dragPower = clamped / MAX_DRAG

      if (dist > 1) {
        const nx = dx / dist
        const ny = dy / dist
        this.stoneX = this.stoneRestX + nx * clamped
        this.stoneY = this.stoneRestY + ny * clamped
        this.drawRubber()
        this.drawTrajectory(-nx * this.dragPower * SLING_BASE_SPEED,
                            -ny * this.dragPower * SLING_BASE_SPEED)
        this.gaugeBar.setPower(this.dragPower * 100)
        this.slingshotImg.setAngle(Phaser.Math.Clamp(dx * 0.025, -7, 7))
      }
    }

    // 손 뗌 → 발사
    if (!isDown && this.wasDown && this.isDragging) {
      if (this.dragPower > 0.04) {
        const dx = this.stoneX - this.stoneRestX
        const dy = this.stoneY - this.stoneRestY
        const dist = Math.sqrt(dx * dx + dy * dy) || 1
        this.fire(-(dx/dist)*this.dragPower*SLING_BASE_SPEED,
                  -(dy/dist)*this.dragPower*SLING_BASE_SPEED)
      }
      // 돌 복귀
      const fromX = this.stoneX, fromY = this.stoneY
      const obj   = { t: 0 }
      this.tweens.add({
        targets: obj, t: 1, duration: 110, ease: 'Back.easeOut',
        onUpdate: () => {
          this.stoneX = fromX + (this.stoneRestX - fromX) * obj.t
          this.stoneY = fromY + (this.stoneRestY - fromY) * obj.t
          this.drawRubber()
        },
        onComplete: () => {
          this.stoneX = this.stoneRestX; this.stoneY = this.stoneRestY
          this.drawRubber()
        },
      })
      this.isDragging = false; this.dragPower = 0
      this.trajectoryGfx.clear()
      this.gaugeBar.setPower(0)
      this.slingshotImg.setAngle(0)
    }

    this.wasDown = isDown

    // 새 스폰 (화면에 한 마리만)
    if (this.birds.length === 0) {
      this.birdSpawnTimer += delta
      const interval = this.gm.currentLevel === 1
        ? 3000
        : Math.max(1200, 3000 - (this.gm.currentLevel - 2) * 200)
      if (this.birdSpawnTimer >= interval) {
        this.spawnBird(); this.birdSpawnTimer = 0
      }
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
        if (result === 'gameover') {
          this.cameras.main.shake(350, 0.012)
          const { width, height } = this.scale
          const flash = this.add.rectangle(width/2, height/2, width, height, 0xFF0000, 0.45)
          this.tweens.add({ targets: flash, alpha: 0, duration: 400, ease: 'Power2',
            onComplete: () => { flash.destroy(); this.scene.start('GameOverScene') } })
          return
        }
      }
    }

    // 투사체 + 충돌
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const proj = this.projectiles[i]
      proj.update(delta)
      if (proj.isOutOfBounds()) { proj.destroy(); this.projectiles.splice(i, 1); continue }
      for (let j = this.birds.length - 1; j >= 0; j--) {
        const bird = this.birds[j]
        if (Phaser.Math.Distance.Between(proj.x, proj.y, bird.x, bird.y) < bird.hitRadius) {
          this.spawnHitEffect(bird.x, bird.y)
          proj.destroy(); this.projectiles.splice(i, 1)
          bird.playHitAnimation(() => {})
          this.birds.splice(j, 1)
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
