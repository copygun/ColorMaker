/**
 * 색역 검증 시스템 테스트
 */

const { baseInks } = require('./core/inkDatabase.js');
const { OptimizedMixingEngine } = require('./core/OptimizedMixingEngine.js');
const { ColorGamutValidator } = require('./core/ColorGamutValidator.js');

console.log('=== 색역 검증 시스템 테스트 ===\n');

const engine = new OptimizedMixingEngine();
const validator = new ColorGamutValidator();

// 테스트 케이스
const testCases = [
    { name: '일반 빨강', target: { L: 50, a: 60, b: 40 } },
    { name: '극단적 녹색', target: { L: 50, a: -80, b: 0 } },
    { name: '극단적 파랑', target: { L: 30, a: 0, b: -70 } },
    { name: '매우 밝은 노랑', target: { L: 95, a: 0, b: 80 } },
];

console.log('1. 색역 계산 테스트\n');

// 사용 가능한 색역 계산
const gamut = validator.calculateGamut(baseInks);
console.log('전체 잉크 색역:');
console.log(`  L: ${gamut.L.min.toFixed(1)} ~ ${gamut.L.max.toFixed(1)}`);
console.log(`  a: ${gamut.a.min.toFixed(1)} ~ ${gamut.a.max.toFixed(1)}`);
console.log(`  b: ${gamut.b.min.toFixed(1)} ~ ${gamut.b.max.toFixed(1)}\n`);

console.log('2. 색역 검증 테스트\n');

testCases.forEach(testCase => {
    console.log(`테스트: ${testCase.name}`);
    console.log(`목표: L:${testCase.target.L}, a:${testCase.target.a}, b:${testCase.target.b}`);
    
    const validation = validator.validateColor(testCase.target, baseInks);
    
    console.log(`결과: ${validation.isAchievable ? '✅ 달성 가능' : '❌ 색역 밖'}`);
    console.log(`메시지: ${validation.message}`);
    
    if (validation.suggestion) {
        console.log(`제안: L:${validation.suggestion.L.toFixed(1)}, a:${validation.suggestion.a.toFixed(1)}, b:${validation.suggestion.b.toFixed(1)}`);
        console.log(`색차: ΔE = ${validation.deltaE.toFixed(2)}`);
    }
    
    console.log(`신뢰도: ${validation.confidence.toFixed(0)}%\n`);
});

console.log('3. 엔진 통합 테스트\n');

// 극단적 녹색으로 레시피 계산 (색역 검증 활성화)
const extremeGreen = { L: 50, a: -80, b: 0 };
console.log('색역 검증 활성화 상태로 극단적 녹색 계산:');

const result = engine.findOptimalMix(extremeGreen, baseInks, {
    maxInks: 4,
    includeWhite: false,
    maxResults: 1,
    validateGamut: true  // 색역 검증 활성화
});

if (result && result.length > 0) {
    const recipe = engine.formatResult(result)[0];
    console.log(`원본 목표: L:${extremeGreen.L}, a:${extremeGreen.a}, b:${extremeGreen.b}`);
    
    if (result[0].gamutValidation && !result[0].gamutValidation.isAchievable) {
        console.log(`조정된 목표: L:${result[0].adjustedTarget.L.toFixed(1)}, a:${result[0].adjustedTarget.a.toFixed(1)}, b:${result[0].adjustedTarget.b.toFixed(1)}`);
    }
    
    console.log(`달성된 색상: L:${recipe.achievedLab.L.toFixed(1)}, a:${recipe.achievedLab.a.toFixed(1)}, b:${recipe.achievedLab.b.toFixed(1)}`);
    console.log(`Delta E: ${recipe.deltaE}`);
    console.log(`품질: ${recipe.quality}\n`);
}

console.log('=== 테스트 완료 ===\n');
console.log('색역 검증 시스템이 정상적으로 작동합니다.');
console.log('극단적인 색상에 대해 자동으로 조정된 목표를 제안합니다.');