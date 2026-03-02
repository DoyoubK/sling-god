import Phaser from 'phaser'

/**
 * SceneBackground v2 — 하이퍼캐주얼 상용 수준 배경
 * 레이어 구조:
 *   0: 하늘 그라디언트
 *   1: 태양 글로우
 *   2: 원경 산
 *   3: 구름 (애니메이션)
 *   4: 중경 언덕
 *   5: 근경 언덕 + 지면
 *   6: 배경 나무 (원경)
 *   7: 잔디 + 꽃
 *   8: 전경 나무
 */
export function drawBackground(scene: Phaser.Scene) {
  const { width: w, height: h } = scene.scale
  const groundY = h * 0.76

  drawSky(scene, w, h, groundY)
  drawSunGlow(scene, w, h)
  drawDistantMountains(scene, w, groundY)
  drawClouds(scene, w, h)
  drawMidHills(scene, w, groundY)
  drawGround(scene, w, h, groundY)
  drawFarTrees(scene, w, groundY)
  drawGrassDetail(scene, w, groundY)
  drawNearTrees(scene, w, groundY)
}

// ── 하늘 그라디언트 (4색 다단계) ─────────────────────────────────────────
function drawSky(scene: Phaser.Scene, w: number, _h: number, groundY: number) {
  const g = scene.add.graphics().setDepth(0)

  // 색상 정지점: 딥블루 → 미디엄블루 → 라이트블루 → 따뜻한 크림
  const stops = [
    { t: 0.00, r: 0x0D, gv: 0x3A, b: 0x6E },  // 딥 네이비
    { t: 0.30, r: 0x1E, gv: 0x72, b: 0xB4 },  // 미디엄 블루
    { t: 0.60, r: 0x5B, gv: 0xAE, b: 0xD8 },  // 스카이 블루
    { t: 0.82, r: 0xA8, gv: 0xD8, b: 0xF0 },  // 연한 하늘
    { t: 1.00, r: 0xE8, gv: 0xF4, b: 0xFF },  // 지평선 화이트블루
  ]

  const steps = 100
  for (let i = 0; i < steps; i++) {
    const t = i / steps
    const y = groundY * t
    const c = interpolateStops(stops, t)
    g.fillStyle(Phaser.Display.Color.GetColor(c.r, c.gv, c.b))
    g.fillRect(0, y, w, groundY / steps + 1)
  }
}

function interpolateStops(stops: {t:number,r:number,gv:number,b:number}[], t: number) {
  for (let i = 0; i < stops.length - 1; i++) {
    const a = stops[i], b = stops[i+1]
    if (t >= a.t && t <= b.t) {
      const f = (t - a.t) / (b.t - a.t)
      return {
        r:  Math.round(a.r  + (b.r  - a.r)  * f),
        gv: Math.round(a.gv + (b.gv - a.gv) * f),
        b:  Math.round(a.b  + (b.b  - a.b)  * f),
      }
    }
  }
  return stops[stops.length - 1]
}

// ── 태양 글로우 ────────────────────────────────────────────────────────────
function drawSunGlow(scene: Phaser.Scene, w: number, h: number) {
  const g = scene.add.graphics().setDepth(1)
  const sx = w * 0.78, sy = h * 0.12

  // 부드러운 빛 퍼짐 (큰 반투명 원 여러 겹)
  const glows = [
    { r: 90, a: 0.06, c: 0xFFE87A },
    { r: 60, a: 0.10, c: 0xFFDB58 },
    { r: 38, a: 0.18, c: 0xFFD030 },
    { r: 22, a: 0.35, c: 0xFFE060 },
    { r: 12, a: 0.75, c: 0xFFF0A0 },
    { r:  7, a: 1.00, c: 0xFFFDE0 },
  ]
  glows.forEach(({ r, a, c }) => {
    g.fillStyle(c, a)
    g.fillCircle(sx, sy, r)
  })

  // 빛줄기 (얇은 삼각형 4개)
  const rays = [
    [-0.15, -1.0], [0.25, -0.95], [0.95, -0.3], [0.98, 0.2],
  ]
  rays.forEach(([dx, dy]) => {
    g.fillStyle(0xFFE87A, 0.07)
    g.fillTriangle(sx, sy, sx + dx*120, sy + dy*120, sx + dx*120 + 18, sy + dy*120 + 18)
  })
}

