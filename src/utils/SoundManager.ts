/**
 * SoundManager — 효과음 전용
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

  // ── 명중: 딱! ──
  playHit() {
    if (this.isMuted) return
    const ctx = this.getCtx()
    const t = ctx.currentTime

    // 노이즈 버스트 (타격 질감)
    const bufLen = ctx.sampleRate * 0.04
    const buf = ctx.createBuffer(1, bufLen, ctx.sampleRate)
    const data = buf.getChannelData(0)
    for (let i = 0; i < bufLen; i++) data[i] = (Math.random() * 2 - 1)
    const noise = ctx.createBufferSource()
    noise.buffer = buf
    const noiseGain = ctx.createGain()
    const noiseFilter = ctx.createBiquadFilter()
    noiseFilter.type = 'highpass'
    noiseFilter.frequency.value = 800
    noise.connect(noiseFilter); noiseFilter.connect(noiseGain); noiseGain.connect(ctx.destination)
    noiseGain.gain.setValueAtTime(0.6, t)
    noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.04)
    noise.start(t); noise.stop(t + 0.04)

    // 고음 클릭 (딱! 핵심음)
    const osc = ctx.createOscillator()
    const oscGain = ctx.createGain()
    osc.connect(oscGain); oscGain.connect(ctx.destination)
    osc.type = 'sine'
    osc.frequency.setValueAtTime(400, t)
    osc.frequency.exponentialRampToValueAtTime(120, t + 0.06)
    oscGain.gain.setValueAtTime(0.5, t)
    oscGain.gain.exponentialRampToValueAtTime(0.001, t + 0.07)
    osc.start(t); osc.stop(t + 0.07)
  }

  // ── 클리어: 빠밤빠밤! 트럼펫 팡파레 ──
  playClear() {
    if (this.isMuted) return
    const ctx = this.getCtx()
    
    // 빠밤 (G4-C5)
    const notes = [
      { freq: 392, start: 0,    dur: 0.12 },  // G4 빠
      { freq: 523, start: 0.13, dur: 0.18 },  // C5 밤
      { freq: 392, start: 0.35, dur: 0.12 },  // G4 빠
      { freq: 523, start: 0.48, dur: 0.25 },  // C5 밤!
    ]
    
    notes.forEach(n => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain); gain.connect(ctx.destination)
      osc.type = 'square' // 트럼펫 느낌
      osc.frequency.value = n.freq
      const t = ctx.currentTime + n.start
      gain.gain.setValueAtTime(0.25, t)
      gain.gain.exponentialRampToValueAtTime(0.001, t + n.dur)
      osc.start(t)
      osc.stop(t + n.dur + 0.01)
    })
  }

  // 호환용 빈 함수
  playShoot() {}
  playMiss() {}
  playGameOver() {}
  startBgm() {}
  stopBgm() {}
}
