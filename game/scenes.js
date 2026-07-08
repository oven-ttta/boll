// ============================================================
// scenes.js — ฉากของเกม: PreloadScene สร้างกราฟิก, GameScene เล่นเกม
// ============================================================
import * as Phaser from 'phaser';
import { DUP_DATA } from './data';
import { DollArt } from './art';
import { SS } from './hidpi';

var D = DUP_DATA;
var FONT = '"Leelawadee UI", "Segoe UI", Tahoma, sans-serif';
var SAVE_KEY = 'dressup-doll-v1';

// พาเลตต์กลาง — ธีม "Lavender Rose" (ลาเวนเดอร์–กุหลาบ–พีช)
var C = {
  panelTop: 0xfffbff,
  panelBot: 0xf1e6ff,        // ลาเวนเดอร์อ่อน
  accent: 0xff5c93,          // กุหลาบสด (แท็บ/ช่องที่เลือก)
  accentText: '#ffffff',
  idleText: '#8a6f9e',       // เทาอมม่วงสำหรับป้ายที่ยังไม่เลือก
  header: '#7a4a86'
};

// ---------------- PreloadScene ----------------

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super({ key: 'Preload' });
  }

  create() {
    DollArt.generateAll(this);
    this.scene.start('Game');
  }
}

// ---------------- GameScene ----------------

