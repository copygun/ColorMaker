/**
 * Professional Mixing Engine
 * 컬러리스트/인쇄 전문가용 고급 잉크 배합 엔진
 * 2024 최신 기술 통합
 */

import { OptimizedMixingEngine } from './OptimizedMixingEngine.js';
import { FluorescentInkHandler } from './fluorestcentInks.js';
import { AdvancedColorModel } from './advancedColorModel.js';
import { ColorScience } from './colorScience.js';
import { baseInks } from './inkDatabase.js';
import { fluorescentInks } from './fluorestcentInks.js';

export class ProfessionalMixingEngine {
    constructor() {
        this.optimizedEngine = new OptimizedMixingEngine();
        this.fluorHandler = new FluorescentInkHandler();
        this.colorModel = new AdvancedColorModel();
        
        // 전체 잉크 데이터베이스
        this.allInks = [...baseInks, ...fluorescentInks];
        
        // 설정
        this.settings = {
            useSpectralPrediction: true,
            useFluorescent: true,
            checkMetamerism: true,
            optimizeForProduction: true,
            targetIlluminant: 'D50',  // 인쇄 표준
            viewingIlluminants: ['D65', 'F11', 'A']  // 관찰 조명
        };
    }
    
    /**
     * 전문가용 최적 배합 찾기
     */
    async findProfessionalMix(targetLab, options = {}) {
        const results = [];
        
        // 1. 일반 잉크만으로 계산
        const regularResult = await this.calculateRegularInks(targetLab, options);
        results.push({
            type: 'regular',
            ...regularResult
        });
        
        // 2. 형광 잉크 추천 확인
        if (this.settings.useFluorescent) {
            const fluorRecommendations = this.fluorHandler.recommendFluorescent(targetLab);
            
            if (fluorRecommendations.length > 0) {
                const fluorResult = await this.calculateWithFluorescent(targetLab, options);
                results.push({
                    type: 'fluorescent',
                    ...fluorResult
                });
            }
        }
        
        // 3. 스펙트럼 예측 모델 사용
        if (this.settings.useSpectralPrediction) {
            const spectralResult = await this.calculateWithSpectral(targetLab, options);
            results.push({
                type: 'spectral',
                ...spectralResult
            });
        }
        
        // 4. 최적 결과 선택
        const bestResult = this.selectBestResult(results, targetLab);
        
        // 5. 메타메리즘 체크
        if (this.settings.checkMetamerism && bestResult.spectrum) {
            bestResult.metamerism = this.checkMetamerism(bestResult.spectrum);
        }
        
        // 6. 생산 최적화
        if (this.settings.optimizeForProduction) {
            bestResult.production = this.optimizeForProduction(bestResult);
        }
        
        return this.formatProfessionalResult(bestResult);
    }
    
    /**
     * 일반 잉크 계산
     */
    async calculateRegularInks(targetLab, options) {
        const regularInks = this.allInks.filter(ink => 
            ink.type !== 'fluorescent' && ink.type !== 'metallic'
        );
        
        const result = this.optimizedEngine.findOptimalMix(targetLab, regularInks, {
            maxInks: options.maxInks || 4,
            preferredConcentrations: options.concentrations || [100, 70, 40],
            includeWhite: options.includeWhite !== false,
            costWeight: options.costWeight || 0.2
        });
        
        return {
            ...result,
            formatted: this.optimizedEngine.formatResult(result)
        };
    }
    
    /**
     * 형광 잉크 포함 계산
     */
    async calculateWithFluorescent(targetLab, options) {
        // 모든 잉크 사용
        const result = this.optimizedEngine.findOptimalMix(targetLab, this.allInks, {
            maxInks: options.maxInks || 5,  // 형광 잉크 때문에 1개 더
            preferredConcentrations: options.concentrations || [100, 70, 40],
            includeWhite: options.includeWhite !== false,
            costWeight: options.costWeight || 0.15  // 형광 잉크는 비싸므로 비용 가중치 감소
        });
        
        // 형광 효과 계산
        const inks = result.inks || [];
        const fluorInks = inks.filter(ink => ink.type === 'fluorescent');
        const regularInks = inks.filter(ink => ink.type !== 'fluorescent');
        
        if (fluorInks.length > 0) {
            const fluorEffect = this.fluorHandler.mixWithFluorescent(
                regularInks, 
                fluorInks, 
                result.ratios
            );
            
            result.fluorescenceData = fluorEffect;
            
            // UV 조명 하에서의 예상 색상
            const uvLab = this.fluorHandler.adjustForFluorescence(
                result.mixedLab,
                fluorEffect.effectiveFluorescence,
                fluorEffect.recommendedUVIntensity
            );
            
            result.uvAppearance = uvLab;
        }
        
        return {
            ...result,
            formatted: this.optimizedEngine.formatResult(result)
        };
    }
    
