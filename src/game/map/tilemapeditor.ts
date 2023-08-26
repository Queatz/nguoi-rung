import {
    Color3,
    Matrix,
    Mesh,
    MeshBuilder, Plane,
    Scene,
    StandardMaterial,
    Texture,
    Vector3,
    VertexBuffer
} from '@babylonjs/core'
import {GridMaterial} from '@babylonjs/materials'
import {Side, Tilemap} from "./tilemap";

export class TilemapEditor {

    cursor: Mesh
    grid: Mesh

    tilePos = new Vector3(0, 0, 0)
    side: Side = 'y'
    drawPlane: Side = 'y'
    drawPlaneOffset = 0
    drawMode: 'tile' | 'object' = 'tile'
    autoRotate = true
    brushShape: 'circle' | 'square' = 'square'
    brushSize = 1
    brushDensity = 100

    constructor(private scene: Scene, private tilemap: Tilemap) {
        const cursor = MeshBuilder.CreatePlane('tile', {size: 1, updatable: true}, scene)
        cursor.material = new StandardMaterial('mat', scene)
        ;
        (cursor.material as StandardMaterial).emissiveColor = Color3.White().scale(1.5)
        ;
        (cursor.material as StandardMaterial).specularColor = Color3.Black()
        cursor.material.alpha = .5
        cursor.material.backFaceCulling = false
        cursor.material.zOffsetUnits = -0.01
        cursor.rotation = new Vector3(Math.PI / 2, 0, 0)

        this.cursor = cursor

        // todo user can set this up to 101
        const planeGridSize = 51
        const brushGrid = MeshBuilder.CreateGround('Grid', {
            width: planeGridSize,
            height: planeGridSize,
            subdivisions: planeGridSize
        }, scene)

        this.grid = brushGrid

        const grid = new GridMaterial("grid", scene);
        grid.backFaceCulling = false
        grid.opacityTexture = new Texture('assets/glow.png', scene)
        grid.mainColor = Color3.Black()
        grid.lineColor = new Color3(.25, .5, 1)
        grid.opacity = .25
        grid.alpha = .25
        grid.gridRatio = 1
        grid.majorUnitFrequency = 1
        grid.zOffsetUnits = -.01
        grid.fogEnabled = true
        grid.gridOffset = new Vector3(.5, 0, .5)

        brushGrid.material = grid
        let v = cursor.getVerticesData(VertexBuffer.PositionKind)!

        v = v.map((pos, index) => index % 3 === 2 ? pos : pos + .5)

        cursor.setVerticesData(VertexBuffer.PositionKind, v, false)
    }

    update = () => {
        const plane = Plane.FromPositionAndNormal(new Vector3(this.drawPlane === 'x' ? this.drawPlaneOffset : 0, this.drawPlane === 'y' ? this.drawPlaneOffset : 0, this.drawPlane === 'z' ? this.drawPlaneOffset : 0), this.drawPlane === 'x' ? Vector3.Right() : this.drawPlane === 'y' ? Vector3.Up() : Vector3.Forward())
        const ray = this.scene.createPickingRay(this.scene.pointerX, this.scene.pointerY, Matrix.Identity(), this.scene.activeCamera!)
        const pickedPoint = Vector3.Zero()

        ray.origin.projectOnPlaneToRef(plane, ray.origin.add(ray.direction), pickedPoint)

        if (pickedPoint) {
            let pos = pickedPoint

            if (this.drawPlane === 'x') {
                // todo support auto-rotate
                pos = pickedPoint.add(this.side === 'y' ? new Vector3(.5, .5, 0) : this.side === 'z' ? new Vector3(.5, 0, .5) : new Vector3(.5, 0, 0)).floor()
            } else if (this.drawPlane === 'y') {
                // pos = pickedPoint.add(this.side === 'y' ? new Vector3(0, .5, 0) : this.side === 'z' ? new Vector3(0, .5, .5) : new Vector3(.5, .5, 0)).floor()
                if (this.side === 'y') {
                    pos = pickedPoint.add(new Vector3(0, .5, 0)).floor()
                } else {
                    const zPos = pickedPoint.add(new Vector3(0, .5, .5)).floor()
                    const xPos = pickedPoint.add(new Vector3(.5, .5, 0)).floor()

                    if (this.autoRotate && (Math.abs(pickedPoint.z - zPos.z) > .25 || Math.abs(pickedPoint.x - xPos.x) > .25)) {
                        if (Math.abs(pickedPoint.z - zPos.z) < Math.abs(pickedPoint.x - xPos.x)) {
                            this.side = 'z'
                            pos = zPos
                        } else {
                            this.side = 'x'
                            pos = xPos
                        }
                        if (this.side === 'z') {
                            this.cursor.rotation = new Vector3(0, 0, 0)
                        } else if (this.side === 'x') {
                            this.cursor.rotation = new Vector3(0, -Math.PI / 2, 0)
                        } else {
                            this.cursor.rotation = new Vector3(Math.PI / 2, 0, 0)
                        }
                    } else {
                        pos = pickedPoint.add(this.side === 'z' ? new Vector3(0, .5, .5) : new Vector3(.5, .5, 0)).floor()
                    }
                }
            } else if (this.drawPlane === 'z') {
                // todo support auto-rotate
                pos = pickedPoint.add(this.side === 'y' ? new Vector3(0, .5, .5) : this.side === 'z' ? new Vector3(0, 0, .5) : new Vector3(.5, 0, .5)).floor()
            }

            this.tilePos.copyFrom(pos)
            this.cursor.position.copyFrom(this.tilePos)
            this.grid.position.copyFrom(this.tilePos.add(this.drawPlane === 'y' ? new Vector3(.5, 0, .5) : this.drawPlane === 'z' ? new Vector3(.5, .5, 0) : new Vector3(0, .5, .5)))
        }
    }

