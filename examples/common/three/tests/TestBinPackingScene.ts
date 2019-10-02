import {
  Mesh,
  MeshBasicMaterial,
  Object3D,
  Vector3,
	Vector2
} from 'three'
import { getSharedPlaneBufferGeometry } from '../../../../src/three/utils/geometry'
import BaseTestScene from './BaseTestScene'
import { makeHSL } from '../../../../src/three/utils/colors'
import { rand } from '../../../../src/utils/math'
import BinPacker from '../../../../src/BinPacker'
import { delay } from '../../utils/asyncUtils'
export default class TestMSDFGenScene extends BaseTestScene {
  pivot: Object3D
  constructor(testId = 5) {
    super()

    this.camera.position.z -= 0.2
    this.camera.position.y += 0.1
		this.camera.lookAt(new Vector3())
		const pivot = new Object3D()
		pivot.rotation.order = "YXZ"
		pivot.rotation.x = Math.PI * -0.5


		async function makeBinTest(atlasSize:number, binMinSize:number, binMaxSize:number, maxBins:number, delayMs:number) {
			const offset = new Vector3(0.5, 0.5, 0.0)
			const atlasPlane = new Mesh(
				getSharedPlaneBufferGeometry(false, false, offset),
				new MeshBasicMaterial({
					color: 0xffffff
				})
			)
			atlasPlane.scale.multiplyScalar(atlasSize)
			pivot.add(atlasPlane)
			pivot.scale.multiplyScalar(10/atlasSize)
			atlasPlane.position.set(atlasSize * -0.5, atlasSize * -0.5, -1/atlasSize-0.5)
			const binContainer = new Object3D()
			pivot.add(binContainer)
			binContainer.position.set(atlasSize * -0.5, atlasSize * -0.5, 0)
			const binPacker = new BinPacker(atlasSize, atlasSize)
			const start = performance.now()
			for(let i = 0; i < maxBins; i++){
				const bin = new Vector2(Math.round(rand(binMinSize, binMaxSize)), Math.round(rand(binMinSize, binMaxSize)))
				const packing = binPacker.add(bin, true)
				if(!packing.position) throw new Error('No more space in atlas')
				const pos = packing.position
				let h = Math.random() * 0.2
				if(packing.angle !== 0) {
					h+=0.5
				}
				const binMat = new MeshBasicMaterial({
					color: makeHSL(h, 0.8, 0.4),
					transparent: true,
					opacity: 0.5
				})
				const binPlane = new Mesh(
					getSharedPlaneBufferGeometry(false, false, offset),
					binMat
				)
				binContainer.add(binPlane)
				if(packing.angle !== 0) {
					pos.y += bin.x
					binPlane.rotation.z -= packing.angle
				}
				binPlane.position.set(pos.x, pos.y, 0)
				binPlane.scale.set(bin.x, bin.y, 1)
				if(delayMs > 0) {
					await delay(delayMs)
				}
			}
			console.log(`${(performance.now() - start).toFixed(2)}ms`)
		}
    const tests = [
      () => {
        makeBinTest(16, 2, 4, 3, 1000)
      },
      () => {
        makeBinTest(32, 3, 8, 15, 500)
      },
      () => {
        makeBinTest(128, 5, 20, 70, 100)
      },
      () => {
        makeBinTest(512, 8, 30, 600, 20)
      },
      () => {
        makeBinTest(1024, 8, 30, 2400, 0)
      },
      () => {
        makeBinTest(4096, 16, 60, 11000, 0)
      }
    ]

    try{
      tests[testId]()
    } catch(e) {
      console.error("Invalid test requested. Using test 2 instead.")
      tests[2]()
    }

    this.pivot = pivot
    pivot.scale.multiplyScalar(0.015)
    this.scene.add(pivot)
  }
  update(dt: number) {
    super.update(dt)
    this.pivot.rotation.y += dt * 0.1
  }
}
