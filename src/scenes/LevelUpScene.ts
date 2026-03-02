import Phaser from 'phaser'
import { GameManager } from '../utils/GameManager'
import { TDS } from '../constants/TDS'

export class LevelUpScene extends Phaser.Scene {
  constructor() { super({ key: 'LevelUpScene' }) }

  create() {
    const { width, height } = this.scale
    const gm = GameManager.getInstance()

    // 배경 (그라디언트 느낌 — 블루 오버레이)
    this.add.rectangle(width/2, height/2, width, height, 0x0A2A5A)
    const overlay = this.add.graphics()
    for (let i = 0; i < 30; i++) {
      const t = i / 30
      const alpha = 0.25 * (1 - t)
      overlay.fillStyle(0x1E6FD4, alpha)
      overlay.fillRect(0, height * t / 1.5, width, height / 30 + 1)
    }

    // 별 파티클 (애니메이션)
    const emojis = ['⭐', '✨', '🌟', '💫']
    const starPos = [
      [0.08, 0.12], [0.88, 0.15], [0.05, 0.50], [0.92, 0.45],
      [0.12, 0.80], [0.85, 0.75], [0.50, 0.08], [0.48, 0.90],
    ]
    starPos.forEach(([px, py], i) => {
      const star = this.add.text(width * px, height * py,
        emojis[i % emojis.length], { fontSize: '20px' })
        .setOrigin(0.5).setAlpha(0)

      this.tweens.add({
        targets: star, alpha: 0.85, duration: 350, delay: i * 70,
        ease: 'Power1', yoyo: true, repeat: -1, repeatDelay: 800 + i * 120,
      })
    })

    // 🎉 레벨업 텍스트 (펑!)
    const levelUpTxt = this.add.text(width/2, height * 0.26, '🎉 LEVEL UP!', {
      fontSize: '42px', fontFamily: TDS.font.family,
      color: '#FFD700', fontStyle: 'bold',
      stroke: '#7A4800', strokeThickness: 5,
    }).setOrigin(0.5).setScale(0.2).setAlpha(0)

    this.tweens.add({
      targets: levelUpTxt, scale: 1, alpha: 1,
      duration: 450, ease: 'Back.easeOut',
    })

    // 레벨 번호
    const levelTxt = this.add.text(width/2, height * 0.40, `Level  ${gm.currentLevel}`, {
      fontSize: '56px', fontFamily: TDS.font.family,
      color: '#FFFFFF', fontStyle: 'bold',
    }).setOrigin(0.5).setAlpha(0)

    this.tweens.add({
      targets: levelTxt, alpha: 1, duration: 400, delay: 200, ease: 'Power2',
    })

    // 목표 정보 카드
    const cardY = height * 0.56
    const card = this.add.graphics()
    card.fillStyle(0xFFFFFF, 0.10)
    card.fillRoundedRect(width * 0.12, cardY - 28, width * 0.76, 82, 14)
    card.lineStyle(1.5, 0xFFFFFF, 0.25)
    card.strokeRoundedRect(width * 0.12, cardY - 28, width * 0.76, 82, 14)
    card.setAlpha(0)
    this.tweens.add({ targets: card, alpha: 1, duration: 300, delay: 350 })

    this.add.text(width/2, cardY, `목표 : ${gm.getTargetHits(gm.currentLevel)}마리 명중`, {
      fontSize: '26px', fontFamily: TDS.font.family, color: '#FFFFFF', fontStyle: 'bold',
    }).setOrigin(0.5).setAlpha(0)
    .setDepth(1)



    // 카드 안 텍스트 딜레이 처리
    this.time.delayedCall(350, () => {
      this.children.list
        .filter(c => c instanceof Phaser.GameObjects.Text && (c as Phaser.GameObjects.Text).alpha === 0)
        .forEach(c => {
          this.tweens.add({ targets: c, alpha: 1, duration: 300 })
        })
    })

    // ── 시작 버튼 ──────────────────────────────────────────────
    const btnY = height * 0.78
    const btnW = width * 0.60
    const btnH = 56

    const btn = this.add.graphics()
    const drawBtn = (hover: boolean) => {
      btn.clear()
      // 버튼 그림자
      btn.fillStyle(0x000000, 0.25)
      btn.fillRoundedRect(width/2 - btnW/2 + 3, btnY - btnH/2 + 5, btnW, btnH, 28)
      // 버튼 본체
      btn.fillStyle(hover ? 0xFFE040 : 0xFFD700)
      btn.fillRoundedRect(width/2 - btnW/2, btnY - btnH/2, btnW, btnH, 28)
      // 버튼 상단 하이라이트
      btn.fillStyle(0xFFFFFF, 0.25)
      btn.fillRoundedRect(width/2 - btnW/2 + 6, btnY - btnH/2 + 4, btnW - 12, 18, 14)
    }
    drawBtn(false)

    const btnTxt = this.add.text(width/2, btnY, '▶  시작하기', {
      fontSize: '22px', fontFamily: TDS.font.family,
      color: '#7A4800', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(1)

    // 버튼 히트 영역
    const hitArea = this.add.zone(width/2, btnY, btnW, btnH)
      .setInteractive({ useHandCursor: true })

    hitArea.on('pointerover',  () => { drawBtn(true);  btnTxt.setScale(1.04) })
    hitArea.on('pointerout',   () => { drawBtn(false); btnTxt.setScale(1.0)  })
    hitArea.on('pointerdown',  () => {
      this.tweens.add({
        targets: [btn, btnTxt], scaleX: 0.95, scaleY: 0.95,
        duration: 80, yoyo: true, ease: 'Power1',
        onComplete: () => this.scene.start('GameScene'),
      })
    })

    // 버튼 등장 애니메이션
    btn.setAlpha(0); btnTxt.setAlpha(0)
    this.tweens.add({ targets: [btn, btnTxt], alpha: 1, duration: 400, delay: 500 })

    // 버튼 살짝 위아래 부유 효과
    this.tweens.add({
      targets: [btn, btnTxt], y: `+=6`,
      duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut', delay: 600,
    })

    this.cameras.main.fadeIn(300, 10, 42, 90)
  }
}
