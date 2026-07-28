import { useState } from "react";
import { useDispatch } from "react-redux";
import { useSearchParams } from "react-router-dom";
import { attendanceApi } from "../../../api/attendance";
import { addSession } from "../teacherSlice";

export default function CreateSessionForm({ user, courseList = [] }) {
  const dispatch = useDispatch();
  const [, setSearchParams] = useSearchParams();
  const [courseId, setCourseId] = useState("");
  const [duration, setDuration] = useState(60);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState(null);

  async function handleCreate(e) {
    e.preventDefault();
    if (!user) return;
    setCreating(true);
    setError(null);
    const res = await attendanceApi.createSession({
      courseId: courseId,
      className: "Phiên điểm danh", // Fallback compatibility
      duration: duration,
    });
    setCreating(false);
    if (res.success && res.data) {
      dispatch(addSession(res.data));
      setSearchParams({ sessionId: res.data.id });
    } else {
      setError(res.message ?? "Không tạo được phiên.");
    }
  }

  return (
    <form
      onSubmit={handleCreate}
      className="rounded-3xl bg-white/80 backdrop-blur-xl p-8 shadow-[var(--shadow-card)] border border-white hover:shadow-[var(--shadow-premium)] transition-all duration-500 relative overflow-hidden group mb-6"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 to-white opacity-50 pointer-events-none"></div>
      <div className="relative z-10">
        <h2 className="mb-6 text-xl font-display font-bold text-slate-800">
          Tạo phiên điểm danh
        </h2>
        {error && (
          <div className="mb-4 rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm font-medium text-red-600">
            {error}
          </div>
        )}
        <label className="mb-1.5 block text-sm font-medium text-slate-700">
          Chọn môn học
        </label>
        <select
          value={courseId}
          onChange={(e) => setCourseId(e.target.value)}
          className="mb-5 w-full rounded-xl border-2 border-slate-200 bg-white px-4 py-3 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition-all"
        >
        <option value="" disabled>-- Hãy chọn môn học --</option>
        {courseList.map(course => (
          <option key={course.courseId} value={course.courseId}>
            {course.courseCode} - {course.courseName}
          </option>
        ))}
      </select>

        <label className="mb-1.5 block text-sm font-medium text-slate-700">
          Thời gian điểm danh (phút, từ 1 - 180)
        </label>
        <input
          type="number"
          min={1}
          max={180}
          value={duration}
          onChange={(e) => setDuration(Number(e.target.value))}
          className="mb-8 w-full rounded-xl border-2 border-slate-200 bg-white px-4 py-3 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition-all"
        />

        <button
          type="submit"
          disabled={creating || !courseId}
          className="w-full rounded-2xl bg-gradient-to-r from-indigo-500 to-violet-600 py-3.5 text-base font-semibold text-white hover:from-indigo-600 hover:to-violet-700 disabled:opacity-60 transition-all shadow-md hover:shadow-[var(--shadow-hover)] hover:-translate-y-0.5 focus:ring-4 focus:ring-indigo-200"
        >
          {creating ? "Đang tạo…" : "Tạo phiên"}
        </button>
      </div>
    </form>
  );
}
