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
 * Callbacks handle '광고 보고 이어하기' and '처음부터 다시' actions.
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
      background: '#F9FAFB',
      pointerEvents: 'auto',
    })
  }

  showWithData(data: GameOverData, callbacks: GameOverCallbacks) {
    this.el.innerHTML = this.buildHTML(data)

    const adBtn = this.el.querySelector<HTMLButtonElement>('#go-ad-btn')!
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
    return `
      <!-- top divider -->
      <div style="
        position:absolute;top:18%;left:0;right:0;
        height:2px;background:#E5E8EB;
      "></div>

      <!-- content -->
      <div style="
        display:flex;flex-direction:column;align-items:center;
        gap:0;text-align:center;padding:0 24px;
      ">
        <div style="font-size:56px;line-height:1;">😢</div>

        <div style="
          font-size:34px;font-weight:700;color:#191F28;
          font-family:'Pretendard',system-ui,sans-serif;
          margin-top:24px;
        ">아쉽네요!</div>

        <div style="
          font-size:19px;color:#6B7684;
          font-family:'Pretendard',system-ui,sans-serif;
          margin-top:12px;
        ">Lv.${data.level} 도전 실패</div>

        <div style="
          font-size:16px;font-weight:700;color:#3182F6;
          font-family:'Pretendard',system-ui,sans-serif;
          margin-top:10px;
        ">이번 명중: ${data.hits}마리</div>

        <!-- buttons -->
        <div style="
          display:flex;flex-direction:column;align-items:center;
          gap:14px;margin-top:40px;width:100%;
        ">
          <button id="go-ad-btn" style="
            width:280px;height:56px;
            background:#3182F6;color:#fff;
            font-size:18px;font-weight:700;
            font-family:'Pretendard',system-ui,sans-serif;
            border:none;border-radius:28px;cursor:pointer;
            box-shadow:0 4px 12px rgba(49,130,246,0.35);
          ">📺&nbsp; 광고 보고 이어하기</button>

          <button id="go-restart-btn" style="
            width:280px;height:56px;
            background:#E5E8EB;color:#191F28;
            font-size:18px;font-weight:700;
            font-family:'Pretendard',system-ui,sans-serif;
            border:none;border-radius:28px;cursor:pointer;
          ">처음부터 다시</button>
        </div>

        <div style="
          font-size:13px;color:#6B7684;margin-top:22px;
          font-family:'Pretendard',system-ui,sans-serif;
        ">⏳ 또는 15분 후 자동 충전</div>
      </div>
    `
  }
}