    /**
     * 스펙트럼 예측 모델 사용
     */
    async calculateWithSpectral(targetLab, options) {
        // 초기 배합 계산
        const initialResult = await this.calculateRegularInks(targetLab, options);
        
        if (!initialResult || !initialResult.inks) {
            return initialResult;
        }
        
        // 스펙트럼 예측
        const spectrum = this.colorModel.spectralMixing(
            initialResult.inks,
            initialResult.ratios
        );
        
        // 다양한 조명에서의 Lab 값 예측
        const appearances = {};
        this.settings.viewingIlluminants.forEach(illuminant => {
            appearances[illuminant] = this.colorModel.spectrumToLab(spectrum, illuminant);
        });
        
        // 목표 조명에서의 정확도
        const predictedLab = appearances[this.settings.targetIlluminant];
        const spectralDeltaE = ColorScience.calculateDeltaE00(
            targetLab.L, targetLab.a, targetLab.b,
            predictedLab.L, predictedLab.a, predictedLab.b
        );
        
        return {
            ...initialResult,
            spectrum,
            appearances,
            spectralDeltaE,
            predictedLab
        };
    }
    
    /**
     * 메타메리즘 체크
     */
    checkMetamerism(spectrum) {
        // 표준 백색의 스펙트럼 (간단한 모델)
        const whiteSpectrum = {};
        for (let w = 380; w <= 780; w += 10) {
            whiteSpectrum[w] = 0.9;  // 90% 반사
        }
        
        const metamerismData = this.colorModel.calculateMetamerismIndex(
            spectrum,
            whiteSpectrum,
            this.settings.viewingIlluminants
        );
        
        return {
            ...metamerismData,
            warning: metamerismData.isMetameric ? 
                '⚠️ 조명에 따라 색상이 다르게 보일 수 있습니다' : 
                '✅ 조명 변화에 안정적'
        };
    }
    
    /**
     * 생산 최적화
     */
    optimizeForProduction(result) {
        const productionData = {
            inkSequence: [],
            mixingInstructions: [],
            qualityCheckPoints: [],
            costAnalysis: {}
        };
        
        // 잉크 투입 순서 결정 (밝은 색 → 어두운 색)
        const sortedInks = [...(result.inks || [])]
            .sort((a, b) => {
                const labA = a.lab || a.concentrations?.[100] || { L: 50 };
                const labB = b.lab || b.concentrations?.[100] || { L: 50 };
                return labB.L - labA.L;  // 밝은 것부터
            });
        
        sortedInks.forEach((ink, index) => {
            productionData.inkSequence.push({
                order: index + 1,
                ink: ink.name,
                amount: ink.percentage || ink.ratio * 100,
                concentration: ink.concentration || 100,
                mixing: index === 0 ? '베이스' : '천천히 첨가하며 혼합'
            });
        });
        
        // 혼합 지침
        productionData.mixingInstructions = [
            '1. 모든 잉크를 실온(20-25°C)으로 조절',
            '2. 베이스 잉크부터 시작하여 순서대로 투입',
            '3. 각 잉크 투입 후 2-3분간 충분히 혼합',
            '4. 점도 확인 후 필요시 미디엄 추가',
            '5. 최종 색상 확인 (표준 조명 D50)'
        ];
        
        // 품질 체크 포인트
        productionData.qualityCheckPoints = [
            { stage: '혼합 전', check: '잉크 온도 및 점도 확인' },
            { stage: '50% 혼합', check: '중간 색상 확인, 분산도 체크' },
            { stage: '100% 혼합', check: '최종 색상 측정 (분광광도계)' },
            { stage: '인쇄 테스트', check: '실제 기질에 테스트 인쇄' },
            { stage: '건조 후', check: '건조 후 색상 변화 확인' }
        ];
        
        // 비용 분석
        const totalCost = result.inks?.reduce((sum, ink) => {
            const ratio = ink.ratio || ink.percentage / 100;
            const baseCost = ink.concentration === 100 ? 1.0 :
                           ink.concentration === 70 ? 1.2 : 1.5;
            const fluorCost = ink.type === 'fluorescent' ? 2.5 : 1.0;
            return sum + (ratio * baseCost * fluorCost);
        }, 0) || 0;
        
        productionData.costAnalysis = {
            relativeCost: totalCost.toFixed(2),
            costLevel: totalCost < 1.5 ? '낮음' : 
                      totalCost < 2.5 ? '중간' : '높음',
            costFactors: []
        };
        
        if (result.inks?.some(ink => ink.concentration < 100)) {
            productionData.costAnalysis.costFactors.push('Satin 잉크 사용 (+20-50%)');
        }
        if (result.inks?.some(ink => ink.type === 'fluorescent')) {
            productionData.costAnalysis.costFactors.push('형광 잉크 사용 (+150%)');
        }
        
        return productionData;
    }
    
