/**
 * Mixing Engine Module
 * 잉크 혼합 알고리즘 (Lab 직접 혼합 & XYZ 혼합)
 * v3.0 기존 로직 + v2.2 확장
 */

import { ColorScience } from './colorScience.js';

// Lab 직접 혼합 (기존 v3.0 방식 - 빠른 근사치)
export function mixInLab(inks, ratios) {
    let L = 0, a = 0, b = 0;
    let totalRatio = 0;
    
    for (let i = 0; i < inks.length; i++) {
        const ink = inks[i];
        const ratio = ratios[i] || 0;
        
        L += ink.L * ratio;
        a += ink.a * ratio;
        b += ink.b * ratio;
        totalRatio += ratio;
    }
    
    // 정규화
    if (totalRatio > 0) {
        L /= totalRatio;
        a /= totalRatio;
        b /= totalRatio;
    }
    
    return { L, a, b };
}

// XYZ 색공간에서 혼합 (v2.2 명세서 - 물리적으로 정확)
export function mixInXYZ(inks, ratios, illuminant = 'D65') {
    let X = 0, Y = 0, Z = 0;
    let totalRatio = 0;
    
    for (let i = 0; i < inks.length; i++) {
        const ink = inks[i];
        const ratio = ratios[i] || 0;
        
        // Lab to XYZ 변환
        const xyz = ColorScience.labToXyz(ink.L, ink.a, ink.b, illuminant);
        
        // 가중 합산
        X += xyz.X * ratio;
        Y += xyz.Y * ratio;
        Z += xyz.Z * ratio;
        totalRatio += ratio;
    }
    
    // 정규화
    if (totalRatio > 0) {
        X /= totalRatio;
        Y /= totalRatio;
        Z /= totalRatio;
    }
    
    // XYZ to Lab 변환
    return ColorScience.xyzToLab(X, Y, Z, illuminant);
}

// Catmull-Rom 스플라인 보간 (v2.2 명세서)
export function catmullRomInterpolation(points, t) {
    // points: [{concentration, Lab}, ...]
    // t: 목표 농도
    
    if (points.length < 2) return points[0]?.Lab || { L: 0, a: 0, b: 0 };
    if (points.length === 2) {
        // 선형 보간
        const p0 = points[0];
        const p1 = points[1];
        const ratio = (t - p0.concentration) / (p1.concentration - p0.concentration);
        
        return {
            L: p0.Lab.L + (p1.Lab.L - p0.Lab.L) * ratio,
            a: p0.Lab.a + (p1.Lab.a - p0.Lab.a) * ratio,
            b: p0.Lab.b + (p1.Lab.b - p0.Lab.b) * ratio
        };
    }
    
    // Catmull-Rom 스플라인 (4개 점 필요)
    // 구간 찾기
    let p0, p1, p2, p3;
    for (let i = 0; i < points.length - 1; i++) {
        if (t >= points[i].concentration && t <= points[i + 1].concentration) {
            p1 = points[i];
            p2 = points[i + 1];
            p0 = points[Math.max(0, i - 1)];
            p3 = points[Math.min(points.length - 1, i + 2)];
            break;
        }
    }
    
    if (!p1 || !p2) {
        // 범위 밖
        if (t < points[0].concentration) return points[0].Lab;
        return points[points.length - 1].Lab;
    }
    
    // t를 0-1 범위로 정규화
    const localT = (t - p1.concentration) / (p2.concentration - p1.concentration);
    const t2 = localT * localT;
    const t3 = t2 * localT;
    
    // Catmull-Rom 계수
    const v0 = -0.5 * t3 + t2 - 0.5 * localT;
    const v1 = 1.5 * t3 - 2.5 * t2 + 1;
    const v2 = -1.5 * t3 + 2 * t2 + 0.5 * localT;
    const v3 = 0.5 * t3 - 0.5 * t2;
    
    return {
        L: v0 * p0.Lab.L + v1 * p1.Lab.L + v2 * p2.Lab.L + v3 * p3.Lab.L,
        a: v0 * p0.Lab.a + v1 * p1.Lab.a + v2 * p2.Lab.a + v3 * p3.Lab.a,
        b: v0 * p0.Lab.b + v1 * p1.Lab.b + v2 * p2.Lab.b + v3 * p3.Lab.b
    };
}

