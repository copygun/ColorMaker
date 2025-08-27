import React, { useState } from 'react';

interface MeasurementInfoProps {
  className?: string;
}

const MeasurementInfo: React.FC<MeasurementInfoProps> = ({ className }) => {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div className={`measurement-info ${className || ''}`}>
      <div className="info-header">
        <h4>📊 색상 측정 기준</h4>
        <button 
          className="info-toggle"
          onClick={() => setShowDetails(!showDetails)}
        >
          {showDetails ? '간단히' : '자세히'}
        </button>
      </div>
      
      <div className="info-summary">
        <div className="standard-badge">
          <span className="badge-label">현재 기준:</span>
          <span className="badge-value">D50/2° (인쇄 표준)</span>
        </div>
        <div className="accuracy-badge">
          <span className="badge-label">목표 정확도:</span>
          <span className="badge-value">ΔE00 &lt; 1.5</span>
        </div>
      </div>

      {showDetails && (
        <div className="info-details">
          <h5>시스템 설정</h5>
          <ul>
            <li><strong>Illuminant:</strong> D50 (5000K) - 인쇄물 평가 표준 조명</li>
            <li><strong>Observer:</strong> 2° (CIE 1931) - 표준 관찰자</li>
            <li><strong>용도:</strong> 오프셋, 플렉소, 디지털 인쇄</li>
            <li><strong>색상 데이터:</strong> PANTONE® Formula Guide 기준</li>
          </ul>

          <h5>작업 환경 권장사항</h5>
          <ul>
            <li><strong>조명:</strong> D50 표준 조명 부스 사용 권장</li>
            <li><strong>일반 사무실 조명 사용 시:</strong>
              <ul>
                <li>자연광이 직접 들지 않는 곳에서 평가</li>
                <li>가능한 5000K에 가까운 조명 사용</li>
                <li>색상 평가 시 주변 색상 영향 최소화</li>
              </ul>
            </li>
          </ul>

          <h5>색상 정확도 등급</h5>
          <table className="accuracy-table">
            <thead>
              <tr>
                <th>ΔE00 범위</th>
                <th>평가</th>
                <th>용도</th>
              </tr>
            </thead>
            <tbody>
              <tr className="excellent">
                <td>&lt; 1.0</td>
                <td>완벽</td>
                <td>육안 구분 불가</td>
              </tr>
              <tr className="good">
                <td>1.0 - 1.5</td>
                <td>우수</td>
                <td>브랜드 컬러, CI (목표)</td>
              </tr>
              <tr className="fair">
                <td>1.5 - 3.0</td>
                <td>양호</td>
                <td>일반 상업 인쇄</td>
              </tr>
              <tr className="poor">
                <td>&gt; 3.0</td>
                <td>재조정 필요</td>
                <td>육안 차이 감지</td>
              </tr>
            </tbody>
          </table>

          <div className="warning-note">
            <strong>⚠️ 주의사항:</strong>
            <ul>
              <li>e-paint.co.uk 등 웹 자료는 D65/10° 기준일 수 있어 차이 발생 가능</li>
              <li>모니터 색상은 인쇄물과 다를 수 있음 (RGB vs CMYK)</li>
              <li>메탈릭, 펄 색상은 측정 각도에 따라 변화</li>
              <li>PANTONE® 공식 가이드북 참조 권장</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default MeasurementInfo;