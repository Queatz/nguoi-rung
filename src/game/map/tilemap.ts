import {
    AbstractMesh,
    Color3, Color4, DirectionalLight,
    Mesh,
    MeshBuilder,
    Quaternion,
    Scene,
    StandardMaterial,
    Texture,
    Vector3, VertexBuffer,
    VertexData
} from '@babylonjs/core'

export class Tilemap {

    mesh: Mesh
    vertexData: VertexData

    treeBase: Mesh
    treeShadowBase: Mesh

    // { 'x,y,z,d': index }
    tiles: any = {}

    // { 'x,y,z,d': [mesh, mesh] }
    objects: any = {}

    constructor(private scene: Scene, private sun: DirectionalLight, private addShadowCaster: (mesh: AbstractMesh) => void, private removeShadowCaster: (mesh: AbstractMesh) => void) {

        // Objects

        const box = MeshBuilder.CreatePlane("root", {
            width: 2,
            height: 8
        })

        let bv = box.getVerticesData(VertexBuffer.PositionKind)!
        bv = bv.map((pos, index) => index % 3 === 2 ? pos : index % 3 === 1 ? pos + 4 : pos)
        box.setVerticesData(VertexBuffer.PositionKind, bv, false)

        box.isVisible = false

        const m = new StandardMaterial('Pine Tree')
        m.diffuseTexture = new Texture('assets/pine.png', scene, {
            samplingMode: Texture.NEAREST_SAMPLINGMODE
        })
        m.diffuseTexture.wrapU = Texture.CLAMP_ADDRESSMODE
        m.diffuseTexture.wrapV = Texture.CLAMP_ADDRESSMODE
        m.diffuseTexture.hasAlpha = true
        m.diffuseColor = Color3.White()
        m.specularColor = Color3.Black()
        m.backFaceCulling = false
        box.material = m

        const shadowMesh = box.clone('Tree shadow')
        shadowMesh.material = m.clone('Tree Shadow')
        shadowMesh.material.disableColorWrite = true
        shadowMesh.material.disableDepthWrite = true
        shadowMesh.isVisible = false

        // Has to happen after shadow clone
        box.receiveShadows = true

        box.registerInstancedBuffer('color', 4)

        this.treeBase = box
        this.treeShadowBase = shadowMesh

        // Tiles

        const mat = new StandardMaterial('mat', scene)
        mat.backFaceCulling = false
        mat.roughness = .5
        mat.specularColor = Color3.Black()
        mat.diffuseColor = Color3.White()
        mat.diffuseTexture = new Texture(
            'https://i.imgur.com/P6dZ2On.jpg',
            scene,
            {
                samplingMode: Texture.NEAREST_SAMPLINGMODE
            }
        )

        const vertexData = new VertexData()
        vertexData.positions = [] as Array<number>
        vertexData.indices = [] as Array<number>
        vertexData.normals = [] as Array<number>
        vertexData.uvs = [] as Array<number>
        this.vertexData = vertexData

        const mesh = new Mesh('Ground', scene)
        mesh.material = mat
        mesh.receiveShadows = true
        vertexData.applyToMesh(mesh, true)
        this.mesh = mesh

        this.addShadowCaster(this.mesh)
    }

    key = (position: Vector3, side: Side) => {
        return `${position.x},${position.y},${position.z},${side}`
    }

