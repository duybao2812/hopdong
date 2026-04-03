
const units = ["", "một", "hai", "ba", "bốn", "năm", "sáu", "bảy", "tám", "chín"];

function readThreeDigits(number: number, showZeroHundred: boolean): string {
  let hundred = Math.floor(number / 100);
  let ten = Math.floor((number % 100) / 10);
  let unit = number % 10;
  let res = "";

  if (hundred > 0 || showZeroHundred) {
    res += units[hundred] + " trăm ";
  }

  if (ten > 0) {
    if (ten === 1) {
      res += "mười ";
    } else {
      res += units[ten] + " mươi ";
    }
  } else if (hundred > 0 || showZeroHundred) {
    if (unit > 0) res += "lẻ ";
  }

  if (unit > 0) {
    if (unit === 1 && ten > 1) {
      res += "mốt ";
    } else if (unit === 5 && ten > 0) {
      res += "lăm ";
    } else {
      res += units[unit] + " ";
    }
  }

  return res;
}

export function numberToWords(number: number): string {
  if (number === 0) return "Không đồng";
  if (number < 0) return "Trừ " + numberToWords(Math.abs(number));

  let res = "";
  let billion = Math.floor(number / 1000000000);
  let million = Math.floor((number % 1000000000) / 1000000);
  let thousand = Math.floor((number % 1000000) / 1000);
  let remainder = Math.floor(number % 1000);

  if (billion > 0) {
    res += readThreeDigits(billion, false) + "tỷ ";
  }
  if (million > 0) {
    res += readThreeDigits(million, billion > 0) + "triệu ";
  }
  if (thousand > 0) {
    res += readThreeDigits(thousand, billion > 0 || million > 0) + "nghìn ";
  }
  if (remainder > 0) {
    res += readThreeDigits(remainder, billion > 0 || million > 0 || thousand > 0);
  }

  res = res.trim();
  if (res.length > 0) {
    res = res.charAt(0).toUpperCase() + res.slice(1) + " đồng";
  }
  return res;
}

export function formatCurrency(amount: number): string {
  return amount.toLocaleString("vi-VN").replace(/,/g, ".");
}

export function abbreviateCompanyName(name: string): string {
  if (!name) return "";
  let res = name.toUpperCase();
  res = res.replace(/CÔNG TY TNHH/g, "CTY TNHH");
  res = res.replace(/CÔNG TY CP/g, "CTY CP");
  res = res.replace(/CÔNG TY CỔ PHẦN/g, "CTY CP");
  res = res.replace(/XÂY DỰNG/g, "XD");
  res = res.replace(/THƯƠNG MẠI/g, "TM");
  res = res.replace(/DỊCH VỤ/g, "DV");
  res = res.replace(/SẢN XUẤT/g, "SX");
  res = res.replace(/CUNG ỨNG/g, "CƯ");
  return res;
}

export function toTitleCase(str: string): string {
  if (!str) return "";
  return str.toLowerCase().split(" ").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
}

export function getShortName(name: string): string {
  if (!name) return "";
  let res = name.toUpperCase();
  // Remove common prefixes
  const prefixes = [
    "CÔNG TY TNHH MỘT THÀNH VIÊN",
    "CÔNG TY TNHH 1 THÀNH VIÊN",
    "CÔNG TY TNHH",
    "CÔNG TY CỔ PHẦN",
    "CÔNG TY CP",
    "CÔNG TY",
    "TNHH",
    "CP",
    "XÂY DỰNG",
    "THƯƠNG MẠI",
    "DỊCH VỤ",
    "SẢN XUẤT",
    "CUNG ỨNG",
    "ĐẦU TƯ",
    "PHÁT TRIỂN",
    "THIẾT KẾ",
    "THI CÔNG",
    "XÂY LẮP",
    "VẬN TẢI",
    "DU LỊCH",
    "KỸ THUẬT",
    "CÔNG NGHỆ",
    "MÔI TRƯỜNG",
    "QUẢNG CÁO",
    "TRUYỀN THÔNG",
    "GIÁO DỤC",
    "Y TẾ",
    "NÔNG NGHIỆP",
    "THỰC PHẨM",
    "XUẤT NHẬP KHẨU",
    "XNK",
    "-",
  ];

  // Remove prefixes one by one
  prefixes.forEach((prefix) => {
    const regex = new RegExp(`(^|\\s)${prefix}(\\s|$)`, "gi");
    res = res.replace(regex, " ");
  });

  // Clean up extra spaces and capitalize properly
  res = res.trim().replace(/\s+/g, " ");
  
  // Title case the result
  return res.split(" ")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}
