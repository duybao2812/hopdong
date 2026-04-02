
import React, { useState, useEffect, useCallback } from "react";
import { Plus, Trash2 } from "lucide-react";
import { formatCurrency } from "../lib/numberToWords";

interface TableRow {
  stt: number;
  noiDung: string;
  dvt: string;
  khoiLuong: number;
  donGia: number;
  thoiGianThue: number;
  thanhTien: number;
  vat: number;
  tongCong: number;
}

interface TableInputProps {
  onChange: (rows: TableRow[], total: number) => void;
}

const TableInput: React.FC<TableInputProps> = ({ onChange }) => {
  const [rows, setRows] = useState<TableRow[]>([
    {
      stt: 1,
      noiDung: "",
      dvt: "",
      khoiLuong: 0,
      donGia: 0,
      thoiGianThue: 0,
      thanhTien: 0,
      vat: 0,
      tongCong: 0,
    },
  ]);

  const [editingCell, setEditingCell] = useState<{ index: number; field: string } | null>(null);

  const calculateRow = (row: TableRow): TableRow => {
    const thanhTien = row.khoiLuong * row.donGia * row.thoiGianThue;
    const vat = Math.round(thanhTien * 0.08);
    const tongCong = thanhTien + vat;
    return { ...row, thanhTien, vat, tongCong };
  };

  const updateRow = (index: number, field: keyof TableRow, value: any) => {
    const newRows = [...rows];
    newRows[index] = { ...newRows[index], [field]: value };
    newRows[index] = calculateRow(newRows[index]);
    setRows(newRows);
  };

  const addRow = useCallback(() => {
    setRows((prev) => [
      ...prev,
      {
        stt: prev.length + 1,
        noiDung: "",
        dvt: "",
        khoiLuong: 0,
        donGia: 0,
        thoiGianThue: 0,
        thanhTien: 0,
        vat: 0,
        tongCong: 0,
      },
    ]);
  }, []);

  const removeRow = (index: number) => {
    if (rows.length === 1) return;
    const newRows = rows.filter((_, i) => i !== index).map((row, i) => ({ ...row, stt: i + 1 }));
    setRows(newRows);
  };

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addRow();
    }
  };

  const totalThanhTien = rows.reduce((sum, row) => sum + row.thanhTien, 0);
  const totalVat = rows.reduce((sum, row) => sum + row.vat, 0);
  const totalTongCong = rows.reduce((sum, row) => sum + row.tongCong, 0);

  useEffect(() => {
    onChange(rows, totalTongCong);
  }, [rows, totalTongCong, onChange]);

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <table className="w-full text-sm text-left">
        <thead className="bg-gray-50 text-gray-700 uppercase font-bold border-b border-gray-200">
          <tr>
            <th className="px-3 py-2 border-r border-gray-200 w-12 text-center">STT</th>
            <th className="px-3 py-2 border-r border-gray-200 min-w-[200px]">Nội dung</th>
            <th className="px-3 py-2 border-r border-gray-200 w-20">ĐVT</th>
            <th className="px-3 py-2 border-r border-gray-200 w-24">Khối lượng</th>
            <th className="px-3 py-2 border-r border-gray-200 w-32">Đơn giá (VNĐ)</th>
            <th className="px-3 py-2 border-r border-gray-200 w-24">TG thuê (Tháng)</th>
            <th className="px-3 py-2 border-r border-gray-200 w-32">Thành tiền</th>
            <th className="px-3 py-2 border-r border-gray-200 w-28">VAT 8%</th>
            <th className="px-3 py-2 border-r border-gray-200 w-32">Tổng cộng</th>
            <th className="px-3 py-2 w-12"></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
              <td className="px-3 py-2 border-r border-gray-200 text-center font-medium">{row.stt}</td>
              <td className="px-3 py-2 border-r border-gray-200">
                <input
                  type="text"
                  className="w-full bg-transparent border-none focus:ring-0 p-0"
                  value={row.noiDung}
                  onChange={(e) => updateRow(index, "noiDung", e.target.value)}
                  onKeyDown={(e) => handleKeyDown(e, index)}
                  placeholder="Nhập nội dung..."
                />
              </td>
              <td className="px-3 py-2 border-r border-gray-200">
                <input
                  type="text"
                  className="w-full bg-transparent border-none focus:ring-0 p-0"
                  value={row.dvt}
                  onChange={(e) => updateRow(index, "dvt", e.target.value)}
                  onKeyDown={(e) => handleKeyDown(e, index)}
                  placeholder="Cái, bộ..."
                />
              </td>
              <td className="px-3 py-2 border-r border-gray-200">
                <input
                  type="number"
                  className="w-full bg-transparent border-none focus:ring-0 p-0 text-right"
                  value={row.khoiLuong || ""}
                  onChange={(e) => updateRow(index, "khoiLuong", Number(e.target.value))}
                  onKeyDown={(e) => handleKeyDown(e, index)}
                />
              </td>
              <td className="px-3 py-2 border-r border-gray-200">
                {editingCell?.index === index && editingCell?.field === "donGia" ? (
                  <input
                    type="number"
                    autoFocus
                    className="w-full bg-transparent border-none focus:ring-0 p-0 text-right"
                    value={row.donGia || ""}
                    onChange={(e) => updateRow(index, "donGia", Number(e.target.value))}
                    onBlur={() => setEditingCell(null)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") setEditingCell(null);
                      handleKeyDown(e, index);
                    }}
                  />
                ) : (
                  <div
                    className="w-full text-right cursor-text min-h-[1.25rem]"
                    onClick={() => setEditingCell({ index, field: "donGia" })}
                  >
                    {row.donGia ? formatCurrency(row.donGia) : "0"}
                  </div>
                )}
              </td>
              <td className="px-3 py-2 border-r border-gray-200">
                <input
                  type="number"
                  className="w-full bg-transparent border-none focus:ring-0 p-0 text-right"
                  value={row.thoiGianThue || ""}
                  onChange={(e) => updateRow(index, "thoiGianThue", Number(e.target.value))}
                  onKeyDown={(e) => handleKeyDown(e, index)}
                />
              </td>
              <td className="px-3 py-2 border-r border-gray-200 text-right font-medium">
                {formatCurrency(row.thanhTien)}
              </td>
              <td className="px-3 py-2 border-r border-gray-200 text-right font-medium">
                {formatCurrency(row.vat)}
              </td>
              <td className="px-3 py-2 border-r border-gray-200 text-right font-medium">
                {formatCurrency(row.tongCong)}
              </td>
              <td className="px-3 py-2 text-center">
                <button
                  onClick={() => removeRow(index)}
                  className="text-red-500 hover:text-red-700 transition-colors"
                  title="Xóa dòng"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </td>
            </tr>
          ))}
          <tr className="bg-gray-100 font-bold">
            <td colSpan={6} className="px-3 py-2 border-r border-gray-200 text-center uppercase">
              Tổng cộng
            </td>
            <td className="px-3 py-2 border-r border-gray-200 text-right">{formatCurrency(totalThanhTien)}</td>
            <td className="px-3 py-2 border-r border-gray-200 text-right">{formatCurrency(totalVat)}</td>
            <td className="px-3 py-2 border-r border-gray-200 text-right">{formatCurrency(totalTongCong)}</td>
            <td></td>
          </tr>
        </tbody>
      </table>
      <div className="p-2 bg-gray-50 border-t border-gray-200">
        <button
          onClick={addRow}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium text-sm transition-colors"
        >
          <Plus className="w-4 h-4" /> Thêm dòng mới (Phím Enter)
        </button>
      </div>
    </div>
  );
};

export default TableInput;
