import { useState, useEffect } from "react";
import { attendanceApi } from "../../../api/attendance";
import { exportReportToExcel } from "../../../utils/exportExcel";

const LIST_POLL_MS = 5000;

export default function AttendanceList({ session }) {
  const [records, setRecords] = useState([]);

  useEffect(() => {
    if (!session) return;
    let mounted = true;
    const load = async () => {
      const res = await attendanceApi.getReport(session.id);
      if (mounted && res.success && res.data) setRecords(res.data.records);
    };
    void load();
    const id = setInterval(load, LIST_POLL_MS);
    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, [session]);

  async function handleExport() {
    if (!session) return;
    const res = await attendanceApi.getReport(session.id);
    if (res.success && res.data) {
      exportReportToExcel(res.data, session);
    }
  }

  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-semibold text-slate-800">
          Đã điểm danh{" "}
          <span className="text-indigo-600">({records.length})</span>
        </h2>
        <button
          onClick={handleExport}
          className="rounded-lg bg-green-600 px-3 py-2 text-sm font-semibold text-white hover:bg-green-700"
        >
          Xuất Excel
        </button>
      </div>

      <div className="flex-1 overflow-auto rounded-xl border border-slate-100">
        <table className="w-full text-left text-sm">
          <thead className="sticky top-0 bg-slate-50 text-slate-500 border-b border-slate-200">
            <tr>
              <th className="px-3 py-3 font-semibold">#</th>
              <th className="px-3 py-3 font-semibold">Họ tên</th>
              <th className="px-3 py-3 font-semibold">Trường</th>
              <th className="px-3 py-3 font-semibold">Khoa</th>
              <th className="px-3 py-3 font-semibold">Ngành</th>
              <th className="px-3 py-3 font-semibold">Thời gian</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 bg-white">
            {records.length === 0 ? (
              <tr>
                <td
                  colSpan={3}
                  className="px-3 py-12 text-center text-slate-400"
                >
                  Chưa có sinh viên điểm danh.
                </td>
              </tr>
            ) : (
              records.map((r, i) => (
                <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-3 py-3 text-slate-400">{i + 1}</td>
                  <td className="px-3 py-3 font-medium text-slate-700">
                    {r.studentName}
                  </td>
                  <td className="px-3 py-3 text-slate-600">{r.studentSchool || "-"}</td>
                  <td className="px-3 py-3 text-slate-600">{r.studentFaculty || "-"}</td>
                  <td className="px-3 py-3 text-slate-600">{r.studentMajor || "-"}</td>
                  <td className="px-3 py-3 text-slate-500">
                    {new Date(r.checkinAt).toLocaleTimeString("vi-VN")}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
