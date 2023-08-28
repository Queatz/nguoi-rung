import {
    ArcRotateCamera,
    ColorCorrectionPostProcess,
    DefaultRenderingPipeline,
    LensRenderingPipeline,
    Scene,
    Vector3
} from '@babylonjs/core'

export class Post {

    // private effect: LensRenderingPipeline
    private pipeline: DefaultRenderingPipeline

    constructor(private scene: Scene) {
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
        const pipeline = new DefaultRenderingPipeline(
            'defaultPipeline',
            true,
            scene,
            [ this.scene.activeCamera! ]
        )

        // pipeline.sharpenEnabled = true
        // pipeline.sharpen.edgeAmount = .5
        // pipeline.sharpen.colorAmount = .5

        // pipeline.bloomEnabled = true
        // pipeline.bloomThreshold = .5
        // pipeline.bloomWeight = 0.5
        // pipeline.bloomKernel = 32
        // pipeline.bloomScale = 1

        // new ColorCorrectionPostProcess('Color Correction', '/assets/lut.png', 1, this.scene.activeCamera)

        // this.effect = new LensRenderingPipeline('Lens', {
        //     edge_blur: 0,
        //     chromatic_aberration: 0,
        //     distortion: 0,
        //     dof_focus_distance: 10,
        //     dof_aperture: 1,
        //     grain_amount: .25,
        //     dof_pentagon: true,
        //     dof_gain: 1,
        //     dof_threshold: 1,
        //     dof_darken: 0
        // }, scene, .5, [ this.scene.activeCamera! ])

        // pipeline.depthOfFieldEnabled = true
        // pipeline.depthOfField.fStop = 2
        // pipeline.depthOfField.focalLength = 110//todo divide by pixel size
        // pipeline.depthOfField.focusDistance = 1000
        // pipeline.depthOfFieldBlurLevel = DepthOfFieldEffectBlurLevel.Medium

        this.pipeline = pipeline
    }

    update = () => {
        // this.pipeline.depthOfField.focusDistance = 1000 * (Vector3.Distance(
        //     this.scene.activeCamera!.globalPosition,
        //     (this.scene.activeCamera! as ArcRotateCamera).target
        // ))
    }
}
