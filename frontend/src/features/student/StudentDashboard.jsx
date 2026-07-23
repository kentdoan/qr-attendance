import DashboardLayout from "../../components/DashboardLayout";
import CheckinSection from "./components/CheckinSection";
import AttendanceHistory from "./components/AttendanceHistory";

export default function StudentDashboard() {
  return (
    <DashboardLayout
      title="Sinh viên"
      subtitle="Quét mã QR trên màn hình giảng viên"
    >
      <div className="mx-auto w-full max-w-7xl">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-start">
          <div className="lg:col-span-4">
            <CheckinSection />
          </div>
          <div className="lg:col-span-8">
            <AttendanceHistory />
          </div>

        </div>
      </div>
    </DashboardLayout>
  );
}
