import {
    AbstractMesh,
    CascadedShadowGenerator,
    Color3,
    DirectionalLight,
    HemisphericLight,
    Scene, ShadowGenerator,
    Vector3
} from '@babylonjs/core'

export class World {

    ambience: HemisphericLight
    sun: DirectionalLight
    shadows: ShadowGenerator

    constructor(private scene: Scene) {
        scene.fogMode = Scene.FOGMODE_EXP2
        scene.fogDensity = 0.01
        scene.fogColor = new Color3(.9, .9, .9)
        scene.clearColor = scene.fogColor.toColor4()//.toLinearSpace()
        scene.ambientColor = scene.fogColor

        let ambience = new HemisphericLight('Ambience', new Vector3(0, -1, 0).normalize(), scene)
        ambience.diffuse = Color3.White()
        ambience.groundColor = Color3.White()
        ambience.intensity = .5
        let sun = new DirectionalLight('sun', new Vector3(.25, -1, .5).normalize(), scene)
        sun.intensity = 1
        sun.shadowMinZ = scene.activeCamera!.minZ
        sun.shadowMaxZ = scene.activeCamera!.maxZ

        this.sun = sun
        this.ambience = ambience

        const shadowGenerator = new CascadedShadowGenerator(256, sun)
        shadowGenerator.lambda = .75
        shadowGenerator.bias = .025
        shadowGenerator.transparencyShadow = true
        shadowGenerator.stabilizeCascades = true
        shadowGenerator.shadowMaxZ = sun.shadowMaxZ
        shadowGenerator.splitFrustum()

        this.shadows = shadowGenerator
    }

    update = () => {
        this.sun.position.copyFrom(this.scene.activeCamera!.position)
    }

    addShadowCaster = (mesh: AbstractMesh) => {
        this.shadows.addShadowCaster(mesh)
    }

    removeShadowCaster = (mesh: AbstractMesh) => {
        this.shadows.removeShadowCaster(mesh)
    }
}
