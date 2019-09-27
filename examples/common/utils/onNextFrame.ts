const callbacks: Array<() => void> = []

export function nextFrameUpdate() {
  if (callbacks.length > 0) {
    callbacks.forEach(cb => cb())
    callbacks.length = 0
  }
}

export function onNextFrame(callback: () => void) {
  callbacks.push(callback)
}
