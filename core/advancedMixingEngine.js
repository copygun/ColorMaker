/**
 * Advanced Mixing Engine Module
 * Kubelka-Munk 이론 기반 비선형 잉크 혼합 모델
 * 실제 인쇄 물리학을 반영한 정확한 색상 예측
 * MEDIUM 잉크 효과 반영
 */

import { ColorScience } from './colorScience.js';

/**
 * Kubelka-Munk Theory Implementation
 * K/S = (1-R)²/2R where:
 * K = absorption coefficient
 * S = scattering coefficient  
 * R = reflectance
 */
export class KubelkaMunkModel {
    constructor() {
        // 기질별 산란 계수 (substrate-specific)
        this.substrateScattering = {
            'coated': 0.85,      // 코팅지
            'uncoated': 0.95,    // 비코팅지
            'plastic': 0.75,     // 플라스틱 필름
            'metal': 0.65,       // 금속 표면
            'transparent': 0.55  // 투명 필름
        };
        
        // 잉크 타입별 투명도 계수
        this.inkOpacity = {
            'process': 0.85,     // CMYK 프로세스 잉크
            'spot': 0.95,        // 별색 잉크
            'metallic': 0.98,    // 메탈릭 잉크
            'fluorescent': 0.75, // 형광 잉크
            'transparent': 0.45  // 투명 잉크
        };
    }
    
    /**
     * Lab to Reflectance 변환
     */
    labToReflectance(L, a, b) {
        // Simplified conversion for demonstration
        // 실제로는 spectral data가 필요하지만, Lab에서 근사
        const Y = ((L + 16) / 116) ** 3 * 100;
        const reflectance = Y / 100; // 0-1 range
        
        // a*, b* 채널 영향 반영
        const chromaEffect = Math.sqrt(a*a + b*b) / 100;
        return Math.max(0.01, Math.min(0.99, reflectance - chromaEffect * 0.1));
    }
    
    /**
     * Reflectance to Lab 변환
     */
    reflectanceToLab(R, originalA, originalB) {
        // Y값 복원
        const Y = R * 100;
        const L = 116 * Math.cbrt(Y / 100) - 16;
        
        // a*, b* 값은 원래 색상 비율 유지
        return { L, a: originalA, b: originalB };
    }
    
    /**
     * K/S 계산
     */
    calculateKS(reflectance) {
        if (reflectance <= 0.01) reflectance = 0.01;
        if (reflectance >= 0.99) reflectance = 0.99;
        
        return (1 - reflectance) ** 2 / (2 * reflectance);
    }
    
    /**
     * K/S로부터 Reflectance 계산
     */
    ksToReflectance(ks) {
        // Quadratic formula solution
        const a = ks;
        const b = ks + 1;
        const reflectance = 1 + ks - Math.sqrt(ks * ks + 2 * ks);
        return Math.max(0.01, Math.min(0.99, reflectance));
    }
    