// ── 원경 산맥 (대기 원근감) ────────────────────────────────────────────────
function drawDistantMountains(scene: Phaser.Scene, w: number, groundY: number) {
  const g = scene.add.graphics().setDepth(2)

  // 레이어 1 — 가장 먼 산 (청회색, 반투명)
  g.fillStyle(0x8AAFC8, 0.45)
  g.fillTriangle(w*0.0,  groundY, w*0.25, groundY*0.52, w*0.50, groundY)
  g.fillTriangle(w*0.30, groundY, w*0.55, groundY*0.46, w*0.80, groundY)
  g.fillTriangle(w*0.60, groundY, w*0.82, groundY*0.50, w*1.05, groundY)

  // 레이어 2 — 중간 산 (약간 진한 청록)
  g.fillStyle(0x6A9AB0, 0.55)
  g.fillTriangle(w*0.05, groundY, w*0.22, groundY*0.60, w*0.40, groundY)
  g.fillTriangle(w*0.42, groundY, w*0.62, groundY*0.55, w*0.82, groundY)
  g.fillTriangle(w*0.75, groundY, w*0.91, groundY*0.58, w*1.05, groundY)

  // 산 위 눈 (흰 하이라이트)
  g.fillStyle(0xEEF5FF, 0.35)
  g.fillTriangle(w*0.22, groundY*0.52, w*0.25, groundY*0.46, w*0.28, groundY*0.52)
  g.fillTriangle(w*0.55, groundY*0.46, w*0.58, groundY*0.40, w*0.61, groundY*0.46)
  g.fillTriangle(w*0.82, groundY*0.50, w*0.85, groundY*0.44, w*0.88, groundY*0.50)
}

// ── 구름 (그림자 레이어 포함, 유기적 형태) ───────────────────────────────
function drawClouds(scene: Phaser.Scene, w: number, h: number) {
  const clouds = [
    { x: w*0.12, y: h*0.10, s: 1.3,  spd: 18000, d: 2 },
    { x: w*0.55, y: h*0.06, s: 1.0,  spd: 24000, d: 1 },
    { x: w*0.82, y: h*0.13, s: 0.75, spd: 20000, d: 1 },
    { x: w*0.38, y: h*0.17, s: 0.55, spd: 28000, d: 1 },
    { x: w*0.70, y: h*0.20, s: 0.45, spd: 22000, d: 1 },
  ]

  clouds.forEach(c => {
    const g = scene.add.graphics().setDepth(c.d)
    paintCloud(g, c.x, c.y, c.s)
    scene.tweens.add({
      targets: g, x: `-=${20 * c.s}`,
      duration: c.spd, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
    })
  })
}

function paintCloud(g: Phaser.GameObjects.Graphics, cx: number, cy: number, s: number) {
  const r = 28 * s

  // 그림자 레이어 (아래쪽 약간 어두운 블루그레이)
  g.fillStyle(0xB8D4E8, 0.5)
  g.fillEllipse(cx, cy + r*0.7, r*3.4, r*0.65)

  // 구름 본체 (여러 원 겹치기 — 보다 유기적)
  const puffs: [number, number, number][] = [
    [0,      0,      1.00],
    [r*1.0,  r*0.15, 0.88],
    [-r*0.9, r*0.10, 0.85],
    [r*1.9,  r*0.25, 0.72],
    [-r*1.8, r*0.22, 0.70],
    [r*0.4,  -r*0.5, 0.65],
    [-r*0.3, -r*0.4, 0.60],
    [r*1.2,  -r*0.3, 0.55],
  ]
  // 안쪽 그림자
  g.fillStyle(0xD8E8F4, 0.6)
  puffs.forEach(([dx, dy, rs]) => g.fillCircle(cx+dx, cy+dy+r*0.12, r*rs))

  // 메인 흰 구름
  g.fillStyle(0xFFFFFF, 0.96)
  puffs.forEach(([dx, dy, rs]) => g.fillCircle(cx+dx, cy+dy, r*rs))

  // 하이라이트 (최상단 밝은 흰)
  g.fillStyle(0xFFFFFF, 1.0)
  g.fillCircle(cx + r*0.15, cy - r*0.38, r*0.45)
  g.fillCircle(cx - r*0.55, cy - r*0.25, r*0.35)
}

