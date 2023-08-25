import {Color3, Mesh, MeshBuilder, Scene, StandardMaterial} from '@babylonjs/core'

export class Player {

    mesh: Mesh

    constructor(private scene: Scene) {
        const mesh = MeshBuilder.CreatePlane('Player', {size: 1, updatable: true}, scene)
        mesh.material = new StandardMaterial('Player', scene)

        ;(mesh.material as StandardMaterial).diffuseColor = Color3.Purple()
        mesh.material.backFaceCulling = false
        mesh.billboardMode = Mesh.BILLBOARDMODE_Y

        mesh.isVisible = false

        this.mesh = mesh
    }
}
