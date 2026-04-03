import { generateDocx, generateTableXml } from "./docxUtils";
import { formatCurrency, numberToWords, getShortName } from "./numberToWords";
import { ContractRecord } from "../types";

export const generateContractFile = async (template: ArrayBuffer | null, record: ContractRecord) => {
  if (!template) {
    throw new Error("Vui lòng tải lên file mẫu trong phần Cài đặt trước khi tạo hợp đồng.");
  }

  const { formData, tableData, totalValue } = record;
  const [year, month, day] = formData.NGAY_KY.split("-");

  const toTitleCase = (str: string) => {
    if (!str) return "";
    return str.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const tableXml = formData.LOAI_HOPDONG !== "HDTC" 
    ? generateTableXml(tableData, formData.LOAI_HOPDONG)
    : "";

  const data = {
    ...formData,
    DAY_HOPDONG: day,
    MONTH_HOPDONG: month,
    YEAR_HOPDONG: year,
    BEN_A: formData.BEN_A.toUpperCase(),
    BEN_B: formData.BEN_B.toUpperCase(),
    DAIDIENBENA: toTitleCase(formData.DAIDIENBENA),
    DAIDIENBENB: toTitleCase(formData.DAIDIENBENB),
    BANGGIATRITHUEXE: tableXml,
    BANGGIATRIHOPDONG: tableXml,
    GIATRIHOPDONG: formatCurrency(totalValue),
    BANGCHUGIATRI: numberToWords(totalValue),
  };

  const now = new Date();
  const timeStr = `${now.getHours().toString().padStart(2, "0")}${now.getMinutes().toString().padStart(2, "0")}${now.getSeconds().toString().padStart(2, "0")}`;
  const shortA = getShortName(formData.BEN_A) || "BENA";
  const shortB = getShortName(formData.BEN_B) || "BENB";
  const dateStr = `${day}-${month}-${year}`;
  
  const safeContractNumber = (formData.SO_HOPDONG || "SO-HD").replace(/\//g, "-");
  const fileName = `${safeContractNumber}_${shortA}_${shortB}_${dateStr}_${timeStr}.docx`;

  const blob = await generateDocx(template, data, fileName);
  return { blob, fileName };
};
