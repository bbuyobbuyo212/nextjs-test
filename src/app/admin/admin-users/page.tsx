import AdminHeader from '@/components/admin/AdminHeader';
import AdminSidebar from '@/components/admin/AdminAside';
import AdminUsers from '../../../components/admin/AdminUsers';

export default function AdminUsersPage() {
    return (
        <div className="admin-layout">
            <AdminHeader />
            <div className='admin-layout__body'>
                <AdminSidebar />
                <main className="admin-layout__content">
                    <AdminUsers />
            </main>
            </div>
        </div>
    );
}
