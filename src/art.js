// ============================================================
// art.js — วาดกราฟิกทุกอย่างด้วยโค้ด (ไม่ใช้ไฟล์รูปเลย)
// เท็กซ์เจอร์ตุ๊กตาทุกชิ้นมีขนาด 420x600 พิกัดตรงกันหมด
// จึงวางซ้อนกันเป็นเลเยอร์ได้พอดี
// ============================================================
window.DollArt = (function () {
  'use strict';

  var TW = 420, TH = 600;          // ขนาดเท็กซ์เจอร์ตุ๊กตา
  var BGW = 720, BGH = 720;        // ขนาดฉากหลัง

  // สีขาว-เทาสำหรับผม (จะถูกย้อมด้วย tint ทีหลัง)
  var H_BASE = 0xffffff, H_SHADE = 0xd9d9d9, H_LINE = 0x9d9d9d;

  function rad(deg) { return Phaser.Math.DegToRad(deg); }

  // วาดแคปซูล (เส้นหนาปลายมน) ด้วยวงกลมเรียงต่อกัน
  function cap(g, x1, y1, x2, y2, r) {
    var dist = Math.max(1, Math.hypot(x2 - x1, y2 - y1));
    var steps = Math.max(1, Math.ceil(dist / (r * 0.35)));
    for (var i = 0; i <= steps; i++) {
      g.fillCircle(x1 + (x2 - x1) * i / steps, y1 + (y2 - y1) * i / steps, r);
    }
  }

  // ครึ่งวงกลมด้านบน
  function domeTop(g, cx, cy, r) {
    g.beginPath();
    g.arc(cx, cy, r, Math.PI, Math.PI * 2, false);
    g.closePath();
    g.fillPath();
  }

  // สร้างเท็กซ์เจอร์จากฟังก์ชันวาด
  function tex(scene, key, w, h, draw) {
    var g = scene.add.graphics();
    draw(g);
    g.generateTexture(key, w, h);
    g.destroy();
  }

  // ============================================================
  // ตัวตุ๊กตา (ผิว + หน้า)
  // ============================================================

  // วาดโครงร่างกายทั้งหมดหนึ่งรอบ (e = ระยะขยายขอบ ใช้ทำเส้นขอบ)
  function bodyPass(g, color, e) {
    g.fillStyle(color, 1);
    // หู
    g.fillCircle(128, 152, 14 + e);
    g.fillCircle(292, 152, 14 + e);
    // หัว
    g.fillCircle(210, 148, 82 + e);
    // คอ
    g.fillRect(197 - e, 205, 26 + e * 2, 42 + e);
    // ลำตัว
    g.fillRoundedRect(172 - e, 234 - e, 76 + e * 2, 98 + e * 2, 24);
    // สะโพก
    g.fillEllipse(210, 338, 96 + e * 2, 54 + e * 2);
    // แขน + มือ
    cap(g, 178, 254, 156, 334, 12 + e);
    cap(g, 242, 254, 264, 334, 12 + e);
    g.fillCircle(156, 338, 13 + e);
    g.fillCircle(264, 338, 13 + e);
    // ขา
    cap(g, 193, 350, 190, 504, 15 + e);
    cap(g, 227, 350, 230, 504, 15 + e);
    // เท้า
    g.fillEllipse(187, 514, 50 + e * 2, 26 + e * 2);
    g.fillEllipse(233, 514, 50 + e * 2, 26 + e * 2);
  }

  function drawFace(g) {
    // คิ้ว
    g.fillStyle(0x6b4a36, 1);
    g.fillRoundedRect(164, 127, 26, 5, 2.5);
    g.fillRoundedRect(230, 127, 26, 5, 2.5);
    // ตาโต
    g.fillStyle(0x4a342c, 1);
    g.fillEllipse(178, 158, 24, 30);
    g.fillEllipse(242, 158, 24, 30);
    // ประกายตา
    g.fillStyle(0xffffff, 1);
    g.fillCircle(174, 151, 4.5);
    g.fillCircle(238, 151, 4.5);
    g.fillCircle(182, 164, 2.2);
    g.fillCircle(246, 164, 2.2);
    // ปากยิ้ม
    g.fillStyle(0xa8534a, 1);
    g.beginPath();
    g.arc(210, 180, 13, rad(15), rad(165), false);
    g.closePath();
    g.fillPath();
    // ลิ้น
    g.fillStyle(0xe8837c, 1);
    g.fillEllipse(210, 188, 14, 8);
    // แก้มแดง
    g.fillStyle(0xff9eae, 0.5);
    g.fillEllipse(154, 180, 24, 14);
    g.fillEllipse(266, 180, 24, 14);
  }

  function drawBody(g, skin) {
    bodyPass(g, skin.line, 3);   // เส้นขอบ (เงารอบตัว)
    bodyPass(g, skin.base, 0);   // สีผิวจริง
    drawFace(g);
  }

  // เปลือกตาปิด (โชว์ชั่วครู่ตอนกะพริบตา)
  function drawBlink(g, skin) {
    g.fillStyle(skin.base, 1);
    g.fillEllipse(178, 157, 34, 40);
    g.fillEllipse(242, 157, 34, 40);
    g.lineStyle(4, 0x6b4a36, 1);
    g.beginPath();
    g.arc(178, 152, 13, rad(25), rad(155), false);
    g.strokePath();
    g.beginPath();
    g.arc(242, 152, 13, rad(25), rad(155), false);
    g.strokePath();
  }

  // ============================================================
  // ทรงผม — วาด 2 ชั้น (หลังตัว / หน้าตัว) เป็นโทนขาวเทาเพื่อย้อมสี
  // ============================================================

  function hairDome(g, e) {
    // โดมผมคลุมหัวด้านบน + ปอยหน้าม้า
    domeTop(g, 210, 152, 90 + e);
    var bx = [144, 176, 210, 244, 276];
    var by = [120, 132, 136, 132, 120];
    for (var i = 0; i < bx.length; i++) g.fillCircle(bx[i], by[i], 20 + e);
  }

  var HAIR_DRAWERS = [
    // 0: บ๊อบสั้น
    {
      back: function (g) {
        g.fillStyle(H_LINE, 1);
        g.fillRoundedRect(115, 85, 190, 171, { tl: 80, tr: 80, bl: 49, br: 49 });
        g.fillStyle(H_BASE, 1);
        g.fillRoundedRect(118, 88, 184, 165, { tl: 78, tr: 78, bl: 46, br: 46 });
      },
      front: function (g) {
        g.fillStyle(H_LINE, 1);
        hairDome(g, 3);
        g.fillCircle(134, 152, 21); g.fillCircle(286, 152, 21);
        g.fillStyle(H_BASE, 1);
        hairDome(g, 0);
        g.fillCircle(134, 152, 18); g.fillCircle(286, 152, 18);
      }
    },
    // 1: ผมยาวสลวย
    {
      back: function (g) {
        var pass = function (c, e) {
          g.fillStyle(c, 1);
          g.fillRoundedRect(120 - e, 92 - e, 180 + e * 2, 285 + e * 2, { tl: 88, tr: 88, bl: 56, br: 56 });
          var hx = [142, 186, 234, 278];
          for (var i = 0; i < hx.length; i++) g.fillCircle(hx[i], 372, 22 + e);
        };
        pass(H_LINE, 3); pass(H_BASE, 0);
        // เส้นเงาปลายผม
        g.fillStyle(H_SHADE, 0.7);
        g.fillCircle(164, 372, 12); g.fillCircle(256, 372, 12);
      },
      front: function (g) {
        var pass = function (c, e) {
          g.fillStyle(c, 1);
          hairDome(g, e);
          cap(g, 136, 140, 128, 262, 15 + e);
          cap(g, 284, 140, 292, 262, 15 + e);
        };
        pass(H_LINE, 3); pass(H_BASE, 0);
      }
    },
    // 2: ทวินเทล
    {
      back: function (g) {
        var pass = function (c, e) {
          g.fillStyle(c, 1);
          g.fillCircle(210, 148, 86 + e);
          cap(g, 118, 150, 92, 320, 27 + e);
          cap(g, 302, 150, 328, 320, 27 + e);
        };
        pass(H_LINE, 3); pass(H_BASE, 0);
        g.fillStyle(H_SHADE, 0.7);
        g.fillCircle(92, 322, 14); g.fillCircle(328, 322, 14);
      },
      front: function (g) {
        var pass = function (c, e) {
          g.fillStyle(c, 1);
          hairDome(g, e);
        };
        pass(H_LINE, 3); pass(H_BASE, 0);
        // ยางมัดผม
        g.fillStyle(H_SHADE, 1);
        g.fillCircle(126, 142, 13); g.fillCircle(294, 142, 13);
      }
    },
    // 3: หางม้า
    {
      back: function (g) {
        var pass = function (c, e) {
          g.fillStyle(c, 1);
          g.fillCircle(210, 148, 86 + e);
          cap(g, 258, 100, 296, 300, 25 + e);
        };
        pass(H_LINE, 3); pass(H_BASE, 0);
        g.fillStyle(H_SHADE, 0.7);
        g.fillCircle(296, 300, 13);
      },
      front: function (g) {
        var pass = function (c, e) {
          g.fillStyle(c, 1);
          hairDome(g, e);
        };
        pass(H_LINE, 3); pass(H_BASE, 0);
        g.fillStyle(H_SHADE, 1);
        g.fillCircle(256, 96, 12);
      }
    },
    // 4: ผมหยิกฟู
    {
      back: function (g) {
        var pts = [[132, 120], [110, 172], [128, 220], [170, 240], [250, 240], [292, 220], [310, 172], [288, 120]];
        var pass = function (c, e) {
          g.fillStyle(c, 1);
          for (var i = 0; i < pts.length; i++) g.fillCircle(pts[i][0], pts[i][1], 32 + e);
        };
        pass(H_LINE, 3); pass(H_BASE, 0);
      },
      front: function (g) {
        var pts = [[140, 105], [175, 82], [210, 74], [245, 82], [280, 105], [130, 152], [290, 152]];
        var pass = function (c, e) {
          g.fillStyle(c, 1);
          for (var i = 0; i < pts.length; i++) g.fillCircle(pts[i][0], pts[i][1], 25 + e);
          hairDome(g, e);
        };
        pass(H_LINE, 3); pass(H_BASE, 0);
        g.fillStyle(H_SHADE, 0.6);
        g.fillCircle(175, 84, 9); g.fillCircle(245, 84, 9);
      }
    }
  ];

  // ============================================================
  // เสื้อ
  // ============================================================

  var TOP_DRAWERS = [
    // 0: เสื้อยืดแดงลายหัวใจ
    function (g) {
      var base = 0xef5d55, dark = 0xb84440;
      var pass = function (c, e) {
        g.fillStyle(c, 1);
        cap(g, 178, 254, 165, 292, 15 + e);
        cap(g, 242, 254, 255, 292, 15 + e);
        g.fillRoundedRect(168 - e, 236 - e, 84 + e * 2, 100 + e * 2, 18);
      };
      pass(dark, 3); pass(base, 0);
      // หัวใจสีขาว
      g.fillStyle(0xffffff, 1);
      g.fillCircle(203, 279, 7);
      g.fillCircle(217, 279, 7);
      g.fillTriangle(196, 283, 224, 283, 210, 300);
    },
    // 1: เชิ้ตแขนยาวสีฟ้า
    function (g) {
      var base = 0x74b9f0, dark = 0x4d86bd;
      var pass = function (c, e) {
        g.fillStyle(c, 1);
        cap(g, 178, 254, 157, 330, 14 + e);
        cap(g, 242, 254, 263, 330, 14 + e);
        g.fillRoundedRect(168 - e, 236 - e, 84 + e * 2, 102 + e * 2, 14);
      };
      pass(dark, 3); pass(base, 0);
      // ปกเสื้อ
      g.fillStyle(0xffffff, 1);
      g.fillTriangle(188, 236, 210, 258, 188, 258);
      g.fillTriangle(232, 236, 210, 258, 232, 258);
      // กระดุม
      for (var y = 272; y <= 326; y += 18) g.fillCircle(210, y, 3.4);
      // ข้อมือเสื้อ
      g.fillStyle(dark, 1);
      g.fillCircle(157, 330, 14); g.fillCircle(263, 330, 14);
      g.fillStyle(base, 1);
      g.fillCircle(158, 326, 12); g.fillCircle(262, 326, 12);
    },
    // 2: ฮู้ดดี้สีม่วง
    function (g) {
      var base = 0xa08af5, dark = 0x7361c9;
      // ฮู้ดพับหลังคอ
      g.fillStyle(dark, 1);
      g.fillEllipse(210, 244, 126, 46);
      var pass = function (c, e) {
        g.fillStyle(c, 1);
        cap(g, 178, 254, 155, 332, 16 + e);
        cap(g, 242, 254, 265, 332, 16 + e);
        g.fillRoundedRect(164 - e, 238 - e, 92 + e * 2, 106 + e * 2, 20);
      };
      pass(dark, 3); pass(base, 0);
      // กระเป๋าหน้าท้อง
      g.fillStyle(dark, 1);
      g.fillRoundedRect(186, 302, 48, 30, 10);
      // เชือกฮู้ด
      g.lineStyle(3, 0xffffff, 1);
      g.lineBetween(202, 258, 199, 278);
      g.lineBetween(218, 258, 221, 278);
    },
    // 3: สเวตเตอร์ลายทาง
    function (g) {
      var pink = 0xf2789f, dark = 0xc9587e;
      var pass = function (c, e, bodyC) {
        g.fillStyle(c, 1);
        cap(g, 178, 254, 156, 330, 15 + e);
        cap(g, 242, 254, 264, 330, 15 + e);
        g.fillStyle(bodyC, 1);
        g.fillRoundedRect(166 - e, 236 - e, 88 + e * 2, 104 + e * 2, 16);
      };
      pass(dark, 3, dark); pass(pink, 0, 0xffffff);
      // ลายทางชมพู (เฉพาะช่วงกลางลำตัว เลี่ยงมุมโค้ง)
      g.fillStyle(pink, 1);
      for (var y = 254; y <= 318; y += 20) g.fillRect(168, y, 84, 10);
      // คอเสื้อ
      g.fillStyle(dark, 1);
      g.fillRoundedRect(192, 232, 36, 10, 5);
    },
    // 4: เดรสชมพูบานๆ (คลุมท่อนล่าง)
    function (g) {
      var base = 0xff9ecb, dark = 0xd57ba8, light = 0xffd3e8;
      var pass = function (c, e) {
        g.fillStyle(c, 1);
        // แขนพอง
        g.fillCircle(168, 258, 16 + e);
        g.fillCircle(252, 258, 16 + e);
        // เสื้อตัวบน
        g.fillRoundedRect(170 - e, 236 - e, 80 + e * 2, 74 + e * 2, 16);
        // กระโปรงบาน
        g.fillPoints([
          { x: 178 - e, y: 300 }, { x: 140 - e, y: 412 },
          { x: 280 + e, y: 412 }, { x: 242 + e, y: 300 }
        ], true);
        g.fillEllipse(210, 412, 140 + e * 2, 30 + e * 2);
      };
      pass(dark, 3); pass(base, 0);
      // โบว์เอว
      g.fillStyle(light, 1);
      g.fillRect(172, 296, 76, 10);
      g.fillCircle(210, 301, 7);
      // จุดตกแต่งคอเสื้อ
      g.fillStyle(0xffffff, 1);
      g.fillCircle(196, 244, 4); g.fillCircle(210, 247, 4); g.fillCircle(224, 244, 4);
      // ลายชายกระโปรง
      g.fillStyle(light, 1);
      g.fillCircle(165, 405, 6); g.fillCircle(195, 411, 6);
      g.fillCircle(225, 411, 6); g.fillCircle(255, 405, 6);
    },
    // 5: ชุดกะลาสี
    function (g) {
      var navy = 0x39508e, lineC = 0x8f9cc0;
      var pass = function (c, e) {
        g.fillStyle(c, 1);
        cap(g, 178, 254, 166, 290, 15 + e);
        cap(g, 242, 254, 254, 290, 15 + e);
        g.fillRoundedRect(168 - e, 236 - e, 84 + e * 2, 100 + e * 2, 14);
      };
      pass(lineC, 3); pass(0xffffff, 0);
      // ปกกะลาสีสีกรม
      g.fillStyle(navy, 1);
      g.fillRoundedRect(176, 233, 68, 26, 6);
      g.fillTriangle(190, 240, 230, 240, 210, 268);
      // แถบชายเสื้อ
      g.fillRect(170, 322, 80, 8);
      // โบว์แดง
      g.fillStyle(0xe8564f, 1);
      g.fillTriangle(210, 266, 194, 258, 194, 276);
      g.fillTriangle(210, 266, 226, 258, 226, 276);
      g.fillCircle(210, 266, 5);
    }
  ];

  // ============================================================
  // ท่อนล่าง
  // ============================================================

  var BOTTOM_DRAWERS = [
    // 0: กระโปรงแดงจีบ
    function (g) {
      var base = 0xef5d55, dark = 0xb84440;
      var pass = function (c, e) {
        g.fillStyle(c, 1);
        g.fillPoints([
          { x: 176 - e, y: 326 }, { x: 150 - e, y: 398 },
          { x: 270 + e, y: 398 }, { x: 244 + e, y: 326 }
        ], true);
        g.fillEllipse(210, 398, 120 + e * 2, 24 + e * 2);
        g.fillRoundedRect(174 - e, 320 - e, 72 + e * 2, 14 + e * 2, 6);
      };
      pass(dark, 3); pass(base, 0);
      // เส้นจีบกระโปรง
      g.lineStyle(3, dark, 0.8);
      g.lineBetween(190, 330, 176, 400);
      g.lineBetween(210, 330, 210, 404);
      g.lineBetween(230, 330, 244, 400);
    },
    // 1: กางเกงยีนส์
    function (g) {
      var base = 0x5b7fb8, dark = 0x40598a;
      var pass = function (c, e) {
        g.fillStyle(c, 1);
        g.fillRoundedRect(172 - e, 320 - e, 76 + e * 2, 22 + e * 2, 8);
        g.fillEllipse(210, 344, 92 + e * 2, 44 + e * 2);
        cap(g, 193, 348, 190, 500, 18 + e);
        cap(g, 227, 348, 230, 500, 18 + e);
      };
      pass(dark, 3); pass(base, 0);
      // ปลายขาพับ
      g.fillStyle(0x7f9cc9, 1);
      g.fillEllipse(190, 500, 38, 18);
      g.fillEllipse(230, 500, 38, 18);
      // เส้นตะเข็บ
      g.lineStyle(2, 0xcfe0f5, 0.9);
      g.lineBetween(180, 352, 178, 492);
      g.lineBetween(240, 352, 242, 492);
    },
    // 2: กางเกงขาสั้น
    function (g) {
      var base = 0x6f93c9, dark = 0x4c689c;
      var pass = function (c, e) {
        g.fillStyle(c, 1);
        g.fillRoundedRect(172 - e, 320 - e, 76 + e * 2, 22 + e * 2, 8);
        g.fillEllipse(210, 344, 92 + e * 2, 44 + e * 2);
        cap(g, 193, 348, 189, 396, 18 + e);
        cap(g, 227, 348, 231, 396, 18 + e);
      };
      pass(dark, 3); pass(base, 0);
      g.fillStyle(0x93b3dd, 1);
      g.fillEllipse(189, 396, 38, 14);
      g.fillEllipse(231, 396, 38, 14);
    },
    // 3: กระโปรงบานสีฟ้า
    function (g) {
      var base = 0x8ecdf7, dark = 0x64a4d6;
      var pass = function (c, e) {
        g.fillStyle(c, 1);
        g.fillPoints([
          { x: 176 - e, y: 324 }, { x: 136 - e, y: 392 },
          { x: 284 + e, y: 392 }, { x: 244 + e, y: 324 }
        ], true);
        for (var x = 146; x <= 274; x += 32) g.fillCircle(x, 390, 17 + e);
        g.fillRoundedRect(174 - e, 318 - e, 72 + e * 2, 14 + e * 2, 6);
      };
      pass(dark, 3); pass(base, 0);
      // จุดขาวน่ารัก
      g.fillStyle(0xffffff, 0.85);
      g.fillCircle(175, 358, 5); g.fillCircle(210, 372, 5); g.fillCircle(245, 358, 5);
    },
    // 4: กางเกงวอร์มเทา
    function (g) {
      var base = 0x9099a8, dark = 0x6b7280;
      var pass = function (c, e) {
        g.fillStyle(c, 1);
        g.fillRoundedRect(172 - e, 320 - e, 76 + e * 2, 22 + e * 2, 8);
        g.fillEllipse(210, 344, 92 + e * 2, 44 + e * 2);
        cap(g, 193, 348, 190, 494, 17 + e);
        cap(g, 227, 348, 230, 494, 17 + e);
      };
      pass(dark, 3); pass(base, 0);
      // ขอบขาจั๊ม
      g.fillStyle(0xd7dbe2, 1);
      g.fillEllipse(190, 500, 36, 20);
      g.fillEllipse(230, 500, 36, 20);
      // แถบข้างขาว
      g.lineStyle(4, 0xffffff, 0.9);
      g.lineBetween(178, 352, 176, 488);
      g.lineBetween(242, 352, 244, 488);
    }
  ];

  // ============================================================
  // รองเท้า
  // ============================================================

  var SHOE_DRAWERS = [
    // 0: รองเท้าผ้าใบ
    function (g) {
      var pass = function (c, e) {
        g.fillStyle(c, 1);
        g.fillEllipse(187, 512, 56 + e * 2, 30 + e * 2);
        g.fillEllipse(233, 512, 56 + e * 2, 30 + e * 2);
      };
      pass(0xb9b9b9, 3); pass(0xffffff, 0);
      // แถบแดง
      g.fillStyle(0xef5d55, 1);
      g.fillRoundedRect(168, 504, 38, 7, 3.5);
      g.fillRoundedRect(214, 504, 38, 7, 3.5);
      // พื้นรองเท้า
      g.fillStyle(0xdddddd, 1);
      g.fillEllipse(187, 522, 58, 12);
      g.fillEllipse(233, 522, 58, 12);
    },
    // 1: บูทน้ำตาล
    function (g) {
      var base = 0xa9764c, dark = 0x7e5738;
      var pass = function (c, e) {
        g.fillStyle(c, 1);
        cap(g, 190, 438, 188, 500, 19 + e);
        cap(g, 230, 438, 232, 500, 19 + e);
        g.fillEllipse(186, 512, 56 + e * 2, 30 + e * 2);
        g.fillEllipse(234, 512, 56 + e * 2, 30 + e * 2);
      };
      pass(dark, 3); pass(base, 0);
      // ขอบพับบนบูท
      g.fillStyle(0xc79465, 1);
      g.fillEllipse(190, 438, 44, 20);
      g.fillEllipse(230, 438, 44, 20);
      // พื้น
      g.fillStyle(dark, 1);
      g.fillEllipse(186, 523, 58, 12);
      g.fillEllipse(234, 523, 58, 12);
    },
    // 2: รองเท้าแตะ
    function (g) {
      // พื้นแตะ
      var pass = function (c, e) {
        g.fillStyle(c, 1);
        g.fillEllipse(187, 522, 58 + e * 2, 15 + e * 2);
        g.fillEllipse(233, 522, 58 + e * 2, 15 + e * 2);
      };
      pass(0xb87b4e, 3); pass(0xe8a06b, 0);
      // สายคาดชมพู
      g.fillStyle(0xff8fb3, 1);
      g.fillRoundedRect(168, 505, 38, 9, 4.5);
      g.fillRoundedRect(214, 505, 38, 9, 4.5);
    },
    // 3: คัทชูดำกับถุงเท้าขาว
    function (g) {
      // ถุงเท้า
      var pass = function (c, e) {
        g.fillStyle(c, 1);
        cap(g, 190, 468, 188, 498, 17 + e);
        cap(g, 230, 468, 232, 498, 17 + e);
      };
      pass(0xc9c9c9, 3); pass(0xffffff, 0);
      // รองเท้าดำ
      var pass2 = function (c, e) {
        g.fillStyle(c, 1);
        g.fillEllipse(187, 513, 54 + e * 2, 28 + e * 2);
        g.fillEllipse(233, 513, 54 + e * 2, 28 + e * 2);
      };
      pass2(0x26262e, 3); pass2(0x3c3c46, 0);
      // สายคาด + หัวเข็มขัด
      g.fillStyle(0x3c3c46, 1);
      g.fillRoundedRect(169, 502, 36, 6, 3);
      g.fillRoundedRect(215, 502, 36, 6, 3);
      g.fillStyle(0xf5c542, 1);
      g.fillCircle(187, 505, 3); g.fillCircle(233, 505, 3);
    }
  ];

  // ============================================================
  // เครื่องประดับ (index 1 ขึ้นไป — 0 คือ "ไม่ใส่")
  // ============================================================

  var ACC_DRAWERS = [
    null,
    // 1: หมวกแก๊ปแดง
    function (g) {
      var base = 0xef5d55, dark = 0xb84440;
      var pass = function (c, e) {
        g.fillStyle(c, 1);
        domeTop(g, 210, 126, 84 + e);
        g.fillRoundedRect(138 - e, 116 - e, 144 + e * 2, 20 + e * 2, 10);
      };
      pass(dark, 3); pass(base, 0);
      g.fillStyle(dark, 1);
      g.fillCircle(210, 48, 9);
      g.lineStyle(3, dark, 0.8);
      g.beginPath(); g.arc(210, 126, 55, rad(215), rad(325), false); g.strokePath();
    },
    // 2: โบว์ชมพู
    function (g) {
      var base = 0xff8fb3, dark = 0xd66d95;
      var pass = function (c, e) {
        g.fillStyle(c, 1);
        g.fillTriangle(155 - e, 78, 116 - e * 2, 56 - e * 2, 116 - e * 2, 100 + e * 2);
        g.fillTriangle(155 + e, 78, 194 + e * 2, 56 - e * 2, 194 + e * 2, 100 + e * 2);
      };
      pass(dark, 2); pass(base, 0);
      g.fillStyle(dark, 1);
      g.fillCircle(155, 78, 11);
    },
    // 3: แว่นตากลม
    function (g) {
      g.lineStyle(5, 0x4a4f5c, 1);
      g.strokeCircle(178, 158, 21);
      g.strokeCircle(242, 158, 21);
      g.lineBetween(199, 154, 221, 154);
      g.lineBetween(157, 152, 134, 146);
      g.lineBetween(263, 152, 286, 146);
      g.fillStyle(0xaad4ff, 0.28);
      g.fillCircle(178, 158, 19);
      g.fillCircle(242, 158, 19);
    },
    // 4: มงกุฎทอง
    function (g) {
      var base = 0xf7c948, dark = 0xcf9c1d;
      var pass = function (c, e) {
        g.fillStyle(c, 1);
        g.fillTriangle(165 - e, 78, 183, 40 - e, 201 + e, 78);
        g.fillTriangle(196 - e, 78, 210, 32 - e, 224 + e, 78);
        g.fillTriangle(219 - e, 78, 237, 40 - e, 255 + e, 78);
        g.fillRoundedRect(163 - e, 74 - e, 94 + e * 2, 20 + e * 2, 6);
      };
      pass(dark, 3); pass(base, 0);
      // ลูกกลมปลายแหลม
      g.fillStyle(base, 1);
      g.fillCircle(183, 40, 6); g.fillCircle(210, 32, 6); g.fillCircle(237, 40, 6);
      // อัญมณี
      g.fillStyle(0xef5d55, 1); g.fillCircle(182, 84, 5);
      g.fillStyle(0x74b9f0, 1); g.fillCircle(210, 84, 5);
      g.fillStyle(0x7ccf8f, 1); g.fillCircle(238, 84, 5);
    },
    // 5: หูแมว
    function (g) {
      var dark = 0x3a3a42, base = 0x4d4d55, inner = 0xff9ecb;
      var pass = function (c, e) {
        g.fillStyle(c, 1);
        g.fillTriangle(136 - e, 98 + e, 156 - e, 38 - e, 192 + e, 74 + e);
        g.fillTriangle(284 + e, 98 + e, 264 + e, 38 - e, 228 - e, 74 + e);
      };
      pass(dark, 3); pass(base, 0);
      g.fillStyle(inner, 1);
      g.fillTriangle(148, 88, 160, 52, 182, 74);
      g.fillTriangle(272, 88, 260, 52, 238, 74);
    }
  ];

  // ============================================================
  // ฉากหลัง 720x720
  // ============================================================

  var BG_DRAWERS = [
    // 0: ห้องนอนสีพาสเทล
    function (g) {
      g.fillStyle(0xfcebe4, 1); g.fillRect(0, 0, BGW, BGH);          // ผนัง
      g.fillStyle(0xf6d9cf, 1); g.fillRect(0, 470, BGW, 40);          // บัวผนัง
      g.fillStyle(0xdeb887, 1); g.fillRect(0, 500, BGW, 220);         // พื้นไม้
      g.lineStyle(3, 0xc9a06c, 0.6);
      for (var fy = 540; fy < 720; fy += 45) g.lineBetween(0, fy, 720, fy);
      // พรม
      g.fillStyle(0xf7b9c9, 1); g.fillEllipse(360, 645, 430, 115);
      g.fillStyle(0xffd9e3, 1); g.fillEllipse(360, 645, 340, 85);
      // หน้าต่าง
      g.fillStyle(0xffffff, 1); g.fillRoundedRect(78, 88, 204, 244, 14);
      g.fillStyle(0xbfe6ff, 1); g.fillRoundedRect(90, 100, 180, 220, 8);
      g.fillStyle(0xffffff, 1);
      g.fillRect(176, 100, 8, 220); g.fillRect(90, 202, 180, 8);
      g.fillStyle(0xfff2b8, 1); g.fillCircle(130, 140, 22);            // พระอาทิตย์นอกหน้าต่าง
      // ผ้าม่าน
      g.fillStyle(0xffc2d4, 1);
      g.fillRoundedRect(58, 78, 34, 268, 16);
      g.fillRoundedRect(268, 78, 34, 268, 16);
      // กรอบรูปหัวใจ
      g.fillStyle(0xffffff, 1); g.fillRoundedRect(468, 110, 124, 104, 10);
      g.fillStyle(0xffe1ec, 1); g.fillRoundedRect(478, 120, 104, 84, 6);
      g.fillStyle(0xff8fb3, 1);
      g.fillCircle(521, 154, 12); g.fillCircle(541, 154, 12);
      g.fillTriangle(509, 160, 553, 160, 531, 186);
    },
    // 1: สวนสาธารณะ
    function (g) {
      g.fillStyle(0xbfe9ff, 1); g.fillRect(0, 0, BGW, BGH);           // ฟ้า
      g.fillStyle(0xffd94d, 1); g.fillCircle(610, 100, 52);           // พระอาทิตย์
      g.fillStyle(0xffe98a, 1); g.fillCircle(610, 100, 40);
      // เมฆ
      g.fillStyle(0xffffff, 1);
      g.fillCircle(150, 110, 30); g.fillCircle(185, 100, 26); g.fillCircle(120, 100, 24);
      g.fillCircle(420, 66, 24); g.fillCircle(450, 58, 20); g.fillCircle(392, 58, 18);
      // สนามหญ้า
      g.fillStyle(0xa5dd8b, 1); g.fillRect(0, 460, BGW, 260);
      g.fillStyle(0x8ecf72, 1); g.fillEllipse(360, 470, 760, 40);
      // ต้นไม้
      g.fillStyle(0x8a5a3b, 1); g.fillRoundedRect(92, 370, 40, 140, 10);
      g.fillStyle(0x76c893, 1);
      g.fillCircle(112, 330, 62); g.fillCircle(66, 366, 46); g.fillCircle(158, 366, 46);
      g.fillStyle(0x94d9ab, 1); g.fillCircle(96, 318, 24);
      // ดอกไม้
      var flowers = [[60, 600, 0xff8fb3], [160, 655, 0xffd94d], [265, 615, 0xffffff],
                     [520, 645, 0xff8fb3], [620, 600, 0xffd94d], [675, 660, 0xffffff], [420, 680, 0xff8fb3]];
      for (var i = 0; i < flowers.length; i++) {
        var f = flowers[i];
        g.lineStyle(3, 0x6fae58, 1); g.lineBetween(f[0], f[1], f[0], f[1] + 22);
        g.fillStyle(f[2], 1); g.fillCircle(f[0], f[1], 9);
        g.fillStyle(0xff9d3b, 1); g.fillCircle(f[0], f[1], 3.5);
      }
    },
    // 2: ชายหาด
    function (g) {
      g.fillStyle(0xc2ecff, 1); g.fillRect(0, 0, BGW, 400);           // ฟ้า
      g.fillStyle(0xffd94d, 1); g.fillCircle(120, 92, 48);            // พระอาทิตย์
      g.fillStyle(0xffffff, 1);
      g.fillCircle(500, 92, 26); g.fillCircle(532, 84, 22); g.fillCircle(470, 84, 20);
      // ทะเล
      g.fillStyle(0x6fd0e8, 1); g.fillRect(0, 380, BGW, 180);
      g.lineStyle(5, 0xbfeef8, 0.9);
      for (var row = 0; row < 2; row++) {
        for (var x = 0; x < 720; x += 90) {
          g.beginPath();
          g.arc(x + 45, 430 + row * 55, 30, rad(25), rad(155), false);
          g.strokePath();
        }
      }
      // หาดทราย
      g.fillStyle(0xf7e0ac, 1); g.fillRect(0, 540, BGW, 180);
      g.fillStyle(0xf0d090, 1); g.fillEllipse(360, 548, 760, 30);
      // ลูกบอลชายหาด
      g.fillStyle(0xffffff, 1); g.fillCircle(600, 616, 42);
      g.fillStyle(0xef5d55, 1);
      g.slice(600, 616, 42, rad(-90), rad(-18), false); g.fillPath();
      g.slice(600, 616, 42, rad(54), rad(126), false); g.fillPath();
      g.fillStyle(0x74b9f0, 1);
      g.slice(600, 616, 42, rad(-18), rad(54), false); g.fillPath();
      g.slice(600, 616, 42, rad(126), rad(198), false); g.fillPath();
      g.fillStyle(0xffffff, 1); g.fillCircle(600, 616, 9);
      // เปลือกหอย
      g.fillStyle(0xffb9a3, 1); g.fillCircle(140, 660, 14);
      g.fillStyle(0xff9d85, 1);
      g.slice(140, 660, 14, rad(180), rad(300), false); g.fillPath();
    },
    // 3: เวทีคอนเสิร์ต
    function (g) {
      g.fillStyle(0x46325e, 1); g.fillRect(0, 0, BGW, BGH);           // ฉากหลังมืด
      // แสงสปอตไลต์
      g.fillStyle(0xfff2c4, 0.16); g.fillTriangle(360, -40, 60, 720, 660, 720);
      g.fillStyle(0xfff2c4, 0.22); g.fillEllipse(360, 640, 480, 90);
      // พื้นเวที
      g.fillStyle(0x6d4f96, 1); g.fillRect(0, 560, BGW, 160);
      g.fillStyle(0x8468ab, 1); g.fillEllipse(360, 566, 760, 36);
      // ดาวระยิบ
      var stars = [[90, 140], [200, 80], [320, 180], [430, 90], [560, 160], [660, 70], [150, 300], [600, 300]];
      for (var i = 0; i < stars.length; i++) {
        g.fillStyle(0xfff6d8, 0.9);
        g.fillCircle(stars[i][0], stars[i][1], 4);
      }
      // ผ้าม่านแดงสองข้าง
      g.fillStyle(0xd6486a, 1);
      g.fillRoundedRect(-40, -20, 140, 750, 40);
      g.fillRoundedRect(620, -20, 140, 750, 40);
      g.lineStyle(4, 0xb03654, 0.8);
      g.lineBetween(30, 40, 22, 680); g.lineBetween(66, 40, 74, 680);
      g.lineBetween(654, 40, 646, 680); g.lineBetween(690, 40, 698, 680);
      // ระบายม่านด้านบน
      g.fillStyle(0xb03654, 1);
      for (var x = 45; x < 720; x += 90) g.fillCircle(x, 4, 48);
    }
  ];

  // ============================================================
  // UI + เอฟเฟกต์
  // ============================================================

  function genUI(scene) {
    // ช่องไอเทมปกติ / ช่องที่ถูกเลือก
    tex(scene, 'ui-cell', 120, 120, function (g) {
      g.fillStyle(0xffffff, 1); g.fillRoundedRect(0, 0, 120, 120, 18);
      g.lineStyle(2, 0xecdcc8, 1); g.strokeRoundedRect(1, 1, 118, 118, 17);
    });
    tex(scene, 'ui-cell-sel', 120, 120, function (g) {
      g.fillStyle(0xfff0f6, 1); g.fillRoundedRect(0, 0, 120, 120, 18);
      g.lineStyle(5, 0xff6b9e, 1); g.strokeRoundedRect(3, 3, 114, 114, 15);
    });
    // แท็บหมวดหมู่
    tex(scene, 'ui-tab', 128, 50, function (g) {
      g.fillStyle(0xffffff, 1); g.fillRoundedRect(0, 0, 128, 50, 14);
      g.lineStyle(2, 0xecdcc8, 1); g.strokeRoundedRect(1, 1, 126, 48, 13);
    });
    // ปุ่มใหญ่
    tex(scene, 'ui-btn', 168, 56, function (g) {
      g.fillStyle(0xffffff, 1); g.fillRoundedRect(0, 0, 168, 56, 16);
      g.fillStyle(0x000000, 0.10);
      g.fillRoundedRect(0, 42, 168, 14, { tl: 0, tr: 0, bl: 16, br: 16 });
    });
    // วงกลมตัวอย่างสี (ย้อมด้วย tint)
    tex(scene, 'ui-swatch', 96, 96, function (g) {
      g.fillStyle(0x9a9a9a, 1); g.fillCircle(48, 48, 44);
      g.fillStyle(0xffffff, 1); g.fillCircle(48, 48, 39);
    });
    // ไอคอน "ไม่ใส่"
    tex(scene, 'ui-none', 96, 96, function (g) {
      g.lineStyle(7, 0xc9b8a6, 1);
      g.strokeCircle(48, 48, 33);
      g.lineBetween(27, 69, 69, 27);
    });
    // หัวใจลอย
    tex(scene, 'fx-heart', 44, 44, function (g) {
      g.fillStyle(0xff6b9e, 1);
      g.fillCircle(14, 15, 11);
      g.fillCircle(30, 15, 11);
      g.fillTriangle(4, 21, 40, 21, 22, 41);
    });
  }

  // ============================================================
  // สร้างเท็กซ์เจอร์ทั้งหมด
  // ============================================================

  function addThumb(scene, key, region) {
    var t = scene.textures.get(key);
    if (t && !t.has('thumb')) t.add('thumb', 0, region[0], region[1], region[2], region[3]);
  }

  function generateAll(scene) {
    var D = window.DUP_DATA;
    var R = D.THUMB_REGIONS;
    var i;

    // ตัว + เปลือกตา ตามสีผิว
    for (i = 0; i < D.SKINS.length; i++) {
      (function (skin, idx) {
        tex(scene, 'body-' + idx, TW, TH, function (g) { drawBody(g, skin); });
        tex(scene, 'blink-' + idx, TW, TH, function (g) { drawBlink(g, skin); });
      })(D.SKINS[i], i);
    }

    // ผม: ชั้นหลัง ชั้นหน้า และรูปรวมไว้ทำ thumbnail
    for (i = 0; i < HAIR_DRAWERS.length; i++) {
      (function (h, idx) {
        tex(scene, 'hb-' + idx, TW, TH, function (g) { h.back(g); });
        tex(scene, 'hf-' + idx, TW, TH, function (g) { h.front(g); });
        tex(scene, 'hprev-' + idx, TW, TH, function (g) { h.back(g); h.front(g); });
        addThumb(scene, 'hprev-' + idx, R.hair);
      })(HAIR_DRAWERS[i], i);
    }

    // เสื้อ / ท่อนล่าง / รองเท้า
    for (i = 0; i < TOP_DRAWERS.length; i++) {
      tex(scene, 'top-' + i, TW, TH, TOP_DRAWERS[i]);
      addThumb(scene, 'top-' + i, R.top);
    }
    for (i = 0; i < BOTTOM_DRAWERS.length; i++) {
      tex(scene, 'bot-' + i, TW, TH, BOTTOM_DRAWERS[i]);
      addThumb(scene, 'bot-' + i, R.bottom);
    }
    for (i = 0; i < SHOE_DRAWERS.length; i++) {
      tex(scene, 'shoe-' + i, TW, TH, SHOE_DRAWERS[i]);
      addThumb(scene, 'shoe-' + i, R.shoes);
    }

    // เครื่องประดับ (ข้าม index 0 = ไม่ใส่)
    for (i = 1; i < ACC_DRAWERS.length; i++) {
      tex(scene, 'acc-' + i, TW, TH, ACC_DRAWERS[i]);
      addThumb(scene, 'acc-' + i, R.acc);
    }

    // ฉากหลัง
    for (i = 0; i < BG_DRAWERS.length; i++) {
      tex(scene, 'bg-' + i, BGW, BGH, BG_DRAWERS[i]);
    }

    genUI(scene);
  }

  return { generateAll: generateAll, TW: TW, TH: TH };
})();
