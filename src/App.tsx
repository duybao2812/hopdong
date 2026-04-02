/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { Settings as SettingsIcon, FilePlus, FileText } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import ContractForm from "./components/ContractForm";
import Settings from "./components/Settings";

type Tab = "create" | "settings";

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>("create");
  const [template, setTemplate] = useState<ArrayBuffer | null>(null);
  const [templateName, setTemplateName] = useState<string | null>(null);

  useEffect(() => {
    // Load template from localStorage on mount
    const savedTemplate = localStorage.getItem("contract_template");
    const savedName = localStorage.getItem("contract_template_name");
    
    if (savedTemplate && savedName) {
      try {
        const binaryString = atob(savedTemplate);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        setTemplate(bytes.buffer);
        setTemplateName(savedName);
      } catch (e) {
        console.error("Error loading saved template", e);
      }
    }
  }, []);

  const handleTemplateChange = (newTemplate: ArrayBuffer | null, name: string | null) => {
    setTemplate(newTemplate);
    setTemplateName(name);
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
                <FileText className="text-white w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-black text-blue-600 tracking-tight leading-none uppercase">HỆ THỐNG TẠO HỢP ĐỒNG TỰ ĐỘNG</h1>
                <p className="text-xs font-medium text-gray-500 mt-1">Made by Bảo Bảo - v1.4</p>
              </div>
            </div>

            <nav className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab("create")}
                className={`nav-link ${activeTab === "create" ? "nav-link-active" : "nav-link-inactive"}`}
              >
                <FilePlus className="w-5 h-5" />
                <span className="hidden sm:inline">Tạo hợp đồng</span>
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
      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <AnimatePresence mode="wait">
          {activeTab === "create" ? (
            <motion.div
              key="create"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-3xl font-black text-gray-900">Tạo hợp đồng mới</h2>
                  <p className="text-gray-500 font-medium">Điền thông tin chi tiết để tạo file hợp đồng tự động</p>
                </div>
                {templateName ? (
                  <div className="flex items-center gap-2 bg-green-50 text-green-700 px-4 py-2 rounded-full border border-green-100 text-sm font-bold">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    Đang dùng mẫu: {templateName}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 bg-red-50 text-red-700 px-4 py-2 rounded-full border border-red-100 text-sm font-bold">
                    <div className="w-2 h-2 bg-red-500 rounded-full" />
                    Chưa có file mẫu! Vui lòng vào Cài đặt
                  </div>
                )}
              </div>
              <ContractForm template={template} />
            </motion.div>
          ) : (
            <motion.div
              key="settings"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <div className="mb-8">
                <h2 className="text-3xl font-black text-gray-900">Cấu hình hệ thống</h2>
                <p className="text-gray-500 font-medium">Quản lý file mẫu và các thiết lập hợp đồng</p>
              </div>
              <Settings onTemplateChange={handleTemplateChange} currentTemplateName={templateName} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-6">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-sm text-gray-500 font-medium">
            &copy; {new Date().getFullYear()} Contract Gen. Thiết kế bởi AIS Build.
          </p>
        </div>
      </footer>
    </div>
  );
}
