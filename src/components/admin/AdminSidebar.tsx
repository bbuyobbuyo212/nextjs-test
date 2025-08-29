import React from 'react';
import Link from 'next/link';

const AdminSidebar = () => (
  <aside className="admin-aside">
    <nav>
      <ul>
        <li><Link href="/admin/admin-users">회원관리</Link></li>
        <li><Link href="/admin/admin-boards">게시판관리</Link></li>
        <li><Link href="/admin/admin-menu">메뉴관리</Link></li>
      </ul>
    </nav>
  </aside>
);

export default AdminSidebar;
