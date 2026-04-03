
export type ContractType = "HDTX" | "HDTC" | "HDNT";

export interface Partner {
  id: string;
  name: string;
  representative: string;
  gender: "Ông" | "Bà";
  position: string;
  address: string;
  taxCode: string;
  accountNumber: string;
  bankName: string;
}

export interface TaxRule {
  id: string;
  itemName: string;
  taxRate: 8 | 10;
}

export interface TableRow {
  stt: number;
  noiDung: string;
  dvt: string;
  khoiLuong: number;
  donGia: number;
  thoiGianThue: number;
  thanhTien: number;
  vat8?: number;
  vat10?: number;
  vat: number; // For backward compatibility or single VAT cases
  tongCong: number;
}

export interface ContractRecord {
  id: string;
  contractNumber: string;
  partnerA: string;
  partnerB: string;
  date: string;
  type: ContractType;
  totalValue: number;
  createdAt: string;
  status: "draft" | "completed";
  formData: any;
  tableData: TableRow[];
}
