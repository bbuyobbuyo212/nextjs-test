import React, { useState, useEffect } from 'react';
import Link from 'next/link';

interface MenuItem {
  id: number;
  name: string;
  url: string;
  children?: MenuItem[];
}

function useMenus() {
  const [menus, setMenus] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    fetch('/api/admin/menus/')
      .then(res => res.json())
      .then(data => {
        if (data.success && Array.isArray(data.menus)) {
          setMenus(data.menus.filter((m: MenuItem) => typeof m.url === 'string'));
        } else {
          setError('메뉴 데이터를 불러올 수 없습니다.');
        }
      })
      .catch(() => setError('메뉴 API 요청 실패'))
      .finally(() => setLoading(false));
  }, []);
  return { menus, loading, error };
}

const GNB: React.FC = () => {
  const { menus, loading, error } = useMenus();
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const handleMouseEnter = (index: number) => setActiveIndex(index);
  const handleMouseLeave = () => setActiveIndex(null);

  return (
    <nav className="gnb" aria-label="주 내비게이션">
      {loading && <div className="gnb__loading">메뉴 불러오는 중...</div>}
      {error && <div className="gnb__error">{error}</div>}
      <ul className="gnb__list">
        {(!loading && !error && menus.length > 0) && menus.map((menu, idx) => (
          <li
            key={menu.id}
            className={`gnb__list__item${activeIndex === idx ? ' active' : ''}`}
            onMouseEnter={() => handleMouseEnter(idx)}
            onMouseLeave={handleMouseLeave}
            tabIndex={0}
            onFocus={() => handleMouseEnter(idx)}
            onBlur={handleMouseLeave}
            aria-expanded={activeIndex === idx}
            aria-label={menu.name}
            aria-controls={`gnb-2depth-${menu.id}`}
          >
            <Link href={menu.url} className="gnb__list__link">
              {menu.name}
            </Link>
            {menu.children && menu.children.length > 0 && (
              <div className="gnb__2depth-box" style={{ display: activeIndex === idx ? 'block' : 'none' }}>
                <ul className="gnb__2depth" id={`gnb-2depth-${menu.id}`}>
                  {menu.children.map(child => (
                    <li key={child.id} className="gnb__2depth__item">
                      <Link href={child.url} className="gnb__list__link">
                        {child.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </li>
        ))}
      </ul>
    </nav>
  );
};

export default GNB;