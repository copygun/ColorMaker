import React from 'react';

type PageView = 'calculator' | 'database' | 'recipes' | 'profiles' | 'settings';

interface NavigationProps {
  currentPage: PageView;
  setCurrentPage: (page: PageView) => void;
}

const Navigation: React.FC<NavigationProps> = ({ currentPage, setCurrentPage }) => {
  const navItems: { id: PageView; label: string }[] = [
    { id: 'calculator', label: '계산기' },
    { id: 'database', label: '색상 데이터베이스' },
    { id: 'recipes', label: '레시피 관리' },
    { id: 'profiles', label: '인쇄 프로파일' },
    { id: 'settings', label: '설정' }
  ];

  return (
    <header className="professional-header">
      <div className="header-content">
        <div>
          <h1 className="header-title">원라벨 컬러연구소</h1>
          <p className="header-subtitle">Professional Color Recipe Management System</p>
        </div>
        <nav className="header-nav">
          {navItems.map(item => (
            <a 
              key={item.id}
              href="#" 
              className={`nav-item ${currentPage === item.id ? 'active' : ''}`}
              onClick={(e) => { 
                e.preventDefault(); 
                setCurrentPage(item.id); 
              }}
            >
              {item.label}
            </a>
          ))}
        </nav>
      </div>
    </header>
  );
};

export default Navigation;