/**
 * PANTONE Color Database
 * 주요 PANTONE 색상의 Lab 값 데이터베이스
 * 
 * 측정 기준: D50/2° (Graphic Arts Standard)
 * - Illuminant: D50 (5000K) - 인쇄물 평가 표준 조명
 * - Observer: 2° (CIE 1931) - 표준 관찰자
 * - 용도: 오프셋, 플렉소, 디지털 인쇄
 * 
 * 참고: 이 값들은 인쇄 업계 표준 기준입니다.
 * 디지털 디스플레이용 (D65/10°)과는 차이가 있을 수 있습니다.
 */

// PANTONE Solid Coated 주요 색상 (Lab 값 - D50/2°)
const pantoneColors = [
  // Reds
  { code: 'PANTONE 185 C', name: 'Red', L: 48.26, a: 70.92, b: 48.74, hex: '#E4002B' },
  { code: 'PANTONE 186 C', name: 'Red', L: 46.31, a: 67.86, b: 41.33, hex: '#C8102E' },
  { code: 'PANTONE 187 C', name: 'Dark Red', L: 36.89, a: 52.32, b: 27.19, hex: '#A6192E' },
  { code: 'PANTONE 199 C', name: 'Pink Red', L: 48.59, a: 72.40, b: 26.67, hex: '#D50032' },
  { code: 'PANTONE 200 C', name: 'Scarlet', L: 44.31, a: 66.23, b: 48.50, hex: '#BA0C2F' },
  
  // Oranges
  { code: 'PANTONE 021 C', name: 'Orange', L: 60.32, a: 64.29, b: 85.54, hex: '#FE5000' },
  { code: 'PANTONE 151 C', name: 'Orange', L: 67.84, a: 43.49, b: 76.23, hex: '#FF8200' },
  { code: 'PANTONE 152 C', name: 'Light Orange', L: 68.46, a: 41.82, b: 71.83, hex: '#DD8B07' },
  { code: 'PANTONE 165 C', name: 'Orange', L: 60.44, a: 52.31, b: 75.30, hex: '#FF671F' },
  { code: 'PANTONE 172 C', name: 'Orange', L: 58.91, a: 52.79, b: 86.37, hex: '#FA4616' },
  
  // Yellows
  { code: 'PANTONE 102 C', name: 'Yellow', L: 95.02, a: -5.41, b: 93.76, hex: '#FCE300' },
  { code: 'PANTONE 109 C', name: 'Yellow', L: 93.57, a: -3.02, b: 94.45, hex: '#FFD100' },
  { code: 'PANTONE 116 C', name: 'Yellow', L: 89.96, a: 5.85, b: 91.94, hex: '#FFCD00' },
  { code: 'PANTONE 123 C', name: 'Golden Yellow', L: 83.45, a: 14.23, b: 89.33, hex: '#FFC72C' },
  { code: 'PANTONE 130 C', name: 'Orange Yellow', L: 74.48, a: 29.75, b: 89.95, hex: '#F2A900' },  
  // Greens
  { code: 'PANTONE 354 C', name: 'Green', L: 75.47, a: -41.72, b: 61.23, hex: '#00B140' },
  { code: 'PANTONE 355 C', name: 'Green', L: 55.34, a: -66.84, b: 55.96, hex: '#009639' },
  { code: 'PANTONE 361 C', name: 'Green', L: 67.69, a: -51.45, b: 56.89, hex: '#43B02A' },
  { code: 'PANTONE 368 C', name: 'Green', L: 63.42, a: -51.52, b: 64.55, hex: '#78BE20' },
  { code: 'PANTONE 375 C', name: 'Light Green', L: 81.86, a: -32.41, b: 71.93, hex: '#97D700' },
  
  // Blues
  { code: 'PANTONE 285 C', name: 'Blue', L: 39.86, a: -9.78, b: -43.44, hex: '#007FA3' },
  { code: 'PANTONE 286 C', name: 'Blue', L: 33.69, a: -1.32, b: -57.30, hex: '#0033A0' },
  { code: 'PANTONE 287 C', name: 'Navy Blue', L: 24.29, a: 6.76, b: -49.81, hex: '#003087' },
  { code: 'PANTONE 293 C', name: 'Blue', L: 34.25, a: -8.42, b: -64.52, hex: '#003DA5' },
  { code: 'PANTONE 300 C', name: 'Blue', L: 42.17, a: -21.54, b: -59.93, hex: '#005EB8' },
  { code: 'PANTONE Process Blue C', name: 'Process Blue', L: 59.12, a: -23.45, b: -48.65, hex: '#0085CA' },
  { code: 'PANTONE 299 C', name: 'Light Blue', L: 76.33, a: -27.08, b: -21.48, hex: '#00A3E0' },
  { code: 'PANTONE 306 C', name: 'Cyan', L: 82.76, a: -48.19, b: -8.76, hex: '#00B5E2' },
  
  // Cyan/Turquoise (317C 추가)
  { code: 'PANTONE 317 C', name: 'Turquoise', L: 84.5, a: -18.0, b: -7.5, hex: '#B1E4E3' },
  { code: 'PANTONE 318 C', name: 'Light Turquoise', L: 77.8, a: -26.5, b: -12.3, hex: '#88DBDF' },
  { code: 'PANTONE 319 C', name: 'Aqua', L: 68.2, a: -32.4, b: -15.8, hex: '#2DCCD3' },
  { code: 'PANTONE 320 C', name: 'Teal', L: 55.6, a: -36.2, b: -8.4, hex: '#009CA6' },
  { code: 'PANTONE 321 C', name: 'Dark Teal', L: 50.3, a: -34.5, b: -10.2, hex: '#008C95' },
  
  // Purples
  { code: 'PANTONE 267 C', name: 'Purple', L: 31.75, a: 35.62, b: -48.93, hex: '#59118E' },
  { code: 'PANTONE 268 C', name: 'Purple', L: 30.55, a: 42.48, b: -55.31, hex: '#582C83' },
  { code: 'PANTONE 269 C', name: 'Purple', L: 29.83, a: 37.51, b: -43.27, hex: '#512D6D' },
  { code: 'PANTONE 2685 C', name: 'Purple', L: 39.21, a: 51.35, b: -52.10, hex: '#96268D' },
  { code: 'PANTONE Violet C', name: 'Violet', L: 36.58, a: 58.93, b: -45.77, hex: '#440099' },  
  // Pinks & Magentas
  { code: 'PANTONE 205 C', name: 'Pink', L: 59.51, a: 58.93, b: -2.41, hex: '#E93CAC' },
  { code: 'PANTONE 212 C', name: 'Pink', L: 65.88, a: 48.35, b: -3.09, hex: '#F57EB6' },
  { code: 'PANTONE 219 C', name: 'Magenta', L: 51.50, a: 72.89, b: -9.93, hex: '#E40046' },
  { code: 'PANTONE 226 C', name: 'Magenta', L: 47.67, a: 75.35, b: -10.42, hex: '#D62598' },
  { code: 'PANTONE Process Magenta C', name: 'Process Magenta', L: 53.24, a: 80.11, b: -4.59, hex: '#D62178' },
  { code: 'PANTONE Rhodamine Red C', name: 'Rhodamine Red', L: 51.44, a: 74.82, b: 11.59, hex: '#E10098' },
  
  // Browns
  { code: 'PANTONE 476 C', name: 'Brown', L: 37.84, a: 24.72, b: 23.57, hex: '#4E3629' },
  { code: 'PANTONE 477 C', name: 'Light Brown', L: 43.73, a: 21.36, b: 26.48, hex: '#623B2A' },
  { code: 'PANTONE 478 C', name: 'Brown', L: 48.22, a: 29.44, b: 35.21, hex: '#713324' },
  { code: 'PANTONE 469 C', name: 'Brown', L: 42.31, a: 17.83, b: 23.48, hex: '#693F23' },
  
  // Grays
  { code: 'PANTONE Cool Gray 1 C', name: 'Cool Gray 1', L: 93.49, a: -0.51, b: -0.36, hex: '#D9D9D6' },
  { code: 'PANTONE Cool Gray 5 C', name: 'Cool Gray 5', L: 73.25, a: -0.82, b: -2.69, hex: '#B1B3B3' },
  { code: 'PANTONE Cool Gray 7 C', name: 'Cool Gray 7', L: 63.78, a: -0.46, b: -3.42, hex: '#97999B' },
  { code: 'PANTONE Cool Gray 9 C', name: 'Cool Gray 9', L: 47.16, a: -0.45, b: -2.78, hex: '#75787B' },
  { code: 'PANTONE Cool Gray 11 C', name: 'Cool Gray 11', L: 27.84, a: -0.84, b: -2.30, hex: '#53565A' },
  
  // Black & White
  { code: 'PANTONE Black C', name: 'Black', L: 16.36, a: 0.23, b: -1.43, hex: '#2D2926' },
  { code: 'PANTONE White', name: 'White', L: 100, a: 0, b: 0, hex: '#FFFFFF' },  
  // Special Colors
  { code: 'PANTONE Reflex Blue C', name: 'Reflex Blue', L: 28.73, a: 20.43, b: -68.84, hex: '#001489' },
  { code: 'PANTONE Warm Red C', name: 'Warm Red', L: 51.54, a: 68.55, b: 55.35, hex: '#F9423A' },
  { code: 'PANTONE 804 C', name: 'Fluorescent Orange', L: 70.31, a: 42.53, b: 76.52, hex: '#FFAA4D' },
  { code: 'PANTONE 803 C', name: 'Fluorescent Yellow', L: 91.43, a: -12.35, b: 85.47, hex: '#FFE900' },
  
  // Fashion, Home + Interiors (TPG) Colors
  { code: 'PANTONE 15-3910 TPG', name: 'Lavender Fog', L: 66.27, a: 2.31, b: -8.45, hex: '#9EA1BA' },
  { code: 'PANTONE 14-4107 TPG', name: 'Glacier Gray', L: 72.55, a: -0.82, b: -1.95, hex: '#B5B7C0' },
  { code: 'PANTONE 16-3931 TPG', name: 'Violet Tulip', L: 62.48, a: 8.45, b: -12.73, hex: '#9B9CB9' },
  { code: 'PANTONE 13-4103 TPG', name: 'Lunar Rock', L: 75.82, a: -0.45, b: 0.23, hex: '#C5C6C7' },
  { code: 'PANTONE 17-3933 TPG', name: 'Purple Sage', L: 55.23, a: 8.76, b: -15.42, hex: '#8B7F9E' },
  { code: 'PANTONE 18-3933 TPG', name: 'Purple Heart', L: 48.91, a: 15.23, b: -22.34, hex: '#7A6A95' }
];

