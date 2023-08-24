import {Engine, Scene} from '@babylonjs/core'
import {Map} from './game/map/map'

class Game {
    public static create(canvas: HTMLCanvasElement) {
        const engine = new Engine(canvas)
        const scene = new Scene(engine)

        new Map(scene)

        engine.runRenderLoop(() => {
            scene.render()
        })

        window.addEventListener('resize', () => {
            engine.resize()
        })


        setTimeout(() => canvas.focus())
    }
}

Game.create(document.getElementById('canvas') as HTMLCanvasElement)
