/**
 * Optimized Mixing Engine
 * 모든 농도의 잉크를 고려한 최적 배합 계산
 */

import { ColorScience } from './colorScience.js';

export class OptimizedMixingEngine {
    constructor() {
        this.maxIterations = 1000;
        this.tolerance = 0.5; // Delta E 허용 오차
    }

    /**
     * 모든 가용 잉크를 고려한 최적 배합 찾기
     * @param {Object} targetLab - 목표 Lab 값
     * @param {Array} inkDatabase - 잉크 데이터베이스
     * @param {Object} options - 옵션
     * @returns {Object} 최적 배합 결과
     */
    findOptimalMix(targetLab, inkDatabase, options = {}) {
        const {
            maxInks = 4,  // 최대 사용 잉크 수
            preferredConcentrations = [100, 70, 40],  // 선호 농도
            includeWhite = true,  // 화이트 포함 여부
            costWeight = 0.2  // 비용 가중치 (농도가 낮을수록 비용 높음)
        } = options;

        // 모든 가용 잉크 후보 생성
        const inkCandidates = this.generateInkCandidates(inkDatabase, preferredConcentrations, includeWhite);
        
        // 최적 조합 찾기
        const bestCombination = this.findBestCombination(
            targetLab, 
            inkCandidates, 
            maxInks,
            costWeight
        );

        return bestCombination;
    }

    /**
     * 잉크 후보 생성 (모든 농도 포함)
     */
    generateInkCandidates(inkDatabase, concentrations, includeWhite) {
        const candidates = [];
        
        for (const ink of inkDatabase) {
            // 화이트 제외 옵션
            if (!includeWhite && ink.id === 'white') continue;
            
            // 각 농도별로 후보 생성
            for (const conc of concentrations) {
                if (ink.concentrations && ink.concentrations[conc]) {
                    candidates.push({
                        id: `${ink.id}_${conc}`,
                        baseId: ink.id,
                        name: `${ink.name} ${conc}%`,
                        type: ink.type,
                        concentration: conc,
                        lab: ink.concentrations[conc],
                        cost: this.calculateCost(conc)  // 농도별 비용
                    });
                }
            }
        }
        
        return candidates;
    }

    /**
     * 농도별 비용 계산
     * 낮은 농도는 제조 비용이 더 높음
     */
    calculateCost(concentration) {
        if (concentration === 100) return 1.0;
        if (concentration === 70) return 1.2;
        if (concentration === 40) return 1.5;
        return 1.8;
    }

    /**
     * 최적 조합 찾기
     */
    findBestCombination(targetLab, candidates, maxInks, costWeight) {
        let bestResult = null;
        let bestScore = Infinity;
        
        // 1~maxInks 개의 잉크 조합 시도
        for (let numInks = 1; numInks <= Math.min(maxInks, candidates.length); numInks++) {
            const combinations = this.getCombinations(candidates, numInks);
            
            for (const combination of combinations) {
                // 같은 베이스 잉크의 다른 농도가 중복되지 않도록 체크
                if (this.hasDuplicateBase(combination)) continue;
                
                // 최적 비율 계산
                const result = this.optimizeRatios(combination, targetLab);
                
                if (result) {
                    // 스코어 계산 (Delta E + 비용)
                    const score = result.deltaE + costWeight * result.totalCost;
                    
                    if (score < bestScore) {
                        bestScore = score;
                        bestResult = result;
                    }
                }
            }
        }
        
        return bestResult;
    }

    /**
     * 조합 생성 (간단한 구현)
     */
    getCombinations(arr, k) {
        const combinations = [];
        
        function backtrack(start, current) {
            if (current.length === k) {
                combinations.push([...current]);
                return;
            }
            
            for (let i = start; i < arr.length; i++) {
                current.push(arr[i]);
                backtrack(i + 1, current);
                current.pop();
            }
        }
        
        backtrack(0, []);
        return combinations;
    }

