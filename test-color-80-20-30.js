const { baseInks } = require('./core/inkDatabase.js');
const { OptimizedMixingEngine } = require('./core/OptimizedMixingEngine.js');

const targetColor = { L: 80, a: -20, b: -30 };
console.log('목표 색상:', targetColor);
console.log('색상 특징: 밝은 청록색 (Light Cyan-Blue)');
console.log('\n=== 잉크 분석 ===');

// 목표 색상과 가장 가까운 잉크들 찾기
const distances = baseInks.map(ink => {
  const lab = ink.concentrations[100];
  const deltaE = Math.sqrt(
    Math.pow(lab.L - targetColor.L, 2) + 
    Math.pow(lab.a - targetColor.a, 2) + 
    Math.pow(lab.b - targetColor.b, 2)
  );
  return { name: ink.name, id: ink.id, deltaE, lab };
}).sort((a, b) => a.deltaE - b.deltaE);

console.log('\n가장 가까운 잉크들 (상위 5개):');
distances.slice(0, 5).forEach(d => {
  console.log(`${d.name.padEnd(15)}: Delta E = ${d.deltaE.toFixed(2)} (L:${d.lab.L}, a:${d.lab.a}, b:${d.lab.b})`);
});

// 레시피 계산
console.log('\n=== 레시피 계산 ===');
const engine = new OptimizedMixingEngine();

// 1. 모든 잉크 사용 최적화
console.log('\n1. 모든 잉크 사용 최적화:');
try {
  const allInks = engine.findOptimalMix(targetColor, baseInks, {
    maxInks: 4,
    includeWhite: true,
    maxResults: 3
  });
  
  if (allInks && allInks.length > 0) {
    allInks.forEach((recipe, idx) => {
      console.log(`\n최적화 레시피 ${idx + 1}:`);
      const inks = recipe.inks.filter(i => i.ratio > 0.1);
      inks.forEach(ink => {
        console.log(`  ${ink.inkId || 'Unknown'}: ${ink.ratio.toFixed(1)}% (농도: ${ink.concentration}%)`);
      });
      console.log(`달성된 색상: L:${recipe.mixed.L.toFixed(1)}, a:${recipe.mixed.a.toFixed(1)}, b:${recipe.mixed.b.toFixed(1)}`);
      console.log(`Delta E: ${recipe.deltaE.toFixed(2)}`);
    });
  }
} catch (error) {
  console.log('오류:', error.message);
}

// 2. 선택된 잉크만 사용 (Cyan, White, Black)
console.log('\n2. 선택된 잉크만 사용 (Cyan, White, Black):');
const selectedInks = baseInks.filter(ink => 
  ['cyan', 'white', 'black'].includes(ink.id)
);

try {
  const selectedRecipe = engine.findOptimalMix(targetColor, selectedInks, {
    maxInks: 3,
    includeWhite: true,
    maxResults: 1
  });
  
  if (selectedRecipe && selectedRecipe.length > 0) {
    const recipe = selectedRecipe[0];
    console.log('\n선택된 잉크 레시피:');
    const inks = recipe.inks.filter(i => i.ratio > 0.1);
    inks.forEach(ink => {
      console.log(`  ${ink.inkId || 'Unknown'}: ${ink.ratio.toFixed(1)}% (농도: ${ink.concentration}%)`);
    });
    console.log(`달성된 색상: L:${recipe.mixed.L.toFixed(1)}, a:${recipe.mixed.a.toFixed(1)}, b:${recipe.mixed.b.toFixed(1)}`);
    console.log(`Delta E: ${recipe.deltaE.toFixed(2)}`);
  }
} catch (error) {
  console.log('오류:', error.message);
}

// 3. 수동 계산 검증
console.log('\n=== 수동 계산 검증 ===');
console.log('Cyan 40% 농도 + White 혼합 시뮬레이션:');

const cyan40 = baseInks.find(i => i.id === 'cyan').concentrations[40];
const white100 = baseInks.find(i => i.id === 'white').concentrations[100];

// 50% Cyan(40%) + 50% White
const mixed50_50 = {
  L: cyan40.L * 0.5 + white100.L * 0.5,
  a: cyan40.a * 0.5 + white100.a * 0.5,
  b: cyan40.b * 0.5 + white100.b * 0.5
};
console.log(`50% Cyan(40%) + 50% White = L:${mixed50_50.L.toFixed(1)}, a:${mixed50_50.a.toFixed(1)}, b:${mixed50_50.b.toFixed(1)}`);

// 30% Cyan(40%) + 70% White
const mixed30_70 = {
  L: cyan40.L * 0.3 + white100.L * 0.7,
  a: cyan40.a * 0.3 + white100.a * 0.7,
  b: cyan40.b * 0.3 + white100.b * 0.7
};
console.log(`30% Cyan(40%) + 70% White = L:${mixed30_70.L.toFixed(1)}, a:${mixed30_70.a.toFixed(1)}, b:${mixed30_70.b.toFixed(1)}`);

console.log('\n=== 분석 결과 ===');
console.log('목표 색상 L:80, a:-20, b:-30은:');
console.log('- 밝은 청록색 계열');
console.log('- Cyan의 40% 농도 (L:78, a:-15, b:-20)와 유사하나 더 파란색');
console.log('- White와 혼합하여 명도 조정 필요');
console.log('- 최적 조합: Cyan(저농도) + White + 약간의 Blue 또는 Turquoise');