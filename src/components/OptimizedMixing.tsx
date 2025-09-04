import React, { useState, useCallback } from 'react';
import { OptimizedMixingEngine } from '../../core/optimizedMixingEngine.js';
import { baseInks } from '../../core/inkDatabase.js';
import type { LabColor } from '../types';

interface OptimizedMixingProps {
  targetColor: LabColor;
}

const OptimizedMixing: React.FC<OptimizedMixingProps> = ({ targetColor }) => {
  const [result, setResult] = useState<any>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [options, setOptions] = useState({
    maxInks: 4,
    includeWhite: true,
    use100: true,
    use70: true,
    use40: true,
    costWeight: 0.2
  });

  const calculateOptimalMix = useCallback(() => {
    setIsCalculating(true);
    
    // 선택된 농도들
    const concentrations: number[] = [];
    if (options.use100) concentrations.push(100);
    if (options.use70) concentrations.push(70);
    if (options.use40) concentrations.push(40);
    
    if (concentrations.length === 0) {
      alert('최소 하나의 농도를 선택해주세요');
      setIsCalculating(false);
      return;
    }
    
    const engine = new OptimizedMixingEngine();
    
    setTimeout(() => {
      const rawResult = engine.findOptimalMix(targetColor, baseInks, {
        maxInks: options.maxInks,
        preferredConcentrations: concentrations,
        includeWhite: options.includeWhite,
        costWeight: options.costWeight
      });
      
      const formatted = engine.formatResult(rawResult);
      setResult(formatted);
      setIsCalculating(false);
    }, 100);
  }, [targetColor, options]);

  return (
    <div className="optimized-mixing">
      <h3>🎯 최적화된 잉크 배합</h3>
      
      <div className="options-panel">
        <h4>배합 옵션</h4>
        
        <div className="option-group">
          <label>최대 잉크 수:</label>
          <select 
            value={options.maxInks} 
            onChange={(e) => setOptions({...options, maxInks: parseInt(e.target.value)})}
          >
            <option value={2}>2개</option>
            <option value={3}>3개</option>
            <option value={4}>4개</option>
            <option value={5}>5개</option>
          </select>
        </div>
        
        <div className="option-group">
          <label>사용 가능 농도:</label>
          <div className="checkbox-group">
            <label>
              <input 
                type="checkbox" 
                checked={options.use100}
                onChange={(e) => setOptions({...options, use100: e.target.checked})}
              />
              100% (베이스)
            </label>
            <label>
              <input 
                type="checkbox" 
                checked={options.use70}
                onChange={(e) => setOptions({...options, use70: e.target.checked})}
              />
              70% (Satin)
            </label>
            <label>
              <input 
                type="checkbox" 
                checked={options.use40}
                onChange={(e) => setOptions({...options, use40: e.target.checked})}
              />
              40% (Satin)
            </label>
          </div>
        </div>
        
        <div className="option-group">
          <label>
            <input 
              type="checkbox" 
              checked={options.includeWhite}
              onChange={(e) => setOptions({...options, includeWhite: e.target.checked})}
            />
            화이트 포함
          </label>
        </div>
        
        <div className="option-group">
          <label>비용 가중치:</label>
          <input 
            type="range" 
            min="0" 
            max="1" 
            step="0.1"
            value={options.costWeight}
            onChange={(e) => setOptions({...options, costWeight: parseFloat(e.target.value)})}
          />
          <span>{options.costWeight.toFixed(1)}</span>
        </div>
        
        <button 
          className="calculate-btn"
          onClick={calculateOptimalMix}
          disabled={isCalculating}
        >
          {isCalculating ? '계산 중...' : '최적 배합 계산'}
        </button>
      </div>
      
      {result && (
        <div className="result-panel">
          <h4>최적 배합 결과</h4>
          
          <div className="quality-indicator">
            <span className={`quality-badge ${result.quality.toLowerCase()}`}>
              {result.quality}
            </span>
            <span className="delta-e">ΔE: {result.deltaE}</span>
          </div>
          
          <div className="recipe-table">
            <table>
              <thead>
                <tr>
                  <th>잉크</th>
                  <th>농도</th>
                  <th>비율</th>
                  <th>타입</th>
                </tr>
              </thead>
              <tbody>
                {result.inks.map((ink: any, index: number) => (
                  <tr key={index} className={ink.isSatin ? 'satin-ink' : 'base-ink'}>
                    <td>{ink.name.split(' ')[0]}</td>
                    <td>{ink.concentration}%</td>
                    <td>{ink.percentage}%</td>
                    <td>{ink.isSatin ? 'Satin' : 'Base'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="color-comparison">
            <div className="color-box">
              <div 
                className="color-sample"
                style={{
                  backgroundColor: `lab(${targetColor.L}% ${targetColor.a} ${targetColor.b})`
                }}
              />
              <div className="color-label">목표</div>
              <div className="lab-values">
                L: {targetColor.L.toFixed(1)}<br/>
                a: {targetColor.a.toFixed(1)}<br/>
                b: {targetColor.b.toFixed(1)}
              </div>
            </div>
            
            <div className="arrow">→</div>
            
            <div className="color-box">
              <div 
                className="color-sample"
                style={{
                  backgroundColor: `lab(${result.achievedLab.L}% ${result.achievedLab.a} ${result.achievedLab.b})`
                }}
              />
              <div className="color-label">달성</div>
              <div className="lab-values">
                L*: {result.achievedLab.L.toFixed(1)}<br/>
                a*: {result.achievedLab.a.toFixed(1)}<br/>
                b*: {result.achievedLab.b.toFixed(1)}
              </div>
            </div>
          </div>
          
          <div className="cost-info">
            <span>예상 비용 지수: {result.cost}</span>
            <small>(낮은 농도 잉크는 제조 비용이 높음)</small>
          </div>
        </div>
      )}
      
      <style>{`
        .optimized-mixing {
          padding: 20px;
          background: #f8f9fa;
          border-radius: 10px;
          margin: 20px 0;
        }
        
        .options-panel {
          background: white;
          padding: 15px;
          border-radius: 8px;
          margin-bottom: 20px;
        }
        
        .option-group {
          margin: 15px 0;
        }
        
        .checkbox-group {
          display: flex;
          gap: 15px;
          margin-top: 5px;
        }
        
        .checkbox-group label {
          display: flex;
          align-items: center;
          gap: 5px;
        }
        
        .calculate-btn {
          width: 100%;
          padding: 12px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 16px;
          font-weight: bold;
          cursor: pointer;
          margin-top: 20px;
        }
        
        .calculate-btn:hover {
          opacity: 0.9;
        }
        
        .calculate-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .result-panel {
          background: white;
          padding: 20px;
          border-radius: 8px;
        }
        
        .quality-indicator {
          display: flex;
          align-items: center;
          gap: 15px;
          margin-bottom: 20px;
        }
        
        .quality-badge {
          padding: 5px 15px;
          border-radius: 20px;
          font-weight: bold;
          text-transform: uppercase;
        }
        
        .quality-badge.excellent {
          background: #4caf50;
          color: white;
        }
        
        .quality-badge.very.good {
          background: #8bc34a;
          color: white;
        }
        
        .quality-badge.good {
          background: #ffc107;
          color: #333;
        }
        
        .quality-badge.acceptable {
          background: #ff9800;
          color: white;
        }
        
        .quality-badge.poor {
          background: #f44336;
          color: white;
        }
        
        .recipe-table {
          margin: 20px 0;
        }
        
        .recipe-table table {
          width: 100%;
          border-collapse: collapse;
        }
        
        .recipe-table th,
        .recipe-table td {
          padding: 10px;
          text-align: left;
          border-bottom: 1px solid #ddd;
        }
        
        .recipe-table th {
          background: #f5f5f5;
          font-weight: bold;
        }
        
        .satin-ink {
          background: #e3f2fd;
        }
        
        .base-ink {
          background: #fff;
        }
        
        .color-comparison {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 30px;
          margin: 30px 0;
        }
        
        .color-box {
          text-align: center;
        }
        
        .color-sample {
          width: 100px;
          height: 100px;
          border-radius: 10px;
          border: 2px solid #ddd;
          margin-bottom: 10px;
        }
        
        .color-label {
          font-weight: bold;
          margin-bottom: 5px;
        }
        
        .lab-values {
          font-size: 12px;
          color: #666;
          line-height: 1.4;
        }
        
        .arrow {
          font-size: 24px;
          color: #666;
        }
        
        .cost-info {
          margin-top: 20px;
          padding: 10px;
          background: #fff3e0;
          border-radius: 5px;
          text-align: center;
        }
        
        .cost-info small {
          display: block;
          margin-top: 5px;
          color: #666;
        }
      `}</style>
    </div>
  );
};

export default OptimizedMixing;