export const BATTERY_SAVINGS_MODE = false

type DeviceType = 'mobile' | 'tablet' | 'desktop'
type DeviceOrientation = 'landscape' | 'portrait'

type Listener = () => void

class Device {
  width: number
  height: number
  aspect: number
  deviceWidth: number // landscape orientation
  deviceHeight: number // landscape orientation
  deviceAspect: number // landscape orientation
  orientation: DeviceOrientation
  pixelRatio: number
  fps: number = 0
  targetFPS: number
  useTouch: boolean
  type: DeviceType
  listeners: Set<Listener> = new Set()
  private cachedPPCm: number = -1

  constructor() {
    window.addEventListener('resize', () => {
      this.handleChange()

      // XXX Fix for IOS homescreen: Need to wait a little bit for the screen to settle
      setTimeout(this.handleChange, 50)
    })
    this.handleChange()
  }

  handleChange = () => {
    this.useTouch = /Mobi|Android|iPhone|iPad|BlackBerry|Windows Phone|webOS/i.test(
      navigator.userAgent
    )

    if (
      this.width === window.innerWidth &&
      this.height === window.innerHeight
    ) {
      return
    }

    this.width = window.innerWidth
    this.height = window.innerHeight
    this.aspect = this.width / this.height
    this.deviceHeight = Math.min(this.width, this.height)
    this.deviceWidth = Math.max(this.width, this.height)
    this.deviceAspect = this.deviceWidth / this.deviceHeight
    this.pixelRatio = window.devicePixelRatio
    this.orientation = this.aspect < 1 ? 'portrait' : 'landscape'
    this.type = this.useTouch
      ? this.deviceWidth < 1024 && this.deviceAspect > 1.6
        ? 'mobile'
        : 'tablet'
      : 'desktop'

    this.listeners.forEach(listener => listener())
  }

  onChange(listener: Listener, firstOneForFree = false) {
    this.listeners.add(listener)
    if (firstOneForFree) {
      listener()
    }

    return () => this.listeners.delete(listener)
  }

  get isMobile() {
    return this.type === 'mobile'
  }

  get isTablet() {
    return this.type === 'tablet'
  }

  get isDesktop() {
    return this.type === 'desktop'
  }

  get isIOS() {
    return /^(iPhone|iPad|iPod)/.test(navigator.platform)
  }

  get pixelsPerCm() {
    if (this.cachedPPCm === -1) {
      // create an empty element
      const div = document.createElement('div')
      // give it an absolute size of one inch
      div.style.height = '1in'
      // append it to the body
      const body = document.getElementsByTagName('body')[0]
      body.appendChild(div)
      // read the computed width
      const ppi = getComputedStyle(div, null).getPropertyValue('height')
      // remove it again
      body.removeChild(div)
      // and return the value
      this.cachedPPCm = parseFloat(ppi) * 2.54
    }
    return this.cachedPPCm
  }

  get screenHeightCms() {
    return this.height / this.pixelsPerCm
  }

  get screenWidthCms() {
    return this.width / this.pixelsPerCm
  }

  get screenShorterCms() {
    return Math.min(this.width, this.height) / this.pixelsPerCm
  }

  get performance() {
    if (device.fps < this.targetFPS * 0.4) {
      // < 24 FPS
      return 'low'
    } else if (device.fps < this.targetFPS * 0.8) {
      // > 24 < 48 FPS
      return 'medium'
    } else {
      // > 48 FPS
      return 'high'
    }
  }
}

const device = new Device()
;(window as any).device = device

export default device
