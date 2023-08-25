import {Engine, Observable, Scene} from '@babylonjs/core'
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

        const ui = document.createElement('div')
        ui.className = 'ui'
        document.body.appendChild(ui)

        const rightPanel = document.createElement('div')
        rightPanel.className = 'panel'
        ui.appendChild(rightPanel)

        ;

        ['View', 'Map', 'Tools', 'Brush', 'Tiles', 'Objects', 'Plots'].forEach(section => {
            const div = document.createElement('div')
            div.className = 'panel-section'
            div.innerText = section

            const box = document.createElement('div')
            box.className = 'panel-box'
            div.appendChild(box)

            rightPanel.appendChild(div)
        })

        // let someValue = '0'
        // const some = new Observable<string>()
        //
        // setInterval(() => {
        //     someValue = `${someValue}${someValue.length}`
        //     some.notifyObservers(someValue)
        // }, 1000)
        //
        // some.add((data, state) => {
        //     console.log(data, state)
        //     rightPanel.innerText = data
        // })

        setTimeout(() => canvas.focus())
    }
}

Game.create(document.getElementById('canvas') as HTMLCanvasElement)
