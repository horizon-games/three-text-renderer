export const isWebGLAvailable = () => {
  try {
    const canvas = document.createElement('canvas')
    return (
      !!(window as any).WebGLRenderingContext &&
      (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
    )
  } catch (e) {
    return false
  }
}

export const isWebGL2Available = () => {
  try {
    const canvas = document.createElement('canvas')
    return (
      !!(window as any).WebGL2RenderingContext && canvas.getContext('webgl2')
    )
  } catch (e) {
    return false
  }
}
