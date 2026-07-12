import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import toast from 'react-hot-toast';
import { Presentation, Play } from 'lucide-react';

interface Session {
  sessionId: string;
  className: string;
  duration: number;
  status: string;
  createdAt: string;
}

export default function TeacherDashboard() {
  const [className, setClassName] = useState('');
  const [duration, setDuration] = useState('60');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!className) return toast.error('Vui lòng nhập tên lớp');
    
    setLoading(true);
    try {
      const data = await api.post<{ session: Session }>('/sessions', { 
        className, 
        duration: parseInt(duration) || 60 
      });
      toast.success('Tạo phiên điểm danh thành công!');
      navigate(`/teacher/session/${data.session.sessionId}`);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-green-500/20 rounded-lg text-green-400">
          <Presentation className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-bold">Giảng viên - Quản lý lớp học</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tạo phiên điểm danh mới</CardTitle>
        </CardHeader>
        <form onSubmit={handleCreateSession}>
          <CardContent className="space-y-4">
            <Input 
              label="Tên Lớp / Môn học"
              placeholder="VD: Toán Cao Cấp L01"
              value={className}
              onChange={e => setClassName(e.target.value)}
              required
            />
            <Input 
              label="Thời gian hiệu lực (Phút)"
              type="number"
              placeholder="60"
              value={duration}
              onChange={e => setDuration(e.target.value)}
              required
            />
            <Button type="submit" className="w-full bg-green-600 hover:bg-green-700" isLoading={loading}>
              <Play className="w-4 h-4 mr-2" />
              Bắt đầu trình chiếu QR Code
            </Button>
          </CardContent>
        </form>
      </Card>
      
      <div className="text-center text-sm text-gray-500 mt-8">
        (Tính năng Liệt kê danh sách các lớp đã tạo sẽ được bổ sung sau)
      </div>
    </div>
  );
}
