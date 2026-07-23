import * as XLSX from "xlsx";

function safeFileName(name) {
  return name.replace(/[^\p{L}\p{N}_-]+/gu, "_").slice(0, 60);
}

export function exportReportToExcel(report, session) {
  const rows = report.records.map((r, i) => ({
    STT: i + 1,
    "Họ tên": r.studentName || "Không xác định",
    "Trường": r.studentSchool || "",
    "Khoa": r.studentFaculty || "",
    "Ngành": r.studentMajor || "",
    "Thời gian điểm danh": new Date(r.checkinAt).toLocaleString("vi-VN"),
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);
  worksheet["!cols"] = [
    { wch: 6 },  // STT
    { wch: 24 }, // Họ tên
    { wch: 20 }, // Trường
    { wch: 20 }, // Khoa
    { wch: 20 }, // Ngành
    { wch: 22 }, // Thời gian
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "DiemDanh");

  // Construct file name: [Tên môn học]_[Ngày tạo]_[Giờ tạo].xlsx
  const courseName = session.courseName || session.className || "Phien_Diem_Danh";
  const createdDate = new Date(session.createdAt || Date.now());
  const dateStr = createdDate.toLocaleDateString("vi-VN").replace(/\//g, "-"); // dd-mm-yyyy
  const timeStr = createdDate.toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit' }).replace(/:/g, "h"); // HHhMM
  
  const fileName = `DiemDanh_${safeFileName(courseName)}_${dateStr}_${timeStr}.xlsx`;

  XLSX.writeFile(workbook, fileName);
}
