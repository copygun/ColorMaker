/**
 * Manufacturer-specific Ink Database
 * 제조사별 잉크 데이터베이스
 * 
 * 각 제조사마다 동일한 색상명이라도 Lab 값이 다를 수 있음
 * 측정 기준: D50/2° (인쇄 표준)
 */

// 제조사 목록
export const manufacturers = [
  { id: 'dainippon', name: 'DIC (Dainippon Ink)', country: 'Japan' },
  { id: 'toyo', name: 'Toyo Ink', country: 'Japan' },
  { id: 'flint', name: 'Flint Group', country: 'Germany' },
  { id: 'hubergroup', name: 'Huber Group', country: 'Germany' },
  { id: 'siegwerk', name: 'Siegwerk', country: 'Germany' },
  { id: 'sunchemical', name: 'Sun Chemical', country: 'USA' },
  { id: 'inxinternational', name: 'INX International', country: 'USA' },
  { id: 'sakata', name: 'Sakata INX', country: 'Japan' },
  { id: 'tpink', name: 'T&K TOKA', country: 'Japan' },
  { id: 'koreapmc', name: 'Korea PMC', country: 'Korea' },
  { id: 'custom', name: '사용자 정의', country: 'Custom' }
];

// 제조사별 잉크 데이터
export const manufacturerInks = {
  // DIC (Dainippon Ink) - 일본
  dainippon: {
    manufacturer: 'DIC (Dainippon Ink)',
    series: 'DIC Color Guide',
    inks: [
      {
        id: 'dic_cyan',
        name: 'Cyan (DIC)',
        code: 'Process Cyan',
        type: 'process',
        concentrations: {
          100: { L: 54.8, a: -36.5, b: -49.8 },
          70: { L: 67.5, a: -25.5, b: -34.8 },
          40: { L: 77.8, a: -14.6, b: -19.9 }
        }
      },
      {
        id: 'dic_magenta',
        name: 'Magenta (DIC)',
        code: 'Process Magenta',
        type: 'process',
        concentrations: {
          100: { L: 47.5, a: 73.8, b: -3.5 },
          70: { L: 61.5, a: 51.6, b: -2.4 },
          40: { L: 73.6, a: 29.5, b: -1.4 }
        }
      },
      {
        id: 'dic_yellow',
        name: 'Yellow (DIC)',
        code: 'Process Yellow',
        type: 'process',
        concentrations: {
          100: { L: 88.5, a: -5.2, b: 92.5 },
          70: { L: 90.5, a: -3.6, b: 64.7 },
          40: { L: 92.5, a: -2.1, b: 36.9 }
        }
      },
      {
        id: 'dic_black',
        name: 'Black (DIC)',
        code: 'Process Black',
        type: 'process',
        concentrations: {
          100: { L: 16.2, a: 0.1, b: -0.2 },
          70: { L: 34.8, a: 0.1, b: -0.1 },
          40: { L: 54.5, a: 0, b: 0 }
        }
      }
    ]
  },

  // Toyo Ink - 일본
  toyo: {
    manufacturer: 'Toyo Ink',
    series: 'Toyo Color Finder',
    inks: [
      {
        id: 'toyo_cyan',
        name: 'Cyan (Toyo)',
        code: 'CF Cyan',
        type: 'process',
        concentrations: {
          100: { L: 55.2, a: -37.2, b: -50.3 },
          70: { L: 68.1, a: -26.0, b: -35.2 },
          40: { L: 78.2, a: -14.9, b: -20.1 }
        }
      },
      {
        id: 'toyo_magenta',
        name: 'Magenta (Toyo)',
        code: 'CF Magenta',
        type: 'process',
        concentrations: {
          100: { L: 48.2, a: 74.5, b: -2.8 },
          70: { L: 62.1, a: 52.1, b: -2.0 },
          40: { L: 74.1, a: 29.8, b: -1.1 }
        }
      },
      {
        id: 'toyo_yellow',
        name: 'Yellow (Toyo)',
        code: 'CF Yellow',
        type: 'process',
        concentrations: {
          100: { L: 89.2, a: -4.8, b: 93.2 },
          70: { L: 91.1, a: -3.4, b: 65.2 },
          40: { L: 93.1, a: -1.9, b: 37.3 }
        }
      },
      {
        id: 'toyo_black',
        name: 'Black (Toyo)',
        code: 'CF Black',
        type: 'process',
        concentrations: {
          100: { L: 15.8, a: 0, b: -0.3 },
          70: { L: 35.2, a: 0, b: -0.2 },
          40: { L: 55.1, a: 0, b: -0.1 }
        }
      }
    ]
  },

  // Sun Chemical - USA
  sunchemical: {
    manufacturer: 'Sun Chemical',
    series: 'SunColor',
    inks: [
      {
        id: 'sun_cyan',
        name: 'Cyan (Sun)',
        code: 'SUN Cyan',
        type: 'process',
        concentrations: {
          100: { L: 55.5, a: -36.8, b: -49.5 },
          70: { L: 68.3, a: -25.7, b: -34.6 },
          40: { L: 78.5, a: -14.7, b: -19.8 }
        }
      },
      {
        id: 'sun_magenta',
        name: 'Magenta (Sun)',
        code: 'SUN Magenta',
        type: 'process',
        concentrations: {
          100: { L: 47.8, a: 73.5, b: -3.2 },
          70: { L: 61.8, a: 51.4, b: -2.2 },
          40: { L: 73.8, a: 29.4, b: -1.3 }
        }
      },
      {
        id: 'sun_yellow',
        name: 'Yellow (Sun)',
        code: 'SUN Yellow',
        type: 'process',
        concentrations: {
          100: { L: 88.8, a: -5.5, b: 92.8 },
          70: { L: 90.8, a: -3.8, b: 64.9 },
          40: { L: 92.8, a: -2.2, b: 37.1 }
        }
      },
      {
        id: 'sun_black',
        name: 'Black (Sun)',
        code: 'SUN Black',
        type: 'process',
        concentrations: {
          100: { L: 16.5, a: 0.2, b: 0 },
          70: { L: 35.5, a: 0.1, b: 0 },
          40: { L: 54.8, a: 0, b: 0 }
        }
      }
    ]
  },

  // Korea PMC - 한국
  koreapmc: {
    manufacturer: 'Korea PMC',
    series: 'K-Color',
    inks: [
      {
        id: 'kpmc_cyan',
        name: 'Cyan (K-PMC)',
        code: 'K-Cyan',
        type: 'process',
        concentrations: {
          100: { L: 54.5, a: -36.2, b: -49.2 },
          70: { L: 67.8, a: -25.3, b: -34.4 },
          40: { L: 78.0, a: -14.5, b: -19.7 }
        }
      },
      {
        id: 'kpmc_magenta',
        name: 'Magenta (K-PMC)',
        code: 'K-Magenta',
        type: 'process',
        concentrations: {
          100: { L: 47.2, a: 73.2, b: -3.8 },
          70: { L: 61.2, a: 51.2, b: -2.7 },
          40: { L: 73.2, a: 29.3, b: -1.5 }
        }
      },
      {
        id: 'kpmc_yellow',
        name: 'Yellow (K-PMC)',
        code: 'K-Yellow',
        type: 'process',
        concentrations: {
          100: { L: 88.2, a: -5.8, b: 92.2 },
          70: { L: 90.2, a: -4.1, b: 64.5 },
          40: { L: 92.2, a: -2.3, b: 36.8 }
        }
      },
      {
        id: 'kpmc_black',
        name: 'Black (K-PMC)',
        code: 'K-Black',
        type: 'process',
        concentrations: {
          100: { L: 16.8, a: 0.3, b: 0.1 },
          70: { L: 35.8, a: 0.2, b: 0.1 },
          40: { L: 55.3, a: 0.1, b: 0 }
        }
      }
    ]
  },

  // 사용자 정의 제조사
  custom: {
    manufacturer: '사용자 정의',
    series: 'Custom',
    inks: []
  }
};

