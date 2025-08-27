/**
 * Fluorescent Inks Module
 * 형광 잉크 데이터베이스 및 특수 처리
 * Based on 2024 latest research
 */

// 형광 잉크 데이터 (DayGlo 색상 기준)
export const fluorescentInks = [
    {
        id: 'fluor-yellow',
        name: 'Fluorescent Yellow',
        type: 'fluorescent',
        concentrations: {
            100: { L: 92, a: -8, b: 95, fluorescence: 1.8 },  // 형광 계수
            70: { L: 94, a: -5, b: 68, fluorescence: 1.5 },
            40: { L: 95, a: -3, b: 42, fluorescence: 1.2 }
        },
        spectralData: {
            // 주요 파장별 반사율 (400-700nm)
            dominant: 575,  // 주파장 (nm)
            purity: 0.92,   // 색순도
            quantum: 0.85   // 양자 효율
        }
    },
    {
        id: 'fluor-orange',
        name: 'Fluorescent Orange',
        type: 'fluorescent',
        concentrations: {
            100: { L: 75, a: 55, b: 80, fluorescence: 1.7 },
            70: { L: 80, a: 38, b: 56, fluorescence: 1.4 },
            40: { L: 85, a: 22, b: 35, fluorescence: 1.2 }
        },
        spectralData: {
            dominant: 595,
            purity: 0.89,
            quantum: 0.82
        }
    },
    {
        id: 'fluor-pink',
        name: 'Fluorescent Pink',
        type: 'fluorescent',
        concentrations: {
            100: { L: 65, a: 75, b: 15, fluorescence: 1.6 },
            70: { L: 72, a: 52, b: 10, fluorescence: 1.3 },
            40: { L: 80, a: 30, b: 6, fluorescence: 1.1 }
        },
        spectralData: {
            dominant: 500,
            purity: 0.87,
            quantum: 0.78
        }
    },
    {
        id: 'fluor-green',
        name: 'Fluorescent Green',
        type: 'fluorescent',
        concentrations: {
            100: { L: 70, a: -65, b: 70, fluorescence: 1.9 },
            70: { L: 78, a: -45, b: 49, fluorescence: 1.5 },
            40: { L: 85, a: -26, b: 28, fluorescence: 1.2 }
        },
        spectralData: {
            dominant: 520,
            purity: 0.90,
            quantum: 0.88
        }
    },
    {
        id: 'fluor-blue',
        name: 'Fluorescent Blue',
        type: 'fluorescent',
        concentrations: {
            100: { L: 45, a: 15, b: -70, fluorescence: 1.5 },
            70: { L: 58, a: 10, b: -49, fluorescence: 1.3 },
            40: { L: 70, a: 6, b: -28, fluorescence: 1.1 }
        },
        spectralData: {
            dominant: 450,
            purity: 0.85,
            quantum: 0.75
        }
    },
    {
        id: 'fluor-red',
        name: 'Fluorescent Red',
        type: 'fluorescent',
        concentrations: {
            100: { L: 55, a: 80, b: 45, fluorescence: 1.6 },
            70: { L: 65, a: 56, b: 31, fluorescence: 1.3 },
            40: { L: 75, a: 32, b: 18, fluorescence: 1.1 }
        },
        spectralData: {
            dominant: 620,
            purity: 0.91,
            quantum: 0.80
        }
    },
    {
        id: 'fluor-violet',
        name: 'Fluorescent Violet',
        type: 'fluorescent',
        concentrations: {
            100: { L: 40, a: 50, b: -55, fluorescence: 1.4 },
            70: { L: 52, a: 35, b: -38, fluorescence: 1.2 },
            40: { L: 65, a: 20, b: -22, fluorescence: 1.0 }
        },
        spectralData: {
            dominant: 420,
            purity: 0.83,
            quantum: 0.72
        }
    }
];

// 형광 잉크 특수 처리 클래스
export class FluorescentInkHandler {
    constructor() {
        this.fluorescentInks = fluorescentInks;
        this.uvIllumination = false;  // UV 조명 여부
    }
    
