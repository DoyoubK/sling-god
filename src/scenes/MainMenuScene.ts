import Phaser from 'phaser'
import { GameManager } from '../utils/GameManager'
import { createButton } from '../ui/Button'
import { TDS } from '../constants/TDS'

// 픽셀 아트 팔레트 (sling_god.png 기반)
const P = {
  sky1:      0x4A96CC,  // 하늘 상단 진한 파랑
  sky2:      0x7EC4E8,  // 하늘 하단 연한 파랑
  cloud1:    0xE8EEF2,  // 구름 밝은
  cloud2:    0xC8D8E4,  // 구름 어두운
  wood1:     0xA47044,  // 나무 밝은
  wood2:     0x6B4226,  // 나무 중간
  wood3:     0x4A2C18,  // 나무 어두운 (윤곽)
  rope:      0x4A3018,  // 밧줄
  metal:     0xA0A0A0,  // 금속 밝은
  metal2:    0x606060,  // 금속 어두운
  fire1:     0xF8D848,  // 불꽃 노랑
  fire2:     0xF8A030,  // 불꽃 주황
  fire3:     0xE86420,  // 불꽃 빨강
  ground1:   0x7A6244,  // 지면 밝은
  ground2:   0x5C4830,  // 지면 어두운
  spark:     0xFFFFCC,  // 스파크 흰노랑
  stone:     0x909090,  // 돌
  stone2:    0x606870,  // 돌 어두운
}

export class MainMenuScene extends Phaser.Scene {
  private flyBirdX   = 0
  private flyBirdY   = 0
  private flyBirdVx  = 0
  private wingPhase  = 0
  private birdGfx!:   Phaser.GameObjects.Graphics
  private bubbleGfx!: Phaser.GameObjects.Graphics
  private tweetTxt!:  Phaser.GameObjects.Text
  private tweetTimer = 0
  private showTweet  = false

  constructor() { super({ key: 'MainMenuScene' }) }

  create() {
    const { width, height } = this.scale

    // ── 1. 하늘 픽셀 그라디언트 ──
    this.drawPixelSky(width, height)

    // ── 2. 구름 ──
    this.drawPixelClouds(width)

    // ── 3. 지면 + 성벽 ──
    this.drawGround(width, height)

    // ── 4. 메인 새총 (중앙) ──
    this.drawMainSlingshot(width, height)

    // ── 5. 발사 이펙트 (불꽃/파편) ──
    this.drawFireEffect(width, height)

    // ── 6. 타이틀 (픽셀 스타일 카드) ──
    this.drawTitleCard(width, height)

    // ── 7. 날아다니는 새 초기화 ──
    this.initFlyingBird(width, height)

    // ── 8. 페이드인 ──
    this.cameras.main.fadeIn(500, 74, 150, 204)
  }

  // ── 하늘 (위→아래 파랑 그라디언트 + 픽셀 느낌) ──
  private drawPixelSky(w: number, h: number) {
    const g = this.add.graphics().setDepth(0)
    const steps = 40  // 픽셀 블록 느낌 (적은 단계수)
    const skyH  = h * 0.78
    for (let i = 0; i < steps; i++) {
      const t  = i / steps
      const y  = (skyH / steps) * i
      const bh = skyH / steps + 1
      const r  = Math.round(0x4A + (0x7E - 0x4A) * t)
      const gv = Math.round(0x96 + (0xC4 - 0x96) * t)
      const b  = Math.round(0xCC + (0xE8 - 0xCC) * t)
      g.fillStyle(Phaser.Display.Color.GetColor(r, gv, b))
      g.fillRect(0, y, w, bh)
    }
  }

  // ── 구름 (픽셀 블록) ──
  private drawPixelClouds(w: number) {
    const clouds = [
      { x: w * 0.12, y: 60,  s: 1.1, speed: 14000 },
      { x: w * 0.62, y: 40,  s: 0.8, speed: 18000 },
      { x: w * 0.82, y: 90,  s: 0.65,speed: 22000 },
    ]
    clouds.forEach(c => {
      const g = this.add.graphics().setDepth(1)
      this.drawPixelCloud(g, c.x, c.y, c.s)
      this.tweens.add({
        targets: g, x: `-=${22 * c.s}`,
        duration: c.speed, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
      })
    })
  }

