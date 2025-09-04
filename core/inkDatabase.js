/**
 * Ink Database Module
 * 잉크 데이터베이스 및 관련 유틸리티
 * v3.0에서 추출 및 확장
 */

// 베이스 잉크 데이터 (Satin 농도별 CIELAB 값 포함)
export const baseInks = [
    {
        id: 'cyan',
        name: 'Cyan',
        type: 'process',
        concentrations: {
            100: { L: 55, a: -37, b: -50 },
            70: { L: 68, a: -26, b: -35 },  // Satin 70%
            40: { L: 78, a: -15, b: -20 }   // Satin 40%
        }
    },
    {
        id: 'magenta',
        name: 'Magenta',
        type: 'process',
        concentrations: {
            100: { L: 48, a: 74, b: -3 },
            70: { L: 62, a: 52, b: -2 },
            40: { L: 74, a: 30, b: -1 }
        }
    },
    {
        id: 'yellow',
        name: 'Yellow',
        type: 'process',
        concentrations: {
            100: { L: 89, a: -5, b: 93 },
            70: { L: 91, a: -3.5, b: 65 },
            40: { L: 93, a: -2, b: 37 }
        }
    },
    {
        id: 'black',
        name: 'Black',
        type: 'process',
        concentrations: {
            100: { L: 16, a: 0, b: 0 },
            70: { L: 35, a: 0, b: 0 },
            40: { L: 55, a: 0, b: 0 }
        }
    },
    {
        id: 'white',
        name: 'White',
        type: 'process',
        concentrations: {
            100: { L: 95, a: 0, b: 0 },
            70: { L: 95, a: 0, b: 0 },
            40: { L: 95, a: 0, b: 0 }
        }
    },
    {
        id: 'orange',
        name: 'Orange',
        type: 'spot',
        concentrations: {
            100: { L: 60, a: 50, b: 60 },
            70: { L: 70, a: 35, b: 42 },
            40: { L: 78, a: 20, b: 24 }
        }
    },
    {
        id: 'green',
        name: 'Green',
        type: 'spot',
        concentrations: {
            100: { L: 50, a: -40, b: 30 },
            70: { L: 63, a: -28, b: 21 },
            40: { L: 73, a: -16, b: 12 }
        }
    },
    {
        id: 'violet',
        name: 'Violet',
        type: 'spot',
        concentrations: {
            100: { L: 30, a: 40, b: -40 },
            70: { L: 45, a: 28, b: -28 },
            40: { L: 58, a: 16, b: -16 }
        }
    },
    {
        id: 'red',
        name: 'Red',
        type: 'spot',
        concentrations: {
            100: { L: 45, a: 70, b: 35 },
            70: { L: 58, a: 49, b: 24.5 },
            40: { L: 68, a: 28, b: 14 }
        }
    },
    {
        id: 'blue',
        name: 'Blue',
        type: 'spot',
        concentrations: {
            100: { L: 30, a: 20, b: -60 },
            70: { L: 45, a: 14, b: -42 },
            40: { L: 58, a: 8, b: -24 }
        }
    },
    {
        id: 'medium',
        name: 'MEDIUM (투명 베이스)',
        type: 'medium',
        concentrations: {
            100: { L: 96, a: 0, b: 0 },  // 거의 무색투명
            70: { L: 96, a: 0, b: 0 },
            40: { L: 96, a: 0, b: 0 }
        },
        // MEDIUM의 특수 속성
        properties: {
            opacity: 0.05,  // 매우 낮은 불투명도
            dilution: true,  // 희석 효과
            gloss: 1.2,      // 광택 증가
            viscosity: 0.8,  // 점도 감소
            coverage: 0.1    // 매우 낮은 커버력
        }
    },
    {
        id: 'turquoise',
        name: 'Turquoise',
        type: 'spot',
        concentrations: {
            100: { L: 45, a: -48, b: -25 },
            70: { L: 60, a: -34, b: -18 },
            40: { L: 72, a: -19, b: -10 }
        }
    },
    {
        id: 'teal',
        name: 'Teal',
        type: 'spot',
        concentrations: {
            100: { L: 42, a: -45, b: 15 },
            70: { L: 58, a: -32, b: 10 },
            40: { L: 70, a: -18, b: 6 }
        }
    },
    {
        id: 'bright-green',
        name: 'Bright Green',
        type: 'spot',
        concentrations: {
            100: { L: 65, a: -55, b: 45 },
            70: { L: 74, a: -39, b: 32 },
            40: { L: 82, a: -22, b: 18 }
        }
    },
    {
        id: 'lime',
        name: 'Lime',
        type: 'spot',
        concentrations: {
            100: { L: 75, a: -45, b: 60 },
            70: { L: 82, a: -32, b: 42 },
            40: { L: 88, a: -18, b: 24 }
        }
    },
    // 형광 잉크 추가
    {
        id: 'fluorescent-yellow',
        name: 'Fluorescent Yellow',
        type: 'fluorescent',
        concentrations: {
            100: { L: 92, a: -10, b: 95 },  // 매우 밝은 노랑
            70: { L: 93, a: -7, b: 67 },
            40: { L: 94, a: -4, b: 38 }
        }
    },
    {
        id: 'fluorescent-pink',
        name: 'Fluorescent Pink',
        type: 'fluorescent',
        concentrations: {
            100: { L: 65, a: 75, b: 15 },  // 밝은 핑크
            70: { L: 72, a: 53, b: 11 },
            40: { L: 78, a: 30, b: 6 }
        }
    },
    {
        id: 'fluorescent-orange',
        name: 'Fluorescent Orange',
        type: 'fluorescent',
        concentrations: {
            100: { L: 70, a: 55, b: 70 },  // 밝은 오렌지
            70: { L: 76, a: 39, b: 49 },
            40: { L: 82, a: 22, b: 28 }
        }
    },
    {
        id: 'fluorescent-green',
        name: 'Fluorescent Green',
        type: 'fluorescent',
        concentrations: {
            100: { L: 70, a: -50, b: 55 },  // 밝은 그린
            70: { L: 76, a: -35, b: 39 },
            40: { L: 82, a: -20, b: 22 }
        }
    },
    {
        id: 'fluorescent-blue',
        name: 'Fluorescent Blue',
        type: 'fluorescent',
        concentrations: {
            100: { L: 55, a: 10, b: -65 },  // 밝은 파랑
            70: { L: 64, a: 7, b: -46 },
            40: { L: 72, a: 4, b: -26 }
        }
    },
    // 추가 Spot 색상들 - 정확한 색상 매칭을 위해
    {
        id: 'warm-red',
        name: 'Warm Red',
        type: 'spot',
        concentrations: {
            100: { L: 50, a: 65, b: 45 },  // L:50에 가까운 따뜻한 빨강
            70: { L: 60, a: 46, b: 32 },
            40: { L: 70, a: 26, b: 18 }
        }
    },
    {
        id: 'scarlet',
        name: 'Scarlet',
        type: 'spot',
        concentrations: {
            100: { L: 52, a: 58, b: 48 },  // 목표 색상에 가까운 스칼렛
            70: { L: 62, a: 41, b: 34 },
            40: { L: 72, a: 23, b: 19 }
        }
    },
    {
        id: 'vermillion',
        name: 'Vermillion',
        type: 'spot',
        concentrations: {
            100: { L: 48, a: 55, b: 52 },  // 주홍색
            70: { L: 59, a: 39, b: 36 },
            40: { L: 69, a: 22, b: 21 }
        }
    },
    {
        id: 'coral',
        name: 'Coral',
        type: 'spot',
        concentrations: {
            100: { L: 55, a: 45, b: 40 },  // 코럴색
            70: { L: 65, a: 32, b: 28 },
            40: { L: 74, a: 18, b: 16 }
        }
    },
    {
        id: 'burnt-orange',
        name: 'Burnt Orange',
        type: 'spot',
        concentrations: {
            100: { L: 46, a: 48, b: 55 },  // 번트 오렌지
            70: { L: 58, a: 34, b: 39 },
            40: { L: 68, a: 19, b: 22 }
        }
    }
];

