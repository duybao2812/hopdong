/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { Settings as SettingsIcon, FilePlus, FileText, FolderOpen, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import ContractForm from "./components/ContractForm";
import Settings from "./components/Settings";
import ContractManagement from "./components/ContractManagement";
import { generateContractFile } from "./lib/contractGenerator";
import { saveAs } from "file-saver";

import { Partner, TaxRule, ContractType, ContractRecord } from "./types";

type Tab = "management" | "settings";

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>("management");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedContract, setSelectedContract] = useState<ContractRecord | null>(null);
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [templates, setTemplates] = useState<Record<ContractType, ArrayBuffer | null>>({
    HDTX: null,
    HDTC: null,
    HDNT: null,
  });
  const [templateNames, setTemplateNames] = useState<Record<ContractType, string | null>>({
    HDTX: null,
    HDTC: null,
    HDNT: null,
  });
  const [taxRules, setTaxRules] = useState<TaxRule[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [selectedTemplateType, setSelectedTemplateType] = useState<ContractType>("HDTX");
  const [contracts, setContracts] = useState<ContractRecord[]>([]);

  // Sync contracts to localStorage whenever they change
  useEffect(() => {
    if (contracts.length > 0 || localStorage.getItem("contract_records")) {
      localStorage.setItem("contract_records", JSON.stringify(contracts));
    }
  }, [contracts]);

  const handleDeleteContract = (id: string) => {
    setContracts(prev => prev.filter(c => c.id !== id));
  };

  const handleBulkDeleteContracts = (ids: string[]) => {
    setContracts(prev => prev.filter(c => !ids.includes(c.id)));
  };

  useEffect(() => {
    // Load templates from localStorage on mount
    const types: ContractType[] = ["HDTX", "HDTC", "HDNT"];
    const newTemplates = { ...templates };
    const newNames = { ...templateNames };

    types.forEach(type => {
      const savedTemplate = localStorage.getItem(`contract_template_${type}`);
      const savedName = localStorage.getItem(`contract_template_name_${type}`);
      
      if (savedTemplate && savedName) {
        try {
          const binaryString = atob(savedTemplate);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          newTemplates[type] = bytes.buffer;
          newNames[type] = savedName;
        } catch (e) {
          console.error(`Error loading saved template for ${type}`, e);
        }
      }
    });

    setTemplates(newTemplates);
    setTemplateNames(newNames);

    const savedTaxRules = localStorage.getItem("contract_tax_rules");
    const savedPartners = localStorage.getItem("contract_partners");
    const savedType = localStorage.getItem("contract_template_type") as ContractType;
    const savedContracts = localStorage.getItem("contract_records");
    
    if (savedType) {
      setSelectedTemplateType(savedType);
    }

    if (savedTaxRules) {
      setTaxRules(JSON.parse(savedTaxRules));
    } else {
      // Default tax rules
      const defaultRules: TaxRule[] = [
        { id: '1', itemName: 'Cát lắp', taxRate: 10 },
        { id: '2', itemName: 'Đá 0x4 loại 1', taxRate: 10 },
        { id: '3', itemName: 'Thép cừ lá sen', taxRate: 10 },
        { id: '4', itemName: 'Thép các loại', taxRate: 10 },
        { id: '5', itemName: 'Bê tông M250', taxRate: 8 },
      ];
      setTaxRules(defaultRules);
      localStorage.setItem("contract_tax_rules", JSON.stringify(defaultRules));
    }

    if (savedPartners) {
      setPartners(JSON.parse(savedPartners));
    }

    if (savedContracts) {
      try {
        setContracts(JSON.parse(savedContracts));
      } catch (e) {
        console.error("Failed to parse contracts", e);
      }
    }
  }, []);

  const handleTemplateChange = (newTemplate: ArrayBuffer | null, name: string | null, type: ContractType) => {
    setTemplates(prev => ({ ...prev, [type]: newTemplate }));
    setTemplateNames(prev => ({ ...prev, [type]: name }));
  };

  const handleTemplateTypeChange = (type: ContractType) => {
    setSelectedTemplateType(type);
    localStorage.setItem("contract_template_type", type);
  };

  const handleTaxRulesChange = (newRules: TaxRule[]) => {
    setTaxRules(newRules);
    localStorage.setItem("contract_tax_rules", JSON.stringify(newRules));
  };

  const handlePartnersChange = (newPartners: Partner[]) => {
    setPartners(newPartners);
    localStorage.setItem("contract_partners", JSON.stringify(newPartners));
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shrink-0 z-10 shadow-sm">
        <div className="w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
                <FileText className="text-white w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-black text-blue-600 tracking-tight leading-none uppercase">HỆ THỐNG TẠO HỢP ĐỒNG TỰ ĐỘNG</h1>
                <p className="text-xs font-medium text-gray-500 mt-1">Made by Bảo Bảo - v1.16</p>
              </div>
            </div>

            <nav className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab("management")}
                className={`nav-link ${activeTab === "management" ? "nav-link-active" : "nav-link-inactive"}`}
              >
                <FolderOpen className="w-5 h-5" />
                <span className="hidden sm:inline">Quản lý hợp đồng</span>
              </button>
              <button
                onClick={() => setActiveTab("settings")}
                className={`nav-link ${activeTab === "settings" ? "nav-link-active" : "nav-link-inactive"}`}
              >
                <SettingsIcon className="w-5 h-5" />
                <span className="hidden sm:inline">Cài đặt</span>
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col overflow-hidden">
        <AnimatePresence mode="wait">
          {activeTab === "management" ? (
            <motion.div
              key="management"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="flex-1 flex flex-col overflow-hidden"
            >
              <div className="mb-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
                <div>
                  <h2 className="text-2xl font-black text-gray-900">Quản lý hợp đồng</h2>
                  <p className="text-sm text-gray-500 font-medium">Danh sách các hợp đồng đã tạo và lưu trữ</p>
                </div>
              </div>
              <div className="flex-1 overflow-hidden">
                <ContractManagement 
                  contracts={contracts}
                  onDelete={handleDeleteContract}
                  onBulkDelete={handleBulkDeleteContracts}
                  onCreateClick={() => {
                    setSelectedContract(null);
                    setIsReadOnly(false);
                    setIsCreateModalOpen(true);
                  }} 
                  onViewClick={(contract) => {
                    setSelectedContract(contract);
                    setIsReadOnly(true);
                    setIsCreateModalOpen(true);
                  }}
                  onDownloadClick={async (contract) => {
                    const template = templates[contract.type];
                    if (!template) {
                      alert("Vui lòng tải lên file mẫu trong phần Cài đặt.");
                      return;
                    }
                    const result = await generateContractFile(template, contract);
                    if (result) {
                      saveAs(result.blob, result.fileName);
                      
                      // Update status to completed (Downloaded)
                      setContracts(prev => {
                        const updated = prev.map(c => 
                          c.id === contract.id ? { ...c, status: "completed" as const } : c
                        );
                        localStorage.setItem("contract_records", JSON.stringify(updated));
                        return updated;
                      });
                    }
                  }}
                />
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="settings"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="flex-1 flex flex-col overflow-hidden"
            >
              <div className="mb-4 shrink-0">
                <h2 className="text-2xl font-black text-gray-900">Cấu hình hệ thống</h2>
                <p className="text-sm text-gray-500 font-medium">Quản lý file mẫu và các thiết lập hợp đồng</p>
              </div>
              <div className="flex-1 overflow-y-auto pb-8 pr-2 custom-scrollbar">
                <Settings 
                  onTemplateChange={handleTemplateChange} 
                  currentTemplateName={templateNames[selectedTemplateType]} 
                  taxRules={taxRules}
                  onTaxRulesChange={handleTaxRulesChange}
                  partners={partners}
                  onPartnersChange={handlePartnersChange}
                  selectedTemplateType={selectedTemplateType}
                  onTemplateTypeChange={handleTemplateTypeChange}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-3 shrink-0">
        <div className="w-full mx-auto px-4 text-center">
          <p className="text-xs text-gray-500 font-medium">
            &copy; {new Date().getFullYear()} Contract Gen. Thiết kế bởi AIS Build.
          </p>
        </div>
      </footer>

      {/* Create Contract Modal */}
      <AnimatePresence>
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCreateModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-6xl h-[90vh] bg-white rounded-3xl shadow-2xl flex flex-col overflow-hidden"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50 shrink-0">
                <div>
                  <h2 className="text-xl font-black text-slate-800">
                    {selectedContract ? (isReadOnly ? "Xem hợp đồng" : "Chỉnh sửa hợp đồng") : "Tạo hợp đồng mới"}
                  </h2>
                  <div className="mt-1">
                    {templateNames[selectedTemplateType] ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">
                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                        Mẫu: {templateNames[selectedTemplateType]}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded-md">
                        <div className="w-1.5 h-1.5 bg-red-500 rounded-full" />
                        Chưa có file mẫu
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setIsCreateModalOpen(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-xl transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="flex-1 overflow-hidden bg-slate-50/50 p-6">
                <ContractForm 
                  template={templates[selectedContract?.type || selectedTemplateType]} 
                  taxRules={taxRules} 
                  onTaxRulesChange={handleTaxRulesChange}
                  partners={partners}
                  onPartnersChange={handlePartnersChange}
                  selectedTemplateType={selectedContract?.type || selectedTemplateType}
                  onTemplateTypeChange={setSelectedTemplateType}
                  initialData={selectedContract || undefined}
                  readOnly={isReadOnly}
                  onContractSaved={(record) => {
                    setContracts(prev => {
                      if (selectedContract) {
                        // Update existing
                        return prev.map(c => c.id === record.id ? record : c);
                      } else {
                        // Add new
                        return [record, ...prev];
                      }
                    });
                    
                    setIsCreateModalOpen(false);
                    setSelectedContract(null);
                  }}
                  onClose={() => {
                    setIsCreateModalOpen(false);
                    setSelectedContract(null);
                  }}
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
