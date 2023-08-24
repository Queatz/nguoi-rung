import {
    ArcRotateCamera, ArcRotateCameraMouseWheelInput,
    CascadedShadowGenerator, Color3, DefaultRenderingPipeline, DirectionalLight,
    KeyboardEventTypes, Matrix, Mesh, MeshBuilder, PBRMaterial, Plane,
    PointerEventTypes, Scene, SSAO2RenderingPipeline, StandardMaterial, Texture, Vector3, VertexBuffer, VertexData
} from '@babylonjs/core'

export class Map {
    constructor(scene: Scene) {
        scene.fogMode = Scene.FOGMODE_EXP2
        // scene.fogMode = Scene.FOGMODE_LINEAR
        scene.fogStart = 10
        scene.fogEnd = 100
        scene.fogDensity = 0.01
        scene.fogColor = new Color3(.8, .8, .8)
        scene.clearColor = scene.fogColor.toColor4()
        scene.ambientColor = scene.fogColor

        let camera = new ArcRotateCamera('camera1', Math.PI / 4, Math.PI / 4, 15, Vector3.Zero(), scene)
        camera.attachControl()
        ;(camera.inputs.attached['mousewheel'] as ArcRotateCameraMouseWheelInput).zoomToMouseLocation = true
        ;(camera.inputs.attached['mousewheel'] as ArcRotateCameraMouseWheelInput).wheelPrecision = 20
        camera.fov = 1
        camera.maxZ = 100

        // const ssao = new SSAO2RenderingPipeline('ssaopipeline', scene, {
        //     ssaoRatio: .5,
        //     blurRatio: .5
        // }, [camera])
        // ssao.radius = 5
        // ssao.totalStrength = .5
        // ssao.samples = 16
        // ssao.bypassBlur = true
        // ssao.bilateralSamples = 16
        // ssao.maxZ = ssao.maxZ = camera.maxZ / 2
        //
        // const pipeline = new DefaultRenderingPipeline(
        //     'defaultPipeline', // The name of the pipeline
        //     true, // Do you want the pipeline to use HDR texture?
        //     scene, // The scene instance
        //     [camera] // The list of cameras to be attached to
        // )
        //
        // pipeline.sharpenEnabled = true
        // pipeline.sharpen.edgeAmount = .5
        // pipeline.sharpen.colorAmount = 1
        //
        // pipeline.bloomEnabled = true
        // pipeline.bloomThreshold = .8
        // pipeline.bloomWeight = 0.5
        // pipeline.bloomKernel = 64
        // pipeline.bloomScale = .5

        let sun = new DirectionalLight('sun', new Vector3(.25, -1, .5).normalize(), scene)
        sun.intensity = 5
        sun.shadowMinZ = camera.minZ
        sun.shadowMaxZ = camera.maxZ
        // todo sun position needs to follow camera global position

        const sphere = MeshBuilder.CreatePlane('tile', {size: 1, updatable: true}, scene)
        sphere.material = new StandardMaterial('mat', scene)
        ;
        (sphere.material as StandardMaterial).emissiveColor = Color3.White().scale(1.5)
            ;
        (sphere.material as StandardMaterial).specularColor = Color3.Black()
        sphere.material.alpha = .5
        sphere.material.backFaceCulling = false
        // sphere.material.wireframe = true
        sphere.material.zOffsetUnits = -0.01
        sphere.rotation = new Vector3(Math.PI / 2, 0, 0)

        const brushGrid = MeshBuilder.CreateGround('Grid', {
            width: 10,
            height: 10,
            subdivisions: 10
        }, scene)

        const wireframe = new StandardMaterial('Wireframe')
        wireframe.diffuseColor = Color3.Black()
        wireframe.specularColor = Color3.Black()
        // wireframe.alpha = .25
        wireframe.pointSize = 3
        wireframe.pointsCloud = true
        wireframe.zOffsetUnits = .01
        brushGrid.material = wireframe

        const player = MeshBuilder.CreatePlane('tile', {size: 1, updatable: true}, scene)
        player.material = new StandardMaterial('mat', scene)
        
        ;(player.material as StandardMaterial).diffuseColor = Color3.Red()
        player.material.backFaceCulling = false
        player.billboardMode = Mesh.BILLBOARDMODE_Y

        // { 'x,y,z,d': index }
        const tiles: any = {}

        let v = sphere.getVerticesData(VertexBuffer.PositionKind)!

        v = v.map((pos, index) => index % 3 === 2 ? pos : pos + .5)

        sphere.setVerticesData(VertexBuffer.PositionKind, v, false)

        const tilePos = new Vector3(0, 0, 0)
        let z = 0
        let isWall: 'x'|'y'|'z' = 'y'
        let drawPlane: 'x'|'y'|'z' = 'y'
        let isDrawing = false
        let isMoving = false
        let walk = Vector3.Zero()
        let autoRotate = true
        // todo press A to switch side of tile (6 sides total)

        scene.onKeyboardObservable.add(event => {
            if (['w', 'a', 's', 'd'].indexOf(event.event.key) !== -1) {
                if (event.type === KeyboardEventTypes.KEYDOWN) {
                    switch (event.event.key) {
                        case 'w':
                            walk.y = 1
                            break
                        case 's':
                            walk.y = -1
                            break
                        case 'a':
                            walk.x = -1
                            break
                        case 'd':
                            walk.x = 1
                            break
                    }
                } else if (event.type === KeyboardEventTypes.KEYUP) {
                        switch (event.event.key) {
                        case 'w':
                        case 's':
                            walk.y = 0
                            break
                        case 'a':
                        case 'd':
                            walk.x = 0
                            break
                    }
                }
                return
            }

            if (event.type === KeyboardEventTypes.KEYDOWN) {
                if (event.event.key === ' ') {
                    if (event.event.ctrlKey) {
                        isWall = isWall === 'y' ? 'z' : isWall === 'z' ? 'x' : 'y'
                    } else {
                        const ray = scene.createPickingRay(scene.pointerX, scene.pointerY, Matrix.Identity(), camera)
                        const pickedPoint = ray.intersectsMesh(mesh).pickedPoint
                        let pos = tilePos

                        if (pickedPoint) {
                            // note these are rotated 1 step forward
                            if (drawPlane === 'x') {
                                pos = pickedPoint.add(new Vector3(0, .5, 0)).floor()
                            } else if (drawPlane === 'y') {
                                pos = pickedPoint.add(new Vector3(0, 0, .5)).floor()
                            } else if (drawPlane === 'z') {
                                pos = pickedPoint.add(new Vector3(.5, 0, 0)).floor()
                            }
                        }

                        switch (drawPlane) {
                            case 'x':
                                drawPlane = 'y'
                                z = pos.y
                                isWall = 'y'
                                break
                            case 'y':
                                drawPlane = 'z'
                                z = pos.z
                                isWall = 'z'
                                break
                            default:
                                drawPlane = 'x'
                                z = pos.x
                                isWall = 'x'
                                break
                        }
                        if (drawPlane === 'x') {
                            brushGrid.rotation = new Vector3(0, 0, Math.PI / 2)
                        } else if (drawPlane === 'y') {
                            brushGrid.rotation = new Vector3(0, -Math.PI / 2, 0)
                        } else {
                            brushGrid.rotation = new Vector3(Math.PI / 2, 0, 0)
                        }
                    }

                    if (isWall === 'z') {
                        sphere.rotation = new Vector3(0, 0, 0)
                    } else if (isWall === 'x') {
                        sphere.rotation = new Vector3(0, -Math.PI / 2, 0)
                    } else {
                        sphere.rotation = new Vector3(Math.PI / 2, 0, 0)
                    }
                }
                if (event.event.key === '[') {
                    z -= 1
                }
                if (event.event.key === ']') {
                    z += 1
                }
            }
        })

        const mat = new PBRMaterial('mat', scene)
        mat.backFaceCulling = false
        mat.roughness = .9
        mat.albedoColor = Color3.White()
        mat.albedoTexture = new Texture(
            'https://i.imgur.com/P6dZ2On.jpg',
            scene,
            undefined,
            false,
            Texture.NEAREST_SAMPLINGMODE
        )


        const vertexData = new VertexData()
        vertexData.positions = [] as Array<number>
        vertexData.indices = [] as Array<number>
        vertexData.normals = [] as Array<number>
        vertexData.uvs = [] as Array<number>

        const mesh = new Mesh('Ground', scene)
        mesh.material = mat
        mesh.receiveShadows = true
        vertexData.applyToMesh(mesh, true)

        const shadowGenerator = new CascadedShadowGenerator(256, sun)
        shadowGenerator.lambda = .8
        shadowGenerator.bias = .04
        shadowGenerator.setDarkness(0.5)
        shadowGenerator.transparencyShadow = true
        shadowGenerator.stabilizeCascades = true
        shadowGenerator.shadowMaxZ = sun.shadowMaxZ
        shadowGenerator.splitFrustum()
        shadowGenerator.getShadowMap()!.renderList!.push(mesh)

        scene.onPointerObservable.add(event => {
            if (event.type === PointerEventTypes.POINTERUP) {
                isMoving = false
                isDrawing = false
                camera.attachControl()
                return
            }

            if (isMoving) return

            if (event.type !== PointerEventTypes.POINTERDOWN && !isDrawing) {
                return
            }

            if (event.event.shiftKey) {
                camera.attachControl()
                isMoving = true
                return
            } else {
                camera.detachControl()
                isDrawing = true
            }

            const key = `${sphere.position.x},${sphere.position.y},${sphere.position.z},${isWall}`

            if (event.event.ctrlKey) {
                const ray = scene.createPickingRay(scene.pointerX, scene.pointerY, Matrix.Identity(), camera)
                const pickedPoint = ray.intersectsMesh(mesh).pickedPoint

                if (pickedPoint) {
                    let pos = pickedPoint

                    if (drawPlane === 'x') {
                        pos = pickedPoint.add(isWall === 'y' ? new Vector3(.5, .5, 0) : isWall === 'z' ? new Vector3(.5, 0, .5) : new Vector3(.5, 0, 0)).floor()
                    } else if (drawPlane === 'y') {
                        pos = pickedPoint.add(isWall === 'y' ? new Vector3(0, .5, 0) : isWall === 'z' ? new Vector3(0, .5, .5) : new Vector3(.5, .5, 0)).floor()
                    } else if (drawPlane === 'z') {
                        pos = pickedPoint.add(isWall === 'y' ? new Vector3(0, .5, .5) : isWall === 'z' ? new Vector3(0, 0, .5) : new Vector3(.5, 0, .5)).floor()
                    }

                    if (drawPlane === 'x') {
                        z = pos.x
                    } else if (drawPlane === 'y') {
                        z = pos.y
                    } else if (drawPlane === 'z') {
                        z = pos.z
                    }
                }
                return
            }

            if (event.event.altKey) {
                if (!(key in tiles)) return

                const c = tiles[key] / 4 // index
                const s = c * 6

                ;(vertexData.indices as Array<number>).splice(s, 6)
                ;(vertexData.positions as Array<number>).splice(c * 4 * 3, 4 * 3)
                ;(vertexData.normals as Array<number>).splice(c * 4 * 3, 4 * 3)
                ;(vertexData.uvs as Array<number>).splice(c * 4 * 2, 4 * 2)

                for (let i = s; i < vertexData.indices!.length; i++) {
                    vertexData.indices![i] -= 4
                }

                vertexData.applyToMesh(mesh, true)

                delete tiles[key]

                for (let k of Object.keys(tiles)) {
                    if (tiles[k] >= c * 4) {
                        tiles[k] -= 4
                    }
                }

                return
            }
            if (key in tiles) return
            const c = vertexData.positions!.length / 3
            tiles[key] = c

            const indices = [
                c + 0,
                c + 1,
                c + 2,

                c + 2,
                c + 3,
                c + 0,
            ]

            const positions = isWall === 'y' ? [
                sphere.position.x,
                sphere.position.y,
                sphere.position.z,

                sphere.position.x + 1,
                sphere.position.y + 0,
                sphere.position.z + 0,

                sphere.position.x + 1,
                sphere.position.y + 0,
                sphere.position.z + 1,

                sphere.position.x + 0,
                sphere.position.y + 0,
                sphere.position.z + 1,
            ] : isWall === 'z' ? [
                sphere.position.x,
                sphere.position.y,
                sphere.position.z,

                sphere.position.x + 1,
                sphere.position.y + 0,
                sphere.position.z + 0,

                sphere.position.x + 1,
                sphere.position.y + 1,
                sphere.position.z + 0,

                sphere.position.x + 0,
                sphere.position.y + 1,
                sphere.position.z + 0,
            ] : [
                sphere.position.x,
                sphere.position.y,
                sphere.position.z,

                sphere.position.x + 0,
                sphere.position.y + 1,
                sphere.position.z + 0,

                sphere.position.x + 0,
                sphere.position.y + 1,
                sphere.position.z + 1,

                sphere.position.x + 0,
                sphere.position.y + 0,
                sphere.position.z + 1,
            ]

            const uvs = isWall === 'y' ? [
                    0,
                    0,

                    .25,
                    0,

                    .25,
                    .5,

                    0,
                    .5,
                ] : [
                    .75,
                    .5,

                    1,
                    .5,

                    1,
                    1,

                    .75,
                    1,
                ]

            ;(vertexData.positions as Array<number>).push(...positions)
            ;(vertexData.uvs as Array<number>).push(...uvs)
            ;(vertexData.indices as Array<number>).push(...indices)

            VertexData.ComputeNormals(vertexData.positions, vertexData.indices, vertexData.normals)
            vertexData.applyToMesh(mesh, true)
        })

        scene.registerBeforeRender(() => {
            if (scene.getFrameId() > 1) {
                if (scene.deltaTime < 1000) {
                    const walkForward = camera.getDirection(Vector3.Forward()).multiply(new Vector3(1, 0, 1)).normalize().scale(walk.y)
                    const walkRight = camera.getDirection(Vector3.Right()).multiply(new Vector3(1, 0, 1)).normalize().scale(walk.x)
                    camera.target.addInPlace(walkForward.add(walkRight).normalize().scale(2).scale(scene.deltaTime / 1000))
                    player.position.copyFrom(camera.target)
                }
                const plane = Plane.FromPositionAndNormal(new Vector3(drawPlane === 'x' ? z : 0, drawPlane === 'y' ? z : 0, drawPlane === 'z' ? z : 0), drawPlane === 'x' ? Vector3.Right() : drawPlane === 'y' ? Vector3.Up() : Vector3.Forward())
                const ray = scene.createPickingRay(scene.pointerX, scene.pointerY, Matrix.Identity(), camera)
                const pickedPoint = Vector3.Zero()

                ray.origin.projectOnPlaneToRef(plane, ray.origin.add(ray.direction), pickedPoint)

                if (pickedPoint) {
                    let pos = pickedPoint

                    if (drawPlane === 'x') {
                        pos = pickedPoint.add(isWall === 'y' ? new Vector3(.5, .5, 0) : isWall === 'z' ? new Vector3(.5, 0, .5) : new Vector3(.5, 0, 0)).floor()
                    } else if (drawPlane === 'y') {
                        // pos = pickedPoint.add(isWall === 'y' ? new Vector3(0, .5, 0) : isWall === 'z' ? new Vector3(0, .5, .5) : new Vector3(.5, .5, 0)).floor()
                        if (isWall === 'y') {
                            pos = pickedPoint.add(new Vector3(0, .5, 0)).floor()
                        } else {
                            const zPos = pickedPoint.add(new Vector3(0, .5, .5)).floor()
                            const xPos = pickedPoint.add(new Vector3(.5, .5, 0)).floor()

                            if (autoRotate && (Math.abs(pickedPoint.z - zPos.z) > .25 || Math.abs(pickedPoint.x - xPos.x) > .25)) {
                                if (Math.abs(pickedPoint.z - zPos.z) < Math.abs(pickedPoint.x - xPos.x)) {
                                    isWall = 'z'
                                    pos = zPos
                                } else {
                                    isWall = 'x'
                                    pos = xPos
                                }
                                if (isWall === 'z') {
                                    sphere.rotation = new Vector3(0, 0, 0)
                                } else if (isWall === 'x') {
                                    sphere.rotation = new Vector3(0, -Math.PI / 2, 0)
                                } else {
                                    sphere.rotation = new Vector3(Math.PI / 2, 0, 0)
                                }
                            } else {
                                pos = pickedPoint.add(isWall === 'z' ? new Vector3(0, .5, .5) : new Vector3(.5, .5, 0)).floor()
                            }
                        }
                    } else if (drawPlane === 'z') {
                        pos = pickedPoint.add(isWall === 'y' ? new Vector3(0, .5, .5) : isWall === 'z' ? new Vector3(0, 0, .5) : new Vector3(.5, 0, .5)).floor()
                    }

                    tilePos.copyFrom(pos)
                    sphere.position.copyFrom(tilePos)
                    brushGrid.position.copyFrom(tilePos)
                }
            }
        })
    }
}
