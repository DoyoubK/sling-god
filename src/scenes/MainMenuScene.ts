import Phaser from 'phaser'

export class MainMenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MainMenuScene' })
  }

  create() {
    const { width, height } = this.scale

    // 배경
    this.add.rectangle(width / 2, height / 2, width, height, 0xF9FAFB)

    // 타이틀
    this.add.text(width / 2, height * 0.35, '새총의 신', {
      fontSize: '52px',
      fontFamily: 'sans-serif',
      color: '#191F28',
      fontStyle: 'bold',
    }).setOrigin(0.5)

    this.add.text(width / 2, height * 0.45, '🐦 날아가는 새를 맞혀라!', {
      fontSize: '18px',
      fontFamily: 'sans-serif',
      color: '#6B7684',
    }).setOrigin(0.5)

    // 시작 버튼 (TDS 스타일: 파란 버튼)
    const btn = this.add.rectangle(width / 2, height * 0.62, 280, 56, 0x3182F6, 1)
      .setInteractive({ useHandCursor: true })

    this.add.text(width / 2, height * 0.62, '게임 시작', {
      fontSize: '20px',
      fontFamily: 'sans-serif',
      color: '#FFFFFF',
      fontStyle: 'bold',
    }).setOrigin(0.5)

    btn.on('pointerdown', () => {
      this.scene.start('GameScene')
    })

    btn.on('pointerover', () => btn.setFillStyle(0x1C64D1))
    btn.on('pointerout', () => btn.setFillStyle(0x3182F6))
  }
}
