# 🎯 Sling God

> 원터치 하이퍼 캐주얼 새총 슈팅 게임 — 새를 맞춰 레벨을 클리어하라!

## 📱 소개

**Sling God**은 Phaser.js 기반의 하이퍼 캐주얼 모바일 웹 게임입니다.  
화면을 드래그해 새총을 당기고, 날아오는 새들을 맞혀 레벨을 클리어하세요.  
토스 앱 내 **앱인토스(App-in-Toss)** 미니앱으로 출시를 목표로 개발 중입니다.

## 🎮 게임플레이

| 동작 | 설명 |
|------|------|
| **터치 & 홀드** | 새총 게이지 충전 |
| **릴리즈** | 돌 발사 (충전량에 비례한 발사력) |
| **새 명중** | Hit 카운트 증가 |
| **새 이탈** | Miss (하트 1개 소모) |

### 규칙
- 레벨별 목표 명중 수 달성 시 레벨 업
- Miss 3회 시 게임 오버 (명중 수 초기화)
- 게임 오버 후 15분 대기 또는 광고 시청으로 재도전 가능

## 🐦 새 종류

| 새 | 속도 | 등장 빈도 |
|----|------|----------|
| 🐦 Sparrow | ⭐ (가장 느림) | 40% |
| 🕊️ Pigeon  | ⭐⭐ | 28% |
| 🦜 Parrot  | ⭐⭐⭐ | 17% |
| 🦉 Owl     | ⭐⭐⭐⭐ | 10% |
| 🦅 Eagle   | ⭐⭐⭐⭐⭐ (가장 빠름) | 5% |

### 비행 패턴
- **Straight** — 직선 비행
- **Zigzag** — 위아래 지그재그
- **Dive** — 아래로 하강하며 비행
- **Accelerate** — 점점 빨라지는 급가속

## 📈 레벨 시스템

| 레벨 | 목표 명중 | 기본 새 속도 |
|------|---------|------------|
| 1 | 6마리 | 150 |
| 2 | 15마리 | 180 |
| 3+ | 점진 증가 | +30/레벨 |

## 🛠️ 기술 스택

- **엔진:** [Phaser.js 3](https://phaser.io/)
- **빌드:** [Vite](https://vitejs.dev/)
- **언어:** TypeScript
- **타겟:** 모바일 WebView (App-in-Toss)

## 🚀 시작하기

```bash
# 저장소 클론
git clone https://github.com/DoyoubK/sling-god.git
cd sling-god

# 의존성 설치
npm install

# 개발 서버 실행 (http://localhost:5173)
npm run dev

# 타입 체크 + 프로덕션 빌드
npm run build

# 빌드 결과물 로컬 미리보기
npm run preview
```

## 📁 프로젝트 구조

\`\`\`
src/
├── scenes/
│   ├── GameScene.ts        # 메인 게임 씬
│   ├── MainMenuScene.ts    # 메인 메뉴
│   ├── GameOverScene.ts    # 게임 오버
│   └── LevelUpScene.ts     # 레벨 업
├── objects/
│   ├── Bird.ts             # 새 오브젝트 (종류별 설정 포함)
│   └── Projectile.ts       # 투사체 물리
├── ui/
│   ├── HUD.ts              # 상단 HUD (레벨/점수/하트)
│   ├── GaugeBar.ts         # 발사 파워 게이지
│   ├── Button.ts           # 공통 버튼
│   └── SceneBackground.ts  # 배경 렌더러
├── utils/
│   └── GameManager.ts      # 전역 게임 상태 관리
└── constants/
    └── TDS.ts              # 토스 디자인 시스템 상수
public/
└── assets/                 # 이미지 에셋
    ├── bird_sparrow.png
    ├── bird_pigeon.png
    ├── bird_parrot.png
    ├── bird_owl.png
    ├── bird_eagle.png
    └── birdgun.png
\`\`\`

## 🗺️ 로드맵

- [ ] 새 스프라이트 리디자인 (귀여운 캐릭터 스타일)
- [ ] 배경 일러스트 (하늘 / 구름)
- [ ] 발사 / 명중 / Miss 효과음
- [ ] 레벨 밸런스 전체 정비
- [ ] 앱인토스 SDK 연동 (토스 로그인)
- [ ] 보상형 광고 연동
- [ ] 게임물관리위원회 등급 심의

## 📄 라이선스

MIT

---

> 앱인토스 출시를 위해 게임물관리위원회 등급 심의가 필요합니다.

## 🌿 브랜치 전략

```
master          ← 항상 최신 안정 버전
└── feature/*   ← 기능 단위 개발 브랜치
```

**작업 흐름:**
```bash
git checkout master
git pull origin master
git checkout -b feature/기능명
# ... 작업 ...
git push origin feature/기능명
# GitHub에서 PR 생성 → master로 머지
```
