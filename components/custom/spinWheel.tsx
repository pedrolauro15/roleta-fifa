'use client'
import tickingSound from '@/assets/audio/spin-wheel-sound.mp3'
import { ISpinWheelProps } from '@/models/wheel.interface'
import { useEffect, useMemo, useState } from 'react'

const SpinWheel: React.FC<ISpinWheelProps> = ({
  segments: segs,
  onFinished,
  primaryColor = 'black',
  contrastColor = '#DDDDDD',
  buttonText = 'Spin',
  // isOnlyOnce = false,
  size = window.innerWidth > 700 ? 290 : 220,
  upDuration = Math.round(Math.random() * 100),
  downDuration = Math.round(Math.random() * 600),
  fontFamily = 'Poppins',
  arrowLocation = 'center',
  // showTextOnSpin = true,
  isSpinSound = true,
}: ISpinWheelProps) => {
  const ticTicSound: HTMLAudioElement | null = useMemo(
    () =>
      typeof window !== 'undefined' ? new Audio(tickingSound) : new Audio(),
    [],
  )
  function randomizeArray<T extends unknown[]>(arr: T) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[arr[i], arr[j]] = [arr[j], arr[i]]
    }
    return arr
  }

  const segments = randomizeArray(segs)

  const segmentTextArray = segments
    .map((segment) => segment.segmentText)
    .filter(Boolean)
  const segColorArray = segments.map((segment) => segment.segColor)
  const segIconArray = segments.map((segment) => segment.icon)
  const textColorArray = segments.map((segment) => segment.textColor)
  const iconCache: Record<string, HTMLImageElement> = {}

  const [isStarted, setIsStarted] = useState<boolean>(false)
  const [needleText, setNeedleText] = useState<string>('')

  let currentSegment = ''
  let animationFrameId: number | null = null
  let angleCurrent = 0
  let angleDelta = 0
  let canvasContext: CanvasRenderingContext2D | null = null
  let maxSpeed = Math.PI / Math.ceil(Math.random() * segmentTextArray.length)
  const upTime = Math.ceil(Math.random() * segmentTextArray.length) * upDuration
  const downTime =
    Math.ceil(Math.random() * segmentTextArray.length) * downDuration
  let spinStart = 0
  const centerX = size
  const centerY = size

  useEffect(() => {
    wheelInit()
    setTimeout(() => {
      window.scrollTo(0, 1)
    }, 0)
    preloadIcons()

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const preloadIcons = () => {
    segIconArray.forEach((iconSrc) => {
      if (iconSrc && !iconCache[iconSrc]) {
        const img = new Image()
        img.src = iconSrc
        iconCache[iconSrc] = img
      }
    })
  }

  const wheelInit = () => {
    initCanvas()
    wheelDraw()
  }

  const initCanvas = () => {
    let canvas: HTMLCanvasElement | null = document.getElementById(
      'canvas',
    ) as HTMLCanvasElement

    if (!canvas) {
      canvas = document.createElement('canvas')
      canvas.setAttribute('width', `${size * 2}`)
      canvas.setAttribute('height', `${size * 2}`)
      canvas.setAttribute('id', 'canvas')
      document?.getElementById('wheel')?.appendChild(canvas)
    }

    canvasContext = canvas.getContext('2d')
    canvas.style.borderRadius = '50%'
    canvas.addEventListener('click', () => spin(true), false)
  }

  const spin = (_animate: boolean | undefined = true) => {
    setIsStarted(true)
    if (!animationFrameId) {
      spinStart = new Date().getTime()
      maxSpeed = Math.PI / segmentTextArray.length
      if (_animate) {
        animate()
      }
    }
  }

  const animate = () => {
    const duration = new Date().getTime() - spinStart
    let progress = 0
    let finished = false

    if (duration < upTime) {
      progress = duration / upTime
      angleDelta = maxSpeed * Math.sin((progress * Math.PI) / 2)
    } else {
      progress = (duration - upTime) / downTime
      angleDelta = maxSpeed * Math.sin((progress * Math.PI) / 2 + Math.PI / 2)
      if (progress >= 1) finished = true
    }

    angleCurrent += angleDelta
    while (angleCurrent >= Math.PI * 2) angleCurrent -= Math.PI * 2

    wheelDraw()

    if (finished) {
      onFinished(currentSegment)
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId)
        animationFrameId = null
      }
      angleDelta = 0
      ticTicSound.pause()
      ticTicSound.currentTime = 0
    } else {
      animationFrameId = requestAnimationFrame(animate)
    }
  }

  useMemo(() => {
    ticTicSound.currentTime = 0
    if (needleText && isSpinSound && isStarted) {
      ticTicSound?.play()
    } else {
      ticTicSound.pause()
      ticTicSound.currentTime = 0
    }
  }, [ticTicSound, needleText, isSpinSound, isStarted])

  const wheelDraw = () => {
    if (!canvasContext) return
    clear()
    drawWheel()
    drawNeedle()
  }

  const drawSegment = (key: number, lastAngle: number, angle: number) => {
    const ctx = canvasContext
    if (!ctx) return
    const value = segmentTextArray[key]
    const iconSrc = segIconArray[key]

    ctx.save()
    ctx.beginPath()
    ctx.moveTo(centerX, centerY)
    ctx.arc(centerX, centerY, size, lastAngle, angle, false)
    ctx.lineTo(centerX, centerY)
    ctx.closePath()
    ctx.fillStyle = segColorArray[key] || contrastColor
    ctx.fill()
    ctx.stroke()

    if (iconSrc && iconCache[iconSrc]) {
      const img = iconCache[iconSrc]
      const imgX = size / 1.18
      const imgY = -20

      ctx.save()
      ctx.translate(centerX, centerY)
      ctx.rotate((lastAngle + angle) / 2)
      ctx.drawImage(img, imgX, imgY, 40, 40)
      ctx.restore()
    }

    ctx.save()
    ctx.translate(centerX, centerY)
    ctx.rotate((lastAngle + angle) / 2)
    ctx.fillStyle = textColorArray[key] || contrastColor
    ctx.font = 'medium 1em ' + fontFamily
    ctx.fillText(value.substring(0, 21), size / 2 + 20, 0)
    ctx.restore()
  }

  const drawWheel = () => {
    if (!canvasContext) return
    const ctx = canvasContext
    let lastAngle = angleCurrent
    const len = segmentTextArray.length
    const PI2 = Math.PI * 2
    ctx.lineWidth = 1
    ctx.strokeStyle = primaryColor
    ctx.textBaseline = 'middle'
    ctx.textAlign = 'center'
    ctx.font = '1em ' + fontFamily
    for (let i = 1; i <= len; i++) {
      const angle = PI2 * (i / len) + angleCurrent
      drawSegment(i - 1, lastAngle, angle)
      lastAngle = angle
    }

    ctx.beginPath()
    ctx.arc(centerX, centerY, 30, 0, PI2, false)
    ctx.closePath()
    ctx.fillStyle = primaryColor
    ctx.fill()
    ctx.font = 'bold 1em ' + fontFamily
    ctx.fillStyle = contrastColor
    ctx.fillText(buttonText, centerX, centerY + 3)

    ctx.beginPath()
    ctx.arc(centerX, centerY, size, 0, PI2, false)
    ctx.closePath()
    ctx.lineWidth = 4
    ctx.strokeStyle = primaryColor
    ctx.stroke()
  }

  const drawNeedle = () => {
    if (!canvasContext) return
    const ctx = canvasContext
    ctx.lineWidth = 1
    ctx.strokeStyle = contrastColor
    ctx.beginPath()

    if (arrowLocation === 'top') {
      ctx.moveTo(centerX + 20, centerY / 15)
      ctx.lineTo(centerX - 20, centerY / 15)
      ctx.lineTo(centerX, centerY - centerY / 1.35)
    } else {
      ctx.moveTo(centerX + 20, centerY - 30)
      ctx.lineTo(centerX - 20, centerY - 30)
      ctx.lineTo(centerX, centerY - centerY / 2.5)
    }

    ctx.closePath()
    ctx.fill()

    const change = angleCurrent + Math.PI / 2
    let i =
      segmentTextArray.length -
      Math.floor((change / (Math.PI * 2)) * segmentTextArray.length) -
      1
    if (i < 0) i += segmentTextArray.length
    else if (i >= segmentTextArray.length) i -= segmentTextArray.length
    ctx.fillStyle = primaryColor
    ctx.font = 'bold 1.5em ' + fontFamily
    currentSegment = segmentTextArray[i]
    setNeedleText(segmentTextArray[i])
  }

  const clear = () => {
    if (!canvasContext) return
    canvasContext.clearRect(0, 0, size * 2, size * 2)
  }

  return <div id="wheel" className="wheel"></div>
}

export default SpinWheel
