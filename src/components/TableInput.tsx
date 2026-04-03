
import React, { useState, useEffect, useCallback, useRef } from "react";
import { Plus, Trash2, FileDown, FileUp, CheckCircle2, AlertCircle } from "lucide-react";
import { formatCurrency } from "../lib/numberToWords";
import { TableRow, TaxRule, ContractType } from "../types";
import * as XLSX from "xlsx";
import { motion, AnimatePresence } from "motion/react";

interface TableInputProps {
  onChange: (rows: TableRow[], total: number) => void;
  taxRules: TaxRule[];
  onTaxRulesChange?: (rules: TaxRule[]) => void;
  contractType: ContractType;
  initialRows?: TableRow[];
  readOnly?: boolean;
}

const TableInput: React.FC<TableInputProps> = ({ 
  onChange, 
  taxRules, 
  onTaxRulesChange, 
  contractType,
  initialRows,
  readOnly = false
}) => {
  const [rows, setRows] = useState<TableRow[]>(initialRows || [
    {
      stt: 1,
      noiDung: "",
      dvt: "",
      khoiLuong: 0,
      donGia: 0,
      thoiGianThue: 0,
      thanhTien: 0,
      vat8: 0,
      vat10: 0,
      vat: 0,
      tongCong: 0,
    },
  ]);

  const [editingCell, setEditingCell] = useState<{ index: number; field: string } | null>(null);
  const [showTaxPopup, setShowTaxPopup] = useState(false);
  const [pendingItemName, setPendingItemName] = useState("");
  const [selectedTaxRate, setSelectedTaxRate] = useState<5 | 8 | 10>(10);
  const [importQueue, setImportQueue] = useState<any[] | null>(null);
  const [missingItemsQueue, setMissingItemsQueue] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const calculateRowWithRules = (row: TableRow, rules: TaxRule[]): TableRow => {
    const isNguyenTac = contractType === "HDNT";
    const thoiGianThue = isNguyenTac ? 0 : (row.thoiGianThue || 0);
    const thanhTien = row.khoiLuong * row.donGia * (thoiGianThue > 0 ? thoiGianThue : 1);
    
    // Find tax rate from rules
    const rule = rules.find(r => r.itemName.toLowerCase().trim() === row.noiDung.toLowerCase().trim());
    const taxRate = rule ? rule.taxRate : 8; // Default to 8% if not found

    const vat = Math.round(thanhTien * (taxRate / 100));
    const tongCong = thanhTien + vat;
    
    return { 
      ...row, 
      thanhTien, 
      vat8: taxRate === 8 ? vat : 0, 
      vat10: taxRate === 10 ? vat : 0, 
      vat, 
      tongCong 
    };
  };

  const calculateRow = (row: TableRow): TableRow => {
    return calculateRowWithRules(row, taxRules);
  };

  const updateRow = (index: number, field: keyof TableRow, value: any) => {
    const newRows = [...rows];
    newRows[index] = { ...newRows[index], [field]: value };
    newRows[index] = calculateRow(newRows[index]);
    setRows(newRows);
  };

  const handleNoiDungBlur = (index: number, value: string) => {
    if (contractType === "HDNT" && value.trim() !== "") {
      const exists = taxRules.some(r => r.itemName.toLowerCase().trim() === value.toLowerCase().trim());
      if (!exists) {
        setPendingItemName(value);
        setShowTaxPopup(true);
      }
    }
  };

  const finalizeImport = (data: any[], currentTaxRules: TaxRule[]) => {
    const newRows: TableRow[] = data.map((item, index) => {
      const row: TableRow = {
        stt: index + 1,
        noiDung: item["Nội dung"] || "",
        dvt: item["ĐVT"] || "",
        khoiLuong: Number(item["Khối lượng"]) || 0,
        donGia: Number(item["Đơn giá"]) || 0,
        thoiGianThue: Number(item["Thời gian thuê"]) || 0,
        thanhTien: 0,
        vat8: 0,
        vat10: 0,
        vat: 0,
        tongCong: 0,
      };
      return calculateRowWithRules(row, currentTaxRules);
    });

    setRows(newRows);
  };

  const handleUpdateTaxRule = () => {
    if (onTaxRulesChange) {
      const newRule: TaxRule = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        itemName: pendingItemName,
        taxRate: selectedTaxRate
      };
      
      const updatedRules = [...taxRules, newRule];
      onTaxRulesChange(updatedRules);

      // Handle queue if importing
      if (missingItemsQueue.length > 0) {
        const nextQueue = missingItemsQueue.slice(1);
        setMissingItemsQueue(nextQueue);

        if (nextQueue.length > 0) {
          setPendingItemName(nextQueue[0]);
        } else {
          setShowTaxPopup(false);
          if (importQueue) {
            finalizeImport(importQueue, updatedRules);
            setImportQueue(null);
          }
        }
      } else {
        // Normal single item update from blur
        setShowTaxPopup(false);
        setRows(prev => prev.map(row => calculateRowWithRules(row, updatedRules)));
      }
    }
  };

  const exportToExcel = () => {
    const isNguyenTac = contractType === "HDNT";
    const exportData = rows.map(row => ({
      "STT": row.stt,
      "Nội dung": row.noiDung,
      "ĐVT": row.dvt,
      "Khối lượng": row.khoiLuong,
      "Đơn giá": row.donGia,
      ...(isNguyenTac ? {} : { "Thời gian thuê": row.thoiGianThue }),
      "Thành tiền": row.thanhTien,
      "VAT 8%": row.vat8,
      ...(isNguyenTac ? { "VAT 10%": row.vat10 } : {}),
      "Tổng cộng": row.tongCong
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "BangGiaTri");
    XLSX.writeFile(wb, `Bang_Gia_Tri_${contractType}.xlsx`);
  };

  const importFromExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: "binary" });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data = XLSX.utils.sheet_to_json(ws) as any[];

      if (contractType === "HDNT") {
        const missing = data
          .map(item => (item["Nội dung"] || "").trim())
          .filter(name => name !== "" && !taxRules.some(r => r.itemName.toLowerCase().trim() === name.toLowerCase().trim()));
        
        // Unique missing items
        const uniqueMissing = Array.from(new Set(missing));

        if (uniqueMissing.length > 0) {
          setImportQueue(data);
          setMissingItemsQueue(uniqueMissing);
          setPendingItemName(uniqueMissing[0]);
          setShowTaxPopup(true);
          if (fileInputRef.current) fileInputRef.current.value = "";
          return;
        }
      }

      finalizeImport(data, taxRules);
      if (fileInputRef.current) fileInputRef.current.value = "";
    };
    reader.readAsBinaryString(file);
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
        vat8: 0,
        vat10: 0,
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
  const totalVat8 = rows.reduce((sum, row) => sum + (row.vat8 || 0), 0);
  const totalVat10 = rows.reduce((sum, row) => sum + (row.vat10 || 0), 0);
  const totalTongCong = rows.reduce((sum, row) => sum + row.tongCong, 0);

  useEffect(() => {
    onChange(rows, totalTongCong);
  }, [rows, totalTongCong, onChange]);

  // Re-calculate all rows when tax rules change
  useEffect(() => {
    setRows(prev => prev.map(row => calculateRow(row)));
  }, [taxRules]);

  const isNguyenTac = contractType === "HDNT";

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
            {!isNguyenTac && <th className="px-3 py-2 border-r border-gray-200 w-24">TG thuê (Tháng)</th>}
            <th className="px-3 py-2 border-r border-gray-200 w-32">Thành tiền</th>
            <th className="px-3 py-2 border-r border-gray-200 w-28">VAT 8%</th>
            {isNguyenTac && <th className="px-3 py-2 border-r border-gray-200 w-28">VAT 10%</th>}
            <th className="px-3 py-2 border-r border-gray-200 w-32">Tổng cộng</th>
            <th className="px-3 py-2 w-12"></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
              <td className="px-3 py-2 border-r border-gray-200 text-center font-medium align-top">{row.stt}</td>
              <td className="px-3 py-2 border-r border-gray-200 align-top">
                <textarea
                  className="w-full bg-transparent border-none focus:ring-0 p-0 resize-none overflow-hidden min-h-[1.5rem] leading-normal disabled:text-slate-700"
                  rows={1}
                  value={row.noiDung}
                  disabled={readOnly}
                  onChange={(e) => {
                    updateRow(index, "noiDung", e.target.value);
                    // Auto-resize
                    e.target.style.height = 'auto';
                    e.target.style.height = e.target.scrollHeight + 'px';
                  }}
                  onFocus={(e) => {
                    e.target.style.height = 'auto';
                    e.target.style.height = e.target.scrollHeight + 'px';
                  }}
                  onBlur={(e) => {
                    handleNoiDungBlur(index, e.target.value);
                  }}
                  onKeyDown={(e) => handleKeyDown(e, index)}
                  placeholder="Nhập nội dung..."
                />
              </td>
              <td className="px-3 py-2 border-r border-gray-200 align-top">
                <input
                  type="text"
                  className="w-full bg-transparent border-none focus:ring-0 p-0 disabled:text-slate-700"
                  value={row.dvt}
                  disabled={readOnly}
                  onChange={(e) => updateRow(index, "dvt", e.target.value)}
                  onKeyDown={(e) => handleKeyDown(e, index)}
                  placeholder="Cái, bộ..."
                />
              </td>
              <td className="px-3 py-2 border-r border-gray-200 align-top">
                <input
                  type="number"
                  className="w-full bg-transparent border-none focus:ring-0 p-0 text-right disabled:text-slate-700"
                  value={row.khoiLuong || ""}
                  disabled={readOnly}
                  onChange={(e) => updateRow(index, "khoiLuong", Number(e.target.value))}
                  onKeyDown={(e) => handleKeyDown(e, index)}
                />
              </td>
              <td className="px-3 py-2 border-r border-gray-200 align-top">
                {editingCell?.index === index && editingCell?.field === "donGia" && !readOnly ? (
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
                    className={`w-full text-right min-h-[1.25rem] ${!readOnly ? 'cursor-text' : ''}`}
                    onClick={() => !readOnly && setEditingCell({ index, field: "donGia" })}
                  >
                    {row.donGia ? formatCurrency(row.donGia) : "0"}
                  </div>
                )}
              </td>
              {!isNguyenTac && (
                <td className="px-3 py-2 border-r border-gray-200 align-top">
                  <input
                    type="number"
                    className="w-full bg-transparent border-none focus:ring-0 p-0 text-right disabled:text-slate-700"
                    value={row.thoiGianThue || ""}
                    disabled={readOnly}
                    onChange={(e) => updateRow(index, "thoiGianThue", Number(e.target.value))}
                    onKeyDown={(e) => handleKeyDown(e, index)}
                  />
                </td>
              )}
              <td className="px-3 py-2 border-r border-gray-200 text-right font-medium align-top">
                {formatCurrency(row.thanhTien)}
              </td>
              <td className="px-3 py-2 border-r border-gray-200 text-right font-medium align-top">
                {row.vat8 ? formatCurrency(row.vat8) : ""}
              </td>
              {isNguyenTac && (
                <td className="px-3 py-2 border-r border-gray-200 text-right font-medium align-top">
                  {row.vat10 ? formatCurrency(row.vat10) : ""}
                </td>
              )}
              <td className="px-3 py-2 border-r border-gray-200 text-right font-medium align-top">
                {formatCurrency(row.tongCong)}
              </td>
              <td className="px-3 py-2 text-center align-top">
                {!readOnly && (
                  <button
                    onClick={() => removeRow(index)}
                    className="text-red-500 hover:text-red-700 transition-colors"
                    title="Xóa dòng"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </td>
            </tr>
          ))}
          <tr className="bg-gray-100 font-bold">
            <td colSpan={isNguyenTac ? 5 : 6} className="px-3 py-2 border-r border-gray-200 text-center uppercase">
              Tổng cộng
            </td>
            <td className="px-3 py-2 border-r border-gray-200 text-right">{formatCurrency(totalThanhTien)}</td>
            <td className="px-3 py-2 border-r border-gray-200 text-right">{formatCurrency(totalVat8)}</td>
            {isNguyenTac && <td className="px-3 py-2 border-r border-gray-200 text-right">{formatCurrency(totalVat10)}</td>}
            <td className="px-3 py-2 border-r border-gray-200 text-right">{formatCurrency(totalTongCong)}</td>
            <td></td>
          </tr>
        </tbody>
      </table>
      {!readOnly && (
        <div className="p-2 bg-gray-50 border-t border-gray-200 flex flex-wrap items-center justify-between gap-4">
          <button
            onClick={addRow}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium text-sm transition-colors"
          >
            <Plus className="w-4 h-4" /> Thêm dòng mới (Phím Enter)
          </button>

          <div className="flex items-center gap-3">
            <input
              type="file"
              ref={fileInputRef}
              onChange={importFromExcel}
              accept=".xlsx, .xls"
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-3 py-1.5 bg-green-50 text-green-700 rounded-md hover:bg-green-100 font-medium text-sm transition-colors border border-green-200"
            >
              <FileUp className="w-4 h-4" /> Nhập Excel
            </button>
            <button
              onClick={exportToExcel}
              className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100 font-medium text-sm transition-colors border border-blue-200"
            >
              <FileDown className="w-4 h-4" /> Xuất Excel
            </button>
          </div>
        </div>
      )}

      {/* Tax Rule Popup */}
      <AnimatePresence>
        {showTaxPopup && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-100"
            >
              <div className="bg-blue-600 p-6 text-white">
                <div className="flex items-center gap-3 mb-2">
                  <AlertCircle className="w-8 h-8" />
                  <h3 className="text-xl font-black uppercase tracking-tight">Cập nhật giá trị thuế</h3>
                </div>
                <p className="text-blue-100 text-sm font-medium">
                  Vật tư này chưa có áp giá trị thuế, bạn áp vật tư này thuế giá trị bao nhiêu?
                </p>
              </div>
              
              <div className="p-6 space-y-6">
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                  <p className="text-xs text-gray-400 uppercase font-bold mb-1">Vật tư / Nội dung</p>
                  <p className="text-lg font-black text-gray-800">{pendingItemName}</p>
                </div>

                <div className="space-y-3">
                  <p className="text-sm font-bold text-gray-700">Chọn mức thuế suất:</p>
                  <div className="grid grid-cols-3 gap-3">
                    {[5, 8, 10].map((rate) => (
                      <button
                        key={rate}
                        onClick={() => setSelectedTaxRate(rate as 5 | 8 | 10)}
                        className={`py-3 rounded-xl font-black text-lg transition-all ${
                          selectedTaxRate === rate
                            ? "bg-blue-600 text-white shadow-lg shadow-blue-200 scale-105"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}
                      >
                        {rate}%
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => {
                      setShowTaxPopup(false);
                      setImportQueue(null);
                      setMissingItemsQueue([]);
                    }}
                    className="flex-1 py-3 px-4 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-colors"
                  >
                    Hủy
                  </button>
                  <button
                    onClick={handleUpdateTaxRule}
                    className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200 flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="w-5 h-5" /> Cập nhật
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TableInput;
