import React, { useState, useEffect } from "react";
import { FilePlus, Search, FileText, Calendar, Trash2, Eye, Download, Clock, CheckCircle2 } from "lucide-react";
import { ContractRecord, ContractType } from "../types";
import { formatCurrency } from "../lib/numberToWords";

interface ContractManagementProps {
  contracts: ContractRecord[];
  onDelete: (id: string) => void;
  onBulkDelete: (ids: string[]) => void;
  onCreateClick: () => void;
  onViewClick: (contract: ContractRecord) => void;
  onDownloadClick: (contract: ContractRecord) => void;
}

const ContractManagement: React.FC<ContractManagementProps> = ({ 
  contracts, 
  onDelete,
  onBulkDelete,
  onCreateClick, 
  onViewClick, 
  onDownloadClick 
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    ids: string[];
    message: string;
  }>({
    isOpen: false,
    ids: [],
    message: ""
  });

  const handleDelete = (id: string) => {
    setDeleteModal({
      isOpen: true,
      ids: [id],
      message: "Bạn có chắc chắn muốn xóa hợp đồng này khỏi danh sách?"
    });
  };

  const handleBulkDelete = () => {
    if (selectedIds.size === 0) {
      alert("Vui lòng chọn ít nhất một hợp đồng để xóa.");
      return;
    }
    setDeleteModal({
      isOpen: true,
      ids: Array.from(selectedIds),
      message: `Bạn chắc chắn xóa ${selectedIds.size} hợp đồng này không?`
    });
  };

  const confirmDelete = () => {
    if (deleteModal.ids.length === 1) {
      onDelete(deleteModal.ids[0]);
    } else {
      onBulkDelete(deleteModal.ids);
    }
    
    // Update selectedIds state locally
    setSelectedIds(prev => {
      const newSelected = new Set(prev);
      deleteModal.ids.forEach(id => newSelected.delete(id));
      return newSelected;
    });
    
    setDeleteModal({ isOpen: false, ids: [], message: "" });
  };

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const toggleSelectAll = (ids: string[]) => {
    const allSelected = ids.every(id => selectedIds.has(id));
    const newSelected = new Set(selectedIds);
    if (allSelected) {
      ids.forEach(id => newSelected.delete(id));
    } else {
      ids.forEach(id => newSelected.add(id));
    }
    setSelectedIds(newSelected);
  };

  const handleBulkDownload = () => {
    if (selectedIds.size === 0) {
      alert("Vui lòng chọn ít nhất một hợp đồng để tải về.");
      return;
    }
    const selectedContracts = contracts.filter(c => selectedIds.has(c.id));
    selectedContracts.forEach(c => onDownloadClick(c));
    alert(`Đang chuẩn bị tải xuống ${selectedIds.size} hợp đồng...`);
  };

  const filteredContracts = contracts.filter(c => 
    c.contractNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.partnerA.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.partnerB.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Sorting logic: Sort by contract number within each type
  const sortContracts = (list: ContractRecord[]) => {
    return [...list].sort((a, b) => {
      // Extract number from contractNumber (e.g., "01/2026/HDTX" -> 1)
      const getNum = (s: string) => {
        const match = s.match(/^(\d+)/);
        return match ? parseInt(match[1], 10) : 0;
      };
      return getNum(a.contractNumber) - getNum(b.contractNumber);
    });
  };

  const groupedContracts: Record<ContractType, ContractRecord[]> = {
    HDTX: sortContracts(filteredContracts.filter(c => c.type === "HDTX")),
    HDTC: sortContracts(filteredContracts.filter(c => c.type === "HDTC")),
    HDNT: sortContracts(filteredContracts.filter(c => c.type === "HDNT")),
  };

  const getContractTypeName = (type: ContractType) => {
    switch (type) {
      case "HDTX": return "Thuê xe";
      case "HDTC": return "Thi công";
      case "HDNT": return "Nguyên tắc";
      default: return type;
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "---";
    const parts = dateStr.split("-");
    if (parts.length !== 3) return dateStr;
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  };

  const getPartnerHeader = (type: ContractType) => {
    switch (type) {
      case "HDTC": return "Bên Giao Thầu / Bên Nhận Thầu";
      case "HDNT": return "Bên Mua / Bên Bán";
      case "HDTX": return "Bên Cho Thuê / Bên Thuê";
      default: return "Bên A / Bên B";
    }
  };

  const renderContractContent = (contract: ContractRecord) => {
    if (contract.type === "HDTC") {
      return (
        <div className="text-[13px] space-y-1 font-medium text-slate-700 whitespace-normal break-words">
          <div><span className="font-black text-slate-400 uppercase text-[10px]">Gói thầu:</span> {contract.formData.GOITHAU || "---"}</div>
          <div><span className="font-black text-slate-400 uppercase text-[10px]">Công trình:</span> {contract.formData.TENCONGTRINH || "---"}</div>
          <div><span className="font-black text-slate-400 uppercase text-[10px]">Địa điểm:</span> {contract.formData.DIADIEMCONGTRINH || "---"}</div>
        </div>
      );
    }

    if (!contract.tableData || contract.tableData.length === 0) {
      return <div className="text-sm text-slate-400 italic">Không có nội dung</div>;
    }

    return (
      <ul className="text-[13px] list-disc list-inside space-y-1 font-medium text-slate-700 whitespace-normal break-words">
        {contract.tableData.map((row, idx) => (
          <li key={idx}>{row.noiDung}</li>
        )).slice(0, 5)}
        {contract.tableData.length > 5 && <li className="list-none text-[11px] text-slate-400 italic">... và {contract.tableData.length - 5} mục khác</li>}
      </ul>
    );
  };

  const renderTable = (type: ContractType, list: ContractRecord[]) => {
    if (list.length === 0) return null;

    const allIdsInGroup = list.map(c => c.id);
    const isAllSelected = allIdsInGroup.every(id => selectedIds.has(id));

    const categoryStyles = {
      HDTX: { bg: "bg-blue-600", text: "text-blue-600", light: "bg-blue-50", border: "border-blue-200" },
      HDTC: { bg: "bg-emerald-600", text: "text-emerald-600", light: "bg-emerald-50", border: "border-emerald-200" },
      HDNT: { bg: "bg-indigo-600", text: "text-indigo-600", light: "bg-indigo-50", border: "border-indigo-200" },
    };

    const style = categoryStyles[type];

    return (
      <div key={type} className="mb-10 last:mb-0 border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className={`${style.light} px-6 py-4 border-b ${style.border} flex items-center justify-between`}>
          <div className="flex items-center gap-4">
            <input
              type="checkbox"
              checked={isAllSelected}
              onChange={() => toggleSelectAll(allIdsInGroup)}
              className={`w-5 h-5 rounded ${style.text} focus:ring-offset-2 focus:ring-2 border-slate-300 transition-all cursor-pointer`}
            />
            <h3 className={`text-sm font-black ${style.text} uppercase tracking-widest flex items-center gap-3`}>
              <div className={`w-2 h-6 ${style.bg} rounded-full`} />
              HỢP ĐỒNG {getContractTypeName(type).toUpperCase()}
              <span className={`${style.bg} text-white px-3 py-0.5 rounded-full text-[11px] font-black shadow-sm`}>{list.length}</span>
            </h3>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full table-fixed divide-y divide-slate-200 border-collapse">
            <thead className="bg-slate-50 sticky top-0 z-10 shadow-sm">
              <tr>
                <th scope="col" className="w-[60px] px-4 py-4 border-r border-slate-200"></th>
                <th scope="col" className="w-[150px] px-6 py-4 text-left text-[11px] font-black text-slate-500 uppercase tracking-wider border-r border-slate-200">Số hợp đồng</th>
                <th scope="col" className="w-[120px] px-6 py-4 text-left text-[11px] font-black text-slate-500 uppercase tracking-wider border-r border-slate-200 text-center">Ngày ký</th>
                <th scope="col" className="min-w-[300px] px-6 py-4 text-left text-[11px] font-black text-slate-500 uppercase tracking-wider border-r border-slate-200">Nội dung</th>
                <th scope="col" className="w-[250px] px-6 py-4 text-left text-[11px] font-black text-slate-500 uppercase tracking-wider border-r border-slate-200">{getPartnerHeader(type)}</th>
                <th scope="col" className="w-[180px] px-6 py-4 text-right text-[11px] font-black text-slate-500 uppercase tracking-wider border-r border-slate-200">Giá trị</th>
                <th scope="col" className="w-[140px] px-6 py-4 text-center text-[11px] font-black text-slate-500 uppercase tracking-wider border-r border-slate-200">Trạng thái</th>
                <th scope="col" className="w-[140px] px-6 py-4 text-center text-[11px] font-black text-slate-500 uppercase tracking-wider">Thao tác</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-100">
              {list.map((contract) => (
                <tr key={contract.id} className={`even:bg-slate-50/30 hover:bg-slate-100/50 transition-colors group ${selectedIds.has(contract.id) ? 'bg-blue-50/50' : ''}`}>
                  <td className="px-4 py-5 text-center border-r border-slate-100">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(contract.id)}
                      onChange={() => toggleSelect(contract.id)}
                      className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 transition-all cursor-pointer"
                    />
                  </td>
                  <td className="px-6 py-5 border-r border-slate-100">
                    <div className="text-sm font-black text-slate-900">{contract.contractNumber}</div>
                  </td>
                  <td className="px-6 py-5 text-center border-r border-slate-100 whitespace-nowrap">
                    <div className="inline-flex items-center gap-1.5 text-slate-600 text-xs font-bold bg-slate-100 px-2 py-1 rounded-md whitespace-nowrap">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      {formatDate(contract.date)}
                    </div>
                  </td>
                  <td className="px-6 py-5 border-r border-slate-100">
                    {renderContractContent(contract)}
                  </td>
                  <td className="px-6 py-5 border-r border-slate-100">
                    <div className="flex flex-col gap-2">
                      <div className="flex items-start gap-2">
                        <span className="w-4 h-4 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[8px] font-black shrink-0 mt-0.5">A</span>
                        <span className="text-xs text-slate-700 font-bold leading-tight">{contract.partnerA}</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-[8px] font-black shrink-0 mt-0.5">B</span>
                        <span className="text-xs text-slate-700 font-bold leading-tight">{contract.partnerB}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-right border-r border-slate-100">
                    <div className="text-sm font-black text-emerald-600">{formatCurrency(contract.totalValue)} đ</div>
                  </td>
                  <td className="px-6 py-5 text-center border-r border-slate-100">
                    {contract.status === "completed" ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-black border border-emerald-100 uppercase tracking-wider">
                        <CheckCircle2 className="w-3 h-3" /> Đã tải
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 text-[10px] font-black border border-amber-100 uppercase tracking-wider">
                        <Clock className="w-3 h-3" /> Lưu nháp
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-5 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => onViewClick(contract)}
                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                        title="Xem lại"
                      >
                        <Eye className="w-4.5 h-4.5" />
                      </button>
                      <button
                        onClick={() => onDownloadClick(contract)}
                        className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all"
                        title="Tải về"
                      >
                        <Download className="w-4.5 h-4.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(contract.id)}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                        title="Xóa"
                      >
                        <Trash2 className="w-4.5 h-4.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
      <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50">
        <div className="relative flex-1 max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-slate-400" />
          </div>
          <input
            type="text"
            placeholder="Tìm kiếm theo số HĐ, tên đối tác..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-xl leading-5 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all"
          />
        </div>
        <div className="flex items-center gap-3">
          {selectedIds.size > 0 && (
            <>
              <button
                onClick={handleBulkDownload}
                className="flex items-center justify-center gap-2 bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 px-6 py-2.5 rounded-xl font-bold transition-all transform hover:scale-105 active:scale-95"
              >
                <Download className="w-5 h-5" />
                Tải về đã chọn ({selectedIds.size})
              </button>
              <button
                onClick={handleBulkDelete}
                className="flex items-center justify-center gap-2 bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 px-6 py-2.5 rounded-xl font-bold transition-all transform hover:scale-105 active:scale-95"
              >
                <Trash2 className="w-5 h-5" />
                Xóa đã chọn ({selectedIds.size})
              </button>
            </>
          )}
          <button
            onClick={onCreateClick}
            className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-bold shadow-lg shadow-blue-500/30 transition-all transform hover:scale-105 active:scale-95"
          >
            <FilePlus className="w-5 h-5" />
            Tạo hợp đồng mới
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {filteredContracts.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4 py-20">
            <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center">
              <FileText className="w-12 h-12 text-slate-300" />
            </div>
            <p className="text-lg font-medium">Chưa có hợp đồng nào</p>
            <p className="text-sm">Bấm "Tạo hợp đồng mới" để bắt đầu</p>
          </div>
        ) : (
          <div className="min-w-full inline-block align-middle">
            {renderTable("HDTX", groupedContracts.HDTX)}
            {renderTable("HDTC", groupedContracts.HDTC)}
            {renderTable("HDNT", groupedContracts.HDNT)}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModal.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all animate-in fade-in zoom-in duration-200">
            <div className="p-8 text-center">
              <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <Trash2 className="w-10 h-10 text-red-600" />
              </div>
              <h3 className="text-xl font-black text-slate-900 mb-3">Xác nhận xóa</h3>
              <p className="text-slate-600 font-medium leading-relaxed">
                {deleteModal.message}
              </p>
            </div>
            <div className="p-6 bg-slate-50 flex items-center gap-3 border-t border-slate-100">
              <button
                onClick={() => setDeleteModal({ isOpen: false, ids: [], message: "" })}
                className="flex-1 py-3 px-4 bg-white border border-slate-200 text-slate-700 font-bold rounded-2xl hover:bg-slate-100 transition-all active:scale-95"
              >
                Hủy
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 py-3 px-4 bg-red-600 text-white font-bold rounded-2xl hover:bg-red-700 shadow-lg shadow-red-500/30 transition-all active:scale-95"
              >
                Xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContractManagement;
