import BasicTestBed from "../common/three/tests/BasicTestBed"
import TestBinPackingScene from '../common/three/tests/TestBinPackingScene'
import { getUrlInt } from "../common/utils/location"
document.addEventListener('gesturestart', e => e.preventDefault()) // disable zooming on mobile

const bps = new TestBinPackingScene(getUrlInt('test', 5))

//@ts-ignore
new BasicTestBed(bps)
