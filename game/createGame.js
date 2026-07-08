// ============================================================
// createGame.js — ตั้งค่าและเริ่มเกม Phaser 3
// เรียกจากคอมโพเนนต์ React ฝั่ง client เท่านั้น (Phaser ต้องมี window)
// ============================================================
import * as Phaser from 'phaser';
import { PreloadScene, GameScene } from './scenes';
import { SS } from './hidpi';

export function createGame(parent) {
  var config = {
    type: Phaser.AUTO,          // WebGL ถ้ามี ไม่งั้นใช้ Canvas อัตโนมัติ
    // backing store ใหญ่ขึ้น SS เท่า เพื่อความคมชัด (โลกยังเป็น 1280x720
    // ผ่าน camera.zoom = SS ในแต่ละฉาก)
    width: 1280 * SS,
    height: 720 * SS,
    backgroundColor: '#ffe9f2',
    parent: parent,             // รับ DOM element จาก React ref
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH
    },
    render: {
      antialias: true
    },
    scene: [PreloadScene, GameScene]
  };

  return new Phaser.Game(config);
}
