/**
 * Optimized Mixing Engine
 * 모든 농도의 잉크를 고려한 최적 배합 계산
 */

import { ColorScience } from './colorScience.js';
import { ColorGamutValidator } from './ColorGamutValidator.js';

export class OptimizedMixingEngine {
    constructor() {
        this.maxIterations = 1000;
        this.tolerance = 0.5; // ΔE*00 허용 오차
        this.cache = new Map(); // 결과 캐싱
        this.gamutValidator = new ColorGamutValidator(); // 색역 검증기
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
            costWeight = 0.2,  // 비용 가중치 (농도가 낮을수록 비용 높음)
            maxResults = 5,  // 반환할 최대 결과 수
            validateGamut = true  // 색역 검증 활성화
        } = options;

        // 캐시 키 생성
        const cacheKey = `${targetLab.L}_${targetLab.a}_${targetLab.b}_${maxInks}_${includeWhite}_${preferredConcentrations.join(',')}_${maxResults}`;
        
        // 캐시에서 확인
        if (this.cache.has(cacheKey)) {
            console.log('Using cached result for:', cacheKey);
            return this.cache.get(cacheKey);
        }

        // 모든 가용 잉크 후보 생성
        const inkCandidates = this.generateInkCandidates(inkDatabase, preferredConcentrations, includeWhite);
        
        // 색역 검증 (활성화된 경우)
        let adjustedTarget = targetLab;
        let gamutValidation = null;
        
        if (validateGamut) {
            gamutValidation = this.gamutValidator.validateColor(targetLab, inkCandidates);
            
            if (!gamutValidation.isAchievable) {
                console.warn('목표 색상이 색역 밖에 있습니다:', gamutValidation.message);
                
                // 가장 가까운 달성 가능한 색상으로 조정
                if (gamutValidation.suggestion) {
                    adjustedTarget = gamutValidation.suggestion;
                    console.log('조정된 목표 색상:', adjustedTarget);
                }
            }
        }
        
        // 상위 N개 최적 조합 찾기
        const topCombinations = this.findBestCombination(
            adjustedTarget, 
            inkCandidates, 
            maxInks,
            costWeight,
            maxResults
        );
        
        // 색역 검증 정보 추가
        if (gamutValidation && topCombinations.length > 0) {
            topCombinations.forEach(combo => {
                combo.gamutValidation = gamutValidation;
                combo.originalTarget = targetLab;
                combo.adjustedTarget = adjustedTarget;
            });
        }

        // 결과 캐싱
        this.cache.set(cacheKey, topCombinations);