  private drawPixelCloud(g: Phaser.GameObjects.Graphics, x: number, y: number, s: number) {
    // 픽셀 블록으로 구름 그리기 (8px 격자)
    const px = 7
    const blocks = [
      [1,1],[2,1],[3,1],[4,1],
      [0,0],[1,0],[2,0],[3,0],[4,0],[5,0],
      [1,-1],[2,-1],[3,-1],
    ]
    blocks.forEach(([bx, by]) => {
      const size = px * s
      // 밝은 색 (상단)
      g.fillStyle(P.cloud1)
      g.fillRect(x + bx * size, y + by * size, size, size)
      // 어두운 색 (하단 테두리 느낌)
      if (by === 1 || (by === 0 && bx === 0) || (by === 0 && bx === 5)) {
        g.fillStyle(P.cloud2)
        g.fillRect(x + bx * size, y + by * size + size * 0.6, size, size * 0.4)
      }
    })
  }

  // ── 지면 + 간단한 성벽 ──
  private drawGround(w: number, h: number) {
    const g = this.add.graphics().setDepth(2)
    const gy = h * 0.78

    // 지면 기본
    g.fillStyle(P.ground1)
    g.fillRect(0, gy, w, h - gy)
    // 지면 어두운 띠
    g.fillStyle(P.ground2)
    g.fillRect(0, gy, w, 6)
    // 잔디 밝은 점묘
    g.fillStyle(0x8DB85A)
    for (let x = 0; x < w; x += 12) {
      g.fillRect(x, gy - 3, 6, 3)
      g.fillRect(x + 4, gy - 5, 4, 2)
    }

    // 왼쪽 성벽 돌
    const stoneColor = [0xA09080, 0x887060, 0xC0B0A0]
    const stoneW = 36, stoneH = 22
    for (let row = 0; row < 3; row++) {
      const offset = row % 2 === 0 ? 0 : stoneW / 2
      for (let col = -1; col < 3; col++) {
        const sx = col * stoneW + offset - 10
        const sy = gy + row * stoneH
        g.fillStyle(stoneColor[row % stoneColor.length])
        g.fillRect(sx, sy, stoneW - 2, stoneH - 2)
        g.fillStyle(P.ground2)
        g.fillRect(sx, sy, stoneW - 2, 2)
        g.fillRect(sx, sy, 2, stoneH - 2)
      }
    }

    // 오른쪽 성벽 돌
    for (let row = 0; row < 3; row++) {
      const offset = row % 2 === 0 ? 0 : stoneW / 2
      for (let col = 0; col < 4; col++) {
        const sx = w - 120 + col * stoneW + offset
        const sy = gy + row * stoneH
        g.fillStyle(stoneColor[row % stoneColor.length])
        g.fillRect(sx, sy, stoneW - 2, stoneH - 2)
        g.fillStyle(P.ground2)
        g.fillRect(sx, sy, stoneW - 2, 2)
        g.fillRect(sx, sy, 2, stoneH - 2)
      }
    }
  }

