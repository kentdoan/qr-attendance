import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../../services/auth';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../../components/ui/Card';
import toast from 'react-hot-toast';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'register' | 'confirm'>('register');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return toast.error('Vui lòng nhập đủ thông tin');
    
    setLoading(true);
    try {
      await authService.register(email, password);
      toast.success('Đăng ký thành công! Vui lòng kiểm tra email lấy mã xác nhận.');
      setStep('confirm');
    } catch (err: any) {
      toast.error(err.message || 'Đăng ký thất bại');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code) return toast.error('Vui lòng nhập mã xác nhận');
    
    setLoading(true);
    try {
      await authService.confirm(email, code);
      toast.success('Xác nhận thành công! Bạn có thể đăng nhập ngay.');
      navigate('/login');
    } catch (err: any) {
      toast.error(err.message || 'Xác nhận thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center">
            {step === 'register' ? 'Tạo tài khoản' : 'Xác nhận Email'}
          </CardTitle>
          <CardDescription className="text-center">
            {step === 'register' 
              ? 'Tài khoản mới sẽ mặc định là Sinh viên' 
              : `Nhập mã 6 số được gửi tới ${email}`}
          </CardDescription>
        </CardHeader>

        {step === 'register' ? (
          <form onSubmit={handleRegister}>
            <CardContent className="space-y-4">
              <Input
                label="Email"
                type="email"
                placeholder="kent@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Input
                label="Mật khẩu"
                type="password"
                placeholder="Ít nhất 8 ký tự, có chữ hoa, số"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Button type="submit" className="w-full" isLoading={loading}>
                Đăng ký
              </Button>
              <div className="text-center text-sm text-gray-400">
                Đã có tài khoản?{' '}
                <Link to="/login" className="text-purple-400 hover:text-purple-300 font-medium">
                  Đăng nhập
                </Link>
              </div>
            </CardFooter>
          </form>
        ) : (
          <form onSubmit={handleConfirm}>
            <CardContent className="space-y-4">
              <Input
                label="Mã xác nhận"
                type="text"
                placeholder="123456"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                required
              />
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Button type="submit" className="w-full" variant="primary" isLoading={loading}>
                Kích hoạt tài khoản
              </Button>
            </CardFooter>
          </form>
        )}
      </Card>
    </div>
  );
}