// ── 중경 언덕 (3단 레이어) ─────────────────────────────────────────────────
function drawMidHills(scene: Phaser.Scene, w: number, groundY: number) {
  const g = scene.add.graphics().setDepth(3)

  // 레이어 1 — 가장 먼 언덕 (연한 초록)
  g.fillStyle(0x6A9C42, 0.7)
  g.fillEllipse(w*0.20, groundY + 8,  w*0.65, 90)
  g.fillEllipse(w*0.75, groundY + 12, w*0.60, 80)

  // 레이어 2 — 중간 언덕
  g.fillStyle(0x4E8C28, 0.85)
  g.fillEllipse(w*0.08, groundY + 5,  w*0.50, 75)
  g.fillEllipse(w*0.60, groundY + 8,  w*0.55, 70)
  g.fillEllipse(w*0.95, groundY + 10, w*0.40, 65)
}

// ── 지면 (그라디언트 + 잔디 라인) ────────────────────────────────────────
function drawGround(scene: Phaser.Scene, w: number, h: number, groundY: number) {
  const g = scene.add.graphics().setDepth(4)

  // 지면 그라디언트 (밝은 상단 → 어두운 하단)
  const steps = 40
  for (let i = 0; i < steps; i++) {
    const t = i / steps
    const r = Math.round(0x3A + (0x22 - 0x3A) * t)
    const gv = Math.round(0x78 + (0x50 - 0x78) * t)
    const b = Math.round(0x18 + (0x0A - 0x18) * t)
    g.fillStyle(Phaser.Display.Color.GetColor(r, gv, b))
    g.fillRect(0, groundY + (h - groundY) * i / steps, w, (h - groundY) / steps + 1)
  }

  // 지면 상단 밝은 라인
  g.fillStyle(0x5AAE30)
  g.fillRect(0, groundY, w, 5)
  g.fillStyle(0x68C038)
  g.fillRect(0, groundY, w, 2)
}

// ── 배경 나무 (원경, 작고 연한색) ─────────────────────────────────────────
function drawFarTrees(scene: Phaser.Scene, w: number, groundY: number) {
  const g = scene.add.graphics().setDepth(5)
  const positions = [
    { x: w*0.30, s: 0.50 },
    { x: w*0.48, s: 0.45 },
    { x: w*0.65, s: 0.52 },
  ]
  positions.forEach(({ x, s }) => drawTree(g, x, groundY, s, true))
}

// ── 잔디 + 꽃 디테일 ──────────────────────────────────────────────────────
function drawGrassDetail(scene: Phaser.Scene, w: number, groundY: number) {
  const g = scene.add.graphics().setDepth(6)

  // 잔디 블레이드 (불규칙 간격)
  for (let x = 0; x < w; x += 7) {
    const h1 = 5 + ((x * 13) % 9)
    const h2 = 4 + ((x * 7)  % 7)
    g.fillStyle(0x5AB828)
    g.fillTriangle(x,   groundY, x+2, groundY, x+1, groundY-h1)
    g.fillStyle(0x48A020)
    g.fillTriangle(x+4, groundY, x+6, groundY, x+5, groundY-h2)
  }

  // 꽃 (불규칙 배치)
  const flowers = [
    { x: w*0.22, c: 0xFFD700 }, { x: w*0.38, c: 0xFF8EC8 },
    { x: w*0.52, c: 0xFFFFFF }, { x: w*0.64, c: 0xFF6B9D },
    { x: w*0.79, c: 0xFFD700 }, { x: w*0.42, c: 0xFFB3DE },
  ]
  flowers.forEach(({ x, c }) => {
    const fy = groundY - 8
    g.fillStyle(0x2A7010)
    g.fillRect(x, fy, 1.5, 8)
    g.fillStyle(c, 0.95)
    g.fillCircle(x,   fy-3, 3.5)
    g.fillCircle(x-3, fy,   3)
    g.fillCircle(x+3, fy,   3)
    g.fillCircle(x,   fy+3, 3)
    g.fillStyle(0xFFFF88)
    g.fillCircle(x, fy, 2)
  })
}

