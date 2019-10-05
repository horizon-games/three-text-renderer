import {
  Mesh,
  MeshBasicMaterial,
  Object3D,
  ShapePath,
  Vector2,
  Vector3,
  Box2
} from 'three'
import { parseSVGPath, makeSvgShapeMeshes } from '../../../../src/three/utils/svgHelpers'
import { makeTtfShapeMeshes } from '../../../../src/three/utils/ttfHelpers'
import SDFCurveMesh from '../../../../src/three/meshes/SDFCurveMesh'
import renderer from '../renderer'
import { getSharedPlaneBufferGeometry } from '../../../../src/three/utils/geometry'
import RobotoBold from '../../../fonts/Roboto-Bold.ttf'
import {
  testFontPathData1,
  testFontPathData2,
  testFontPathData3,
  TtfPathSegment
} from '../../testFontPathData'
import {
  testTtfPathData
} from '../../testTtfPathData'
import { testSvgPathData1, testSvgPathData2 } from '../../testSvgPathData'
import { lerp, rand } from '../../../../src/utils/math'

import MSDFKit from '../../../../src/three/msdf/MSDFKit'
import BaseTestScene from './BaseTestScene'
import TextRenderer, { TextDirection, Path } from '../../../../src'
import MDSFAtlas from '../../../../src/three/MSDFAtlas'
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
        const curveMesh = new SDFCurveMesh('bezier', 16, 1, 15)
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
        curveMesh.transform(new Vector2(32, -32), 1)
        pivot.add(curveMesh)
        msdfKit.add(curveMesh)
        curves.push(curveMesh)
        // if(i === 2) break
      }
    }

    function makeSvgShape(shape: ShapePath, padding:number, scale: number, offset: Vector2) {
      for(const curveMesh of makeSvgShapeMeshes(shape, padding, scale, offset)) {
        pivot.add(curveMesh)
        msdfKit.add(curveMesh)
        curves.push(curveMesh)
      }
    }
    function makeTtfShapeFloating(
      ttfPath: TtfPathSegment[],
      padding:number,
      windingOrder: 1 | -1,
      scale: number,
      offset: Vector2,
    ) {
      for(const curveMesh of makeTtfShapeMeshes(ttfPath, padding, windingOrder, 1, scale, offset)){
        pivot.add(curveMesh)
        msdfKit.add(curveMesh)
        curves.push(curveMesh)
      }
    }
    function makeTtfShape(
      ttfPath: TtfPathSegment[],
      pointsPerEm:number,
      fontSize:number,
      padding:number,
      pixelDensity: number,
      windingOrder: 1 | -1,
      yDir: 1 | -1
    ) {
      fontSize *= pixelDensity
      padding *= pixelDensity
      const bb = new Box2()
      const p = new Vector2()
      for(const seg of ttfPath) {
        if(seg.x !== undefined) {
          bb.expandByPoint(p.set(seg.x, yDir * seg.y!))
        }
        if(seg.x1 !== undefined) {
          bb.expandByPoint(p.set(seg.x1, yDir * seg.y1!))
        }
        if(seg.x2 !== undefined) {
          bb.expandByPoint(p.set(seg.x2, yDir * seg.y2!))
        }
      }
      const prescale = fontSize / pointsPerEm
      const size = new Vector2()
      bb.min.multiplyScalar(prescale)
      bb.max.multiplyScalar(prescale)
      bb.expandByScalar(padding)
      const offset = new Vector2(-bb.min.x, -bb.max.y)
      bb.getSize(size)
      msdfKit.resize(size, pixelDensity)
      for(const curveMesh of makeTtfShapeMeshes(ttfPath, padding, windingOrder, yDir, prescale, offset)){
        pivot.add(curveMesh)
        msdfKit.add(curveMesh)
        curves.push(curveMesh)
      }
    }
    const tests = [
      () => {
        makeProceduralPolyShape(6, 15, 1, 1)
        makeProceduralPolyShape(4, 5, -1, 0.5)
      },
      () => {
        makeSvgShape(parseSVGPath(testSvgPathData1), 8, 1, new Vector2(10, -30))
      },
      () => {
        for (const shapeStr of testSvgPathData2) {
          makeSvgShape(parseSVGPath(shapeStr), 8, 1.5, new Vector2(15, -60))
        }
      },
      () => {
        makeTtfShapeFloating(testFontPathData1, 12, 1, 0.35, new Vector2(-90, -75))
      },
      () => {
        for (const p of testFontPathData2) {
          makeTtfShapeFloating(p.commands, 12, -1, 0.25, new Vector2(-60, -55))
        }
      },
      () => {
        for (const p of testFontPathData3) {
          makeTtfShapeFloating(p.commands, 12, 1, 0.25, new Vector2(10, -60))
        }
      },
      () => {
        makeTtfShapeFloating(
          testFontPathData3[9].commands,
          12,
          1,
          0.5,
          new Vector2(-75, -110)
        )
      },
      () => {
        makeTtfShape(
          testTtfPathData,
          1,
          1,
          6,
          1,
          1,
          1
        )
      },
      async () => {
        const atlas = new MDSFAtlas(1024, 2, msdfKit)
        const textRenderer = new TextRenderer({atlas})

        textRenderer.addFont('Roboto-Bold', RobotoBold)
        const fontSize = 16
        const padding = 2
        const pixelDensity = 2
        const result = await textRenderer.getShapedGlyphs('A', {
          fontFace:'Roboto-Bold',
          fontSize,
          lang: 'en',
          direction: TextDirection.LTR
        })
        const path = result[0].glyphs[0].glyph.path
        if(path instanceof Path) {
          makeTtfShape(
            path.commands as TtfPathSegment[],
            path.unitsPerEm,
            fontSize,
            padding,
            pixelDensity,
            1,
            -1
          )
        } else {
          //Not sure when this would get executed
          const p = path()
          makeTtfShape(
            p.commands as TtfPathSegment[],
            p.unitsPerEm,
            fontSize,
            padding,
            pixelDensity,
            1,
            -1
          )
        }
      }
    ]

    try{
      tests[testId]()
    } catch(e) {
      console.error("Invalid test requested. Using test 4 instead.")
      tests[4]()
    }

    this.pivot = pivot
    pivot.scale.multiplyScalar(0.0015)
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
      showPrev(msdfKit.getPreviewMeshMSDF(), 0.13, -0.05)
      showPrev(msdfKit.getPreviewMeshTestMSDF(), 0.08, 0.03, 0.1)
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
