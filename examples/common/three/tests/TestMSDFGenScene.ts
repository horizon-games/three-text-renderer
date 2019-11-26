import {
  Mesh,
  MeshBasicMaterial,
  Object3D,
  ShapePath,
  Vector2,
  Vector3
} from 'three'

import TextRenderer, { Path, TextDirection } from '../../../../src'
import { PathSegment } from '../../../../src/Path'
import SDFCurveMesh from '../../../../src/three/meshes/SDFCurveMesh'
import { ISDFKit } from '../../../../src/three/msdf/ISDFKit'
import MSDFKit from '../../../../src/three/msdf/MSDFKit'
import SDFKit from '../../../../src/three/msdf/SDFKit'
import SDFAtlas from '../../../../src/three/SDFAtlas'
import { getSharedPlaneBufferGeometry } from '../../../../src/three/utils/geometry'
import {
  makeSvgShapeMeshes,
  parseSVGPath
} from '../../../../src/three/utils/svgHelpers'
import {
  makeTtfFontShapeMeshes,
  makeTtfRawShapeMeshes
} from '../../../../src/three/utils/ttfHelpers'
import { lerp, rand } from '../../../../src/utils/math'
import AmiriBold from '../../../fonts/Amiri-Bold.ttf'
import RobotoBold from '../../../fonts/Roboto-Bold.ttf'
import {
  testFontPathData1,
  testFontPathData2,
  testFontPathData3
} from '../../testFontPathData'
import { testSvgPathData1, testSvgPathData2 } from '../../testSvgPathData'
import { testTtfPathData } from '../../testTtfPathData'
import { getUrlParam } from '../../utils/location'
import renderer from '../renderer'

import BaseTestScene from './BaseTestScene'

let sdfMode: 'sdf' | 'msdf' = 'msdf'
if (getUrlParam('sdfMode') === 'msdf') {
  sdfMode = 'msdf'
}

function makeISDFKit(
  mode: 'sdf' | 'msdf',
  width: number,
  height: number,
  pixelDensity: number
): ISDFKit {
  if (mode === 'sdf') {
    return new SDFKit(width, height, pixelDensity, true)
  } else {
    return new MSDFKit(width, height, pixelDensity)
  }
}

export default class TestMSDFGenScene extends BaseTestScene {
  pivot: Object3D
  sdfKit: ISDFKit
  thrash: boolean = false
  curves: SDFCurveMesh[] = []
  constructor(testId = 4) {
    super()
    const sdfKit = makeISDFKit(sdfMode, 64, 64, 1)

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
        sdfKit.add(curveMesh)
        curves.push(curveMesh)
        // if(i === 2) break
      }
    }

    function makeSvgShape(
      shape: ShapePath,
      padding: number,
      scale: number,
      offset: Vector2
    ) {
      for (const curveMesh of makeSvgShapeMeshes(
        shape,
        padding,
        scale,
        offset
      )) {
        pivot.add(curveMesh)
        sdfKit.add(curveMesh)
        curves.push(curveMesh)
      }
    }
    function makeTtfShapeRaw(
      ttfPath: PathSegment[],
      padding: number,
      windingOrder: 1 | -1,
      scale: number,
      offset: Vector2
    ) {
      for (const curveMesh of makeTtfRawShapeMeshes(
        ttfPath,
        padding,
        windingOrder,
        1,
        scale,
        offset
      )) {
        pivot.add(curveMesh)
        sdfKit.add(curveMesh)
        curves.push(curveMesh)
      }
    }
    function makeTtfShape(
      ttfPath: PathSegment[],
      pointsPerEm: number,
      fontSize: number,
      padding: number,
      pixelDensity: number,
      windingOrder: 1 | -1,
      yDir: 1 | -1
    ) {
      const result = makeTtfFontShapeMeshes(
        ttfPath,
        pointsPerEm,
        fontSize,
        padding,
        pixelDensity,
        windingOrder,
        yDir
      )
      sdfKit.resize(result.size, result.pixelDensity)
      for (const curveMesh of result.meshes) {
        pivot.add(curveMesh)
        sdfKit.add(curveMesh)
        curves.push(curveMesh)
      }
    }
    const tests = [
      () => {
        // makeProceduralPolyShape(4, 15, 1, 1)
        makeProceduralPolyShape(6, 15, 1, 1)
        makeProceduralPolyShape(4, 5, -1, 0.5)
        // makeProceduralPolyShape(4, 5, -1, 0.5)
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
        makeTtfShapeRaw(testFontPathData1, 12, 1, 0.35, new Vector2(-90, -75))
      },
      () => {
        for (const p of testFontPathData2) {
          makeTtfShapeRaw(p.commands, 12, -1, 0.25, new Vector2(-60, -55))
        }
      },
      () => {
        for (const p of testFontPathData3) {
          makeTtfShapeRaw(p.commands, 12, 1, 0.25, new Vector2(10, -60))
        }
      },
      () => {
        makeTtfShapeRaw(
          testFontPathData3[9].commands,
          12,
          1,
          0.5,
          new Vector2(-75, -110)
        )
      },
      () => {
        makeTtfShape(testTtfPathData, 1, 1, 6, 1, 1, 1)
      },
      async () => {
        const atlas = new SDFAtlas(1024, 2, sdfKit)
        const textRenderer = new TextRenderer({ atlas })

        textRenderer.addFont('Roboto-Bold', RobotoBold)
        textRenderer.addFont('Amiri-Bold', AmiriBold)

        const fontSize = 16
        const padding = 2
        const pixelDensity = 2
        const result = await textRenderer.getShapedGlyphs('ج', {
          fontFace: 'Amiri-Bold',
          fontSize,
          lang: 'en',
          direction: TextDirection.LTR,
          yDir: 1
        })
        const path = result[0].glyphs[0].transformedPath
        if (path instanceof Path) {
          makeTtfShape(
            path.commands,
            path.unitsPerEm,
            fontSize,
            padding,
            pixelDensity,
            1,
            -1
          )
        }
      }
    ]

    try {
      tests[testId]()
    } catch (e) {
      console.error('Invalid test requested. Using test 4 instead.')
      tests[4]()
    }

    this.pivot = pivot
    pivot.scale.multiplyScalar(0.0015)
    this.scene.add(pivot)
    this.sdfKit = sdfKit
    const showPrev = (obj: Object3D, x: number, z: number, scale = 0.05) => {
      obj.scale.multiplyScalar(scale)
      obj.position.x = x
      obj.position.z = z
      obj.rotation.x = this.camera.rotation.x
      this.scene.add(obj)
    }
    setTimeout(() => {
      sdfKit.render(renderer)
      showPrev(sdfKit.getRawPreviewMesh(), 0.13, -0.05)
      showPrev(sdfKit.getChannelsPreviewMesh(), -0.08, 0, 0.04)
      showPrev(sdfKit.getSDFTestPreviewMesh(), 0.08, 0.03, 0.1)
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
      this.sdfKit.render(renderer)
    }
  }
}
