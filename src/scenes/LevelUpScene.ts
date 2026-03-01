import Phaser from 'phaser'
import { GameManager } from '../utils/GameManager'

export class LevelUpScene extends Phaser.Scene {
  constructor() { super({ key: 'LevelUpScene' }) }

  create() {
    const { width, height } = this.scale
    const gm = GameManager.getInstance()

    this.add.rectangle(width / 2, height / 2, width, height, 0x3182F6)

    this.add.text(width / 2, height * 0.35, '🎉 레벨 업!', {
      fontSize: '44px', fontFamily: 'sans-serif', color: '#FFFFFF', fontStyle: 'bold'
    }).setOrigin(0.5)

    this.add.text(width / 2, height * 0.48, `Level ${gm.currentLevel}`, {
      fontSize: '28px', fontFamily: 'sans-serif', color: '#FFFFFF'
    }).setOrigin(0.5)

    this.add.text(width / 2, height * 0.56, `목표: ${gm.getTargetHits(gm.currentLevel)}마리`, {
      fontSize: '18px', fontFamily: 'sans-serif', color: '#C5DCF9'
    }).setOrigin(0.5)

    // 2초 후 자동으로 게임 씬으로
    this.time.delayedCall(2000, () => {
      this.scene.start('GameScene')
    })
  }
}
