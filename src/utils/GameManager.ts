// GameManager - 게임 전역 상태 싱글톤

export class GameManager {
  private static instance: GameManager

  currentLevel: number = 1
  currentHits: number = 0
  currentMisses: number = 0

  static readonly MAX_MISSES = 3
  static readonly WAIT_MINUTES = 15

  static getInstance(): GameManager {
    if (!GameManager.instance) {
      GameManager.instance = new GameManager()
    }
    return GameManager.instance
  }

  // 레벨별 목표 명중 수
  getTargetHits(level: number): number {
    if (level === 1) return 6
    if (level === 2) return 15
    return Math.floor(15 + (level - 2) * 8.5)
  }

  // 레벨별 새 속도
  getBirdSpeed(level: number): number {
    return 150 + (level - 1) * 30
  }

  onHit(): 'continue' | 'levelup' {
    this.currentHits++
    if (this.currentHits >= this.getTargetHits(this.currentLevel)) {
      return 'levelup'
    }
    return 'continue'
  }

  onMiss(): 'continue' | 'gameover' {
    this.currentMisses++
    if (this.currentMisses >= GameManager.MAX_MISSES) {
      return 'gameover'
    }
    return 'continue'
  }

  levelUp() {
    this.currentLevel++
    this.currentHits = 0
    this.currentMisses = 0
  }

  // 게임 오버: 명중 수만 리셋, 레벨 유지
  resetForRetry() {
    this.currentHits = 0
    this.currentMisses = 0
  }

  fullReset() {
    this.currentLevel = 1
    this.currentHits = 0
    this.currentMisses = 0
  }
}
