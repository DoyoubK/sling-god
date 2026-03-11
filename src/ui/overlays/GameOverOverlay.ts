import { HTMLOverlay } from '../HTMLOverlay'

interface GameOverData {
  level: number
  hits: number
}

interface GameOverCallbacks {
  onAdRetry: () => void
  onRestart: () => void
}

/**
 * GameOverOverlay — HTML overlay for the game over screen.
 * Designed to match the LevelUpScene visual style (blue gradient + card + gold button).
 */
export class GameOverOverlay extends HTMLOverlay {
  constructor() {
    super('game-over-overlay')

    Object.assign(this.el.style, {
      position: 'absolute',
      inset: '0',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      background: 'linear-gradient(180deg, #0A1A3A 0%, #1A0A2E 60%, #0A0A1A 100%)',
      pointerEvents: 'auto',
    })

    const style = document.createElement('style')
    style.textContent = `
      @keyframes goFadeIn {
        0%   { opacity: 0; transform: translateY(24px); }
        100% { opacity: 1; transform: translateY(0); }
      }
      @keyframes goPop {
        0%   { opacity: 0; transform: scale(0.2); }
        60%  { transform: scale(1.08); }
        100% { opacity: 1; transform: scale(1); }
      }
      @keyframes goFloat {
        0%, 100% { transform: translateY(0px); }
        50%      { transform: translateY(-6px); }
      }
      @keyframes goTwinkle {
        0%, 100% { opacity: 0.15; }
        50%      { opacity: 0.85; }
      }
      .go-label   { animation: goPop    0.45s cubic-bezier(0.34,1.56,0.64,1) 0.1s both; }
      .go-info    { animation: goFadeIn 0.4s ease 0.5s both; }
      .go-buttons { animation: goFadeIn 0.4s ease 0.8s both; }
      .go-float   { animation: goFloat 1.8s ease-in-out infinite; }
      #go-ad-btn:active      { transform: scale(0.96); }
      #go-restart-btn:active { transform: scale(0.96); }
    `
    document.head.appendChild(style)
  }

  showWithData(data: GameOverData, callbacks: GameOverCallbacks) {
    this.el.innerHTML = this.buildHTML(data)

    const adBtn      = this.el.querySelector<HTMLButtonElement>('#go-ad-btn')!
    const restartBtn = this.el.querySelector<HTMLButtonElement>('#go-restart-btn')!

    adBtn.addEventListener('click', () => {
      this.hide()
      callbacks.onAdRetry()
    })
    restartBtn.addEventListener('click', () => {
      this.hide()
      callbacks.onRestart()
    })

    this.show()
  }

  private buildHTML(data: GameOverData): string {
    const decos = [
      { e: '💀', l: '8%',  t: '10%', delay: '0s',    size: '20px' },
      { e: '🔥', l: '84%', t: '13%', delay: '0.15s', size: '18px' },
      { e: '❌', l: '5%',  t: '46%', delay: '0.3s',  size: '16px' },
      { e: '💀', l: '88%', t: '42%', delay: '0.45s', size: '20px' },
      { e: '🔥', l: '10%', t: '76%', delay: '0.6s',  size: '18px' },
      { e: '❌', l: '82%', t: '72%', delay: '0.75s', size: '16px' },
      { e: '💀', l: '47%', t: '6%',  delay: '0.9s',  size: '18px' },
      { e: '🔥', l: '45%', t: '88%', delay: '1.05s', size: '16px' },
    ]

    const decoHTML = decos.map(d => `
      <div style="position:absolute;left:${d.l};top:${d.t};font-size:${d.size};opacity:0;animation:goTwinkle 1.2s ease-in-out ${d.delay} infinite;pointer-events:none;">${d.e}</div>
    `).join('')

    return `
      <div style="position:absolute;inset:0;pointer-events:none;z-index:0;">${decoHTML}</div>

      <div style="position:absolute;top:0;left:0;right:0;height:4px;background:linear-gradient(90deg,transparent,#6A3EE8,transparent);z-index:1;"></div>

      <div style="display:flex;flex-direction:column;align-items:center;gap:0;text-align:center;padding:0 32px;position:relative;z-index:2;width:100%;">

        <div class="go-label" style="font-size:40px;font-weight:900;font-family:'Pretendard',system-ui,sans-serif;color:#FF6B6B;letter-spacing:0.08em;text-shadow:0 0 20px rgba(255,80,80,0.7),0 2px 8px rgba(0,0,0,0.6);">💀 미션 실패</div>

        <div class="go-info" style="margin-top:12px;">
          <div style="font-size:52px;font-weight:900;color:#FFFFFF;font-family:'Pretendard',system-ui,sans-serif;text-shadow:0 2px 12px rgba(0,0,0,0.5);">Level ${data.level}</div>
        </div>

        <div class="go-info" style="margin-top:20px;width:76%;background:rgba(255,255,255,0.08);border:1.5px solid rgba(255,255,255,0.18);border-radius:14px;padding:16px 0;">
          <div style="font-size:22px;font-weight:700;color:#FFFFFF;font-family:'Pretendard',system-ui,sans-serif;">명중 ${data.hits}마리</div>
          <div style="margin-top:8px;font-size:14px;color:rgba(255,180,180,0.85);font-family:'Pretendard',system-ui,sans-serif;">하트가 모두 소진되었습니다</div>
        </div>

        <div class="go-buttons go-float" style="display:flex;flex-direction:column;align-items:center;gap:12px;margin-top:36px;width:100%;">
          <button id="go-ad-btn" style="width:72%;max-width:280px;height:56px;background:linear-gradient(180deg,#FFD740 0%,#FFB300 100%);color:#7A4800;font-size:18px;font-weight:700;font-family:'Pretendard',system-ui,sans-serif;border:none;border-radius:28px;cursor:pointer;box-shadow:0 4px 0 rgba(0,0,0,0.3),0 0 16px rgba(255,200,0,0.3);letter-spacing:0.02em;transition:transform 0.1s;">📺&nbsp; 광고 보고 이어하기</button>
          <button id="go-restart-btn" style="width:72%;max-width:280px;height:50px;background:rgba(255,255,255,0.07);color:rgba(220,220,255,0.8);font-size:15px;font-weight:600;font-family:'Pretendard',system-ui,sans-serif;border:1.5px solid rgba(255,255,255,0.18);border-radius:25px;cursor:pointer;transition:transform 0.1s;">처음부터 다시</button>
        </div>

        <div style="font-size:12px;color:rgba(160,160,200,0.55);margin-top:18px;font-family:'Pretendard',system-ui,sans-serif;">⏳ 또는 15분 후 자동 충전</div>
      </div>

      <div style="position:absolute;bottom:0;left:0;right:0;height:4px;background:linear-gradient(90deg,transparent,#6A3EE8,transparent);z-index:1;"></div>
    `
  }
}
