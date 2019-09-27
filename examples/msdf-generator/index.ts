import BasicTestBed from "../common/three/tests/BasicTestBed"
import TestMSDFGenScene from '../common/three/tests/TestMSDFGenScene'
import { getUrlInt } from "../common/utils/location"
document.addEventListener('gesturestart', e => e.preventDefault()) // disable zooming on mobile


const bts = new TestMSDFGenScene(getUrlInt('test', 4))

const btb = new BasicTestBed(bts)
