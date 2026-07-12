import { useState } from 'react';
import { api } from '../../services/api';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import toast from 'react-hot-toast';
import { ScanFace } from 'lucide-react';

export default function StudentDashboard() {
  const [token, setToken] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCheckin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !sessionId) return toast.error('Vui lòng nhập Token và Session ID');
    
    setLoading(true);
    try {
      // In a real app, deviceFingerprint would be generated using a library like finger-printjs
      const deviceFingerprint = 'web-browser-' + navigator.userAgent.substring(0, 20);
      
      await api.post('/checkin', { token, sessionId, deviceFingerprint });
      toast.success('Điểm danh thành công! Bạn có thể đóng trang này.');
      setToken('');
    } catch (err: any) {
      toast.error('Điểm danh thất bại: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto space-y-6 pt-10">
      <div className="flex flex-col items-center gap-3 text-center mb-8">
        <div className="p-4 bg-orange-500/20 rounded-full text-orange-400">
          <ScanFace className="w-12 h-12" />
        </div>
        <h1 className="text-2xl font-bold">Sinh viên Điểm danh</h1>
        <p className="text-gray-400 text-sm">Quét mã QR trên bảng hoặc nhập tay mã Token bên dưới</p>
      </div>

      <Card>
        <form onSubmit={handleCheckin}>
          <CardContent className="space-y-4 pt-6">
            <Input 
              label="Session ID (Lấy từ URL QR)"
              placeholder="UUID"
              value={sessionId}
              onChange={e => setSessionId(e.target.value)}
              required
            />
            <Input 
              label="Mã Token (Lấy từ URL QR)"
              placeholder="HMAC string"
              value={token}
              onChange={e => setToken(e.target.value)}
              required
            />
            <Button type="submit" className="w-full bg-orange-600 hover:bg-orange-700" isLoading={loading} size="lg">
              Xác nhận Điểm danh
            </Button>
          </CardContent>
        </form>
      </Card>
      
      <div className="text-center text-xs text-gray-500">
        Tính năng Quét Camera trực tiếp sẽ được bổ sung trong phiên bản sau.
      </div>
    </div>
  );
}
