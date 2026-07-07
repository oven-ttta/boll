// ============================================================
// scenes.js — ฉากของเกม: PreloadScene สร้างกราฟิก, GameScene เล่นเกม
// ============================================================
(function () {
  'use strict';

  var D = window.DUP_DATA;
  var FONT = '"Leelawadee UI", "Segoe UI", Tahoma, sans-serif';
  var SAVE_KEY = 'dressup-doll-v1';

  // ---------------- PreloadScene ----------------

  window.PreloadScene = new Phaser.Class({
    Extends: Phaser.Scene,
    initialize: function PreloadScene() {
      Phaser.Scene.call(this, { key: 'Preload' });
    },
    create: function () {
      window.DollArt.generateAll(this);
      this.scene.start('Game');
    }
  });

  // ---------------- GameScene ----------------

  window.GameScene = new Phaser.Class({
    Extends: Phaser.Scene,

    initialize: function GameScene() {
      Phaser.Scene.call(this, { key: 'Game' });
    },

    create: function () {
      // สถานะการแต่งตัว (index ของไอเทมแต่ละหมวด)
      this.state = {
        skin: 0, hairStyle: 0, hairColor: 0,
        top: 0, bottom: 0, shoes: 0, acc: 0, bg: 0
      };
      this.loadState();

      // นิยามหมวดหมู่ทั้ง 8
      this.categories = [
        { key: 'skin',      name: 'สีผิว',        kind: 'swatch', items: D.SKINS },
        { key: 'hairStyle', name: 'ทรงผม',        kind: 'hair',   items: D.HAIR_STYLES },
        { key: 'hairColor', name: 'สีผม',          kind: 'swatch', items: D.HAIR_COLORS },
        { key: 'top',       name: 'เสื้อ',          kind: 'tex', prefix: 'top-',  region: 'top',    items: D.TOPS },
        { key: 'bottom',    name: 'ท่อนล่าง',      kind: 'tex', prefix: 'bot-',  region: 'bottom', items: D.BOTTOMS },
        { key: 'shoes',     name: 'รองเท้า',       kind: 'tex', prefix: 'shoe-', region: 'shoes',  items: D.SHOES },
        { key: 'acc',       name: 'เครื่องประดับ', kind: 'tex', prefix: 'acc-',  region: 'acc',    items: D.ACCS },
        { key: 'bg',        name: 'ฉากหลัง',       kind: 'bg',  prefix: 'bg-',   items: D.BGS }
      ];
      this.curCat = 0;
      this.cells = [];
      this.tabs = [];

      this.buildStage();
      this.buildPanel();
      this.applyState();
      this.selectCategory(this.debugTab || 0);
      this.scheduleBlink();

      this.toast('แต่งตัวให้หนูหน่อยนะ~ 💕');
    },

    // ---------------- ฝั่งเวที (ตุ๊กตา) ----------------

    buildStage: function () {
      var self = this;

      this.bgImg = this.add.image(0, 0, 'bg-0').setOrigin(0, 0);

      // เงาใต้เท้า
      var shadow = this.add.graphics();
      shadow.fillStyle(0x000000, 0.12);
      shadow.fillEllipse(360, 622, 200, 38);

      // เลเยอร์ตุ๊กตา — เรียงจากหลังไปหน้า
      this.doll = this.add.container(360, 396);
      this.hairBack  = this.add.image(0, 0, 'hb-0');
      this.bodyImg   = this.add.image(0, 0, 'body-0');
      this.blinkImg  = this.add.image(0, 0, 'blink-0').setVisible(false);
      // หมายเหตุ: เท็กซ์เจอร์เสื้อผ้ามี frame 'thumb' เพิ่มเข้ามา ซึ่งทำให้
      // frame เริ่มต้นของ Phaser เปลี่ยนไป จึงต้องระบุ '__BASE' เสมอ
      this.bottomImg = this.add.image(0, 0, 'bot-0', '__BASE');
      this.topImg    = this.add.image(0, 0, 'top-0', '__BASE');
      this.shoeImg   = this.add.image(0, 0, 'shoe-0', '__BASE');
      this.hairFront = this.add.image(0, 0, 'hf-0');
      this.accImg    = this.add.image(0, 0, 'acc-1', '__BASE').setVisible(false);
      this.doll.add([this.hairBack, this.bodyImg, this.blinkImg, this.bottomImg,
                     this.topImg, this.shoeImg, this.hairFront, this.accImg]);

      // ตุ๊กตาโยกตัวเบาๆ
      this.tweens.add({
        targets: this.doll, y: 402,
        duration: 1300, yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
      });

      // คลิกตุ๊กตา → เด้ง + หัวใจ
      this.doll.setSize(280, 560);
      this.doll.setInteractive({ useHandCursor: true });
      this.doll.on('pointerdown', function () { self.pokeDoll(); });

      // ชื่อเกม
      this.add.text(24, 16, '🎀 เกมแต่งตัวตุ๊กตา', {
        fontFamily: FONT, fontSize: '30px', color: '#ffffff',
        stroke: '#e5679a', strokeThickness: 7
      });
      this.add.text(26, 690, 'สร้างด้วย Phaser 3', {
        fontFamily: FONT, fontSize: '13px', color: '#ffffff'
      }).setAlpha(0.65);

      // ข้อความแจ้งเตือน (toast)
      this.toastText = this.add.text(360, 664, '', {
        fontFamily: FONT, fontSize: '20px', color: '#7a4a63',
        backgroundColor: 'rgba(255,255,255,0.9)',
        padding: { x: 16, y: 8 }
      }).setOrigin(0.5).setAlpha(0);
    },

    // ---------------- ฝั่งแผงเลือกไอเทม ----------------

    buildPanel: function () {
      var self = this;

      var panel = this.add.graphics();
      panel.fillStyle(0xfff4e4, 1); panel.fillRect(720, 0, 560, 720);
      panel.fillStyle(0xf5e0c8, 1); panel.fillRect(720, 0, 6, 720);

      // แท็บหมวดหมู่ 4x2
      var x0 = 732, y0 = 14, tw = 128, th = 50, gap = 8;
      this.categories.forEach(function (cat, i) {
        var col = i % 4, row = Math.floor(i / 4);
        var tx = x0 + col * (tw + gap), ty = y0 + row * (th + gap);
        var img = self.add.image(tx, ty, 'ui-tab').setOrigin(0, 0)
          .setInteractive({ useHandCursor: true });
        var label = self.add.text(tx + tw / 2, ty + th / 2, cat.name, {
          fontFamily: FONT, fontSize: '17px', color: '#8a6d55'
        }).setOrigin(0.5);
        img.on('pointerdown', function () {
          self.selectCategory(i);
          self.sfx(440, 0.05);
        });
        img.on('pointerover', function () { if (self.curCat !== i) img.setTint(0xffe9d8); });
        img.on('pointerout', function () { if (self.curCat !== i) img.clearTint(); });
        self.tabs.push({ img: img, label: label });
      });

      // หัวข้อหมวด
      this.headerText = this.add.text(742, 138, '', {
        fontFamily: FONT, fontSize: '18px', color: '#b08a68'
      });

      // คำใบ้
      this.add.text(1000, 634, 'ลองคลิกที่ตุ๊กตาดูสิ ✨', {
        fontFamily: FONT, fontSize: '15px', color: '#c2a181'
      }).setOrigin(0.5);

      // ปุ่มหลัก 3 ปุ่ม
      this.makeButton(738, 660, 0xff8fb3, '🎲 สุ่มชุด', function () { self.randomize(); });
      this.makeButton(916, 660, 0xffb45e, '🔄 เริ่มใหม่', function () { self.resetAll(); });
      this.makeButton(1094, 660, 0x7cc4ff, '📷 บันทึกรูป', function () { self.savePhoto(); });
    },

    makeButton: function (x, y, tint, label, onClick) {
      var img = this.add.image(x, y, 'ui-btn').setOrigin(0, 0)
        .setTint(tint).setInteractive({ useHandCursor: true });
      this.add.text(x + 84, y + 26, label, {
        fontFamily: FONT, fontSize: '19px', color: '#ffffff',
        stroke: 'rgba(0,0,0,0.25)', strokeThickness: 3
      }).setOrigin(0.5);
      img.on('pointerdown', onClick);
      img.on('pointerover', function () { img.setScale(1.03); });
      img.on('pointerout', function () { img.setScale(1); });
      return img;
    },

    // ---------------- แท็บ + ตารางไอเทม ----------------

    selectCategory: function (i) {
      this.curCat = i;
      var self = this;
      this.tabs.forEach(function (t, k) {
        if (k === i) {
          t.img.setTint(0xff8fb3);
          t.label.setColor('#ffffff');
        } else {
          t.img.clearTint();
          t.label.setColor('#8a6d55');
        }
      });
      this.headerText.setText('เลือก' + this.categories[i].name + 'ได้เลย!');
      this.refreshItems();
    },

    refreshItems: function () {
      var self = this;
      var cat = this.categories[this.curCat];

      // ล้างช่องเดิม
      this.cells.forEach(function (c) { c.destroy(); });
      this.cells = [];

      var x0 = 742, y0 = 158, cw = 120, gap = 12;
      cat.items.forEach(function (item, idx) {
        var col = idx % 4, row = Math.floor(idx / 4);
        var cx = x0 + col * (cw + gap), cy = y0 + row * (cw + gap);
        var selected = (self.state[cat.key] === idx);

        var cell = self.add.container(cx + cw / 2, cy + cw / 2);
        var bg = self.add.image(0, 0, selected ? 'ui-cell-sel' : 'ui-cell');
        cell.add(bg);
        cell.add(self.makeCellContent(cat, item, idx));

        bg.setInteractive({ useHandCursor: true });
        bg.on('pointerdown', function () { self.equip(cat, item, idx); });
        bg.on('pointerover', function () { cell.setScale(1.06); });
        bg.on('pointerout', function () { cell.setScale(1); });

        self.cells.push(cell);
      });
    },

    // สร้างรูปตัวอย่างในช่องไอเทม
    makeCellContent: function (cat, item, idx) {
      var objs = [];
      var boxSize = 100;

      if (cat.kind === 'swatch') {
        var color = (cat.key === 'skin') ? item.base : item.tint;
        objs.push(this.add.image(0, 0, 'ui-swatch').setTint(color));
      } else if (cat.kind === 'hair') {
        var img = this.add.image(0, 0, 'hprev-' + idx, 'thumb');
        img.setTint(D.HAIR_COLORS[this.state.hairColor].tint);
        this.fitInto(img, boxSize);
        objs.push(img);
      } else if (cat.kind === 'bg') {
        var bgi = this.add.image(0, 0, 'bg-' + idx);
        bgi.setScale(boxSize / 720);
        objs.push(bgi);
      } else if (item.none) {
        objs.push(this.add.image(0, 0, 'ui-none'));
      } else {
        var it = this.add.image(0, 0, cat.prefix + idx, 'thumb');
        this.fitInto(it, boxSize);
        objs.push(it);
      }
      return objs;
    },

    fitInto: function (img, size) {
      var s = Math.min(size / img.width, size / img.height);
      img.setScale(s);
    },

    // ---------------- สวมใส่ / อัปเดตตุ๊กตา ----------------

    equip: function (cat, item, idx) {
      // ถ้าใส่เดรสอยู่แล้วมาเลือกท่อนล่าง → เปลี่ยนเสื้อเป็นเสื้อยืดก่อน
      if (cat.key === 'bottom' && D.TOPS[this.state.top].isDress) {
        this.state.top = 0;
        this.toast('เปลี่ยนเดรสเป็นเสื้อยืดให้แล้วนะ');
      } else {
        this.toast(item.name);
      }
      this.state[cat.key] = idx;
      this.applyState();
      this.refreshItems();
      this.sfx(620, 0.05);
      this.sfx(880, 0.06, 0.04);
    },

    applyState: function () {
      var s = this.state;
      var hairTint = D.HAIR_COLORS[s.hairColor].tint;

      this.bodyImg.setTexture('body-' + s.skin);
      this.blinkImg.setTexture('blink-' + s.skin);
      this.hairBack.setTexture('hb-' + s.hairStyle).setTint(hairTint);
      this.hairFront.setTexture('hf-' + s.hairStyle).setTint(hairTint);
      this.topImg.setTexture('top-' + s.top, '__BASE');
      this.bottomImg.setTexture('bot-' + s.bottom, '__BASE');
      this.bottomImg.setVisible(!D.TOPS[s.top].isDress);
      this.shoeImg.setTexture('shoe-' + s.shoes, '__BASE');
      if (D.ACCS[s.acc].none) {
        this.accImg.setVisible(false);
      } else {
        this.accImg.setTexture('acc-' + s.acc, '__BASE').setVisible(true);
      }
      this.bgImg.setTexture('bg-' + s.bg);

      this.saveState();
    },

    // ---------------- ปุ่มต่างๆ ----------------

    randomize: function () {
      var self = this;
      this.categories.forEach(function (cat) {
        self.state[cat.key] = Phaser.Math.Between(0, cat.items.length - 1);
      });
      this.applyState();
      this.refreshItems();
      this.toast('แต่นแต๊น! ชุดใหม่มาแล้ว 🎉');
      this.sfx(523, 0.08);
      this.time.delayedCall(80, function () { self.sfx(659, 0.08); });
      this.time.delayedCall(160, function () { self.sfx(784, 0.1); });
      this.pokeDoll(true);
    },

    resetAll: function () {
      for (var k in this.state) this.state[k] = 0;
      this.applyState();
      this.refreshItems();
      this.toast('กลับเป็นชุดเริ่มต้นแล้ว');
      this.sfx(392, 0.07);
      this.sfx(330, 0.09, 0.03);
    },

    savePhoto: function () {
      var self = this;
      this.sfx(784, 0.06);
      this.sfx(1046, 0.08, 0.04);
      this.toastText.setAlpha(0); // ไม่ให้ toast ติดไปในรูป
      this.game.renderer.snapshotArea(0, 0, 720, 720, function (image) {
        try {
          var a = document.createElement('a');
          a.href = image.src;
          a.download = 'my-doll.png';
          document.body.appendChild(a);
          a.click();
          a.remove();
          self.toast('บันทึกรูปแล้ว! 📸');
        } catch (e) {
          self.toast('บันทึกรูปไม่สำเร็จ');
        }
      });
    },

    // ---------------- ลูกเล่นตุ๊กตา ----------------

    pokeDoll: function (silent) {
      var self = this;
      this.tweens.add({
        targets: this.doll, scaleX: 1.05, scaleY: 0.95,
        duration: 90, yoyo: true, ease: 'Sine.easeInOut'
      });
      for (var i = 0; i < 5; i++) {
        var h = this.add.image(
          360 + Phaser.Math.Between(-90, 90),
          290 + Phaser.Math.Between(-60, 60), 'fx-heart');
        h.setScale(Phaser.Math.FloatBetween(0.5, 1.0)).setAlpha(0.95);
        this.tweens.add({
          targets: h,
          y: h.y - Phaser.Math.Between(60, 130),
          alpha: 0,
          duration: Phaser.Math.Between(600, 950),
          ease: 'Cubic.easeOut',
          onComplete: function (tw, targets) { targets[0].destroy(); }
        });
      }
      if (!silent) {
        this.sfx(880, 0.07, 0.035, 'triangle');
        this.time.delayedCall(90, function () { self.sfx(1174, 0.09, 0.03, 'triangle'); });
      }
    },

    scheduleBlink: function () {
      var self = this;
      this.time.delayedCall(Phaser.Math.Between(2200, 4800), function () {
        self.blinkImg.setVisible(true);
        self.time.delayedCall(140, function () {
          self.blinkImg.setVisible(false);
          self.scheduleBlink();
        });
      });
    },

    // ---------------- ระบบช่วยเหลือ ----------------

    toast: function (msg) {
      var self = this;
      this.toastText.setText(msg).setAlpha(1);
      if (this.toastTimer) this.toastTimer.remove(false);
      if (this.toastTween) this.toastTween.stop();
      this.toastTimer = this.time.delayedCall(1400, function () {
        self.toastTween = self.tweens.add({
          targets: self.toastText, alpha: 0, duration: 350
        });
      });
    },

    // เสียงประกอบสั้นๆ ด้วย WebAudio (ไม่ต้องมีไฟล์เสียง)
    sfx: function (freq, dur, vol, type) {
      try {
        var ctx = this.sound && this.sound.context;
        if (!ctx) return;
        if (ctx.state === 'suspended') ctx.resume();
        var o = ctx.createOscillator();
        var gn = ctx.createGain();
        o.type = type || 'square';
        o.frequency.value = freq;
        var v = (vol === undefined) ? 0.04 : vol;
        gn.gain.setValueAtTime(v, ctx.currentTime);
        gn.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + (dur || 0.07));
        o.connect(gn); gn.connect(ctx.destination);
        o.start();
        o.stop(ctx.currentTime + (dur || 0.07) + 0.02);
      } catch (e) { /* ไม่มีเสียงก็เล่นได้ */ }
    },

    saveState: function () {
      try {
        localStorage.setItem(SAVE_KEY, JSON.stringify(this.state));
      } catch (e) { /* file:// บางเครื่องอาจบล็อก localStorage */ }
    },

    loadState: function () {
      // โหมดทดสอบผ่าน URL เช่น ?outfit=0,1,2,3,0,1,4,2&tab=3
      try {
        var keys = ['skin', 'hairStyle', 'hairColor', 'top', 'bottom', 'shoes', 'acc', 'bg'];
        var tm = /[?&]tab=(\d+)/.exec(window.location.search);
        if (tm) this.debugTab = Phaser.Math.Clamp(parseInt(tm[1], 10), 0, 7);
        var m = /[?&]outfit=([\d,]+)/.exec(window.location.search);
        if (m) {
          var parts = m[1].split(',');
          var lims = [D.SKINS.length, D.HAIR_STYLES.length, D.HAIR_COLORS.length,
                      D.TOPS.length, D.BOTTOMS.length, D.SHOES.length,
                      D.ACCS.length, D.BGS.length];
          for (var i = 0; i < keys.length && i < parts.length; i++) {
            var n = parseInt(parts[i], 10);
            if (n >= 0 && n < lims[i]) this.state[keys[i]] = n;
          }
          return; // ไม่โหลดเซฟทับค่าทดสอบ
        }
      } catch (e) { }
      try {
        var raw = localStorage.getItem(SAVE_KEY);
        if (!raw) return;
        var saved = JSON.parse(raw);
        var limits = {
          skin: D.SKINS.length, hairStyle: D.HAIR_STYLES.length,
          hairColor: D.HAIR_COLORS.length, top: D.TOPS.length,
          bottom: D.BOTTOMS.length, shoes: D.SHOES.length,
          acc: D.ACCS.length, bg: D.BGS.length
        };
        for (var k in this.state) {
          var v = saved[k];
          if (typeof v === 'number' && v >= 0 && v < limits[k]) this.state[k] = v;
        }
      } catch (e) { /* ข้อมูลเซฟเสีย ใช้ค่าเริ่มต้นแทน */ }
    }
  });
})();
