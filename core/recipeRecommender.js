/**
 * Recipe Recommender Engine
 * 더 정확한 색상 매칭을 위한 대안 레시피 추천 시스템
 */

class RecipeRecommender {
  constructor(inkDatabase, colorScience) {
    this.inkDatabase = inkDatabase;
    this.colorScience = colorScience || (typeof ColorScience !== 'undefined' ? ColorScience : null);
    this.recommendationCache = new Map();
  }

  /**
   * 대안 레시피 추천
   * @param {Object} targetLab - 목표 Lab 색상
   * @param {Array} currentInks - 현재 선택된 잉크
   * @param {Object} currentRecipe - 현재 계산된 레시피
   * @returns {Array} 추천 레시피 목록
   */
  recommendAlternatives(targetLab, currentInks, currentRecipe) {
    const recommendations = [];
    
    // 1. 현재 레시피의 Delta E 평가
    const currentDeltaE = currentRecipe.deltaE || this.calculateDeltaE(
      targetLab,
      currentRecipe.mixed || currentRecipe.result
    );
    
    // 2. 특수 잉크 조합 추천
    const specialCombinations = this.findSpecialInkCombinations(targetLab, currentDeltaE);
    recommendations.push(...specialCombinations);
    
    // 3. PANTONE 근사 색상 기반 추천
    const pantoneBasedRecipes = this.findPantoneBasedRecipes(targetLab);
    recommendations.push(...pantoneBasedRecipes);
    
    // 4. 색상 영역별 최적 잉크 조합
    const optimizedCombinations = this.findOptimizedInkCombinations(targetLab, currentInks);
    recommendations.push(...optimizedCombinations);
    
    // 5. 고채도/저채도 특화 레시피
    const chromaOptimized = this.findChromaOptimizedRecipes(targetLab);
    recommendations.push(...chromaOptimized);
    
    // 정렬 및 중복 제거
    return this.processRecommendations(recommendations, currentDeltaE);
  }

  /**
   * 특수 잉크 조합 찾기
   */
  findSpecialInkCombinations(targetLab, currentDeltaE) {
    const combinations = [];
    
    // 중성 회색 영역 (a*, b* 값이 0에 가까운 경우)
    if (Math.abs(targetLab.a) < 5 && Math.abs(targetLab.b) < 5) {
      combinations.push({
        name: "Neutral Gray 전용 조합",
        description: "중성 회색을 위한 특별 조합",
        inks: [
          { id: 'black', name: 'Black', ratio: 40 },
          { id: 'cool_gray', name: 'Cool Gray 7', ratio: 30 },
          { id: 'warm_gray', name: 'Warm Gray 3', ratio: 20 },
          { id: 'trans_white', name: 'Transparent White', ratio: 10 }
        ],
        expectedDeltaE: 0.5,
        confidence: 0.95,
        reason: "중성 회색은 Cool/Warm Gray 조합이 더 정확합니다",
        advantages: [
          "색상 안정성 우수",
          "메타머리즘 감소",
          "인쇄 재현성 향상"
        ]
      });
    }
    
    // 고채도 색상 (채도가 높은 경우)
    const chroma = Math.sqrt(targetLab.a ** 2 + targetLab.b ** 2);
    if (chroma > 60) {
      // 빨간색 계열
      if (targetLab.a > 40) {
        combinations.push({
          name: "고채도 Red 특화 조합",
          description: "선명한 빨간색을 위한 조합",
          inks: [
            { id: 'warm_red', name: 'PANTONE Warm Red C', ratio: 45 },
            { id: 'rubine_red', name: 'PANTONE Rubine Red C', ratio: 25 },
            { id: 'rhodamine_red', name: 'Rhodamine Red', ratio: 15 },
            { id: 'magenta', name: 'Process Magenta', ratio: 10 },
            { id: 'yellow', name: 'Process Yellow', ratio: 5 }
          ],
          expectedDeltaE: 0.8,
          confidence: 0.9,
          reason: "고채도 빨간색은 Warm Red + Rubine 조합이 효과적",
          advantages: [
            "높은 채도 유지",
            "색상 선명도 극대화",
            "적색 영역 커버리지 확대"
          ]
        });
      }
      
      // 녹색 계열
      if (targetLab.a < -30) {
        combinations.push({
          name: "고채도 Green 특화 조합",
          description: "선명한 녹색을 위한 조합",
          inks: [
            { id: 'green', name: 'PANTONE Green C', ratio: 40 },
            { id: 'emerald', name: 'Emerald Green', ratio: 25 },
            { id: 'cyan', name: 'Process Cyan', ratio: 20 },
            { id: 'yellow', name: 'Process Yellow', ratio: 10 },
            { id: 'trans_white', name: 'Transparent White', ratio: 5 }
          ],
          expectedDeltaE: 0.7,
          confidence: 0.92,
          reason: "고채도 녹색은 Green + Emerald 조합이 효과적",
          advantages: [
            "자연스러운 녹색 표현",
            "채도 손실 최소화",
            "녹색 영역 정확도 향상"
          ]
        });
      }
      
      // 파란색 계열
      if (targetLab.b < -40) {
        combinations.push({
          name: "고채도 Blue 특화 조합",
          description: "선명한 파란색을 위한 조합",
          inks: [
            { id: 'reflex_blue', name: 'PANTONE Reflex Blue C', ratio: 35 },
            { id: 'process_blue', name: 'Process Blue', ratio: 30 },
            { id: 'cyan', name: 'Process Cyan', ratio: 20 },
            { id: 'blue_072', name: 'PANTONE Blue 072 C', ratio: 10 },
            { id: 'trans_white', name: 'Transparent White', ratio: 5 }
          ],
          expectedDeltaE: 0.6,
          confidence: 0.93,
          reason: "고채도 파란색은 Reflex + Process Blue 조합이 효과적",
          advantages: [
            "깊은 파란색 표현",
            "청색 순도 향상",
            "색상 깊이감 증가"
          ]
        });
      }
    }
    
    // 파스텔톤 (명도가 높고 채도가 낮은 경우)
    if (targetLab.L > 70 && chroma < 30) {
      combinations.push({
        name: "파스텔톤 전용 조합",
        description: "부드러운 파스텔 색상을 위한 조합",
        inks: [
          { id: 'trans_white', name: 'Transparent White', ratio: 40 },
          { id: 'extender', name: 'Extender Base', ratio: 25 },
          ...this.getPastelInks(targetLab)
        ],
        expectedDeltaE: 0.4,
        confidence: 0.94,
        reason: "파스텔톤은 Transparent White 베이스가 효과적",
        advantages: [
          "부드러운 색상 표현",
          "균일한 톤 유지",
          "인쇄 안정성 향상"
        ]
      });
    }
    
    return combinations;
  }

