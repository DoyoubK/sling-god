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
      <div style="flex:1"></div>

      <!-- title card -->
      <div style="
        background:rgba(26,42,58,0.88);
        border:2.5px solid rgba(255,255,255,0.85);
        border-radius:16px;
        padding:22px 36px 18px;
        text-align:center;
        position:relative;
        margin-top:60px;
      ">
        <!-- corner dots -->
        <div style="position:absolute;top:-5px;left:-5px;width:10px;height:10px;border-radius:50%;background:#F8D848;"></div>
        <div style="position:absolute;top:-5px;right:-5px;width:10px;height:10px;border-radius:50%;background:#F8D848;"></div>
        <div style="position:absolute;bottom:-5px;left:-5px;width:10px;height:10px;border-radius:50%;background:#F8D848;"></div>
        <div style="position:absolute;bottom:-5px;right:-5px;width:10px;height:10px;border-radius:50%;background:#F8D848;"></div>

        <div style="font-size:42px;font-weight:700;color:#fff;line-height:1.1;
          text-shadow:2px 2px 4px rgba(0,0,0,0.5);
          font-family:'Pretendard',system-ui,sans-serif;">
          새총의 신
        </div>
        <div style="font-size:14px;color:#A8D4F0;margin-top:8px;
          font-family:'Pretendard',system-ui,sans-serif;">
          날아가는 새를 맞혀라!
        </div>
        ${bestBadge}
      </div>

      <!-- middle spacer -->
      <div style="flex:1"></div>

      <!-- bottom area -->
      <div style="
        display:flex;flex-direction:column;align-items:center;
        gap:12px;padding-bottom:40px;width:100%;
      ">
        <button id="main-start-btn" style="
          width:270px;height:56px;
          background:#3182F6;color:#fff;
          font-size:18px;font-weight:700;
          font-family:'Pretendard',system-ui,sans-serif;
          border:none;border-radius:28px;
          cursor:pointer;
          box-shadow:0 4px 12px rgba(49,130,246,0.45);
          letter-spacing:0.02em;
        ">▶&nbsp; 게임 시작</button>

        <div style="
          font-size:12px;color:#7CB3E0;
          font-family:'Pretendard',system-ui,sans-serif;
        ">드래그로 조준  ✦  손 떼면 발사</div>
      </div>
    `
  }
}
