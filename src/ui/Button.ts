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

  const bg = scene.add.rectangle(0, 0, width, height, c.normal)
    .setInteractive({ useHandCursor: true })

  const text = scene.add.text(0, 0, label, {
    fontSize: '18px',
    fontFamily: TDS.font.family,
    color: c.text,
    fontStyle: 'bold',
  }).setOrigin(0.5)

  const container = scene.add.container(x, y, [bg, text])

  bg.on('pointerdown', onClick)
  bg.on('pointerover', () => bg.setFillStyle(c.hover))
  bg.on('pointerout',  () => bg.setFillStyle(c.normal))

  return container
}
