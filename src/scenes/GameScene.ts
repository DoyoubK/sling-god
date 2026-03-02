import Phaser from 'phaser'
import { GameManager } from '../utils/GameManager'
import { Bird } from '../objects/Bird'
import { Projectile } from '../objects/Projectile'
import { HUD } from '../ui/HUD'
import { GaugeBar } from '../ui/GaugeBar'
import { TDS } from '../constants/TDS'

const SLING_BASE_SPEED = 520
const MAX_DRAG         = 130
const GRAVITY          = 320

// saechong.png (2048x2048) 기준 갈래 끝 픽셀 좌표 (실측값)
const IMG_SIZE          = 2048
const IMG_ORIGIN_X      = 0.5    // setOrigin x
const IMG_ORIGIN_Y      = 0.84   // setOrigin y (손잡이 하단 기준)
const LEFT_FORK_IMG_X   = 910
const LEFT_FORK_IMG_Y   = 310    // 갈래 끝에서 고무줄 묶이는 위치
const RIGHT_FORK_IMG_X  = 1524
const RIGHT_FORK_IMG_Y  = 310

export class GameScene extends Phaser.Scene {
  private gm!: GameManager
  private birds: Bird[] = []
  private projectiles: Projectile[] = []

  private hud!: HUD
  private gaugeBar!: GaugeBar

  // 새총 이미지
  private slingshotImg!: Phaser.GameObjects.Image
  private imgScale!: number
  private slingshotX!: number
  private slingshotY!: number

  // 계산된 갈래 끝 화면 좌표 (imgToScreen 결과)
  private leftForkX!:  number
  private leftForkY!:  number
  private rightForkX!: number
  private rightForkY!: number

  // 돌 기본 위치 (갈래 중간)
  private stoneRestX!: number
  private stoneRestY!: number

  // 드래그 상태
  private wasDown    = false
  private dragStartX = 0
  private dragStartY = 0
  private isDragging = false
  private stoneX!: number   // 현재 돌 위치
  private stoneY!: number
  private dragPower  = 0

  // 그래픽
  private rubberGfx!:     Phaser.GameObjects.Graphics
  private trajectoryGfx!: Phaser.GameObjects.Graphics

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
    this.slingshotY = height - 60

    // 배경
    this.add.rectangle(width / 2, height / 2, width, height, TDS.color.bg)

    // 그래픽 레이어 (새총 뒤/앞)
    this.trajectoryGfx = this.add.graphics().setDepth(3)
    this.rubberGfx     = this.add.graphics().setDepth(7)  // 이미지보다 앞

    // 새총 이미지 배치
    const imgDisplayW = width * 0.46
    this.imgScale = imgDisplayW / IMG_SIZE

    this.slingshotImg = this.add.image(this.slingshotX, this.slingshotY, 'saechong')
      .setScale(this.imgScale)
      .setOrigin(IMG_ORIGIN_X, IMG_ORIGIN_Y)
      .setDepth(5)

    // 갈래 끝 화면 좌표 계산
    this.calcForkPositions()

    // 돌 기본 위치 = 갈래 중간 + 약간 아래 (파우치)
    this.stoneRestX = (this.leftForkX + this.rightForkX) / 2
    this.stoneRestY = (this.leftForkY + this.rightForkY) / 2 + 14
    this.stoneX = this.stoneRestX
    this.stoneY = this.stoneRestY

    // UI
    this.hud = new HUD(this)
    this.hud.update(this.gm.currentLevel, this.gm.currentHits,
      this.gm.getTargetHits(this.gm.currentLevel), this.gm.currentMisses)
    this.gaugeBar = new GaugeBar(this)

