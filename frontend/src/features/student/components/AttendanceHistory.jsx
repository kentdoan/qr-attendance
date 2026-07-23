import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { fetchStudentHistory } from "../studentSlice";

export default function AttendanceHistory() {
  const dispatch = useDispatch();
  const { history, loadingHistory, error } = useSelector((state) => state.student);
  const [showHistory, setShowHistory] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    dispatch(fetchStudentHistory());
  }, [dispatch]);

  const totalPages = Math.ceil(history.length / ITEMS_PER_PAGE) || 1;

  return (
    <div className="rounded-3xl bg-white/80 backdrop-blur-xl p-8 shadow-[var(--shadow-card)] border border-white hover:shadow-[var(--shadow-premium)] transition-all duration-500 relative overflow-hidden group">
      <div className="absolute inset-0 bg-gradient-to-tl from-slate-50 to-white opacity-50 pointer-events-none"></div>
      <div className="relative z-10 mb-6 flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-xl font-display font-bold text-slate-800">
          Lịch sử điểm danh của bạn
        </h2>
        <button
          onClick={() => setShowHistory(!showHistory)}
          className="rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm border border-slate-200 hover:bg-slate-50 hover:text-indigo-600 focus:outline-none focus:ring-4 focus:ring-indigo-50 transition-all hover:-translate-y-0.5"
        >
          {showHistory ? "Ẩn lịch sử" : "Xem lịch sử"}
        </button>
      </div>

      {showHistory && (
        <div className="flex-1 flex flex-col relative z-10 animate-fade-up">
          {loadingHistory && history.length === 0 ? (
            <div className="flex-1 flex items-center justify-center p-8 text-slate-500">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mr-3"></div>
              Đang tải dữ liệu...
            </div>
          ) : error ? (
            <div className="flex-1 flex items-center justify-center p-8 text-red-500 bg-red-50 rounded-xl border border-red-100">
              <span className="mr-2">⚠️</span> {error}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white/50 flex-1 shadow-sm">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-slate-200 bg-slate-50/80 text-slate-600 sticky top-0 backdrop-blur-md">
                    <tr>
                      <th className="px-5 py-4 font-semibold">Môn học</th>
                      <th className="px-5 py-4 font-semibold">Đã điểm danh vào</th>
                      <th className="px-5 py-4 font-semibold">Ngày tạo phiên</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {history.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="px-5 py-12 text-center text-slate-500">
                          <div className="text-4xl mb-3 opacity-50">📂</div>
                          Bạn chưa điểm danh lần nào.
                        </td>
                      </tr>
                    ) : (
                      history
                        .slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)
                        .map((h) => (
                          <tr key={h.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-5 py-4">
                              <div className="font-semibold text-slate-800 text-base">
                                {h.courseName || h.className || "Không rõ môn học"}
                              </div>
                              {h.teacherName && (
                                <div className="text-sm text-slate-500 mt-1 flex flex-col gap-0.5">
                                  <div className="flex items-center">
                                    <span className="inline-block w-6 text-slate-400">GV:</span> {h.teacherName}
                                  </div>
                                  {(h.teacherSchool || h.teacherFaculty) && (
                                    <div className="flex items-center text-xs">
                                      <span className="inline-block w-6 text-slate-400"></span> 
                                      {h.teacherFaculty ? h.teacherFaculty + " - " : ""}{h.teacherSchool}
                                    </div>
                                  )}
                                </div>
                              )}
                              {!h.className && !h.courseName && (
                                <div className="font-mono text-xs text-slate-400 mt-1" title={h.sessionId}>
                                  ID: {h.sessionId.split("-")[0]}...
                                </div>
                              )}
                            </td>
                            <td className="px-5 py-4">
                              <div className="font-medium text-slate-800">
                                {new Date(h.checkinAt).toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                              </div>
                              <div className="text-slate-500 text-xs mt-1">
                                {new Date(h.checkinAt).toLocaleDateString("vi-VN")}
                              </div>
                            </td>
                            <td className="px-5 py-4">
                              {h.sessionCreatedAt ? (
                                <div className="text-sm text-slate-600">
                                  {new Date(h.sessionCreatedAt).toLocaleDateString("vi-VN")} - {new Date(h.sessionCreatedAt).toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit' })}
                                </div>
                              ) : (
                                <span className="text-slate-400 text-sm italic">Không có dữ liệu</span>
                              )}
                            </td>
                          </tr>
                        ))
                    )}
                  </tbody>
                </table>
              </div>

              {history.length > 0 && (
                <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-5">
                  <span className="text-sm font-medium text-slate-500 bg-slate-50 px-3 py-1.5 rounded-md">
                    Hiển thị {(currentPage - 1) * ITEMS_PER_PAGE + 1} -{" "}
                    {Math.min(currentPage * ITEMS_PER_PAGE, history.length)} / {history.length}
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
                      {currentPage} / {totalPages}
                    </span>
                    <button
                      disabled={currentPage * ITEMS_PER_PAGE >= history.length}
                      onClick={() => setCurrentPage((p) => p + 1)}
                      className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-indigo-600 disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-slate-700 transition-colors"
                    >
                      Sau
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
