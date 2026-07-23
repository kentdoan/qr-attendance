import { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useSearchParams } from "react-router-dom";
import { attendanceApi } from "../../../api/attendance";
import { removeSession } from "../teacherSlice";

export default function SessionList() {
  const dispatch = useDispatch();
  const { sessionList } = useSelector((state) => state.teacher);
  const [, setSearchParams] = useSearchParams();
  
  const [showHistory, setShowHistory] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  async function handleDelete(id) {
    if (!window.confirm("Bạn có chắc chắn muốn xóa phiên này vĩnh viễn không? Các lượt điểm danh của sinh viên thuộc phiên này sẽ mất liên kết.")) return;
    const res = await attendanceApi.deleteSession(id);
    if (res.success) {
      dispatch(removeSession(id));
      setSearchParams({});
    } else {
      alert("Xóa phiên thất bại: " + (res.error?.message || "Lỗi không xác định"));
    }
  }

  return (
    <div className="rounded-3xl bg-white/80 backdrop-blur-xl p-8 shadow-[var(--shadow-card)] border border-white hover:shadow-[var(--shadow-premium)] transition-all duration-500 relative overflow-hidden group">
      <div className="absolute inset-0 bg-gradient-to-br from-white to-slate-50 opacity-50 pointer-events-none"></div>
      <div className="relative z-10 mb-6 flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-xl font-display font-bold text-slate-800">
          Các phiên điểm danh của bạn
        </h2>
        <button
          onClick={() => setShowHistory(!showHistory)}
          className="rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm border border-slate-200 hover:bg-slate-50 hover:text-indigo-600 focus:outline-none focus:ring-4 focus:ring-indigo-50 transition-all hover:-translate-y-0.5"
        >
          {showHistory ? "Ẩn lịch sử" : "Xem lịch sử tạo phiên"}
        </button>
      </div>
      
      {showHistory && (
        <div className="flex-1 flex flex-col mt-4 relative z-10 animate-fade-up">
          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white/50 flex-1 shadow-sm">
            <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50/80 text-slate-600 sticky top-0 backdrop-blur-md">
              <tr>
                <th className="px-5 py-4 font-semibold">Tên phiên</th>
                <th className="px-5 py-4 font-semibold">Thời gian tạo</th>
                <th className="px-5 py-4 font-semibold">Trạng thái</th>
                <th className="px-5 py-4 font-semibold">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {sessionList.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-slate-400">
                    Chưa có phiên điểm danh nào.
                  </td>
                </tr>
              ) : (
                sessionList.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE).map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-4 font-semibold text-slate-800 text-base">{s.title}</td>
                    <td className="px-5 py-4">
                      <div className="font-medium text-slate-800">
                        {new Date(s.createdAt).toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </div>
                      <div className="text-slate-500 text-xs mt-1">
                        {new Date(s.createdAt).toLocaleDateString("vi-VN")}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${s.isOpen ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-600"}`}>
                        {s.isOpen ? "Đang mở" : "Đã đóng"}
                      </span>
                    </td>
                    <td className="px-5 py-4 flex gap-4">
                      <button
                        onClick={() => setSearchParams({ sessionId: s.id })}
                        className="font-medium text-indigo-600 hover:text-indigo-800 transition-colors"
                      >
                        Xem chi tiết
                      </button>
                      <button
                        onClick={() => handleDelete(s.id)}
                        className="font-medium text-red-500 hover:text-red-700 transition-colors"
                      >
                        Xóa
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          </div>
          
          {sessionList.length > 0 && (
            <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-5">
              <span className="text-sm font-medium text-slate-500 bg-slate-50 px-3 py-1.5 rounded-md">
                Hiển thị {(currentPage - 1) * ITEMS_PER_PAGE + 1} -{" "}
                {Math.min(currentPage * ITEMS_PER_PAGE, sessionList.length)} / {sessionList.length}
              </span>
              <div className="flex gap-2 items-center">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => p - 1)}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-indigo-600 disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-slate-700 transition-colors"
                >
                  Trước
                </button>
                <span className="text-sm font-semibold text-slate-700 min-w-[3rem] text-center">
                  {currentPage} / {Math.ceil(sessionList.length / ITEMS_PER_PAGE) || 1}
                </span>
                <button
                  disabled={currentPage >= Math.ceil(sessionList.length / ITEMS_PER_PAGE)}
                  onClick={() => setCurrentPage((p) => p + 1)}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-indigo-600 disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-slate-700 transition-colors"
                >
                  Sau
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