// 메탈릭 잉크 데이터 (v2.2 명세서용 확장)
export const metallicInks = [
    {
        id: 'silver',
        name: 'Silver',
        type: 'metallic',
        concentrations: {
            100: { L: 75, a: 0, b: 0, metallic: true },
            70: { L: 80, a: 0, b: 0, metallic: true },
            40: { L: 85, a: 0, b: 0, metallic: true }
        }
    },
    {
        id: 'gold',
        name: 'Gold',
        type: 'metallic',
        concentrations: {
            100: { L: 70, a: 5, b: 35, metallic: true },
            70: { L: 75, a: 3.5, b: 24.5, metallic: true },
            40: { L: 80, a: 2, b: 14, metallic: true }
        }
    },
    {
        id: 'bronze',
        name: 'Bronze',
        type: 'metallic',
        concentrations: {
            100: { L: 50, a: 15, b: 25, metallic: true },
            70: { L: 60, a: 10.5, b: 17.5, metallic: true },
            40: { L: 68, a: 6, b: 10, metallic: true }
        }
    }
];

// 미디엄 데이터
export const mediums = [
    {
        id: 'transparent',
        name: 'Transparent White',
        type: 'medium',
        Lab: { L: 95, a: 0, b: 0 },
        opacity: 0,
        viscosity: 'medium'
    },
    {
        id: 'extender',
        name: 'Extender',
        type: 'medium',
        Lab: { L: 90, a: 0, b: 0 },
        opacity: 0.1,
        viscosity: 'low'
    },
    {
        id: 'varnish',
        name: 'Varnish',
        type: 'medium',
        Lab: { L: 100, a: 0, b: 0 },
        opacity: 0,
        viscosity: 'high'
    }
];

