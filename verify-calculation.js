// Lab 50, 0, 0을 위한 수동 계산 검증

const inks = {
    cyan: { L: 55, a: -37, b: -50 },
    magenta: { L: 48, a: 74, b: -3 },
    yellow: { L: 89, a: -5, b: 93 },
    black: { L: 16, a: 0, b: 0 }
};

const target = { L: 50, a: 0, b: 0 };

// 현재 앱에서 나온 결과
const currentResult = {
    cyan: 0.353,
    magenta: 0.194,
    yellow: 0.194,
    black: 0.259
};

// 결과 계산
let mixedL = 0, mixedA = 0, mixedB = 0;
mixedL = inks.cyan.L * currentResult.cyan + 
         inks.magenta.L * currentResult.magenta +
         inks.yellow.L * currentResult.yellow +
         inks.black.L * currentResult.black;

mixedA = inks.cyan.a * currentResult.cyan + 
         inks.magenta.a * currentResult.magenta +
         inks.yellow.a * currentResult.yellow +
         inks.black.a * currentResult.black;

mixedB = inks.cyan.b * currentResult.cyan + 
         inks.magenta.b * currentResult.magenta +
         inks.yellow.b * currentResult.yellow +
         inks.black.b * currentResult.black;

console.log('=== 현재 레시피 검증 ===');
console.log('비율:', currentResult);
console.log('혼합 결과: L=', mixedL.toFixed(1), 'a=', mixedA.toFixed(1), 'b=', mixedB.toFixed(1));
console.log('목표: L=50, a=0, b=0');
console.log('차이: ΔL=', (mixedL - 50).toFixed(1), 'Δa=', mixedA.toFixed(1), 'Δb=', mixedB.toFixed(1));

// 더 나은 레시피 계산 (Black 중심)
console.log('\n=== 개선된 레시피 제안 ===');

// Black이 L=16이므로, L=50을 만들기 위해서는 
// Black 비율이 높고, 밝은 색들로 보정해야 함

// 시뮬레이션 1: Black 60% + CMY 균등 분배
const recipe1 = {
    cyan: 0.133,
    magenta: 0.133,
    yellow: 0.134,
    black: 0.60
};

let L1 = 0, a1 = 0, b1 = 0;
for (let ink in recipe1) {
    L1 += inks[ink].L * recipe1[ink];
    a1 += inks[ink].a * recipe1[ink];
    b1 += inks[ink].b * recipe1[ink];
}

console.log('Recipe 1 (Black 60%):', recipe1);
console.log('결과: L=', L1.toFixed(1), 'a=', a1.toFixed(1), 'b=', b1.toFixed(1));

// 시뮬레이션 2: 미세 조정
const recipe2 = {
    cyan: 0.12,
    magenta: 0.10,
    yellow: 0.08,
    black: 0.70
};

let L2 = 0, a2 = 0, b2 = 0;
for (let ink in recipe2) {
    L2 += inks[ink].L * recipe2[ink];
    a2 += inks[ink].a * recipe2[ink];
    b2 += inks[ink].b * recipe2[ink];
}

console.log('\nRecipe 2 (Black 70%):', recipe2);
console.log('결과: L=', L2.toFixed(1), 'a=', a2.toFixed(1), 'b=', b2.toFixed(1));

// White 추가 시뮬레이션
const recipe3 = {
    cyan: 0.10,
    magenta: 0.08,
    yellow: 0.07,
    black: 0.55,
    white: 0.20  // White 추가
};

inks.white = { L: 95, a: 0, b: 0 };

let L3 = 0, a3 = 0, b3 = 0;
for (let ink in recipe3) {
    L3 += inks[ink].L * recipe3[ink];
    a3 += inks[ink].a * recipe3[ink];
    b3 += inks[ink].b * recipe3[ink];
}

console.log('\nRecipe 3 (White 포함):', recipe3);
console.log('결과: L=', L3.toFixed(1), 'a=', a3.toFixed(1), 'b=', b3.toFixed(1));