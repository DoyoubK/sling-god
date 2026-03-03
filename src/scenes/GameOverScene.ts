import { SoundManager } from '../utils/SoundManager'
import Phaser from 'phaser'
import { GameManager } from '../utils/GameManager'
import { GameOverOverlay } from '../ui/overlays/GameOverOverlay'

export class GameOverScene extends Phaser.Scene {
  private overlay!: GameOverOverlay

  constructor() { super({ key: 'GameOverScene' }) }

  create() {
    SoundManager.getInstance().stopBgm()
    SoundManager.getInstance().playGameOver()
    const gm = GameManager.getInstance()

    // Plain background — overlay covers everything
    this.add.rectangle(
      this.scale.width / 2, this.scale.height / 2,
      this.scale.width, this.scale.height,
      0xF9FAFB
    )

    this.overlay = new GameOverOverlay()
    this.overlay.showWithData(
      { level: gm.currentLevel, hits: gm.currentHits },
      {
        onAdRetry: () => {
          // TODO: 앱인토스 보상형 광고 SDK 연동
          gm.resetForRetry()
          this.scene.start('GameScene')
        },
        onRestart: () => {
          gm.fullReset()
          this.scene.start('MainMenuScene')
        },
      }
    )
  }

  shutdown() {
    if (this.overlay) this.overlay.destroy()
  }
}
