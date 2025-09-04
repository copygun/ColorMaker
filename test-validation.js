/**
 * 색상 레시피 계산 검증 테스트
 */

const { baseInks } = require('./core/inkDatabase.js');
const { OptimizedMixingEngine } = require('./core/OptimizedMixingEngine.js');
const { ColorScience } = require('./core/colorScience.js');

console.log('=== 색상 레시피 계산 시스템 검증 ===\n');

// 테스트 케이스 정의
const testCases = [
    // 기본 색상
    { name: '순수 빨강', target: { L: 50, a: 60, b: 40 } },
    { name: '순수 파랑', target: { L: 50, a: 0, b: -50 } },
    { name: '순수 녹색', target: { L: 50, a: -40, b: 30 } },
    { name: '순수 노랑', target: { L: 90, a: 0, b: 80 } },
    
    // 극단적 케이스
    { name: '매우 어두운 색', target: { L: 10, a: 0, b: 0 } },
    { name: '매우 밝은 색', target: { L: 95, a: 0, b: 0 } },
    { name: '극단 녹색', target: { L: 50, a: -80, b: 0 } },
    
    // 실제 사용 케이스
    { name: '연한 핑크', target: { L: 85, a: 15, b: 5 } },
    { name: '네이비', target: { L: 30, a: 0, b: -20 } },
    { name: '올리브', target: { L: 60, a: -10, b: 30 } },
];

const engine = new OptimizedMixingEngine();
const results = [];

// 각 테스트 케이스 실행
testCases.forEach((testCase, index) => {
    console.log(`테스트 ${index + 1}: ${testCase.name}`);
    console.log(`목표: L:${testCase.target.L}, a:${testCase.target.a}, b:${testCase.target.b}`);
    
    try {
        const startTime = Date.now();
        
        // 레시피 계산
        const result = engine.findOptimalMix(testCase.target, baseInks, {
            maxInks: 4,
            includeWhite: true,
            maxResults: 1
        });
        
        const elapsedTime = Date.now() - startTime;
        
        if (result && result.length > 0) {
            const recipe = engine.formatResult(result)[0];
            
            // 결과 검증
            const validation = {
                name: testCase.name,
                target: testCase.target,
                achieved: recipe.achievedLab,
                deltaE: parseFloat(recipe.deltaE),
                inkCount: recipe.inks.length,
                totalRatio: recipe.inks.reduce((sum, ink) => sum + parseFloat(ink.percentage), 0),
                computeTime: elapsedTime,
                quality: recipe.quality
            };
            
            // 문제점 체크
            const issues = [];
            
            // 1. Delta E 체크
            if (validation.deltaE > 10) {
                issues.push(`높은 Delta E: ${validation.deltaE.toFixed(2)}`);
            }
            
            // 2. 비율 합계 체크
            if (Math.abs(validation.totalRatio - 100) > 0.1) {
                issues.push(`비율 합계 오류: ${validation.totalRatio.toFixed(1)}%`);
            }
            
            // 3. 잉크 수 체크
            if (validation.inkCount > 4) {
                issues.push(`과도한 잉크 수: ${validation.inkCount}`);
            }
            
            // 4. 계산 시간 체크
            if (validation.computeTime > 5000) {
                issues.push(`느린 계산: ${validation.computeTime}ms`);
            }
            
            validation.issues = issues;
            results.push(validation);
            
            console.log(`✓ 계산 완료 - Delta E: ${validation.deltaE.toFixed(2)}, 시간: ${validation.computeTime}ms`);
            if (issues.length > 0) {
                console.log(`  ⚠ 문제점: ${issues.join(', ')}`);
            }
        } else {
            results.push({
                name: testCase.name,
                target: testCase.target,
                error: '레시피 계산 실패',
                issues: ['계산 실패']
            });
            console.log(`✗ 계산 실패`);
        }
    } catch (error) {
        results.push({
            name: testCase.name,
            target: testCase.target,
            error: error.message,
            issues: ['예외 발생']
        });
        console.log(`✗ 오류: ${error.message}`);
    }
    
    console.log();
});

// 종합 분석
console.log('=== 종합 분석 ===\n');

const successCount = results.filter(r => !r.error).length;
const failureCount = results.filter(r => r.error).length;
const avgDeltaE = results.filter(r => r.deltaE).reduce((sum, r) => sum + r.deltaE, 0) / successCount || 0;
const avgTime = results.filter(r => r.computeTime).reduce((sum, r) => sum + r.computeTime, 0) / successCount || 0;
const issueCount = results.reduce((sum, r) => sum + (r.issues?.length || 0), 0);

console.log(`성공률: ${successCount}/${testCases.length} (${(successCount/testCases.length*100).toFixed(1)}%)`);
console.log(`평균 Delta E: ${avgDeltaE.toFixed(2)}`);
console.log(`평균 계산 시간: ${avgTime.toFixed(0)}ms`);
console.log(`총 문제점 발견: ${issueCount}개`);

// 문제가 있는 케이스 상세 보고
if (issueCount > 0) {
    console.log('\n=== 문제점 상세 ===\n');
    results.filter(r => r.issues && r.issues.length > 0).forEach(r => {
        console.log(`${r.name}:`);
        r.issues.forEach(issue => console.log(`  - ${issue}`));
    });
}

// 권장사항
console.log('\n=== 권장사항 ===\n');
if (avgDeltaE > 5) {
    console.log('- 평균 Delta E가 높음: 색상 혼합 알고리즘 개선 필요');
}
if (avgTime > 1000) {
    console.log('- 계산 속도가 느림: 최적화 알고리즘 개선 필요');
}
if (failureCount > 0) {
    console.log('- 계산 실패 케이스 존재: 에러 처리 및 경계값 검증 필요');
}
if (issueCount > testCases.length) {
    console.log('- 다수의 문제점 발견: 전반적인 시스템 리팩토링 고려');
}