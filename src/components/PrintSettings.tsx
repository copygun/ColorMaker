/**
 * Print Settings Component
 * 인쇄 방식 및 기질 선택 컴포넌트
 */

import React from 'react';

interface PrintSettingsProps {
  printMethod: string;
  substrateType: string;
  onPrintMethodChange: (method: string) => void;
  onSubstrateChange: (substrate: string) => void;
}

const PrintSettings: React.FC<PrintSettingsProps> = ({
  printMethod,
  substrateType,
  onPrintMethodChange,
  onSubstrateChange
}) => {
  const printMethods = [
    { value: 'offset', label: '오프셋 인쇄', dotGain: '10-15%' },
    { value: 'flexo', label: '플렉소 인쇄', dotGain: '15-25%' },
    { value: 'digital', label: '디지털 인쇄', dotGain: '5-10%' },
    { value: 'gravure', label: '그라비어 인쇄', dotGain: '8-12%' },
    { value: 'screen', label: '스크린 인쇄', dotGain: '20-30%' }
  ];

  const substrates = [
    { 
      category: '종이', 
      options: [
        { value: 'white_coated', label: '백색 코팅지', description: '고품질 인쇄용' },
        { value: 'white_uncoated', label: '백색 비코팅지', description: '일반 인쇄용' },
        { value: 'kraft', label: '크라프트지', description: '갈색 포장지' },
        { value: 'recycled', label: '재생지', description: '친환경 용지' }
      ]
    },
    {
      category: '필름',
      options: [
        { value: 'transparent', label: '투명 필름', description: 'OPP, PET' },
        { value: 'white_film', label: '백색 필름', description: '백색 PP, PE' },
        { value: 'metallic_film', label: '메탈릭 필름', description: '알루미늄 증착' }
      ]
    },
    {
      category: '특수',
      options: [
        { value: 'metallic', label: '금속 표면', description: '알루미늄, 틴' },
        { value: 'synthetic', label: '합성지', description: '유포지, 스톤페이퍼' },
        { value: 'thermal', label: '감열지', description: '영수증, 라벨용' }
      ]
    }
  ];

  return (
    <div className="print-settings">
      <div className="setting-group">
        <label className="setting-label">
          <span className="label-text">🖨️ 인쇄 방식</span>
          <select 
            value={printMethod} 
            onChange={(e) => onPrintMethodChange(e.target.value)}
            className="setting-select"
          >
            {printMethods.map(method => (
              <option key={method.value} value={method.value}>
                {method.label} (Dot Gain: {method.dotGain})
              </option>
            ))}
          </select>
        </label>
        <div className="setting-info">
          선택한 인쇄 방식에 따라 dot gain 보정이 자동 적용됩니다.
        </div>
      </div>

      <div className="setting-group">
        <label className="setting-label">
          <span className="label-text">📄 기질 (용지/필름)</span>
          <select 
            value={substrateType} 
            onChange={(e) => onSubstrateChange(e.target.value)}
            className="setting-select"
          >
            {substrates.map(category => (
              <optgroup key={category.category} label={category.category}>
                {category.options.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label} - {option.description}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </label>
        <div className="setting-info">
          기질 특성이 최종 색상에 영향을 미칩니다.
        </div>
      </div>

      <div className="print-preview">
        <h4>현재 설정</h4>
        <ul>
          <li>
            <strong>인쇄 방식:</strong> {printMethods.find(m => m.value === printMethod)?.label}
          </li>
          <li>
            <strong>기질:</strong> {
              substrates.flatMap(c => c.options).find(o => o.value === substrateType)?.label
            }
          </li>
          <li>
            <strong>예상 Dot Gain:</strong> {
              printMethods.find(m => m.value === printMethod)?.dotGain
            }
          </li>
        </ul>
      </div>

      <style>{`
        .print-settings {
          padding: 15px;
          background: #f8f9fa;
          border-radius: 8px;
        }

        .setting-group {
          margin-bottom: 20px;
        }

        .setting-label {
          display: block;
          margin-bottom: 5px;
        }

        .label-text {
          display: block;
          font-weight: 500;
          margin-bottom: 5px;
          color: #333;
        }

        .setting-select {
          width: 100%;
          padding: 8px 12px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 14px;
          background: white;
        }

        .setting-info {
          margin-top: 5px;
          font-size: 12px;
          color: #666;
        }

        .print-preview {
          margin-top: 20px;
          padding: 15px;
          background: white;
          border-radius: 4px;
          border: 1px solid #e0e0e0;
        }

        .print-preview h4 {
          margin: 0 0 10px 0;
          color: #333;
          font-size: 14px;
        }

        .print-preview ul {
          margin: 0;
          padding-left: 20px;
          list-style: none;
        }

        .print-preview li {
          margin: 5px 0;
          font-size: 13px;
          color: #555;
        }

        .print-preview strong {
          color: #333;
        }

        optgroup {
          font-weight: bold;
          color: #333;
        }

        option {
          font-weight: normal;
          padding: 5px;
        }
      `}</style>
    </div>
  );
};

export default PrintSettings;