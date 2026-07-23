import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export default function Register() {
  const { register, confirmRegister } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState("register");
  
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [code, setCode] = useState("");
  
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleRegisterSubmit(e) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (password !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp");
      return;
    }
    if (password.length < 6) {
      setError("Mật khẩu tối thiểu 6 ký tự");
      return;
    }

    setSubmitting(true);
    try {
      await register({ fullName, email, password });
      setSuccess("Mã xác thực đã được gửi đến email của bạn.");
      setStep("confirm");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Đăng ký thất bại");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleConfirmSubmit(e) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    
    if (!code) {
      setError("Vui lòng nhập mã xác thực");
      return;
    }

    setSubmitting(true);
    try {
      await confirmRegister({ email, code });
      setSuccess("Xác thực thành công! Đang chuyển hướng...");
      setTimeout(() => navigate("/login", { replace: true }), 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Mã xác thực không đúng");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-8">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-slate-800">
            {step === "register" ? "Đăng ký" : "Xác thực Email"}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {step === "register" ? "Tạo tài khoản sinh viên" : `Nhập mã gồm 6 số đã gửi đến ${email}`}
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-600">
            {success}
          </div>
        )}

        {step === "register" ? (
          <form onSubmit={handleRegisterSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Họ và tên
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Nguyễn Văn A"
                className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-slate-800 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-slate-800 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Mật khẩu
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-slate-800 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Xác nhận mật khẩu
              </label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-slate-800 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-lg bg-indigo-600 py-2.5 font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "Đang xử lý..." : "Đăng ký"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleConfirmSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Mã xác thực (OTP)
              </label>
              <input
                type="text"
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="123456"
                className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-center tracking-widest text-lg font-semibold text-slate-800 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-lg bg-indigo-600 py-2.5 font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "Đang xử lý..." : "Xác nhận mã"}
            </button>
            <button
              type="button"
              onClick={() => setStep("register")}
              className="w-full rounded-lg bg-slate-100 py-2.5 font-semibold text-slate-600 transition hover:bg-slate-200 mt-2"
            >
              Quay lại (Đăng ký lại)
            </button>
          </form>
        )}

        {step === "register" && (
          <p className="mt-6 text-center text-sm text-slate-500">
            Đã có tài khoản?{" "}
            <Link
              to="/login"
              className="font-semibold text-indigo-600 hover:underline"
            >
              Đăng nhập
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
