import Phaser from 'phaser'
import { TDS } from '../constants/TDS'

type ButtonVariant = 'primary' | 'secondary' | 'danger'

interface ButtonOptions {
  scene: Phaser.Scene
  x: number
  y: number
  width?: number
  height?: number
  label: string
  variant?: ButtonVariant
  onClick: () => void
}

const COLORS: Record<ButtonVariant, { normal: number; hover: number; text: string }> = {
  primary:   { normal: TDS.color.blue,      hover: TDS.color.blueHover, text: TDS.color.css.white },
  secondary: { normal: TDS.color.lightGray, hover: 0xCDD1D5,            text: TDS.color.css.dark  },
  danger:    { normal: TDS.color.danger,    hover: 0xDC2626,            text: TDS.color.css.white },
}

export function createButton(options: ButtonOptions): Phaser.GameObjects.Container {
  const { scene, x, y, width = 280, height = 56, label, variant = 'primary', onClick } = options
  const c = COLORS[variant]
  const radius = height / 2  // 완전한 pill 모양

  const drawBg = (g: Phaser.GameObjects.Graphics, color: number) => {
    g.clear()
    // 그림자
    g.fillStyle(0x000000, 0.18)
    g.fillRoundedRect(-width/2 + 2, -height/2 + 4, width, height, radius)
    // 본체
    g.fillStyle(color)
    g.fillRoundedRect(-width/2, -height/2, width, height, radius)
    // 상단 하이라이트
    g.fillStyle(0xFFFFFF, 0.18)
    g.fillRoundedRect(-width/2 + 6, -height/2 + 4, width - 12, height * 0.38, radius)
  }

  const bg = scene.add.graphics()
  drawBg(bg, c.normal)

  const hitZone = scene.add.rectangle(0, 0, width, height, 0x000000, 0)
    .setInteractive({ useHandCursor: true })

  const text = scene.add.text(0, 1, label, {
    fontSize: '18px',
    fontFamily: TDS.font.family,
    color: c.text,
    fontStyle: 'bold',
  }).setOrigin(0.5)

  const container = scene.add.container(x, y, [bg, hitZone, text])

  hitZone.on('pointerdown', onClick)
  hitZone.on('pointerover',  () => drawBg(bg, c.hover))
  hitZone.on('pointerout',   () => drawBg(bg, c.normal))

  return container
}
