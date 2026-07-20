// ============================================================================
// exportExcel — xuất báo cáo điểm danh ra file .xlsx (SheetJS).
// ============================================================================
import * as XLSX from 'xlsx';
import { ReportData } from '../types';

/** Tên file an toàn (bỏ ký tự đặc biệt). */
function safeFileName(name: string): string {
  return name.replace(/[^\p{L}\p{N}_-]+/gu, '_').slice(0, 60);
}

export function exportReportToExcel(report: ReportData): void {
  const rows = report.records.map((r, i) => ({
    STT: i + 1,
    'Họ tên': r.studentName,
    Email: r.studentEmail,
    'Mã thiết bị': r.deviceFingerprint,
    'Trạng thái': r.status,
    'Thời gian điểm danh': new Date(r.checkinAt).toLocaleString('vi-VN'),
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);
  worksheet['!cols'] = [
    { wch: 6 },
    { wch: 24 },
    { wch: 26 },
    { wch: 28 },
    { wch: 16 },
    { wch: 22 },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'DiemDanh');

  const dateStr = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(workbook, `diemdanh_${safeFileName(report.session.title)}_${dateStr}.xlsx`);
}