// ── 전경 나무 (근경, 크고 상세) ──────────────────────────────────────────
function drawNearTrees(scene: Phaser.Scene, w: number, groundY: number) {
  const g = scene.add.graphics().setDepth(7)
  drawTree(g, w*0.05,  groundY, 1.10, false)
  drawTree(g, w*0.17,  groundY, 0.78, false)
  drawTree(g, w*0.88,  groundY, 1.15, false)
  drawTree(g, w*0.97,  groundY, 0.72, false)
}

// ── 공용 나무 드로잉 ──────────────────────────────────────────────────────
function drawTree(
  g: Phaser.GameObjects.Graphics,
  x: number, groundY: number,
  scale: number, far: boolean
) {
  const trunkH = 100 * scale
  const trunkW = 12  * scale
  const leafR  = 48  * scale

  // 원경 나무는 연한 색 (대기 원근감)
  const alpha  = far ? 0.55 : 1.0
  const tDark  = far ? 0x5A4530 : 0x3A1C08
  const tMid   = far ? 0x7A6040 : 0x5C3010
  const lShadow= far ? 0x5A8845 : 0x1E5A10
  const lMid1  = far ? 0x72A858 : 0x2E7A18
  const lMid2  = far ? 0x88C068 : 0x3E9A22
  const lLight = far ? 0xA0D880 : 0x52B82C
  const lShine = far ? 0xB8F090 : 0x68D038

  // 나무 그림자 (땅에 타원형)
  if (!far) {
    g.fillStyle(0x000000, 0.10)
    g.fillEllipse(x + trunkW, groundY + 3, trunkH * 0.7, 12)
  }

  // 줄기 — 그림자
  g.fillStyle(tDark, alpha)
  g.fillRect(x - trunkW*0.6, groundY - trunkH, trunkW*1.2, trunkH)

  // 줄기 — 하이라이트
  g.fillStyle(tMid, alpha)
  g.fillRect(x - trunkW*0.25, groundY - trunkH, trunkW*0.5, trunkH)

  // 뿌리
  g.fillStyle(tDark, alpha)
  g.fillTriangle(x - trunkW, groundY, x - trunkW*2.2, groundY, x - trunkW*0.5, groundY - trunkH*0.18)
  g.fillTriangle(x + trunkW, groundY, x + trunkW*2.2, groundY, x + trunkW*0.5, groundY - trunkH*0.18)

  // 잎 — 레이어 4단 (그림자 → 미드 → 라이트 → 하이라이트)
  const leafY = groundY - trunkH

  // 그림자 레이어
  g.fillStyle(lShadow, alpha)
  g.fillCircle(x,           leafY + leafR*0.1,  leafR)
  g.fillCircle(x - leafR*0.5, leafY + leafR*0.2, leafR*0.8)
  g.fillCircle(x + leafR*0.5, leafY + leafR*0.2, leafR*0.8)

  // 미드 레이어
  g.fillStyle(lMid1, alpha)
  g.fillCircle(x,           leafY,              leafR*0.92)
  g.fillCircle(x - leafR*0.52, leafY + leafR*0.1,  leafR*0.72)
  g.fillCircle(x + leafR*0.48, leafY + leafR*0.08, leafR*0.70)
  g.fillCircle(x + leafR*0.15, leafY - leafR*0.38, leafR*0.65)

  // 라이트 레이어
  g.fillStyle(lMid2, alpha)
  g.fillCircle(x - leafR*0.18, leafY - leafR*0.15, leafR*0.78)
  g.fillCircle(x + leafR*0.3,  leafY - leafR*0.1,  leafR*0.62)
  g.fillCircle(x - leafR*0.38, leafY - leafR*0.05, leafR*0.55)

  // 하이라이트 (상단 왼쪽 — 빛 방향)
  g.fillStyle(lLight, alpha)
  g.fillCircle(x - leafR*0.28, leafY - leafR*0.32, leafR*0.52)
  g.fillCircle(x + leafR*0.08, leafY - leafR*0.45, leafR*0.42)

  // 포인트 하이라이트
  g.fillStyle(lShine, alpha * 0.8)
  g.fillCircle(x - leafR*0.35, leafY - leafR*0.42, leafR*0.28)
}
