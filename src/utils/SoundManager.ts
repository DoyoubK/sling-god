/**
 * SoundManager — 효과음 전용 (현재 비활성화)
 */
export class SoundManager {
  private static instance: SoundManager

  static getInstance(): SoundManager {
    if (!SoundManager.instance) SoundManager.instance = new SoundManager()
    return SoundManager.instance
  }

  playHit()    {}
  playClear()  {}
  playShoot()  {}
  playMiss()   {}
  playGameOver() {}
  startBgm()   {}
  stopBgm()    {}
  get muted()  { return false }
  toggleMute() { return false }
}
