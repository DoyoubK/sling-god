import Phaser from 'phaser'
import { drawBackground } from '../ui/SceneBackground'
import { GameManager } from '../utils/GameManager'
import { createButton } from '../ui/Button'
import { TDS } from '../constants/TDS'

export class MainMenuScene extends Phaser.Scene {
  // 날아다니는 새 상태
  private flyX = 0; private flyY = 0; private flyVx = 0
  private wingPhase = 0; private tweetTimer = 0; private showTweet = false
  private birdImg?: Phaser.GameObjects.Image
  private bubbleGfx!: Phaser.GameObjects.Graphics
  private tweetTxt!:  Phaser.GameObjects.Text

  constructor() { super({ key: 'MainMenuScene' }) }

  preload() {
    if (!this.textures.exists('saechong'))  this.load.image('saechong',  'assets/saechong.png')
    if (!this.textures.exists('bird_sparrow')) this.load.image('bird_sparrow', 'assets/bird_sparrow.png')
  }

  create() {
    const { width, height } = this.scale

    drawBackground(this)
    this.drawSlingshot(width, height)
    this.drawTitleCard(width, height)
    this.initFlyBird(width, height)

    this.cameras.main.fadeIn(450, 74, 150, 204)
  }


  private drawSlingshot(w: number, h: number) {
    if (!this.textures.exists('saechong')) return
    const g   = this.add.graphics().setDepth(3)
    const sx  = w * 0.5
    const sy  = h * 0.72

    // 땅에 박힌 그림자
    g.fillStyle(0x000000, 0.18)
    g.fillEllipse(sx - w*0.02, sy+4, w*0.14, 10)

    const img = this.add.image(sx - w*0.02, sy, 'saechong')
      .setDisplaySize(w*0.28, w*0.28)
      .setOrigin(0.5, 0.93)
      .setDepth(4)

    // 살짝 좌우 흔들기
    this.tweens.add({
      targets: img, angle: -2, duration: 2200,
      yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
    })
  }

