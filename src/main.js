// ============================================================
// main.js — ตั้งค่าและเริ่มเกม Phaser 3
// ============================================================
(function () {
  'use strict';

  var config = {
    type: Phaser.AUTO,          // WebGL ถ้ามี ไม่งั้นใช้ Canvas อัตโนมัติ
    width: 1280,
    height: 720,
    backgroundColor: '#ffe9f2',
    parent: 'game',
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH
    },
    render: {
      antialias: true
    },
    scene: [window.PreloadScene, window.GameScene]
  };

  window.game = new Phaser.Game(config);
})();
