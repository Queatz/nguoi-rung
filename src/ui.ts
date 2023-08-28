import {Map} from './game/map/map'
import {Engine} from "@babylonjs/core";

export class Ui {
    constructor(private engine: Engine, private map: Map) {
        const ui = document.createElement('div')
        ui.className = 'ui'
        document.body.appendChild(ui)

        const rightPanel = document.createElement('div')
        rightPanel.className = 'panel'
        ui.appendChild(rightPanel)

        ;

        [
            ['Help', (box: HTMLDivElement) => {
                box.innerHTML = `
                <b style="color: forestgreen">View controls</b><br />
                <b>Tab</b> Switch camera view<br />
                <b>W/A/S/D</b> Move<br />
                <b>Ctrl+Shift+Mouse</b> Move<br />
                <b>Arrows</b> Rotate<br />
                <b>Shift+Mouse</b> Rotate<br />
                <b>Alt+Arrows</b> Zoom<br />
                <b>Mousewheel</b> Zoom<br />
                <br />
                <b style="color: forestgreen">Space controls</b><br />
                <b>Space</b> Toggle drawing plane<br />
                <b>Shift+Space</b> Toggle drawing plane (reversed)<br />
                <b>Ctrl+Space</b> Toggle drawing axis<br />
                <b>Ctrl+Shift+Space</b> Toggle drawing axis (reversed)<br />
                <b>Ctrl+Mouse</b> Auto adjust drawing plane<br />
                <b>[ and ]</b> Manually adjust drawing plane<br />
                <b>R</b> Toggle auto rotate<br />
                <br />
                <b style="color: forestgreen">Drawing</b><br />
                <b>Mouse</b> Draw<br />
                <b>Alt+Mouse</b> Erase<br />
                <b>Q</b> Toggle object/tile drawing<br />
                `.trim()
            }],
            ['Map', (box: HTMLDivElement) => {
                box.innerHTML = `
                Name, fog color, sun brightness/color, ambient brightness/color, fog density, sky<br />
                `.trim()
            }],
            ['View', (box: HTMLDivElement) => {
                box.innerHTML = `
                Graphics: Lowest, Low, Medium, High, Highest
                DOF, FOV<br />
                `.trim()

                const pixelScale = document.createElement('input')
                pixelScale.placeholder = 'Pixel size (1 – 16)'
                pixelScale.addEventListener('change', () => {
                    const s = parseInt(pixelScale.value)
                    if (!isNaN(s)) {
                        engine.setHardwareScalingLevel(Math.min(16, Math.max(1, Math.floor(s))))
                    }
                })
                box.appendChild(pixelScale)

                const fov = document.createElement('input')
                fov.placeholder = 'Field of view (0.25 – 2.0)'
                fov.addEventListener('change', () => {
                    const s = parseFloat(fov.value)
                    if (!isNaN(s)) {
                        map.set('fov', s)
                    }
                })
                box.appendChild(fov)
            }],
            ['Tools', (box: HTMLDivElement) => {
                box.innerHTML = `
                Draw, Box, Clone<br />
                `.trim()
            }],
            ['Brush', (box: HTMLDivElement) => {
                const brushSizeInput = document.createElement('input')
                brushSizeInput.placeholder = 'Size (1 – 100)'
                brushSizeInput.addEventListener('change', () => {
                    map.set('brushSize', parseInt(brushSizeInput.value))
                })
                box.appendChild(brushSizeInput)

                const brushDensityInput = document.createElement('input')
                brushDensityInput.placeholder = 'Density (1 – 100)'
                brushDensityInput.addEventListener('change', () => {
                    map.set('brushDensity', parseInt(brushDensityInput.value))
                })
                box.appendChild(brushDensityInput)
            }],
            ['Tiles', (box: HTMLDivElement) => {
                box.innerHTML = `
                Pick a tile<br />
                `.trim()
            }],
            ['Objects', (box: HTMLDivElement) => {
                box.innerHTML = `
                Pick an object<br />
                `.trim()
            }],
            ['Plots', (box: HTMLDivElement) => {
                box.innerHTML = `
                Not available yet<br />
                `.trim()
            }]
        ].forEach(section => {
            const div = document.createElement('div')
            div.className = 'panel-section'
            div.innerText = section[0] as string

            const box = document.createElement('div')
            box.className = 'panel-box'
            div.appendChild(box)
            ;
            (section[1] as (box: HTMLDivElement) => void)(box)

            rightPanel.appendChild(div)
        })
    }
}
