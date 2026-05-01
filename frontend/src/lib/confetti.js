import confetti from "canvas-confetti";

const COLORS = ["#0EA5E9", "#FFD166", "#06D6A0", "#3B82F6", "#F43F5E", "#FFFFFF"];

export function celebrate(intensity = "normal") {
  const counts = { small: 40, normal: 80, big: 160 };
  const count = counts[intensity] ?? counts.normal;

  confetti({
    particleCount: count,
    spread: 70,
    origin: { y: 0.7 },
    colors: COLORS,
    ticks: 200,
    scalar: 1.1,
  });
}

export function celebrateBig() {
  // Two side cannons for redemptions
  confetti({
    particleCount: 80,
    angle: 60,
    spread: 55,
    origin: { x: 0, y: 0.7 },
    colors: COLORS,
  });
  confetti({
    particleCount: 80,
    angle: 120,
    spread: 55,
    origin: { x: 1, y: 0.7 },
    colors: COLORS,
  });
}
