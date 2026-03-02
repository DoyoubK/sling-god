import Phaser from 'phaser'
import { GameManager } from '../utils/GameManager'
import { TDS } from '../constants/TDS'

export class LevelUpScene extends Phaser.Scene {
  constructor() { super({ key: 'LevelUpScene' }) }

  create() {
    const { width, height } = this.scale
    const gm = GameManager.getInstance()

    this.add.rectangle(width / 2, height / 2, width, height, TDS.color.blue)

    // 별 파티클 효과 (간단한 텍스트)
    const stars = ['⭐', '✨', '🌟']
    const starPos = [
      { x: 0.15, y: 0.2 }, { x: 0.85, y: 0.25 },
      { x: 0.1,  y: 0.55 }, { x: 0.9, y: 0.5  },
      { x: 0.2,  y: 0.75 }, { x: 0.8, y: 0.72 },
    ]
    starPos.forEach((p, i) => {
      const star = this.add.text(width * p.x, height * p.y, stars[i % stars.length], {
        fontSize: '22px'
      }).setOrigin(0.5).setAlpha(0)

      this.tweens.add({
        targets: star,
        alpha: 0.8,
        duration: 300,
        delay: i * 80,
        ease: 'Power1',
      })
    })

    // 레벨업 텍스트 (애니메이션)
    const levelUpText = this.add.text(width / 2, height * 0.35, '🎉 레벨 업!', {
      fontSize: '46px', fontFamily: TDS.font.family,
      color: TDS.color.css.white, fontStyle: 'bold',
    }).setOrigin(0.5).setScale(0.5).setAlpha(0)

    this.tweens.add({
      targets: levelUpText,
      scaleX: 1, scaleY: 1, alpha: 1,
      duration: 400,
      ease: 'Back.easeOut',
    })

    this.add.text(width / 2, height * 0.47, `Level ${gm.currentLevel}`, {
      fontSize: '30px', fontFamily: TDS.font.family,
      color: TDS.color.css.white,
    }).setOrigin(0.5)

    this.add.text(width / 2, height * 0.555, `목표: ${gm.getTargetHits(gm.currentLevel)}마리`, {
      fontSize: '19px', fontFamily: TDS.font.family,
      color: '#C5DCF9',
    }).setOrigin(0.5)

    // 속도 안내
    this.add.text(width / 2, height * 0.625, `새 속도 +${gm.currentLevel > 1 ? 30 : 0}  ↑`, {
      fontSize: '14px', fontFamily: TDS.font.family,
      color: '#A3C4F3',
    }).setOrigin(0.5)

    // 카운트다운
    let count = 3
    const countText = this.add.text(width / 2, height * 0.8, `${count}초 후 시작`, {
      fontSize: '16px', fontFamily: TDS.font.family,
      color: '#C5DCF9',
    }).setOrigin(0.5)

    const timer = this.time.addEvent({
      delay: 1000,
      repeat: 2,
      callback: () => {
        count--
        if (count > 0) {
          countText.setText(`${count}초 후 시작`)
        } else {
          timer.remove()
          this.scene.start('GameScene')
        }
      }
    })
  }
}