  // ── 메인 새총 (픽셀 스타일) ──
  private drawMainSlingshot(w: number, h: number) {
    const g  = this.add.graphics().setDepth(3)
    const sx = w / 2
    const sy = h * 0.72

    // 받침대 나무 (픽셀 블록)
    const drawWood = (x: number, y: number, bw: number, bh: number) => {
      g.fillStyle(P.wood1); g.fillRect(x, y, bw, bh)
      g.fillStyle(P.wood2); g.fillRect(x, y, 3, bh)  // 왼쪽 테두리
      g.fillStyle(P.wood3); g.fillRect(x, y, bw, 2)  // 상단 테두리
    }

    // 손잡이
    drawWood(sx - 9, sy, 18, 80)
    // 금속 볼트
    g.fillStyle(P.metal); g.fillRect(sx - 5, sy + 20, 10, 6)
    g.fillStyle(P.metal2); g.fillRect(sx - 5, sy + 20, 10, 2)

    // 왼쪽 갈래
    drawWood(sx - 30, sy - 60, 16, 68)
    // 왼쪽 갈래 꺾임 (대각선 픽셀)
    for (let i = 0; i < 10; i++) {
      g.fillStyle(P.wood1)
      g.fillRect(sx - 30 + i, sy - 68 - i, 14 - i, 8)
    }

    // 오른쪽 갈래
    drawWood(sx + 14, sy - 60, 16, 68)
    for (let i = 0; i < 10; i++) {
      g.fillStyle(P.wood1)
      g.fillRect(sx + 14 + i, sy - 68 - i, 14 - i, 8)
    }

    // 금속 장식 (갈래 끝)
    g.fillStyle(P.metal)
    g.fillRect(sx - 34, sy - 66, 22, 8)
    g.fillRect(sx + 12, sy - 66, 22, 8)
    g.fillStyle(P.metal2)
    g.fillRect(sx - 34, sy - 66, 22, 3)
    g.fillRect(sx + 12, sy - 66, 22, 3)

    // 밧줄 (갈래→돌)
    const bx = sx - 24  // 돌 위치 (왼쪽으로 당겨진 상태)
    const by = sy - 90
    g.lineStyle(3, P.rope)
    g.beginPath(); g.moveTo(sx - 26, sy - 64); g.lineTo(bx, by); g.strokePath()
    g.beginPath(); g.moveTo(sx + 24, sy - 64); g.lineTo(bx, by); g.strokePath()

    // 돌 (불붙은)
    g.fillStyle(P.stone2); g.fillRect(bx - 12, by - 12, 24, 24)  // 어두운 베이스
    g.fillStyle(P.stone);  g.fillRect(bx - 10, by - 10, 20, 18)  // 밝은 중간
    g.fillStyle(0xB0B8C0); g.fillRect(bx - 6,  by - 8,  10, 8)   // 하이라이트
  }

  // ── 불꽃 + 파편 이펙트 ──
  private drawFireEffect(w: number, h: number) {
    const g  = this.add.graphics().setDepth(4)
    const bx = w / 2 - 24
    const by = h * 0.72 - 90

    // 불꽃 픽셀들
    const flames = [
      { dx: 0, dy: -14, c: P.fire1, s: 8 },
      { dx: -6, dy: -10, c: P.fire2, s: 6 },
      { dx: 6, dy: -10, c: P.fire2, s: 6 },
      { dx: -3, dy: -18, c: P.fire3, s: 5 },
      { dx: 3, dy: -20, c: P.fire1, s: 4 },
      { dx: 8, dy: -14, c: P.fire3, s: 4 },
    ]
    flames.forEach(f => {
      g.fillStyle(f.c)
      g.fillRect(bx + f.dx - f.s / 2, by + f.dy, f.s, f.s)
    })

    // 스파크 파편
    const sparks = [
      { dx: -18, dy: -22, c: P.spark }, { dx: -24, dy: -16, c: P.fire1 },
      { dx: 14,  dy: -26, c: P.spark }, { dx: 20,  dy: -18, c: P.fire2 },
      { dx: -8,  dy: -28, c: P.fire1 }, { dx: -30, dy: -8,  c: P.fire3 },
    ]
    sparks.forEach(s => {
      g.fillStyle(s.c)
      g.fillRect(bx + s.dx, by + s.dy, 3, 3)
    })

    // 불꽃 깜빡 애니메이션
    this.tweens.add({
      targets: g, alpha: 0.7, duration: 200,
      yoyo: true, repeat: -1, ease: 'Stepped',
    })

    // 속도선 (발사 궤적 암시)
    const lineG = this.add.graphics().setDepth(3).setAlpha(0.55)
    const linesData = [
      { x1: bx - 10, y1: by - 12, x2: bx - 55, y2: by - 58, c: 0xFFFFFF },
      { x1: bx - 8,  y1: by - 8,  x2: bx - 50, y2: by - 50, c: 0xC8E8FF },
      { x1: bx - 6,  y1: by - 16, x2: bx - 40, y2: by - 60, c: 0xFFFFFF },
    ]
    linesData.forEach(l => {
      lineG.lineStyle(2, l.c)
      lineG.beginPath(); lineG.moveTo(l.x1, l.y1); lineG.lineTo(l.x2, l.y2); lineG.strokePath()
    })
  }

