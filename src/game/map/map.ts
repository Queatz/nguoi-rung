import {KeyboardEventTypes, PointerEventTypes, Scene, Vector3} from '@babylonjs/core'
import {Tilemap} from './tilemap'
import {World} from './world'
import {Player} from './player'
import {TilemapEditor} from './tilemapeditor'
import {Post} from './post'
import {Camera, CameraView} from './camera'

export class Map {

    tilemapEditor: TilemapEditor

    constructor(scene: Scene) {
        const camera = new Camera(scene, () => tilemap.mesh)
        const world = new World(scene)
        const post = new Post(scene)
        const tilemap = new Tilemap(scene, world.sun, mesh => {
            world.addShadowCaster(mesh)
        }, mesh => {
            world.removeShadowCaster(mesh)
        })
        const tilemapEditor = new TilemapEditor(scene, tilemap)
        const player = new Player(scene)
        world.addShadowCaster(player.mesh) // todo move into Player class

        this.tilemapEditor = tilemapEditor

        let isDrawing = false
        let walk = Vector3.Zero()

        // Input

        scene.onKeyboardObservable.add(event => {
            // todo if Tab, toggle camera view
            if (['w', 'a', 's', 'd', 'q'].indexOf(event.event.key) !== -1) {
                if (event.type === KeyboardEventTypes.KEYDOWN) {
                    switch (event.event.key) {
                        case 'w':
                            walk.y = 1
                            break
                        case 's':
                            walk.y = -1
                            break
                        case 'a':
                            walk.x = -1
                            break
                        case 'd':
                            walk.x = 1
                            break
                        case 'q':
                            tilemapEditor.toggleDrawMode()
                            break
                    }
                } else if (event.type === KeyboardEventTypes.KEYUP) {
                        switch (event.event.key) {
                        case 'w':
                        case 's':
                            walk.y = 0
                            break
                        case 'a':
                        case 'd':
                            walk.x = 0
                            break
                    }
                }
                return
            }

            if (event.type === KeyboardEventTypes.KEYDOWN) {
                // todo press A to switch side of tile (6 sides total)
                if (event.event.key === 'Tab') {
                    camera.toggleView(event.event.shiftKey)
                    event.event.preventDefault()
                } else if (event.event.key === ' ') {
                    if (event.event.ctrlKey) {
                        tilemapEditor.toggleSide()
                    } else {
                        tilemapEditor.togglePlane(event.event.shiftKey)
                    }
                }
                if (event.event.key === '[') {
                    tilemapEditor.adjustPlane(-1)
                }
                if (event.event.key === ']') {
                    tilemapEditor.adjustPlane(1)
                }
            }
        })

        scene.onPointerObservable.add(event => {
            if (event.type === PointerEventTypes.POINTERUP) {
                camera.isMoving = false
                isDrawing = false
                camera.camera.attachControl()
                return
            }

            if (camera.isMoving) return

            if (event.type !== PointerEventTypes.POINTERDOWN && !isDrawing) {
                return
            }

            if (event.event.shiftKey) {
                camera.camera.attachControl()
                camera.isMoving = true
                camera.recenter()
                return
            } else {
                camera.camera.detachControl()
                isDrawing = true
            }

            if (event.event.ctrlKey) {
                tilemapEditor.pickAdjust()
                return
            }

            if (event.type === PointerEventTypes.POINTERDOWN || event.type === PointerEventTypes.POINTERMOVE) {
                tilemapEditor.draw(event.event.altKey)
            }
        })

        scene.registerBeforeRender(() => {
            if (scene.getFrameId() <= 1) {
                return
            }

            if (scene.deltaTime < 1000) {
                switch (camera.view) {
                    case CameraView.Free:
                        player.mesh.isVisible = false
                        camera.walk(walk)
                        break
                    case CameraView.Player:
                        camera.walk(walk)
                        player.walk(walk)
                        player.mesh.isVisible = true
                        camera.camera.setTarget(player.mesh.position.add(new Vector3(0, .25, 0)))
                        break
                    case CameraView.Eye:
                        player.mesh.isVisible = false
                        camera.walk(walk)
                        player.walk(walk)
                        camera.camera.setTarget(player.mesh.position.add(new Vector3(0, .25, 0)))
                        camera.camera.radius = .1
                        break
                }
            }

            camera.update()
            world.update()
            tilemapEditor.update()
        })
    }

    set = (property: string, value: string | number) => {
        switch (property) {
            case 'brushSize':
                this.tilemapEditor.brushSize = Math.max(1, value as number)
                break
            case 'brushDensity':
                this.tilemapEditor.brushDensity = Math.min(100, Math.max(1, value as number))
                break
        }
    }
}
