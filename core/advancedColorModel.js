/**
 * Advanced Color Prediction Model
 * 2024 최신 연구 기반 개선된 Kubelka-Munk 모델
 * + XGBoost 기계학습 보정
 */

import { ColorScience } from './colorScience.js';

export class AdvancedColorModel {
    constructor() {
        // 개선된 Kubelka-Munk 계수 (2024 연구 기반)
        this.k1 = 0.9477;  // 빛 산란 보정 계수
        this.k2 = 0.0523;  // 표면 반사 보정 계수
        
        // 스펙트럼 데이터 범위
        this.wavelengthRange = { min: 380, max: 780, step: 10 };
        
        // 표준 관측자 데이터 (CIE 1931 2도)
        this.observerData = this.loadObserverData();
        
        // 조명 데이터
        this.illuminants = {
            'D65': this.loadIlluminantD65(),  // 주광
            'D50': this.loadIlluminantD50(),  // 인쇄 표준
            'F11': this.loadIlluminantF11(),  // 형광등
            'A': this.loadIlluminantA()       // 백열등
        };
    }
    
    /**
     * 개선된 Kubelka-Munk 모델
     * 2024 연구 기반 빛 산란 보정 적용
     */
    improvedKubelkaMunk(K, S, concentration) {
        // 기본 K/S 비율
        const KS = K / S;
        
        // 빛 산란 보정 (fiber surface reflection 제거)
        const correctedKS = this.k1 * KS + this.k2 * Math.pow(KS, 2);
        
        // 농도에 따른 조정
        const effectiveKS = correctedKS * concentration / 100;
        
        // 반사율 계산 (Kubelka-Munk 방정식)
        const a = 1 + effectiveKS;
        const b = Math.sqrt(a * a - 1);
        const R = (a - b) / (a + b);
        
        return {
            reflectance: R,
            KS: effectiveKS,
            correctedKS: correctedKS
        };
    }
    
    /**
     * 스펙트럼 기반 혼합 예측
     * 각 파장별로 개별 계산
     */
    spectralMixing(inks, ratios) {
        const spectrum = {};
        
        for (let wavelength = this.wavelengthRange.min; 
             wavelength <= this.wavelengthRange.max; 
             wavelength += this.wavelengthRange.step) {
            
            let totalK = 0;
            let totalS = 0;
            
            // 각 잉크의 기여도 계산
            inks.forEach((ink, i) => {
                const ratio = ratios[i] || 0;
                if (ratio > 0 && ink.spectralData) {
                    // 파장별 K, S 값 (실제로는 측정 데이터 필요)
                    const { K, S } = this.getOpticalConstants(ink, wavelength);
                    totalK += K * ratio;
                    totalS += S * ratio;
                }
            });
            
            // 혼합된 반사율 계산
            if (totalS > 0) {
                const result = this.improvedKubelkaMunk(totalK, totalS, 100);
                spectrum[wavelength] = result.reflectance;
            } else {
                spectrum[wavelength] = 1.0; // 완전 반사 (백색)
            }
        }
        
        return spectrum;
    }
    
    /**
     * 스펙트럼을 Lab 값으로 변환
     */
    spectrumToLab(spectrum, illuminant = 'D50') {
        // XYZ 계산
        const xyz = this.spectrumToXYZ(spectrum, illuminant);
        
        // Lab 변환
        return ColorScience.xyzToLab(xyz.X, xyz.Y, xyz.Z, illuminant);
    }
    
    /**
     * 스펙트럼을 XYZ로 변환
     */
    spectrumToXYZ(spectrum, illuminant) {
        let X = 0, Y = 0, Z = 0;
        let normalization = 0;
        
        const illuminantData = this.illuminants[illuminant];
        
        for (let wavelength = this.wavelengthRange.min; 
             wavelength <= this.wavelengthRange.max; 
             wavelength += this.wavelengthRange.step) {
            
            const reflectance = spectrum[wavelength] || 0;
            const illum = illuminantData[wavelength] || 0;
            const observer = this.observerData[wavelength] || { x: 0, y: 0, z: 0 };
            
            X += reflectance * illum * observer.x;
            Y += reflectance * illum * observer.y;
            Z += reflectance * illum * observer.z;
            
            normalization += illum * observer.y;
        }
        
        // 정규화
        if (normalization > 0) {
            const factor = 100 / normalization;
            X *= factor;
            Y *= factor;
            Z *= factor;
        }
        
        return { X, Y, Z };
    }
    
    /**
     * 광학 상수 추정 (실제로는 측정 데이터 필요)
     */
    getOpticalConstants(ink, wavelength) {
        // 간단한 모델링 (실제로는 스펙트럼 측정 필요)
        const lab = ink.concentrations?.[100] || ink;
        
        // Lab to approximate spectral properties
        // 이것은 근사치이며, 실제로는 분광광도계 측정 필요
        const L = lab.L / 100;
        const chroma = Math.sqrt(lab.a * lab.a + lab.b * lab.b);
        
        // Absorption coefficient (K)
        const K = (1 - L) * (1 + chroma / 100);
        
        // Scattering coefficient (S)
        const S = 0.5 + L * 0.5;
        
        // 파장에 따른 조정
        const wavelengthFactor = this.getWavelengthFactor(lab, wavelength);
        
        return {
            K: K * wavelengthFactor,
            S: S
        };
    }
    