    this.drawRubber()
  }

  // ── 이미지 픽셀 → 화면 좌표 변환 ──
  private imgToScreen(imgX: number, imgY: number): { x: number; y: number } {
    const anchorImgX = IMG_SIZE * IMG_ORIGIN_X
    const anchorImgY = IMG_SIZE * IMG_ORIGIN_Y
    return {
      x: this.slingshotX + (imgX - anchorImgX) * this.imgScale,
      y: this.slingshotY + (imgY - anchorImgY) * this.imgScale,
    }
  }

  private calcForkPositions() {
    const L = this.imgToScreen(LEFT_FORK_IMG_X,  LEFT_FORK_IMG_Y)
    const R = this.imgToScreen(RIGHT_FORK_IMG_X, RIGHT_FORK_IMG_Y)
    this.leftForkX  = L.x; this.leftForkY  = L.y
    this.rightForkX = R.x; this.rightForkY = R.y
  }

  // ── 고무줄 + 돌 그리기 ──
  private drawRubber() {
    const rb = this.rubberGfx
    rb.clear()

    const sx = this.stoneX
    const sy = this.stoneY

    // 고무줄 (갈래끝 → 돌)
    rb.lineStyle(3.5, 0x2A1A0A, 0.95)
    rb.beginPath(); rb.moveTo(this.leftForkX,  this.leftForkY);  rb.lineTo(sx, sy); rb.strokePath()
    rb.beginPath(); rb.moveTo(this.rightForkX, this.rightForkY); rb.lineTo(sx, sy); rb.strokePath()

    // 고무줄 안쪽 하이라이트
    rb.lineStyle(1.5, 0x6B3A1A, 0.6)
    rb.beginPath(); rb.moveTo(this.leftForkX,  this.leftForkY);  rb.lineTo(sx, sy); rb.strokePath()
    rb.beginPath(); rb.moveTo(this.rightForkX, this.rightForkY); rb.lineTo(sx, sy); rb.strokePath()

    // 파우치 (돌 주머니)
    rb.fillStyle(0x3A1A08)
    rb.fillRect(sx - 7, sy - 2, 14, 9)
    rb.fillStyle(0x5C2E12)
    rb.fillRect(sx - 5, sy - 1, 10, 6)

    // 돌멩이
    rb.fillStyle(0x5A6068); rb.fillRect(sx - 8, sy - 9, 16, 16)
    rb.fillStyle(0x7A8490); rb.fillRect(sx - 6, sy - 7, 11, 11)
    rb.fillStyle(0x9AAAB4); rb.fillRect(sx - 4, sy - 6,  6,  6)
    rb.fillStyle(0xB8C8D0); rb.fillRect(sx - 3, sy - 5,  3,  3)  // 하이라이트

    // 드래그 중이면 불꽃
    if (this.isDragging && this.dragPower > 0.15) {
      const fp = this.dragPower
      rb.fillStyle(0xF8D848, fp); rb.fillRect(sx - 4, sy - 16, 8, 9)
      rb.fillStyle(0xF8A030, fp); rb.fillRect(sx - 3, sy - 13, 6, 7)
      rb.fillStyle(0xE86420, fp); rb.fillRect(sx - 2, sy - 10, 4, 5)
      // 스파크
      rb.fillStyle(0xFFFFCC, fp * 0.8)
      rb.fillRect(sx - 9, sy - 14, 2, 2)
      rb.fillRect(sx + 7, sy - 12, 2, 2)
      rb.fillRect(sx - 6, sy - 18, 2, 2)
    }
  }

  // ── 점선 궤적 ──
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
        const alpha = (1 - i / 28) * 0.75
        g.fillStyle(0xF8A030, alpha)
        g.fillCircle(px, py, Math.max(2, 4 - i * 0.1))
      }
    }
  }

  // ── 발사 ──
  private fire(vx: number, vy: number) {
    this.projectiles.push(new Projectile(this, this.stoneX, this.stoneY, vx, vy))
    // 발사 시 새총 반동 애니메이션
    this.tweens.add({
      targets: this.slingshotImg,
      angle: -4, duration: 80, yoyo: true, ease: 'Power2',
    })
  }

  // ── 스폰 ──
  private spawnBird() {
    const { width } = this.scale
    this.birds.push(new Bird(this, width + 50,
      Phaser.Math.Between(100, 600), this.gm.getBirdSpeed(this.gm.currentLevel)))
  }

  // ── 명중 이펙트 ──
  private spawnHitEffect(x: number, y: number) {
    const g = this.add.graphics().setDepth(20)
    g.fillStyle(0xF8A030, 0.8); g.fillCircle(0, 0, 28); g.setPosition(x, y)
    const txt = this.add.text(x, y - 20, '💥', { fontSize: '28px' }).setOrigin(0.5).setDepth(21)
    this.tweens.add({
      targets: [g, txt], alpha: 0, scaleX: 2.2, scaleY: 2.2, duration: 380, ease: 'Power2',
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
      this.dragPower  = 0
    }

    if (isDown && this.isDragging) {
      const dx   = ptr.x - this.dragStartX
      const dy   = ptr.y - this.dragStartY
      const dist = Math.sqrt(dx * dx + dy * dy)
      const clamped = Math.min(dist, MAX_DRAG)
      this.dragPower = clamped / MAX_DRAG

      if (dist > 1) {
        const nx = dx / dist   // 정규화
        const ny = dy / dist
        // 돌 위치 = 기본 위치에서 드래그 방향으로 이동 (반대방향 = 당기는 방향)
        this.stoneX = this.stoneRestX + nx * clamped
        this.stoneY = this.stoneRestY + ny * clamped

        // 발사 벡터 = 당긴 반대 방향
        const speed = this.dragPower * SLING_BASE_SPEED
        const vx    = -nx * speed
        const vy    = -ny * speed

        this.drawRubber()
        this.drawTrajectory(vx, vy)
        this.gaugeBar.setPower(this.dragPower * 100)

        // 새총 이미지 기울기 (살짝만)
        const tilt = Phaser.Math.Clamp(dx * 0.03, -8, 8)
        this.slingshotImg.setAngle(tilt)
      }
    }

    if (!isDown && this.wasDown && this.isDragging) {
      if (this.dragPower > 0.04) {
        const dx = this.stoneX - this.stoneRestX
        const dy = this.stoneY - this.stoneRestY
        const dist = Math.sqrt(dx * dx + dy * dy)
        const speed = this.dragPower * SLING_BASE_SPEED
        const vx = -(dx / dist) * speed
        const vy = -(dy / dist) * speed
        this.fire(vx, vy)
      }
      // 돌 복귀 애니메이션
      this.tweens.add({
        targets: { x: this.stoneX, y: this.stoneY },
        x: this.stoneRestX, y: this.stoneRestY,
        duration: 120, ease: 'Power2',
        onUpdate: (tween) => {
          const t = tween.targets[0] as { x: number; y: number }
          this.stoneX = t.x; this.stoneY = t.y
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

    // 새 스폰
    this.birdSpawnTimer += delta
    if (this.birdSpawnTimer >= this.birdSpawnInterval) {
      this.spawnBird(); this.birdSpawnTimer = 0
      this.birdSpawnInterval = Math.max(700, this.birdSpawnInterval - 40)
    }

    // 새 업데이트 + 경계 이탈
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
