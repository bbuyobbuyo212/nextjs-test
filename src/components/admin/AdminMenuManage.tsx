"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';

interface MenuItem {
  id: number;
  name: string;
  url: string;
  checked?: boolean;
  children?: MenuItem[];
    parent_id?: number;
    visible?: number;
}

export default function AdminMenuManage() {
  const [menus, setMenus] = useState<MenuItem[]>([]);
  const [search, setSearch] = useState('');
  const [nextId, setNextId] = useState(1);

  // 최초 마운트 시 DB에서 메뉴 불러오기
  useEffect(() => {
    const fetchMenus = async () => {
      try {
        const res = await fetch('/api/admin/admin-menu/');
        const data = await res.json();
        if (res.ok && Array.isArray(data.menus)) {
          // parent_id를 기준으로 2차 메뉴(children) 자동 구성
          const flatMenus: MenuItem[] = data.menus;
          const firstLevel: MenuItem[] = flatMenus.filter(m => !m.parent_id || m.parent_id === 0);
          const secondLevel: MenuItem[] = flatMenus.filter(m => m.parent_id && m.parent_id !== 0);
          // 1차 메뉴에 children 할당
          const menuTree: MenuItem[] = firstLevel.map(menu => ({
            ...menu,
            children: secondLevel.filter(child => child.parent_id === menu.id)
          }));
          setMenus(menuTree);
          const allIds = flatMenus.map(m => m.id);
          setNextId(allIds.length > 0 ? Math.max(...allIds) + 1 : 1);
        }
      } catch (err) {
        console.error('[메뉴 불러오기 오류]', err);
      }
    };
    fetchMenus();
  }, []);

  // 메뉴 추가
  const handleAddMenu = () => {
    setMenus(prev => [
      ...prev,
    { id: nextId, name: '', url: '', parent_id: undefined, visible: 1, checked: false, children: [] }
    ]);
    setNextId(id => id + 1);
  };

  // 메뉴명/URL 변경
  const handleChange = (
    id: number,
    field: 'name' | 'url' | 'visible',
    value: string | number,
    parentId?: number
  ) => {
    setMenus(prev =>
      prev.map(menu =>
        menu.id === id && !parentId
          ? { ...menu, [field]: value }
          : parentId && menu.id === parentId
          ? {
              ...menu,
              children: menu.children?.map(child =>
                child.id === id ? { ...child, [field]: value } : child
              ),
            }
          : menu
      )
    );
  }

  // 메뉴 체크박스
  const handleCheck = (id: number, checked: boolean, parentId?: number) => {
    setMenus(prev =>
      prev.map(menu =>
        menu.id === id && !parentId
          ? { ...menu, checked }
          : parentId && menu.id === parentId
          ? {
              ...menu,
              children: menu.children?.map(child =>
                child.id === id ? { ...child, checked } : child
              ),
            }
          : menu
      )
    );
  };

  // 2차 메뉴 추가
  const handleAddChild = (parentId: number) => {
    setMenus(prev =>
      prev.map(menu =>
        menu.id === parentId
          ? {
              ...menu,
              children: [
                ...(menu.children || []),
                  { id: nextId, name: '', url: '', parent_id: parentId, visible: 1, checked: false }
              ],
            }
          : menu
      )
    );
    setNextId(id => id + 1);
  };

  // 메뉴 삭제
  const handleDelete = (id: number, parentId?: number) => {
    if (!parentId) {
      setMenus(prev => prev.filter(menu => menu.id !== id));
    } else {
      setMenus(prev =>
        prev.map(menu =>
          menu.id === parentId
            ? {
                ...menu,
                children: menu.children?.filter(child => child.id !== id),
              }
            : menu
        )
      );
    }
  };

  // 선택 삭제
  const handleDeleteChecked = async () => {
    // 1차/2차 메뉴에서 checked된 id 모두 수집
    const ids: number[] = [];
    menus.forEach(menu => {
      if (menu.checked) ids.push(menu.id);
      menu.children?.forEach(child => {
        if (child.checked) ids.push(child.id);
      });
    });
    if (ids.length === 0) {
      alert('선택된 메뉴가 없습니다.');
      return;
    }
    try {
      const res = await fetch('/api/admin/admin-menu/', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert('선택된 메뉴가 삭제되었습니다.');
        // 삭제 후 최신 메뉴 목록 다시 불러오기
        const getRes = await fetch('/api/admin/admin-menu/');
        const getData = await getRes.json();
        if (getRes.ok && getData.success && Array.isArray(getData.menus)) {
          setMenus(getData.menus);
          const allIds = getData.menus.flatMap((m: MenuItem) => [m.id, ...(m.children?.map((c: MenuItem) => c.id) || [])]);
          setNextId(allIds.length > 0 ? Math.max(...allIds) + 1 : 1);
        }
      } else {
        let msg = '';
        if (data.error) msg += data.error;
        if (data.detail) msg += '\n' + data.detail;
        if (!msg) msg = '삭제에 실패했습니다.';
        alert(msg);
        console.error('[선택삭제 실패]', data);
      }
    } catch (err) {
      alert('삭제 중 오류가 발생했습니다.');
      console.error('[선택삭제 예외]', err);
    }
  };

  // 전체 체크
  const handleCheckAll = (checked: boolean) => {
    setMenus(prev =>
      prev.map(menu => ({
        ...menu,
        checked,
        children: menu.children?.map(child => ({ ...child, checked })),
      }))
    );
  };

  // 메뉴 검색
  const filteredMenus = menus.filter(menu =>
    (menu.name ?? '').includes(search) || (menu.url ?? '').includes(search)
  );

  // 메뉴 저장 핸들러 추가
  const handleSaveMenus = async () => {
    try {
      console.log('[메뉴구조 저장 요청]', menus);
      const res = await fetch('/api/admin/admin-menu/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ menus }),
      });
      const data = await res.json();
      console.log('[메뉴구조 저장 응답]', data);
      if (res.ok && data.success) {
        alert('메뉴구조가 저장되었습니다.');
        // 저장 후 DB에서 최신 메뉴 목록을 다시 불러와서 반영
        const getRes = await fetch('/api/admin/admin-menu/');
        const getData = await getRes.json();
        if (getRes.ok && getData.success && Array.isArray(getData.menus)) {
          setMenus(getData.menus);
          const allIds = getData.menus.flatMap((m: MenuItem) => [m.id, ...(m.children?.map((c: MenuItem) => c.id) || [])]);
          setNextId(allIds.length > 0 ? Math.max(...allIds) + 1 : 1);
        }
      } else {
        // 서버에서 반환된 오류 메시지와 상세 오류를 모두 alert로 안내
        let msg = '';
        if (data.error) msg += data.error;
        if (data.detail) msg += '\n' + data.detail;
        if (!msg) msg = '저장에 실패했습니다.';
        alert(msg);
        console.error('[메뉴구조 저장 실패]', data);
      }
    } catch (err) {
      alert('저장 중 오류가 발생했습니다.');
      console.error('[메뉴구조 저장 예외]', err);
    }
  };

  return (
    <main className="admin-layout__content">
      <div className="admin-menu">
        <h2>메뉴관리</h2>        
        <form
          className="board-search-row board-search-row--single"
          onSubmit={e => { e.preventDefault(); }}
        >
          <input
            type="text"
            className="input"
            placeholder="메뉴검색"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <button type="submit" className="btn btn--primary">검색</button>
        </form>
        <div className="admin-menu__top-actions">
            <button type="button" className="btn btn--success" onClick={handleSaveMenus}>저장</button>
            <button type="button" className="btn btn--primary" onClick={handleAddMenu}>1차메뉴 생성</button>          
            <button type="button" className="btn btn--danger" onClick={handleDeleteChecked}>선택삭제</button>
        </div>
        <div className="common-list">
          <div className="common-list__header">
            <div className="common-list__cell common-list__checkbox">
              <div className="checkbox">
                <input
                  type="checkbox"
                  id="allchk"
                  className="checkbox__input"
                  checked={filteredMenus.length > 0 && filteredMenus.every(m => m.checked)}
                  onChange={e => handleCheckAll(e.target.checked)}
                />
                <label htmlFor="allchk" className="checkbox__label">
                  <span className="blind">전체선택</span>
                </label>
              </div>
            </div>
            <div className="common-list__cell common-list__menu-subject">메뉴명</div>
            <div className="common-list__cell common-list__desc">메뉴주소</div>
            <div className="common-list__cell common-list__actions2">관리</div>
          </div>
          {filteredMenus.map(menu => (
            <React.Fragment key={menu.id}>
              <div className="common-list__row">
                <div className="common-list__cell common-list__checkbox">
                  <div className="checkbox">
                    <input
                      type="checkbox"
                      id={`chk${menu.id}`}
                      className="checkbox__input"
                      checked={!!menu.checked}
                      onChange={e => handleCheck(menu.id, e.target.checked)}
                    />
                    <label htmlFor={`chk${menu.id}`} className="checkbox__label">
                      <span className="blind">선택</span>
                    </label>
                  </div>
                </div>
                <div className="common-list__cell common-list__menu-subject">
                  <input
                    type="text"
                    className="input"
                    value={menu.name ?? ''}
                    onChange={e => handleChange(menu.id, 'name', e.target.value)}
                  />
                </div>
                <div className="common-list__cell common-list__desc">
                  <input
                    type="text"
                    className="input"
                    value={menu.url ?? ''}
                    onChange={e => handleChange(menu.id, 'url', e.target.value)}
                  />
                </div>
                  <div className="common-list__cell common-list__desc">
                    <select
                      className="input"
                      value={menu.visible ?? 1}
                      onChange={e => handleChange(menu.id, 'visible', Number(e.target.value))}
                    >
                      <option value={1}>노출</option>
                      <option value={0}>숨김</option>
                    </select>
                  </div>
                <div className="common-list__cell common-list__actions2">
                  <button className="btn btn--primary btn--small" type="button" onClick={() => handleAddChild(menu.id)}>
                    2차 메뉴생성
                  </button>
                  <button className="btn btn--small" style={{ marginLeft: 8 }} type="button">
                    수정
                  </button>
                  <button className="btn btn--small" style={{ marginLeft: 8 }} type="button" onClick={() => handleDelete(menu.id)}>
                    삭제
                  </button>
                </div>
              </div>
              {/* 2차 메뉴 */}
              {menu.children && menu.children.map(child => (
                <div className="common-list__row" key={child.id}>
                  <div className="common-list__cell common-list__checkbox">
                    <div className="checkbox">
                      <input
                        type="checkbox"
                        id={`chk${child.id}`}
                        className="checkbox__input"
                        checked={!!child.checked}
                        onChange={e => handleCheck(child.id, e.target.checked, menu.id)}
                      />
                      <label htmlFor={`chk${child.id}`} className="checkbox__label">
                        <span className="blind">선택</span>
                      </label>
                    </div>
                  </div>
                  <div className="common-list__cell common-list__menu-subject" style={{ paddingLeft: '2rem' }}>
                    <input
                      type="text"
                      className="input"
                      value={child.name ?? ''}
                      onChange={e => handleChange(child.id, 'name', e.target.value, menu.id)}
                    />
                  </div>
                  <div className="common-list__cell common-list__desc">
                    <input
                      type="text"
                      className="input"
                      value={child.url ?? ''}
                      onChange={e => handleChange(child.id, 'url', e.target.value, menu.id)}
                    />
                  </div>
                    <div className="common-list__cell common-list__desc">
                      <select
                        className="input"
                        value={child.visible ?? 1}
                        onChange={e => handleChange(child.id, 'visible', Number(e.target.value), menu.id)}
                      >
                        <option value={1}>노출</option>
                        <option value={0}>숨김</option>
                      </select>
                    </div>
                  <div className="common-list__cell common-list__actions2">
                    <button className="btn btn--small" style={{ marginLeft: 8 }} type="button">
                      수정
                    </button>
                    <button className="btn btn--small" style={{ marginLeft: 8 }} type="button" onClick={() => handleDelete(child.id, menu.id)}>
                      삭제
                    </button>
                  </div>
                </div>
              ))}
            </React.Fragment>
          ))}
        </div>
        <div className="admin-menu__bottom-actions">
            <button type="button" className="btn btn--success" onClick={handleSaveMenus}>저장</button>
            <button type="button" className="btn btn--primary" onClick={handleAddMenu}>1차메뉴 생성</button>
            <button type="button" className="btn btn--danger" onClick={handleDeleteChecked}>선택삭제</button>
        </div>
      </div>
    </main>
  );
}
