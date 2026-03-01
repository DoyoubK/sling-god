export class GameManager {
  private static instance: GameManager

  currentLevel  = 1
  currentHits   = 0
  currentMisses = 0
  bestLevel     = 1

  static readonly MAX_MISSES   = 3
  static readonly WAIT_MINUTES = 15

  static getInstance(): GameManager {
    if (!GameManager.instance) GameManager.instance = new GameManager()
    return GameManager.instance
  }

  getTargetHits(level: number): number {
    if (level === 1) return 6
    if (level === 2) return 15
    return Math.floor(15 + (level - 2) * 9)
  }

  getBirdSpeed(level: number): number {
    return 150 + (level - 1) * 30
  }

  onHit(): 'continue' | 'levelup' {
    this.currentHits++
    if (this.currentHits >= this.getTargetHits(this.currentLevel)) return 'levelup'
    return 'continue'
  }

  onMiss(): 'continue' | 'gameover' {
    this.currentMisses++
    if (this.currentMisses >= GameManager.MAX_MISSES) return 'gameover'
    return 'continue'
  }

  levelUp() {
    this.currentLevel++
    if (this.currentLevel > this.bestLevel) this.bestLevel = this.currentLevel
    this.currentHits   = 0
    this.currentMisses = 0
  }

  resetForRetry() {
    this.currentHits   = 0
    this.currentMisses = 0
  }

  fullReset() {
    this.currentLevel  = 1
    this.currentHits   = 0
    this.currentMisses = 0
  }
}
