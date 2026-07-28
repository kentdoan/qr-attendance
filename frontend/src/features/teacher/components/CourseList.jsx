import { useState, useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";
import { attendanceApi } from "../../../api/attendance";
import { removeCourse } from "../teacherSlice";

const ITEMS_PER_PAGE = 5;

export default function CourseList() {
  const dispatch = useDispatch();
  const { courseList, loadingCourses, courseError } = useSelector((state) => state.teacher);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const filteredCourses = useMemo(() => {
    if (!searchTerm.trim()) return courseList;
    const lower = searchTerm.toLowerCase();
    return courseList.filter(
      (c) =>
        c.courseName.toLowerCase().includes(lower) ||
        c.courseCode.toLowerCase().includes(lower)
    );
  }, [courseList, searchTerm]);

  const totalPages = Math.ceil(filteredCourses.length / ITEMS_PER_PAGE) || 1;
  const paginatedCourses = filteredCourses.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  async function handleDelete(courseId) {
    if (!window.confirm("Bạn có chắc chắn muốn xóa môn học này không?")) return;
    const res = await attendanceApi.deleteCourse(courseId);
    if (res.success) {
      dispatch(removeCourse(courseId));
    } else {
      alert(res.message || "Xóa thất bại");
    }
  }

  if (loadingCourses) {
    return <div className="text-center py-4 text-slate-500">Đang tải danh sách môn học...</div>;
  }

  if (courseError) {
    return <div className="rounded-lg bg-red-50 p-4 text-red-600">{courseError}</div>;
  }

  if (courseList.length === 0) {
    return <div className="text-center py-6 text-slate-500">Bạn chưa tạo môn học nào.</div>;
  }



  return (
    <div>
      <div className="mb-6">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setCurrentPage(1);
          }}
          placeholder="Tìm kiếm mã hoặc tên môn học..."
          className="w-full rounded-xl border-2 border-slate-200 bg-white px-4 py-3 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition-all"
        />
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white/50 shadow-sm">
        <table className="w-full text-left text-sm">
        <thead className="bg-slate-50/80 text-slate-600 backdrop-blur-md">
          <tr>
            <th className="px-5 py-4 font-semibold">Mã môn</th>
            <th className="px-5 py-4 font-semibold">Tên môn học</th>
            <th className="px-5 py-4 font-semibold text-right">Thao tác</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {paginatedCourses.length === 0 ? (
            <tr>
              <td colSpan="3" className="py-4 text-center text-slate-500">
                Không tìm thấy môn học nào.
              </td>
            </tr>
          ) : (
            paginatedCourses.map((course) => (
              <tr key={course.courseId} className="hover:bg-slate-50 transition-colors">
                <td className="px-5 py-4 font-medium text-slate-700">{course.courseCode}</td>
                <td className="px-5 py-4 text-slate-700">{course.courseName}</td>
                <td className="px-5 py-4 text-right flex justify-end">
                  <button
                    onClick={() => handleDelete(course.courseId)}
                    className="text-red-500 hover:text-red-700 font-medium px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
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

    {filteredCourses.length > 0 && (
      <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-5">
        <span className="text-sm font-medium text-slate-500 bg-slate-50 px-3 py-1.5 rounded-md">
          Đang xem {(currentPage - 1) * ITEMS_PER_PAGE + 1} -{" "}
          {Math.min(currentPage * ITEMS_PER_PAGE, filteredCourses.length)} / {filteredCourses.length} môn
        </span>
        <div className="flex gap-2 items-center">
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-indigo-600 disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-slate-700 transition-colors"
          >
            Trước
          </button>
          <span className="text-sm font-semibold text-slate-700 min-w-[3rem] text-center">
            {currentPage} / {totalPages}
          </span>
          <button
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-indigo-600 disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-slate-700 transition-colors"
          >
            Sau
          </button>
        </div>
      </div>
    )}
  </div>
  );
}