    /**
     * 비선형 잉크 혼합 (Kubelka-Munk)
     * @param {Array} inks - 잉크 배열 [{L, a, b, type}, ...]
     * @param {Array} concentrations - 농도 배열 [0-1]
     * @param {String} substrate - 기질 타입
     */
    mixInks(inks, concentrations, substrate = 'coated') {
        // MEDIUM 잉크 비율 계산
        let mediumRatio = 0;
        let colorInkRatios = [];
        let colorInks = [];
        
        for (let i = 0; i < inks.length; i++) {
            if (inks[i].type === 'medium' || inks[i].id === 'medium') {
                mediumRatio += concentrations[i] || 0;
            } else {
                colorInks.push(inks[i]);
                colorInkRatios.push(concentrations[i] || 0);
            }
        }
        
        // MEDIUM 효과 계산
        // MEDIUM이 많을수록: 색상 희석, 투명도 증가, 채도 감소
        const mediumEffect = {
            dilution: 1 - (mediumRatio * 0.7),  // 최대 70% 희석
            opacity: 1 - (mediumRatio * 0.6),    // 최대 60% 투명도 증가
            saturation: 1 - (mediumRatio * 0.5)  // 최대 50% 채도 감소
        };
        
        // 각 잉크의 K/S 계산
        const ksValues = [];
        let totalA = 0, totalB = 0;
        let totalConc = 0;
        
        for (let i = 0; i < colorInks.length; i++) {
            const ink = colorInks[i];
            const conc = (colorInkRatios[i] || 0) * mediumEffect.dilution;
            if (conc === 0) continue;
            
            // Reflectance 계산
            const R = this.labToReflectance(ink.L, ink.a, ink.b);
            
            // K/S 계산
            const ks = this.calculateKS(R);
            
            // 잉크 타입에 따른 불투명도 적용 (MEDIUM 효과 반영)
            const baseOpacity = this.inkOpacity[ink.type || 'spot'];
            const effectiveOpacity = baseOpacity * mediumEffect.opacity;
            
            // 농도에 따른 가중 K/S
            ksValues.push(ks * conc * effectiveOpacity);
            
            // a*, b* 가중 평균을 위한 누적 (MEDIUM의 채도 감소 효과)
            totalA += ink.a * conc * effectiveOpacity * mediumEffect.saturation;
            totalB += ink.b * conc * effectiveOpacity * mediumEffect.saturation;
            totalConc += conc * effectiveOpacity;
        }
        
        // MEDIUM 자체의 기여도 추가 (매우 작음)
        if (mediumRatio > 0) {
            const mediumKS = 0.01 * mediumRatio;  // 매우 작은 K/S 값
            ksValues.push(mediumKS);
        }
        
        // 기질 영향 반영
        const substrateEffect = this.substrateScattering[substrate] || 0.85;
        
        // 혼합 K/S 계산 (Kubelka-Munk additive mixing)
        let mixedKS = ksValues.reduce((sum, ks) => sum + ks, 0);
        mixedKS *= substrateEffect;
        
        // 혼합 Reflectance 계산
        const mixedR = this.ksToReflectance(mixedKS);
        
        // a*, b* 평균
        if (totalConc > 0) {
            totalA /= totalConc;
            totalB /= totalConc;
        }
        
        // Lab로 변환 (MEDIUM 효과로 L값 증가)
        const baseLab = this.reflectanceToLab(mixedR, totalA, totalB);
        
        // MEDIUM이 많을수록 L값 증가 (밝아짐)
        baseLab.L = baseLab.L + (mediumRatio * 15);  // 최대 15 단위 밝아짐
        baseLab.L = Math.min(100, baseLab.L);  // L값 상한
        
        return baseLab;
    }
}

/**
 * Dot Gain Compensation Model
 * 인쇄 시 망점 확대 현상 보정
 */
export class DotGainModel {
    constructor() {
        // 인쇄 방식별 dot gain curves
        this.dotGainCurves = {
            'offset': {
                10: 13, 20: 25, 30: 36, 40: 46,
                50: 56, 60: 66, 70: 76, 80: 86, 90: 95
            },
            'flexo': {
                10: 15, 20: 28, 30: 40, 40: 50,
                50: 60, 60: 70, 70: 80, 80: 88, 90: 96
            },
            'digital': {
                10: 11, 20: 22, 30: 33, 40: 44,
                50: 55, 60: 65, 70: 75, 80: 85, 90: 94
            }
        };
    }
    
