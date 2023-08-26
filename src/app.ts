import {Engine, Observable, Scene} from '@babylonjs/core'
import {Map} from './game/map/map'

class Game {
    public static create(canvas: HTMLCanvasElement) {
        const engine = new Engine(canvas)
        const scene = new Scene(engine)

        const map = new Map(scene)

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

        ['Map', 'View', 'Tools', 'Brush', 'Tiles', 'Objects', 'Plots'].forEach(section => {
            const div = document.createElement('div')
            div.className = 'panel-section'
            div.innerText = section

            const box = document.createElement('div')
            box.className = 'panel-box'
            div.appendChild(box)

            if (section === 'Brush') {
                const brushSizeInput = document.createElement('input')
                brushSizeInput.placeholder = 'Size'
                brushSizeInput.addEventListener('change', () => {
                    map.set('brushSize', parseInt(brushSizeInput.value))
                })
                box.appendChild(brushSizeInput)

                const brushDensityInput = document.createElement('input')
                brushDensityInput.placeholder = 'Density (1-100)'
                brushDensityInput.addEventListener('change', () => {
                    map.set('brushDensity', parseInt(brushDensityInput.value))
                })
                box.appendChild(brushDensityInput)
            }

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
