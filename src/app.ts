import {Engine, Observable, Scene} from '@babylonjs/core'
import {Map} from './game/map/map'
import {Ui} from "./ui";

class Game {
    public static create(canvas: HTMLCanvasElement) {
        const engine = new Engine(canvas, false)
        const scene = new Scene(engine)

        const map = new Map(scene)

        engine.runRenderLoop(() => {
            scene.render()
        })

        window.addEventListener('resize', () => {
            engine.resize()
        })

        const ui = new Ui(engine, map)

        setTimeout(() => canvas.focus())
    }
}

Game.create(document.getElementById('canvas') as HTMLCanvasElement)
