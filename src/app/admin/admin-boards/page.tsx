import AdminHeader from '@/components/admin/AdminHeader';
import AdminSidebar from '@/components/admin/AdminAside';
import AdminBoards from '../../../components/admin/AdminBoards';

export default function AdminBoardsPage() {
  return (
    <div className="admin-layout">
        <AdminHeader />
        <div className='admin-layout__body'>
            <AdminSidebar />
            <main className="admin-layout__content">
                <AdminBoards />
        </main>
        </div>
    </div>
  )
}
