
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

export interface TableRow {
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
