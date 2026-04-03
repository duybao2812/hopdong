
import React, { useState, useEffect, useMemo, useRef } from "react";
import { Download, FileText, Info, Search, UserCheck, UserPlus, RefreshCw, Trash2, CheckCircle2, AlertCircle, Save, Edit } from "lucide-react";
import TableInput from "./TableInput";
import { numberToWords, formatCurrency, abbreviateCompanyName, getShortName } from "../lib/numberToWords";
import { generateDocx, generateTableXml } from "../lib/docxUtils";
import { generateContractFile } from "../lib/contractGenerator";
import { Partner, TaxRule, ContractType, TableRow, ContractRecord } from "../types";
import { saveAs } from "file-saver";
import { motion, AnimatePresence } from "motion/react";

interface ContractFormProps {
  template: ArrayBuffer | null;
  taxRules: TaxRule[];
  onTaxRulesChange?: (rules: TaxRule[]) => void;
  partners: Partner[];
  onPartnersChange: (partners: Partner[]) => void;
  selectedTemplateType: ContractType;
  onTemplateTypeChange: (type: ContractType) => void;
  onContractSaved?: (record: ContractRecord) => void;
  onClose?: () => void;
  initialData?: ContractRecord;
  readOnly?: boolean;
}

const ContractForm: React.FC<ContractFormProps> = ({ 
  template, 
  taxRules, 
  onTaxRulesChange,
  partners, 
  onPartnersChange, 
  selectedTemplateType, 
  onTemplateTypeChange,
  onContractSaved,
  onClose,
  initialData,
  readOnly = false
}) => {
  const hiddenPreviewRef = useRef<HTMLDivElement>(null);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [isEditing, setIsEditing] = useState(!readOnly);

  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const [formData, setFormData] = useState(initialData?.formData || {
    TEN_CTY_VIET_TAT: "",
    SO_HOPDONG_PREFIX: "",
    SO_HOPDONG: "",
    NGAY_KY: new Date().toISOString().split('T')[0], // YYYY-MM-DD
    BEN_A: "",
    GIOITINHBENA: "Ông",
    DAIDIENBENA: "",
    CHUCVUBENA: "",
    DIACHIBENA: "",
    MSTBENA: "",
    STKBENA: "",
    NGANHANGBENA: "",
    BEN_B: "",
    GIOITINHBENB: "Ông",
    DAIDIENBENB: "",
    CHUCVUBENB: "",
    DIACHIBENB: "",
    MSTBENB: "",
    STKBENB: "",
    NGANHANGBENB: "",
    TENCONGTRINH: "",
    GOITHAU: "",
    DIADIEMCONGTRINH: "",
    LOAI_HOPDONG: selectedTemplateType,
    GIATRI_HD_TC: 0, // For HDTC
  });

  const [tableData, setTableData] = useState<TableRow[]>(initialData?.tableData || []);
  const [totalValue, setTotalValue] = useState(initialData?.totalValue || 0);

  // Sync LOAI_HOPDONG with selectedTemplateType from props if not initialData
  useEffect(() => {
    if (!initialData) {
      setFormData(prev => ({ ...prev, LOAI_HOPDONG: selectedTemplateType }));
    }
  }, [selectedTemplateType, initialData]);

  // Auto-abbreviate Company A
  useEffect(() => {
    if (formData.BEN_A) {
      const abbr = abbreviateCompanyName(formData.BEN_A);
      setFormData(prev => ({ ...prev, TEN_CTY_VIET_TAT: abbr }));
    }
  }, [formData.BEN_A]);

  // Auto-generate Contract Number
  useEffect(() => {
    if (formData.SO_HOPDONG_PREFIX) {
      const year = formData.NGAY_KY.split("-")[0];
      const fullNumber = `${formData.SO_HOPDONG_PREFIX}/${year}/${formData.LOAI_HOPDONG}`;
      setFormData(prev => ({ ...prev, SO_HOPDONG: fullNumber }));
    }
  }, [formData.SO_HOPDONG_PREFIX, formData.NGAY_KY, formData.LOAI_HOPDONG]);

  // Update totalValue for HDTC
  useEffect(() => {
    if (formData.LOAI_HOPDONG === "HDTC") {
      setTotalValue(formData.GIATRI_HD_TC);
    }
  }, [formData.GIATRI_HD_TC, formData.LOAI_HOPDONG]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name === "GIATRI_HD_TC") {
      const numericValue = value.replace(/\./g, "");
      if (!isNaN(Number(numericValue)) || numericValue === "") {
        setFormData((prev) => ({ ...prev, [name]: Number(numericValue) }));
      }
    } else if (name === "LOAI_HOPDONG") {
      const type = value as ContractType;
      setFormData((prev) => ({ ...prev, [name]: type }));
      onTemplateTypeChange(type);
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const selectPartner = (side: "A" | "B", partner: Partner) => {
    if (side === "A") {
      setFormData(prev => ({
        ...prev,
        BEN_A: partner.name,
        GIOITINHBENA: partner.gender,
        DAIDIENBENA: partner.representative,
        CHUCVUBENA: partner.position,
        DIACHIBENA: partner.address,
        MSTBENA: partner.taxCode,
        STKBENA: partner.accountNumber,
        NGANHANGBENA: partner.bankName,
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        BEN_B: partner.name,
        GIOITINHBENB: partner.gender,
        DAIDIENBENB: partner.representative,
        CHUCVUBENB: partner.position,
        DIACHIBENB: partner.address,
        MSTBENB: partner.taxCode,
        STKBENB: partner.accountNumber,
        NGANHANGBENB: partner.bankName,
      }));
    }
  };

  const handleAddPartner = (side: "A" | "B") => {
    const name = side === "A" ? formData.BEN_A : formData.BEN_B;
    if (!name) {
      showNotification("Vui lòng nhập tên đối tác", "error");
      return;
    }

    const existing = partners.find(p => p.name.toLowerCase() === name.toLowerCase());
    if (existing) {
      showNotification("Đối tác này đã tồn tại trong danh sách", "error");
      return;
    }

    const newPartner: Partner = {
      id: Date.now().toString(),
      name: side === "A" ? formData.BEN_A : formData.BEN_B,
      gender: side === "A" ? formData.GIOITINHBENA : formData.GIOITINHBENB,
      representative: side === "A" ? formData.DAIDIENBENA : formData.DAIDIENBENB,
      position: side === "A" ? formData.CHUCVUBENA : formData.CHUCVUBENB,
      address: side === "A" ? formData.DIACHIBENA : formData.DIACHIBENB,
      taxCode: side === "A" ? formData.MSTBENA : formData.MSTBENB,
      accountNumber: side === "A" ? formData.STKBENA : formData.STKBENB,
      bankName: side === "A" ? formData.NGANHANGBENA : formData.NGANHANGBENB,
    };

    onPartnersChange([...partners, newPartner]);
    showNotification("Đã thêm đối tác mới thành công!", "success");
  };

  const handleUpdatePartner = (side: "A" | "B") => {
    const name = side === "A" ? formData.BEN_A : formData.BEN_B;
    if (!name) {
      showNotification("Vui lòng nhập tên đối tác", "error");
      return;
    }

    const index = partners.findIndex(p => p.name.toLowerCase() === name.toLowerCase());
    if (index === -1) {
      showNotification("Không tìm thấy đối tác này để cập nhật. Vui lòng dùng 'Thêm đối tác'", "error");
      return;
    }

    const updatedPartners = [...partners];
    updatedPartners[index] = {
      ...updatedPartners[index],
      gender: side === "A" ? formData.GIOITINHBENA : formData.GIOITINHBENB,
      representative: side === "A" ? formData.DAIDIENBENA : formData.DAIDIENBENB,
      position: side === "A" ? formData.CHUCVUBENA : formData.CHUCVUBENB,
      address: side === "A" ? formData.DIACHIBENA : formData.DIACHIBENB,
      taxCode: side === "A" ? formData.MSTBENA : formData.MSTBENB,
      accountNumber: side === "A" ? formData.STKBENA : formData.STKBENB,
      bankName: side === "A" ? formData.NGANHANGBENA : formData.NGANHANGBENB,
    };

    onPartnersChange(updatedPartners);
    showNotification("Đã cập nhật thông tin đối tác thành công!", "success");
  };

  const handleClearInfo = (side: "A" | "B") => {
    if (side === "A") {
      setFormData(prev => ({
        ...prev,
        BEN_A: "",
        GIOITINHBENA: "Ông",
        DAIDIENBENA: "",
        CHUCVUBENA: "",
        DIACHIBENA: "",
        MSTBENA: "",
        STKBENA: "",
        NGANHANGBENA: "",
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        BEN_B: "",
        GIOITINHBENB: "Ông",
        DAIDIENBENB: "",
        CHUCVUBENB: "",
        DIACHIBENB: "",
        MSTBENB: "",
        STKBENB: "",
        NGANHANGBENB: "",
      }));
    }
    showNotification("Đã xóa thông tin nhập liệu", "success");
  };

  const getSideTitle = (side: "A" | "B") => {
    if (formData.LOAI_HOPDONG === "HDTC") {
      return side === "A" ? "Bên A (Bên giao thầu)" : "Bên B (Bên nhận thầu)";
    }
    if (formData.LOAI_HOPDONG === "HDNT") {
      return side === "A" ? "Bên A (Bên mua)" : "Bên B (Bên bán)";
    }
    return side === "A" ? "Bên A (Cho thuê)" : "Bên B (Thuê)";
  };

  const handleTableChange = (rows: TableRow[], total: number) => {
    setTableData(rows);
    if (formData.LOAI_HOPDONG !== "HDTC") {
      setTotalValue(total);
    }
  };

  const toTitleCase = (str: string) => {
    if (!str) return "";
    return str.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const generateContractData = async () => {
    try {
      const record: ContractRecord = {
        id: initialData?.id || Date.now().toString(),
        contractNumber: formData.SO_HOPDONG || "Chưa có số",
        partnerA: formData.BEN_A,
        partnerB: formData.BEN_B,
        date: formData.NGAY_KY,
        type: formData.LOAI_HOPDONG,
        totalValue: totalValue,
        createdAt: initialData?.createdAt || new Date().toISOString(),
        status: "draft",
        formData: formData,
        tableData: tableData
      };
      return await generateContractFile(template, record);
    } catch (error: any) {
      console.error("Docx generation error:", error);
      alert(error.message || "Có lỗi xảy ra khi tạo hợp đồng.");
      return null;
    }
  };

  const handleSaveDraft = async (e: React.MouseEvent) => {
    e.preventDefault();
    
    if (onContractSaved) {
      const newRecord: ContractRecord = {
        id: initialData?.id || Date.now().toString(),
        contractNumber: formData.SO_HOPDONG || "Chưa có số",
        partnerA: formData.BEN_A,
        partnerB: formData.BEN_B,
        date: formData.NGAY_KY,
        type: formData.LOAI_HOPDONG,
        totalValue: totalValue,
        createdAt: initialData?.createdAt || new Date().toISOString(),
        status: "draft",
        formData: formData,
        tableData: tableData
      };
      onContractSaved(newRecord);
      showNotification("Đã lưu bản nháp thành công!", "success");
    }
  };

  const handleDownload = async (e: React.MouseEvent) => {
    e.preventDefault();
    const result = await generateContractData();
    if (result && result.blob) {
      saveAs(result.blob, result.fileName);
      showNotification("Tải hợp đồng thành công!", "success");
    } else {
      showNotification("Có lỗi xảy ra khi tải hợp đồng.", "error");
    }
  };

  return (
    <div className="flex flex-col h-full relative">
      {/* Notification Popup */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -50, x: "-50%" }}
            animate={{ opacity: 1, y: 20, x: "-50%" }}
            exit={{ opacity: 0, y: -50, x: "-50%" }}
            className={`fixed top-0 left-1/2 z-50 px-6 py-3 rounded-xl shadow-2xl flex items-center gap-3 border-2 ${
              notification.type === 'success' 
                ? 'bg-white border-green-500 text-green-700' 
                : 'bg-white border-red-500 text-red-700'
            }`}
          >
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-6 h-6 text-green-500" />
            ) : (
              <AlertCircle className="w-6 h-6 text-red-500" />
            )}
            <span className="font-bold">{notification.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-1 flex flex-col h-full bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
        {/* Notification Popup */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[100]"
          >
            <div className={`px-6 py-3 rounded-2xl shadow-2xl border flex items-center gap-3 ${
              notification.type === 'success' ? 'bg-emerald-600 border-emerald-500 text-white' :
              notification.type === 'error' ? 'bg-red-600 border-red-500 text-white' :
              'bg-blue-600 border-blue-500 text-white'
            }`}>
              {notification.type === 'success' && <CheckCircle2 className="w-5 h-5" />}
              {notification.type === 'error' && <AlertCircle className="w-5 h-5" />}
              {notification.type === 'info' && <Info className="w-5 h-5" />}
              <span className="font-bold text-sm">{notification.message}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
            {/* General Info */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden transition-all hover:shadow-md">
              <div className="bg-gradient-to-r from-indigo-600 to-blue-600 p-4 text-white">
                <h3 className="text-sm font-black uppercase tracking-wider flex items-center gap-2">
                  <Info className="w-4 h-4" /> Thông tin chung
                </h3>
              </div>
              <div className="p-5">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-[11px] font-black text-slate-500 uppercase tracking-wider mb-1">Loại hợp đồng</label>
                    <select
                      name="LOAI_HOPDONG"
                      value={formData.LOAI_HOPDONG}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className="block w-full rounded-xl border-slate-200 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm font-bold bg-slate-50 disabled:text-slate-500"
                    >
                      <option value="HDTX">Hợp đồng thuê xe (HDTX)</option>
                      <option value="HDTC">Hợp đồng thi công (HDTC)</option>
                      <option value="HDNT">Hợp đồng nguyên tắc (HDNT)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-black text-slate-500 uppercase tracking-wider mb-1">Số hợp đồng (Phần đầu)</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        name="SO_HOPDONG_PREFIX"
                        value={formData.SO_HOPDONG_PREFIX}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        className="block w-full rounded-xl border-slate-200 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm font-bold disabled:bg-slate-50 disabled:text-slate-500"
                        placeholder="VD: 01"
                      />
                      <span className="text-slate-400 text-xs font-bold whitespace-nowrap">/ {formData.NGAY_KY.split("-")[0]} / {formData.LOAI_HOPDONG}</span>
                    </div>
                    <p className="text-[10px] text-indigo-500 font-bold mt-1 bg-indigo-50 px-2 py-0.5 rounded-full inline-block">Số đầy đủ: {formData.SO_HOPDONG}</p>
                  </div>
                  <div>
                    <label className="block text-[11px] font-black text-slate-500 uppercase tracking-wider mb-1">Tên công ty viết tắt</label>
                    <input
                      type="text"
                      name="TEN_CTY_VIET_TAT"
                      value={formData.TEN_CTY_VIET_TAT}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className="block w-full rounded-xl border-slate-200 bg-slate-50 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm font-black text-indigo-600 disabled:text-slate-500"
                      placeholder="Tự động từ Tên Bên A"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-black text-slate-500 uppercase tracking-wider mb-1">Ngày ký hợp đồng</label>
                    <input
                      type="date"
                      name="NGAY_KY"
                      value={formData.NGAY_KY}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className="block w-full rounded-xl border-slate-200 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm font-bold disabled:bg-slate-50 disabled:text-slate-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-black text-slate-500 uppercase tracking-wider mb-1">Tên công trình</label>
                    <textarea
                      name="TENCONGTRINH"
                      value={formData.TENCONGTRINH}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      rows={1}
                      className="block w-full rounded-xl border-slate-200 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm font-medium resize-none overflow-hidden min-h-[38px] py-2 disabled:bg-slate-50 disabled:text-slate-500"
                      onInput={(e: any) => {
                        e.target.style.height = 'auto';
                        e.target.style.height = e.target.scrollHeight + 'px';
                      }}
                      placeholder="Nhập tên công trình..."
                    />
                  </div>
                  {formData.LOAI_HOPDONG === "HDTC" && (
                    <>
                      <div>
                        <label className="block text-[11px] font-black text-slate-500 uppercase tracking-wider mb-1">Gói thầu</label>
                        <textarea
                          name="GOITHAU"
                          value={formData.GOITHAU}
                          onChange={handleInputChange}
                          disabled={!isEditing}
                          rows={1}
                          className="block w-full rounded-xl border-slate-200 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm font-medium resize-none overflow-hidden min-h-[38px] py-2 disabled:bg-slate-50 disabled:text-slate-500"
                          onInput={(e: any) => {
                            e.target.style.height = 'auto';
                            e.target.style.height = e.target.scrollHeight + 'px';
                          }}
                          placeholder="Nhập tên gói thầu..."
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-black text-slate-500 uppercase tracking-wider mb-1">Địa điểm công trình</label>
                        <textarea
                          name="DIADIEMCONGTRINH"
                          value={formData.DIADIEMCONGTRINH}
                          onChange={handleInputChange}
                          disabled={!isEditing}
                          rows={1}
                          className="block w-full rounded-xl border-slate-200 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm font-medium resize-none overflow-hidden min-h-[38px] py-2 disabled:bg-slate-50 disabled:text-slate-500"
                          onInput={(e: any) => {
                            e.target.style.height = 'auto';
                            e.target.style.height = e.target.scrollHeight + 'px';
                          }}
                          placeholder="Nhập địa điểm công trình..."
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6">
              {/* Side A */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden transition-all hover:shadow-md">
              <div className="bg-gradient-to-r from-blue-600 to-cyan-600 p-4 text-white flex items-center justify-between">
                <h3 className="text-sm font-black uppercase tracking-wider flex items-center gap-2">
                  <span className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center text-[10px]">A</span> {getSideTitle("A")}
                </h3>
              </div>
              <div className="p-5 space-y-4">
                <div className="flex flex-col gap-2">
                  {isEditing && (
                    <>
                      <select
                        className="block w-full rounded-xl border-slate-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-xs font-black text-blue-700 bg-blue-50 px-3 py-2"
                        onChange={(e) => {
                          const partner = partners.find(p => p.id === e.target.value);
                          if (partner) selectPartner("A", partner);
                        }}
                        value=""
                      >
                        <option value="" disabled>-- Chọn đối tác --</option>
                        {partners.map(p => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleAddPartner("A")}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all text-xs font-bold shadow-sm shadow-blue-200"
                        >
                          <UserPlus className="w-3.5 h-3.5" /> Thêm
                        </button>
                        <button
                          type="button"
                          onClick={() => handleUpdatePartner("A")}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all text-xs font-bold shadow-sm shadow-indigo-200"
                        >
                          <RefreshCw className="w-3.5 h-3.5" /> Lưu
                        </button>
                        <button
                          type="button"
                          onClick={() => handleClearInfo("A")}
                          className="p-2 bg-slate-100 text-slate-500 rounded-xl hover:bg-red-50 hover:text-red-600 transition-all"
                          title="Xóa thông tin"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </>
                  )}
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-black text-slate-500 uppercase tracking-wider mb-1">Tên công ty/Cá nhân</label>
                    <textarea
                      name="BEN_A"
                      value={formData.BEN_A}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      rows={1}
                      className="block w-full rounded-xl border-slate-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm font-bold resize-none overflow-hidden min-h-[38px] py-2 disabled:bg-slate-50 disabled:text-slate-500"
                      onInput={(e: any) => {
                        e.target.style.height = 'auto';
                        e.target.style.height = e.target.scrollHeight + 'px';
                      }}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-black text-slate-500 uppercase tracking-wider mb-1">Giới tính</label>
                      <select
                        name="GIOITINHBENA"
                        value={formData.GIOITINHBENA}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        className="block w-full rounded-xl border-slate-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm font-bold disabled:bg-slate-50 disabled:text-slate-500"
                      >
                        <option value="Ông">Ông</option>
                        <option value="Bà">Bà</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-black text-slate-500 uppercase tracking-wider mb-1">Đại diện</label>
                      <input
                        type="text"
                        name="DAIDIENBENA"
                        value={formData.DAIDIENBENA}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        className="block w-full rounded-xl border-slate-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm font-bold disabled:bg-slate-50 disabled:text-slate-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-black text-slate-500 uppercase tracking-wider mb-1">Chức vụ</label>
                    <input
                      type="text"
                      name="CHUCVUBENA"
                      value={formData.CHUCVUBENA}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className="block w-full rounded-xl border-slate-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm font-bold disabled:bg-slate-50 disabled:text-slate-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-black text-slate-500 uppercase tracking-wider mb-1">Địa chỉ</label>
                    <textarea
                      name="DIACHIBENA"
                      value={formData.DIACHIBENA}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      rows={1}
                      className="block w-full rounded-xl border-slate-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm font-medium resize-none overflow-hidden min-h-[38px] py-2 disabled:bg-slate-50 disabled:text-slate-500"
                      onInput={(e: any) => {
                        e.target.style.height = 'auto';
                        e.target.style.height = e.target.scrollHeight + 'px';
                      }}
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-black text-slate-500 uppercase tracking-wider mb-1">Mã số thuế</label>
                    <input
                      type="text"
                      name="MSTBENA"
                      value={formData.MSTBENA}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className="block w-full rounded-xl border-slate-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm font-bold disabled:bg-slate-50 disabled:text-slate-500"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-black text-slate-500 uppercase tracking-wider mb-1">Số tài khoản</label>
                      <input
                        type="text"
                        name="STKBENA"
                        value={formData.STKBENA}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        className="block w-full rounded-xl border-slate-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm font-bold disabled:bg-slate-50 disabled:text-slate-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-black text-slate-500 uppercase tracking-wider mb-1">Ngân hàng</label>
                      <input
                        type="text"
                        name="NGANHANGBENA"
                        value={formData.NGANHANGBENA}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        className="block w-full rounded-xl border-slate-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm font-bold disabled:bg-slate-50 disabled:text-slate-500"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Side B */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden transition-all hover:shadow-md">
              <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-4 text-white flex items-center justify-between">
                <h3 className="text-sm font-black uppercase tracking-wider flex items-center gap-2">
                  <span className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center text-[10px]">B</span> {getSideTitle("B")}
                </h3>
              </div>
              <div className="p-5 space-y-4">
                <div className="flex flex-col gap-2">
                  {isEditing && (
                    <>
                      <select
                        className="block w-full rounded-xl border-slate-200 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 text-xs font-black text-emerald-700 bg-emerald-50 px-3 py-2"
                        onChange={(e) => {
                          const partner = partners.find(p => p.id === e.target.value);
                          if (partner) selectPartner("B", partner);
                        }}
                        value=""
                      >
                        <option value="" disabled>-- Chọn đối tác --</option>
                        {partners.map(p => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleAddPartner("B")}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all text-xs font-bold shadow-sm shadow-emerald-200"
                        >
                          <UserPlus className="w-3.5 h-3.5" /> Thêm
                        </button>
                        <button
                          type="button"
                          onClick={() => handleUpdatePartner("B")}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all text-xs font-bold shadow-sm shadow-indigo-200"
                        >
                          <RefreshCw className="w-3.5 h-3.5" /> Lưu
                        </button>
                        <button
                          type="button"
                          onClick={() => handleClearInfo("B")}
                          className="p-2 bg-slate-100 text-slate-500 rounded-xl hover:bg-red-50 hover:text-red-600 transition-all"
                          title="Xóa thông tin"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </>
                  )}
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-black text-slate-500 uppercase tracking-wider mb-1">Tên công ty/Cá nhân</label>
                    <textarea
                      name="BEN_B"
                      value={formData.BEN_B}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      rows={1}
                      className="block w-full rounded-xl border-slate-200 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 text-sm font-bold resize-none overflow-hidden min-h-[38px] py-2 disabled:bg-slate-50 disabled:text-slate-500"
                      onInput={(e: any) => {
                        e.target.style.height = 'auto';
                        e.target.style.height = e.target.scrollHeight + 'px';
                      }}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-black text-slate-500 uppercase tracking-wider mb-1">Giới tính</label>
                      <select
                        name="GIOITINHBENB"
                        value={formData.GIOITINHBENB}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        className="block w-full rounded-xl border-slate-200 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 text-sm font-bold disabled:bg-slate-50 disabled:text-slate-500"
                      >
                        <option value="Ông">Ông</option>
                        <option value="Bà">Bà</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-black text-slate-500 uppercase tracking-wider mb-1">Đại diện</label>
                      <input
                        type="text"
                        name="DAIDIENBENB"
                        value={formData.DAIDIENBENB}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        className="block w-full rounded-xl border-slate-200 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 text-sm font-bold disabled:bg-slate-50 disabled:text-slate-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-black text-slate-500 uppercase tracking-wider mb-1">Chức vụ</label>
                    <input
                      type="text"
                      name="CHUCVUBENB"
                      value={formData.CHUCVUBENB}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className="block w-full rounded-xl border-slate-200 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 text-sm font-bold disabled:bg-slate-50 disabled:text-slate-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-black text-slate-500 uppercase tracking-wider mb-1">Địa chỉ</label>
                    <textarea
                      name="DIACHIBENB"
                      value={formData.DIACHIBENB}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      rows={1}
                      className="block w-full rounded-xl border-slate-200 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 text-sm font-medium resize-none overflow-hidden min-h-[38px] py-2 disabled:bg-slate-50 disabled:text-slate-500"
                      onInput={(e: any) => {
                        e.target.style.height = 'auto';
                        e.target.style.height = e.target.scrollHeight + 'px';
                      }}
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-black text-slate-500 uppercase tracking-wider mb-1">Mã số thuế</label>
                    <input
                      type="text"
                      name="MSTBENB"
                      value={formData.MSTBENB}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className="block w-full rounded-xl border-slate-200 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 text-sm font-bold disabled:bg-slate-50 disabled:text-slate-500"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-black text-slate-500 uppercase tracking-wider mb-1">Số tài khoản</label>
                      <input
                        type="text"
                        name="STKBENB"
                        value={formData.STKBENB}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        className="block w-full rounded-xl border-slate-200 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 text-sm font-bold disabled:bg-slate-50 disabled:text-slate-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-black text-slate-500 uppercase tracking-wider mb-1">Ngân hàng</label>
                      <input
                        type="text"
                        name="NGANHANGBENB"
                        value={formData.NGANHANGBENB}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        className="block w-full rounded-xl border-slate-200 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 text-sm font-bold disabled:bg-slate-50 disabled:text-slate-500"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            </div>

            {/* Table or Single Input Section */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden transition-all hover:shadow-md">
            <div className="bg-gradient-to-r from-purple-600 to-fuchsia-600 p-4 text-white">
              <h3 className="text-sm font-black uppercase tracking-wider flex items-center gap-2">
                <FileText className="w-4 h-4" /> {formData.LOAI_HOPDONG === "HDNT" ? "Bảng giá trị hợp đồng" : (formData.LOAI_HOPDONG === "HDTC" ? "Tổng giá trị hợp đồng" : "Bảng giá trị thuê xe")}
              </h3>
            </div>
            <div className="p-5">
              {formData.LOAI_HOPDONG === "HDTC" ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <label className="block text-sm font-black text-slate-700 uppercase tracking-wider">
                      Tổng giá trị hợp đồng
                    </label>
                    <span className="text-xs text-slate-500 italic font-medium">
                      (Đã bao gồm thuế GTGT 8%)
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      name="GIATRI_HD_TC"
                      value={formData.GIATRI_HD_TC ? formData.GIATRI_HD_TC.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".") : ""}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className="block w-full rounded-xl border-slate-200 shadow-sm focus:border-purple-500 focus:ring-purple-500 text-lg font-black text-purple-700 pl-4 pr-16 py-3 bg-slate-50 disabled:text-slate-500"
                      placeholder="Ví dụ: 100.000.000"
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                      <span className="text-slate-400 font-bold text-sm">VNĐ</span>
                    </div>
                  </div>
                  <div className="mt-2 p-3 bg-purple-50 rounded-lg border border-purple-100">
                    <p className="text-[10px] text-purple-400 font-black uppercase tracking-widest mb-1">Bằng chữ</p>
                    <p className="text-sm text-purple-700 font-bold italic">{numberToWords(formData.GIATRI_HD_TC)}</p>
                  </div>
                </div>
              ) : (
                <TableInput 
                  onChange={handleTableChange} 
                  taxRules={taxRules} 
                  onTaxRulesChange={onTaxRulesChange}
                  contractType={formData.LOAI_HOPDONG}
                  initialRows={tableData}
                  readOnly={!isEditing}
                />
              )}
            </div>
          </div>

          {/* Hidden element for PDF generation */}
          <div className="fixed -left-[9999px] -top-[9999px] opacity-0 pointer-events-none">
            <div 
              ref={hiddenPreviewRef} 
              id="pdf-generation-container"
              className="bg-white text-black"
              style={{ color: '#000000', backgroundColor: '#ffffff' }}
            ></div>
          </div>
        </form>
      </div>

      {/* Summary Row at the bottom of the form column */}
      <div className="bg-slate-900 px-6 py-4 text-white border-t border-slate-800 shrink-0">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex flex-col md:flex-row items-center gap-4 md:gap-10 flex-1 w-full">
            <div className="flex flex-col shrink-0">
              <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Tổng giá trị hợp đồng</span>
              <span className="text-2xl font-black text-emerald-400 leading-none">{formatCurrency(totalValue)} <span className="text-xs text-slate-400">VNĐ</span></span>
            </div>
            <div className="flex flex-col flex-1 w-full">
              <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Số tiền bằng chữ</span>
              <span className="text-xs text-slate-200 font-medium italic bg-white/5 px-3 py-2 rounded-lg border border-white/5 min-h-[2.5rem] flex items-center">
                {numberToWords(totalValue)}
              </span>
            </div>
          </div>
          <div className="flex gap-3 shrink-0 w-full md:w-auto">
            {isEditing ? (
              <>
                <button
                  onClick={handleSaveDraft}
                  className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-8 py-2.5 rounded-xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-amber-500/20 transition-all transform hover:scale-105 active:scale-95"
                >
                  <Save className="w-3.5 h-3.5" /> Lưu nháp
                </button>
                <button
                  onClick={handleDownload}
                  className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-2.5 rounded-xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-indigo-500/20 transition-all transform hover:scale-105 active:scale-95"
                >
                  <Download className="w-3.5 h-3.5" /> Tải về
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-2.5 rounded-xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-indigo-500/20 transition-all transform hover:scale-105 active:scale-95"
                >
                  <Edit className="w-3.5 h-3.5" /> Chỉnh sửa
                </button>
                <button
                  onClick={handleDownload}
                  className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-2.5 rounded-xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-blue-500/20 transition-all transform hover:scale-105 active:scale-95"
                >
                  <Download className="w-3.5 h-3.5" /> Tải về
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  </div>
);
};

export default ContractForm;
