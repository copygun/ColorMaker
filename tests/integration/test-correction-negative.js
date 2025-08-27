const { chromium } = require('playwright');

async function testCorrectionNegativeInput() {
  console.log('🧪 색상 보정 섹션 음수 입력 테스트 시작...\n');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 300
  });
  
  const page = await browser.newPage();
  
  try {
    console.log('1. React 애플리케이션 접속...');
    await page.goto('http://localhost:3001');
    await page.waitForTimeout(2000);
    
    // 먼저 레시피를 계산해야 색상 보정 섹션이 나타남
    console.log('2. 레시피 계산하기...');
    
    // 기본적으로 CMYK가 선택되어 있으므로 바로 계산
    // 계산 버튼 클릭
    const calcButton = await page.locator('button:has-text("레시피 계산")').first();
    await calcButton.click();
    await page.waitForTimeout(3000);
    
    // 색상 보정 탭 클릭
    console.log('3. 색상 보정 탭 클릭...');
    const correctionTab = await page.locator('button:has-text("🎯 색상 보정")');
    await correctionTab.click();
    await page.waitForTimeout(1000);
    
    console.log('4. 실제 인쇄된 색상 Lab 입력란 찾기...');
    
    // a* 필드 테스트
    console.log('5. a* 필드 음수 입력 테스트');
    const aInput = await page.locator('.actual-color-input input').nth(1); // 두 번째 input (a*)
    
    await aInput.click();
    await aInput.selectText();
    await page.keyboard.press('Delete');
    
    console.log('   5-1. "-" 입력...');
    await page.keyboard.type('-');
    await page.waitForTimeout(500);
    
    let value = await aInput.inputValue();
    console.log(`   현재 값: "${value}"`);
    
    if (value === '-') {
      console.log('   ✅ 성공: "-" 유지됨');
    } else {
      console.log(`   ❌ 실패: "${value}"로 변경됨`);
    }
    
    console.log('   5-2. "25" 입력...');
    await page.keyboard.type('25');
    await page.waitForTimeout(500);
    
    value = await aInput.inputValue();
    console.log(`   현재 값: "${value}"`);
    
    if (value === '-25') {
      console.log('   ✅ 성공: "-25" 완성');
    } else {
      console.log(`   ❌ 실패: "${value}"로 표시됨`);
    }
    
    // b* 필드 테스트
    console.log('\n6. b* 필드 음수 입력 테스트');
    const bInput = await page.locator('.actual-color-input input').nth(2); // 세 번째 input (b*)
    
    await bInput.click();
    await bInput.selectText();
    await page.keyboard.type('-35');
    await page.waitForTimeout(500);
    
    const bValue = await bInput.inputValue();
    console.log(`   b* 값: "${bValue}"`);
    
    if (bValue === '-35') {
      console.log('   ✅ 성공: b* 필드도 음수 입력 가능');
    } else {
      console.log(`   ❌ 실패: "${bValue}"로 표시됨`);
    }
    
    // blur 테스트
    console.log('\n7. blur 후 값 유지 테스트...');
    await page.keyboard.press('Tab');
    await page.waitForTimeout(1000);
    
    const finalAValue = await aInput.inputValue();
    const finalBValue = await bInput.inputValue();
    
    console.log(`   최종 a* 값: "${finalAValue}"`);
    console.log(`   최종 b* 값: "${finalBValue}"`);
    
    // 스크린샷
    await page.screenshot({ path: 'correction-test-result.png' });
    console.log('\n📸 스크린샷: correction-test-result.png');
    
    // 결과
    console.log('\n========================================');
    if (finalAValue === '-25' && finalBValue === '-35') {
      console.log('✅ 모든 테스트 통과: 색상 보정 Lab 입력란 음수 입력 정상 작동!');
      return true;
    } else {
      console.log('❌ 테스트 실패: 음수 입력 문제 있음');
      return false;
    }
    
  } catch (error) {
    console.error('❌ 테스트 중 오류:', error);
    return false;
  } finally {
    await page.waitForTimeout(3000);
    await browser.close();
  }
}

testCorrectionNegativeInput().then(success => {
  process.exit(success ? 0 : 1);
});