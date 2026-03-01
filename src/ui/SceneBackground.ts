import Phaser from 'phaser'

/**
 * 홈화면/인게임 공용 배경
 * drawBackground(scene) 호출 한 번으로 하늘+구름+나무+풀 전부 그려줌
 */
export function drawBackground(scene: Phaser.Scene) {
  const { width: w, height: h } = scene.scale
  drawSky(scene, w, h)
  drawClouds(scene, w)
  drawScenery(scene, w, h)
}

function drawSky(scene: Phaser.Scene, w: number, h: number) {
  const g = scene.add.graphics().setDepth(0)
  const skyH = h * 0.78
  for (let i = 0; i < 50; i++) {
    const t  = i / 50
    const r  = Math.round(0x3A + (0x87 - 0x3A) * t)
    const gv = Math.round(0x7A + (0xC8 - 0x7A) * t)
    const b  = Math.round(0xBE + (0xF0 - 0xBE) * t)
    g.fillStyle(Phaser.Display.Color.GetColor(r, gv, b))
    g.fillRect(0, skyH / 50 * i, w, skyH / 50 + 1)
  }
  g.fillStyle(0x5A8A3C)
  g.fillRect(0, skyH, w, h - skyH)
}

function drawClouds(scene: Phaser.Scene, w: number) {
  const clouds = [
    { x: w*0.13, y: 55,  s: 1.1,  spd: 14000 },
    { x: w*0.58, y: 38,  s: 0.85, spd: 19000 },
    { x: w*0.83, y: 80,  s: 0.65, spd: 24000 },
    { x: w*0.35, y: 110, s: 0.5,  spd: 20000 },
  ]
  clouds.forEach(c => {
    const g = scene.add.graphics().setDepth(1)
    paintCloud(g, c.x, c.y, c.s)
    scene.tweens.add({
      targets: g, x: `-=${18 * c.s}`,
      duration: c.spd, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
    })
  })
}

function paintCloud(g: Phaser.GameObjects.Graphics, cx: number, cy: number, s: number) {
  const r = 26 * s
  g.fillStyle(0xFFFFFF, 0.92)
  const pts: [number,number,number][] = [
    [0,0,1],[r*0.9,-r*0.3,0.85],[-r*0.85,-r*0.25,0.8],
    [r*1.7,r*0.1,0.72],[-r*1.6,r*0.15,0.65],[r*0.3,-r*0.55,0.6],
  ]
  pts.forEach(([dx,dy,rs]) => g.fillCircle(cx+dx, cy+dy, r*rs))
  g.fillStyle(0xD0DFF0, 0.35)
  g.fillEllipse(cx, cy+r*0.6, r*3.2, r*0.7)
}

function drawScenery(scene: Phaser.Scene, w: number, h: number) {
  const g  = scene.add.graphics().setDepth(2)
  const gy = h * 0.78

  // 먼 배경 언덕
  g.fillStyle(0x4A7A2E, 0.6); g.fillEllipse(w*0.22, gy+10, w*0.55, 80)
  g.fillStyle(0x3D6828, 0.7); g.fillEllipse(w*0.78, gy+15, w*0.50, 70)
  g.fillStyle(0x518C32, 0.5); g.fillEllipse(w*0.5,  gy+5,  w*0.70, 90)

  // 잔디
  g.fillStyle(0x5A8A3C); g.fillRect(0, gy, w, h - gy)
  g.fillStyle(0x6AAA44); g.fillRect(0, gy, w, 6)
  for (let x = 0; x < w; x += 9) {
    const gh = 4 + (x*7%11)
    g.fillStyle(0x7AC050); g.fillRect(x, gy - gh, 2, gh)
    g.fillStyle(0x5A9038); g.fillRect(x+3, gy - gh*0.7, 2, gh*0.7)
  }

  // 나무
  drawTree(g, w*0.06,  gy, 1.1,  0)
  drawTree(g, w*0.17,  gy, 0.72, 1)
  drawTree(g, w*0.87,  gy, 1.15, 2)
  drawTree(g, w*0.97,  gy, 0.68, 0)

  // 덤불
  drawBush(g, w*0.28, gy)
  drawBush(g, w*0.73, gy)
}

function drawTree(g: Phaser.GameObjects.Graphics, x: number, groundY: number, scale: number, variant: number) {
  const trunkH = (110 + variant*15) * scale
  const trunkW = (14  + variant*2)  * scale

  // 기둥
  g.fillStyle(0x4A2C0E); g.fillRect(x - trunkW*0.6, groundY - trunkH, trunkW*1.2, trunkH)
  g.fillStyle(0x6B3E14); g.fillRect(x - trunkW*0.35, groundY - trunkH, trunkW*0.7, trunkH)
  g.fillStyle(0x8B5220); g.fillRect(x - trunkW*0.15, groundY - trunkH*0.6, trunkW*0.25, trunkH*0.6)

  // 뿌리
  g.fillStyle(0x4A2C0E)
  g.fillTriangle(x-trunkW*0.6, groundY, x-trunkW*1.8, groundY, x-trunkW*0.4, groundY-trunkH*0.15)
  g.fillTriangle(x+trunkW*0.6, groundY, x+trunkW*1.8, groundY, x+trunkW*0.4, groundY-trunkH*0.15)

  // 잎
  const leafY  = groundY - trunkH
  const radius = (55 + variant*12) * scale
  g.fillStyle(0x2A5A18)
  g.fillCircle(x+radius*0.15, leafY+radius*0.2, radius*0.95)
  const leafColors = [0x3A7A20, 0x4A9028, 0x5AA832, 0x6AC03C]
  const offsets: [number,number,number][] = [
    [0, 0, 1.0],[-radius*0.5,radius*0.15,0.78],[radius*0.5,radius*0.1,0.75],
    [radius*0.1,-radius*0.35,0.7],[-radius*0.3,-radius*0.2,0.62],[radius*0.35,-radius*0.15,0.6],
  ]
  offsets.forEach(([dx,dy,rs],i) => {
    g.fillStyle(leafColors[Math.min(i, leafColors.length-1)])
    g.fillCircle(x+dx, leafY+dy, radius*rs)
  })
  g.fillStyle(0x7AD840, 0.5)
  g.fillCircle(x - radius*0.25, leafY - radius*0.3, radius*0.38)
}

function drawBush(g: Phaser.GameObjects.Graphics, x: number, groundY: number) {
  g.fillStyle(0x2A5A18); g.fillCircle(x,    groundY-14, 22)
  g.fillStyle(0x3A7A22); g.fillCircle(x-16, groundY-10, 18)
  g.fillStyle(0x3A7A22); g.fillCircle(x+18, groundY-10, 16)
  g.fillStyle(0x4A9028); g.fillCircle(x-6,  groundY-18, 16)
  g.fillStyle(0x5AA030); g.fillCircle(x+8,  groundY-20, 14)
  g.fillStyle(0x6AC03A, 0.6); g.fillCircle(x-8, groundY-22, 10)
}