    /**
     * Dot gain 보정 적용
     * @param {Number} targetDot - 목표 망점 크기 (0-100)
     * @param {String} printMethod - 인쇄 방식
     */
    compensateDotGain(targetDot, printMethod = 'offset') {
        const curve = this.dotGainCurves[printMethod];
        if (!curve) return targetDot;
        
        // 역보간으로 필요한 입력값 계산
        const keys = Object.keys(curve).map(Number).sort((a, b) => a - b);
        
        // 목표값에 가장 가까운 구간 찾기
        for (let i = 0; i < keys.length - 1; i++) {
            const x1 = keys[i];
            const x2 = keys[i + 1];
            const y1 = curve[x1];
            const y2 = curve[x2];
            
            if (targetDot >= y1 && targetDot <= y2) {
                // 선형 보간으로 필요한 입력값 계산
                const ratio = (targetDot - y1) / (y2 - y1);
                return x1 + (x2 - x1) * ratio;
            }
        }
        
        // 범위 밖
        if (targetDot < curve[keys[0]]) return keys[0] * targetDot / curve[keys[0]];
        if (targetDot > curve[keys[keys.length - 1]]) return 100;
        
        return targetDot;
    }
    
    /**
     * Lab 값에 dot gain 보정 적용
     */
    compensateLabForDotGain(lab, concentration, printMethod = 'offset') {
        // 농도를 dot percentage로 변환 (0-100)
        const dotPercentage = concentration * 100;
        
        // Dot gain 보정
        const compensatedDot = this.compensateDotGain(dotPercentage, printMethod);
        const compensationRatio = compensatedDot / dotPercentage;
        
        // L 값 조정 (dot gain으로 인한 어두워짐 보정)
        const compensatedL = lab.L + (100 - lab.L) * (1 - compensationRatio) * 0.1;
        
        return {
            L: compensatedL,
            a: lab.a * compensationRatio,
            b: lab.b * compensationRatio
        };
    }
}

/**
 * Substrate Effect Model
 * 기질 특성이 색상에 미치는 영향
 */
export class SubstrateModel {
    constructor() {
        this.substrateProfiles = {
            'white_coated': {
                baseL: 95, baseA: 0, baseB: -2,
                absorption: 0.15, opacity: 0.98
            },
            'white_uncoated': {
                baseL: 92, baseA: 0, baseB: 2,
                absorption: 0.25, opacity: 0.95
            },
            'kraft': {
                baseL: 70, baseA: 5, baseB: 15,
                absorption: 0.35, opacity: 0.90
            },
            'transparent': {
                baseL: 100, baseA: 0, baseB: 0,
                absorption: 0.05, opacity: 0.10
            },
            'metallic': {
                baseL: 85, baseA: -1, baseB: -1,
                absorption: 0.10, opacity: 0.99
            }
        };
    }
    
    /**
     * 기질 영향 적용
     */
    applySubstrateEffect(inkLab, substrate = 'white_coated', inkOpacity = 0.85) {
        const profile = this.substrateProfiles[substrate];
        if (!profile) return inkLab;
        
        // 잉크 불투명도와 기질 불투명도 결합
        const totalOpacity = inkOpacity * profile.opacity;
        
        // 기질 색상과 잉크 색상 혼합
        const L = inkLab.L * totalOpacity + profile.baseL * (1 - totalOpacity);
        const a = inkLab.a * totalOpacity + profile.baseA * (1 - totalOpacity);
        const b = inkLab.b * totalOpacity + profile.baseB * (1 - totalOpacity);
        
        // 흡수율 영향 (L값 감소)
        const absorbedL = L * (1 - profile.absorption * 0.1);
        
        return { L: absorbedL, a, b };
    }
}

/**
 * Advanced Mixing Engine
 * 모든 고급 모델을 통합한 엔진
 */
export class AdvancedMixingEngine {
    constructor(options = {}) {
        this.kubelkaMunk = new KubelkaMunkModel();
        this.dotGain = new DotGainModel();
        this.substrate = new SubstrateModel();
        
        // 기본 설정
        this.printMethod = options.printMethod || 'offset';
        this.substrateType = options.substrateType || 'white_coated';
        this.enableDotGain = options.enableDotGain !== false;
        this.enableSubstrate = options.enableSubstrate !== false;
        this.enableKubelkaMunk = options.enableKubelkaMunk !== false;
    }
    
