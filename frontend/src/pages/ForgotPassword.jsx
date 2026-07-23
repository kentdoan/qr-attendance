import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export default function ForgotPassword() {
  const { forgotPassword, confirmForgotPassword } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState("request");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleRequestSubmit(e) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!email) {
      setError("Vui lòng nhập email");
      return;
    }

    setSubmitting(true);
    try {
      await forgotPassword(email);
      setSuccess("Mã xác thực đã được gửi đến email của bạn.");
      setStep("confirm");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Có lỗi xảy ra");
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

    if (newPassword !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp");
      return;
    }
    
    if (newPassword.length < 6) {
      setError("Mật khẩu tối thiểu 6 ký tự");
      return;
    }

    setSubmitting(true);
    try {
      await confirmForgotPassword({ email, code, newPassword });
      setSuccess("Đổi mật khẩu thành công! Đang chuyển hướng...");
      setTimeout(() => navigate("/login", { replace: true }), 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Mã xác thực không đúng hoặc đã hết hạn");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-8">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-slate-800">
            {step === "request" ? "Quên mật khẩu" : "Đặt lại mật khẩu"}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {step === "request"
              ? "Nhập email của bạn để nhận mã xác nhận"
              : `Nhập mã xác thực đã gửi đến ${email} và mật khẩu mới`}
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

        {step === "request" ? (
          <form onSubmit={handleRequestSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Email đã đăng ký
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

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-lg bg-indigo-600 py-2.5 font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "Đang gửi..." : "Nhận mã xác thực"}
            </button>
            <Link
              to="/login"
              className="mt-4 block w-full text-center text-sm font-medium text-slate-600 hover:text-slate-800"
            >
              Quay lại đăng nhập
            </Link>
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
                className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-center text-lg font-semibold tracking-widest text-slate-800 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Mật khẩu mới
              </label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-slate-800 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Xác nhận mật khẩu mới
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
              {submitting ? "Đang xử lý..." : "Đổi mật khẩu"}
            </button>
            <button
              type="button"
              onClick={() => setStep("request")}
              className="mt-2 w-full rounded-lg bg-slate-100 py-2.5 font-semibold text-slate-600 transition hover:bg-slate-200"
            >
              Gửi lại email
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