  // ── 타이틀 카드 ──────────────────────────────
  private drawTitleCard(w: number, h: number) {
    const cy = h * 0.16

    const card = this.add.graphics().setDepth(5)
    card.fillStyle(0x1A2A3A, 0.85)
    card.fillRoundedRect(w/2-155, cy-40, 310, 90, 16)
    card.lineStyle(2.5, 0xFFFFFF, 0.85)
    card.strokeRoundedRect(w/2-155, cy-40, 310, 90, 16)
    // 코너 금색 점
    const corners:{x:number,y:number}[] = [{x:w/2-155,y:cy-40},{x:w/2+155,y:cy-40},{x:w/2-155,y:cy+50},{x:w/2+155,y:cy+50}]
    corners.forEach(c2 => { card.fillStyle(0xF8D848); card.fillCircle(c2.x, c2.y, 4) })

    // 타이틀 텍스트 (그림자)
    this.add.text(w/2+2, cy-8, '새총의 신', {
      fontSize: '42px', fontFamily: TDS.font.family, color: '#000000', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(6).setAlpha(0.35)
    this.add.text(w/2, cy-10, '새총의 신', {
      fontSize: '42px', fontFamily: TDS.font.family, color: '#FFFFFF', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(7)
    this.add.text(w/2, cy+30, '날아가는 새를 맞혀라!', {
      fontSize: '14px', fontFamily: TDS.font.family, color: '#A8D4F0',
    }).setOrigin(0.5).setDepth(7)

    // 최고 기록
    const gm = GameManager.getInstance()
    if (gm.bestLevel > 1) {
      const bg2 = this.add.graphics().setDepth(5)
      bg2.fillStyle(0xF8A030, 0.92)
      bg2.fillRoundedRect(w/2-82, h*0.315, 164, 30, 8)
      this.add.text(w/2, h*0.330, `★  최고 기록  Lv.${gm.bestLevel}`, {
        fontSize: '14px', fontFamily: TDS.font.family, color: '#FFFFFF', fontStyle: 'bold',
      }).setOrigin(0.5).setDepth(6)
    }

    // 게임 시작 버튼
    const btnY = h * 0.885
    const btn  = createButton({
      scene: this, x: w/2, y: btnY, width: 270, height: 56,
      label: '▶  게임 시작', variant: 'primary',
      onClick: () => { GameManager.getInstance().fullReset(); this.scene.start('GameScene') },
    }).setDepth(8)
    this.tweens.add({ targets: btn, scaleX: 1.04, scaleY: 1.04, duration: 850, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' })

    this.add.text(w/2, h*0.958, '드래그로 조준  ✦  손 떼면 발사', {
      fontSize: '12px', fontFamily: TDS.font.family, color: '#7CB3E0',
    }).setOrigin(0.5).setDepth(6)
  }

  // ── 날아다니는 참새 초기화 ──────────────────
  private initFlyBird(w: number, h: number) {
    this.flyX = w + 60
    this.flyY  = Phaser.Math.Between(50, Math.floor(h * 0.30))
    this.flyVx = -(Phaser.Math.Between(60, 100))
    this.wingPhase = 0; this.tweetTimer = 0; this.showTweet = false

    if (this.textures.exists('bird_sparrow')) {
      this.birdImg = this.add.image(this.flyX, this.flyY, 'bird_sparrow')
        .setDisplaySize(68, 68)
        .setFlipX(false)   // 오른쪽 보는 이미지 → 왼쪽으로 날아가니 FlipX=true
        .setDepth(9)
      this.birdImg.setFlipX(false)
    }

    this.bubbleGfx = this.add.graphics().setDepth(9)
    this.tweetTxt  = this.add.text(0, 0, '짹!', {
      fontSize: '12px', fontFamily: TDS.font.family, color: '#191F28', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(10).setVisible(false)
  }

  update(_t: number, delta: number) {
    if (!this.bubbleGfx) return
    const { width, height } = this.scale
    const dt = delta / 1000
    this.flyX  += this.flyVx * dt
    this.wingPhase += dt * 7

    // 화면 벗어나면 리셋
    if (this.flyX < -80) {
      this.flyX  = width + 60
      this.flyY  = Phaser.Math.Between(50, Math.floor(height * 0.30))
      this.flyVx = -(Phaser.Math.Between(60, 100))
    }

    // PNG 이미지 새
    if (this.birdImg) {
      this.birdImg.setPosition(this.flyX, this.flyY)
      // scaleY로 날갯짓 (위아래 찌그러짐)
      const ws = 0.80 + Math.abs(Math.sin(this.wingPhase)) * 0.40
      this.birdImg.setScale(68/2048, (68/2048) * ws)
      // 살짝 위아래 흔들기
      this.birdImg.y = this.flyY + Math.sin(this.wingPhase * 0.5) * 3
    }

    // 짹짹 말풍선
    this.bubbleGfx.clear()
    this.tweetTimer += dt
    if (this.tweetTimer > 2.8 && !this.showTweet) {
      this.showTweet = true; this.tweetTimer = 0
      const tweets = ['짹!', '짹짹!', '짹~♪', '짹짹짹!']
      this.tweetTxt.setText(tweets[Phaser.Math.Between(0, tweets.length-1)])
    }
    if (this.showTweet && this.tweetTimer < 1.3) {
      const alpha = this.tweetTimer < 0.9 ? 1 : 1-(this.tweetTimer-0.9)/0.4
      const bx = this.flyX, by = this.flyY
      this.bubbleGfx.fillStyle(0xFFFFFF, alpha); this.bubbleGfx.fillRoundedRect(bx-22, by-36, 44, 20, 6)
      this.bubbleGfx.fillStyle(0xFFFFFF, alpha); this.bubbleGfx.fillTriangle(bx-4, by-16, bx+4, by-16, bx, by-10)
      this.tweetTxt.setPosition(bx, by-26).setAlpha(alpha).setVisible(true)
    } else if (this.tweetTimer >= 1.3) {
      this.showTweet = false; this.tweetTxt.setVisible(false)
    }
  }
}
