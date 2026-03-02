import Phaser from 'phaser'
// 앱인토스 SDK: 필요한 API를 개별 import해서 사용
// ex) import { appLogin, TossAds, getUserKeyForGame } from '@apps-in-toss/web-framework'
// granite.config.ts 에서 앱 이름/포트/빌드 명령 설정 완료
import { MainMenuScene } from './scenes/MainMenuScene'
import { GameScene } from './scenes/GameScene'
import { GameOverScene } from './scenes/GameOverScene'
import { LevelUpScene } from './scenes/LevelUpScene'

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 390,
  height: 844,
  backgroundColor: '#F9FAFB',
  parent: 'game-container',
  scene: [MainMenuScene, GameScene, GameOverScene, LevelUpScene],
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false,
    },
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
}

new Phaser.Game(config)
