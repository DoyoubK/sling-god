import Phaser from 'phaser'
import { GameManager } from '../utils/GameManager'
import { Bird } from '../objects/Bird'
import { Projectile } from '../objects/Projectile'

export class GameScene extends Phaser.Scene {
  private gm!: GameManager
  private birds: Bird[] = []
  private projectiles: Projectile[] = []
  private isHolding: boolean = false
  private power: number = 0

  // HUD elements
  private levelText!: Phaser.GameObjects.Text
  private scoreText!: Phaser.GameObjects.Text
  private gaugeBar!: Phaser.GameObjects.Rectangle
  private missIcons: Phaser.GameObjects.Text[] = []

  private birdSpawnTimer: number = 0
  private birdSpawnInterval: number = 2000 // ms

  constructor() {
    super({ key: 'GameScene' })
  }

  create() {
    this.gm = GameManager.getInstance()
    this.birds = []
    this.projectiles = []
    this.isHolding = false
    this.power = 0

    this.createHUD()
    this.createSlingshot()
    this.setupInput()
  }

  createHUD() {
    const { width } = this.scale

    // 상단 HUD 배경
    this.add.rectangle(width / 2, 40, width, 80, 0xFFFFFF).setDepth(10)

    // 레벨 표시
    this.levelText = this.add.text(20, 20, `Lv. ${this.gm.currentLevel}`, {
      fontSize: '18px', fontFamily: 'sans-serif', color: '#191F28', fontStyle: 'bold'
    }).setDepth(11)

    // 점수 표시
    this.scoreText = this.add.text(width / 2, 20, this.getScoreText(), {
      fontSize: '18px', fontFamily: 'sans-serif', color: '#3182F6', fontStyle: 'bold'
    }).setOrigin(0.5, 0).setDepth(11)

    // Miss 아이콘 (하트)
    this.updateMissIcons()

    // 하단 게이지 바 배경
    this.add.rectangle(width / 2, 820, width, 40, 0xE5E8EB).setDepth(10)
    this.gaugeBar = this.add.rectangle(0, 820, 0, 36, 0x3182F6).setOrigin(0, 0.5).setDepth(11)
  }

  updateMissIcons() {
    const { width } = this.scale
    this.missIcons.forEach(i => i.destroy())
    this.missIcons = []

    for (let i = 0; i < GameManager.MAX_MISSES; i++) {
      const icon = this.add.text(
        width - 30 - i * 30, 20,
        i < this.gm.currentMisses ? '✕' : '❤️',
        { fontSize: '18px' }
      ).setDepth(11)
      this.missIcons.push(icon)
    }
  }

  createSlingshot() {
    const { width, height } = this.scale
    // 새총 (간단한 Y자 모양)
    this.add.rectangle(width / 2, height - 120, 8, 80, 0x8B4513).setDepth(5)
    this.add.rectangle(width / 2 - 20, height - 160, 8, 40, 0x8B4513)
      .setRotation(-0.3).setDepth(5)
    this.add.rectangle(width / 2 + 20, height - 160, 8, 40, 0x8B4513)
      .setRotation(0.3).setDepth(5)
  }

  setupInput() {
    this.input.on('pointerdown', () => { this.isHolding = true })
    this.input.on('pointerup', () => {
      if (this.isHolding) {
        this.fire()
        this.isHolding = false
        this.power = 0
        this.gaugeBar.width = 0
      }
    })
  }

  fire() {
    if (this.power < 5) return
    const { width, height } = this.scale
    const p = new Projectile(this, width / 2, height - 160, this.power)
    this.projectiles.push(p)
  }

  getScoreText(): string {
    return `${this.gm.currentHits} / ${this.gm.getTargetHits(this.gm.currentLevel)}`
  }

  update(_time: number, delta: number) {
    const { width } = this.scale

    // 게이지 충전
    if (this.isHolding) {
      this.power = Math.min(this.power + 60 * (delta / 1000), 100)
      this.gaugeBar.width = (this.power / 100) * width
      const ratio = this.power / 100
      const color = Phaser.Display.Color.Interpolate.ColorWithColor(
        { r: 49, g: 130, b: 246 } as any,
        { r: 239, g: 68, b: 68 } as any,
        100, ratio * 100
      )
      this.gaugeBar.setFillStyle(
        Phaser.Display.Color.GetColor(color.r, color.g, color.b)
      )
    }

    // 새 스폰
    this.birdSpawnTimer += delta
    if (this.birdSpawnTimer >= this.birdSpawnInterval) {
      this.spawnBird()
      this.birdSpawnTimer = 0
      this.birdSpawnInterval = Math.max(800, this.birdSpawnInterval - 50)
    }

    // 새 업데이트
    for (let i = this.birds.length - 1; i >= 0; i--) {
      const bird = this.birds[i]
      bird.update(delta)

      if (bird.isOutOfBounds()) {
        bird.destroy()
        this.birds.splice(i, 1)
        const result = this.gm.onMiss()
        this.updateMissIcons()
        if (result === 'gameover') {
          this.scene.start('GameOverScene')
          return
        }
      }
    }

    // 투사체 업데이트 + 충돌 체크
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const proj = this.projectiles[i]
      proj.update(delta)

      if (proj.isOutOfBounds()) {
        proj.destroy()
        this.projectiles.splice(i, 1)
        continue
      }

      // 충돌 체크
      for (let j = this.birds.length - 1; j >= 0; j--) {
        const bird = this.birds[j]
        const dist = Phaser.Math.Distance.Between(proj.x, proj.y, bird.x, bird.y)
        if (dist < 28) {
          proj.destroy(); this.projectiles.splice(i, 1)
          bird.destroy(); this.birds.splice(j, 1)

          const result = this.gm.onHit()
          this.scoreText.setText(this.getScoreText())

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

  spawnBird() {
    const { width } = this.scale
    const y = Phaser.Math.Between(100, 600)
    const bird = new Bird(this, width + 30, y, this.gm.getBirdSpeed(this.gm.currentLevel))
    this.birds.push(bird)
  }
}
