
import React, { useState, useEffect, useMemo } from "react";
import { Download, FileText, Info, Search, UserCheck } from "lucide-react";
import TableInput from "./TableInput";
import { numberToWords, formatCurrency, abbreviateCompanyName, getShortName } from "../lib/numberToWords";
import { generateDocx } from "../lib/docxUtils";
import { Partner } from "../types";

interface ContractFormProps {
  template: ArrayBuffer | null;
}

const ContractForm: React.FC<ContractFormProps> = ({ template }) => {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [formData, setFormData] = useState({
    TEN_CTY_VIET_TAT: "",
    SO_HOPDONG_PREFIX: "",
    SO_HOPDONG: "",
    DAY_HOPDONG: new Date().getDate().toString().padStart(2, "0"),
    MONTH_HOPDONG: (new Date().getMonth() + 1).toString().padStart(2, "0"),
    YEAR_HOPDONG: new Date().getFullYear().toString(),
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
    LOAI_HOPDONG: "HDTX", // HDTX, HDTC, HDNT
  });

  const [tableData, setTableData] = useState<any[]>([]);
  const [totalValue, setTotalValue] = useState(0);

  useEffect(() => {
    const savedPartners = localStorage.getItem("contract_partners");
    if (savedPartners) {
      setPartners(JSON.parse(savedPartners));
    }
  }, []);

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
      const fullNumber = `${formData.SO_HOPDONG_PREFIX}/${formData.YEAR_HOPDONG}/${formData.LOAI_HOPDONG}`;
      setFormData(prev => ({ ...prev, SO_HOPDONG: fullNumber }));
    }
  }, [formData.SO_HOPDONG_PREFIX, formData.YEAR_HOPDONG, formData.LOAI_HOPDONG]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
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

  const handleTableChange = (rows: any[], total: number) => {
    setTableData(rows);
    setTotalValue(total);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!template) {
      alert("Vui lòng tải lên file mẫu trong phần Cài đặt trước khi tạo hợp đồng.");
      return;
    }

    const data = {
      ...formData,
      BANGGIATRITHUEXE: tableData.map((row) => ({
        ...row,
        donGia: formatCurrency(row.donGia),
        thanhTien: formatCurrency(row.thanhTien),
        vat: formatCurrency(row.vat),
        tongCong: formatCurrency(row.tongCong),
      })),
      GIATRIHOPDONG: formatCurrency(totalValue),
      BANGCHUGIATRI: numberToWords(totalValue),
    };

    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, "0")}h${now.getMinutes().toString().padStart(2, "0")}`;
    const shortA = getShortName(formData.BEN_A) || "BENA";
    const shortB = getShortName(formData.BEN_B) || "BENB";
    const dateStr = `${formData.DAY_HOPDONG}-${formData.MONTH_HOPDONG}-${formData.YEAR_HOPDONG}`;
    
    const safeContractNumber = (formData.SO_HOPDONG || "SO-HD").replace(/\//g, "-");
    const fileName = `${safeContractNumber}_${shortA}_${shortB}_${dateStr}_${timeStr}.docx`;

    try {
      await generateDocx(template, data, fileName);
    } catch (error) {
      alert("Có lỗi xảy ra khi tạo hợp đồng. Vui lòng kiểm tra lại file mẫu.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 pb-12">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* General Info */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-4">
          <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2 border-b pb-2">
            <Info className="w-5 h-5 text-blue-500" /> Thông tin chung
          </h3>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700">Loại hợp đồng</label>
              <select
                name="LOAI_HOPDONG"
                value={formData.LOAI_HOPDONG}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
              >
                <option value="HDTX">Hợp đồng thuê xe (HDTX)</option>
                <option value="HDTC">Hợp đồng thi công (HDTC)</option>
                <option value="HDNT">Hợp đồng nguyên tắc (HDNT)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Số hợp đồng (Phần đầu)</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  name="SO_HOPDONG_PREFIX"
                  value={formData.SO_HOPDONG_PREFIX}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                  placeholder="VD: 01"
                />
                <span className="text-gray-400 mt-1">/ {formData.YEAR_HOPDONG} / {formData.LOAI_HOPDONG}</span>
              </div>
              <p className="text-[10px] text-gray-400 mt-1">Số đầy đủ: {formData.SO_HOPDONG}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Tên công ty viết tắt (Tự động)</label>
              <input
                type="text"
                name="TEN_CTY_VIET_TAT"
                value={formData.TEN_CTY_VIET_TAT}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 bg-gray-50 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm font-bold text-blue-700"
                placeholder="Tự động từ Tên Bên A"
              />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">Ngày</label>
                <input
                  type="text"
                  name="DAY_HOPDONG"
                  value={formData.DAY_HOPDONG}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Tháng</label>
                <input
                  type="text"
                  name="MONTH_HOPDONG"
                  value={formData.MONTH_HOPDONG}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Năm</label>
                <input
                  type="text"
                  name="YEAR_HOPDONG"
                  value={formData.YEAR_HOPDONG}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Tên công trình</label>
              <input
                type="text"
                name="TENCONGTRINH"
                value={formData.TENCONGTRINH}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                placeholder="Nhập tên công trình..."
              />
            </div>
          </div>
        </div>

        {/* Side A */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-4">
          <div className="flex items-center justify-between border-b pb-2">
            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs">A</span> Bên A (Cho thuê)
            </h3>
            <div className="relative">
              <select
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-xs font-bold text-blue-600 bg-blue-50"
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
            </div>
          </div>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700">Tên công ty/Cá nhân</label>
              <input
                type="text"
                name="BEN_A"
                value={formData.BEN_A}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">Giới tính</label>
                <select
                  name="GIOITINHBENA"
                  value={formData.GIOITINHBENA}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                >
                  <option value="Ông">Ông</option>
                  <option value="Bà">Bà</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Đại diện</label>
                <input
                  type="text"
                  name="DAIDIENBENA"
                  value={formData.DAIDIENBENA}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Chức vụ</label>
              <input
                type="text"
                name="CHUCVUBENA"
                value={formData.CHUCVUBENA}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Địa chỉ</label>
              <input
                type="text"
                name="DIACHIBENA"
                value={formData.DIACHIBENA}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Mã số thuế</label>
              <input
                type="text"
                name="MSTBENA"
                value={formData.MSTBENA}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">Số tài khoản</label>
                <input
                  type="text"
                  name="STKBENA"
                  value={formData.STKBENA}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Ngân hàng</label>
                <input
                  type="text"
                  name="NGANHANGBENA"
                  value={formData.NGANHANGBENA}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Side B */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-4">
          <div className="flex items-center justify-between border-b pb-2">
            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <span className="w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-xs">B</span> Bên B (Thuê)
            </h3>
            <div className="relative">
              <select
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-xs font-bold text-green-600 bg-green-50"
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
            </div>
          </div>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700">Tên công ty/Cá nhân</label>
              <input
                type="text"
                name="BEN_B"
                value={formData.BEN_B}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">Giới tính</label>
                <select
                  name="GIOITINHBENB"
                  value={formData.GIOITINHBENB}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                >
                  <option value="Ông">Ông</option>
                  <option value="Bà">Bà</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Đại diện</label>
                <input
                  type="text"
                  name="DAIDIENBENB"
                  value={formData.DAIDIENBENB}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Chức vụ</label>
              <input
                type="text"
                name="CHUCVUBENB"
                value={formData.CHUCVUBENB}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Địa chỉ</label>
              <input
                type="text"
                name="DIACHIBENB"
                value={formData.DIACHIBENB}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Mã số thuế</label>
              <input
                type="text"
                name="MSTBENB"
                value={formData.MSTBENB}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">Số tài khoản</label>
                <input
                  type="text"
                  name="STKBENB"
                  value={formData.STKBENB}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Ngân hàng</label>
                <input
                  type="text"
                  name="NGANHANGBENB"
                  value={formData.NGANHANGBENB}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-4">
        <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2 border-b pb-2">
          <FileText className="w-5 h-5 text-purple-500" /> Bảng giá trị thuê xe
        </h3>
        <TableInput onChange={handleTableChange} />
      </div>

      <div className="bg-blue-50 p-6 rounded-xl border border-blue-100 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="space-y-1">
          <p className="text-sm text-blue-600 font-medium uppercase tracking-wider">Tổng giá trị hợp đồng</p>
          <p className="text-3xl font-black text-blue-900">{formatCurrency(totalValue)} VNĐ</p>
          <p className="text-sm text-blue-700 italic">Bằng chữ: {numberToWords(totalValue)}</p>
        </div>
        <button
          type="submit"
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg font-bold text-lg shadow-lg shadow-blue-200 transition-all transform hover:scale-105 active:scale-95"
        >
          <Download className="w-6 h-6" /> TẠO HỢP ĐỒNG
        </button>
      </div>
    </form>
  );
};

export default ContractForm;
