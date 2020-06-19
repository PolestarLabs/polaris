class MersenneTwister {
  constructor(seed) {
    if (seed === undefined) {
      seed = new Date().getTime();
    }

    this.N = 624;
    this.M = 397;
    this.MATRIXA = 0x9908b0df;
    this.UPPERMASK = 0x80000000;
    this.LOWERMASK = 0x7fffffff;

    this.mt = new Array(this.N);
    this.mti = this.N + 1;

    if (seed.constructor === Array) {
      this.init_by_array(seed, seed.length);
    } else {
      this.init_seed(seed);
    }
  }

  initSeed(s) {
    this.mt[0] = s >>> 0;
    for (this.mti = 1; this.mti < this.N; this.mti += 1) {
      const t = this.mt[this.mti - 1] ^ (this.mt[this.mti - 1] >>> 30);
      this.mt[this.mti] = (((((s & 0xffff0000) >>> 16) * 1812433253) << 16) + (t & 0x0000ffff) * 1812433253)
        + this.mti;
      this.mt[this.mti] >>>= 0;
    }
  }

  initByArray(initKey, keyLength) {
    let i; let j; let
      k;
    this.initSeed(19650218);
    i = 1;
    j = 0;
    k = (this.N > keyLength ? this.N : keyLength);
    for (; k; k -= 1) {
      const s = this.mt[i - 1] ^ (this.mt[i - 1] >>> 30);
      this.mt[i] = (this.mt[i] ^ (((((s & 0xffff0000) >>> 16) * 1664525) << 16) + ((s & 0x0000ffff) * 1664525)))
        + initKey[j] + j;
      this.mt[i] >>>= 0;
      i += 1;
      j += 1;
      if (i >= this.N) {
        this.mt[0] = this.mt[this.N - 1];
        i = 1;
      }
      if (j >= keyLength) j = 0;
    }
    for (k = this.N - 1; k; k -= 1) {
      const s = this.mt[i - 1] ^ (this.mt[i - 1] >>> 30);
      this.mt[i] = (this.mt[i] ^ (((((s & 0xffff0000) >>> 16) * 1566083941) << 16) + (s & 0x0000ffff) * 1566083941))
        - i;
      this.mt[i] >>>= 0;
      i += 1;
      if (i >= this.N) {
        this.mt[0] = this.mt[this.N - 1];
        i = 1;
      }
    }

    this.mt[0] = 0x80000000;
  }

  randomInt() {
    let y;
    const mag01 = [0x0, this.MATRIXA];

    if (this.mti >= this.N) {
      let kk;

      if (this.mti === this.N + 1) this.initSeed(5489);

      for (kk = 0; kk < this.N - this.M; kk += 1) {
        y = (this.mt[kk] & this.UPPERMASK) | (this.mt[kk + 1] & this.LOWERMASK);
        this.mt[kk] = this.mt[kk + this.M] ^ (y >>> 1) ^ mag01[y & 0x1];
      }
      for (; kk < this.N - 1; kk += 1) {
        y = (this.mt[kk] & this.UPPERMASK) | (this.mt[kk + 1] & this.LOWERMASK);
        this.mt[kk] = this.mt[kk + (this.M - this.N)] ^ (y >>> 1) ^ mag01[y & 0x1];
      }
      y = (this.mt[this.N - 1] & this.UPPERMASK) | (this.mt[0] & this.LOWERMASK);
      this.mt[this.N - 1] = this.mt[this.M - 1] ^ (y >>> 1) ^ mag01[y & 0x1];

      this.mti = 0;
    }

    y = this.mt[this.mti += 1];

    y ^= (y >>> 11);
    y ^= (y << 7) & 0x9d2c5680;
    y ^= (y << 15) & 0xefc60000;
    y ^= (y >>> 18);

    return y >>> 0;
  }

  randomInt31() {
    return (this.randomInt() >>> 1);
  }

  randomIncl() {
    return this.randomInt() * (1.0 / 4294967295.0);
  }

  random() {
    return this.randomInt() * (1.0 / 4294967296.0);
  }

  randomExcl() {
    return (this.randomInt() + 0.5) * (1.0 / 4294967296.0);
  }

  randomLong() {
    const a = this.randomInt() >>> 5;
    const b = this.randomInt() >>> 6;
    return (a * 67108864.0 + b) * (1.0 / 9007199254740992.0);
  }
}

module.exports = MersenneTwister;