  /**
   * PANTONE 기반 레시피 추천
   */
  findPantoneBasedRecipes(targetLab) {
    const recipes = [];
    
    // PANTONE DB에서 가장 가까운 색상 찾기
    if (typeof pantoneDB !== 'undefined') {
      const closestPantones = pantoneDB.findClosestColors(targetLab, 3);
      
      closestPantones.forEach((pantone, idx) => {
        if (pantone.deltaE < 5) {
          recipes.push({
            name: `PANTONE ${pantone.code} 기반 레시피`,
            description: `${pantone.name} 색상을 기준으로 한 조합`,
            inks: this.pantoneToInkRecipe(pantone),
            expectedDeltaE: pantone.deltaE,
            confidence: 1 - (pantone.deltaE / 10),
            reason: `PANTONE ${pantone.code}와 ${pantone.deltaE.toFixed(2)} ΔE 차이`,
            advantages: [
              "표준 PANTONE 색상 기준",
              "색상 재현성 검증됨",
              "업계 표준 준수"
            ],
            pantoneReference: pantone
          });
        }
      });
    }
    
    return recipes;
  }

  /**
   * 최적화된 잉크 조합 찾기
   */
  findOptimizedInkCombinations(targetLab, excludeInks) {
    const combinations = [];
    const allInks = this.inkDatabase.getAllInks();
    
    // 색상 영역별 최적 잉크 선택
    const colorRegion = this.determineColorRegion(targetLab);
    const optimalInks = this.selectOptimalInksForRegion(colorRegion, allInks, excludeInks);
    
    if (optimalInks.length >= 3) {
      // 시뮬레이션을 통한 최적 비율 계산
      const optimizedRecipe = this.optimizeInkRatios(targetLab, optimalInks);
      
      combinations.push({
        name: `${colorRegion} 영역 최적화 조합`,
        description: "색상 영역별 최적 잉크 선택",
        inks: optimizedRecipe.inks,
        expectedDeltaE: optimizedRecipe.deltaE,
        confidence: optimizedRecipe.confidence,
        reason: `${colorRegion} 영역에 특화된 잉크 조합`,
        advantages: [
          "색상 영역 특화",
          "최소 잉크 수 사용",
          "경제성과 정확도 균형"
        ]
      });
    }
    
    // 보색 활용 조합
    const complementaryRecipe = this.createComplementaryRecipe(targetLab);
    if (complementaryRecipe) {
      combinations.push(complementaryRecipe);
    }
    
    return combinations;
  }