        return topCombinations;
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
     * 최적 조합 찾기 (프로그레시브 검색)
     */
    findBestCombination(targetLab, candidates, maxInks, costWeight, maxResults = 5) {
        // 상위 N개 결과를 저장
        const topResults = [];
        const maxTopResults = maxResults;
        let totalTested = 0;
        let bestDeltaE = Infinity;
        let variationCount = 0; // 다양성을 위한 카운터
        
        // 스마트 샘플링: 색상 거리 기반 필터링 (정확도 유지)
        const sampledCandidates = this.smartSampling(candidates, targetLab, maxInks);
        console.log(`Using ${sampledCandidates.length} smart-filtered candidates (from ${candidates.length}) for optimal accuracy`);
        
        // 1~maxInks 개의 잉크 조합 시도
        for (let numInks = 2; numInks <= Math.min(maxInks, sampledCandidates.length); numInks++) {
            const combinations = this.getCombinations(sampledCandidates, numInks);
            
            console.log(`Testing ${combinations.length} combinations with ${numInks} inks...`);
            
            // 조합이 많을 경우 배치 처리
            const batchSize = 100;
            let processedCount = 0;
            
            for (const combination of combinations) {
                // 같은 베이스 잉크의 다른 농도가 중복되지 않도록 체크
                if (this.hasDuplicateBase(combination)) continue;
                
                // 최적 비율 계산 (다양성을 위해 변형 팩터 적용)
                const result = this.optimizeRatios(combination, targetLab, variationCount * 0.1);
                
                if (result) {
                    totalTested++;
                    
                    // 스코어 계산 (ΔE*00 + 비용)
                    const score = result.deltaE + costWeight * result.totalCost;
                    result.score = score;
                    
                    // 최고 ΔE*00 갱신
                    if (result.deltaE < bestDeltaE) {
                        bestDeltaE = result.deltaE;
                        console.log(`New best ΔE*00: ${bestDeltaE.toFixed(3)} (tested: ${totalTested})`);
                    }
                    
                    // 중복 체크를 위한 키 생성 (잉크 조합과 비율 기반)
                    const resultKey = result.inks
                        .filter(ink => ink.ratio > 0.01)
                        .map(ink => `${ink.baseId}_${ink.concentration}_${ink.ratio.toFixed(2)}`)
                        .sort()
                        .join('|');
                    
                    // 중복된 결과인지 확인
                    const isDuplicate = topResults.some(existing => {
                        const existingKey = existing.inks
                            .filter(ink => ink.ratio > 0.01)
                            .map(ink => `${ink.baseId}_${ink.concentration}_${ink.ratio.toFixed(2)}`)
                            .sort()
                            .join('|');
                        return existingKey === resultKey;
                    });
                    
                    // 중복이 아닌 경우에만 추가
                    if (!isDuplicate) {
                        topResults.push(result);
                        topResults.sort((a, b) => a.score - b.score);
                        if (topResults.length > maxTopResults) {
                            topResults.pop();
                        }
                        variationCount++; // 다양성 카운터 증가
                    }
                    
                    // 조기 종료 조건: 충분히 좋은 결과를 찾으면 종료
                    if (bestDeltaE < 0.3) {
                        console.log(`Excellent match found! ΔE*00 = ${bestDeltaE.toFixed(3)}. Early stopping.`);
                        break;
                    }
                    if (topResults.length >= maxTopResults && 
                        topResults[maxTopResults - 1].deltaE < 1.0) {
                        console.log(`Found ${maxTopResults} good results. Early stopping.`);
                        break;
                    }
                }
                
                processedCount++;
                // 진행 상황 로그 (100개마다)
                if (processedCount % batchSize === 0) {
                    console.log(`Processed ${processedCount}/${combinations.length} combinations...`);
                }
            }
        }
        
        // 상위 5개 결과 반환 (첫 번째가 최고)
        return topResults;
    }

    /**
     * 스마트 샘플링: 색상 거리 기반 필터링
     * 정확도를 유지하면서 계산량 감소
     */
    smartSampling(candidates, targetLab, maxInks) {
        // 필수 프로세스 잉크는 항상 포함
        const essentialInks = ['cyan', 'magenta', 'yellow', 'black', 'white'];
        const essential = candidates.filter(ink => 
            essentialInks.includes(ink.baseId)
        );
        
        // 나머지 잉크를 색상 거리로 정렬
        const others = candidates
            .filter(ink => !essentialInks.includes(ink.baseId))
            .map(ink => ({
                ...ink,
                distance: ColorScience.calculateDeltaE00(
                    targetLab.L, targetLab.a, targetLab.b,
                    ink.lab.L, ink.lab.a, ink.lab.b
                )
            }))
            .sort((a, b) => a.distance - b.distance);
        
        // 가장 가까운 잉크들 선택 (최대 15개)
        const maxAdditional = Math.max(15 - essential.length, 5);
        const selected = others.slice(0, maxAdditional);
        
        return [...essential, ...selected];
    }

