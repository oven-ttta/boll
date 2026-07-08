'use client';

import { useEffect, useRef } from 'react';

// คอมโพเนนต์ฝั่ง client ที่โหลด Phaser และสร้างเกมเมื่อ mount
// (Phaser ใช้ window/document จึงต้อง import แบบ dynamic ในเบราว์เซอร์เท่านั้น)
export default function DressUpGame() {
  const containerRef = useRef(null);

  useEffect(() => {
    let game;
    let cancelled = false;

    (async () => {
      const { createGame } = await import('@/game/createGame');
      if (cancelled || !containerRef.current) return;
      game = createGame(containerRef.current);
    })();

    return () => {
      cancelled = true;
      if (game) {
        game.destroy(true);
        game = undefined;
      }
    };
  }, []);

  return <div id="game" ref={containerRef} />;
}
