import AdminHeader from '@/components/admin/AdminHeader';
import AdminSidebar from '@/components/admin/AdminAside';
import AdminMenuManage from '../../../components/admin/AdminMenuManage';

export default function AdminMenuManagePage() {
  return (
    <div className="admin-layout">
        <AdminHeader />
        <div className='admin-layout__body'>
            <AdminSidebar />
            <main className="admin-layout__content">
                <AdminMenuManage />
            </main>
        </div>
    </div>
  )
}
