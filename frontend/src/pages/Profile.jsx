import { useState, useEffect } from "react";
import DashboardLayout from "../components/DashboardLayout";
import { useAuth } from "../auth/AuthContext";

export default function Profile() {
  const { user, updateProfile } = useAuth();

  const [formData, setFormData] = useState({
    fullName: "",
    school: "",
    faculty: "",
    major: "",
  });

  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (user) {
      setFormData({
        fullName: user.fullName || "",
        school: user.school || "",
        faculty: user.faculty || "",
        major: user.major || "",
      });
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);
    setError(null);
    setSubmitting(true);

    try {
      await updateProfile(formData);
      setMessage("Cập nhật thông tin cá nhân thành công.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Có lỗi xảy ra khi cập nhật.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout
      title="Hồ sơ cá nhân"
      subtitle="Quản lý thông tin tài khoản của bạn"
    >
      <div className="mx-auto max-w-2xl overflow-hidden rounded-2xl bg-white shadow-sm border border-slate-100">
        <div className="border-b border-slate-200 bg-slate-50 px-6 py-4">
          <h3 className="font-semibold text-slate-800">Thông tin cá nhân</h3>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {message && (
            <div className="rounded-lg bg-green-50 px-4 py-3 text-sm text-green-600">
              {message}
            </div>
          )}
          {error && (
            <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Email (Đăng nhập)
            </label>
            <input
              type="email"
              disabled
              value={user?.email || ""}
              className="w-full rounded-lg border border-slate-200 bg-slate-100 px-4 py-2 text-slate-500 cursor-not-allowed"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Họ và tên
            </label>
            <input
              type="text"
              name="fullName"
              required
              value={formData.fullName}
              onChange={handleChange}
              className="w-full rounded-lg border border-slate-300 px-4 py-2 text-slate-800 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Trường học
            </label>
            <input
              type="text"
              name="school"
              value={formData.school}
              onChange={handleChange}
              placeholder="Ví dụ: Đại học Bách Khoa"
              className="w-full rounded-lg border border-slate-300 px-4 py-2 text-slate-800 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Khoa
              </label>
              <input
                type="text"
                name="faculty"
                value={formData.faculty}
                onChange={handleChange}
                placeholder="Ví dụ: Khoa Khoa học Máy tính"
                className="w-full rounded-lg border border-slate-300 px-4 py-2 text-slate-800 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Chuyên ngành
              </label>
              <input
                type="text"
                name="major"
                value={formData.major}
                onChange={handleChange}
                placeholder="Ví dụ: Kỹ thuật phần mềm"
                className="w-full rounded-lg border border-slate-300 px-4 py-2 text-slate-800 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
              />
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-indigo-600 px-6 py-2.5 font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting ? "Đang lưu..." : "Lưu thay đổi"}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
