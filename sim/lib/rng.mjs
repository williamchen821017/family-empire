function hashString(input) {
  let h = 2166136261 >>> 0;
  for (const ch of String(input)) {
    h ^= ch.charCodeAt(0);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function createRng(seed = "family-empire") {
  let state = hashString(seed) || 0x6d2b79f5;
  let calls = 0;

  function next() {
    calls += 1;
    state |= 0;
    state = (state + 0x6D2B79F5) | 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  return {
    seed: String(seed),
    next,
    int(minInclusive, maxInclusive) {
      if (maxInclusive < minInclusive) throw new Error("Invalid integer range");
      return minInclusive + Math.floor(next() * (maxInclusive - minInclusive + 1));
    },
    pick(items) {
      if (!items.length) return undefined;
      return items[Math.floor(next() * items.length)];
    },
    shuffle(items) {
      const copy = [...items];
      for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(next() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
      }
      return copy;
    },
    d6() {
      return 1 + Math.floor(next() * 6);
    },
    calls() {
      return calls;
    }
  };
}
