// ============================================================================
// exportExcel — xuất báo cáo điểm danh ra file .xlsx (SheetJS).
// ============================================================================
import * as XLSX from "xlsx";

/** Tên file an toàn (bỏ ký tự đặc biệt). */
function safeFileName(name) {
  return name.replace(/[^\p{L}\p{N}_-]+/gu, "_").slice(0, 60);
}

export function exportReportToExcel(report, sessionTitle = "Phien_Diem_Danh") {
  const rows = report.records.map((r, i) => ({
    STT: i + 1,
    "Họ tên": r.studentName || "Không xác định",
    "Thời gian điểm danh": new Date(r.checkinAt).toLocaleString("vi-VN"),
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);
  worksheet["!cols"] = [
    { wch: 6 },
    { wch: 24 },
    { wch: 22 },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "DiemDanh");

  const dateStr = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(
    workbook,
    `diemdanh_${safeFileName(sessionTitle)}_${dateStr}.xlsx`,
  );
}
