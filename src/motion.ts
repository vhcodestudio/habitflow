export const motionTokens = {
  duration: { instant: 0.08, fast: 0.18, normal: 0.35, slow: 0.6 },
  easing: { smooth: [0.22, 1, 0.36, 1] as const },
  distance: { sm: 8, md: 16 },
  scale: { press: 0.94, pop: 1.08 },
};

export const springs = {
  snappy: { type: "spring", stiffness: 300, damping: 30 },
  gentle: { type: "spring", stiffness: 120, damping: 14 },
  bouncy: { type: "spring", stiffness: 400, damping: 12 },
} as const;

export const MILESTONES = [7, 21, 30, 66, 100];