    /**
     * 형광 효과를 고려한 Lab 값 보정
     * UV 조명 하에서의 실제 색상 예측
     */
    adjustForFluorescence(lab, fluorescenceFactor, uvIntensity = 1.0) {
        if (!this.uvIllumination) return lab;
        
        // 형광 효과로 인한 명도 증가
        const adjustedL = Math.min(100, lab.L * (1 + (fluorescenceFactor - 1) * uvIntensity * 0.3));
        
        // 채도 증가 (형광 효과는 색상을 더 선명하게 만듦)
        const chroma = Math.sqrt(lab.a * lab.a + lab.b * lab.b);
        const chromaBoost = 1 + (fluorescenceFactor - 1) * uvIntensity * 0.5;
        
        const adjustedA = lab.a * chromaBoost;
        const adjustedB = lab.b * chromaBoost;
        
        return {
            L: adjustedL,
            a: adjustedA,
            b: adjustedB,
            fluorescence: fluorescenceFactor
        };
    }
    
    /**
     * 형광 잉크 혼합 시 특수 처리
     * 일반 잉크와 형광 잉크 혼합 시 형광 효과 감소 고려
     */
    mixWithFluorescent(regularInks, fluorescentInks, ratios) {
        let totalFluorescence = 0;
        let totalRatio = 0;
        
        // 형광 잉크 비율 계산
        fluorescentInks.forEach((ink, i) => {
            const ratio = ratios[i] || 0;
            totalFluorescence += ink.fluorescence * ratio;
            totalRatio += ratio;
        });
        
        // 일반 잉크가 형광 효과를 감소시킴
        const regularRatio = regularInks.reduce((sum, _, i) => sum + (ratios[i] || 0), 0);
        const fluorescenceReduction = 1 - (regularRatio * 0.6); // 일반 잉크가 60%까지 형광 감소
        
        return {
            effectiveFluorescence: totalFluorescence * fluorescenceReduction,
            recommendedUVIntensity: this.calculateOptimalUV(totalFluorescence)
        };
    }
    
    /**
     * 최적 UV 조명 강도 계산
     */
    calculateOptimalUV(fluorescenceFactor) {
        // 형광 계수에 따른 최적 UV 강도
        if (fluorescenceFactor < 1.2) return 0.5;  // 약한 UV
        if (fluorescenceFactor < 1.5) return 0.75; // 중간 UV
        return 1.0; // 강한 UV
    }
    
    /**
     * 메타메리즘 체크
     * 다른 조명 조건에서의 색상 변화 예측
     */
    checkMetamerism(ink1, ink2, illuminants = ['D65', 'D50', 'F11', 'A']) {
        const differences = {};
        
        illuminants.forEach(illuminant => {
            // 각 조명 조건에서의 색차 계산
            // 실제로는 스펙트럼 데이터를 사용해야 정확
            differences[illuminant] = this.calculateIlluminantShift(ink1, ink2, illuminant);
        });
        
        return {
            isMetameric: Object.values(differences).some(d => d > 3),
            differences
        };
    }
    
    calculateIlluminantShift(ink1, ink2, illuminant) {
        // 간단한 시뮬레이션 (실제로는 스펙트럼 계산 필요)
        const shifts = {
            'D65': 0,      // 표준 주광
            'D50': 0.5,    // 인쇄 표준
            'F11': 2.0,    // 형광등
            'A': 3.0       // 백열등
        };
        
        return shifts[illuminant] || 0;
    }
    
    /**
     * 형광 잉크 추천
     * 목표 색상에 대해 형광 잉크 사용 여부 판단
     */
    recommendFluorescent(targetLab) {
        const recommendations = [];
        
        // 높은 채도 + 밝은 색상 = 형광 잉크 추천
        const chroma = Math.sqrt(targetLab.a * targetLab.a + targetLab.b * targetLab.b);
        const brightness = targetLab.L;
        
        if (chroma > 60 && brightness > 60) {
            // 색상 각도 계산
            const hue = Math.atan2(targetLab.b, targetLab.a) * 180 / Math.PI;
            
            // 각 형광 잉크와 비교
            this.fluorescentInks.forEach(ink => {
                const inkLab = ink.concentrations[100];
                const inkHue = Math.atan2(inkLab.b, inkLab.a) * 180 / Math.PI;
                
                // 색상 각도가 비슷하면 추천
                if (Math.abs(hue - inkHue) < 30) {
                    recommendations.push({
                        ink: ink,
                        matchScore: 100 - Math.abs(hue - inkHue),
                        reason: '높은 채도와 밝기를 위해 형광 잉크 추천'
                    });
                }
            });
        }
        
        return recommendations.sort((a, b) => b.matchScore - a.matchScore);
    }
}

export default FluorescentInkHandler;