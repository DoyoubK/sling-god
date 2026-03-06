/**
 * AssetConfig.ts
 * 게임 에셋 경로 중앙 관리
 * 새 에셋 추가 시 이 파일만 수정하면 전체 반영
 */

export const Assets = {
  // ── 배경 레이어 ──────────────────────────────────────
  background: {
    /** 하늘 + 산 배경 (390×844, 불투명) */
    skyHills:    'assets/bg_sky_hills.png',
    midHills:    null as string | null,
  },

  // ── 지면/식물 레이어 ──────────────────────────────────
  ground: {
    /** 풀/지면 레이어 (투명 PNG) */
    grass:       'assets/ground_grass.png',
  },

  // ── 나무 오브젝트 ─────────────────────────────────────
  trees: {
    oak:         'assets/tree_oak.png',
    pine:        'assets/tree_pine.png',
    bush:        'assets/tree_bush.png',
  },

  // ── 새총 오브젝트 ─────────────────────────────────────
  slingshot: {
    /** 새 에셋 받으면 'assets/slingshot_new.png' 로 교체 */
    main:        'assets/saechong.png',
  },

  // ── 새 캐릭터 ─────────────────────────────────────────
  birds: {
    sparrow:     'assets/sparrow_new.png',
    pigeon:      'assets/pigeon_new.png',
    owl:         'assets/owl_new.png',
    eagle:       'assets/eagle_new.png',
    parrot:      'assets/parrot_new.png',
  },
} as const

/**
 * 에셋 교체 체크리스트
 * [ ] bg_sky_hills.png     — 하늘+산 배경
 * [ ] tree_oak.png         — 참나무
 * [ ] tree_pine.png        — 소나무
 * [ ] tree_bush.png        — 관목/덤불
 * [ ] ground_grass.png     — 풀/지면 레이어
 * [ ] slingshot_new.png    — 새총 오브젝트
 */
