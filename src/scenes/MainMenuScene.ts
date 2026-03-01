import Phaser from 'phaser'
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

    this.drawSky(width, height)
    this.drawClouds(width, height)
    this.drawScenery(width, height)   // 사실적인 나무/풀밭
    this.drawSlingshot(width, height)
    this.drawTitleCard(width, height)
    this.initFlyBird(width, height)

    this.cameras.main.fadeIn(450, 74, 150, 204)
  }

  // ── 하늘 그라디언트 ──────────────────────────
  private drawSky(w: number, h: number) {
    const g = this.add.graphics().setDepth(0)
    const skyH = h * 0.72
    // 위(진한 파랑) → 아래(연한 하늘) 50단계
    for (let i = 0; i < 50; i++) {
      const t  = i / 50
      const r  = Math.round(0x3A + (0x87 - 0x3A) * t)
      const gv = Math.round(0x7A + (0xC8 - 0x7A) * t)
      const b  = Math.round(0xBE + (0xF0 - 0xBE) * t)
      g.fillStyle(Phaser.Display.Color.GetColor(r, gv, b))
      g.fillRect(0, skyH / 50 * i, w, skyH / 50 + 1)
    }
    // 지면 색
    g.fillStyle(0x5A8A3C); g.fillRect(0, skyH, w, h - skyH)
  }

  // ── 구름 (부드러운 원형) ─────────────────────
  private drawClouds(w: number, _h: number) {
    const clouds = [
      { x: w*0.13, y: 55,  s: 1.1, spd: 14000 },
      { x: w*0.58, y: 38,  s: 0.85,spd: 19000 },
      { x: w*0.83, y: 80,  s: 0.65,spd: 24000 },
      { x: w*0.35, y: 110, s: 0.5, spd: 20000 },
    ]
    clouds.forEach(c => {
      const g = this.add.graphics().setDepth(1)
      this.paintCloud(g, c.x, c.y, c.s)
      this.tweens.add({ targets: g, x: `-=${18*c.s}`, duration: c.spd, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' })
    })
  }

  private paintCloud(g: Phaser.GameObjects.Graphics, cx: number, cy: number, s: number) {
    const r = 26 * s
    g.fillStyle(0xFFFFFF, 0.92)
    // 여러 원으로 뭉게구름 표현
    const pts:[number,number,number][] = [[0,0,1],[r*0.9,-r*0.3,0.85],[-r*0.85,-r*0.25,0.8],[r*1.7,r*0.1,0.72],[-r*1.6,r*0.15,0.65],[r*0.3,-r*0.55,0.6]]
    pts.forEach(([dx,dy,rs]) => { g.fillCircle(cx+dx, cy+dy, r*rs) })
    // 하단 그림자
    g.fillStyle(0xD0DFF0, 0.35)
    g.fillEllipse(cx, cy+r*0.6, r*3.2, r*0.7)
  }

  // ── 사실적인 나무/풀 배경 ───────────────────
  private drawScenery(w: number, h: number) {
    const g   = this.add.graphics().setDepth(2)
    const gy  = h * 0.72   // 지면 y

    // ── 먼 배경 언덕 (3겹) ──
    g.fillStyle(0x4A7A2E, 0.6)
    g.fillEllipse(w*0.22, gy+10, w*0.55, 80)
    g.fillStyle(0x3D6828, 0.7)
    g.fillEllipse(w*0.78, gy+15, w*0.50, 70)
    g.fillStyle(0x518C32, 0.5)
    g.fillEllipse(w*0.5,  gy+5,  w*0.70, 90)

    // ── 잔디 ──
    g.fillStyle(0x5A8A3C); g.fillRect(0, gy, w, h-gy)
    g.fillStyle(0x6AAA44); g.fillRect(0, gy, w, 6)
    // 풀 디테일
    for (let x = 0; x < w; x += 9) {
      const h1 = 4 + (x*7%11)
      g.fillStyle(0x7AC050); g.fillRect(x, gy-h1, 2, h1)
      g.fillStyle(0x5A9038); g.fillRect(x+3, gy-h1*0.7, 2, h1*0.7)
    }

    // ── 왼쪽 큰 나무 ──
    this.drawRealisticTree(g, w*0.08, gy, 1.15, 0)
    this.drawRealisticTree(g, w*0.18, gy, 0.75, 1)

    // ── 오른쪽 나무 ──
    this.drawRealisticTree(g, w*0.88, gy, 1.2,  2)
    this.drawRealisticTree(g, w*0.97, gy, 0.7,  0)

    // ── 덤불 ──
    this.drawBush(g, w*0.28, gy)
    this.drawBush(g, w*0.72, gy)
  }

  private drawRealisticTree(g: Phaser.GameObjects.Graphics, x: number, groundY: number, scale: number, variant: number) {
    const trunkH = (110 + variant*15) * scale
    const trunkW = (14 + variant*2)  * scale

    // 나무 기둥 (그라데이션 느낌 - 3겹)
    g.fillStyle(0x4A2C0E); g.fillRect(x - trunkW*0.6, groundY - trunkH, trunkW*1.2, trunkH)
    g.fillStyle(0x6B3E14); g.fillRect(x - trunkW*0.35, groundY - trunkH, trunkW*0.7, trunkH)
    g.fillStyle(0x8B5220); g.fillRect(x - trunkW*0.15, groundY - trunkH*0.6, trunkW*0.25, trunkH*0.6)

    // 뿌리 퍼짐
    g.fillStyle(0x4A2C0E)
    g.fillTriangle(x-trunkW*0.6, groundY, x-trunkW*1.8, groundY, x-trunkW*0.4, groundY-trunkH*0.15)
    g.fillTriangle(x+trunkW*0.6, groundY, x+trunkW*1.8, groundY, x+trunkW*0.4, groundY-trunkH*0.15)

    // 잎 군 (여러 원형 레이어)
    const leafY  = groundY - trunkH
    const radius = (55 + variant*12) * scale

    // 그림자 레이어 (어두운 초록)
    g.fillStyle(0x2A5A18)
    g.fillCircle(x+radius*0.15, leafY+radius*0.2, radius*0.95)

    // 메인 잎 레이어들
    const leafColors = [0x3A7A20, 0x4A9028, 0x5AA832, 0x6AC03C]
    const offsets: [number,number,number][] = [
      [0, 0, 1.0],
      [-radius*0.5, radius*0.15, 0.78],
      [radius*0.5,  radius*0.1,  0.75],
      [radius*0.1, -radius*0.35, 0.7],
      [-radius*0.3,-radius*0.2,  0.62],
      [radius*0.35,-radius*0.15, 0.6],
    ]
    offsets.forEach(([dx, dy, rs], i) => {
      g.fillStyle(leafColors[Math.min(i, leafColors.length-1)])
      g.fillCircle(x+dx, leafY+dy, radius*rs)
    })

    // 하이라이트 (밝은 초록, 빛 방향)
    g.fillStyle(0x7AD840, 0.5)
    g.fillCircle(x - radius*0.25, leafY - radius*0.3, radius*0.38)
  }

  private drawBush(g: Phaser.GameObjects.Graphics, x: number, groundY: number) {
    g.fillStyle(0x2A5A18); g.fillCircle(x,      groundY-14, 22)
    g.fillStyle(0x3A7A22); g.fillCircle(x-16,   groundY-10, 18)
    g.fillStyle(0x3A7A22); g.fillCircle(x+18,   groundY-10, 16)
    g.fillStyle(0x4A9028); g.fillCircle(x-6,    groundY-18, 16)
    g.fillStyle(0x5AA030); g.fillCircle(x+8,    groundY-20, 14)
    g.fillStyle(0x6AC03A, 0.6); g.fillCircle(x-8, groundY-22, 10)
  }

  // ── 새총 장식 ────────────────────────────────
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
