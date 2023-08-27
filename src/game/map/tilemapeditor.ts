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
            this.updateDraw(pickedPoint)
        }
    }

    private updateDraw = (pickedPoint: Vector3) => {
        const cPos = this.scene.activeCamera!.globalPosition
        let pos = this.updateSide(this.drawPlane, pickedPoint)
        const curPos = pos.clone()

        if (this.side !== this.drawPlane) {
            if (this.drawPlane === 'y') {
                if (cPos.y < curPos.y) {
                    curPos.y -= 1
                }
            } else if (this.drawPlane === 'x') {
                if (cPos.x < curPos.x) {
                    curPos.x -= 1
                }
            } else if (this.drawPlane === 'z') {
                if (cPos.z < curPos.z) {
                    curPos.z -= 1
                }
            }
        }

        this.tilePos.copyFrom(curPos)
        this.cursor.position.copyFrom(curPos)
        this.grid.position.copyFrom(pos.add(this.drawPlane === 'y' ? new Vector3(.5, 0, .5) : this.drawPlane === 'z' ? new Vector3(.5, .5, 0) : new Vector3(0, .5, .5)))

        if (this.autoRotate) {
            if (this.side === 'z') {
                this.cursor.rotation = new Vector3(0, 0, 0)
            } else if (this.side === 'x') {
                this.cursor.rotation = new Vector3(0, -Math.PI / 2, 0)
            } else {
                this.cursor.rotation = new Vector3(Math.PI / 2, 0, 0)
            }
        }
    }

    private updateSide = (side: Side, pickedPoint: Vector3): Vector3 => {
        let up!: Vector3
        let right!: Vector3
        let forward!: Vector3
        let sideForward!: Side
        let sideRight!: Side
        let pickRight!: (v: Vector3) => number
        let pickForward!: (v: Vector3) => number

        switch (side) {
            case 'y':
                up = Vector3.Up().scale(.5)
                forward = new Vector3(0, .5, .5)
                right = new Vector3(.5, .5, 0)
                sideForward = 'z'
                sideRight = 'x'
                pickForward = v => v.z
                pickRight = v => v.x
                break
            case 'x':
                up = Vector3.Right().scale(.5)
                forward = new Vector3(.5, .5, 0)
                right = new Vector3(.5, 0, .5)
                sideForward = 'y'
                sideRight = 'z'
                pickForward = v => v.y
                pickRight = v => v.z
                break
            case 'z':
                up = Vector3.Forward().scale(.5)
                forward = new Vector3(0, .5, .5)
                right = new Vector3(.5, 0,  .5)
                sideForward = 'y'
                sideRight = 'x'
                pickForward = v => v.y
                pickRight = v => v.x
                break
        }

        if (this.side === this.drawPlane) {
            return pickedPoint.add(up).floor()
        } else {
            const forwardPos = pickedPoint.add(forward).floor()
            const rightPos = pickedPoint.add(right).floor()

            if (this.autoRotate && (Math.abs(pickForward(pickedPoint) - pickForward(forwardPos)) > .25 || Math.abs(pickRight(pickedPoint) - pickRight(rightPos)) > .25)) {
                if (Math.abs(pickForward(pickedPoint) - pickForward(forwardPos)) < Math.abs(pickRight(pickedPoint) - pickRight(rightPos))) {
                    this.side = sideForward
                    return forwardPos
                } else {
                    this.side = sideRight
                    return rightPos
                }
            } else {
                return pickedPoint.add(this.side === sideForward ? forward : right).floor()
            }
        }
    }

    draw = (eraser: boolean) => {
        this.drawBrush(this.cursor.position, this.side, eraser)
    }

    private drawBrush = (position: Vector3, side: Side, eraser = false) => {
        const camera = this.scene.activeCamera!
        if (side === 'y') {
            if (camera.globalPosition.y < position.y) {
                side = '-y'
            }
        } else if (side === 'x') {
            if (camera.globalPosition.x < position.x) {
                side = '-x'
            }
        } else if (side === 'z') {
            if (camera.globalPosition.z < position.z) {
                side = '-z'
            }
        }

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

    toggleAutoRotate = () => {
        this.autoRotate = !this.autoRotate
    }

    toggleSide = (isReversed: boolean) => {
        if (this.autoRotate && this.side !== this.drawPlane) {
            switch (this.drawPlane) {
                case 'y':
                    this.side = this.side === 'y' ? 'z' : 'y'
                    break
                case 'x':
                    this.side = this.side === 'x' ? 'y' : 'x'
                    break
                case 'z':
                    this.side = this.side === 'z' ? 'x' : 'z'
                    break
            }
        } else if (isReversed) {
            this.side = this.side === 'y' ? 'x' : this.side === 'z' ? 'y' : 'z'
        } else {
            this.side = this.side === 'y' ? 'z' : this.side === 'z' ? 'x' : 'y'
        }
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
