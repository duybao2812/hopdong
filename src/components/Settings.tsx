
import React, { useState, useEffect } from "react";
import { Upload, FileCheck, AlertCircle, Trash2, Users, Plus, Save, Download } from "lucide-react";
import { Partner } from "../types";

interface SettingsProps {
  onTemplateChange: (template: ArrayBuffer | null, name: string | null) => void;
  currentTemplateName: string | null;
}

const Settings: React.FC<SettingsProps> = ({ onTemplateChange, currentTemplateName }) => {
  const [dragActive, setDragActive] = useState(false);
  const [partners, setPartners] = useState<Partner[]>([]);

  useEffect(() => {
    const savedPartners = localStorage.getItem("contract_partners");
    if (savedPartners) {
      setPartners(JSON.parse(savedPartners));
    }
  }, []);

  const savePartners = () => {
    localStorage.setItem("contract_partners", JSON.stringify(partners));
    alert("Đã lưu danh sách đối tác thành công!");
  };

  const addPartner = () => {
    const newPartner: Partner = {
      id: Date.now().toString(),
      name: "",
      representative: "",
      gender: "Ông",
      position: "",
      address: "",
      taxCode: "",
      accountNumber: "",
      bankName: "",
    };
    setPartners([...partners, newPartner]);
  };

  const updatePartner = (id: string, field: keyof Partner, value: string) => {
    setPartners(partners.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  const removePartner = (id: string) => {
    setPartners(partners.filter(p => p.id !== id));
  };

  const handleFile = (file: File) => {
    if (file && file.name.endsWith(".docx")) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const arrayBuffer = e.target?.result as ArrayBuffer;
        onTemplateChange(arrayBuffer, file.name);
        
        // Save to localStorage for persistence
        const base64 = btoa(
          new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), "")
        );
        localStorage.setItem("contract_template", base64);
        localStorage.setItem("contract_template_name", file.name);
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
    localStorage.removeItem("contract_template");
    localStorage.removeItem("contract_template_name");
    onTemplateChange(null, null);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Template Settings */}
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 space-y-6">
        <div className="flex items-center justify-between border-b pb-4">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Upload className="w-6 h-6 text-blue-500" /> Cài đặt mẫu hợp đồng
          </h2>
          {currentTemplateName && (
            <div className="flex items-center gap-4">
              <button
                onClick={() => {
                  const base64 = localStorage.getItem("contract_template");
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl border-2 border-blue-500 bg-blue-50 flex flex-col items-center text-center space-y-2">
            <div className="w-10 h-10 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold">1</div>
            <p className="font-bold text-blue-900">Hợp đồng thuê xe máy</p>
            <p className="text-xs text-blue-700">Đang hoạt động</p>
          </div>
          <div className="p-4 rounded-xl border-2 border-gray-200 bg-gray-50 flex flex-col items-center text-center space-y-2 opacity-50 cursor-not-allowed">
            <div className="w-10 h-10 bg-gray-300 text-white rounded-full flex items-center justify-center font-bold">2</div>
            <p className="font-bold text-gray-600">Hợp đồng thi công xây dựng</p>
            <p className="text-xs text-gray-500">Sắp ra mắt</p>
          </div>
          <div className="p-4 rounded-xl border-2 border-gray-200 bg-gray-50 flex flex-col items-center text-center space-y-2 opacity-50 cursor-not-allowed">
            <div className="w-10 h-10 bg-gray-300 text-white rounded-full flex items-center justify-center font-bold">3</div>
            <p className="font-bold text-gray-600">Hợp đồng nguyên tắc</p>
            <p className="text-xs text-gray-500">Sắp ra mắt</p>
          </div>
        </div>

        <div
          className={`relative border-2 border-dashed rounded-2xl p-12 transition-all flex flex-col items-center justify-center space-y-4 ${
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
              <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                <FileCheck className="w-8 h-8" />
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-gray-800">Đã tải lên: {currentTemplateName}</p>
                <p className="text-sm text-gray-500">Kéo thả file khác để thay thế</p>
              </div>
            </>
          ) : (
            <>
              <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
                <Upload className="w-8 h-8" />
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-gray-800">Kéo thả file mẫu .docx vào đây</p>
                <p className="text-sm text-gray-500">Hoặc nhấp để chọn file từ máy tính</p>
              </div>
            </>
          )}
        </div>

        <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-100 flex gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0" />
          <div className="text-sm text-yellow-800 space-y-2">
            <p className="font-bold">Lưu ý về các Placeholder trong file mẫu:</p>
            <p>Đảm bảo file .docx của bạn chứa các thẻ sau để dữ liệu được điền chính xác:</p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 font-mono text-xs bg-white/50 p-2 rounded">
              <span>{"{{TEN_CTY_VIET_TAT}}"}</span>
              <span>{"{{SO_HOPDONG}}"}</span>
              <span>{"{{DAY_HOPDONG}}"}</span>
              <span>{"{{MONTH_HOPDONG}}"}</span>
              <span>{"{{YEAR_HOPDONG}}"}</span>
              <span>{"{{BEN_A}}"}</span>
              <span>{"{{DAIDIENBENA}}"}</span>
              <span>{"{{BANGGIATRITHUEXE}}"} (Table)</span>
              <span>{"{{GIATRIHOPDONG}}"}</span>
              <span>{"{{BANGCHUGIATRI}}"}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Partner Management */}
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 space-y-6">
        <div className="flex items-center justify-between border-b pb-4">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Users className="w-6 h-6 text-green-500" /> Quản lý danh sách đối tác
          </h2>
          <button
            onClick={addPartner}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition-all"
          >
            <Plus className="w-4 h-4" /> Thêm đối tác
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-700 uppercase font-bold border-b border-gray-200">
              <tr>
                <th className="px-3 py-2 border-r border-gray-200 min-w-[200px]">Tên đối tác</th>
                <th className="px-3 py-2 border-r border-gray-200 w-32">Đại diện</th>
                <th className="px-3 py-2 border-r border-gray-200 w-24">Giới tính</th>
                <th className="px-3 py-2 border-r border-gray-200 w-32">Chức vụ</th>
                <th className="px-3 py-2 border-r border-gray-200 min-w-[200px]">Địa chỉ</th>
                <th className="px-3 py-2 border-r border-gray-200 w-32">MST</th>
                <th className="px-3 py-2 border-r border-gray-200 w-32">STK</th>
                <th className="px-3 py-2 border-r border-gray-200 w-32">Ngân hàng</th>
                <th className="px-3 py-2 w-12"></th>
              </tr>
            </thead>
            <tbody>
              {partners.map((partner) => (
                <tr key={partner.id} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                  <td className="px-2 py-1 border-r border-gray-200">
                    <input
                      type="text"
                      className="w-full bg-transparent border-none focus:ring-0 p-1"
                      value={partner.name}
                      onChange={(e) => updatePartner(partner.id, "name", e.target.value)}
                      placeholder="Tên công ty..."
                    />
                  </td>
                  <td className="px-2 py-1 border-r border-gray-200">
                    <input
                      type="text"
                      className="w-full bg-transparent border-none focus:ring-0 p-1"
                      value={partner.representative}
                      onChange={(e) => updatePartner(partner.id, "representative", e.target.value)}
                      placeholder="Họ tên..."
                    />
                  </td>
                  <td className="px-2 py-1 border-r border-gray-200">
                    <select
                      className="w-full bg-transparent border-none focus:ring-0 p-1"
                      value={partner.gender}
                      onChange={(e) => updatePartner(partner.id, "gender", e.target.value as any)}
                    >
                      <option value="Ông">Ông</option>
                      <option value="Bà">Bà</option>
                    </select>
                  </td>
                  <td className="px-2 py-1 border-r border-gray-200">
                    <input
                      type="text"
                      className="w-full bg-transparent border-none focus:ring-0 p-1"
                      value={partner.position}
                      onChange={(e) => updatePartner(partner.id, "position", e.target.value)}
                      placeholder="Chức vụ..."
                    />
                  </td>
                  <td className="px-2 py-1 border-r border-gray-200">
                    <input
                      type="text"
                      className="w-full bg-transparent border-none focus:ring-0 p-1"
                      value={partner.address}
                      onChange={(e) => updatePartner(partner.id, "address", e.target.value)}
                      placeholder="Địa chỉ..."
                    />
                  </td>
                  <td className="px-2 py-1 border-r border-gray-200">
                    <input
                      type="text"
                      className="w-full bg-transparent border-none focus:ring-0 p-1"
                      value={partner.taxCode}
                      onChange={(e) => updatePartner(partner.id, "taxCode", e.target.value)}
                      placeholder="Mã số thuế..."
                    />
                  </td>
                  <td className="px-2 py-1 border-r border-gray-200">
                    <input
                      type="text"
                      className="w-full bg-transparent border-none focus:ring-0 p-1"
                      value={partner.accountNumber}
                      onChange={(e) => updatePartner(partner.id, "accountNumber", e.target.value)}
                      placeholder="Số tài khoản..."
                    />
                  </td>
                  <td className="px-2 py-1 border-r border-gray-200">
                    <input
                      type="text"
                      className="w-full bg-transparent border-none focus:ring-0 p-1"
                      value={partner.bankName}
                      onChange={(e) => updatePartner(partner.id, "bankName", e.target.value)}
                      placeholder="Ngân hàng..."
                    />
                  </td>
                  <td className="px-2 py-1 text-center">
                    <button
                      onClick={() => removePartner(partner.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {partners.length > 0 && (
          <div className="flex justify-end pt-4">
            <button
              onClick={savePartners}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-bold flex items-center gap-2 shadow-lg shadow-blue-200 transition-all"
            >
              <Save className="w-5 h-5" /> LƯU DANH SÁCH ĐỐI TÁC
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Settings;
