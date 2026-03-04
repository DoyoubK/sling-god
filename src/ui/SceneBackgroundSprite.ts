import Phaser from 'phaser'

/**
 * SceneBackgroundSprite
 * ─────────────────────────────────────────────────────────────
 * 나노바나나로 생성한 PNG 에셋을 사용하는 배경 시스템.
 * 에셋이 없는 항목은 Graphics 폴백으로 자동 대체.
 *
 * 에셋 파일 준비되면 public/assets/ 에 아래 이름으로 저장:
 *   bg_sky_hills.png   — 하늘+산 배경 (390×844)
 *   tree_oak.png       — 참나무 (투명 PNG)
 *   tree_pine.png      — 소나무 (투명 PNG)
 *   tree_bush.png      — 덤불 (투명 PNG)
 *   ground_grass.png   — 풀/지면 레이어 (투명 PNG)
 *   slingshot_new.png  — 새총 (투명 PNG)
 */

export const BG_ASSET_KEYS = {
  skyHills:   'bg_sky_hills',
  treeOak:    'tree_oak',
  treePine:   'tree_pine',
  treeBush:   'tree_bush',
  groundGrass:'ground_grass',
} as const

/** preload() 에서 호출 — 에셋 파일 존재 여부 관계없이 안전하게 로드 시도 */
export function preloadBackgroundAssets(scene: Phaser.Scene) {
  const base = 'assets/'
  const assets: [string, string][] = [
    [BG_ASSET_KEYS.skyHills,    'bg_sky_hills.png'],
    [BG_ASSET_KEYS.treeOak,     'tree_oak.png'],
    [BG_ASSET_KEYS.treePine,    'tree_pine.png'],
    [BG_ASSET_KEYS.treeBush,    'tree_bush.png'],
    [BG_ASSET_KEYS.groundGrass, 'ground_grass.png'],
  ]
  assets.forEach(([key, file]) => {
    if (!scene.textures.exists(key)) {
      scene.load.image(key, base + file)
    }
  })
}

/**
 * create() 에서 호출
 * 에셋 있으면 스프라이트, 없으면 기존 Graphics 폴백 사용
 */
export function drawBackgroundSprite(scene: Phaser.Scene) {
  const { width: w, height: h } = scene.scale
  const groundY = h * 0.76

  // ── 1. 하늘+산 배경 ────────────────────────────────────────────────────
  if (scene.textures.exists(BG_ASSET_KEYS.skyHills)) {
    scene.add.image(w / 2, h / 2, BG_ASSET_KEYS.skyHills)
      .setDisplaySize(w, h)
      .setDepth(0)
    console.log('[BG] bg_sky_hills.png 사용')
  } else {
    drawFallbackSky(scene, w, h, groundY)
    console.log('[BG] 배경 폴백 사용 (bg_sky_hills.png 없음)')
  }

  // ── 2. 풀/지면 레이어 ────────────────────────────────────────────────
  if (scene.textures.exists(BG_ASSET_KEYS.groundGrass)) {
    scene.add.image(w / 2, groundY + 50, BG_ASSET_KEYS.groundGrass)
      .setDisplaySize(w, 200)
      .setDepth(4)
  } else {
    drawFallbackGround(scene, w, h, groundY)
  }

  // ── 3. 나무 (배치 포지션 고정) ──────────────────────────────────────
  const treeConfigs = [
    // 원경 작은 나무
    { x: w * 0.30, y: groundY, scale: 0.4, key: BG_ASSET_KEYS.treeOak,  depth: 5 },
    { x: w * 0.55, y: groundY, scale: 0.38, key: BG_ASSET_KEYS.treePine, depth: 5 },
    { x: w * 0.72, y: groundY, scale: 0.42, key: BG_ASSET_KEYS.treeOak,  depth: 5 },
    // 전경 큰 나무
    { x: w * 0.06, y: groundY, scale: 0.85, key: BG_ASSET_KEYS.treeOak,  depth: 7 },
    { x: w * 0.18, y: groundY, scale: 0.62, key: BG_ASSET_KEYS.treePine, depth: 7 },
    { x: w * 0.88, y: groundY, scale: 0.90, key: BG_ASSET_KEYS.treeOak,  depth: 7 },
    { x: w * 0.96, y: groundY, scale: 0.60, key: BG_ASSET_KEYS.treePine, depth: 7 },
  ]

  treeConfigs.forEach(cfg => {
    if (scene.textures.exists(cfg.key)) {
      const tex = scene.textures.get(cfg.key)
      const tw = tex.getSourceImage().width  * cfg.scale
      const th = tex.getSourceImage().height * cfg.scale
      scene.add.image(cfg.x, cfg.y - th / 2, cfg.key)
        .setDisplaySize(tw, th)
        .setDepth(cfg.depth)
    }
    // 폴백은 기존 drawBackground() 에서 처리
  })

  // ── 4. 덤불 ─────────────────────────────────────────────────────────
  const bushPositions = [w * 0.22, w * 0.45, w * 0.68, w * 0.83]
  if (scene.textures.exists(BG_ASSET_KEYS.treeBush)) {
    bushPositions.forEach(bx => {
      const tex = scene.textures.get(BG_ASSET_KEYS.treeBush)
      const bw = tex.getSourceImage().width  * 0.5
      const bh = tex.getSourceImage().height * 0.5
      scene.add.image(bx, groundY - bh / 2, BG_ASSET_KEYS.treeBush)
        .setDisplaySize(bw, bh)
        .setDepth(6)
    })
  }
}

// ── 폴백: 하늘 (기존 Graphics 코드) ─────────────────────────────────────
function drawFallbackSky(scene: Phaser.Scene, w: number, h: number, groundY: number) {
  const g = scene.add.graphics().setDepth(0)
  const stops = [
    { t: 0.00, r: 0x0D, gv: 0x3A, b: 0x6E },
    { t: 0.30, r: 0x1E, gv: 0x72, b: 0xB4 },
    { t: 0.60, r: 0x5B, gv: 0xAE, b: 0xD8 },
    { t: 0.82, r: 0xA8, gv: 0xD8, b: 0xF0 },
    { t: 1.00, r: 0xE8, gv: 0xF4, b: 0xFF },
  ]
  for (let i = 0; i < 100; i++) {
    const t = i / 100
    const y = groundY * t
    const c = interpolateStops(stops, t)
    g.fillStyle(Phaser.Display.Color.GetColor(c.r, c.gv, c.b))
    g.fillRect(0, y, w, groundY / 100 + 1)
  }
  // 지면
  const gf = scene.add.graphics().setDepth(4)
  gf.fillStyle(0x3A7818)
  gf.fillRect(0, groundY, w, h - groundY)
  gf.fillStyle(0x5AAE30)
  gf.fillRect(0, groundY, w, 5)
}

function drawFallbackGround(scene: Phaser.Scene, w: number, h: number, groundY: number) {
  const g = scene.add.graphics().setDepth(4)
  const steps = 40
  for (let i = 0; i < steps; i++) {
    const t = i / steps
    const r = Math.round(0x3A + (0x22 - 0x3A) * t)
    const gv = Math.round(0x78 + (0x50 - 0x78) * t)
    const b = Math.round(0x18 + (0x0A - 0x18) * t)
    g.fillStyle(Phaser.Display.Color.GetColor(r, gv, b))
    g.fillRect(0, groundY + (h - groundY) * i / steps, w, (h - groundY) / steps + 1)
  }
  g.fillStyle(0x68C038)
  g.fillRect(0, groundY, w, 2)
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
