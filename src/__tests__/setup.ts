/**
 * Vitest 테스트 환경 설정
 */

// @vitest-environment jsdom
import { vi, beforeAll, afterAll } from 'vitest';
import '@testing-library/jest-dom';

// 전역 모의 객체
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// LocalStorage 모의
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
global.localStorage = localStorageMock as any;

// Console 경고 무시 (테스트 중)
const originalError = console.error;
beforeAll(() => {
  console.error = (...args: any[]) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning: ReactDOM.render')
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});