// 프린터 프로파일
export const printerProfiles = [
    {
        id: 'offset',
        name: 'Offset Press',
        tacLimit: 320,
        dotGain: 15,
        inkLimit: {
            cyan: 100,
            magenta: 100,
            yellow: 100,
            black: 100,
            spot: 100
        }
    },
    {
        id: 'flexo',
        name: 'Flexo Press',
        tacLimit: 280,
        dotGain: 20,
        inkLimit: {
            cyan: 95,
            magenta: 95,
            yellow: 95,
            black: 90,
            spot: 95
        }
    },
    {
        id: 'digital',
        name: 'Digital Press',
        tacLimit: 300,
        dotGain: 10,
        inkLimit: {
            cyan: 100,
            magenta: 100,
            yellow: 100,
            black: 100,
            spot: 90
        }
    }
];

// 잉크 데이터 접근 유틸리티
export class InkDatabase {
    constructor() {
        this.baseInks = baseInks;
        this.metallicInks = metallicInks;
        this.mediums = mediums;
        this.printerProfiles = printerProfiles;
        this.customInks = [];
    }
    
    // ID로 잉크 찾기
    getInkById(id) {
        return this.baseInks.find(ink => ink.id === id) ||
               this.metallicInks.find(ink => ink.id === id) ||
               this.mediums.find(ink => ink.id === id) ||
               this.customInks.find(ink => ink.id === id);
    }
    
    // 농도별 CIELAB 값 가져오기
    getInkLab(inkId, concentration = 100) {
        const ink = this.getInkById(inkId);
        if (!ink) return null;
        
        // concentrations 속성이 있는 경우
        if (ink.concentrations) {
            const conc = ink.concentrations;
            if (conc[concentration]) {
                return conc[concentration];
            }
            // 보간이 필요한 경우
            return this.interpolateConcentration(ink, concentration);
        }
        
        // 단일 CIELAB 값만 있는 경우 (mediums)
        if (ink.Lab) {
            return ink.Lab;
        }
        
        // 기본값 반환
        console.warn(`Ink ${inkId} has no Lab values, using default`);
        return { L: 50, a: 0, b: 0 };
    }
    
    // 농도 보간 (선형)
    interpolateConcentration(ink, targetConc) {
        const concentrations = Object.keys(ink.concentrations)
            .map(c => parseInt(c))
            .sort((a, b) => a - b);
        
        // 범위 찾기
        let lower = concentrations[0];
        let upper = concentrations[concentrations.length - 1];
        
        for (let i = 0; i < concentrations.length - 1; i++) {
            if (targetConc >= concentrations[i] && targetConc <= concentrations[i + 1]) {
                lower = concentrations[i];
                upper = concentrations[i + 1];
                break;
            }
        }
        
        // 선형 보간
        const lowerLab = ink.concentrations[lower];
        const upperLab = ink.concentrations[upper];
        const ratio = (targetConc - lower) / (upper - lower);
        
        return {
            L: lowerLab.L + (upperLab.L - lowerLab.L) * ratio,
            a: lowerLab.a + (upperLab.a - lowerLab.a) * ratio,
            b: lowerLab.b + (upperLab.b - lowerLab.b) * ratio
        };
    }
    
    // 커스텀 잉크 추가
    addCustomInk(inkData) {
        const newInk = {
            ...inkData,
            id: `custom_${Date.now()}`,
            type: 'custom'
        };
        this.customInks.push(newInk);
        return newInk;
    }
    
    // 프로세스 잉크만 가져오기
    getProcessInks() {
        return this.baseInks.filter(ink => ink.type === 'process');
    }
    
    // 스팟 잉크만 가져오기
    getSpotInks() {
        return this.baseInks.filter(ink => ink.type === 'spot');
    }
    
    // 형광 잉크만 가져오기
    getFluorescentInks() {
        return this.baseInks.filter(ink => ink.type === 'fluorescent');
    }
    
    // TAC 계산
    calculateTAC(inkRatios, profileId = 'offset') {
        const profile = this.printerProfiles.find(p => p.id === profileId);
        if (!profile) return 0;
        
        let totalCoverage = 0;
        for (const [inkId, ratio] of Object.entries(inkRatios)) {
            totalCoverage += ratio;
        }
        
        return totalCoverage;
    }
    
    // TAC 제약 검증
    validateTAC(inkRatios, profileId = 'offset') {
        const profile = this.printerProfiles.find(p => p.id === profileId);
        if (!profile) return { valid: true, tac: 0, limit: 0 };
        
        const tac = this.calculateTAC(inkRatios, profileId);
        
        return {
            valid: tac <= profile.tacLimit,
            tac: tac,
            limit: profile.tacLimit,
            excess: Math.max(0, tac - profile.tacLimit)
        };
    }
    
    // 모든 잉크 목록 반환
    getAllInks() {
        return [...this.baseInks, ...this.metallicInks, ...this.mediums, ...this.customInks];
    }
    
    // 특정 잉크 정보 반환
    getInk(inkId) {
        const allInks = this.getAllInks();
        return allInks.find(ink => ink.id === inkId);
    }
    
    // 잉크 목록 ID만 반환
    getInkIds() {
        const allInks = this.getAllInks();
        return allInks.map(ink => ink.id);
    }
}

// Export singleton instance
export const inkDB = new InkDatabase();

export default inkDB;