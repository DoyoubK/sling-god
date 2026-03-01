import Phaser from 'phaser'
import { GameManager } from '../utils/GameManager'

export class GameOverScene extends Phaser.Scene {
  constructor() { super({ key: 'GameOverScene' }) }

  create() {
    const { width, height } = this.scale
    const gm = GameManager.getInstance()

    this.add.rectangle(width / 2, height / 2, width, height, 0xF9FAFB)

    this.add.text(width / 2, height * 0.3, '아쉽네요 😢', {
      fontSize: '36px', fontFamily: 'sans-serif', color: '#191F28', fontStyle: 'bold'
    }).setOrigin(0.5)

    this.add.text(width / 2, height * 0.42, `Lv.${gm.currentLevel} 도전 실패`, {
      fontSize: '20px', fontFamily: 'sans-serif', color: '#6B7684'
    }).setOrigin(0.5)

    // 보상형 광고 버튼 (Revive)
    const reviveBtn = this.add.rectangle(width / 2, height * 0.57, 280, 56, 0x3182F6)
      .setInteractive({ useHandCursor: true })
    this.add.text(width / 2, height * 0.57, '📺 광고 보고 이어하기', {
      fontSize: '17px', fontFamily: 'sans-serif', color: '#FFFFFF', fontStyle: 'bold'
    }).setOrigin(0.5)
    reviveBtn.on('pointerdown', () => {
      // TODO: 앱인토스 보상형 광고 SDK 호출
      gm.resetForRetry()
      this.scene.start('GameScene')
    })

    // 재시작 버튼
    const retryBtn = this.add.rectangle(width / 2, height * 0.68, 280, 56, 0xE5E8EB)
      .setInteractive({ useHandCursor: true })
    this.add.text(width / 2, height * 0.68, '처음부터 다시', {
      fontSize: '17px', fontFamily: 'sans-serif', color: '#191F28'
    }).setOrigin(0.5)
    retryBtn.on('pointerdown', () => {
      gm.fullReset()
      this.scene.start('MainMenuScene')
    })
  }
}
