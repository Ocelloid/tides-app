/** Mulberry32 PRNG for reproducible random fill when `options.seed` is set. */
export function mulberry32(seed: number): () => number {
  let state = seed >>> 0;

  return () => {
    state += 0x6d2b79f5;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export type Prng = {
  int: (min: number, max: number) => number;
  pick: <T>(items: readonly T[]) => T;
  shuffle: <T>(items: readonly T[]) => T[];
};

export function createPrng(seed?: number): Prng {
  if (seed === undefined) {
    return {
      int: (min, max) => Math.floor(Math.random() * (max - min + 1)) + min,
      pick: <T>(items: readonly T[]) => {
        if (items.length === 0) {
          throw new Error("Cannot pick from empty list");
        }
        return items[Math.floor(Math.random() * items.length)]!;
      },
      shuffle: <T>(items: readonly T[]) =>
        [...items].sort(() => Math.random() - 0.5),
    };
  }

  const random = mulberry32(seed);

  return {
    int: (min, max) => Math.floor(random() * (max - min + 1)) + min,
    pick: <T>(items: readonly T[]) => {
      if (items.length === 0) {
        throw new Error("Cannot pick from empty list");
      }
      return items[Math.floor(random() * items.length)]!;
    },
    shuffle: <T>(items: readonly T[]) => {
      const copy = [...items];
      for (let index = copy.length - 1; index > 0; index -= 1) {
        const swapIndex = Math.floor(random() * (index + 1));
        const current = copy[index]!;
        copy[index] = copy[swapIndex]!;
        copy[swapIndex] = current;
      }
      return copy;
    },
  };
}
