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
      background: 'rgba(12, 8, 18, 0.96)',
      pointerEvents: 'auto',
    })

    // 애니메이션 스타일 주입
    const style = document.createElement('style')
    style.textContent = `
      @keyframes missionSlideDown {
        0%   { transform: translateY(-60px) scaleX(0.7); opacity: 0; }
        60%  { transform: translateY(6px)   scaleX(1.04); opacity: 1; }
        100% { transform: translateY(0)     scaleX(1); opacity: 1; }
      }
      @keyframes missionFadeUp {
        0%   { transform: translateY(20px); opacity: 0; }
        100% { transform: translateY(0);    opacity: 1; }
      }
      @keyframes missionPulse {
        0%, 100% { box-shadow: 0 0 24px rgba(255,40,40,0.5), inset 0 1px 0 rgba(255,255,255,0.12); }
        50%      { box-shadow: 0 0 48px rgba(255,40,40,0.9), inset 0 1px 0 rgba(255,255,255,0.12); }
      }
      @keyframes scanline {
        0%   { transform: translateY(-100%); }
        100% { transform: translateY(100vh); }
      }
      .mission-fail-label {
        animation: missionSlideDown 0.55s cubic-bezier(0.22,1,0.36,1) forwards,
                   missionPulse 2s ease-in-out 0.6s infinite;
      }
      .mission-info {
        animation: missionFadeUp 0.5s ease forwards;
        opacity: 0;
        animation-delay: 0.6s;
      }
      .mission-buttons {
        animation: missionFadeUp 0.5s ease forwards;
        opacity: 0;
        animation-delay: 0.9s;
      }
    `
    document.head.appendChild(style)
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
      <!-- 스캔라인 효과 -->
      <div style="position:absolute;inset:0;pointer-events:none;overflow:hidden;z-index:0;">
        <div style="
          position:absolute;left:0;right:0;height:2px;
          background:rgba(255,255,255,0.04);
          animation: scanline 3s linear infinite;
        "></div>
      </div>

      <!-- 상단 빨간 줄 -->
      <div style="
        position:absolute;top:0;left:0;right:0;height:4px;
        background:linear-gradient(90deg,transparent,#FF3C3C,transparent);z-index:1;
      "></div>

      <!-- 중앙 콘텐츠 -->
      <div style="
        display:flex;flex-direction:column;align-items:center;
        gap:0;text-align:center;padding:0 32px;position:relative;z-index:2;
      ">
        <div style="font-size:52px;line-height:1;">💀</div>

        <!-- 미션 실패 배너 -->
        <div class="mission-fail-label" style="
          margin-top:20px;
          background:linear-gradient(180deg,#FF3C3C 0%,#C01010 100%);
          border:1.5px solid rgba(255,120,120,0.4);
          border-radius:6px;padding:10px 36px;
        ">
          <div style="
            font-size:30px;font-weight:900;color:#FFFFFF;
            font-family:'Pretendard',system-ui,sans-serif;
            letter-spacing:0.12em;
          ">미션 실패</div>
        </div>

        <!-- 레벨 / 명중 정보 -->
        <div class="mission-info" style="margin-top:28px;">
          <div style="
            font-size:16px;color:rgba(180,180,180,0.85);
            font-family:'Pretendard',system-ui,sans-serif;letter-spacing:0.04em;
          ">Lv.${data.level} 도전 &nbsp;·&nbsp; 명중 ${data.hits}마리</div>

          <div style="margin-top:14px;display:flex;gap:8px;justify-content:center;align-items:center;">
            <span style="font-size:22px;opacity:0.25;">🖤</span>
            <span style="font-size:22px;opacity:0.25;">🖤</span>
            <span style="font-size:22px;opacity:0.25;">🖤</span>
          </div>

          <div style="
            margin-top:10px;font-size:13px;color:rgba(255,90,90,0.8);
            font-family:'Pretendard',system-ui,sans-serif;
          ">하트가 모두 소진되었습니다</div>
        </div>

        <!-- 버튼 -->
        <div class="mission-buttons" style="
          display:flex;flex-direction:column;align-items:center;
          gap:12px;margin-top:36px;width:100%;
        ">
          <button id="go-ad-btn" style="
            width:280px;height:56px;
            background:linear-gradient(180deg,#4D9EFF 0%,#2570E8 100%);
            color:#fff;font-size:17px;font-weight:700;
            font-family:'Pretendard',system-ui,sans-serif;
            border:none;border-radius:28px;cursor:pointer;
            box-shadow:0 4px 16px rgba(49,130,246,0.45);letter-spacing:0.02em;
          ">📺&nbsp; 광고 보고 이어하기</button>

          <button id="go-restart-btn" style="
            width:280px;height:52px;background:transparent;
            color:rgba(180,180,180,0.75);font-size:15px;font-weight:600;
            font-family:'Pretendard',system-ui,sans-serif;
            border:1px solid rgba(180,180,180,0.2);border-radius:26px;cursor:pointer;
          ">처음부터 다시</button>
        </div>

        <div style="
          font-size:12px;color:rgba(120,120,120,0.6);margin-top:20px;
          font-family:'Pretendard',system-ui,sans-serif;
        ">⏳ 또는 15분 후 자동 충전</div>
      </div>

      <!-- 하단 빨간 줄 -->
      <div style="
        position:absolute;bottom:0;left:0;right:0;height:4px;
        background:linear-gradient(90deg,transparent,#FF3C3C,transparent);z-index:1;
      "></div>
    `
  }
}
