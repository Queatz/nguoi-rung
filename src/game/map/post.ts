import {Scene} from '@babylonjs/core'

export class Post {
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
        // const pipeline = new DefaultRenderingPipeline(
        //     'defaultPipeline',
        //     false,
        //     scene,
        //     [camera]
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

        // new ColorCorrectionPostProcess('Color Correction', '/assets/lut.png', 1, camera)
    }
}