    draw = (eraser: boolean) => {
        this.drawBrush(this.cursor.position, this.side, eraser)
    }

    private drawBrush = (position: Vector3, side: Side, eraser = false) => {
        const o = Vector3.Zero()
        const r = Math.floor(this.brushSize / 2)
        for (let x = -r; x < this.brushSize - r; x++) {
            for (let y = -r; y < this.brushSize - r; y++) {
                switch (this.drawPlane) {
                    case 'x':
                        o.z = x
                        o.y = y
                        break
                    case 'y':
                        o.x = x
                        o.z = y
                        break
                    case 'z':
                        o.x = x
                        o.y = y
                        break
                }
                if (this.brushDensity === 100 || Math.random() < this.brushDensity / 100) {
                    if (this.drawMode === 'object') {
                        if (eraser) {
                            this.tilemap.removeObject(position.add(o), side)
                        } else {
                            this.tilemap.addObject(position.add(o), side)
                        }
                    } else if (this.drawMode === 'tile') {
                        if (eraser) {
                            this.tilemap.removeTile(position.add(o), side)
                        } else {
                            this.tilemap.setTile(position.add(o), side)
                        }
                    }
                }
            }
        }
    }

    togglePlane = (isReverse: boolean) => {
        const ray = this.scene.createPickingRay(this.scene.pointerX, this.scene.pointerY, Matrix.Identity(), this.scene.activeCamera!)
        const pickedPoint = ray.intersectsMesh(this.tilemap.mesh).pickedPoint
        let pos = this.tilePos

        if (pickedPoint) {
            // note these are rotated 1 step forward
            if (this.drawPlane === 'x') {
                pos = pickedPoint.add(new Vector3(0, .5, 0)).floor()
            } else if (this.drawPlane === 'y') {
                pos = pickedPoint.add(new Vector3(0, 0, .5)).floor()
            } else if (this.drawPlane === 'z') {
                pos = pickedPoint.add(new Vector3(.5, 0, 0)).floor()
            }
        }

        switch (this.drawPlane) {
            case 'x':
                if (isReverse) {
                    this.drawPlane = 'z'
                    this.drawPlaneOffset = pos.z
                    this.side = 'z'
                } else {
                    this.drawPlane = 'y'
                    this.drawPlaneOffset = pos.y
                    this.side = 'y'
                }
                break
            case 'y':
                if (isReverse) {
                    this.drawPlane = 'x'
                    this.drawPlaneOffset = pos.x
                    this.side = 'x'
                } else {
                    this.drawPlane = 'z'
                    this.drawPlaneOffset = pos.z
                    this.side = 'z'
                }
                break
            case 'z':
            default:
                if (isReverse) {
                    this.drawPlane = 'y'
                    this.drawPlaneOffset = pos.y
                    this.side = 'y'
                } else {
                    this.drawPlane = 'x'
                    this.drawPlaneOffset = pos.x
                    this.side = 'x'
                }
                break
        }
        if (this.drawPlane === 'x') {
            this.grid.rotation = new Vector3(0, 0, Math.PI / 2)
        } else if (this.drawPlane === 'y') {
            this.grid.rotation = new Vector3(0, -Math.PI / 2, 0)
        } else {
            this.grid.rotation = new Vector3(Math.PI / 2, 0, 0)
        }
        this.refreshBrush()
    }

    pickAdjust = () => {
        const ray = this.scene.createPickingRay(this.scene.pointerX, this.scene.pointerY, Matrix.Identity(), this.scene.activeCamera!)
        const pickedPoint = ray.intersectsMesh(this.tilemap.mesh).pickedPoint

        if (pickedPoint) {
            let pos = pickedPoint

            if (this.drawPlane === 'x') {
                pos = pickedPoint.add(this.side === 'y' ? new Vector3(.5, .5, 0) : this.side === 'z' ? new Vector3(.5, 0, .5) : new Vector3(.5, 0, 0)).floor()
            } else if (this.drawPlane === 'y') {
                pos = pickedPoint.add(this.side === 'y' ? new Vector3(0, .5, 0) : this.side === 'z' ? new Vector3(0, .5, .5) : new Vector3(.5, .5, 0)).floor()
            } else if (this.drawPlane === 'z') {
                pos = pickedPoint.add(this.side === 'y' ? new Vector3(0, .5, .5) : this.side === 'z' ? new Vector3(0, 0, .5) : new Vector3(.5, 0, .5)).floor()
            }

            if (this.drawPlane === 'x') {
                this.drawPlaneOffset = pos.x
            } else if (this.drawPlane === 'y') {
                this.drawPlaneOffset = pos.y
            } else if (this.drawPlane === 'z') {
                this.drawPlaneOffset = pos.z
            }
        }
    }

    adjustPlane = (distance: number) => {
        this.drawPlaneOffset += distance
    }

    toggleDrawMode = () => {
        this.drawMode = this.drawMode === 'tile' ? 'object' : 'tile'
    }

    toggleSide = () => {
        // todo if auto rotate toggle between plane and wall
        this.side = this.side === 'y' ? 'z' : this.side === 'z' ? 'x' : 'y'
        this.refreshBrush()
    }

    private refreshBrush = () => {
        if (this.side === 'z') {
            this.cursor.rotation = new Vector3(0, 0, 0)
        } else if (this.side === 'x') {
            this.cursor.rotation = new Vector3(0, -Math.PI / 2, 0)
        } else if (this.side === 'y') {
            this.cursor.rotation = new Vector3(Math.PI / 2, 0, 0)
        }
    }
}
