import Phaser from 'phaser'
import { GameManager } from '../utils/GameManager'
import { createButton } from '../ui/Button'
import { TDS } from '../constants/TDS'

export class MainMenuScene extends Phaser.Scene {
  constructor() { super({ key: 'MainMenuScene' }) }

  create() {
    const { width, height } = this.scale

    this.add.rectangle(width / 2, height / 2, width, height, TDS.color.bg)

    // 새 장식들 (배경)
    this.drawDecoBirds(width, height)

    // 타이틀
    this.add.text(width / 2, height * 0.3, '🎯', {
      fontSize: '64px'
    }).setOrigin(0.5)

    this.add.text(width / 2, height * 0.42, '새총의 신', {
      fontSize: '48px', fontFamily: TDS.font.family,
      color: TDS.color.css.dark, fontStyle: 'bold',
    }).setOrigin(0.5)

    this.add.text(width / 2, height * 0.52, '날아가는 새를 맞혀라!', {
      fontSize: '17px', fontFamily: TDS.font.family,
      color: TDS.color.css.gray,
    }).setOrigin(0.5)

    // 새 종류 소개
    this.add.text(width / 2, height * 0.61, '🐦 참새  🦅 독수리  🕊️ 비둘기  🦜 앵무새  🦉 올빼미', {
      fontSize: '13px', fontFamily: TDS.font.family,
      color: TDS.color.css.gray,
    }).setOrigin(0.5)

    // 최고 레벨 표시
    const gm = GameManager.getInstance()
    if (gm.bestLevel > 1) {
      this.add.text(width / 2, height * 0.68, `🏆 최고 기록: Lv.${gm.bestLevel}`, {
        fontSize: '15px', fontFamily: TDS.font.family,
        color: TDS.color.css.warning,
        fontStyle: 'bold',
      }).setOrigin(0.5)
    }

    createButton({
      scene: this, x: width / 2, y: height * 0.78,
      label: '게임 시작', variant: 'primary',
      onClick: () => {
        GameManager.getInstance().fullReset()
        this.scene.start('GameScene')
      }
    })

    // 조작법 안내
    this.add.text(width / 2, height * 0.88, '💡 화면을 드래그해서 조준 후 손을 떼세요', {
      fontSize: '13px', fontFamily: TDS.font.family,
      color: TDS.color.css.gray,
    }).setOrigin(0.5)
  }

  private drawDecoBirds(width: number, _height: number) {
    // 배경 장식 새들 (간단한 원형)
    const decoColors = [0x8B6914, 0x4A3728, 0x9CA3AF, 0x22C55E, 0x6B4C3B]
    const positions = [
      { x: 40, y: 120 }, { x: width - 40, y: 150 },
      { x: 60, y: 220 }, { x: width - 60, y: 200 },
    ]
    positions.forEach((pos, i) => {
      const g = this.add.graphics().setAlpha(0.15)
      g.fillStyle(decoColors[i % decoColors.length])
      g.fillCircle(pos.x, pos.y, 16)
    })
  }
}