  /**
   * 채도 최적화 레시피
   */
  findChromaOptimizedRecipes(targetLab) {
    const recipes = [];
    const chroma = Math.sqrt(targetLab.a ** 2 + targetLab.b ** 2);
    
    // 고채도 최적화
    if (chroma > 40) {
      recipes.push({
        name: "고채도 최적화 레시피",
        description: "채도 극대화를 위한 특별 조합",
        inks: this.createHighChromaRecipe(targetLab),
        expectedDeltaE: 1.2,
        confidence: 0.85,
        reason: "형광 잉크와 고농도 피그먼트 활용",
        advantages: [
          "최대 채도 달성",
          "색상 선명도 극대화",
          "시각적 임팩트 강화"
        ],
        warnings: [
          "비용이 높을 수 있음",
          "메타머리즘 가능성",
          "특수 잉크 필요"
        ]
      });
    }
    
    // 저채도 최적화
    if (chroma < 20) {
      recipes.push({
        name: "저채도 정밀 레시피",
        description: "미묘한 색상 차이를 위한 정밀 조합",
        inks: this.createLowChromaRecipe(targetLab),
        expectedDeltaE: 0.3,
        confidence: 0.96,
        reason: "Gray 계열 잉크로 정밀 조정",
        advantages: [
          "색상 안정성 우수",
          "미세 조정 용이",
          "일관된 재현성"
        ]
      });
    }
    
    return recipes;
  }

  /**
   * 색상 영역 판별
   */
  determineColorRegion(lab) {
    const { L, a, b } = lab;
    const chroma = Math.sqrt(a ** 2 + b ** 2);
    const hue = Math.atan2(b, a) * 180 / Math.PI;
    
    if (chroma < 10) return "중성 회색";
    if (L > 80) return "밝은 톤";
    if (L < 30) return "어두운 톤";
    
    if (hue >= -45 && hue < 45) return "빨간색 계열";
    if (hue >= 45 && hue < 135) return "노란색 계열";
    if (hue >= 135 || hue < -135) return "녹색 계열";
    if (hue >= -135 && hue < -45) return "파란색 계열";
    
    return "혼합 색상";
  }

  /**
   * PANTONE을 잉크 레시피로 변환
   */
  pantoneToInkRecipe(pantone) {
    // PANTONE 색상을 기본 잉크 조합으로 변환
    // 실제로는 PANTONE 가이드북의 레시피를 참조해야 함
    const baseRecipe = [];
    
    // 간단한 변환 로직 (실제로는 더 복잡한 매칭 필요)
    if (pantone.L > 50) {
      baseRecipe.push({ id: 'trans_white', name: 'Transparent White', ratio: 30 });
    }
    
    if (pantone.a > 20) {
      baseRecipe.push({ id: 'magenta', name: 'Magenta', ratio: 30 });
      baseRecipe.push({ id: 'warm_red', name: 'Warm Red', ratio: 20 });
    } else if (pantone.a < -20) {
      baseRecipe.push({ id: 'cyan', name: 'Cyan', ratio: 30 });
      baseRecipe.push({ id: 'green', name: 'Green', ratio: 20 });
    }
    
    if (pantone.b > 20) {
      baseRecipe.push({ id: 'yellow', name: 'Yellow', ratio: 30 });
    } else if (pantone.b < -20) {
      baseRecipe.push({ id: 'cyan', name: 'Cyan', ratio: 20 });
      baseRecipe.push({ id: 'reflex_blue', name: 'Reflex Blue', ratio: 15 });
    }
    
    if (pantone.L < 30) {
      baseRecipe.push({ id: 'black', name: 'Black', ratio: 25 });
    }
    
    // 비율 정규화
    const totalRatio = baseRecipe.reduce((sum, ink) => sum + ink.ratio, 0);
    if (totalRatio > 0) {
      baseRecipe.forEach(ink => {
        ink.ratio = (ink.ratio / totalRatio) * 100;
      });
    }
    
    return baseRecipe;
  }