    /**
     * 고급 잉크 혼합
     * @param {Array} inks - 잉크 배열
     * @param {Array} concentrations - 농도/비율 배열
     * @param {Object} options - 추가 옵션
     */
    mixInks(inks, concentrations, options = {}) {
        const printMethod = options.printMethod || this.printMethod;
        const substrateType = options.substrateType || this.substrateType;
        
        let mixedLab;
        
        // Kubelka-Munk 비선형 혼합
        if (this.enableKubelkaMunk) {
            mixedLab = this.kubelkaMunk.mixInks(inks, concentrations, substrateType);
        } else {
            // Fallback to simple linear mixing
            mixedLab = this.linearMix(inks, concentrations);
        }
        
        // Dot gain 보정
        if (this.enableDotGain) {
            const avgConcentration = concentrations.reduce((a, b) => a + b, 0) / concentrations.length;
            mixedLab = this.dotGain.compensateLabForDotGain(mixedLab, avgConcentration, printMethod);
        }
        
        // 기질 영향
        if (this.enableSubstrate) {
            const avgOpacity = inks.reduce((sum, ink) => {
                const opacity = this.kubelkaMunk.inkOpacity[ink.type || 'spot'];
                return sum + opacity;
            }, 0) / inks.length;
            
            mixedLab = this.substrate.applySubstrateEffect(mixedLab, substrateType, avgOpacity);
        }
        
        return mixedLab;
    }
    
    /**
     * Simple linear mixing (fallback)
     */
    linearMix(inks, concentrations) {
        // MEDIUM 분리 처리
        let mediumRatio = 0;
        let L = 0, a = 0, b = 0;
        let totalConc = 0;
        
        for (let i = 0; i < inks.length; i++) {
            const ink = inks[i];
            const conc = concentrations[i] || 0;
            
            if (ink.type === 'medium' || ink.id === 'medium') {
                mediumRatio += conc;
            } else {
                // MEDIUM 효과 적용
                const effectiveConc = conc;
                L += ink.L * effectiveConc;
                a += ink.a * effectiveConc;
                b += ink.b * effectiveConc;
                totalConc += effectiveConc;
            }
        }
        
        if (totalConc > 0) {
            L /= totalConc;
            a /= totalConc;
            b /= totalConc;
        }
        
        // MEDIUM 효과: 밝기 증가, 채도 감소
        if (mediumRatio > 0) {
            L = L + (mediumRatio * 10);  // 밝기 증가
            a = a * (1 - mediumRatio * 0.3);  // 채도 감소
            b = b * (1 - mediumRatio * 0.3);
            L = Math.min(100, L);
        }
        
        return { L, a, b };
    }
    
