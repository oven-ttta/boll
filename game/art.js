// ============================================================
// art.js — วาดกราฟิกทุกอย่างด้วยโค้ด (ไม่ใช้ไฟล์รูปเลย)
// เท็กซ์เจอร์ตุ๊กตาทุกชิ้นมีขนาด 420x600 พิกัดตรงกันหมด
// จึงวางซ้อนกันเป็นเลเยอร์ได้พอดี
// ============================================================
import * as Phaser from 'phaser';
import { DUP_DATA } from './data';
import { SS } from './hidpi';

export const DollArt = (function () {
  'use strict';

  var TW = 420, TH = 600;          // ขนาดเท็กซ์เจอร์ตุ๊กตา
  var BGW = 720, BGH = 720;        // ขนาดฉากหลัง

  // สีขาว-เทาสำหรับผม (จะถูกย้อมด้วย tint ทีหลัง)
  var H_BASE = 0xffffff, H_HI = 0xffffff, H_SHADE = 0xcfcfcf, H_LINE = 0x9d9d9d, H_DARK = 0x8a8a8a;

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
  // วาดที่พิกัดออกแบบเดิม แล้วขยาย Graphics ด้วย setScale(SS) ก่อนอบเป็น
  // texture ขนาด w*SS x h*SS → ได้ texel เพิ่มขึ้น SS เท่า (คมชัด)
  // (generateTexture ของ Phaser เคารพ transform ของ Graphics ผ่าน SetTransform)
  function tex(scene, key, w, h, draw) {
    var g = scene.add.graphics();
    draw(g);
    g.setScale(SS);
    g.generateTexture(key, Math.ceil(w * SS), Math.ceil(h * SS));
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

  // ตาข้างเดียว (cx = จุดกึ่งกลางแนวนอน) — ไล่สีม่านตา + ประกาย
  function drawEye(g, cx) {
    var cy = 158;
    // เบ้าตา (ดำอมน้ำตาล ทรงอัลมอนด์)
    g.fillStyle(0x3d2b26, 1);
    g.fillEllipse(cx, cy, 25, 31);
    // ม่านตาสีอุ่น (ครึ่งล่าง)
    g.fillStyle(0x9a6b45, 1);
    g.fillEllipse(cx, cy + 6, 18, 21);
    // รูม่านตา
    g.fillStyle(0x241a17, 1);
    g.fillEllipse(cx, cy + 3, 12, 16);
    // ประกายใหญ่ซ้ายบน
    g.fillStyle(0xffffff, 1);
    g.fillCircle(cx - 5, cy - 7, 5.5);
    // ประกายเล็กขวาล่าง
    g.fillStyle(0xffffff, 0.85);
    g.fillCircle(cx + 6, cy + 7, 3);
    // แสงสะท้อนขอบล่าง
    g.fillStyle(0xffe1cc, 0.5);
    g.fillEllipse(cx, cy + 13, 15, 5);
  }

  function drawFace(g) {
    // คิ้วโค้งนุ่ม (ยกขึ้นเล็กน้อยให้ดูสดใส ไม่บึ้ง)
    g.fillStyle(0x7a5240, 1);
    g.fillRoundedRect(161, 120, 28, 6, 3);
    g.fillRoundedRect(231, 120, 28, 6, 3);

    // ดวงตา
    drawEye(g, 178);
    drawEye(g, 242);

    // เส้นขนตาบน + สะบัดปลายหางตา
    g.lineStyle(4, 0x2a1c18, 1);
    g.beginPath(); g.arc(178, 156, 15, rad(202), rad(338), false); g.strokePath();
    g.beginPath(); g.arc(242, 156, 15, rad(202), rad(338), false); g.strokePath();
    g.lineStyle(3.5, 0x2a1c18, 1);
    g.lineBetween(163, 149, 155, 144);
    g.lineBetween(257, 149, 265, 144);

    // จมูกจุดเล็ก
    g.fillStyle(0xe0a488, 0.55);
    g.fillEllipse(210, 170, 6, 3.5);

    // ปากยิ้ม
    g.fillStyle(0xb2554b, 1);
    g.beginPath();
    g.arc(210, 181, 13, rad(12), rad(168), false);
    g.closePath();
    g.fillPath();
    // ลิ้น
    g.fillStyle(0xef8f88, 1);
    g.fillEllipse(210, 189, 13, 7);
    // ไฮไลต์ริมฝีปากล่าง
    g.fillStyle(0xffd6cf, 0.6);
    g.fillEllipse(210, 178, 10, 3);

    // แก้มแดงนุ่ม (ไล่จางเป็นชั้น)
    g.fillStyle(0xff9eae, 0.28);
    g.fillEllipse(153, 182, 27, 15);
    g.fillEllipse(267, 182, 27, 15);
    g.fillStyle(0xffb3c1, 0.4);
    g.fillEllipse(153, 182, 17, 9);
    g.fillEllipse(267, 182, 17, 9);
    // จุดประกายบนแก้ม
    g.fillStyle(0xffffff, 0.7);
    g.fillCircle(148, 178, 2.2);
    g.fillCircle(272, 178, 2.2);
  }

  function drawBody(g, skin) {
    bodyPass(g, skin.line, 3);   // เส้นขอบ (เงารอบตัว)
    bodyPass(g, skin.base, 0);   // สีผิวจริง

    // เงาให้ตัวมีมิติ (ใช้สี shade โปร่งเล็กน้อย)
    var sh = (skin.shade !== undefined) ? skin.shade : skin.line;
    g.fillStyle(sh, 0.5);
    g.fillEllipse(210, 210, 44, 12);            // ใต้คาง/คอ
    g.fillStyle(sh, 0.28);
    g.fillEllipse(178, 316, 20, 40);            // ด้านในแขนซ้าย
    g.fillEllipse(198, 470, 14, 80);            // ด้านในขาซ้าย
    // ไฮไลต์แก้ม/หน้าผาก (ก่อนวาดหน้า)
    g.fillStyle(0xffffff, 0.12);
    g.fillEllipse(196, 120, 60, 30);

    drawFace(g);
  }

  // เปลือกตาปิด (โชว์ชั่วครู่ตอนกะพริบตา)
  function drawBlink(g, skin) {
    g.fillStyle(skin.base, 1);
    g.fillEllipse(178, 157, 34, 40);
    g.fillEllipse(242, 157, 34, 40);
    g.lineStyle(4, 0x2a1c18, 1);
    g.beginPath();
    g.arc(178, 150, 14, rad(20), rad(160), false);
    g.strokePath();
    g.beginPath();
    g.arc(242, 150, 14, rad(20), rad(160), false);
    g.strokePath();
    // ขนตาล่างเล็กๆ ตอนหลับตา
    g.lineStyle(3, 0x2a1c18, 1);
    g.lineBetween(164, 152, 157, 148);
    g.lineBetween(256, 152, 263, 148);
  }

  // ============================================================
  // ทรงผม — วาด 2 ชั้น (หลังตัว / หน้าตัว) เป็นโทนขาวเทาเพื่อย้อมสี
  // ใช้ H_SHADE ทำเงา (เข้มลงเมื่อ tint) เพื่อเพิ่มมิติเวลาแต่งสี
  // ============================================================

  function hairDome(g, e) {
    // โดมผมคลุมหัวด้านบน + ปอยหน้าม้า
    domeTop(g, 210, 152, 90 + e);
    var bx = [144, 176, 210, 244, 276];
    var by = [120, 132, 136, 132, 120];
    for (var i = 0; i < bx.length; i++) g.fillCircle(bx[i], by[i], 20 + e);
  }

  // ปอยผมเรียวโค้ง (ทวินเทล/หางเปีย) — วงกลมไล่ขนาดเล็กลงตามเส้นโค้ง
  // dx = ระยะสะบัดออกด้านข้างที่ปลาย (ใช้ t^2 ให้โค้งเหมือนแส้)
  function tail(g, x0, y0, dx, len, rTop, rBot, segs) {
    for (var i = 0; i <= segs; i++) {
      var t = i / segs;
      var x = x0 + dx * (t * t);
      var y = y0 + len * t;
      var r = rTop + (rBot - rTop) * t;
      g.fillCircle(x, y, r);
    }
  }

  // ไฮไลต์เงาผมโค้งบนหัว (โทนอ่อนกว่า จะเด่นหลัง tint)
  function hairShine(g) {
    g.fillStyle(0xffffff, 0.45);
    g.beginPath();
    g.arc(196, 120, 46, rad(200), rad(320), false);
    g.arc(196, 120, 30, rad(320), rad(200), true);
    g.closePath();
    g.fillPath();
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
        // แสก + เงาปอยผม
        g.fillStyle(H_SHADE, 0.7);
        g.fillTriangle(210, 78, 196, 120, 224, 120);
        g.fillCircle(150, 150, 9); g.fillCircle(270, 150, 9);
        hairShine(g);
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
        // เส้นเงาปลายผม + แนวเงากลาง
        g.fillStyle(H_SHADE, 0.6);
        g.fillCircle(164, 372, 12); g.fillCircle(256, 372, 12);
        g.fillRoundedRect(150, 150, 14, 210, 7);
        g.fillRoundedRect(256, 150, 14, 210, 7);
      },
      front: function (g) {
        var pass = function (c, e) {
          g.fillStyle(c, 1);
          hairDome(g, e);
          cap(g, 136, 140, 128, 262, 15 + e);
          cap(g, 284, 140, 292, 262, 15 + e);
        };
        pass(H_LINE, 3); pass(H_BASE, 0);
        g.fillStyle(H_SHADE, 0.55);
        g.fillTriangle(210, 78, 194, 122, 226, 122);
        hairShine(g);
      }
    },
    // 2: ทวินเทล
    {
      back: function (g) {
        var pass = function (c, e) {
          g.fillStyle(c, 1);
          g.fillCircle(210, 148, 84 + e);
          tail(g, 146, 120, -26, 224, 27 + e, 9 + e, 26);
          tail(g, 274, 120, 26, 224, 27 + e, 9 + e, 26);
        };
        pass(H_LINE, 3); pass(H_BASE, 0);
        // ลายเส้นผมด้านในปอย (เงาบางๆ ต่อเนื่อง)
        g.fillStyle(H_SHADE, 0.45);
        tail(g, 150, 134, -20, 196, 7, 3, 26);
        tail(g, 270, 134, 20, 196, 7, 3, 26);
      },
      front: function (g) {
        var pass = function (c, e) {
          g.fillStyle(c, 1);
          hairDome(g, e);
        };
        pass(H_LINE, 3); pass(H_BASE, 0);
        // ยางมัดผมสองข้าง (จุดรวบปอย)
        g.fillStyle(H_DARK, 1);
        g.fillCircle(146, 120, 13); g.fillCircle(274, 120, 13);
        g.fillStyle(H_SHADE, 1);
        g.fillCircle(146, 120, 6.5); g.fillCircle(274, 120, 6.5);
        // แสกกลาง + ไฮไลต์
        g.fillStyle(H_SHADE, 0.55);
        g.fillTriangle(210, 78, 196, 120, 224, 120);
        hairShine(g);
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
        g.fillStyle(H_SHADE, 0.6);
        g.fillCircle(296, 300, 14);
        g.fillCircle(280, 180, 10);
      },
      front: function (g) {
        var pass = function (c, e) {
          g.fillStyle(c, 1);
          hairDome(g, e);
        };
        pass(H_LINE, 3); pass(H_BASE, 0);
        g.fillStyle(H_DARK, 1);
        g.fillCircle(256, 96, 13);
        g.fillStyle(H_SHADE, 0.55);
        g.fillTriangle(206, 78, 192, 120, 222, 120);
        hairShine(g);
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
        g.fillStyle(H_SHADE, 0.5);
        g.fillCircle(128, 210, 16); g.fillCircle(292, 210, 16);
      },
      front: function (g) {
        var pts = [[140, 105], [175, 82], [210, 74], [245, 82], [280, 105], [130, 152], [290, 152]];
        var pass = function (c, e) {
          g.fillStyle(c, 1);
          for (var i = 0; i < pts.length; i++) g.fillCircle(pts[i][0], pts[i][1], 25 + e);
          hairDome(g, e);
        };
        pass(H_LINE, 3); pass(H_BASE, 0);
        g.fillStyle(0xffffff, 0.5);
        g.fillCircle(175, 84, 10); g.fillCircle(245, 84, 10); g.fillCircle(210, 76, 11);
      }
    },
    // 5: ผมมวยน่ารัก (bun)
    {
      back: function (g) {
        var pass = function (c, e) {
          g.fillStyle(c, 1);
          g.fillCircle(210, 148, 84 + e);
        };
        pass(H_LINE, 3); pass(H_BASE, 0);
      },
      front: function (g) {
        var pass = function (c, e) {
          g.fillStyle(c, 1);
          hairDome(g, e);
        };
        pass(H_LINE, 3); pass(H_BASE, 0);
        // มวยผมบนหัว
        g.fillStyle(H_LINE, 1); g.fillCircle(210, 66, 40);
        g.fillStyle(H_BASE, 1); g.fillCircle(210, 66, 36);
        // ยางมัด
        g.fillStyle(H_DARK, 1); g.fillRoundedRect(190, 96, 40, 14, 6);
        // ปอยผมข้างแก้ม
        g.fillStyle(H_BASE, 1);
        cap(g, 132, 150, 128, 210, 11); cap(g, 288, 150, 292, 210, 11);
        // เงามวย + แสก
        g.fillStyle(H_SHADE, 0.55);
        g.fillEllipse(210, 92, 40, 10);
        g.fillTriangle(210, 78, 197, 118, 223, 118);
        hairShine(g);
      }
    },
    // 6: ผมเปียยาว (เปียพาดไหล่ซ้าย)
    {
      back: function (g) {
        var pass = function (c, e) {
          g.fillStyle(c, 1);
          g.fillRoundedRect(122 - e, 92 - e, 176 + e * 2, 180 + e * 2, { tl: 86, tr: 86, bl: 48, br: 48 });
        };
        pass(H_LINE, 3); pass(H_BASE, 0);
      },
      front: function (g) {
        var pass = function (c, e) {
          g.fillStyle(c, 1);
          hairDome(g, e);
        };
        pass(H_LINE, 3); pass(H_BASE, 0);
        // เปียพาดไหล่ซ้าย — ปล้องผมไล่ลงมา
        var seg = [[150, 200, 20], [156, 236, 19], [150, 272, 18], [158, 306, 17], [151, 338, 15], [158, 366, 13]];
        for (var i = 0; i < seg.length; i++) {
          g.fillStyle(H_LINE, 1); g.fillCircle(seg[i][0], seg[i][1], seg[i][2] + 2);
          g.fillStyle(H_BASE, 1); g.fillCircle(seg[i][0], seg[i][1], seg[i][2]);
        }
        // เส้นเงาแบ่งปล้อง
        g.fillStyle(H_SHADE, 0.55);
        for (var j = 0; j < seg.length - 1; j++) {
          g.fillEllipse((seg[j][0] + seg[j + 1][0]) / 2, (seg[j][1] + seg[j + 1][1]) / 2, 22, 5);
        }
        // โบว์ปลายเปีย
        g.fillStyle(H_DARK, 1);
        g.fillTriangle(158, 380, 142, 372, 142, 392);
        g.fillTriangle(158, 380, 174, 372, 174, 392);
        g.fillCircle(158, 380, 6);
        g.fillStyle(H_SHADE, 0.5);
        g.fillTriangle(210, 78, 197, 118, 223, 118);
        hairShine(g);
      }
    }
  ];

  // ============================================================
  // เสื้อ — เพิ่มเงาพับผ้า/ไฮไลต์เพื่อความมีมิติ
  // ============================================================

  var TOP_DRAWERS = [
    // 0: เสื้อยืดแดงลายหัวใจ
    function (g) {
      var base = 0xef5d55, dark = 0xb84440, hi = 0xff8079;
      var pass = function (c, e) {
        g.fillStyle(c, 1);
        cap(g, 178, 254, 165, 292, 15 + e);
        cap(g, 242, 254, 255, 292, 15 + e);
        g.fillRoundedRect(168 - e, 236 - e, 84 + e * 2, 100 + e * 2, 18);
      };
      pass(dark, 3); pass(base, 0);
      // เงาพับด้านข้าง (บางๆ) + ไฮไลต์ไหล่
      g.fillStyle(dark, 0.2); g.fillEllipse(173, 296, 14, 46); g.fillEllipse(247, 296, 14, 46);
      g.fillStyle(hi, 0.5); g.fillEllipse(196, 250, 30, 10);
      // หัวใจสีขาว
      g.fillStyle(0xffffff, 1);
      g.fillCircle(203, 279, 7);
      g.fillCircle(217, 279, 7);
      g.fillTriangle(196, 283, 224, 283, 210, 300);
    },
    // 1: เชิ้ตแขนยาวสีฟ้า
    function (g) {
      var base = 0x74b9f0, dark = 0x4d86bd, hi = 0x9fd0f7;
      var pass = function (c, e) {
        g.fillStyle(c, 1);
        cap(g, 178, 254, 157, 330, 14 + e);
        cap(g, 242, 254, 263, 330, 14 + e);
        g.fillRoundedRect(168 - e, 236 - e, 84 + e * 2, 102 + e * 2, 14);
      };
      pass(dark, 3); pass(base, 0);
      g.fillStyle(hi, 0.5); g.fillEllipse(196, 252, 30, 9);
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
      var base = 0xa08af5, dark = 0x7361c9, hi = 0xc0b2fb;
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
      g.fillStyle(hi, 0.45); g.fillEllipse(196, 256, 32, 10);
      // กระเป๋าหน้าท้อง
      g.fillStyle(dark, 1);
      g.fillRoundedRect(186, 302, 48, 30, 10);
      // เชือกฮู้ด
      g.lineStyle(3, 0xffffff, 1);
      g.lineBetween(202, 258, 199, 278);
      g.lineBetween(218, 258, 221, 278);
      g.fillStyle(0xffffff, 1);
      g.fillCircle(199, 279, 3); g.fillCircle(221, 279, 3);
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
      // คอเสื้อ + ริบข้อมือ
      g.fillStyle(dark, 1);
      g.fillRoundedRect(192, 232, 36, 10, 5);
      g.fillCircle(156, 330, 10); g.fillCircle(264, 330, 10);
    },
    // 4: เดรสชมพูบานๆ (คลุมท่อนล่าง)
    function (g) {
      var base = 0xff9ecb, dark = 0xd57ba8, light = 0xffd3e8;
      var pass = function (c, e) {
        g.fillStyle(c, 1);
        g.fillCircle(168, 258, 16 + e);
        g.fillCircle(252, 258, 16 + e);
        g.fillRoundedRect(170 - e, 236 - e, 80 + e * 2, 74 + e * 2, 16);
        g.fillPoints([
          { x: 178 - e, y: 300 }, { x: 140 - e, y: 412 },
          { x: 280 + e, y: 412 }, { x: 242 + e, y: 300 }
        ], true);
        g.fillEllipse(210, 412, 140 + e * 2, 30 + e * 2);
      };
      pass(dark, 3); pass(base, 0);
      // เงาจีบกระโปรง
      g.fillStyle(dark, 0.4);
      g.fillTriangle(190, 320, 176, 410, 196, 410);
      g.fillTriangle(230, 320, 244, 410, 224, 410);
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
      // แถบชายเสื้อ (สองเส้น)
      g.fillRect(170, 320, 80, 6); g.fillRect(170, 330, 80, 4);
      // โบว์แดง
      g.fillStyle(0xe8564f, 1);
      g.fillTriangle(210, 266, 194, 258, 194, 276);
      g.fillTriangle(210, 266, 226, 258, 226, 276);
      g.fillCircle(210, 266, 5);
    },
    // 6: เสื้อครอปเหลือง
    function (g) {
      var base = 0xffd95e, dark = 0xd9b23c, hi = 0xffeb9c;
      var pass = function (c, e) {
        g.fillStyle(c, 1);
        cap(g, 178, 252, 164, 284, 14 + e);
        cap(g, 242, 252, 256, 284, 14 + e);
        g.fillRoundedRect(170 - e, 236 - e, 80 + e * 2, 70 + e * 2, 16);
      };
      pass(dark, 3); pass(base, 0);
      g.fillStyle(hi, 0.55); g.fillEllipse(196, 250, 28, 9);
      // คอวี + ริบชายเสื้อ
      g.fillStyle(dark, 1);
      g.fillTriangle(196, 236, 224, 236, 210, 256);
      g.fillRect(170, 300, 80, 6);
      // กระดุมเล็ก
      g.fillStyle(0xffffff, 1);
      g.fillCircle(210, 272, 3); g.fillCircle(210, 286, 3);
    },
    // 7: เดรสฟ้าลายดาว (คลุมท่อนล่าง)
    function (g) {
      var base = 0x8ec9ff, dark = 0x5f9ad6, light = 0xd6ecff;
      var pass = function (c, e) {
        g.fillStyle(c, 1);
        g.fillCircle(168, 258, 15 + e);
        g.fillCircle(252, 258, 15 + e);
        g.fillRoundedRect(170 - e, 236 - e, 80 + e * 2, 72 + e * 2, 16);
        g.fillPoints([
          { x: 176 - e, y: 298 }, { x: 138 - e, y: 414 },
          { x: 282 + e, y: 414 }, { x: 244 + e, y: 298 }
        ], true);
        g.fillEllipse(210, 414, 144 + e * 2, 30 + e * 2);
      };
      pass(dark, 3); pass(base, 0);
      g.fillStyle(dark, 0.35);
      g.fillTriangle(188, 314, 174, 410, 194, 410);
      g.fillTriangle(232, 314, 246, 410, 226, 410);
      // เข็มขัดขาว
      g.fillStyle(light, 1); g.fillRect(172, 296, 76, 9);
      // ดาวขาวบนกระโปรง
      var stars = [[172, 356], [210, 380], [248, 356], [156, 402], [210, 410], [264, 402]];
      g.fillStyle(0xffffff, 1);
      for (var i = 0; i < stars.length; i++) star(g, stars[i][0], stars[i][1], 8, 3.6);
    }
  ];

  // ดาวห้าแฉกเล็ก
  function star(g, cx, cy, outer, inner) {
    var pts = [];
    for (var i = 0; i < 10; i++) {
      var r = (i % 2 === 0) ? outer : inner;
      var a = rad(-90 + i * 36);
      pts.push({ x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r });
    }
    g.fillPoints(pts, true);
  }

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
    },
    // 5: กระโปรงยาวลายจุด (A-line ยาว สีม่วง)
    function (g) {
      var base = 0xbfa2ef, dark = 0x9075cf;
      var pass = function (c, e) {
        g.fillStyle(c, 1);
        g.fillPoints([
          { x: 178 - e, y: 322 }, { x: 132 - e, y: 452 },
          { x: 288 + e, y: 452 }, { x: 242 + e, y: 322 }
        ], true);
        g.fillEllipse(210, 452, 156 + e * 2, 26 + e * 2);
        g.fillRoundedRect(174 - e, 316 - e, 72 + e * 2, 14 + e * 2, 6);
      };
      pass(dark, 3); pass(base, 0);
      // เงาริ้ว
      g.fillStyle(dark, 0.3);
      g.fillTriangle(196, 340, 176, 448, 200, 448);
      g.fillTriangle(224, 340, 244, 448, 220, 448);
      // ลายจุดขาว
      g.fillStyle(0xffffff, 0.9);
      var dots = [[178, 360], [210, 372], [242, 360], [160, 402], [196, 414], [232, 414], [264, 402], [150, 440], [210, 446], [270, 440]];
      for (var i = 0; i < dots.length; i++) g.fillCircle(dots[i][0], dots[i][1], 4.5);
    },
    // 6: กางเกงขาบานเขียว
    function (g) {
      var base = 0x7ec98f, dark = 0x549a67;
      var pass = function (c, e) {
        g.fillStyle(c, 1);
        g.fillRoundedRect(172 - e, 320 - e, 76 + e * 2, 22 + e * 2, 8);
        g.fillEllipse(210, 344, 92 + e * 2, 44 + e * 2);
        // ขาบาน (แคบบนกว้างล่าง)
        g.fillPoints([
          { x: 178 - e, y: 350 }, { x: 168 - e, y: 502 },
          { x: 214 + e, y: 502 }, { x: 205 + e, y: 350 }
        ], true);
        g.fillPoints([
          { x: 215 - e, y: 350 }, { x: 206 - e, y: 502 },
          { x: 252 + e, y: 502 }, { x: 242 + e, y: 350 }
        ], true);
        g.fillEllipse(191, 502, 48 + e * 2, 14 + e * 2);
        g.fillEllipse(229, 502, 48 + e * 2, 14 + e * 2);
      };
      pass(dark, 3); pass(base, 0);
      // เส้นกลางขา
      g.lineStyle(3, dark, 0.7);
      g.lineBetween(191, 356, 191, 496);
      g.lineBetween(229, 356, 229, 496);
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
      var pass = function (c, e) {
        g.fillStyle(c, 1);
        cap(g, 190, 468, 188, 498, 17 + e);
        cap(g, 230, 468, 232, 498, 17 + e);
      };
      pass(0xc9c9c9, 3); pass(0xffffff, 0);
      var pass2 = function (c, e) {
        g.fillStyle(c, 1);
        g.fillEllipse(187, 513, 54 + e * 2, 28 + e * 2);
        g.fillEllipse(233, 513, 54 + e * 2, 28 + e * 2);
      };
      pass2(0x26262e, 3); pass2(0x3c3c46, 0);
      g.fillStyle(0x3c3c46, 1);
      g.fillRoundedRect(169, 502, 36, 6, 3);
      g.fillRoundedRect(215, 502, 36, 6, 3);
      g.fillStyle(0xf5c542, 1);
      g.fillCircle(187, 505, 3); g.fillCircle(233, 505, 3);
    },
    // 4: ส้นสูงแดง
    function (g) {
      var base = 0xe23b52, dark = 0xa8283a;
      var pass = function (c, e) {
        g.fillStyle(c, 1);
        // ตัวรองเท้า
        g.fillEllipse(188, 512, 54 + e * 2, 24 + e * 2);
        g.fillEllipse(234, 512, 54 + e * 2, 24 + e * 2);
      };
      pass(dark, 3); pass(base, 0);
      // ส้นสูง
      g.fillStyle(dark, 1);
      g.fillRect(206, 512, 6, 22); g.fillRect(252, 512, 6, 22);
      // ไฮไลต์เงา
      g.fillStyle(0xff8090, 0.6);
      g.fillEllipse(176, 508, 20, 6); g.fillEllipse(222, 508, 20, 6);
    },
    // 5: รองเท้าบัลเลต์ชมพู
    function (g) {
      var base = 0xffb3d1, dark = 0xe089ad;
      var pass = function (c, e) {
        g.fillStyle(c, 1);
        g.fillEllipse(187, 514, 54 + e * 2, 26 + e * 2);
        g.fillEllipse(233, 514, 54 + e * 2, 26 + e * 2);
      };
      pass(dark, 3); pass(base, 0);
      // ขอบเปิดหน้าเท้า
      g.fillStyle(0xffe0ee, 1);
      g.fillEllipse(180, 505, 22, 8); g.fillEllipse(226, 505, 22, 8);
      // โบว์เล็ก
      g.fillStyle(dark, 1);
      g.fillTriangle(187, 504, 179, 500, 179, 508);
      g.fillTriangle(187, 504, 195, 500, 195, 508);
      g.fillTriangle(233, 504, 225, 500, 225, 508);
      g.fillTriangle(233, 504, 241, 500, 241, 508);
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
      g.fillStyle(0xff8079, 0.5); g.fillEllipse(188, 96, 40, 16);
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
      g.fillStyle(0xffc2d6, 0.7); g.fillEllipse(133, 70, 14, 8); g.fillEllipse(177, 70, 14, 8);
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
      g.fillStyle(0xffffff, 0.5);
      g.fillEllipse(172, 151, 8, 4); g.fillEllipse(236, 151, 8, 4);
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
      g.fillStyle(0xfff0b0, 0.6); g.fillRect(168, 78, 84, 4);
      g.fillStyle(base, 1);
      g.fillCircle(183, 40, 6); g.fillCircle(210, 32, 6); g.fillCircle(237, 40, 6);
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
    },
    // 6: ที่คาดผมดอกไม้
    function (g) {
      // แถบคาด
      g.lineStyle(8, 0xffffff, 1);
      g.beginPath(); g.arc(210, 150, 92, rad(212), rad(328), false); g.strokePath();
      // ดอกไม้เรียงบนแถบ
      var flowers = [[138, 96, 0xff8fb3], [172, 74, 0xffd94d], [210, 66, 0xff9ecb], [248, 74, 0x9fd9ff], [282, 96, 0xffb3d1]];
      for (var i = 0; i < flowers.length; i++) {
        var fx = flowers[i][0], fy = flowers[i][1], col = flowers[i][2];
        g.fillStyle(col, 1);
        for (var p = 0; p < 5; p++) {
          var a = rad(p * 72 - 90);
          g.fillCircle(fx + Math.cos(a) * 8, fy + Math.sin(a) * 8, 5.5);
        }
        g.fillStyle(0xfff3c4, 1); g.fillCircle(fx, fy, 4.5);
      }
    },
    // 7: ต่างหูดาว
    function (g) {
      g.fillStyle(0xf7c948, 1);
      star(g, 122, 178, 13, 6);
      star(g, 298, 178, 13, 6);
      g.fillStyle(0xfff0b0, 0.8);
      g.fillCircle(122, 174, 3); g.fillCircle(298, 174, 3);
      // ห่วงเชื่อมติ่งหู
      g.lineStyle(2, 0xcf9c1d, 1);
      g.strokeCircle(122, 166, 3); g.strokeCircle(298, 166, 3);
    }
  ];

  // ============================================================
  // ฉากหลัง 720x720 — ใช้ไล่สี (fillGradientStyle) เพิ่มมิติ
  // ============================================================

  // ไล่สีเต็มพื้นที่สี่เหลี่ยม (แนวตั้ง)
  // หมายเหตุสำคัญ: generateTexture อบผ่าน Canvas renderer ที่ "ข้าม" คำสั่ง
  // fillGradientStyle ทั้งหมด ดังนั้นจึงต้องวาดไล่สีเองด้วยแถบสี solid หลายแถบ
  // (interpolate สี top→bottom) เพื่อให้ฉากหลังติดสีจริงตอนอบเป็น texture
  function gradRect(g, x, y, w, h, top, bottom) {
    var tr = (top >> 16) & 0xff, tg = (top >> 8) & 0xff, tb = top & 0xff;
    var br = (bottom >> 16) & 0xff, bg2 = (bottom >> 8) & 0xff, bb = bottom & 0xff;
    var steps = 40;
    for (var i = 0; i < steps; i++) {
      var t = i / (steps - 1);
      var r = Math.round(tr + (br - tr) * t);
      var gg = Math.round(tg + (bg2 - tg) * t);
      var b = Math.round(tb + (bb - tb) * t);
      g.fillStyle((r << 16) | (gg << 8) | b, 1);
      var sy = y + (h * i) / steps;
      // ทับแถบให้เกยกันเล็กน้อยกันเส้นขอบขาว
      g.fillRect(x, Math.floor(sy), w, Math.ceil(h / steps) + 1);
    }
  }

  var BG_DRAWERS = [
    // 0: ห้องนอนสีพาสเทล
    function (g) {
      gradRect(g, 0, 0, BGW, 510, 0xfff2ee, 0xfcdfe0);          // ผนังไล่สี
      g.fillStyle(0xf6d9cf, 1); g.fillRect(0, 470, BGW, 40);     // บัวผนัง
      gradRect(g, 0, 500, BGW, 220, 0xe7c298, 0xd6a976);        // พื้นไม้ไล่สี
      g.lineStyle(3, 0xc9a06c, 0.5);
      for (var fy = 540; fy < 720; fy += 45) g.lineBetween(0, fy, 720, fy);
      // พรม
      g.fillStyle(0xf7b9c9, 1); g.fillEllipse(360, 645, 430, 115);
      g.fillStyle(0xffd9e3, 1); g.fillEllipse(360, 645, 340, 85);
      // หน้าต่าง + ท้องฟ้าไล่สีข้างใน
      g.fillStyle(0xffffff, 1); g.fillRoundedRect(78, 88, 204, 244, 14);
      gradRect(g, 90, 100, 180, 220, 0xd6f0ff, 0xa9dbff);
      g.fillStyle(0xffffff, 1);
      g.fillRect(176, 100, 8, 220); g.fillRect(90, 202, 180, 8);
      g.fillStyle(0xfff2b8, 1); g.fillCircle(130, 140, 22);      // ตะวันนอกหน้าต่าง
      g.fillStyle(0xffffff, 0.9);
      g.fillCircle(216, 150, 16); g.fillCircle(238, 146, 13); g.fillCircle(196, 146, 11);
      // ผ้าม่าน
      g.fillStyle(0xffc2d4, 1);
      g.fillRoundedRect(58, 78, 34, 268, 16);
      g.fillRoundedRect(268, 78, 34, 268, 16);
      // ชั้นวาง + ต้นไม้เล็ก
      g.fillStyle(0xd9a877, 1); g.fillRoundedRect(470, 300, 150, 12, 4);
      g.fillStyle(0xe58aa8, 1); g.fillRoundedRect(500, 262, 34, 40, 6);
      g.fillStyle(0x76c893, 1);
      g.fillCircle(504, 258, 14); g.fillCircle(530, 258, 14); g.fillCircle(517, 244, 15);
      // กรอบรูปหัวใจ
      g.fillStyle(0xffffff, 1); g.fillRoundedRect(468, 110, 124, 104, 10);
      g.fillStyle(0xffe1ec, 1); g.fillRoundedRect(478, 120, 104, 84, 6);
      g.fillStyle(0xff8fb3, 1);
      g.fillCircle(521, 154, 12); g.fillCircle(541, 154, 12);
      g.fillTriangle(509, 160, 553, 160, 531, 186);
    },
    // 1: สวนสาธารณะ
    function (g) {
      gradRect(g, 0, 0, BGW, 500, 0xd6f3ff, 0xa7e3ff);          // ฟ้าไล่สี
      // ตะวัน + รัศมี
      g.fillStyle(0xffe98a, 0.35); g.fillCircle(610, 100, 74);
      g.fillStyle(0xffd94d, 1); g.fillCircle(610, 100, 52);
      g.fillStyle(0xffe98a, 1); g.fillCircle(610, 100, 40);
      // เมฆ
      g.fillStyle(0xffffff, 1);
      g.fillCircle(150, 110, 30); g.fillCircle(185, 100, 26); g.fillCircle(120, 100, 24);
      g.fillCircle(420, 66, 24); g.fillCircle(450, 58, 20); g.fillCircle(392, 58, 18);
      // เนินหญ้า 2 ชั้น
      g.fillStyle(0xbfe79a, 1); g.fillEllipse(200, 520, 620, 180);
      g.fillStyle(0xa5dd8b, 1); g.fillRect(0, 470, BGW, 260);
      g.fillStyle(0x8ecf72, 1); g.fillEllipse(360, 476, 760, 40);
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
      gradRect(g, 0, 0, BGW, 400, 0xd6f2ff, 0x9fe0ff);          // ฟ้าไล่สี
      g.fillStyle(0xffe98a, 0.4); g.fillCircle(120, 92, 68);
      g.fillStyle(0xffd94d, 1); g.fillCircle(120, 92, 48);
      g.fillStyle(0xffffff, 1);
      g.fillCircle(500, 92, 26); g.fillCircle(532, 84, 22); g.fillCircle(470, 84, 20);
      // ทะเลไล่สี
      gradRect(g, 0, 380, BGW, 180, 0x8bdcee, 0x4fbfda);
      g.lineStyle(5, 0xd8f6fc, 0.9);
      for (var row = 0; row < 2; row++) {
        for (var x = 0; x < 720; x += 90) {
          g.beginPath();
          g.arc(x + 45, 430 + row * 55, 30, rad(25), rad(155), false);
          g.strokePath();
        }
      }
      // หาดทรายไล่สี
      gradRect(g, 0, 540, BGW, 180, 0xfae7bc, 0xf0d090);
      g.fillStyle(0xfef2d6, 1); g.fillEllipse(360, 548, 760, 26);
      // ลูกบอลชายหาด
      g.fillStyle(0xffffff, 1); g.fillCircle(600, 616, 42);
      g.fillStyle(0xef5d55, 1);
      g.slice(600, 616, 42, rad(-90), rad(-18), false); g.fillPath();
      g.slice(600, 616, 42, rad(54), rad(126), false); g.fillPath();
      g.fillStyle(0x74b9f0, 1);
      g.slice(600, 616, 42, rad(-18), rad(54), false); g.fillPath();
      g.slice(600, 616, 42, rad(126), rad(198), false); g.fillPath();
      g.fillStyle(0xffffff, 1); g.fillCircle(600, 616, 9);
      // ปราสาททราย
      g.fillStyle(0xe8c98d, 1);
      g.fillRect(96, 628, 84, 40); g.fillRect(110, 604, 18, 26);
      g.fillRect(148, 604, 18, 26); g.fillTriangle(110, 604, 128, 584, 128, 604);
      g.fillTriangle(148, 604, 166, 584, 166, 604);
      // เปลือกหอย
      g.fillStyle(0xffb9a3, 1); g.fillCircle(300, 672, 14);
      g.fillStyle(0xff9d85, 1);
      g.slice(300, 672, 14, rad(180), rad(300), false); g.fillPath();
    },
    // 3: เวทีคอนเสิร์ต
    function (g) {
      gradRect(g, 0, 0, BGW, BGH, 0x5a3f7a, 0x392a52);          // ฉากมืดไล่สี
      // สปอตไลต์
      g.fillStyle(0xfff2c4, 0.14); g.fillTriangle(360, -40, 60, 720, 660, 720);
      g.fillStyle(0xffd6f0, 0.10); g.fillTriangle(180, -40, -60, 640, 340, 720);
      g.fillStyle(0xd0f0ff, 0.10); g.fillTriangle(540, -40, 380, 720, 780, 640);
      g.fillStyle(0xfff2c4, 0.20); g.fillEllipse(360, 640, 480, 90);
      // พื้นเวที
      gradRect(g, 0, 560, BGW, 160, 0x7a5aa8, 0x5c4484);
      g.fillStyle(0x9070b8, 1); g.fillEllipse(360, 566, 760, 36);
      // ดาวระยิบ
      var stars = [[90, 140], [200, 80], [320, 180], [430, 90], [560, 160], [660, 70], [150, 300], [600, 300], [500, 240]];
      g.fillStyle(0xfff6d8, 0.95);
      for (var i = 0; i < stars.length; i++) star(g, stars[i][0], stars[i][1], 7, 3);
      // ผ้าม่านแดง
      g.fillStyle(0xd6486a, 1);
      g.fillRoundedRect(-40, -20, 140, 750, 40);
      g.fillRoundedRect(620, -20, 140, 750, 40);
      g.lineStyle(4, 0xb03654, 0.8);
      g.lineBetween(30, 40, 22, 680); g.lineBetween(66, 40, 74, 680);
      g.lineBetween(654, 40, 646, 680); g.lineBetween(690, 40, 698, 680);
      g.fillStyle(0xb03654, 1);
      for (var x = 45; x < 720; x += 90) g.fillCircle(x, 4, 48);
      // ธงราว
      var bunt = [0xffd94d, 0x74b9f0, 0xff8fb3, 0x7ccf8f, 0xffd94d, 0x74b9f0];
      for (var b = 0; b < bunt.length; b++) {
        g.fillStyle(bunt[b], 1);
        var bx = 130 + b * 78;
        g.fillTriangle(bx, 30, bx + 60, 30, bx + 30, 74);
      }
      g.lineStyle(2, 0xfff2c4, 0.6); g.lineBetween(120, 30, 620, 30);
    },
    // 4: ท้องฟ้ากลางคืน
    function (g) {
      gradRect(g, 0, 0, BGW, BGH, 0x2b2d63, 0x503a72);          // ฟ้ากลางคืนไล่สี
      // ดวงจันทร์เสี้ยว + รัศมี
      g.fillStyle(0xfff3c0, 0.18); g.fillCircle(580, 130, 78);
      g.fillStyle(0xfff3c0, 1); g.fillCircle(580, 130, 54);
      g.fillStyle(0x3a336e, 1); g.fillCircle(602, 116, 48);
      // ดาวจำนวนมาก
      var stars = [[70, 90], [150, 160], [240, 70], [330, 140], [120, 250], [260, 220],
                   [420, 90], [470, 200], [660, 250], [700, 120], [360, 260], [200, 320]];
      for (var i = 0; i < stars.length; i++) {
        g.fillStyle(0xfff6d8, 0.9);
        star(g, stars[i][0], stars[i][1], (i % 3) + 4, ((i % 3) + 4) / 2.4);
      }
      g.fillStyle(0xffffff, 0.8);
      for (var d = 0; d < 40; d++) {
        var dx = (d * 137) % 720, dy = (d * 89) % 420;
        g.fillCircle(dx, dy, 1.2);
      }
      // เนินเขาเงา
      g.fillStyle(0x241f45, 1); g.fillEllipse(180, 640, 560, 220);
      g.fillStyle(0x2e2752, 1); g.fillEllipse(560, 690, 560, 240);
      // บ้านหลังเล็กมีไฟ
      g.fillStyle(0x3a336e, 1); g.fillRect(300, 560, 70, 60);
      g.fillTriangle(296, 560, 374, 560, 335, 528);
      g.fillStyle(0xffe08a, 1); g.fillRect(320, 578, 16, 16); g.fillRect(340, 578, 16, 16);
    },
    // 5: คาเฟ่น่ารัก
    function (g) {
      gradRect(g, 0, 0, BGW, 470, 0xfbe8d4, 0xf3d3b6);          // ผนังอุ่นไล่สี
      // ลายทางผนัง
      g.fillStyle(0xf7dcc2, 0.6);
      for (var sx = 0; sx < 720; sx += 60) g.fillRect(sx, 0, 30, 470);
      // พื้นกระเบื้อง
      gradRect(g, 0, 470, BGW, 250, 0xd8b48c, 0xc39c72);
      g.lineStyle(2, 0xb08a63, 0.5);
      for (var gx = 0; gx < 720; gx += 60) g.lineBetween(gx, 470, gx + 40, 720);
      // หน้าต่างโค้ง + ท้องฟ้า
      g.fillStyle(0xffffff, 1); g.fillRoundedRect(70, 96, 200, 210, { tl: 90, tr: 90, bl: 8, br: 8 });
      gradRect(g, 84, 130, 172, 168, 0xd6f0ff, 0xbfe6ff);
      g.fillStyle(0xffffff, 1); g.fillRect(166, 130, 8, 168);
      // กันสาดลายทาง
      for (var t = 0; t < 6; t++) {
        g.fillStyle(t % 2 ? 0xef7d7d : 0xffffff, 1);
        g.fillRect(60 + t * 35, 84, 35, 34);
      }
      g.fillStyle(0xef7d7d, 1); g.fillRect(60, 84, 210, 10);
      // ป้ายเมนู
      g.fillStyle(0x6b4a36, 1); g.fillRoundedRect(470, 150, 150, 120, 10);
      g.fillStyle(0x4a3527, 1); g.fillRoundedRect(482, 162, 126, 96, 6);
      g.lineStyle(3, 0xfff0dd, 0.9);
      g.lineBetween(500, 186, 590, 186); g.lineBetween(500, 210, 600, 210); g.lineBetween(500, 234, 570, 234);
      // ต้นไม้แขวน
      g.fillStyle(0xef8f88, 1); g.fillRoundedRect(360, 96, 40, 26, 6);
      g.fillStyle(0x76c893, 1);
      g.fillCircle(370, 128, 12); g.fillCircle(390, 134, 12); g.fillCircle(380, 148, 12); g.fillCircle(366, 150, 10);
      // โต๊ะ + ถ้วยกาแฟ + เค้ก
      g.fillStyle(0xc98a5a, 1); g.fillRoundedRect(430, 470, 250, 20, 8);
      g.fillStyle(0xa8703f, 1); g.fillRect(470, 490, 14, 80); g.fillRect(626, 490, 14, 80);
      g.fillStyle(0xffffff, 1); g.fillRoundedRect(470, 436, 44, 34, { tl: 6, tr: 6, bl: 16, br: 16 });
      g.lineStyle(5, 0xffffff, 1); g.beginPath(); g.arc(520, 452, 12, rad(300), rad(60), false); g.strokePath();
      g.fillStyle(0x7a4a2e, 1); g.fillEllipse(492, 442, 34, 8);
      // เค้กชิ้น
      g.fillStyle(0xffe0ee, 1); g.fillTriangle(590, 468, 636, 468, 613, 436);
      g.fillStyle(0xff8fb3, 1); g.fillCircle(613, 434, 5);
    }
  ];

  // ============================================================
  // UI + เอฟเฟกต์ (นุ่มขึ้น มีเงา/ไล่สี)
  // ============================================================

  function genUI(scene) {
    // ช่องไอเทมปกติ — มีเงาอ่อนใต้ช่อง (โทนลาเวนเดอร์)
    tex(scene, 'ui-cell', 128, 132, function (g) {
      g.fillStyle(0xdcc6f0, 0.5); g.fillRoundedRect(6, 12, 116, 116, 20);   // เงา
      g.fillStyle(0xffffff, 1); g.fillRoundedRect(4, 4, 120, 120, 18);
      g.fillStyle(0xfaf4ff, 1); g.fillRoundedRect(4, 4, 120, 60, { tl: 18, tr: 18, bl: 0, br: 0 });
      g.lineStyle(2, 0xe6d8f5, 1); g.strokeRoundedRect(5, 5, 118, 118, 17);
    });
    // ช่องที่ถูกเลือก — ขอบกุหลาบเรืองแสง
    tex(scene, 'ui-cell-sel', 128, 132, function (g) {
      g.fillStyle(0xff5c93, 0.32); g.fillRoundedRect(2, 6, 124, 124, 22);   // เรืองแสง
      g.fillStyle(0xfff2f7, 1); g.fillRoundedRect(4, 4, 120, 120, 18);
      g.lineStyle(5, 0xff4f8b, 1); g.strokeRoundedRect(6, 6, 116, 116, 15);
    });
    // แท็บหมวดหมู่ — การ์ดขาวสะอาด + เงาลาเวนเดอร์ (ใช้ solid fill ล้วน
    // เพราะ generateTexture อบผ่าน Canvas renderer ที่ "ข้าม" gradient fill)
    tex(scene, 'ui-tab', 128, 68, function (g) {
      g.fillStyle(0xd0b6ee, 0.5); g.fillRoundedRect(5, 12, 118, 54, 19);   // เงา
      g.fillStyle(0xffffff, 1);   g.fillRoundedRect(2, 2, 124, 58, 18);    // การ์ดขาว
      g.fillStyle(0xf6effc, 1);   g.fillRoundedRect(2, 34, 124, 26, { tl: 0, tr: 0, bl: 18, br: 18 }); // ไล่โทนล่างจาง
      g.lineStyle(2, 0xecdff9, 1); g.strokeRoundedRect(3, 3, 122, 56, 17);
    });
    // ปุ่มใหญ่ทรงพิลล์ — ตัวปุ่มขาว (ย้อม tint = สีจริง) + เงานูน + ไฮไลต์วาว
    // (ต้องเป็น solid fill; gradient จะไม่ติดตอน generateTexture)
    tex(scene, 'ui-btn', 172, 62, function (g) {
      g.fillStyle(0x3a2140, 0.18); g.fillRoundedRect(6, 15, 160, 45, 23);  // เงาใต้ปุ่ม
      g.fillStyle(0xffffff, 1);    g.fillRoundedRect(2, 2, 168, 54, 27);   // ตัวปุ่ม (ย้อมเป็นสีจริง)
      g.fillStyle(0x2a1030, 0.12); g.fillRoundedRect(8, 40, 156, 14, 12);  // เงาครึ่งล่าง (นูน)
      g.fillStyle(0xffffff, 0.5);  g.fillRoundedRect(15, 8, 142, 15, 8);   // ไฮไลต์วาวด้านบน
    });
    // ตรากเครื่องหมายถูก (ติดมุมไอเทมที่เลือก)
    tex(scene, 'ui-check', 38, 38, function (g) {
      g.fillStyle(0x000000, 0.15); g.fillCircle(20, 21, 16);
      g.fillStyle(0xffffff, 1); g.fillCircle(19, 19, 16);
      g.fillStyle(0xff5c93, 1); g.fillCircle(19, 19, 13);
      g.lineStyle(4, 0xffffff, 1);
      g.lineBetween(12, 19, 17, 24);
      g.lineBetween(17, 24, 27, 12);
    });
    // วงกลมตัวอย่างสี (ย้อมด้วย tint) — ตรงกลางต้องเป็นสีขาวเพื่อให้ tint โชว์สีจริง
    // ขอบเทาบางๆ เมื่อย้อมแล้วจะกลายเป็นเฉดเข้มขึ้น ดูเป็นขอบสวยงาม
    tex(scene, 'ui-swatch', 100, 100, function (g) {
      g.fillStyle(0x000000, 0.12); g.fillCircle(51, 53, 43);              // เงา
      g.fillStyle(0x9a9a9a, 1);    g.fillCircle(50, 50, 44);              // ขอบ (ย้อม → เฉดเข้ม)
      g.fillStyle(0xffffff, 1);    g.fillCircle(50, 50, 39);              // เนื้อสี (ย้อม → สีจริง)
    });
    // ไอคอน "ไม่ใส่"
    tex(scene, 'ui-none', 96, 96, function (g) {
      g.lineStyle(7, 0xcdbce6, 1);
      g.strokeCircle(48, 48, 33);
      g.lineBetween(27, 69, 69, 27);
    });
    // หัวใจลอย
    tex(scene, 'fx-heart', 44, 44, function (g) {
      g.fillStyle(0xffffff, 1);
      g.fillCircle(14, 15, 11);
      g.fillCircle(30, 15, 11);
      g.fillTriangle(4, 21, 40, 21, 22, 41);
      g.fillStyle(0xffffff, 0.6);
      g.fillCircle(11, 13, 3);
    });
    // ประกายดาว 4 แฉก
    tex(scene, 'fx-sparkle', 40, 40, function (g) {
      g.fillStyle(0xffffff, 1);
      g.fillPoints([
        { x: 20, y: 2 }, { x: 24, y: 16 }, { x: 38, y: 20 }, { x: 24, y: 24 },
        { x: 20, y: 38 }, { x: 16, y: 24 }, { x: 2, y: 20 }, { x: 16, y: 16 }
      ], true);
      g.fillStyle(0xffffff, 0.9); g.fillCircle(20, 20, 4);
    });
    // กลีบดอกไม้
    tex(scene, 'fx-petal', 30, 22, function (g) {
      g.fillStyle(0xffffff, 1);
      g.fillEllipse(15, 11, 26, 14);
      g.fillStyle(0x000000, 0.08); g.fillEllipse(15, 14, 20, 6);
    });
    // ฟองอากาศ
    tex(scene, 'fx-bubble', 36, 36, function (g) {
      g.lineStyle(3, 0xffffff, 0.9); g.strokeCircle(18, 18, 14);
      g.fillStyle(0xffffff, 0.18); g.fillCircle(18, 18, 13);
      g.fillStyle(0xffffff, 0.9); g.fillCircle(12, 12, 3.5);
    });
  }

  // ============================================================
  // สร้างเท็กซ์เจอร์ทั้งหมด
  // ============================================================

  function addThumb(scene, key, region) {
    var t = scene.textures.get(key);
    // พิกัดครอปอ้างอิงเท็กซ์เจอร์ออกแบบ 420x600 จึงต้องคูณ SS ตามความละเอียดจริง
    if (t && !t.has('thumb')) {
      t.add('thumb', 0, region[0] * SS, region[1] * SS, region[2] * SS, region[3] * SS);
    }
  }

  function generateAll(scene) {
    var D = DUP_DATA;
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
