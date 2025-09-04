/**
 * 색역(Gamut) 검증 시스템
 * 달성 가능한 색상 범위를 계산하고 검증
 */

import { ColorScience } from './colorScience.js';

export class ColorGamutValidator {
    constructor() {
        this.gamutCache = new Map();
    }

    /**
     * 잉크 세트로부터 달성 가능한 색역 계산
     */
    calculateGamut(inks) {
        const cacheKey = inks.map(i => i.id).sort().join(',');
        
        // 캐시 확인
        if (this.gamutCache.has(cacheKey)) {
            return this.gamutCache.get(cacheKey);
        }

        // 기본 색역 범위 (단일 잉크)
        let gamut = {
            L: { min: 100, max: 0 },
            a: { min: 0, max: 0 },
            b: { min: 0, max: 0 }
        };

        // 각 잉크의 LAB 값으로 기본 범위 설정
        inks.forEach(ink => {
            if (ink.lab) {
                gamut.L.min = Math.min(gamut.L.min, ink.lab.L);
                gamut.L.max = Math.max(gamut.L.max, ink.lab.L);
                gamut.a.min = Math.min(gamut.a.min, ink.lab.a);
                gamut.a.max = Math.max(gamut.a.max, ink.lab.a);
                gamut.b.min = Math.min(gamut.b.min, ink.lab.b);
                gamut.b.max = Math.max(gamut.b.max, ink.lab.b);
            }
        });

        // 혼합으로 인한 확장 계산 (보수적 추정)
        // 두 색상의 혼합은 그 사이의 모든 색상을 만들 수 있음
        const expansionFactor = 1.1; // 10% 확장 여유
        const center = {
            a: (gamut.a.min + gamut.a.max) / 2,
            b: (gamut.b.min + gamut.b.max) / 2
        };

        gamut.a.min = center.a + (gamut.a.min - center.a) * expansionFactor;
        gamut.a.max = center.a + (gamut.a.max - center.a) * expansionFactor;
        gamut.b.min = center.b + (gamut.b.min - center.b) * expansionFactor;
        gamut.b.max = center.b + (gamut.b.max - center.b) * expansionFactor;

        // L은 항상 0-100 범위
        gamut.L.min = Math.max(0, gamut.L.min);
        gamut.L.max = Math.min(100, gamut.L.max);

        // 캐시 저장
        this.gamutCache.set(cacheKey, gamut);

        return gamut;
    }

    /**
     * 목표 색상이 색역 내에 있는지 검증
     */
    isInGamut(targetLab, gamut) {
        return (
            targetLab.L >= gamut.L.min && targetLab.L <= gamut.L.max &&
            targetLab.a >= gamut.a.min && targetLab.a <= gamut.a.max &&
            targetLab.b >= gamut.b.min && targetLab.b <= gamut.b.max
        );
    }

    /**
     * 목표 색상이 색역 밖일 경우 가장 가까운 달성 가능한 색상 계산
     */
    clampToGamut(targetLab, gamut) {
        return {
            L: Math.max(gamut.L.min, Math.min(gamut.L.max, targetLab.L)),
            a: Math.max(gamut.a.min, Math.min(gamut.a.max, targetLab.a)),
            b: Math.max(gamut.b.min, Math.min(gamut.b.max, targetLab.b))
        };
    }

    /**
     * 색역 검증 결과와 권장사항 반환
     */
    validateColor(targetLab, inks) {
        const gamut = this.calculateGamut(inks);
        const isAchievable = this.isInGamut(targetLab, gamut);
        
        const result = {
            isAchievable,
            gamut,
            targetLab,
            message: '',
            suggestion: null,
            confidence: 100
        };

        if (!isAchievable) {
            const clampedLab = this.clampToGamut(targetLab, gamut);
            const deltaE = ColorScience.calculateDeltaE00(
                targetLab.L, targetLab.a, targetLab.b,
                clampedLab.L, clampedLab.a, clampedLab.b
            );

            result.suggestion = clampedLab;
            result.deltaE = deltaE;
            
            // 색역 밖 정도에 따른 신뢰도 계산
            const outOfGamutDistance = this.calculateOutOfGamutDistance(targetLab, gamut);
            result.confidence = Math.max(0, 100 - outOfGamutDistance * 10);

            // 메시지 생성
            if (deltaE < 5) {
                result.message = `목표 색상이 색역 경계에 있습니다. 제안된 색상으로 유사한 결과를 얻을 수 있습니다. (ΔE: ${deltaE.toFixed(1)})`;
            } else if (deltaE < 10) {
                result.message = `목표 색상이 색역을 벗어났습니다. 제안된 색상이 가장 가까운 달성 가능한 색상입니다. (ΔE: ${deltaE.toFixed(1)})`;
            } else {
                result.message = `목표 색상이 색역을 크게 벗어났습니다. 다른 잉크 세트를 고려하거나 목표 색상을 조정하세요. (ΔE: ${deltaE.toFixed(1)})`;
                
                // 구체적인 문제 지적
                const problems = [];
                if (targetLab.a < gamut.a.min) problems.push('더 강한 녹색 잉크 필요');
                if (targetLab.a > gamut.a.max) problems.push('더 강한 빨간색 잉크 필요');
                if (targetLab.b < gamut.b.min) problems.push('더 강한 파란색 잉크 필요');
                if (targetLab.b > gamut.b.max) problems.push('더 강한 노란색 잉크 필요');
                
                if (problems.length > 0) {
                    result.message += ` (${problems.join(', ')})`;
                }
            }
        } else {
            result.message = '목표 색상이 달성 가능합니다.';
        }

        return result;
    }

    /**
     * 색역 밖 거리 계산 (정규화된 값)
     */
    calculateOutOfGamutDistance(targetLab, gamut) {
        let distance = 0;
        
        // 각 축에서 색역 밖 거리 계산
        if (targetLab.L < gamut.L.min) {
            distance += Math.pow((gamut.L.min - targetLab.L) / 100, 2);
        } else if (targetLab.L > gamut.L.max) {
            distance += Math.pow((targetLab.L - gamut.L.max) / 100, 2);
        }
        
        if (targetLab.a < gamut.a.min) {
            distance += Math.pow((gamut.a.min - targetLab.a) / 128, 2);
        } else if (targetLab.a > gamut.a.max) {
            distance += Math.pow((targetLab.a - gamut.a.max) / 128, 2);
        }
        
        if (targetLab.b < gamut.b.min) {
            distance += Math.pow((gamut.b.min - targetLab.b) / 128, 2);
        } else if (targetLab.b > gamut.b.max) {
            distance += Math.pow((targetLab.b - gamut.b.max) / 128, 2);
        }
        
        return Math.sqrt(distance) * 100; // 0-100 범위로 정규화
    }

    /**
     * 색역 시각화를 위한 데이터 생성
     */
    getGamutVisualizationData(gamut) {
        // 2D 투영을 위한 데이터 (a*b* 평면)
        return {
            bounds: {
                x: [gamut.a.min, gamut.a.max],
                y: [gamut.b.min, gamut.b.max]
            },
            vertices: [
                { a: gamut.a.min, b: gamut.b.min },
                { a: gamut.a.max, b: gamut.b.min },
                { a: gamut.a.max, b: gamut.b.max },
                { a: gamut.a.min, b: gamut.b.max }
            ],
            center: {
                a: (gamut.a.min + gamut.a.max) / 2,
                b: (gamut.b.min + gamut.b.max) / 2
            }
        };
    }
}

export default ColorGamutValidator;