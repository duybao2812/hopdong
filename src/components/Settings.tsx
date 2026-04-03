
import React, { useState, useEffect, useRef } from "react";
import { Upload, FileCheck, AlertCircle, Trash2, Users, Plus, Save, Download, X, FileUp, FileDown, Percent, UserPlus, Eraser, Edit } from "lucide-react";
import { Partner, TaxRule, ContractType } from "../types";
import * as XLSX from "xlsx";
import { motion, AnimatePresence } from "motion/react";

interface SettingsProps {
  onTemplateChange: (template: ArrayBuffer | null, name: string | null, type: ContractType) => void;
  currentTemplateName: string | null;
  taxRules: TaxRule[];
  onTaxRulesChange: (rules: TaxRule[]) => void;
  partners: Partner[];
  onPartnersChange: (partners: Partner[]) => void;
  selectedTemplateType: ContractType;
  onTemplateTypeChange: (type: ContractType) => void;
}

const Settings: React.FC<SettingsProps> = ({ 
  onTemplateChange, 
  currentTemplateName, 
  taxRules, 
  onTaxRulesChange,
  partners,
  onPartnersChange,
  selectedTemplateType,
  onTemplateTypeChange
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [isPlaceholderModalOpen, setIsPlaceholderModalOpen] = useState(false);
  const [isPartnerModalOpen, setIsPartnerModalOpen] = useState(false);
  const [editingPartnerId, setEditingPartnerId] = useState<string | null>(null);
  const [newPartnerData, setNewPartnerData] = useState<Omit<Partner, 'id'>>({
    name: "",
    representative: "",
    gender: "Ông",
    position: "",
    address: "",
    taxCode: "",
    accountNumber: "",
    bankName: "",
  });
  const [lastSavedTime, setLastSavedTime] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const taxFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const now = new Date();
    const formattedTime = `${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getFullYear()} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
    setLastSavedTime(formattedTime);
  }, [partners]);

  const exportExcel = () => {
    const dataToExport = partners.map(p => ({
      "Tên công ty/Cá nhân": p.name,
      "Người đại diện": p.representative,
      "Giới tính": p.gender,
      "Chức vụ": p.position,
      "Địa chỉ": p.address,
      "Mã số thuế": p.taxCode,
      "Số tài khoản": p.accountNumber,
      "Ngân hàng": p.bankName
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "DanhSachDoiTac");
    XLSX.writeFile(workbook, "DanhSachDoiTac.xlsx");
  };

  const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const workbook = XLSX.read(bstr, { type: "binary" });
        const wsname = workbook.SheetNames[0];
        const ws = workbook.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws) as any[];

        const newPartners: Partner[] = data.map(row => ({
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          name: row["Tên công ty/Cá nhân"] || "",
          representative: row["Người đại diện"] || "",
          gender: row["Giới tính"] || "Ông",
          position: row["Chức vụ"] || "",
          address: row["Địa chỉ"] || "",
          taxCode: row["Mã số thuế"] || "",
          accountNumber: row["Số tài khoản"] || "",
          bankName: row["Ngân hàng"] || ""
        }));

        const existingNames = new Set(partners.map(p => p.name.toLowerCase()));
        const uniqueNewPartners = newPartners.filter(p => p.name && !existingNames.has(p.name.toLowerCase()));

        onPartnersChange([...partners, ...uniqueNewPartners]);
        alert(`Đã nhập thành công ${uniqueNewPartners.length} đối tác mới!`);
      } catch (error) {
        console.error("Lỗi khi đọc file Excel:", error);
        alert("Có lỗi xảy ra khi đọc file Excel. Vui lòng kiểm tra lại định dạng.");
      }
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    };
    reader.readAsBinaryString(file);
  };

  const exportTaxExcel = () => {
    const dataToExport = taxRules.map(r => ({
      "Tên vật tư/Hạng mục": r.itemName,
      "Thuế suất (%)": r.taxRate
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "CaiDatThue");
    XLSX.writeFile(workbook, "CaiDatThue.xlsx");
  };

  const handleImportTaxExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const workbook = XLSX.read(bstr, { type: "binary" });
        const wsname = workbook.SheetNames[0];
        const ws = workbook.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws) as any[];

        const newRules: TaxRule[] = data.map(row => ({
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          itemName: row["Tên vật tư/Hạng mục"] || "",
          taxRate: (row["Thuế suất (%)"] === 10 || row["Thuế suất (%)"] === "10") ? 10 : 8
        }));

        onTaxRulesChange([...taxRules, ...newRules]);
        alert(`Đã nhập thành công ${newRules.length} quy tắc thuế mới!`);
      } catch (error) {
        console.error("Lỗi khi đọc file Excel thuế:", error);
        alert("Có lỗi xảy ra khi đọc file Excel. Vui lòng kiểm tra lại định dạng.");
      }
      if (taxFileInputRef.current) {
        taxFileInputRef.current.value = "";
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleAddPartnerSubmit = () => {
    if (!newPartnerData.name) {
      alert("Vui lòng nhập tên đối tác");
      return;
    }

    if (editingPartnerId) {
      // Update existing partner
      onPartnersChange(partners.map(p => p.id === editingPartnerId ? { ...newPartnerData, id: editingPartnerId } : p));
    } else {
      // Add new partner
      const newPartner: Partner = {
        ...newPartnerData,
        id: Date.now().toString(),
      };
      onPartnersChange([...partners, newPartner]);
    }

    setIsPartnerModalOpen(false);
    setEditingPartnerId(null);
    setNewPartnerData({
      name: "",
      representative: "",
      gender: "Ông",
      position: "",
      address: "",
      taxCode: "",
      accountNumber: "",
      bankName: "",
    });
  };

  const openAddPartnerModal = () => {
    setEditingPartnerId(null);
    setNewPartnerData({
      name: "",
      representative: "",
      gender: "Ông",
      position: "",
      address: "",
      taxCode: "",
      accountNumber: "",
      bankName: "",
    });
    setIsPartnerModalOpen(true);
  };

  const openEditPartnerModal = (partner: Partner) => {
    setEditingPartnerId(partner.id);
    setNewPartnerData({
      name: partner.name,
      representative: partner.representative,
      gender: partner.gender,
      position: partner.position,
      address: partner.address,
      taxCode: partner.taxCode,
      accountNumber: partner.accountNumber,
      bankName: partner.bankName,
    });
    setIsPartnerModalOpen(true);
  };

  const clearNewPartnerInfo = () => {
    setNewPartnerData({
      name: "",
      representative: "",
      gender: "Ông",
      position: "",
      address: "",
      taxCode: "",
      accountNumber: "",
      bankName: "",
    });
  };

  const removePartner = (id: string) => {
    if (confirm("Bạn có chắc chắn muốn xóa đối tác này?")) {
      onPartnersChange(partners.filter(p => p.id !== id));
    }
  };

  const addTaxRule = () => {
    const newRule: TaxRule = {
      id: Date.now().toString(),
      itemName: "",
      taxRate: 8,
    };
    onTaxRulesChange([...taxRules, newRule]);
  };

  const updateTaxRule = (id: string, field: keyof TaxRule, value: any) => {
    onTaxRulesChange(taxRules.map(r => r.id === id ? { ...r, [field]: value } : r));
  };

  const removeTaxRule = (id: string) => {
    onTaxRulesChange(taxRules.filter(r => r.id !== id));
  };

  const handleFile = (file: File) => {
    if (file && file.name.endsWith(".docx")) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const arrayBuffer = e.target?.result as ArrayBuffer;
        onTemplateChange(arrayBuffer, file.name, selectedTemplateType);
        
        const base64 = btoa(
          new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), "")
        );
        localStorage.setItem(`contract_template_${selectedTemplateType}`, base64);
        localStorage.setItem(`contract_template_name_${selectedTemplateType}`, file.name);
      };
      reader.readAsArrayBuffer(file);
    } else {
      alert("Vui lòng tải lên file định dạng .docx");
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const removeTemplate = () => {
    localStorage.removeItem(`contract_template_${selectedTemplateType}`);
    localStorage.removeItem(`contract_template_name_${selectedTemplateType}`);
    onTemplateChange(null, null, selectedTemplateType);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Template Settings - Horizontal Layout */}
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 space-y-6">
        <div className="flex items-center justify-between border-b pb-4">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Upload className="w-6 h-6 text-blue-500" /> Cài đặt mẫu hợp đồng
          </h2>
          {currentTemplateName && (
            <div className="flex items-center gap-4">
              <button
                onClick={() => {
                  const base64 = localStorage.getItem(`contract_template_${selectedTemplateType}`);
                  if (base64) {
                    const binaryString = atob(base64);
                    const bytes = new Uint8Array(binaryString.length);
                    for (let i = 0; i < binaryString.length; i++) {
                      bytes[i] = binaryString.charCodeAt(i);
                    }
                    const blob = new Blob([bytes], { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = currentTemplateName;
                    a.click();
                    URL.revokeObjectURL(url);
                  }
                }}
                className="text-blue-600 hover:text-blue-800 flex items-center gap-1 text-sm font-medium transition-colors"
              >
                <Download className="w-4 h-4" /> Tải file mẫu hiện tại
              </button>
              <button
                onClick={removeTemplate}
                className="text-red-500 hover:text-red-700 flex items-center gap-1 text-sm font-medium transition-colors"
              >
                <Trash2 className="w-4 h-4" /> Xóa mẫu hiện tại
              </button>
            </div>
          )}
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              onClick={() => onTemplateTypeChange("HDTX")}
              className={`p-3 rounded-xl border-2 flex flex-col items-center text-center space-y-1 transition-all ${
                selectedTemplateType === "HDTX" ? "border-blue-500 bg-blue-50" : "border-gray-200 bg-gray-50 hover:border-blue-200"
              }`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                selectedTemplateType === "HDTX" ? "bg-blue-500 text-white" : "bg-gray-300 text-white"
              }`}>1</div>
              <p className={`font-bold text-sm ${selectedTemplateType === "HDTX" ? "text-blue-900" : "text-gray-600"}`}>Hợp đồng thuê xe máy</p>
              <p className={`text-[10px] ${selectedTemplateType === "HDTX" ? "text-blue-700" : "text-gray-500"}`}>
                {selectedTemplateType === "HDTX" ? "Đang chọn" : "Nhấn để chọn"}
              </p>
            </button>
            <button
              onClick={() => onTemplateTypeChange("HDTC")}
              className={`p-3 rounded-xl border-2 flex flex-col items-center text-center space-y-1 transition-all ${
                selectedTemplateType === "HDTC" ? "border-blue-500 bg-blue-50" : "border-gray-200 bg-gray-50 hover:border-blue-200"
              }`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                selectedTemplateType === "HDTC" ? "bg-blue-500 text-white" : "bg-gray-300 text-white"
              }`}>2</div>
              <p className={`font-bold text-sm ${selectedTemplateType === "HDTC" ? "text-blue-900" : "text-gray-600"}`}>Hợp đồng thi công</p>
              <p className={`text-[10px] ${selectedTemplateType === "HDTC" ? "text-blue-700" : "text-gray-500"}`}>
                {selectedTemplateType === "HDTC" ? "Đang chọn" : "Nhấn để chọn"}
              </p>
            </button>
            <button
              onClick={() => onTemplateTypeChange("HDNT")}
              className={`p-3 rounded-xl border-2 flex flex-col items-center text-center space-y-1 transition-all ${
                selectedTemplateType === "HDNT" ? "border-blue-500 bg-blue-50" : "border-gray-200 bg-gray-50 hover:border-blue-200"
              }`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                selectedTemplateType === "HDNT" ? "bg-blue-500 text-white" : "bg-gray-300 text-white"
              }`}>3</div>
              <p className={`font-bold text-sm ${selectedTemplateType === "HDNT" ? "text-blue-900" : "text-gray-600"}`}>Hợp đồng nguyên tắc</p>
              <p className={`text-[10px] ${selectedTemplateType === "HDNT" ? "text-blue-700" : "text-gray-500"}`}>
                {selectedTemplateType === "HDNT" ? "Đang chọn" : "Nhấn để chọn"}
              </p>
            </button>
          </div>

          <div
            className={`flex-1 relative border-2 border-dashed rounded-2xl p-6 transition-all flex flex-col items-center justify-center space-y-2 ${
              dragActive ? "border-blue-500 bg-blue-50" : "border-gray-300 bg-gray-50"
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              type="file"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              onChange={handleChange}
              accept=".docx"
            />
            {currentTemplateName ? (
              <>
                <div className="w-10 h-10 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                  <FileCheck className="w-5 h-5" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-bold text-gray-800">Đã tải lên: {currentTemplateName}</p>
                  <p className="text-[10px] text-gray-500">Kéo thả file khác để thay thế</p>
                </div>
              </>
            ) : (
              <>
                <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
                  <Upload className="w-5 h-5" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-bold text-gray-800">Kéo thả file mẫu .docx vào đây</p>
                  <p className="text-[10px] text-gray-500">Hoặc nhấp để chọn file</p>
                </div>
              </>
            )}
          </div>
        </div>

        <button
          onClick={() => setIsPlaceholderModalOpen(true)}
          className="w-full bg-yellow-50 hover:bg-yellow-100 p-3 rounded-xl border border-yellow-200 flex items-center justify-center gap-3 transition-colors"
        >
          <AlertCircle className="w-5 h-5 text-yellow-600" />
          <span className="font-bold text-yellow-800">Xem lưu ý về các Placeholder trong file mẫu</span>
        </button>
      </div>

      {/* Tax Rules Management */}
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between border-b pb-4 gap-4">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Percent className="w-6 h-6 text-orange-500" /> Cài đặt giá trị thuế
          </h2>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={exportTaxExcel}
              className="bg-blue-50 text-blue-600 hover:bg-blue-100 px-3 py-2 rounded-lg font-medium flex items-center gap-2 transition-all border border-blue-200"
            >
              <FileDown className="w-4 h-4" /> Xuất Excel
            </button>
            <label className="bg-purple-50 text-purple-600 hover:bg-purple-100 px-3 py-2 rounded-lg font-medium flex items-center gap-2 transition-all border border-purple-200 cursor-pointer">
              <FileUp className="w-4 h-4" /> Nhập Excel
              <input 
                type="file" 
                accept=".xlsx, .xls" 
                className="hidden" 
                onChange={handleImportTaxExcel}
                ref={taxFileInputRef}
              />
            </label>
            <button
              onClick={addTaxRule}
              className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition-all"
            >
              <Plus className="w-4 h-4" /> Thêm quy tắc
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-700 uppercase font-bold border-b border-gray-200">
              <tr>
                <th className="px-3 py-2 border-r border-gray-200">Tên vật tư / Hạng mục nội dung</th>
                <th className="px-3 py-2 border-r border-gray-200 w-48 text-center">Thuế suất (%)</th>
                <th className="px-3 py-2 w-12"></th>
              </tr>
            </thead>
            <tbody>
              {taxRules.map((rule) => (
                <tr key={rule.id} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                  <td className="px-2 py-1 border-r border-gray-200">
                    <input
                      type="text"
                      className="w-full bg-transparent border-none focus:ring-0 p-1"
                      value={rule.itemName}
                      onChange={(e) => updateTaxRule(rule.id, "itemName", e.target.value)}
                      placeholder="Ví dụ: Cát lắp, Bê tông M250..."
                    />
                  </td>
                  <td className="px-2 py-1 border-r border-gray-200 text-center">
                    <select
                      className="bg-transparent border-none focus:ring-0 p-1 font-bold text-blue-600"
                      value={rule.taxRate}
                      onChange={(e) => updateTaxRule(rule.id, "taxRate", parseInt(e.target.value))}
                    >
                      <option value={8}>8%</option>
                      <option value={10}>10%</option>
                    </select>
                  </td>
                  <td className="px-2 py-1 text-center">
                    <button
                      onClick={() => removeTaxRule(rule.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {taxRules.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-3 py-8 text-center text-gray-400 italic">
                    Chưa có quy tắc thuế nào. Nhấn "Thêm quy tắc" để bắt đầu.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Placeholder Modal */}
      {isPlaceholderModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
            <div className="p-4 border-b flex items-center justify-between bg-yellow-50">
              <div className="flex items-center gap-2 text-yellow-800">
                <AlertCircle className="w-5 h-5" />
                <h3 className="font-bold text-lg">Lưu ý về các Placeholder trong file mẫu</h3>
              </div>
              <button 
                onClick={() => setIsPlaceholderModalOpen(false)}
                className="text-gray-500 hover:text-gray-700 bg-white rounded-full p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto text-sm text-gray-700 space-y-4">
              <p>Đảm bảo file .docx của bạn chứa các thẻ sau để dữ liệu được điền chính xác:</p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 font-mono text-xs bg-gray-50 p-4 rounded-lg border">
                <span>{"[TEN_CTY_VIET_TAT]"}</span>
                <span>{"[SO_HOPDONG]"}</span>
                <span>{"[DAY_HOPDONG]"}</span>
                <span>{"[MONTH_HOPDONG]"}</span>
                <span>{"[YEAR_HOPDONG]"}</span>
                <span>{"[BEN_A]"}</span>
                <span>{"[GIOITINHBENA]"}</span>
                <span>{"[DAIDIENBENA]"}</span>
                <span>{"[CHUCVUBENA]"}</span>
                <span>{"[DIACHIBENA]"}</span>
                <span>{"[MSTBENA]"}</span>
                <span>{"[STKBENA]"}</span>
                <span>{"[NGANHANGBENA]"}</span>
                <span>{"[BEN_B]"}</span>
                <span>{"[GIOITINHBENB]"}</span>
                <span>{"[DAIDIENBENB]"}</span>
                <span>{"[CHUCVUBENB]"}</span>
                <span>{"[DIACHIBENB]"}</span>
                <span>{"[MSTBENB]"}</span>
                <span>{"[STKBENB]"}</span>
                <span>{"[NGANHANGBENB]"}</span>
                <span>{"[TENCONGTRINH]"}</span>
                <span>{"[DIADIEMCONGTRINH]"}</span>
                <span>{"[GOITHAU]"}</span>
                <span>{"[BANGGIATRITHUEXE]"} (Table)</span>
                <span>{"[BANGGIATRIHOPDONG]"} (Table)</span>
                <span>{"[GIATRIHOPDONG]"}</span>
                <span>{"[BANGCHUGIATRI]"}</span>
              </div>
            </div>
            <div className="p-4 border-t bg-gray-50 flex justify-end">
              <button
                onClick={() => setIsPlaceholderModalOpen(false)}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg font-medium transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Partner Management */}
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between border-b pb-4 gap-4">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Users className="w-6 h-6 text-green-500" /> Quản lý danh sách đối tác
          </h2>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={exportExcel}
              className="bg-blue-50 text-blue-600 hover:bg-blue-100 px-3 py-2 rounded-lg font-medium flex items-center gap-2 transition-all border border-blue-200"
            >
              <FileDown className="w-4 h-4" /> Xuất Excel
            </button>
            <label className="bg-purple-50 text-purple-600 hover:bg-purple-100 px-3 py-2 rounded-lg font-medium flex items-center gap-2 transition-all border border-purple-200 cursor-pointer">
              <FileUp className="w-4 h-4" /> Nhập Excel
              <input 
                type="file" 
                accept=".xlsx, .xls" 
                className="hidden" 
                onChange={handleImportExcel}
                ref={fileInputRef}
              />
            </label>
            <button
              onClick={openAddPartnerModal}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition-all"
            >
              <Plus className="w-4 h-4" /> Thêm đối tác
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-700 uppercase font-bold border-b border-gray-200">
              <tr>
                <th className="px-3 py-3 border-r border-gray-200 min-w-[200px]">Tên đối tác</th>
                <th className="px-3 py-3 border-r border-gray-200 w-32">Đại diện</th>
                <th className="px-3 py-3 border-r border-gray-200 w-24">Giới tính</th>
                <th className="px-3 py-3 border-r border-gray-200 w-32">Chức vụ</th>
                <th className="px-3 py-3 border-r border-gray-200 min-w-[250px]">Địa chỉ</th>
                <th className="px-3 py-3 border-r border-gray-200 w-32">MST</th>
                <th className="px-3 py-3 border-r border-gray-200 w-32">STK</th>
                <th className="px-3 py-3 border-r border-gray-200 w-32">Ngân hàng</th>
                <th className="px-3 py-3 w-24 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {partners.map((partner) => (
                <tr key={partner.id} className="border-b border-gray-200 hover:bg-gray-50 transition-colors align-top">
                  <td className="px-3 py-3 border-r border-gray-200 whitespace-normal break-words font-medium text-gray-900">
                    {partner.name}
                  </td>
                  <td className="px-3 py-3 border-r border-gray-200 whitespace-normal break-words">
                    {partner.representative}
                  </td>
                  <td className="px-3 py-3 border-r border-gray-200 text-center">
                    {partner.gender}
                  </td>
                  <td className="px-3 py-3 border-r border-gray-200 whitespace-normal break-words">
                    {partner.position}
                  </td>
                  <td className="px-3 py-3 border-r border-gray-200 whitespace-normal break-words">
                    {partner.address}
                  </td>
                  <td className="px-3 py-3 border-r border-gray-200 font-mono text-xs">
                    {partner.taxCode}
                  </td>
                  <td className="px-3 py-3 border-r border-gray-200 font-mono text-xs">
                    {partner.accountNumber}
                  </td>
                  <td className="px-3 py-3 border-r border-gray-200 whitespace-normal break-words">
                    {partner.bankName}
                  </td>
                  <td className="px-3 py-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => openEditPartnerModal(partner)}
                        className="text-blue-500 hover:text-blue-700 p-1 hover:bg-blue-50 rounded transition-colors"
                        title="Cập nhật"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => removePartner(partner.id)}
                        className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded transition-colors"
                        title="Xóa"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {partners.length > 0 && (
          <div className="flex justify-end pt-4">
            {lastSavedTime && (
              <p className="italic text-sm text-gray-500">
                Đã tự động lưu vào thời điểm: {lastSavedTime}
              </p>
            )}
          </div>
        )}
      </div>
      {/* Add Partner Modal */}
      <AnimatePresence>
        {isPartnerModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden"
            >
              <div className="p-4 border-b flex items-center justify-between bg-green-50">
                <div className="flex items-center gap-2 text-green-800">
                  <UserPlus className="w-5 h-5" />
                  <h3 className="font-bold text-lg">{editingPartnerId ? "Cập nhật đối tác" : "Thêm đối tác mới"}</h3>
                </div>
                <button 
                  onClick={() => {
                    setIsPartnerModalOpen(false);
                    setEditingPartnerId(null);
                  }}
                  className="text-gray-500 hover:text-gray-700 bg-white rounded-full p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-6 overflow-y-auto space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">Tên công ty/Cá nhân</label>
                    <input
                      type="text"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 text-sm"
                      value={newPartnerData.name}
                      onChange={(e) => setNewPartnerData({...newPartnerData, name: e.target.value})}
                      placeholder="Nhập tên đầy đủ..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Người đại diện</label>
                    <input
                      type="text"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 text-sm"
                      value={newPartnerData.representative}
                      onChange={(e) => setNewPartnerData({...newPartnerData, representative: e.target.value})}
                      placeholder="Họ và tên..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Giới tính</label>
                    <select
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 text-sm"
                      value={newPartnerData.gender}
                      onChange={(e) => setNewPartnerData({...newPartnerData, gender: e.target.value as any})}
                    >
                      <option value="Ông">Ông</option>
                      <option value="Bà">Bà</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Chức vụ</label>
                    <input
                      type="text"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 text-sm"
                      value={newPartnerData.position}
                      onChange={(e) => setNewPartnerData({...newPartnerData, position: e.target.value})}
                      placeholder="Giám đốc, Quản lý..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Mã số thuế</label>
                    <input
                      type="text"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 text-sm"
                      value={newPartnerData.taxCode}
                      onChange={(e) => setNewPartnerData({...newPartnerData, taxCode: e.target.value})}
                      placeholder="MST..."
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">Địa chỉ</label>
                    <input
                      type="text"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 text-sm"
                      value={newPartnerData.address}
                      onChange={(e) => setNewPartnerData({...newPartnerData, address: e.target.value})}
                      placeholder="Địa chỉ trụ sở..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Số tài khoản</label>
                    <input
                      type="text"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 text-sm"
                      value={newPartnerData.accountNumber}
                      onChange={(e) => setNewPartnerData({...newPartnerData, accountNumber: e.target.value})}
                      placeholder="STK ngân hàng..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Ngân hàng</label>
                    <input
                      type="text"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 text-sm"
                      value={newPartnerData.bankName}
                      onChange={(e) => setNewPartnerData({...newPartnerData, bankName: e.target.value})}
                      placeholder="Tên ngân hàng..."
                    />
                  </div>
                </div>
              </div>

              <div className="p-4 border-t bg-gray-50 flex justify-between gap-3">
                <button
                  onClick={clearNewPartnerInfo}
                  className="bg-white border border-red-200 text-red-600 hover:bg-red-50 px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors"
                >
                  <Eraser className="w-4 h-4" /> Xóa thông tin
                </button>
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setIsPartnerModalOpen(false);
                      setEditingPartnerId(null);
                    }}
                    className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-2 rounded-lg font-medium transition-colors"
                  >
                    Hủy
                  </button>
                  <button
                    onClick={handleAddPartnerSubmit}
                    className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-bold shadow-lg shadow-green-100 transition-all"
                  >
                    {editingPartnerId ? "Cập nhật" : "Thêm"}
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

export default Settings;