    /**
     * 최적 결과 선택
     */
    selectBestResult(results, targetLab) {
        // 평가 기준
        const scores = results.map(result => {
            let score = 100;
            
            // Delta E (가장 중요, 50%)
            const deltaE = result.formatted?.deltaE || result.deltaE || 10;
            score -= deltaE * 5;  // Delta E 1당 5점 감점
            
            // 형광 잉크 보너스 (채도가 높은 경우)
            const chroma = Math.sqrt(targetLab.a * targetLab.a + targetLab.b * targetLab.b);
            if (result.type === 'fluorescent' && chroma > 60) {
                score += 10;
            }
            
            // 스펙트럼 예측 보너스 (정확도)
            if (result.type === 'spectral' && result.spectralDeltaE < 2) {
                score += 15;
            }
            
            // 비용 (10%)
            const cost = parseFloat(result.formatted?.cost || result.totalCost || 2);
            score -= cost * 5;
            
            // 잉크 수 (적을수록 좋음, 10%)
            const inkCount = result.inks?.length || 4;
            score -= (inkCount - 2) * 3;
            
            return {
                ...result,
                score
            };
        });
        
        // 최고 점수 선택
        return scores.reduce((best, current) => 
            current.score > best.score ? current : best
        );
    }
    
    /**
     * 전문가용 결과 포맷팅
     */
    formatProfessionalResult(result) {
        const formatted = {
            // 기본 정보
            recipe: result.formatted || result,
            type: result.type,
            
            // 색상 정보
            colorData: {
                target: result.target || result.targetLab,
                achieved: result.mixedLab || result.achievedLab,
                deltaE: result.deltaE || result.formatted?.deltaE,
                quality: result.formatted?.quality || this.assessQuality(result.deltaE)
            },
            
            // 스펙트럼 데이터
            spectralData: result.spectrum ? {
                spectrum: result.spectrum,
                appearances: result.appearances,
                spectralDeltaE: result.spectralDeltaE
            } : null,
            
            // 형광 데이터
            fluorescenceData: result.fluorescenceData ? {
                ...result.fluorescenceData,
                uvAppearance: result.uvAppearance,
                recommendation: '형광 잉크 사용으로 채도 향상'
            } : null,
            
            // 메타메리즘
            metamerism: result.metamerism || null,
            
            // 생산 정보
            production: result.production || null,
            
            // 권장사항
            recommendations: this.generateRecommendations(result)
        };
        
        return formatted;
    }
    
    /**
     * 품질 평가
     */
    assessQuality(deltaE) {
        if (deltaE < 0.5) return 'Perfect';
        if (deltaE < 1.0) return 'Excellent';
        if (deltaE < 2.0) return 'Very Good';
        if (deltaE < 3.0) return 'Good';
        if (deltaE < 5.0) return 'Acceptable';
        return 'Poor';
    }
    
    /**
     * 권장사항 생성
     */
    generateRecommendations(result) {
        const recommendations = [];
        
        // Delta E 기반
        const deltaE = result.deltaE || result.formatted?.deltaE || 0;
        if (deltaE > 5) {
            recommendations.push({
                type: 'critical',
                message: '색차가 크므로 형광 잉크나 추가 잉크 검토 필요'
            });
        } else if (deltaE > 2) {
            recommendations.push({
                type: 'warning',
                message: '약간의 색차가 있으나 실용적 수준'
            });
        }
        
        // 메타메리즘
        if (result.metamerism?.isMetameric) {
            recommendations.push({
                type: 'warning',
                message: '조명에 따른 색상 변화 주의, 고객에게 사전 고지 필요'
            });
        }
        
        // 형광 잉크
        if (result.fluorescenceData) {
            recommendations.push({
                type: 'info',
                message: `UV 조명 강도 ${result.fluorescenceData.recommendedUVIntensity * 100}% 권장`
            });
        }
        
        // 생산
        if (result.production?.costAnalysis?.costLevel === '높음') {
            recommendations.push({
                type: 'info',
                message: '고비용 배합, 대체 옵션 검토 가능'
            });
        }
        
        return recommendations;
    }
}

export default ProfessionalMixingEngine;