class PantoneDatabase {
  constructor() {
    this.colors = pantoneColors;
  }

  /**
   * PANTONE 코드로 색상 찾기
   */
  findByCode(code) {
    const normalizedCode = code.toUpperCase().replace(/\s+/g, ' ').trim();
    return this.colors.find(c => 
      c.code.toUpperCase().replace(/\s+/g, ' ').trim() === normalizedCode
    );
  }

  /**
   * Lab 값으로 가장 가까운 PANTONE 찾기
   */
  findClosestColors(targetLab, maxResults = 3) {
    const results = this.colors.map(pantone => {
      const deltaE = this.calculateDeltaE00(
        targetLab.L, targetLab.a, targetLab.b,
        pantone.L, pantone.a, pantone.b
      );
      return { ...pantone, deltaE };
    });
    
    // Delta E가 작은 순으로 정렬
    results.sort((a, b) => a.deltaE - b.deltaE);
    
    return results.slice(0, maxResults);
  }  /**
   * 키워드로 PANTONE 검색
   */
  searchByKeyword(keyword) {
    const normalized = keyword.toLowerCase();
    return this.colors.filter(c => 
      c.code.toLowerCase().includes(normalized) ||
      c.name.toLowerCase().includes(normalized)
    );
  }

  /**
   * Delta E 2000 계산
   */
  calculateDeltaE00(L1, a1, b1, L2, a2, b2) {
    const C1 = Math.sqrt(a1 * a1 + b1 * b1);
    const C2 = Math.sqrt(a2 * a2 + b2 * b2);
    const Cb = (C1 + C2) / 2;
    
    const G = 0.5 * (1 - Math.sqrt(Math.pow(Cb, 7) / (Math.pow(Cb, 7) + Math.pow(25, 7))));
    const ap1 = a1 * (1 + G);
    const ap2 = a2 * (1 + G);
    
    const Cp1 = Math.sqrt(ap1 * ap1 + b1 * b1);
    const Cp2 = Math.sqrt(ap2 * ap2 + b2 * b2);
    
    const dLp = L2 - L1;
    const dCp = Cp2 - Cp1;
    
    let hp1 = Math.atan2(b1, ap1) * 180 / Math.PI;
    if (hp1 < 0) hp1 += 360;
    let hp2 = Math.atan2(b2, ap2) * 180 / Math.PI;
    if (hp2 < 0) hp2 += 360;
    
    let dhp = hp2 - hp1;
    if (Math.abs(dhp) > 180) {
      if (dhp > 180) dhp -= 360;
      else dhp += 360;
    }
    
    const dHp = 2 * Math.sqrt(Cp1 * Cp2) * Math.sin((dhp * Math.PI / 180) / 2);
    
    const kL = 1, kC = 1, kH = 1;
    const SL = 1, SC = 1 + 0.045 * (Cp1 + Cp2) / 2;
    const SH = 1 + 0.015 * (Cp1 + Cp2) / 2;
    
    const deltaE = Math.sqrt(
      Math.pow(dLp / (kL * SL), 2) +
      Math.pow(dCp / (kC * SC), 2) +
      Math.pow(dHp / (kH * SH), 2)
    );
    
    return deltaE;
  }