    setTile = (position: Vector3, side: Side) => {
        // todo
        if (side.length > 1) {
            side = side.substring(1) as Side
        }

        const key = this.key(position, side)

        if (key in this.tiles) return

        const c = this.vertexData.positions!.length / 3
        this.tiles[key] = c

        const indices = [
            c + 0,
            c + 1,
            c + 2,

            c + 2,
            c + 3,
            c + 0,
        ]

        const positions = side === 'y' ? [
            position.x,
            position.y,
            position.z,

            position.x + 1,
            position.y + 0,
            position.z + 0,

            position.x + 1,
            position.y + 0,
            position.z + 1,

            position.x + 0,
            position.y + 0,
            position.z + 1,
        ] : side === 'z' ? [
            position.x,
            position.y,
            position.z,

            position.x + 1,
            position.y + 0,
            position.z + 0,

            position.x + 1,
            position.y + 1,
            position.z + 0,

            position.x + 0,
            position.y + 1,
            position.z + 0,
        ] : [
            position.x,
            position.y,
            position.z,

            position.x + 0,
            position.y + 1,
            position.z + 0,

            position.x + 0,
            position.y + 1,
            position.z + 1,

            position.x + 0,
            position.y + 0,
            position.z + 1,
        ]

        const uvs = side === 'y' ? [
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

        ;(this.vertexData.positions as Array<number>).push(...positions)
        ;(this.vertexData.uvs as Array<number>).push(...uvs)
        ;(this.vertexData.indices as Array<number>).push(...indices)

        VertexData.ComputeNormals(this.vertexData.positions, this.vertexData.indices, this.vertexData.normals)
        this.vertexData.applyToMesh(this.mesh, true)
    }

    removeTile = (position: Vector3, side: Side) => {
        // todo
        if (side.length > 1) {
            side = side.substring(1) as Side
        }

        const key = this.key(position, side)

        if (!(key in this.tiles)) return

        const c = this.tiles[key] / 4 // index
        const s = c * 6

        ;(this.vertexData.indices as Array<number>).splice(s, 6)
        ;(this.vertexData.positions as Array<number>).splice(c * 4 * 3, 4 * 3)
        ;(this.vertexData.normals as Array<number>).splice(c * 4 * 3, 4 * 3)
        ;(this.vertexData.uvs as Array<number>).splice(c * 4 * 2, 4 * 2)

        for (let i = s; i < this.vertexData.indices!.length; i++) {
            this.vertexData.indices![i] -= 4
        }

        this.vertexData.applyToMesh(this.mesh, true)

        delete this.tiles[key]

        for (let k of Object.keys(this.tiles)) {
            if (this.tiles[k] >= c * 4) {
                this.tiles[k] -= 4
            }
        }
    }

    removeObject = (position: Vector3, side: Side) => {
        const key = this.key(position, side)

        const meshes = this.objects[key]

        if (meshes) {
            meshes.forEach((mesh: Mesh) => {
                this.scene.removeMesh(mesh)
                this.removeShadowCaster(mesh)
            })
        }

        delete this.objects[key]
    }

    addObject = (position: Vector3, side: Side) => {
        const key = this.key(position, side)
        if (this.objects[key]) {
            return
        }

        const camera = this.scene.activeCamera!

        const tree = this.treeBase.createInstance('Tree')

        switch (side) {
            case 'y':
                tree.position.copyFrom(position.add(new Vector3(.5, 0, .5)))
                tree.onAfterWorldMatrixUpdateObservable.add((node) => {
                    const v = node.position.subtract(this.scene.activeCamera!.globalPosition)
                    v.y = 0
                    node.rotationQuaternion = Quaternion.FromLookDirectionRH(
                        v.normalize(),
                        Vector3.Up()
                    )
                })
                break
            case 'x':
                tree.position.copyFrom(position.add(new Vector3(0, .5, .5)))
                tree.rotation.z = -Math.PI / 2
                tree.onAfterWorldMatrixUpdateObservable.add((node) => {
                    const v = node.position.subtract(this.scene.activeCamera!.globalPosition)
                    v.x = 0
                    node.rotationQuaternion = Quaternion.FromLookDirectionRH(
                        v.normalize(),
                        Vector3.Right()
                    )
                })
                break
            case 'z':
                tree.position.copyFrom(position.add(new Vector3(.5, .5, 0)))
                tree.rotation.x = Math.PI / 2
                tree.onAfterWorldMatrixUpdateObservable.add((node) => {
                    const v = node.position.subtract(this.scene.activeCamera!.globalPosition)
                    v.z = 0
                    node.rotationQuaternion = Quaternion.FromLookDirectionRH(
                        v.normalize(),
                        Vector3.Forward()
                    )
                })
                break
            case '-y':
                tree.position.copyFrom(position.add(new Vector3(.5, 0, .5)))
                tree.rotation.z = -Math.PI
                tree.onAfterWorldMatrixUpdateObservable.add((node) => {
                    const v = node.position.subtract(this.scene.activeCamera!.globalPosition)
                    v.y = 0
                    node.rotationQuaternion = Quaternion.FromLookDirectionRH(
                        v.normalize(),
                        Vector3.Down()
                    )
                })
                break
            case '-x':
                tree.position.copyFrom(position.add(new Vector3(0, .5, .5)))
                tree.rotation.z = Math.PI / 2
                tree.onAfterWorldMatrixUpdateObservable.add((node) => {
                    const v = node.position.subtract(this.scene.activeCamera!.globalPosition)
                    v.x = 0
                    node.rotationQuaternion = Quaternion.FromLookDirectionRH(
                        v.normalize(),
                        Vector3.Left()
                    )
                })
                break
            case '-z':
                tree.position.copyFrom(position.add(new Vector3(.5, .5, 0)))
                tree.rotation.x = -Math.PI / 2
                tree.onAfterWorldMatrixUpdateObservable.add((node) => {
                    const v = node.position.subtract(this.scene.activeCamera!.globalPosition)
                    v.z = 0
                    node.rotationQuaternion = Quaternion.FromLookDirectionRH(
                        v.normalize(),
                        Vector3.Backward()
                    )
                })
                break
        }

        const color = new Color4(0, .2, .4, 0).scale(Math.random())
        tree.instancedBuffers['color'] = new Color4(1, 1, 1, 1).subtract(color)
        tree.scaling.scaleInPlace(.5 + Math.random())

        const sh = this.treeShadowBase.createInstance('Tree Shadow')
        sh.position.copyFrom(tree.position)
        sh.scaling.copyFrom(tree.scaling)

        // todo needs to be updated when light is rotated
        if (side === 'y' || side === '-y') {
            const q = Quaternion.FromLookDirectionLH(this.sun.direction, Vector3.Up()).toEulerAngles().y
            // sh.position.y -= .5
            sh.addRotation(0, q + Math.PI / 2, 0)
        } else if (side === 'x' || side === '-x') {
            const q = Quaternion.FromLookDirectionLH(this.sun.direction, Vector3.Right()).toEulerAngles().x
            sh.addRotation(q + Math.PI / 2, 0, 0)
            // sh.position.x -= .5
        } else if (side === 'z' || side === '-z') {
            const q = Quaternion.FromLookDirectionLH(this.sun.direction, Vector3.Forward()).toEulerAngles().z
            sh.addRotation(0, 0, q + Math.PI / 2)
            // sh.position.z -= .5
        }
        this.addShadowCaster(sh)

        this.objects[key] = [tree, sh]
    }
}

export type Side = 'x' | 'y' | 'z' | '-x' | '-y' | '-z'
