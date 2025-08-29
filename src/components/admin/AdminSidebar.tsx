import React from 'react';
import '../../styles/admin.css';

const AdminSidebar = () => (
  <aside className="admin-sidebar">
    <ul className="admin-sidebar__menu">
      <li><a href="/admin/admin-users">회원관리</a></li>
      <li><a href="/admin/admin-boards">게시판관리</a></li>
      <li><a href="/admin/admin-menu">메뉴관리</a></li>
      {/* 추가 메뉴 가능 */}
    </ul>
  </aside>
);

export default AdminSidebar;
