import {
  CubicBezierCurve,
  LineCurve,
  Mesh,
  MeshBasicMaterial,
  Object3D,
  Path,
  ShapePath,
  Vector2,
  Vector3
} from 'three'
import { parseSVGPath } from '../../../../src/three/utils/svgHelpers'
import SDFCurveMesh from '../../../../src/three/meshes/SDFCurveMesh'
import renderer from '../renderer'
import { getSharedPlaneBufferGeometry } from '../../../../src/three/utils/geometry'
import {
  testFontPathData1,
  testFontPathData2,
  testFontPathData3,
  TtfPathSegment
} from '../../testFontPathData'
import { testSvgPathData1, testSvgPathData2 } from '../../testSvgPathData'
import { lerp, rand } from '../../../../src/utils/math'

import MSDFKit from '../../../../src/three/msdf/MSDFKit'
import BaseTestScene from './BaseTestScene'
export default class TestMSDFGenScene extends BaseTestScene {
  pivot: Object3D
  msdfKit: MSDFKit
  thrash: boolean = false
  curves: SDFCurveMesh[] = []
  constructor(testId = 4) {
    super()
    const msdfKit = new MSDFKit()

    this.camera.position.z -= 0.2
    this.camera.position.y += 0.1
    this.camera.lookAt(new Vector3())
    const pivot = new Object3D()
    const deviation = 0.125
    function devia(n1: number, n2: number, mix: number, grow: number) {
      return (lerp(n1, n2, mix) + rand(-deviation, deviation)) * grow
    }
    // const colors = [new Color(1, 1, 0), new Color(0, 1, 1), new Color(1, 0, 1)]
    const curves = this.curves
    function makeProceduralPolyShape(
      segments: number,
      scale: number,
      dir: 1 | -1,
      wavy = 0
    ) {
      for (let i = 0; i < segments; i++) {
        const r = (i / segments) * Math.PI * 2 * dir
        const r2 = ((i + 1) / segments) * Math.PI * 2 * dir
        let ci = i % 3
        if (i === segments - 1 && ci === 0) {
          ci++
        }
        const curveMesh = new SDFCurveMesh('bezier', 16, 1)
        // const curveMesh = new SDFCurveMesh(16, colors[ci])
        const x = Math.cos(r) * scale
        const y = Math.sin(r) * scale
        const x2 = Math.cos(r2) * scale
        const y2 = Math.sin(r2) * scale
        curveMesh.setAnchor1(x, y)
        const s = lerp(1.0, (i % 3) / 2 + 0.8, wavy)
        // const s = 1
        curveMesh.setHandle1(devia(x, x2, 1 / 3, s), devia(y, y2, 1 / 3, s))
        curveMesh.setHandle2(devia(x, x2, 2 / 3, s), devia(y, y2, 2 / 3, s))
        curveMesh.setAnchor2(x2, y2)
        pivot.add(curveMesh)
        msdfKit.add(curveMesh)
        curves.push(curveMesh)
        // if(i === 2) break
      }
    }

    function makeSvgShape(shape: ShapePath, offset: Vector2, scale: number) {
      for (const subPath of shape.subPaths as Path[]) {
        for (const curve of subPath.curves) {
          let curveMesh: SDFCurveMesh | undefined
          if (curve instanceof CubicBezierCurve) {
            curveMesh = new SDFCurveMesh('bezier', 16, 1)
            curveMesh.setAnchor1v(curve.v0)
            curveMesh.setHandle1v(curve.v1)
            curveMesh.setHandle2v(curve.v2)
            curveMesh.setAnchor2v(curve.v3)
          } else if (curve instanceof LineCurve) {
            curveMesh = new SDFCurveMesh('linear', 2, 1)
            curveMesh.setAnchor1v(curve.v1)
            curveMesh.setHandle1(
              lerp(curve.v1.x, curve.v2.x, 1 / 3),
              lerp(curve.v1.y, curve.v2.y, 1 / 3)
            )
            curveMesh.setHandle2(
              lerp(curve.v1.x, curve.v2.x, 2 / 3),
              lerp(curve.v1.y, curve.v2.y, 2 / 3)
            )
            curveMesh.setAnchor2v(curve.v2)
          } else {
            debugger
          }
          if (curveMesh) {
            pivot.add(curveMesh)
            msdfKit.add(curveMesh)
            curves.push(curveMesh)
            curveMesh.transform(offset, scale)
          } else {
            debugger
          }
        }
      }
    }
    function makeTtfShape(
      ttfPath: TtfPathSegment[],
      offset: Vector2,
      scale: number,
      windingOrder: 1 | -1
    ) {
      const cursor = new Vector2()
      for (const seg of ttfPath) {
        let curveMesh: SDFCurveMesh | undefined
        switch (seg.type) {
          case 'M':
            cursor.set(seg.x!, seg.y!)
            break
          case 'C':
            curveMesh = new SDFCurveMesh('bezier', 16, windingOrder)
            curveMesh.setAnchor1v(cursor)
            curveMesh.setHandle1(seg.x1!, seg.y1!)
            curveMesh.setHandle2(seg.x2!, seg.y2!)
            cursor.set(seg.x!, seg.y!)
            curveMesh.setAnchor2v(cursor)
            break
          case 'Q':
            curveMesh = new SDFCurveMesh('quadratic', 16, windingOrder)
            curveMesh.setAnchor1v(cursor)
            curveMesh.setHandle1(seg.x1!, seg.y1!)
            cursor.set(seg.x!, seg.y!)
            curveMesh.setAnchor2v(cursor)
            break
          case 'L':
            curveMesh = new SDFCurveMesh('linear', 2, windingOrder)
            curveMesh.setAnchor1v(cursor)
            cursor.set(seg.x!, seg.y!)
						curveMesh.setAnchor2v(cursor)
						break
          case 'Z':
            break
          default:
            debugger
        }
        if (curveMesh) {
          pivot.add(curveMesh)
          msdfKit.add(curveMesh)
          curves.push(curveMesh)
          curveMesh.transform(offset, scale)
        }
      }
    }
    const tests = [
      () => {
        makeProceduralPolyShape(6, 1.5, 1, 1)
        makeProceduralPolyShape(4, 0.5, -1, 0.5)
      },
      () => {
        makeSvgShape(parseSVGPath(testSvgPathData1), new Vector2(10, 10), 0.1)
      },
      () => {
        for (const shapeStr of testSvgPathData2) {
          makeSvgShape(parseSVGPath(shapeStr), new Vector2(10, 13), 0.1)
        }
      },
      () => {
        makeTtfShape(testFontPathData1, new Vector2(340, 80), 0.02, 1)
      },
      () => {
        for (const p of testFontPathData2) {
          makeTtfShape(p.commands, new Vector2(440, 180), 0.02, -1)
        }
      },
      () => {
        for (const p of testFontPathData3) {
          makeTtfShape(p.commands, new Vector2(40, 120), 0.02, 1)
        }
      },
      () => {
        makeTtfShape(
          testFontPathData3[9].commands,
          new Vector2(140, 120),
          0.04,
          1
        )
      }
    ]

    try{
      tests[testId]()
    } catch(e) {
      console.error("Invalid test requested. Using test 4 instead.")
      tests[4]()
    }

    this.pivot = pivot
    pivot.scale.multiplyScalar(0.015)
    this.scene.add(pivot)
    this.msdfKit = msdfKit
    const showPrev = (obj: Object3D, x: number, z: number, scale = 0.05) => {
      obj.scale.multiplyScalar(scale)
      obj.position.x = x
      obj.position.z = z
      obj.rotation.x = this.camera.rotation.x
      this.scene.add(obj)
    }
    setTimeout(() => {
      msdfKit.render(renderer)
      showPrev(msdfKit.getPreviewMeshChannels(), -0.08, 0, 0.04)
      showPrev(msdfKit.getPreviewMesh(), 0.13, -0.05)
      showPrev(msdfKit.getPreviewMeshTestMSDF(), 0.08, 0.05, 0.1)
      // this.thrash = true
    }, 500)
    const groundPlane = new Mesh(
      getSharedPlaneBufferGeometry(),
      new MeshBasicMaterial({
        color: 0xff0000,
        transparent: true,
        opacity: 0.2
      })
    )
    groundPlane.rotation.x = Math.PI * -0.5
    groundPlane.position.y = -0.01
    groundPlane.scale.multiplyScalar(10)
    this.pivot.add(groundPlane)
  }
  update(dt: number) {
    super.update(dt)
    this.pivot.rotation.y += dt * 0.1
    if (this.thrash) {
      this.msdfKit.render(renderer)
    }
  }
}
