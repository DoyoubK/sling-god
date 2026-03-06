import { SoundManager } from '../utils/SoundManager'
import Phaser from 'phaser'
import { GameManager } from '../utils/GameManager'
import { GameOverOverlay } from '../ui/overlays/GameOverOverlay'
import { loadFullScreenAd, showFullScreenAd } from '@apps-in-toss/web-framework'

export class GameOverScene extends Phaser.Scene {
  private overlay!: GameOverOverlay

  constructor() { super({ key: 'GameOverScene' }) }

  create() {
    SoundManager.getInstance().stopBgm()
    SoundManager.getInstance().playGameOver()
    const gm = GameManager.getInstance()

    this.add.rectangle(
      this.scale.width / 2, this.scale.height / 2,
      this.scale.width, this.scale.height,
      0xF9FAFB
    )

    // 게임오버 진입 시 전면광고 즉시 로드
    this._loadAd()

    this.overlay = new GameOverOverlay()
    this.overlay.showWithData(
      { level: gm.currentLevel, hits: gm.currentHits },
      {
        onAdRetry: () => this._showAdAndRetry(),
        onRestart: () => {
          gm.fullReset()
          this.overlay.destroy()
          this.scene.start('MainMenuScene')
        },
      }
    )
  }

  /** 전면 광고 사전 로드 */
  private _loadAd() {
    try {
      loadFullScreenAd({
        onEvent: () => {},
        onError: () => {},
      })
    } catch {
      // 샌드박스 / 비토스 환경에서는 무시
    }
  }

  /**
   * 전면광고 시청 → 부활 (무제한)
   * 광고 닫으면 부활, 광고 거부/오류 시 메인으로
   */
  private _showAdAndRetry() {
    const gm = GameManager.getInstance()

    try {
      showFullScreenAd({
        onEvent: (data: { type: string }) => {
          if (data.type === 'close' || data.type === 'complete') {
            // 광고 시청 완료 → 부활
            gm.resetForRetry()
            this.overlay.destroy()
            this.scene.start('GameScene')
          }
          if (data.type === 'skip') {
            // 광고 스킵 → 메인으로
            gm.fullReset()
            this.overlay.destroy()
            this.scene.start('MainMenuScene')
          }
        },
        onError: () => {
          // 광고 오류 → 메인으로
          gm.fullReset()
          this.overlay.destroy()
          this.scene.start('MainMenuScene')
        },
      })
    } catch {
      // 샌드박스 환경: 광고 없으므로 바로 부활 처리
      gm.resetForRetry()
      this.overlay.destroy()
      this.scene.start('GameScene')
    }
  }

  shutdown() {
    if (this.overlay) this.overlay.destroy()
  }
}
