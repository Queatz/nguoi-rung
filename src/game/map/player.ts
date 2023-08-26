import {Color3, Mesh, MeshBuilder, Scene, StandardMaterial, Texture, Vector3} from '@babylonjs/core'

export class Player {

    mesh: Mesh

    constructor(private scene: Scene) {
        const mesh = MeshBuilder.CreatePlane('Player', {size: .5, updatable: true}, scene)
        const mat = new StandardMaterial('Player', scene)
        mat.diffuseTexture = new Texture('assets/player.png', this.scene, {
            samplingMode: Texture.NEAREST_SAMPLINGMODE,
        })
        mat.diffuseTexture.hasAlpha = true
        mat.diffuseTexture.wrapU = Texture.CLAMP_ADDRESSMODE
        mat.diffuseTexture.wrapV = Texture.CLAMP_ADDRESSMODE
        mesh.material = mat
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
