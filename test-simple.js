const { baseInks } = require('./core/inkDatabase.js');
const { OptimizedMixingEngine } = require('./core/OptimizedMixingEngine.js');

const targetColor = { L: 80, a: -20, b: -30 };
console.log('목표 색상:', targetColor);

// 간단한 테스트 - Cyan과 White만 사용
const testInks = baseInks.filter(ink => ['cyan', 'white'].includes(ink.id));

const engine = new OptimizedMixingEngine();
const result = engine.findOptimalMix(targetColor, testInks, {
    maxInks: 2,
    includeWhite: true,
    maxResults: 1
});

if (result && result.length > 0) {
    const formatted = engine.formatResult(result);
    console.log('\n포맷된 결과:');
    console.log(JSON.stringify(formatted[0], null, 2));
}