  // ── 타이틀 카드 ──
  private drawTitleCard(w: number, h: number) {
    const cy = h * 0.18

    // 픽셀 스타일 어두운 박스 (테두리 흰색)
    const card = this.add.graphics().setDepth(5)
    card.fillStyle(0x1A2A3A, 0.82)
    card.fillRect(w / 2 - 152, cy - 38, 304, 86)
    // 픽셀 테두리
    card.lineStyle(3, 0xFFFFFF, 0.9)
    card.strokeRect(w / 2 - 152, cy - 38, 304, 86)
    // 코너 강조 (픽셀 아트 스타일)
    card.fillStyle(P.fire1)
    card.fillRect(w / 2 - 152, cy - 38, 6, 6)
    card.fillRect(w / 2 + 146, cy - 38, 6, 6)
    card.fillRect(w / 2 - 152, cy + 42, 6, 6)
    card.fillRect(w / 2 + 146, cy + 42, 6, 6)

    // 타이틀 텍스트
    // 그림자 (픽셀 오프셋)
    this.add.text(w / 2 + 3, cy - 8, '새총의 신', {
      fontSize: '40px', fontFamily: TDS.font.family,
      color: '#000000', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(6).setAlpha(0.5)

    this.add.text(w / 2, cy - 10, '새총의 신', {
      fontSize: '40px', fontFamily: TDS.font.family,
      color: '#FFFFFF', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(7)

    // 서브 텍스트
    this.add.text(w / 2, cy + 28, '날아가는 새를 맞혀라!', {
      fontSize: '14px', fontFamily: TDS.font.family,
      color: '#A8D4F0',
    }).setOrigin(0.5).setDepth(7)

    // 최고 기록 뱃지
    const gm = GameManager.getInstance()
    if (gm.bestLevel > 1) {
      const badgeY = h * 0.335
      const bg2 = this.add.graphics().setDepth(5)
      bg2.fillStyle(P.fire2, 0.9)
      bg2.fillRect(w / 2 - 80, badgeY - 14, 160, 28)
      bg2.lineStyle(2, P.fire1)
      bg2.strokeRect(w / 2 - 80, badgeY - 14, 160, 28)
      this.add.text(w / 2, badgeY, `★  최고 기록  Lv.${gm.bestLevel}`, {
        fontSize: '14px', fontFamily: TDS.font.family,
        color: '#FFFFFF', fontStyle: 'bold',
      }).setOrigin(0.5).setDepth(6)
    }

    // 게임 시작 버튼 (픽셀 스타일)
    const btnY = h * 0.88
    const btn  = createButton({
      scene: this, x: w / 2, y: btnY,
      width: 260, height: 54,
      label: '▶  게임 시작', variant: 'primary',
      onClick: () => { GameManager.getInstance().fullReset(); this.scene.start('GameScene') },
    }).setDepth(8)

    // 버튼 주위 픽셀 테두리 효과
    const btnDeco = this.add.graphics().setDepth(7)
    btnDeco.lineStyle(2, P.fire1, 0.7)
    btnDeco.strokeRect(w / 2 - 132, btnY - 28, 264, 56)

    this.tweens.add({
      targets: btn, scaleX: 1.04, scaleY: 1.04,
      duration: 800, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
    })

    // 힌트
    this.add.text(w / 2, h * 0.956, '드래그로 조준  ✦  손 떼면 발사', {
      fontSize: '12px', fontFamily: TDS.font.family, color: '#7CB3E0',
    }).setOrigin(0.5).setDepth(6)
  }

  // ── 날아다니는 새 초기화 ──
  private initFlyingBird(w: number, _h: number) {
    this.flyBirdX  = w + 50
    this.flyBirdY  = 80
    this.flyBirdVx = -(Phaser.Math.Between(55, 85))
    this.wingPhase = 0
    this.tweetTimer = 0
    this.showTweet  = false

    this.birdGfx   = this.add.graphics().setDepth(9)
    this.bubbleGfx = this.add.graphics().setDepth(9)
    this.tweetTxt  = this.add.text(0, 0, '짹!', {
      fontSize: '11px', fontFamily: TDS.font.family,
      color: '#191F28', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(10).setVisible(false)
  }

  // ── 업데이트: 날아다니는 새 ──
  update(_time: number, delta: number) {
    if (!this.birdGfx) return
    const { width, height } = this.scale
    const dt = delta / 1000

    this.flyBirdX  += this.flyBirdVx * dt
    this.wingPhase += dt * 8

    // 화면 벗어나면 오른쪽에서 다시
    if (this.flyBirdX < -60) {
      this.flyBirdX  = width + 50
      this.flyBirdY  = Phaser.Math.Between(55, Math.floor(height * 0.3))
      this.flyBirdVx = -(Phaser.Math.Between(55, 85))
    }

    // 새 그리기 (픽셀 스타일)
    const bx = this.flyBirdX, by = this.flyBirdY
    this.birdGfx.clear()

    // 날개 (픽셀 블록)
    const wingDy = Math.sin(this.wingPhase) * 5
    this.birdGfx.fillStyle(0x6B4C0A)
    this.birdGfx.fillRect(bx - 14, by - 4 - wingDy, 12, 5)  // 왼 날개
    this.birdGfx.fillRect(bx +  4, by - 4 - wingDy, 10, 5)  // 오른 날개

    // 몸통 (픽셀 3단계)
    this.birdGfx.fillStyle(0x8B6914); this.birdGfx.fillRect(bx - 6, by - 5, 14, 10)
    this.birdGfx.fillStyle(0xA07820); this.birdGfx.fillRect(bx - 4, by - 4, 10, 6)
    // 눈
    this.birdGfx.fillStyle(0x191F28); this.birdGfx.fillRect(bx - 3, by - 3, 3, 3)
    this.birdGfx.fillStyle(0xFFFFFF); this.birdGfx.fillRect(bx - 2, by - 3, 1, 1)
    // 부리
    this.birdGfx.fillStyle(P.fire2); this.birdGfx.fillRect(bx - 10, by - 1, 5, 3)
    // 꼬리
    this.birdGfx.fillStyle(0x6B4C0A)
    this.birdGfx.fillRect(bx + 7, by - 2, 6, 3)
    this.birdGfx.fillRect(bx + 9, by + 2, 4, 2)

    // 짹짹 말풍선
    this.tweetTimer += dt
    this.bubbleGfx.clear()

    if (this.tweetTimer > 2.5 && !this.showTweet) {
      this.showTweet  = true
      this.tweetTimer = 0
      const tweets = ['짹!', '짹짹!', '짹~♪', '짹짹짹!']
      this.tweetTxt.setText(tweets[Phaser.Math.Between(0, tweets.length - 1)])
    }

    if (this.showTweet && this.tweetTimer < 1.2) {
      const alpha = this.tweetTimer < 0.8 ? 1 : 1 - (this.tweetTimer - 0.8) / 0.4
      this.bubbleGfx.fillStyle(0xFFFFFF, alpha)
      this.bubbleGfx.fillRect(bx - 20, by - 28, 40, 18)
      this.bubbleGfx.fillStyle(0xCCCCCC, alpha)
      this.bubbleGfx.fillRect(bx - 20, by - 28, 40, 2)
      this.bubbleGfx.fillRect(bx - 20, by - 28, 2, 18)
      // 꼬리
      this.bubbleGfx.fillStyle(0xFFFFFF, alpha)
      this.bubbleGfx.fillRect(bx - 4, by - 10, 8, 5)
      this.tweetTxt.setPosition(bx, by - 19).setAlpha(alpha).setVisible(true)
    } else if (this.tweetTimer >= 1.2) {
      this.showTweet = false
      this.tweetTxt.setVisible(false)
    }
  }
}
