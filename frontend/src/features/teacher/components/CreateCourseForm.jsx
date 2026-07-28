import { useState } from "react";
import { useDispatch } from "react-redux";
import { attendanceApi } from "../../../api/attendance";
import { addCourse } from "../teacherSlice";

export default function CreateCourseForm({ onCreated }) {
  const dispatch = useDispatch();
  const [courseName, setCourseName] = useState("");
  const [courseCode, setCourseCode] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState(null);

  async function handleCreate(e) {
    e.preventDefault();
    if (!courseName.trim() || !courseCode.trim()) return;
    setCreating(true);
    setError(null);
    const res = await attendanceApi.createCourse({
      courseName: courseName.trim(),
      courseCode: courseCode.trim(),
    });
    setCreating(false);
    if (res.success && res.data?.course) {
      dispatch(addCourse(res.data.course));
      setCourseName("");
      setCourseCode("");
      if (onCreated) onCreated();
    } else {
      setError(res.message ?? "Không tạo được môn học.");
    }
  }

  return (
    <form onSubmit={handleCreate} className="mb-6 rounded-3xl bg-white/80 backdrop-blur-xl p-8 shadow-[var(--shadow-card)] border border-white hover:shadow-[var(--shadow-premium)] transition-all duration-500 relative overflow-hidden group">
      <div className="absolute inset-0 bg-gradient-to-tr from-indigo-50/50 to-white opacity-50 pointer-events-none"></div>
      <div className="relative z-10">
        <h2 className="mb-6 text-xl font-display font-bold text-slate-800">Thêm môn học mới</h2>
        {error && (
          <div className="mb-4 rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm font-medium text-red-600">
            {error}
          </div>
        )}
      <div className="mb-4 grid gap-4 md:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">Mã môn học</label>
          <input
            value={courseCode}
            onChange={(e) => setCourseCode(e.target.value)}
            placeholder="VD: INT3306"
            className="w-full rounded-xl border-2 border-slate-200 bg-white px-4 py-3 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition-all"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">Tên môn học</label>
          <input
            value={courseName}
            onChange={(e) => setCourseName(e.target.value)}
            placeholder="VD: Phát triển ứng dụng Web"
            className="w-full rounded-xl border-2 border-slate-200 bg-white px-4 py-3 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition-all"
          />
        </div>
      </div>
      <button
        type="submit"
        disabled={creating || !courseName.trim() || !courseCode.trim()}
        className="rounded-xl bg-indigo-600 px-6 py-3 font-semibold text-white hover:bg-indigo-700 disabled:opacity-60 transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5"
      >
        {creating ? "Đang thêm…" : "Thêm môn học"}
      </button>
      </div>
    </form>
  );
}
