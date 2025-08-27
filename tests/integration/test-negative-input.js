const { chromium } = require('playwright');

async function testNegativeInput() {
  console.log('🧪 음수 입력 테스트 시작...\n');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 500 // 각 동작 사이 0.5초 대기
  });
  
  const page = await browser.newPage();
  
  try {
    // React 앱 열기
    console.log('1. React 애플리케이션 접속 중...');
    await page.goto('http://localhost:3001');
    await page.waitForTimeout(2000);
    
    // a* 입력 필드 찾기
    console.log('2. a* 입력 필드 찾기...');
    const aInput = await page.locator('input#lab-a');
    
    // 현재 값 확인
    const initialValue = await aInput.inputValue();
    console.log(`   초기값: "${initialValue}"`);
    
    // 필드 클리어하고 포커스
    console.log('\n3. a* 필드에 음수 입력 테스트');
    await aInput.click();
    await aInput.selectText();
    await page.keyboard.press('Delete');
    
    // '-' 입력
    console.log('   3-1. "-" 키 입력...');
    await page.keyboard.type('-', { delay: 100 });
    await page.waitForTimeout(500);
    
    let currentValue = await aInput.inputValue();
    console.log(`   현재 입력 필드 값: "${currentValue}"`);
    
    if (currentValue === '-') {
      console.log('   ✅ 성공: "-" 문자가 유지됨');
    } else {
      console.log(`   ❌ 실패: "-" 입력 시 "${currentValue}"로 변경됨`);
      await browser.close();
      return false;
    }
    
    // '5' 입력
    console.log('   3-2. "5" 키 입력...');
    await page.keyboard.type('5', { delay: 100 });
    await page.waitForTimeout(500);
    
    currentValue = await aInput.inputValue();
    console.log(`   현재 입력 필드 값: "${currentValue}"`);
    
    if (currentValue === '-5') {
      console.log('   ✅ 성공: "-5" 표시됨');
    } else {
      console.log(`   ❌ 실패: 예상 "-5", 실제 "${currentValue}"`);
    }
    
    // '0' 입력
    console.log('   3-3. "0" 키 입력...');
    await page.keyboard.type('0', { delay: 100 });
    await page.waitForTimeout(500);
    
    currentValue = await aInput.inputValue();
    console.log(`   현재 입력 필드 값: "${currentValue}"`);
    
    if (currentValue === '-50') {
      console.log('   ✅ 성공: "-50" 완성됨');
    } else {
      console.log(`   ❌ 실패: 예상 "-50", 실제 "${currentValue}"`);
    }
    
    // blur 이벤트 발생
    console.log('\n4. blur 이벤트 테스트 (Tab 키)...');
    await page.keyboard.press('Tab');
    await page.waitForTimeout(1000);
    
    const finalValue = await aInput.inputValue();
    console.log(`   blur 후 최종값: "${finalValue}"`);
    
    if (finalValue === '-50') {
      console.log('   ✅ 성공: 음수 값이 유지됨');
    } else {
      console.log(`   ❌ 실패: blur 후 값이 "${finalValue}"로 변경됨`);
    }
    
    // b* 필드도 테스트
    console.log('\n5. b* 필드에도 음수 입력 테스트');
    const bInput = await page.locator('input#lab-b');
    await bInput.click();
    await bInput.selectText();
    await page.keyboard.type('-30', { delay: 100 });
    await page.waitForTimeout(500);
    
    const bValue = await bInput.inputValue();
    console.log(`   b* 필드 값: "${bValue}"`);
    
    if (bValue === '-30') {
      console.log('   ✅ 성공: b* 필드도 음수 입력 가능');
    } else {
      console.log(`   ❌ 실패: b* 필드 값이 "${bValue}"`);
    }
    
    // 콘솔 로그 캡처
    console.log('\n6. 브라우저 콘솔 로그 확인 중...');
    page.on('console', msg => {
      if (msg.text().includes('[ColorInput]')) {
        console.log(`   콘솔: ${msg.text()}`);
      }
    });
    
    // 스크린샷 저장
    await page.screenshot({ path: 'test-result.png' });
    console.log('\n📸 스크린샷 저장됨: test-result.png');
    
    console.log('\n========================================');
    console.log('🎯 테스트 완료!');
    
    // 최종 결과
    if (finalValue === '-50' && bValue === '-30') {
      console.log('✅ 모든 테스트 통과: 음수 입력 정상 작동');
      return true;
    } else {
      console.log('❌ 테스트 실패: 음수 입력 문제 지속');
      return false;
    }
    
  } catch (error) {
    console.error('❌ 테스트 중 오류 발생:', error);
    return false;
  } finally {
    await page.waitForTimeout(3000); // 결과 확인을 위해 3초 대기
    await browser.close();
  }
}

// 테스트 실행
testNegativeInput().then(success => {
  process.exit(success ? 0 : 1);
});