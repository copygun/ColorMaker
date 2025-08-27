import React, { useCallback } from 'react';
import type { Recipe, LabColor } from '../types';

interface CertificateProps {
  recipe: Recipe;
  targetColor: LabColor;
  inkDatabase: any;
  show: boolean;
  onClose: () => void;
}

const Certificate: React.FC<CertificateProps> = ({
  recipe,
  targetColor,
  inkDatabase,
  show,
  onClose
}) => {
  // 인쇄용 성적서 생성
  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  // PDF 다운로드 (간단한 구현)
  const handleDownload = useCallback(() => {
    const content = document.getElementById('certificate-content');
    if (!content) return;
    
    // HTML을 텍스트로 변환
    const text = content.innerText;
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `color_certificate_${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  if (!show) return null;

  const currentDate = new Date().toLocaleDateString('ko-KR');
  const currentTime = new Date().toLocaleTimeString('ko-KR');

  return (
    <div className="certificate-modal">
      <div className="certificate-container" id="certificate-content">
        <button className="close-btn" onClick={onClose}>✕</button>
        
        <div className="certificate-header">
          <h1>색상 매칭 성적서</h1>
          <p className="subtitle">Color Matching Certificate</p>
        </div>        <div className="certificate-info">
          <div className="info-row">
            <span className="label">발행일:</span>
            <span className="value">{currentDate}</span>
          </div>
          <div className="info-row">
            <span className="label">발행시간:</span>
            <span className="value">{currentTime}</span>
          </div>
          <div className="info-row">
            <span className="label">발행처:</span>
            <span className="value">원라벨 컬러연구소</span>
          </div>
        </div>

        <div className="certificate-section">
          <h2>목표 색상 정보</h2>
          <div className="color-info">
            <div className="lab-values">
              <div>L*: {targetColor.L.toFixed(2)}</div>
              <div>a*: {targetColor.a.toFixed(2)}</div>
              <div>b*: {targetColor.b.toFixed(2)}</div>
            </div>
          </div>
        </div>

        <div className="certificate-section">
          <h2>계산된 레시피</h2>
          <table className="recipe-table">
            <thead>
              <tr>
                <th>잉크명</th>
                <th>비율 (%)</th>
                <th>농도 (%)</th>
              </tr>
            </thead>
            <tbody>
              {recipe.inks.map((ink, idx) => (
                <tr key={idx}>
                  <td>{inkDatabase.getInkById(ink.inkId)?.name || ink.inkId}</td>
                  <td>{ink.ratio.toFixed(1)}</td>
                  <td>{ink.concentration}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>        <div className="certificate-section">
          <h2>색상 매칭 결과</h2>
          <div className="matching-result">
            <div className="result-row">
              <span className="label">혼합 색상:</span>
              <span>L*: {recipe.mixed.L.toFixed(2)}, a*: {recipe.mixed.a.toFixed(2)}, b*: {recipe.mixed.b.toFixed(2)}</span>
            </div>
            <div className="result-row">
              <span className="label">Delta E 2000:</span>
              <span className={`delta-e ${recipe.deltaE < 1 ? 'excellent' : recipe.deltaE < 2 ? 'good' : 'fair'}`}>
                {recipe.deltaE.toFixed(3)}
              </span>
            </div>
            <div className="result-row">
              <span className="label">혼합 방식:</span>
              <span>{recipe.method === 'xyz' ? 'XYZ 색공간' : 'Lab 색공간'}</span>
            </div>
            <div className="result-row">
              <span className="label">최적화:</span>
              <span>{recipe.optimization === 'pso' ? 'PSO 알고리즘' : '선형 최적화'}</span>
            </div>
          </div>
        </div>

        <div className="certificate-section">
          <h2>품질 평가</h2>
          <div className="quality-assessment">
            {recipe.deltaE < 1 && (
              <div className="assessment excellent">
                ✓ 우수 - 육안으로 구별 불가능한 수준의 정확도
              </div>
            )}
            {recipe.deltaE >= 1 && recipe.deltaE < 2 && (
              <div className="assessment good">
                ✓ 양호 - 숙련된 관찰자만 구별 가능한 수준
              </div>
            )}
            {recipe.deltaE >= 2 && recipe.deltaE < 5 && (
              <div className="assessment fair">
                ○ 보통 - 일반인도 구별 가능하나 허용 범위 내
              </div>
            )}
            {recipe.deltaE >= 5 && (
              <div className="assessment poor">
                △ 개선필요 - 명확한 색상 차이 존재
              </div>
            )}
          </div>
        </div>

        <div className="certificate-footer">
          <p>본 성적서는 원라벨 컬러연구소의 표준 측정 방법에 따라 작성되었습니다.</p>
          <p>측정 조건: D65 표준광원, 2° 관찰자 각도</p>
        </div>

        <div className="certificate-actions no-print">
          <button className="btn btn-primary" onClick={handlePrint}>
            🖨️ 인쇄
          </button>
          <button className="btn btn-secondary" onClick={handleDownload}>
            💾 다운로드
          </button>
        </div>
      </div>
    </div>
  );
};

export default Certificate;