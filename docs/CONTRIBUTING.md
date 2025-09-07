# 🤝 기여 가이드라인

원라벨 컬러메이커 프로젝트에 기여해주셔서 감사합니다! 이 문서는 프로젝트에 기여하는 방법을 안내합니다.

## 📋 목차
- [행동 강령](#행동-강령)
- [시작하기](#시작하기)
- [개발 환경 설정](#개발-환경-설정)
- [브랜치 전략](#브랜치-전략)
- [커밋 컨벤션](#커밋-컨벤션)
- [Pull Request 프로세스](#pull-request-프로세스)
- [코드 스타일](#코드-스타일)
- [테스트](#테스트)
- [문서화](#문서화)

## 행동 강령

모든 참여자는 상호 존중과 협력의 정신으로 프로젝트에 참여해야 합니다.

## 시작하기

### 필수 요구사항
- Node.js 18.x 이상
- npm 또는 pnpm
- Git

### 프로젝트 클론
```bash
git clone https://github.com/yourusername/wonlabel-color-maker.git
cd wonlabel-color-maker
```

## 개발 환경 설정

### 1. 의존성 설치
```bash
npm install
# 또는
pnpm install
```

### 2. 개발 서버 실행
```bash
npm run dev
```

### 3. 코드 품질 검사
```bash
# 모든 검사 실행
npm run validate

# 개별 검사
npm run typecheck  # TypeScript 타입 체크
npm run lint       # ESLint 검사
npm run format     # Prettier 포맷팅
npm run test       # 테스트 실행
```

## 브랜치 전략

- `main`: 프로덕션 브랜치
- `develop`: 개발 브랜치
- `feature/*`: 새 기능 개발
- `refactor/*`: 리팩토링
- `fix/*`: 버그 수정
- `docs/*`: 문서 작업

### 브랜치 생성 예시
```bash
git checkout -b feature/add-color-picker
git checkout -b fix/calculation-error
git checkout -b refactor/type-safety
```

## 커밋 컨벤션

[Conventional Commits](https://www.conventionalcommits.org/)를 따릅니다.

### 커밋 메시지 형식
```
<type>(<scope>): <subject>

<body>

<footer>
```

### 커밋 타입
- `feat`: 새로운 기능 추가
- `fix`: 버그 수정
- `docs`: 문서 수정
- `style`: 코드 포맷팅, 세미콜론 누락 등
- `refactor`: 코드 리팩토링
- `perf`: 성능 개선
- `test`: 테스트 추가 또는 수정
- `chore`: 빌드 프로세스 또는 보조 도구 변경
- `ci`: CI 설정 파일 및 스크립트 변경

### 커밋 메시지 예시
```bash
# 좋은 예
git commit -m "feat(calculator): Lab 색상 변환 기능 추가"
git commit -m "fix(mixing): 잉크 비율 계산 오류 수정"
git commit -m "docs: README에 설치 가이드 추가"
git commit -m "refactor: TypeScript strict 모드 적용"

# 나쁜 예
git commit -m "수정"
git commit -m "업데이트"
git commit -m "버그 고침"
```

## Pull Request 프로세스

### 1. 이슈 생성
먼저 해결하려는 문제나 추가하려는 기능에 대한 이슈를 생성합니다.

### 2. 브랜치 생성 및 작업
```bash
git checkout develop
git pull origin develop
git checkout -b feature/your-feature
```

### 3. 코드 작성 및 테스트
- 코드 작성
- 테스트 추가/수정
- 로컬에서 검증

### 4. 커밋 및 푸시
```bash
git add .
git commit -m "feat: 새로운 기능 추가"
git push origin feature/your-feature
```

### 5. Pull Request 생성
- PR 템플릿에 따라 작성
- 관련 이슈 연결
- 리뷰어 지정

### 6. 코드 리뷰
- 리뷰 피드백 반영
- 필요시 추가 커밋
- CI 통과 확인

### 7. 머지
- 모든 체크 통과
- 리뷰 승인 받기
- Squash and merge 또는 Rebase and merge

## 코드 스타일

### TypeScript
```typescript
// 명시적 타입 선언
interface ColorData {
  L: number;
  a: number;
  b: number;
}

// 함수형 컴포넌트
const ColorInput: React.FC<Props> = ({ value, onChange }) => {
  // ...
};

// 명확한 변수명
const calculateDeltaE = (color1: LabColor, color2: LabColor): number => {
  // ...
};
```

### React
```tsx
// Props 인터페이스 정의
interface ButtonProps {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}

// 컴포넌트 구조
const Button: React.FC<ButtonProps> = ({ label, onClick, disabled = false }) => {
  return (
    <button onClick={onClick} disabled={disabled}>
      {label}
    </button>
  );
};
```

### CSS/SCSS
```scss
// BEM 네이밍 컨벤션
.color-picker {
  &__header {
    // ...
  }
  
  &__body {
    // ...
  }
  
  &--active {
    // ...
  }
}
```

## 테스트

### 단위 테스트
```typescript
describe('ColorCalculator', () => {
  it('should calculate Delta E correctly', () => {
    const color1 = { L: 50, a: 0, b: 0 };
    const color2 = { L: 60, a: 0, b: 0 };
    const deltaE = calculateDeltaE(color1, color2);
    expect(deltaE).toBeCloseTo(10, 2);
  });
});
```

### 테스트 실행
```bash
# 모든 테스트 실행
npm run test

# 커버리지 포함
npm run test:coverage

# 감시 모드
npm run test:watch
```

## 문서화

### 코드 주석
```typescript
/**
 * Lab 색상 간의 Delta E를 계산합니다
 * @param color1 - 첫 번째 Lab 색상
 * @param color2 - 두 번째 Lab 색상
 * @returns Delta E 값
 */
function calculateDeltaE(color1: LabColor, color2: LabColor): number {
  // CIE76 Delta E 공식 사용
  // ...
}
```

### README 업데이트
새로운 기능이나 중요한 변경사항은 README.md를 업데이트해주세요.

## 도움이 필요하신가요?

- 이슈 트래커에서 질문하기
- 디스코드 채널 참여
- 메인테이너에게 연락

## 라이선스

이 프로젝트에 기여함으로써 귀하의 기여가 프로젝트 라이선스 하에 배포되는 것에 동의합니다.