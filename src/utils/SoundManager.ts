/**
 * SoundManager — 효과음 전용 (배경음악 없음)
 */
export class SoundManager {
  private static instance: SoundManager
  private ctx: AudioContext | null = null
  private isMuted = false

  static getInstance(): SoundManager {
    if (!SoundManager.instance) SoundManager.instance = new SoundManager()
    return SoundManager.instance
  }

  private getCtx(): AudioContext {
    if (!this.ctx) this.ctx = new AudioContext()
    return this.ctx
  }

  get muted() { return this.isMuted }
  toggleMute() { this.isMuted = !this.isMuted; return this.isMuted }

  // ── 명중 효과음: 퍽! ──
  playHit() {
    if (this.isMuted) return
    const ctx = this.getCtx()

    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain); gain.connect(ctx.destination)
    osc.type = 'sine'
    osc.frequency.setValueAtTime(180, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.12)
    gain.gain.setValueAtTime(0.5, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.15)
  }

  // 제거된 메서드들 (호환용 빈 함수)
  playShoot() {}
  playMiss() {}
  playClear() {}
  playGameOver() {}
  startBgm() {}
  stopBgm() {}
}
