
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import { saveAs } from "file-saver";
import { formatCurrency } from "./numberToWords";

// Custom parser to handle Word's hidden formatting tags
function customParser(tag: string) {
  return {
    get(scope: any) {
      if (tag === ".") {
        return scope;
      }
      return scope[tag];
    }
  };
}

const capitalizeFirstLetter = (string: string) => {
  if (!string) return '';
  return string.charAt(0).toUpperCase() + string.slice(1);
};

export function generateTableXml(data: any[], contractType: string = "HDTX") {
  if (!data || data.length === 0) return '';

  let headers: string[] = [];
  if (contractType === "HDNT") {
    headers = ['STT', 'Nội dung', 'ĐVT', 'Khối lượng', 'Đơn giá (VNĐ)', 'Thành tiền', 'VAT 8%', 'VAT 10%', 'Tổng cộng'];
  } else {
    headers = ['STT', 'Nội dung', 'ĐVT', 'Khối lượng', 'Đơn giá (VNĐ)', 'Thời gian thuê (Tháng)', 'Thành tiền', 'VAT 8%', 'Tổng cộng'];
  }
  
  let xml = `<w:tbl>
    <w:tblPr>
      <w:tblW w:w="5000" w:type="pct"/>
      <w:tblBorders>
        <w:top w:val="single" w:sz="4" w:space="0" w:color="000000"/>
        <w:left w:val="single" w:sz="4" w:space="0" w:color="000000"/>
        <w:bottom w:val="single" w:sz="4" w:space="0" w:color="000000"/>
        <w:right w:val="single" w:sz="4" w:space="0" w:color="000000"/>
        <w:insideH w:val="single" w:sz="4" w:space="0" w:color="000000"/>
        <w:insideV w:val="single" w:sz="4" w:space="0" w:color="000000"/>
      </w:tblBorders>
    </w:tblPr>`;

  // Header row
  xml += `<w:tr><w:trPr><w:tblHeader/></w:trPr>`;
  for (const header of headers) {
    xml += `<w:tc>
      <w:tcPr><w:tcW w:w="0" w:type="auto"/></w:tcPr>
      <w:p>
        <w:pPr><w:jc w:val="center"/></w:pPr>
        <w:r><w:rPr><w:b/></w:rPr><w:t>${header}</w:t></w:r>
      </w:p>
    </w:tc>`;
  }
  xml += `</w:tr>`;

  let sumThanhTien = 0;
  let sumVat8 = 0;
  let sumVat10 = 0;
  let sumTongCong = 0;

  // Data rows
  for (const row of data) {
    sumThanhTien += row.thanhTien || 0;
    sumVat8 += row.vat8 || 0;
    sumVat10 += row.vat10 || 0;
    sumTongCong += row.tongCong || 0;

    const cells: any[] = [
      { val: row.stt, align: 'center' },
      { val: capitalizeFirstLetter(row.noiDung), align: 'left' },
      { val: capitalizeFirstLetter(row.dvt), align: 'center' },
      { val: row.khoiLuong, align: 'center' },
      { val: formatCurrency(row.donGia), align: 'right' }
    ];

    if (contractType !== "HDNT") {
      cells.push({ val: row.thoiGianThue, align: 'center' });
    }

    cells.push({ val: formatCurrency(row.thanhTien), align: 'right' });
    cells.push({ val: row.vat8 ? formatCurrency(row.vat8) : '', align: 'right' });

    if (contractType === "HDNT") {
      cells.push({ val: row.vat10 ? formatCurrency(row.vat10) : '', align: 'right' });
    }

    cells.push({ val: formatCurrency(row.tongCong), align: 'right' });

    xml += `<w:tr>`;
    for (const cell of cells) {
      xml += `<w:tc>
        <w:tcPr><w:tcW w:w="0" w:type="auto"/></w:tcPr>
        <w:p>
          <w:pPr><w:jc w:val="${cell.align}"/></w:pPr>
          <w:r><w:t>${cell.val !== undefined && cell.val !== null ? cell.val : ''}</w:t></w:r>
        </w:p>
      </w:tc>`;
    }
    xml += `</w:tr>`;
  }

  // Total row
  const totalCells: any[] = [
    { val: '', align: 'center' },
    { val: 'Tổng cộng', align: 'center', bold: true },
    { val: '', align: 'center' },
    { val: '', align: 'center' },
    { val: '', align: 'right' }
  ];

  if (contractType !== "HDNT") {
    totalCells.push({ val: '', align: 'center' });
  }

  totalCells.push({ val: formatCurrency(sumThanhTien), align: 'right', bold: true });
  totalCells.push({ val: formatCurrency(sumVat8), align: 'right', bold: true });

  if (contractType === "HDNT") {
    totalCells.push({ val: formatCurrency(sumVat10), align: 'right', bold: true });
  }

  totalCells.push({ val: formatCurrency(sumTongCong), align: 'right', bold: true });

  xml += `<w:tr>`;
  for (const cell of totalCells) {
    xml += `<w:tc>
      <w:tcPr><w:tcW w:w="0" w:type="auto"/></w:tcPr>
      <w:p>
        <w:pPr><w:jc w:val="${cell.align}"/></w:pPr>
        <w:r>
          ${cell.bold ? '<w:rPr><w:b/></w:rPr>' : ''}
          <w:t>${cell.val}</w:t>
        </w:r>
      </w:p>
    </w:tc>`;
  }
  xml += `</w:tr>`;

  xml += `</w:tbl>`;
  return xml;
}

export async function generateDocx(templateFile: ArrayBuffer, data: any, fileName: string) {
  const zip = new PizZip(templateFile);
  
  // Pre-process the XML to remove Word's internal formatting tags that split placeholders
  const xmlFiles = Object.keys(zip.files).filter(name => name.endsWith('.xml'));
  xmlFiles.forEach(fileName => {
    let content = zip.files[fileName].asText();
    
    // Clean up placeholders
    content = content.replace(/\[([^\]]+)\]/g, (match, p1) => {
      return `[${p1.replace(/<[^>]+>/g, '')}]`;
    });

    // Handle raw XML injection for tables
    content = content.replace(/\[BANGGIATRITHUEXE\]/g, '[@BANGGIATRITHUEXE]');
    content = content.replace(/\[BANGGIATRIHOPDONG\]/g, '[@BANGGIATRIHOPDONG]');

    zip.file(fileName, content);
  });

  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
    parser: customParser,
    errorLogging: "json",
    delimiters: { start: '[', end: ']' },
  });

  try {
    doc.render(data);
  } catch (error: any) {
    console.error("Error rendering docx:", error);
    if (error.properties && error.properties.errors instanceof Array) {
      const errorMessages = error.properties.errors.map((e: any) => e.properties.explanation).join("\n");
      console.error("Docxtemplater specific errors:", errorMessages);
    }
    throw error;
  }

  const out = doc.getZip().generate({
    type: "blob",
    mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  });

  return out;
}
