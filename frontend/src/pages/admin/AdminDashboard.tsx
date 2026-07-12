import { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import toast from 'react-hot-toast';
import { Users, Shield, ShieldOff, Loader2 } from 'lucide-react';

interface User {
  username: string;
  status: string;
  attributes: { email: string; [key: string]: string };
  created: string;
}

export default function AdminDashboard() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [targetUser, setTargetUser] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchUsers = async () => {
    try {
      const data = await api.get<{ users: User[] }>('/admin/users');
      setUsers(data.users);
    } catch (err: any) {
      toast.error('Không thể tải danh sách users: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRoleAction = async (action: 'assign' | 'revoke') => {
    if (!targetUser) return toast.error('Vui lòng nhập Username/Email');
    
    setActionLoading(true);
    try {
      await api.post(`/admin/${action}-teacher`, { username: targetUser });
      toast.success(`Đã ${action === 'assign' ? 'cấp' : 'thu hồi'} quyền TEACHER thành công!`);
      setTargetUser('');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-blue-500/20 rounded-lg text-blue-400">
          <Shield className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Quản lý phân quyền</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input 
              label="Email User (Target)"
              placeholder="kent@example.com"
              value={targetUser}
              onChange={e => setTargetUser(e.target.value)}
            />
            <div className="flex flex-col gap-2">
              <Button 
                onClick={() => handleRoleAction('assign')} 
                isLoading={actionLoading}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                <Shield className="w-4 h-4 mr-2" />
                Cấp quyền Giảng Viên
              </Button>
              <Button 
                onClick={() => handleRoleAction('revoke')} 
                variant="danger" 
                isLoading={actionLoading}
                className="w-full"
              >
                <ShieldOff className="w-4 h-4 mr-2" />
                Thu hồi quyền Giảng Viên
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-gray-400" />
              Danh sách tài khoản
            </CardTitle>
            <Button size="sm" variant="secondary" onClick={fetchUsers}>Làm mới</Button>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center p-8"><Loader2 className="animate-spin text-gray-500" /></div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-gray-400 uppercase bg-gray-800/50">
                    <tr>
                      <th className="px-4 py-3 rounded-tl-lg">Email</th>
                      <th className="px-4 py-3">Vai trò</th>
                      <th className="px-4 py-3">Trạng thái</th>
                      <th className="px-4 py-3 rounded-tr-lg">Ngày tạo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(u => (
                      <tr key={u.username} className="border-b border-gray-800 hover:bg-gray-800/20 transition-colors">
                        <td className="px-4 py-3 font-medium text-white">{u.attributes.email}</td>
                        <td className="px-4 py-3">
                          {u.attributes['custom:role'] === 'ADMIN' && <span className="px-2 py-1 text-xs rounded-full bg-red-500/10 text-red-400 font-bold border border-red-500/20">ADMIN</span>}
                          {u.attributes['custom:role'] === 'TEACHER' && <span className="px-2 py-1 text-xs rounded-full bg-blue-500/10 text-blue-400 font-bold border border-blue-500/20">TEACHER</span>}
                          {u.attributes['custom:role'] === 'STUDENT' && <span className="px-2 py-1 text-xs rounded-full bg-zinc-500/10 text-zinc-400 font-bold border border-zinc-500/20">STUDENT</span>}
                          {!u.attributes['custom:role'] && <span className="px-2 py-1 text-xs rounded-full bg-gray-500/10 text-gray-400">N/A</span>}
                        </td>
                        <td className="px-4 py-3">
                          <span className={cn(
                            "px-2 py-1 text-xs rounded-full",
                            u.status === 'CONFIRMED' ? "bg-green-500/10 text-green-400" : "bg-orange-500/10 text-orange-400"
                          )}>
                            {u.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-400">{new Date(u.created).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Inline helper for this file
function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}
