class GameEngine {
  constructor(cities) {
    this.cities = cities;
  }

  static haversine(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2
      + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  calculateDistance(city1, city2) {
    return GameEngine.haversine(city1.latitude, city1.longitude, city2.latitude, city2.longitude);
  }

  getMaxKForResolution(resolution) {
    if (resolution === 1) return 15;
    if (resolution === 3) return 35;
    return 25;
  }

  getInitialKNeighbours(resolution) {
    if (resolution === 1) return [2, 10];
    if (resolution === 3) return [3, 25];
    return [2, 15];
  }

  generateQuestion(filteredCities, allCities, resolution) {
    if (filteredCities.length < 3) {
      throw new Error('Not enough cities to generate a question (need at least 3)');
    }
    if (typeof h3 === 'undefined') {
      throw new Error('h3-js library not loaded');
    }

    const questionCity = filteredCities[Math.floor(Math.random() * filteredCities.length)];

    let cell = questionCity.h3Indexes?.[String(resolution)];
    if (!cell) {
      cell = h3.latLngToCell(questionCity.latitude, questionCity.longitude, resolution);
    }

    const maxK = this.getMaxKForResolution(resolution);
    const rings = h3.gridDiskDistances(cell, maxK);

    const hexToRing = new Map();
    for (let k = 0; k < rings.length; k++) {
      for (const hex of rings[k]) {
        hexToRing.set(hex, k);
      }
    }

    const candidatesByK = {};
    for (const city of allCities) {
      if (city.id === questionCity.id) continue;
      let cityHex = city.h3Indexes?.[String(resolution)];
      if (!cityHex) {
        cityHex = h3.latLngToCell(city.latitude, city.longitude, resolution);
      }
      const ring = hexToRing.get(cityHex);
      if (ring !== undefined) {
        if (!candidatesByK[ring]) candidatesByK[ring] = [];
        candidatesByK[ring].push(city);
      }
    }

    if (Object.keys(candidatesByK).length === 0) {
      throw new Error('No candidate cities found in any H3 ring');
    }

    const [kMin, kMax] = this.getInitialKNeighbours(resolution);
    const targetK = kMin + Math.floor(Math.random() * (kMax - kMin + 1));

    let optionA = null;
    let optionAK = targetK;
    while (optionAK >= 1 && (!candidatesByK[optionAK] || candidatesByK[optionAK].length === 0)) {
      optionAK--;
    }
    if (optionAK < 1 || !candidatesByK[optionAK] || candidatesByK[optionAK].length === 0) {
      optionAK = targetK;
      while (optionAK <= maxK && (!candidatesByK[optionAK] || candidatesByK[optionAK].length === 0)) {
        optionAK++;
      }
    }
    if (!candidatesByK[optionAK] || candidatesByK[optionAK].length === 0) {
      throw new Error('No candidate cities found at any ring distance');
    }
    optionA = candidatesByK[optionAK][Math.floor(Math.random() * candidatesByK[optionAK].length)];

    const mink = Math.max(1, optionAK - 2);
    const maxk = Math.min(optionAK + 1, maxK);
    let optionB = null;
    let bestDiff = 0;
    let triedAny = false;

    for (let attempt = 0; attempt < 20; attempt++) {
      const ringK = mink + Math.floor(Math.random() * (maxk - mink + 1));
      const pool = candidatesByK[ringK];
      if (!pool || pool.length === 0) continue;
      const candidate = pool[Math.floor(Math.random() * pool.length)];
      if (candidate.id === optionA.id) continue;

      triedAny = true;
      const distA = this.calculateDistance(questionCity, optionA);
      const distB = this.calculateDistance(questionCity, candidate);
      const minDist = Math.min(distA, distB);
      const maxDist = Math.max(distA, distB);
      const diff = (maxDist - minDist) / minDist;

      if (diff >= 0.1) {
        optionB = candidate;
        break;
      }
      if (diff > bestDiff) {
        bestDiff = diff;
        optionB = candidate;
      }
    }

    if (!optionB || !triedAny) {
      const ringKeys = Object.keys(candidatesByK).map(Number).filter(k => k >= 1).sort((a, b) => a - b);
      for (const k of ringKeys) {
        const pool = candidatesByK[k];
        if (!pool || pool.length === 0) continue;
        const candidate = pool[Math.floor(Math.random() * pool.length)];
        if (candidate.id === optionA.id) continue;
        optionB = candidate;
        break;
      }
    }

    if (!optionB) {
      throw new Error('Could not find a suitable option B');
    }

    const options = [optionA, optionB];
    if (Math.random() < 0.5) options.reverse();

    return {
      questionCity,
      optionA: options[0],
      optionB: options[1],
    };
  }

  checkAnswer(round, selectedCity) {
    const distSelected = this.calculateDistance(round.questionCity, selectedCity);
    const otherCity = selectedCity.id === round.optionA.id ? round.optionB : round.optionA;
    const distOther = this.calculateDistance(round.questionCity, otherCity);
    return distSelected < distOther;
  }

  getCorrectAnswer(round) {
    const distA = this.calculateDistance(round.questionCity, round.optionA);
    const distB = this.calculateDistance(round.questionCity, round.optionB);
    return distA < distB ? round.optionA : round.optionB;
  }

  getIncorrectAnswer(round) {
    const distA = this.calculateDistance(round.questionCity, round.optionA);
    const distB = this.calculateDistance(round.questionCity, round.optionB);
    return distA < distB ? round.optionB : round.optionA;
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = GameEngine;
}
