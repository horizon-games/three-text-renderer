import PrerenderKit from "./PrerenderKit"

let __prerenderKit: PrerenderKit
export function getPrerenderKit() {
  if (!__prerenderKit) {
    __prerenderKit = new PrerenderKit()
  }
  return __prerenderKit
}
