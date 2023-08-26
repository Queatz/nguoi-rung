import {Color3, Mesh, MeshBuilder, Scene, StandardMaterial, Vector3} from '@babylonjs/core'

export class Player {

    mesh: Mesh

    constructor(private scene: Scene) {
        const mesh = MeshBuilder.CreatePlane('Player', {size: .5, updatable: true}, scene)
        mesh.material = new StandardMaterial('Player', scene)

        ;(mesh.material as StandardMaterial).diffuseColor = Color3.Purple()
        mesh.material.backFaceCulling = false
        mesh.billboardMode = Mesh.BILLBOARDMODE_Y
        mesh.position.y += .25

        this.mesh = mesh
    }

    walk = (walk: Vector3) => {
        const walkForward = this.scene.activeCamera!.getDirection(Vector3.Forward()).multiply(new Vector3(1, 0, 1)).normalize().scale(walk.y)
        const walkRight = this.scene.activeCamera!.getDirection(Vector3.Right()).multiply(new Vector3(1, 0, 1)).normalize().scale(walk.x)
        this.mesh.position.addInPlace(walkForward.add(walkRight).normalize().scale(2).scale(this.scene.deltaTime / 1000))
    }
}