// 간단한 선형 최적화 (기존 v3.0 방식)
export function simpleOptimization(targetLab, availableInks, maxIterations = 100) {
    const numInks = availableInks.length;
    let bestRatios = new Array(numInks).fill(1 / numInks);
    let bestDeltaE = Infinity;
    
    for (let iter = 0; iter < maxIterations; iter++) {
        // 현재 혼합 색상
        const mixed = mixInLab(availableInks, bestRatios);
        const deltaE = ColorScience.calculateDeltaE00(
            targetLab.L, targetLab.a, targetLab.b,
            mixed.L, mixed.a, mixed.b
        );
        
        if (deltaE < bestDeltaE) {
            bestDeltaE = deltaE;
        }
        
        // 목표에 충분히 가까우면 종료
        if (deltaE < 0.5) break;
        
        // 간단한 경사 하강
        for (let i = 0; i < numInks; i++) {
            const step = 0.01;
            const testRatios = [...bestRatios];
            
            // 증가 테스트
            testRatios[i] += step;
            const mixedUp = mixInLab(availableInks, testRatios);
            const deltaEUp = ColorScience.calculateDeltaE00(
                targetLab.L, targetLab.a, targetLab.b,
                mixedUp.L, mixedUp.a, mixedUp.b
            );
            
            // 감소 테스트
            testRatios[i] = bestRatios[i] - step;
            const mixedDown = mixInLab(availableInks, testRatios);
            const deltaEDown = ColorScience.calculateDeltaE00(
                targetLab.L, targetLab.a, targetLab.b,
                mixedDown.L, mixedDown.a, mixedDown.b
            );
            
            // 최선의 방향 선택
            if (deltaEUp < deltaE && deltaEUp < deltaEDown) {
                bestRatios[i] += step;
            } else if (deltaEDown < deltaE) {
                bestRatios[i] -= step;
            }
            
            // 범위 제한
            bestRatios[i] = Math.max(0, Math.min(1, bestRatios[i]));
        }
        
        // 정규화
        const sum = bestRatios.reduce((a, b) => a + b, 0);
        if (sum > 0) {
            bestRatios = bestRatios.map(r => r / sum);
        }
    }
    
    return {
        ratios: bestRatios,
        deltaE: bestDeltaE,
        mixed: mixInLab(availableInks, bestRatios)
    };
}

// Mixing Engine 클래스
export class MixingEngine {
    constructor(options = {}) {
        this.mode = options.mode || 'lab'; // 'lab' or 'xyz'
        this.interpolation = options.interpolation || 'linear'; // 'linear' or 'catmull-rom'
        this.illuminant = options.illuminant || 'D65';
    }
    
    // 설정된 모드에 따른 혼합
    mix(inks, ratios) {
        if (this.mode === 'xyz') {
            return mixInXYZ(inks, ratios, this.illuminant);
        }
        return mixInLab(inks, ratios);
    }
    
    // 농도 보간
    interpolate(points, targetConcentration) {
        if (this.interpolation === 'catmull-rom' && points.length >= 3) {
            return catmullRomInterpolation(points, targetConcentration);
        }
        
        // 기본 선형 보간
        return this.linearInterpolation(points, targetConcentration);
    }
    
    // 선형 보간
    linearInterpolation(points, t) {
        if (points.length < 2) return points[0]?.Lab || { L: 0, a: 0, b: 0 };
        
        // 정렬
        points.sort((a, b) => a.concentration - b.concentration);
        
        // 구간 찾기
        for (let i = 0; i < points.length - 1; i++) {
            if (t >= points[i].concentration && t <= points[i + 1].concentration) {
                const p0 = points[i];
                const p1 = points[i + 1];
                const ratio = (t - p0.concentration) / (p1.concentration - p0.concentration);
                
                return {
                    L: p0.Lab.L + (p1.Lab.L - p0.Lab.L) * ratio,
                    a: p0.Lab.a + (p1.Lab.a - p0.Lab.a) * ratio,
                    b: p0.Lab.b + (p1.Lab.b - p0.Lab.b) * ratio
                };
            }
        }
        
        // 범위 밖
        if (t < points[0].concentration) return points[0].Lab;
        return points[points.length - 1].Lab;
    }
    
    // 최적화
    optimize(targetLab, availableInks, options = {}) {
        const method = options.method || 'simple';
        const maxIterations = options.maxIterations || 100;
        
        switch (method) {
            case 'simple':
                return simpleOptimization(targetLab, availableInks, maxIterations);
            case 'pso':
                // PSO는 다음 단계에서 구현
                return this.psoOptimization(targetLab, availableInks, options);
            default:
                return simpleOptimization(targetLab, availableInks, maxIterations);
        }
    }
    
    // PSO 최적화 (스텁 - 추후 구현)
    psoOptimization(targetLab, availableInks, options) {
        console.log('PSO optimization will be implemented in next phase');
        // 임시로 simple optimization 사용
        return simpleOptimization(targetLab, availableInks, options.maxIterations);
    }
}

// Export default instance
export const mixingEngine = new MixingEngine();

export default mixingEngine;