// 제조사별 잉크 데이터베이스 클래스
export class ManufacturerInkDatabase {
  constructor() {
    this.manufacturers = manufacturers;
    this.inkData = manufacturerInks;
    this.currentManufacturer = 'dainippon'; // 기본값: DIC
    this.loadCustomData();
  }

  // 현재 제조사 설정
  setManufacturer(manufacturerId) {
    if (this.inkData[manufacturerId]) {
      this.currentManufacturer = manufacturerId;
      return true;
    }
    return false;
  }

  // 현재 제조사 가져오기
  getCurrentManufacturer() {
    return {
      id: this.currentManufacturer,
      ...this.manufacturers.find(m => m.id === this.currentManufacturer),
      data: this.inkData[this.currentManufacturer]
    };
  }

  // 특정 제조사의 잉크 목록 가져오기
  getInksByManufacturer(manufacturerId) {
    return this.inkData[manufacturerId]?.inks || [];
  }

  // 현재 제조사의 잉크 목록 가져오기
  getCurrentInks() {
    return this.getInksByManufacturer(this.currentManufacturer);
  }

  // 사용자 정의 잉크 추가
  addCustomInk(inkData) {
    if (!this.inkData.custom.inks) {
      this.inkData.custom.inks = [];
    }
    
    const newInk = {
      id: `custom_${Date.now()}`,
      ...inkData,
      type: inkData.type || 'custom'
    };
    
    this.inkData.custom.inks.push(newInk);
    this.saveCustomData();
    return newInk;
  }

  // 사용자 정의 잉크 수정
  updateCustomInk(inkId, updatedData) {
    const index = this.inkData.custom.inks.findIndex(ink => ink.id === inkId);
    if (index !== -1) {
      this.inkData.custom.inks[index] = {
        ...this.inkData.custom.inks[index],
        ...updatedData
      };
      this.saveCustomData();
      return true;
    }
    return false;
  }

  // 사용자 정의 잉크 삭제
  deleteCustomInk(inkId) {
    const index = this.inkData.custom.inks.findIndex(ink => ink.id === inkId);
    if (index !== -1) {
      this.inkData.custom.inks.splice(index, 1);
      this.saveCustomData();
      return true;
    }
    return false;
  }

  // 사용자 정의 데이터 저장
  saveCustomData() {
    try {
      localStorage.setItem('customInkData', JSON.stringify(this.inkData.custom.inks));
    } catch (e) {
      console.error('Failed to save custom ink data:', e);
    }
  }

  // 사용자 정의 데이터 로드
  loadCustomData() {
    try {
      const saved = localStorage.getItem('customInkData');
      if (saved) {
        this.inkData.custom.inks = JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed to load custom ink data:', e);
      this.inkData.custom.inks = [];
    }
  }

  // 모든 제조사의 특정 색상 비교
  compareInkAcrossManufacturers(inkType = 'cyan') {
    const comparison = [];
    
    for (const [manufacturerId, data] of Object.entries(this.inkData)) {
      const ink = data.inks?.find(i => 
        i.name.toLowerCase().includes(inkType.toLowerCase()) || 
        i.id.includes(inkType.toLowerCase())
      );
      
      if (ink) {
        comparison.push({
          manufacturer: data.manufacturer,
          series: data.series,
          ink: ink
        });
      }
    }
    
    return comparison;
  }
}

// 싱글톤 인스턴스
const manufacturerDB = new ManufacturerInkDatabase();
export default manufacturerDB;