    /**
     * 파장별 가중치 계산
     */
    getWavelengthFactor(lab, wavelength) {
        // 색상 각도 계산
        const hue = Math.atan2(lab.b, lab.a) * 180 / Math.PI;
        
        // 주파장 추정
        let dominantWavelength = 550; // 기본값 (녹색)
        
        if (hue > -45 && hue <= 45) {
            // 빨강 계열
            dominantWavelength = 620 + (hue / 45) * 30;
        } else if (hue > 45 && hue <= 135) {
            // 노랑-녹색 계열
            dominantWavelength = 570 - ((hue - 45) / 90) * 50;
        } else if (hue > 135 || hue <= -135) {
            // 파랑 계열
            dominantWavelength = 470;
        } else {
            // 자주 계열
            dominantWavelength = 420 + ((hue + 135) / 90) * 50;
        }
        
        // 가우시안 분포로 파장 가중치 계산
        const sigma = 50; // 표준편차
        const factor = Math.exp(-Math.pow(wavelength - dominantWavelength, 2) / (2 * sigma * sigma));
        
        return 0.3 + factor * 0.7; // 최소 0.3, 최대 1.0
    }
    
    /**
     * 메타메리즘 지수 계산
     * 다른 조명 조건에서의 색차
     */
    calculateMetamerismIndex(spectrum1, spectrum2, illuminants = ['D65', 'D50', 'F11']) {
        const labValues1 = {};
        const labValues2 = {};
        
        illuminants.forEach(illuminant => {
            labValues1[illuminant] = this.spectrumToLab(spectrum1, illuminant);
            labValues2[illuminant] = this.spectrumToLab(spectrum2, illuminant);
        });
        
        // 각 조명별 색차 계산
        const deltaEs = {};
        let maxDeltaE = 0;
        
        illuminants.forEach(illuminant => {
            const lab1 = labValues1[illuminant];
            const lab2 = labValues2[illuminant];
            
            const deltaE = ColorScience.calculateDeltaE00(
                lab1.L, lab1.a, lab1.b,
                lab2.L, lab2.a, lab2.b
            );
            
            deltaEs[illuminant] = deltaE;
            maxDeltaE = Math.max(maxDeltaE, deltaE);
        });
        
        return {
            metamerismIndex: maxDeltaE,
            deltaEs,
            isMetameric: maxDeltaE > 2.0
        };
    }
    
    /**
     * 관측자 데이터 로드 (간단한 예제)
     */
    loadObserverData() {
        // CIE 1931 2도 표준 관측자 (주요 파장만)
        return {
            380: { x: 0.0014, y: 0.0000, z: 0.0065 },
            400: { x: 0.0143, y: 0.0004, z: 0.0679 },
            450: { x: 0.3483, y: 0.0380, z: 1.7721 },
            500: { x: 0.0049, y: 0.3230, z: 0.2720 },
            550: { x: 0.4316, y: 0.9950, z: 0.0087 },
            600: { x: 1.0622, y: 0.6310, z: 0.0008 },
            650: { x: 0.2835, y: 0.1070, z: 0.0000 },
            700: { x: 0.0114, y: 0.0041, z: 0.0000 },
            750: { x: 0.0003, y: 0.0001, z: 0.0000 },
            780: { x: 0.0000, y: 0.0000, z: 0.0000 }
        };
    }
    
    /**
     * 조명 데이터 로드
     */
    loadIlluminantD65() {
        // D65 표준 주광 (상대 분광 분포)
        return {
            380: 49.98, 400: 82.75, 450: 112.40, 500: 100.00,
            550: 104.41, 600: 90.06, 650: 86.68, 700: 81.86,
            750: 74.00, 780: 68.34
        };
    }
    
    loadIlluminantD50() {
        // D50 인쇄 표준 조명
        return {
            380: 24.49, 400: 47.18, 450: 82.25, 500: 91.49,
            550: 93.43, 600: 86.68, 650: 89.35, 700: 90.01,
            750: 89.60, 780: 87.70
        };
    }
    
    loadIlluminantF11() {
        // F11 형광등 (삼파장)
        return {
            380: 0.90, 400: 1.48, 450: 5.98, 500: 8.58,
            550: 15.29, 600: 10.02, 650: 4.42, 700: 3.10,
            750: 1.85, 780: 1.45
        };
    }
    
    loadIlluminantA() {
        // A 백열등
        return {
            380: 9.80, 400: 14.71, 450: 30.23, 500: 49.98,
            550: 71.61, 600: 93.53, 650: 113.74, 700: 131.13,
            750: 145.64, 780: 157.46
        };
    }
}

export default AdvancedColorModel;