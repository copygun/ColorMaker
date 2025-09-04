const { baseInks } = require('./core/inkDatabase.js');
const { OptimizedMixingEngine } = require('./core/OptimizedMixingEngine.js');

const targetColor = { L: 20, a: -80, b: -30 };
console.log('목표 색상:', targetColor);
console.log('\n사용 가능한 잉크들의 Lab 범위:');

// 각 잉크의 Lab 범위 확인
baseInks.forEach(ink => {
  const lab100 = ink.concentrations[100];
  console.log(`${ink.name.padEnd(15)} (100%): L:${lab100.L}, a:${lab100.a}, b:${lab100.b}`);
});

// 가장 가까운 색상 찾기
console.log('\n목표 색상과 각 잉크의 거리:');
const distances = baseInks.map(ink => {
  const lab = ink.concentrations[100];
  const deltaE = Math.sqrt(
    Math.pow(lab.L - targetColor.L, 2) + 
    Math.pow(lab.a - targetColor.a, 2) + 
    Math.pow(lab.b - targetColor.b, 2)
  );
  return { name: ink.name, deltaE, lab };
}).sort((a, b) => a.deltaE - b.deltaE);

distances.forEach(d => {
  console.log(`${d.name.padEnd(15)}: Delta E = ${d.deltaE.toFixed(2)} (L:${d.lab.L}, a:${d.lab.a}, b:${d.lab.b})`);
});

// 문제 분석
console.log('\n=== 문제 분석 ===');
console.log('목표 색상 특징:');
console.log('- L*: 20 (매우 어두움, Black L*:16과 유사)');
console.log('- a*: -80 (극도로 강한 녹색, 일반 잉크 범위 초과)');
console.log('- b*: -30 (중간 정도의 파란색)');
console.log('\n가장 녹색인 잉크들:');
console.log('- Cyan: a*=-37 (목표 -80과 43 차이)');
console.log('- Turquoise: a*=-48 (목표 -80과 32 차이)');
console.log('- Teal: a*=-45 (목표 -80과 35 차이)');
console.log('- Green: a*=-40 (목표 -80과 40 차이)');

// 레시피 계산
console.log('\n=== 레시피 계산 시도 ===');
const engine = new OptimizedMixingEngine();
try {
  const result = engine.findOptimalMix(targetColor, baseInks, {
    maxInks: 5,
    includeWhite: false,
    maxResults: 3
  });
  
  if (result && result.length > 0) {
    result.forEach((recipe, idx) => {
      console.log(`\n레시피 ${idx + 1}:`);
      const inks = recipe.inks.filter(i => i.ratio > 0);
      inks.forEach(ink => {
        console.log(`  ${ink.inkId}: ${ink.ratio.toFixed(1)}%`);
      });
      console.log(`달성된 색상: L:${recipe.mixed.L.toFixed(1)}, a:${recipe.mixed.a.toFixed(1)}, b:${recipe.mixed.b.toFixed(1)}`);
      console.log(`Delta E: ${recipe.deltaE.toFixed(2)}`);
      console.log(`목표와의 차이: ΔL:${(recipe.mixed.L - targetColor.L).toFixed(1)}, Δa:${(recipe.mixed.a - targetColor.a).toFixed(1)}, Δb:${(recipe.mixed.b - targetColor.b).toFixed(1)}`);
    });
  } else {
    console.log('레시피를 찾을 수 없음');
  }
} catch (error) {
  console.log('오류:', error.message);
  console.log(error.stack);
}

// 이론적 한계 분석
console.log('\n=== 이론적 한계 분석 ===');
console.log('현재 잉크 시스템의 한계:');
console.log('1. a* 축 녹색 방향 최대값: -48 (Turquoise)');
console.log('2. 목표 a*: -80 (현재 시스템으로 달성 불가능)');
console.log('3. 필요한 추가 잉크: 더 강한 녹색 특수 잉크 (예: Phthalo Green)');
console.log('\n권장사항:');
console.log('- 이런 극단적인 색상은 일반 CMYK 시스템으로 재현 불가능');
console.log('- 특수 녹색 잉크 추가 필요');
console.log('- 또는 목표 색상을 현실적인 범위로 조정');