    /**
     * 같은 베이스 잉크 중복 체크
     */
    hasDuplicateBase(combination) {
        const baseIds = new Set();
        for (const ink of combination) {
            if (baseIds.has(ink.baseId)) return true;
            baseIds.add(ink.baseId);
        }
        return false;
    }

    /**
     * 주어진 잉크 조합에 대한 최적 비율 계산
     */
    optimizeRatios(inks, targetLab) {
        const n = inks.length;
        let bestRatios = null;
        let bestDeltaE = Infinity;
        
        // 심플렉스 방법 또는 그리드 서치
        // 여기서는 간단한 그리드 서치 구현
        const step = 0.1;
        
        function searchRatios(ratios, index, remaining) {
            if (index === n - 1) {
                ratios[index] = remaining;
                
                // 혼합색 계산
                const mixedLab = this.mixColors(inks, ratios);
                const deltaE = ColorScience.calculateDeltaE00(
                    targetLab.L, targetLab.a, targetLab.b,
                    mixedLab.L, mixedLab.a, mixedLab.b
                );
                
                if (deltaE < bestDeltaE) {
                    bestDeltaE = deltaE;
                    bestRatios = [...ratios];
                }
                return;
            }
            
            for (let r = 0; r <= remaining; r += step) {
                ratios[index] = r;
                searchRatios.call(this, ratios, index + 1, remaining - r);
            }
        }
        
        searchRatios.call(this, new Array(n).fill(0), 0, 1.0);
        
        if (bestRatios) {
            const totalCost = inks.reduce((sum, ink, i) => 
                sum + ink.cost * bestRatios[i], 0
            );
            
            return {
                inks: inks.map((ink, i) => ({
                    ...ink,
                    ratio: bestRatios[i],
                    percentage: (bestRatios[i] * 100).toFixed(1)
                })),
                mixedLab: this.mixColors(inks, bestRatios),
                deltaE: bestDeltaE,
                totalCost: totalCost
            };
        }
        
        return null;
    }

    /**
     * 잉크 혼합 색상 계산
     */
    mixColors(inks, ratios) {
        let L = 0, a = 0, b = 0;
        let totalRatio = 0;
        
        for (let i = 0; i < inks.length; i++) {
            const ink = inks[i];
            const ratio = ratios[i];
            
            L += ink.lab.L * ratio;
            a += ink.lab.a * ratio;
            b += ink.lab.b * ratio;
            totalRatio += ratio;
        }
        
        if (totalRatio > 0) {
            L /= totalRatio;
            a /= totalRatio;
            b /= totalRatio;
        }
        
        return { L, a, b };
    }

    /**
     * 결과 포맷팅
     */
    formatResult(result) {
        if (!result) return null;
        
        const recipe = {
            inks: result.inks.filter(ink => ink.ratio > 0.01).map(ink => ({
                id: ink.baseId,
                name: ink.name,
                concentration: ink.concentration,
                percentage: parseFloat(ink.percentage),
                baseInk: ink.baseId,
                isSatin: ink.concentration < 100
            })),
            targetLab: result.targetLab,
            achievedLab: result.mixedLab,
            deltaE: result.deltaE.toFixed(2),
            cost: result.totalCost.toFixed(2),
            quality: this.assessQuality(result.deltaE)
        };
        
        // 비율 정규화 (합이 100%가 되도록)
        const totalPercentage = recipe.inks.reduce((sum, ink) => sum + ink.percentage, 0);
        if (totalPercentage > 0) {
            recipe.inks.forEach(ink => {
                ink.percentage = ((ink.percentage / totalPercentage) * 100).toFixed(1);
            });
        }
        
        return recipe;
    }

    /**
     * 품질 평가
     */
    assessQuality(deltaE) {
        if (deltaE < 1) return 'Excellent';
        if (deltaE < 2) return 'Very Good';
        if (deltaE < 3) return 'Good';
        if (deltaE < 5) return 'Acceptable';
        return 'Poor';
    }
}

export default OptimizedMixingEngine;