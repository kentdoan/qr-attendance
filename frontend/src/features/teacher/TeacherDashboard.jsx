import { useEffect, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useSearchParams } from "react-router-dom";
import DashboardLayout from "../../components/DashboardLayout";
import { useAuth } from "../../auth/AuthContext";
import { fetchSessions, fetchCourses } from "./teacherSlice";

import CreateSessionForm from "./components/CreateSessionForm";
import SessionList from "./components/SessionList";
import ActiveSessionCard from "./components/ActiveSessionCard";
import AttendanceList from "./components/AttendanceList";
import CreateCourseForm from "./components/CreateCourseForm";
import CourseList from "./components/CourseList";

export default function TeacherDashboard() {
  const { user } = useAuth();
  const dispatch = useDispatch();
  
  const [searchParams] = useSearchParams();
  const sessionIdParam = searchParams.get("sessionId");

  const { sessionList, loadingSessions, error, courseList } = useSelector((state) => state.teacher);
  const session = sessionList.find(s => s.id === sessionIdParam) || null;

  const loadData = useCallback(async () => {
    if (user) {
      dispatch(fetchSessions());
      dispatch(fetchCourses());
    }
  }, [user, dispatch]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loadingSessions && sessionList.length === 0) {
    return (
      <DashboardLayout title="Giảng viên" subtitle="Đang tải dữ liệu...">
        <div className="flex h-40 items-center justify-center text-slate-400">Đang tải...</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title="Giảng viên"
      subtitle="Tạo phiên & trình chiếu QR điểm danh động"
    >
      {!session ? (
        <div className="mx-auto w-full max-w-7xl space-y-6">
          {error && (
            <div className="rounded-xl bg-red-50 p-4 text-red-600 border border-red-100 shadow-sm font-medium">
              Lỗi tải dữ liệu: {error}
            </div>
          )}
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-4 space-y-6">
              <CreateSessionForm user={user} courseList={courseList} />
              
              <div className="rounded-3xl bg-white/80 backdrop-blur-xl p-8 shadow-[var(--shadow-card)] border border-white hover:shadow-[var(--shadow-premium)] transition-all duration-500 relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-tr from-white to-indigo-50/30 opacity-50 pointer-events-none"></div>
                <div className="relative z-10">
                  <h2 className="mb-2 text-xl font-display font-bold text-slate-800">Quản lý môn học</h2>
                  <p className="mb-6 text-sm font-medium text-slate-500">Tạo môn học trước khi mở phiên điểm danh.</p>
                  <CourseList />
                </div>
              </div>
            </div>
            
            <div className="lg:col-span-8 space-y-6">
              <CreateCourseForm />
              <SessionList />
            </div>
          </div>
        </div>
      ) : (
        <div className="mx-auto w-full max-w-7xl">
          <div className="grid gap-6 lg:grid-cols-12 items-start">
            <div className="lg:col-span-5">
              <ActiveSessionCard session={session} />
            </div>

            <div className="lg:col-span-7">
              <AttendanceList session={session} />
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
