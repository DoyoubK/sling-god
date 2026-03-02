import Phaser from 'phaser'
import { GameManager } from '../utils/GameManager'
import { createButton } from '../ui/Button'
import { TDS } from '../constants/TDS'

export class GameOverScene extends Phaser.Scene {
  constructor() { super({ key: 'GameOverScene' }) }

  create() {
    const { width, height } = this.scale
    const gm = GameManager.getInstance()

    this.add.rectangle(width / 2, height / 2, width, height, TDS.color.bg)

    // 상단 구분선
    this.add.rectangle(width / 2, height * 0.18, width, 2, TDS.color.lightGray)

    this.add.text(width / 2, height * 0.28, '😢', { fontSize: '56px' }).setOrigin(0.5)

    this.add.text(width / 2, height * 0.4, '아쉽네요!', {
      fontSize: '34px', fontFamily: TDS.font.family,
      color: TDS.color.css.dark, fontStyle: 'bold',
    }).setOrigin(0.5)

    this.add.text(width / 2, height * 0.49, `Lv.${gm.currentLevel} 도전 실패`, {
      fontSize: '19px', fontFamily: TDS.font.family,
      color: TDS.color.css.gray,
    }).setOrigin(0.5)

    // 명중 수 기록
    this.add.text(width / 2, height * 0.56, `이번 명중: ${gm.currentHits}마리`, {
      fontSize: '16px', fontFamily: TDS.font.family,
      color: TDS.color.css.blue, fontStyle: 'bold',
    }).setOrigin(0.5)

    // 광고 버튼 (이어하기)
    createButton({
      scene: this, x: width / 2, y: height * 0.67,
      label: '📺  광고 보고 이어하기', variant: 'primary',
      onClick: () => {
        // TODO: 앱인토스 보상형 광고 SDK 연동
        gm.resetForRetry()
        this.scene.start('GameScene')
      }
    })

    // 재시작 버튼
    createButton({
      scene: this, x: width / 2, y: height * 0.78,
      label: '처음부터 다시', variant: 'secondary',
      onClick: () => {
        gm.fullReset()
        this.scene.start('MainMenuScene')
      }
    })

    // 대기 시간 안내
    this.add.text(width / 2, height * 0.88, '⏳ 또는 15분 후 자동 충전', {
      fontSize: '13px', fontFamily: TDS.font.family,
      color: TDS.color.css.gray,
    }).setOrigin(0.5)
  }
}