export class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'Game' });
  }

  // สร้าง Text ที่คมชัดบน backing store ความละเอียดสูง (resolution = SS)
  mkText(x, y, str, style) {
    style = Object.assign({ resolution: SS }, style || {});
    return this.add.text(x, y, str, style);
  }

  create() {
    // โลกยังเป็นระบบพิกัด 1280x720 เดิม แต่ backing store ใหญ่ SS เท่า
    // จึงซูมกล้อง SS เท่าเพื่อให้ทุกอย่างคมชัด (พิกัด/ตรรกะไม่ต้องเปลี่ยน)
    this.cameras.main.setZoom(SS);
    this.cameras.main.centerOn(640, 360);

    // สถานะการแต่งตัว (index ของไอเทมแต่ละหมวด)
    this.state = {
      skin: 0, hairStyle: 0, hairColor: 0,
      top: 0, bottom: 0, shoes: 0, acc: 0, bg: 0
    };
    this.loadState();

    // นิยามหมวดหมู่ทั้ง 8
    this.categories = [
      { key: 'skin',      name: 'สีผิว',        icon: '🎨', kind: 'swatch', items: D.SKINS },
      { key: 'hairStyle', name: 'ทรงผม',        icon: '💇', kind: 'hair',   items: D.HAIR_STYLES },
      { key: 'hairColor', name: 'สีผม',          icon: '🌈', kind: 'swatch', items: D.HAIR_COLORS },
      { key: 'top',       name: 'เสื้อ',          icon: '👕', kind: 'tex', prefix: 'top-',  region: 'top',    items: D.TOPS },
      { key: 'bottom',    name: 'ท่อนล่าง',      icon: '👖', kind: 'tex', prefix: 'bot-',  region: 'bottom', items: D.BOTTOMS },
      { key: 'shoes',     name: 'รองเท้า',       icon: '👟', kind: 'tex', prefix: 'shoe-', region: 'shoes',  items: D.SHOES },
      { key: 'acc',       name: 'เครื่องประดับ', icon: '🎀', kind: 'tex', prefix: 'acc-',  region: 'acc',    items: D.ACCS },
      { key: 'bg',        name: 'ฉากหลัง',       icon: '🖼️', kind: 'bg',  prefix: 'bg-',   items: D.BGS }
    ];
    this.curCat = 0;
    this.cells = [];
    this.tabs = [];

    this.buildStage();
    this.buildPanel();
    this.applyState();
    this.selectCategory(this.debugTab || 0);
    this.scheduleBlink();
    this.startAmbient();

    // ตุ๊กตาเข้าฉากแบบเด้งนุ่ม
    this.doll.setScale(0.86).setAlpha(0);
    this.tweens.add({
      targets: this.doll, scaleX: 1, scaleY: 1, alpha: 1,
      duration: 620, ease: 'Back.easeOut'
    });

    this.time.delayedCall(500, () => this.toast('แต่งตัวให้หนูหน่อยนะ~ 💕'));
  }

  // ---------------- ฝั่งเวที (ตุ๊กตา) ----------------

  buildStage() {
    var ds = 1 / SS;   // สเกลแสดงผลของรูปที่อบไว้ (คงขนาดโลกเดิม)

    this.bgImg = this.add.image(0, 0, 'bg-0').setOrigin(0, 0).setScale(ds);

    // ขอบมุมเวทีให้ดูนุ่ม (vignette อ่อนๆ)
    var vig = this.add.graphics();
    vig.fillStyle(0x5a3a4a, 0.10);
    vig.fillRect(0, 0, 720, 20); vig.fillRect(0, 700, 720, 20);
    vig.fillRect(0, 0, 20, 720); vig.fillRect(700, 0, 20, 720);

    // เลเยอร์อนุภาคลอย (อยู่หลังตุ๊กตา)
    this.particleLayer = this.add.container(0, 0);

    // เงาใต้เท้า
    this.footShadow = this.add.graphics();
    this.footShadow.fillStyle(0x000000, 0.12);
    this.footShadow.fillEllipse(360, 622, 200, 38);

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
    // รูปตุ๊กตาถูกอบที่ความละเอียด SS เท่า จึงย่อลง 1/SS ให้ขนาดโลกเท่าเดิม
    // (ทวีนของ container this.doll ยังทำงานที่สเกล 1 ปกติ)
    this.doll.list.forEach(function (o) { o.setScale(ds); });

    // ตุ๊กตาโยกตัวเบาๆ
    this.tweens.add({
      targets: this.doll, y: 402,
      duration: 1300, yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
    });

    // คลิกตุ๊กตา → เด้ง + หัวใจ
    this.doll.setSize(280, 560);
    this.doll.setInteractive({ useHandCursor: true });
    this.doll.on('pointerdown', () => this.pokeDoll());

    // ป้ายชื่อเกม (ในกรอบมน) + ขยับเบาๆ
    var titleBadge = this.add.graphics();
    titleBadge.fillStyle(0xffffff, 0.28);
    titleBadge.fillRoundedRect(18, 14, 336, 50, 25);
    titleBadge.fillStyle(0xff5c93, 0.16);
    titleBadge.fillRoundedRect(18, 14, 336, 50, 25);
    this.titleText = this.mkText(36, 22, '🎀 เกมแต่งตัวตุ๊กตา', {
      fontFamily: FONT, fontSize: '30px', color: '#ffffff',
      stroke: '#d94f86', strokeThickness: 7
    });
    this.tweens.add({
      targets: [this.titleText], y: 26, duration: 1600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
    });

    this.mkText(26, 692, 'สร้างด้วย Phaser 4 + Next.js', {
      fontFamily: FONT, fontSize: '13px', color: '#ffffff'
    }).setAlpha(0.6);

    // ข้อความแจ้งเตือน (toast)
    this.toastText = this.mkText(360, 662, '', {
      fontFamily: FONT, fontSize: '21px', color: '#7a4a63',
      backgroundColor: 'rgba(255,255,255,0.92)',
      padding: { x: 18, y: 9 }
    }).setOrigin(0.5).setAlpha(0);
  }

  // ---------------- ฝั่งแผงเลือกไอเทม ----------------

  buildPanel() {
    // พื้นแผงไล่สี + ขอบซ้าย
    var panel = this.add.graphics();
    panel.fillGradientStyle(C.panelTop, C.panelTop, C.panelBot, C.panelBot, 1);
    panel.fillRect(720, 0, 560, 720);
    panel.fillStyle(0xd7bff0, 1); panel.fillRect(720, 0, 6, 720);   // ขอบซ้ายสีลาเวนเดอร์
    panel.fillStyle(0xffffff, 0.55); panel.fillRect(726, 0, 2, 720);

    // แท็บหมวดหมู่ 4x2 — การ์ดไอคอน+ชื่อ
    // ห่อ img+icon+label ไว้ใน container เดียว แล้วทวีน "สเกลของ container"
    // (img อบที่ SS เท่า จึงย่อ 1/SS ส่วน text ใช้สเกล 1 → ทวีนรวมกันได้พอดี)
    var ds = 1 / SS;
    var x0 = 734, y0 = 12, tw = 128, th = 68, gapX = 6, gapY = 8;
    this.categories.forEach((cat, i) => {
      var col = i % 4, row = Math.floor(i / 4);
      var cx = x0 + col * (tw + gapX) + tw / 2;
      var cy = y0 + row * (th + gapY) + th / 2;
      var cont = this.add.container(cx, cy);
      var img = this.add.image(0, 0, 'ui-tab').setScale(ds)
        .setInteractive({ useHandCursor: true });
      var icon = this.mkText(0, -10, cat.icon, {
        fontFamily: FONT, fontSize: '23px'
      }).setOrigin(0.5);
      var label = this.mkText(0, 14, cat.name, {
        fontFamily: FONT, fontSize: '13px', color: C.idleText, fontStyle: 'bold'
      }).setOrigin(0.5);
      cont.add([img, icon, label]);
      img.on('pointerdown', () => { this.selectCategory(i); this.sfx(440, 0.05); });
      img.on('pointerover', () => {
        if (this.curCat !== i) { img.setTint(0xffeede); this.tweens.add({ targets: cont, scale: 1.05, duration: 120, ease: 'Back.easeOut' }); }
      });
      img.on('pointerout', () => {
        if (this.curCat !== i) { img.clearTint(); this.tweens.add({ targets: cont, scale: 1, duration: 120 }); }
      });
      this.tabs.push({ cont: cont, img: img, icon: icon, label: label });
    });

    // ---- แถบหัวข้อหมวด ----
    var hy = 178;
    this.headerText = this.mkText(744, hy, '', {
      fontFamily: FONT, fontSize: '22px', color: C.header, fontStyle: 'bold'
    }).setOrigin(0, 0.5);
    // ป้ายจำนวนไอเทม (พิลล์เล็กมุมขวา)
    this.countBg = this.add.graphics();
    this.countText = this.mkText(1256, hy, '', {
      fontFamily: FONT, fontSize: '14px', color: '#9a6fae', fontStyle: 'bold'
    }).setOrigin(1, 0.5);
    // เส้นคั่น
    var div = this.add.graphics();
    div.fillStyle(0xe4d4f5, 1); div.fillRoundedRect(744, hy + 20, 514, 3, 1.5);
    // บรรทัดโชว์ชื่อไอเทมที่ชี้/เลือก
    this.pickName = this.mkText(744, hy + 40, '', {
      fontFamily: FONT, fontSize: '16px', color: '#9a80ae'
    }).setOrigin(0, 0.5);

    // คำใบ้
    this.mkText(1000, 626, 'ลองคลิกที่ตุ๊กตาดูสิ ✨', {
      fontFamily: FONT, fontSize: '14px', color: '#b39ac9'
    }).setOrigin(0.5);

    // ปุ่มหลัก 3 ปุ่ม
    this.makeButton(736, 652, 0xff5c93, '🎲 สุ่มชุด', () => this.randomize());
    this.makeButton(916, 652, 0xffa63d, '🔄 เริ่มใหม่', () => this.resetAll());
    this.makeButton(1096, 652, 0x9d7bff, '📷 บันทึกรูป', () => this.savePhoto());
  }

  // อัปเดตแถบหัวข้อ + ชื่อไอเทมที่เลือก
  setPickName(name) {
    if (this.pickName) this.pickName.setText(name ? ('เลือกอยู่: ' + name) : '');
  }

  makeButton(x, y, tint, label, onClick) {
    // ui-btn ขนาด 172x62 (อบที่ SS เท่า) → ห่อใน container แล้วทวีนสเกล container
    var ds = 1 / SS;
    var cont = this.add.container(x + 86, y + 31);
    var img = this.add.image(0, 0, 'ui-btn').setScale(ds)
      .setTint(tint).setInteractive({ useHandCursor: true });
    var txt = this.mkText(0, -2, label, {
      fontFamily: FONT, fontSize: '19px', color: '#ffffff',
      stroke: 'rgba(0,0,0,0.22)', strokeThickness: 3
    }).setOrigin(0.5);
    cont.add([img, txt]);
    img.on('pointerover', () => this.tweens.add({ targets: cont, scale: 1.05, duration: 120, ease: 'Back.easeOut' }));
    img.on('pointerout', () => this.tweens.add({ targets: cont, scale: 1, duration: 120 }));
    img.on('pointerdown', () => {
      this.tweens.add({ targets: cont, scale: 0.94, duration: 80, yoyo: true, onComplete: onClick });
    });
    return cont;
  }

  // ---------------- แท็บ + ตารางไอเทม ----------------

  selectCategory(i) {
    var prev = this.curCat;
    this.curCat = i;
    var cat = this.categories[i];

    this.tabs.forEach((t, k) => {
      if (k === i) {
        t.img.setTint(C.accent);
        t.label.setColor(C.accentText);
        if (k !== prev) this.tweens.add({ targets: t.cont, scale: 1.08, duration: 160, yoyo: true, ease: 'Sine.easeOut' });
      } else {
        t.img.clearTint();
        t.label.setColor(C.idleText);
        t.cont.setScale(1);
      }
    });

    // แถบหัวข้อ: ไอคอน + ชื่อหมวด + ป้ายจำนวน
    this.headerText.setText(cat.icon + '  ' + cat.name);
    this.countText.setText(cat.items.length + ' แบบ');
    var cb = this.countText.getBounds();
    this.countBg.clear();
    this.countBg.fillStyle(0xf3e4ff, 1);
    this.countBg.fillRoundedRect(cb.x - 12, cb.y - 5, cb.width + 24, cb.height + 10, 13);

    // เอฟเฟกต์เปลี่ยนหัวข้อ
    this.headerText.setAlpha(0);
    this.tweens.add({ targets: this.headerText, alpha: 1, x: { from: 738, to: 744 }, duration: 260, ease: 'Sine.easeOut' });

    this.refreshItems(true);
  }

  refreshItems(animate) {
    var cat = this.categories[this.curCat];

    // ล้างช่องเดิม
    this.cells.forEach((c) => c.destroy());
    this.cells = [];

    // โชว์ชื่อไอเทมที่เลือกอยู่
    this.setPickName(cat.items[this.state[cat.key]].name);

    var ds = 1 / SS;
    var x0 = 742, y0 = 232, stepX = 132, stepY = 128;
    cat.items.forEach((item, idx) => {
      var col = idx % 4, row = Math.floor(idx / 4);
      var cx = x0 + col * stepX + 60, cy = y0 + row * stepY + 60;
      var selected = (this.state[cat.key] === idx);

      var cell = this.add.container(cx, cy);
      var bg = this.add.image(0, 0, selected ? 'ui-cell-sel' : 'ui-cell').setScale(ds);
      cell.add(bg);
      this.makeCellContent(cat, item, idx).forEach((o) => cell.add(o));

      // ตรากเครื่องหมายถูกบนไอเทมที่เลือก
      if (selected) {
        var check = this.add.image(42, -44, 'ui-check');
        cell.add(check);
        this.tweens.add({ targets: check, scale: { from: 0, to: ds }, duration: 260, ease: 'Back.easeOut' });
      }

      bg.setInteractive({ useHandCursor: true });
      bg.on('pointerdown', () => this.equip(cat, item, idx));
      bg.on('pointerover', () => {
        this.tweens.add({ targets: cell, scale: 1.07, duration: 120, ease: 'Back.easeOut' });
        this.setPickName(item.name);
      });
      bg.on('pointerout', () => {
        this.tweens.add({ targets: cell, scale: 1, duration: 120 });
        this.setPickName(cat.items[this.state[cat.key]].name);
      });

      // เข้าแบบ stagger
      if (animate) {
        cell.setScale(0.6).setAlpha(0);
        this.tweens.add({
          targets: cell, scale: 1, alpha: 1,
          delay: idx * 42, duration: 320, ease: 'Back.easeOut'
        });
      }

      this.cells.push(cell);
    });
  }

  // สร้างรูปตัวอย่างในช่องไอเทม
  makeCellContent(cat, item, idx) {
    var objs = [];
    var boxSize = 100;
    var ds = 1 / SS;   // รูปที่อบไว้แสดงที่ 1/SS เพื่อคงขนาด (fitInto จัดการให้เอง)

    if (cat.kind === 'swatch') {
      var color = (cat.key === 'skin') ? item.base : item.tint;
      objs.push(this.add.image(0, 0, 'ui-swatch').setTint(color).setScale(ds));
    } else if (cat.kind === 'hair') {
      var img = this.add.image(0, 0, 'hprev-' + idx, 'thumb');
      img.setTint(D.HAIR_COLORS[this.state.hairColor].tint);
      this.fitInto(img, boxSize);
      objs.push(img);
    } else if (cat.kind === 'bg') {
      var bgi = this.add.image(0, 0, 'bg-' + idx);
      bgi.setScale(boxSize / bgi.width);   // bgi.width = 720*SS → คงขนาด boxSize
      objs.push(bgi);
    } else if (item.none) {
      objs.push(this.add.image(0, 0, 'ui-none').setScale(ds));
    } else {
      var it = this.add.image(0, 0, cat.prefix + idx, 'thumb');
      this.fitInto(it, boxSize);
      objs.push(it);
    }
    return objs;
  }

  fitInto(img, size) {
    var s = Math.min(size / img.width, size / img.height);
    img.setScale(s);
  }

  // ---------------- สวมใส่ / อัปเดตตุ๊กตา ----------------

  equip(cat, item, idx) {
    // ถ้าใส่เดรสอยู่แล้วมาเลือกท่อนล่าง → เปลี่ยนเสื้อเป็นเสื้อยืดก่อน
    if (cat.key === 'bottom' && D.TOPS[this.state.top].isDress) {
      this.state.top = 0;
      this.toast('เปลี่ยนเดรสเป็นเสื้อยืดให้แล้วนะ');
    } else {
      this.toast(item.name);
    }
    this.state[cat.key] = idx;
    this.applyState();
    this.refreshItems(false);
    this.burst(360, 300, 6);
    this.sfx(620, 0.05);
    this.sfx(880, 0.06, 0.04);
  }

  applyState() {
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
  }

  // ---------------- ปุ่มต่างๆ ----------------

  randomize() {
    this.categories.forEach((cat) => {
      this.state[cat.key] = Phaser.Math.Between(0, cat.items.length - 1);
    });
    this.applyState();
    this.refreshItems(true);
    this.toast('แต่นแต๊น! ชุดใหม่มาแล้ว 🎉');
    this.sfx(523, 0.08);
    this.time.delayedCall(80, () => this.sfx(659, 0.08));
    this.time.delayedCall(160, () => this.sfx(784, 0.1));
    this.pokeDoll(true);
    this.burst(360, 300, 12);
  }

  resetAll() {
    for (var k in this.state) this.state[k] = 0;
    this.applyState();
    this.refreshItems(true);
    this.toast('กลับเป็นชุดเริ่มต้นแล้ว');
    this.sfx(392, 0.07);
    this.sfx(330, 0.09, 0.03);
  }

  savePhoto() {
    this.sfx(784, 0.06);
    this.sfx(1046, 0.08, 0.04);
    this.toastText.setAlpha(0); // ไม่ให้ toast ติดไปในรูป
    // พิกัด snapshot อยู่ในหน่วย pixel ของ backing store (ใหญ่ SS เท่า)
    this.game.renderer.snapshotArea(0, 0, 720 * SS, 720 * SS, (image) => {
      try {
        var a = document.createElement('a');
        a.href = image.src;
        a.download = 'my-doll.png';
        document.body.appendChild(a);
        a.click();
        a.remove();
        this.toast('บันทึกรูปแล้ว! 📸');
      } catch (e) {
        this.toast('บันทึกรูปไม่สำเร็จ');
      }
    });
  }

  // ---------------- ลูกเล่นตุ๊กตา + อนุภาค ----------------

  pokeDoll(silent) {
    this.tweens.add({
      targets: this.doll, scaleX: 1.05, scaleY: 0.95,
      duration: 90, yoyo: true, ease: 'Sine.easeInOut'
    });
    for (var i = 0; i < 5; i++) {
      var h = this.add.image(
        360 + Phaser.Math.Between(-90, 90),
        290 + Phaser.Math.Between(-60, 60), 'fx-heart');
      h.setTint(0xff6b9e).setScale(Phaser.Math.FloatBetween(0.5, 1.0) / SS).setAlpha(0.95);
      this.tweens.add({
        targets: h,
        y: h.y - Phaser.Math.Between(60, 130),
        alpha: 0,
        angle: Phaser.Math.Between(-40, 40),
        duration: Phaser.Math.Between(600, 950),
        ease: 'Cubic.easeOut',
        onComplete: (tw, targets) => targets[0].destroy()
      });
    }
    if (!silent) {
      this.sfx(880, 0.07, 0.035, 'triangle');
      this.time.delayedCall(90, () => this.sfx(1174, 0.09, 0.03, 'triangle'));
    }
  }

  // ประกายเวลาสวมใส่/สุ่ม
  burst(x, y, n) {
    for (var i = 0; i < n; i++) {
      var s = this.add.image(x + Phaser.Math.Between(-70, 70), y + Phaser.Math.Between(-90, 90), 'fx-sparkle');
      s.setTint(Phaser.Math.RND.pick([0xffffff, 0xffe08a, 0xff9ec4, 0xbfe6ff]));
      s.setScale(0.1 / SS).setAlpha(0.95);
      this.tweens.add({
        targets: s, scale: Phaser.Math.FloatBetween(0.5, 1.0) / SS, alpha: 0,
        angle: Phaser.Math.Between(-90, 90),
        duration: Phaser.Math.Between(450, 800), ease: 'Cubic.easeOut',
        onComplete: (tw, targets) => targets[0].destroy()
      });
    }
  }

  // อนุภาคลอยประจำฉาก
  startAmbient() {
    this.ambientTimer = this.time.addEvent({
      delay: 620, loop: true, callback: () => this.spawnAmbient()
    });
    for (var i = 0; i < 4; i++) this.time.delayedCall(i * 300, () => this.spawnAmbient(true));
  }

  spawnAmbient(midway) {
    var amb = D.BG_AMBIENT[this.state.bg] || D.BG_AMBIENT[0];
    var x = Phaser.Math.Between(30, 690);
    var startY = midway ? Phaser.Math.Between(120, 640) : 750;
    var p = this.add.image(x, startY, amb.type);
    if (amb.tint != null) p.setTint(amb.tint);
    this.particleLayer.add(p);
    p.setScale(Phaser.Math.FloatBetween(0.45, 1.05) / SS).setAlpha(0);

    var dur = Phaser.Math.Between(6500, 11000) * (startY / 750);
    this.tweens.add({
      targets: p, y: -50, x: x + Phaser.Math.Between(-50, 50),
      duration: dur, ease: 'Sine.easeInOut',
      onComplete: () => p.destroy()
    });
    this.tweens.add({ targets: p, alpha: 0.8, duration: 1200 });
    this.tweens.add({ targets: p, angle: Phaser.Math.Between(-70, 70), duration: dur });
  }

  scheduleBlink() {
    this.time.delayedCall(Phaser.Math.Between(2200, 4800), () => {
      this.blinkImg.setVisible(true);
      this.time.delayedCall(140, () => {
        this.blinkImg.setVisible(false);
        this.scheduleBlink();
      });
    });
  }

  // ---------------- ระบบช่วยเหลือ ----------------

  toast(msg) {
    this.toastText.setText(msg);
    this.toastText.setAlpha(0).setY(672);
    if (this.toastTimer) this.toastTimer.remove(false);
    if (this.toastTween) this.toastTween.stop();
    this.toastTween = this.tweens.add({
      targets: this.toastText, alpha: 1, y: 662, duration: 260, ease: 'Back.easeOut'
    });
    this.toastTimer = this.time.delayedCall(1500, () => {
      this.toastTween = this.tweens.add({
        targets: this.toastText, alpha: 0, y: 656, duration: 380
      });
    });
  }

  // เสียงประกอบสั้นๆ ด้วย WebAudio (ไม่ต้องมีไฟล์เสียง)
  sfx(freq, dur, vol, type) {
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
  }

  saveState() {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(this.state));
    } catch (e) { /* บางเบราว์เซอร์อาจบล็อก localStorage */ }
  }

  loadState() {
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
}
