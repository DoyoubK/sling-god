import { HTMLOverlay } from '../HTMLOverlay'
import { GameManager } from '../../utils/GameManager'

/**
 * MainMenuOverlay — full-screen HTML overlay for the main menu.
 * Sits on top of the Phaser canvas; canvas animations remain visible behind.
 */
export class MainMenuOverlay extends HTMLOverlay {
  constructor(onStart: () => void) {
    super('main-menu-overlay')

    const gm = GameManager.getInstance()

    Object.assign(this.el.style, {
      position: 'absolute',
      inset: '0',
      flexDirection: 'column',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '0',
      pointerEvents: 'auto',
    })

    this.el.innerHTML = this.buildHTML(gm.bestLevel)

    const btn = this.el.querySelector<HTMLButtonElement>('#main-start-btn')!
    btn.addEventListener('click', () => {
      this.hide()
      onStart()
    })

    // pulse animation on start button
    const style = document.createElement('style')
    style.textContent = `
      @keyframes pulse {
        0%, 100% { transform: scale(1); }
        50%       { transform: scale(1.04); }
      }
      #main-start-btn {
        animation: pulse 1.7s ease-in-out infinite;
      }
      #main-start-btn:active {
        animation: none;
        transform: scale(0.97);
      }
    `
    document.head.appendChild(style)
  }

  private buildHTML(bestLevel: number): string {
    const bestBadge =
      bestLevel > 1
        ? `<div style="
            background:#F8A030;border-radius:8px;padding:5px 18px;
            font-size:14px;color:#fff;font-weight:700;margin-top:6px;
          ">★ 최고 기록  Lv.${bestLevel}</div>`
        : ''

    return `
      <!-- top spacer -->
      <div style="flex:0 0 64px"></div>

      <!-- title card -->
      <div style="
        background: linear-gradient(160deg, rgba(10,28,50,0.92) 0%, rgba(20,48,80,0.88) 100%);
        border: 1.5px solid rgba(168,212,255,0.30);
        border-radius: 24px;
        padding: 26px 40px 22px;
        text-align: center;
        position: relative;
        box-shadow: 0 8px 32px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.08);
        backdrop-filter: blur(8px);
      ">
        <!-- 상단 황금 장식선 -->
        <div style="
          position:absolute;top:0;left:50%;transform:translateX(-50%);
          width:60%;height:2px;
          background:linear-gradient(90deg,transparent,#F8D848,transparent);
          border-radius:1px;
        "></div>

        <!-- 메인 타이틀 -->
        <div style="
          font-size:46px;font-weight:900;line-height:1.0;
          font-family:'Pretendard',system-ui,sans-serif;
          background: linear-gradient(180deg, #FFFFFF 0%, #C8E8FF 60%, #8BC4F0 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          filter: drop-shadow(0 2px 8px rgba(49,130,246,0.5));
          letter-spacing:-0.01em;
        ">새총의 신</div>

        <!-- 하단 장식선 -->
        <div style="
          width:40%;height:1px;margin:12px auto 10px;
          background:linear-gradient(90deg,transparent,rgba(168,212,255,0.4),transparent);
        "></div>

        <div style="
          font-size:13px;color:#A8D4F0;letter-spacing:0.04em;
          font-family:'Pretendard',system-ui,sans-serif;
        ">날아가는 새를 맞혀라!</div>

        ${bestBadge}
      </div>

      <!-- middle spacer -->
      <div style="flex:1"></div>

      <!-- bottom area -->
      <div style="
        display:flex;flex-direction:column;align-items:center;
        gap:12px;padding-bottom:48px;width:100%;
      ">
        <button id="main-start-btn" style="
          width:260px;height:56px;
          background: linear-gradient(180deg, #4D9EFF 0%, #2570E8 100%);
          color:#fff;
          font-size:18px;font-weight:700;
          font-family:'Pretendard',system-ui,sans-serif;
          border: none;
          border-radius:28px;
          cursor:pointer;
          box-shadow: 0 4px 20px rgba(49,130,246,0.55), inset 0 1px 0 rgba(255,255,255,0.25);
          letter-spacing:0.04em;
        ">▶  게임 시작</button>

        <div style="
          font-size:12px;color:rgba(124,179,224,0.7);letter-spacing:0.04em;
          font-family:'Pretendard',system-ui,sans-serif;
    `
  }
}
