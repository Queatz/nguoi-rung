import {AbstractMesh, ArcRotateCamera, Matrix, Scene, Vector3} from '@babylonjs/core'

export class Camera {

    camera: ArcRotateCamera
    isMoving = false

    constructor(private scene: Scene, private pick: () => AbstractMesh) {
        const camera = new ArcRotateCamera('camera', 0, Math.PI / 4, 30, Vector3.Zero(), scene)
        camera.zoomToMouseLocation = true
        camera.wheelDeltaPercentage = .01
        camera.wheelPrecision = 20
        camera.attachControl()
        camera.fov = .5
        camera.maxZ = 100
        camera.minZ = 1
        camera.lowerRadiusLimit = 1
        this.camera = camera
    }

    update = () => {
        const settled = !this.isMoving && this.camera.inertialRadiusOffset === 0 && this.camera.inertialAlphaOffset === 0 && this.camera.inertialBetaOffset === 0 && this.camera.targetScreenOffset.length() !== 0

        if (settled) {
            this.camera.target.copyFrom(
                Vector3.TransformCoordinates(
                    new Vector3(0, 0, this.camera.radius),
                    this.camera.getViewMatrix().invert()
                )
            )
            this.camera.targetScreenOffset.scaleInPlace(0)
        }
    }

    walk = (walk: Vector3) => {
        const walkForward = this.camera.getDirection(Vector3.Forward()).multiply(new Vector3(1, 0, 1)).normalize().scale(walk.y)
        const walkRight = this.camera.getDirection(Vector3.Right()).multiply(new Vector3(1, 0, 1)).normalize().scale(walk.x)
        this.camera.target.addInPlace(walkForward.add(walkRight).normalize().scale(2).scale(this.scene.deltaTime / 1000))
    }

    recenter = () => {
        const ray = this.scene.createPickingRay(this.scene.pointerX, this.scene.pointerY, Matrix.Identity(), this.camera)
        const pickedPoint = ray.intersectsMesh(this.pick()).pickedPoint
        if (pickedPoint) {
            const relPos = Vector3.TransformCoordinates(pickedPoint, this.camera.getViewMatrix())
            const alpha = this.camera.alpha
            const beta = this.camera.beta
            this.camera.target.copyFrom(pickedPoint)
            this.camera.targetScreenOffset.x = relPos.x
            this.camera.targetScreenOffset.y = relPos.y
            this.camera.radius = relPos.z
            this.camera.alpha = alpha
            this.camera.beta = beta
        }
    }
}

enum CameraView {
    Free,
    Player,
    Eye
}