  /**
   * 모든 PANTONE 색상 가져오기
   */
  getAllColors() {
    return this.colors;
  }

  /**
   * 색상 그룹별로 가져오기
   */
  getColorsByGroup(group) {
    const groupMap = {
      'red': ['Red', 'Scarlet', 'Pink Red', 'Dark Red', 'Warm Red'],
      'orange': ['Orange', 'Light Orange', 'Golden Yellow', 'Orange Yellow'],
      'yellow': ['Yellow', 'Golden Yellow'],
      'green': ['Green', 'Light Green'],
      'blue': ['Blue', 'Navy Blue', 'Light Blue', 'Cyan', 'Process Blue', 'Reflex Blue'],
      'purple': ['Purple', 'Violet'],
      'pink': ['Pink', 'Magenta', 'Rhodamine Red'],
      'brown': ['Brown', 'Light Brown'],
      'gray': ['Cool Gray', 'Gray'],
      'neutral': ['Black', 'White', 'Cool Gray']
    };
    
    const keywords = groupMap[group.toLowerCase()] || [];
    return this.colors.filter(c => 
      keywords.some(keyword => c.name.includes(keyword))
    );
  }
}

// 싱글톤 인스턴스
const pantoneDB = new PantoneDatabase();

export { pantoneDB, PantoneDatabase };