    /**
     * 고급 최적화 알고리즘
     * Kubelka-Munk 모델 기반 최적화
     */
    optimize(targetLab, availableInks, options = {}) {
        const maxIterations = options.maxIterations || 200;
        const tolerance = options.tolerance || 0.5;
        let learningRate = options.learningRate || 0.02;
        
        // 초기 농도 (균등 분배)
        let concentrations = new Array(availableInks.length).fill(1 / availableInks.length);
        let bestConcentrations = [...concentrations];
        let bestDeltaE = Infinity;
        
        // Gradient descent with momentum
        const momentum = new Array(availableInks.length).fill(0);
        const momentumFactor = 0.9;
        
        for (let iter = 0; iter < maxIterations; iter++) {
            // 현재 혼합 색상
            const mixed = this.mixInks(availableInks, concentrations, options);
            const deltaE = ColorScience.calculateDeltaE00(
                targetLab.L, targetLab.a, targetLab.b,
                mixed.L, mixed.a, mixed.b
            );
            
            // 최선 결과 업데이트
            if (deltaE < bestDeltaE) {
                bestDeltaE = deltaE;
                bestConcentrations = [...concentrations];
            }
            
            // 수렴 확인
            if (deltaE < tolerance) break;
            
            // Gradient 계산 (numerical)
            const gradients = [];
            const epsilon = 0.001;
            
            for (let i = 0; i < availableInks.length; i++) {
                const testConc = [...concentrations];
                testConc[i] += epsilon;
                
                // 정규화
                const sum = testConc.reduce((a, b) => a + b, 0);
                if (sum > 0) {
                    for (let j = 0; j < testConc.length; j++) {
                        testConc[j] /= sum;
                    }
                }
                
                const testMixed = this.mixInks(availableInks, testConc, options);
                const testDeltaE = ColorScience.calculateDeltaE00(
                    targetLab.L, targetLab.a, targetLab.b,
                    testMixed.L, testMixed.a, testMixed.b
                );
                
                gradients[i] = (testDeltaE - deltaE) / epsilon;
            }
            
            // Momentum update
            for (let i = 0; i < availableInks.length; i++) {
                momentum[i] = momentumFactor * momentum[i] - learningRate * gradients[i];
                concentrations[i] += momentum[i];
                
                // 범위 제한
                concentrations[i] = Math.max(0, Math.min(1, concentrations[i]));
            }
            
            // 정규화
            const sum = concentrations.reduce((a, b) => a + b, 0);
            if (sum > 0) {
                concentrations = concentrations.map(c => c / sum);
            }
            
            // Adaptive learning rate
            if (iter > 0 && iter % 50 === 0) {
                learningRate *= 0.9;
            }
        }
        
        // 최종 혼합 색상
        const finalMixed = this.mixInks(availableInks, bestConcentrations, options);
        
        return {
            ratios: bestConcentrations,
            concentrations: bestConcentrations.map(c => c * 100), // percentage
            deltaE: bestDeltaE,
            mixed: finalMixed,
            iterations: Math.min(maxIterations, bestDeltaE < tolerance ? iter : maxIterations),
            converged: bestDeltaE < tolerance
        };
    }
    
    /**
     * 설정 업데이트
     */
    updateSettings(settings) {
        if (settings.printMethod) this.printMethod = settings.printMethod;
        if (settings.substrateType) this.substrateType = settings.substrateType;
        if (settings.enableDotGain !== undefined) this.enableDotGain = settings.enableDotGain;
        if (settings.enableSubstrate !== undefined) this.enableSubstrate = settings.enableSubstrate;
        if (settings.enableKubelkaMunk !== undefined) this.enableKubelkaMunk = settings.enableKubelkaMunk;
    }
    
    /**
     * 예측 정확도 분석
     * 실제 인쇄 결과와 비교하여 모델 파라미터 조정
     */
    calibrate(predictions, actuals) {
        // 예측값과 실제값 비교
        const errors = [];
        for (let i = 0; i < predictions.length; i++) {
            const pred = predictions[i];
            const actual = actuals[i];
            
            const deltaE = ColorScience.calculateDeltaE00(
                pred.L, pred.a, pred.b,
                actual.L, actual.a, actual.b
            );
            
            errors.push({
                deltaE,
                deltaL: actual.L - pred.L,
                deltaA: actual.a - pred.a,
                deltaB: actual.b - pred.b
            });
        }
        
        // 평균 오차 계산
        const avgError = errors.reduce((sum, e) => sum + e.deltaE, 0) / errors.length;
        const avgDeltaL = errors.reduce((sum, e) => sum + e.deltaL, 0) / errors.length;
        const avgDeltaA = errors.reduce((sum, e) => sum + e.deltaA, 0) / errors.length;
        const avgDeltaB = errors.reduce((sum, e) => sum + e.deltaB, 0) / errors.length;
        
        // 보정 제안
        const calibration = {
            averageDeltaE: avgError,
            bias: { L: avgDeltaL, a: avgDeltaA, b: avgDeltaB },
            recommendation: []
        };
        
        if (Math.abs(avgDeltaL) > 2) {
            calibration.recommendation.push(`L채널 보정 필요: ${avgDeltaL > 0 ? '밝기 증가' : '밝기 감소'}`);
        }
        
        if (avgError > 2) {
            calibration.recommendation.push('Kubelka-Munk 파라미터 재조정 필요');
        }
        
        return calibration;
    }
}

// Export
export default AdvancedMixingEngine;