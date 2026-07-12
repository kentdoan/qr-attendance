import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { api } from '../../services/api';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import toast from 'react-hot-toast';
import { PowerOff, RotateCw, Users, Loader2 } from 'lucide-react';

export default function SessionView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [token, setToken] = useState<string>('');
  const [timeLeft, setTimeLeft] = useState(60);
  const [status, setStatus] = useState<'ACTIVE' | 'CLOSED'>('ACTIVE');
  const [reportData, setReportData] = useState<any>(null);

  const fetchToken = async () => {
    if (status === 'CLOSED') return;
    try {
      const data = await api.get<{ token: string, expiresIn: number }>(`/sessions/${id}/qr`);
      setToken(data.token);
      setTimeLeft(60); // Reset timer
    } catch (err: any) {
      if (err.message.includes('closed')) {
        setStatus('CLOSED');
      }
      toast.error('Lỗi lấy QR: ' + err.message);
    }
  };

  useEffect(() => {
    fetchToken();
    const interval = setInterval(() => {
      fetchToken();
    }, 55000); // Refresh every 55s before it expires
    
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, status]);

  // Timer countdown
  useEffect(() => {
    if (status === 'CLOSED' || timeLeft <= 0) return;
    const timer = setInterval(() => setTimeLeft(t => t - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, status]);

  const handleClose = async () => {
    try {
      await api.patch(`/sessions/${id}/close`);
      setStatus('CLOSED');
      toast.success('Đã đóng phiên điểm danh');
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const fetchReport = async () => {
    try {
      const data = await api.get(`/sessions/${id}/report`);
      setReportData(data);
    } catch (err: any) {
      toast.error('Lỗi tải báo cáo: ' + err.message);
    }
  };

  useEffect(() => {
    if (status === 'CLOSED') {
      fetchReport();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Màn hình Điểm danh</h1>
          <p className="text-gray-400 mt-1">ID: {id}</p>
        </div>
        <div className="flex gap-3">
          {status === 'ACTIVE' && (
            <Button onClick={handleClose} variant="danger" className="animate-pulse">
              <PowerOff className="w-4 h-4 mr-2" /> Đóng phiên
            </Button>
          )}
          {status === 'CLOSED' && (
            <Button onClick={() => navigate('/teacher')} variant="secondary">
              Về trang chủ
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        {/* QR CODE SECTION */}
        <Card className="flex flex-col items-center justify-center p-12 relative overflow-hidden group">
          {status === 'CLOSED' ? (
            <div className="text-center space-y-4">
              <div className="w-32 h-32 mx-auto rounded-full bg-red-500/20 flex items-center justify-center text-red-500">
                <PowerOff className="w-16 h-16" />
              </div>
              <h2 className="text-xl font-bold text-red-400">Đã Đóng</h2>
            </div>
          ) : (
            <>
              <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/10 to-blue-500/10 opacity-50"></div>
              <div className="relative bg-white p-6 rounded-2xl shadow-2xl">
                {token ? (
                  <QRCodeSVG 
                    value={`https://example.com/checkin?sessionId=${id}&token=${token}`} 
                    size={280} 
                    level="H"
                  />
                ) : (
                  <div className="w-[280px] h-[280px] flex items-center justify-center bg-gray-100 rounded-lg">
                    <Loader2 className="w-10 h-10 animate-spin text-gray-400" />
                  </div>
                )}
              </div>
              <div className="mt-8 flex items-center gap-2 text-purple-400 font-mono text-lg bg-purple-500/10 px-4 py-2 rounded-full">
                <RotateCw className="w-5 h-5 animate-spin-slow" />
                Đang thay đổi sau: <span className="font-bold w-6">{timeLeft}s</span>
              </div>
              <p className="text-xs text-gray-500 mt-4 text-center max-w-[280px] break-all">
                Token: {token}
              </p>
            </>
          )}
        </Card>

        {/* REPORT SECTION */}
        <Card className="h-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-gray-400" />
              Báo cáo Trực tiếp
            </CardTitle>
          </CardHeader>
          <CardContent>
            {status === 'ACTIVE' ? (
              <div className="flex flex-col items-center justify-center h-48 text-gray-500 space-y-4">
                <Users className="w-12 h-12 opacity-50" />
                <p>Danh sách sẽ xuất hiện khi bạn Đóng phiên</p>
                <Button variant="secondary" size="sm" onClick={fetchReport}>Tải thử ngay</Button>
              </div>
            ) : reportData ? (
              <div className="space-y-4">
                <div className="text-4xl font-bold text-center text-green-400 py-6 bg-green-500/10 rounded-xl">
                  {reportData.totalAttendees} <span className="text-base text-gray-400 font-normal">sinh viên đã điểm danh</span>
                </div>
                <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                  {reportData.attendees?.map((a: any, i: number) => (
                    <div key={i} className="bg-gray-800/50 p-3 rounded flex justify-between items-center text-sm">
                      <span className="font-mono text-gray-300 truncate w-32">{a.studentId.substring(0, 15)}...</span>
                      <span className="text-gray-500">{new Date(a.checkinTime).toLocaleTimeString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex justify-center p-8"><Loader2 className="animate-spin text-gray-500" /></div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