    /**
     * 조합 생성 (중요 잉크 우선)
     */
    getCombinations(arr, k) {
        const combinations = [];
        
        // 중요 잉크를 우선순위로 정렬
        const importantInks = ['magenta', 'yellow', 'black', 'vermillion', 'cyan', 'warm-red', 'scarlet'];
        const sorted = [...arr].sort((a, b) => {
            const aImportant = importantInks.includes(a.baseId);
            const bImportant = importantInks.includes(b.baseId);
            if (aImportant && !bImportant) return -1;
            if (!aImportant && bImportant) return 1;
            return 0;
        });
        
        function backtrack(start, current) {
            if (current.length === k) {
                combinations.push([...current]);
                return;
            }
            
            for (let i = start; i < sorted.length; i++) {
                current.push(sorted[i]);
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
    optimizeRatios(inks, targetLab, variationFactor = 0) {
        const n = inks.length;
        let bestRatios = null;
        let bestDeltaE = Infinity;
        
        // 적응형 단계 조정 (정확도와 속도 균형)
        // 변형 팩터를 추가하여 다양한 결과 생성
        const baseStep = n <= 2 ? 0.02 : n === 3 ? 0.05 : n === 4 ? 0.1 : 0.15;
        const step = baseStep * (1 + variationFactor * 0.2); // 변형 팩터에 따라 스텝 조정
        
        // 첫 번째 패스: 기본 최적값 찾기
        function searchRatios(ratios, index, remaining) {
            if (Math.abs(remaining) < 0.001 && index < n - 1) {
                // 남은 비율이 거의 0이면 건너뛰기
                return;
            }
            
            if (index === n - 1) {
                ratios[index] = remaining;
                
                // 음수 비율 체크
                if (ratios[index] < 0) return;
                
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
        
        // 두 번째 패스: 세밀한 조정 (ΔE*00가 높을 때만)
        if (bestRatios && bestDeltaE > 1.0) {
            const fineStep = 0.02;
            let improved = true;
            let iterations = 0;
            const maxIterations = 5; // 충분한 정확도 확보
            
            while (improved && bestDeltaE > 0.5 && iterations < maxIterations) {
                improved = false;
                iterations++;
                
                // 각 잉크 비율을 미세 조정
                for (let i = 0; i < n; i++) {
                    for (let j = 0; j < n; j++) {
                        if (i === j) continue;
                        
                        // i를 증가시키고 j를 감소
                        const testRatios = [...bestRatios];
                        testRatios[i] = Math.min(1, testRatios[i] + fineStep);
                        testRatios[j] = Math.max(0, testRatios[j] - fineStep);
                        
                        // 비율 정규화
                        const sum = testRatios.reduce((a, b) => a + b, 0);
                        if (sum > 0) {
                            for (let k = 0; k < n; k++) {
                                testRatios[k] = testRatios[k] / sum;
                            }
                        }
                        
                        const mixedLab = this.mixColors(inks, testRatios);
                        const deltaE = ColorScience.calculateDeltaE00(
                            targetLab.L, targetLab.a, targetLab.b,
                            mixedLab.L, mixedLab.a, mixedLab.b
                        );
                        
                        if (deltaE < bestDeltaE) {
                            bestDeltaE = deltaE;
                            bestRatios = [...testRatios];
                            improved = true;
                        }
                    }
                }
            }
        }
        
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
     * 잉크 혼합 색상 계산 (비선형 혼합 보정 포함)
     */
    mixColors(inks, ratios) {
        let L = 0, a = 0, b = 0;
        let totalRatio = 0;
        
        // 단순 선형 혼합
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
        
        // 실제 인쇄에서 발생하는 비선형 효과 보정
        // 어두운 색상은 예상보다 더 어둡게, 채도는 약간 감소
        const darknessFactor = 1 - (L / 100);
        L = L * (1 - darknessFactor * 0.05); // 어두운 색일수록 약간 더 어둡게
        
        // 채도 감소 보정 (여러 잉크 혼합 시 채도 감소)
        const numInksUsed = ratios.filter(r => r > 0.01).length;
        if (numInksUsed > 2) {
            const saturation = Math.sqrt(a * a + b * b);
            const saturationLoss = 1 - (numInksUsed - 2) * 0.03; // 잉크 수가 많을수록 채도 감소
            a *= saturationLoss;
            b *= saturationLoss;
        }
        
        return { L, a, b };
    }

    /**
     * 결과 포맷팅 (배열 또는 단일 결과 처리)
     */
    formatResult(results) {
        if (!results) return null;
        
        // 배열인 경우 각각 포맷팅
        if (Array.isArray(results)) {
            return results.map(result => this.formatSingleResult(result));
        }
        
        // 단일 결과인 경우
        return this.formatSingleResult(results);
    }
    
    /**
     * 단일 결과 포맷팅
     */
    formatSingleResult(result) {
        if (!result) return null;
        
        console.log('Formatting result:', result);
        
        const recipe = {
            inks: result.inks.filter(ink => ink.ratio > 0.01).map(ink => {
                console.log(`Formatting ink:`, ink);
                // baseId가 있으면 사용, 없으면 id를 파싱해서 추출
                const inkId = ink.baseId || (ink.id && ink.id.split('_')[0]) || ink.id || 'unknown';
                return {
                    id: inkId,
                    inkId: inkId,  // 호환성을 위해 둘 다 제공
                    name: ink.name,
                    concentration: ink.concentration || 100,
                    percentage: parseFloat(ink.percentage),
                    ratio: parseFloat(ink.percentage),  // ratio 필드도 추가
                    baseInk: inkId,
                    isSatin: ink.concentration < 100
                };
            }),
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
        
        console.log('Final recipe:', recipe.inks.map(ink => `${ink.name} ${ink.concentration}%: ${ink.percentage}%`));
        
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