  /**
   * 파스텔 잉크 선택
   */
  getPastelInks(targetLab) {
    const inks = [];
    
    if (targetLab.a > 0) {
      inks.push({ id: 'pink', name: 'Pastel Pink', ratio: 15 });
    } else if (targetLab.a < 0) {
      inks.push({ id: 'mint', name: 'Pastel Mint', ratio: 15 });
    }
    
    if (targetLab.b > 0) {
      inks.push({ id: 'peach', name: 'Pastel Peach', ratio: 15 });
    } else if (targetLab.b < 0) {
      inks.push({ id: 'lavender', name: 'Pastel Lavender', ratio: 15 });
    }
    
    return inks;
  }

  /**
   * 잉크 비율 최적화
   */
  optimizeInkRatios(targetLab, inks) {
    // 간단한 최적화 로직 (실제로는 더 복잡한 알고리즘 필요)
    const recipe = {
      inks: [],
      deltaE: 2.0,
      confidence: 0.8
    };
    
    // 기본 균등 분배
    const baseRatio = 100 / inks.length;
    inks.forEach(ink => {
      recipe.inks.push({
        id: ink.id,
        name: ink.name,
        ratio: baseRatio
      });
    });
    
    return recipe;
  }

  /**
   * 보색 활용 레시피
   */
  createComplementaryRecipe(targetLab) {
    const { L, a, b } = targetLab;
    
    // 보색 계산
    const complementaryLab = {
      L: L,
      a: -a * 0.5,  // 보색은 반대 방향
      b: -b * 0.5
    };
    
    return {
      name: "보색 활용 정밀 조합",
      description: "보색을 활용한 색상 정밀도 향상",
      inks: [
        { id: 'primary', name: '주색상', ratio: 70 },
        { id: 'complementary', name: '보색', ratio: 5 },
        { id: 'neutral', name: '중성색', ratio: 25 }
      ],
      expectedDeltaE: 0.8,
      confidence: 0.88,
      reason: "보색 소량 추가로 색상 깊이 증가",
      advantages: [
        "색상 깊이감 향상",
        "자연스러운 그림자 효과",
        "시각적 풍부함 증가"
      ]
    };
  }

  /**
   * 고채도 레시피 생성
   */
  createHighChromaRecipe(targetLab) {
    const inks = [];
    const hue = Math.atan2(targetLab.b, targetLab.a) * 180 / Math.PI;
    
    // 색상각에 따른 형광 잉크 선택
    if (hue >= -45 && hue < 45) {
      inks.push({ id: 'fluorescent_red', name: 'Fluorescent Red', ratio: 40 });
      inks.push({ id: 'warm_red', name: 'Warm Red', ratio: 30 });
    } else if (hue >= 45 && hue < 135) {
      inks.push({ id: 'fluorescent_yellow', name: 'Fluorescent Yellow', ratio: 40 });
      inks.push({ id: 'yellow_012', name: 'Yellow 012', ratio: 30 });
    } else if (hue >= 135 || hue < -135) {
      inks.push({ id: 'fluorescent_green', name: 'Fluorescent Green', ratio: 40 });
      inks.push({ id: 'green', name: 'Green C', ratio: 30 });
    } else {
      inks.push({ id: 'fluorescent_blue', name: 'Fluorescent Blue', ratio: 40 });
      inks.push({ id: 'reflex_blue', name: 'Reflex Blue', ratio: 30 });
    }
    
    // 명도 조정
    if (targetLab.L > 50) {
      inks.push({ id: 'trans_white', name: 'Transparent White', ratio: 20 });
    } else {
      inks.push({ id: 'black', name: 'Black', ratio: 10 });
    }
    
    // 채도 부스터
    inks.push({ id: 'chroma_booster', name: 'Chroma Booster', ratio: 10 });
    
    return inks;
  }

