import {Character} from "./character";
import {Hole} from "../hole";
import {EventManager, Events} from "../../event-manager/event-manager";

export type CharacterPrototypeConfig = {
    name: string;
    events: {
        miss: Events,
        hit: Events
    }
}

export class CharacterPrototype implements Character {
    private duration: number;
    private sprite: Phaser.GameObjects.Sprite;
    private map: any;
    private scene: Phaser.Scene;
    private hole: Hole;
    private alive = false;
    private startMissing = false;
    private characterConfig: CharacterPrototypeConfig;
    private positionInGarden: Phaser.Math.Vector2;

    constructor(characterConfig: CharacterPrototypeConfig, duration: number) {
        this.characterConfig = characterConfig;
        this.duration = duration;
    }

    create(scene: Phaser.Scene): void {
        this.scene = scene;
        this.map = scene.cache.json.get('characters');
    }

    update(delta: number): void {
        this.duration -= delta;
        if (this.alive && this.duration <= 0 && !this.startMissing) {
            this.startMissing = true;
            this.sprite.anims.play(`${this.characterConfig.name}-miss`)
                .once('animationcomplete', () => {
                    if (this.alive) {
                        EventManager.emit(this.characterConfig.events.miss);
                        this.alive = false;
                        this.hole.setAvailable();
                        this.sprite.destroy();
                    }
                });
        }
    }

    attachToHole(hole: Hole, positionInGarden: Phaser.Math.Vector2): void {
        this.positionInGarden = positionInGarden;
        this.alive = true;
        this.hole = hole;
        const holeCenter = hole.getCenter();
        this.sprite = this.scene.add.sprite(holeCenter.x, holeCenter.y, this.map.key).setInteractive();
        this.sprite.on('pointerdown', () => this.gotHit());

        Object.keys(this.map.animations).forEach((animation: string) => this.sprite.anims.load('mole-' + animation));
        this.sprite.anims.play(`${this.characterConfig.name}-raise`)
            .once('animationcomplete', () => {
                this.sprite.anims.play(`${this.characterConfig.name}-alive`);
            })
    }

    private gotHit() {
        if (this.alive) {
            this.alive = false;
            EventManager.emit(this.characterConfig.events.hit);
            this.sprite.anims.play(`${this.characterConfig.name}-hit`)
                .once('animationcomplete', () => {
                    this.hole.setAvailable();
                    this.sprite.destroy();
                });
        }

    }
}