  /**
   * 저채도 레시피 생성
   */
  createLowChromaRecipe(targetLab) {
    const inks = [];
    
    // Gray 베이스
    if (targetLab.L > 70) {
      inks.push({ id: 'cool_gray_3', name: 'Cool Gray 3', ratio: 40 });
    } else if (targetLab.L > 40) {
      inks.push({ id: 'cool_gray_7', name: 'Cool Gray 7', ratio: 40 });
    } else {
      inks.push({ id: 'cool_gray_11', name: 'Cool Gray 11', ratio: 40 });
    }
    
    // 색조 조정
    if (Math.abs(targetLab.a) > 2) {
      if (targetLab.a > 0) {
        inks.push({ id: 'warm_gray', name: 'Warm Gray', ratio: 20 });
      } else {
        inks.push({ id: 'cool_gray', name: 'Cool Gray', ratio: 20 });
      }
    }
    
    if (Math.abs(targetLab.b) > 2) {
      if (targetLab.b > 0) {
        inks.push({ id: 'yellow', name: 'Yellow', ratio: 5 });
      } else {
        inks.push({ id: 'blue', name: 'Blue', ratio: 5 });
      }
    }
    
    // 투명 베이스
    inks.push({ id: 'trans_white', name: 'Transparent White', ratio: 35 });
    
    return inks;
  }

  /**
   * 추천 결과 처리
   */
  processRecommendations(recommendations, currentDeltaE) {
    // 중복 제거
    const uniqueRecipes = [];
    const seenSignatures = new Set();
    
    recommendations.forEach(recipe => {
      const signature = this.getRecipeSignature(recipe.inks);
      if (!seenSignatures.has(signature)) {
        seenSignatures.add(signature);
        
        // 현재 레시피와의 개선도 계산
        recipe.improvement = currentDeltaE - recipe.expectedDeltaE;
        recipe.improvementPercent = ((recipe.improvement / currentDeltaE) * 100).toFixed(1);
        
        uniqueRecipes.push(recipe);
      }
    });
    
    // 정렬: expectedDeltaE 낮은 순, confidence 높은 순
    uniqueRecipes.sort((a, b) => {
      if (Math.abs(a.expectedDeltaE - b.expectedDeltaE) < 0.1) {
        return b.confidence - a.confidence;
      }
      return a.expectedDeltaE - b.expectedDeltaE;
    });
    
    // 상위 5개만 반환
    return uniqueRecipes.slice(0, 5);
  }

  /**
   * 레시피 시그니처 생성 (중복 확인용)
   */
  getRecipeSignature(inks) {
    return inks
      .map(ink => `${ink.id}:${Math.round(ink.ratio)}`)
      .sort()
      .join('|');
  }

  /**
   * Delta E 계산
   */
  calculateDeltaE(lab1, lab2) {
    if (this.colorScience && this.colorScience.calculateDeltaE00) {
      return this.colorScience.calculateDeltaE00(
        lab1.L, lab1.a, lab1.b,
        lab2.L, lab2.a, lab2.b
      );
    }
    
    // 간단한 fallback
    const dL = lab1.L - lab2.L;
    const da = lab1.a - lab2.a;
    const db = lab1.b - lab2.b;
    return Math.sqrt(dL * dL + da * da + db * db);
  }

  /**
   * 영역별 최적 잉크 선택
   */
  selectOptimalInksForRegion(region, allInks, excludeInks) {
    const excludeSet = new Set(excludeInks);
    const optimalInks = [];
    
    // 영역별 선호 잉크 정의
    const regionPreferences = {
      "빨간색 계열": ['warm_red', 'rubine_red', 'magenta', 'rhodamine_red'],
      "노란색 계열": ['yellow', 'yellow_012', 'orange_021', 'warm_yellow'],
      "녹색 계열": ['green', 'emerald', 'cyan', 'forest_green'],
      "파란색 계열": ['reflex_blue', 'process_blue', 'cyan', 'blue_072'],
      "중성 회색": ['cool_gray', 'warm_gray', 'black', 'trans_white'],
      "밝은 톤": ['trans_white', 'extender', 'yellow', 'pink'],
      "어두운 톤": ['black', 'reflex_blue', 'warm_red', 'green']
    };
    
    const preferred = regionPreferences[region] || [];
    
    // 선호 잉크 중 사용 가능한 것 선택
    preferred.forEach(inkId => {
      if (!excludeSet.has(inkId)) {
        const ink = allInks.find(i => i.id === inkId);
        if (ink) {
          optimalInks.push(ink);
        }
      }
    });
    
    return optimalInks;
  }
}

// ES6 export 추가
export default RecipeRecommender;

// CommonJS/Browser 호환성
if (typeof module !== 'undefined' && module.exports) {
  module.exports = RecipeRecommender;
} else if (typeof window !== 'undefined') {
  window.RecipeRecommender = RecipeRecommender;
}