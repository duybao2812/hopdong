
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import { saveAs } from "file-saver";

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

export function generateTableXml(data: any[]) {
  if (!data || data.length === 0) return '';

  const headers = ['STT', 'Nội dung', 'ĐVT', 'Khối lượng', 'Đơn giá', 'Thời gian thuê', 'Thành tiền', 'VAT (8%)', 'Tổng cộng'];
  
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
  xml += `<w:tr>`;
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

  // Data rows
  for (const row of data) {
    const cells = [
      row.stt,
      row.noiDung,
      row.dvt,
      row.khoiLuong,
      row.donGia,
      row.thoiGianThue,
      row.thanhTien,
      row.vat,
      row.tongCong
    ];
    xml += `<w:tr>`;
    for (const cell of cells) {
      xml += `<w:tc>
        <w:tcPr><w:tcW w:w="0" w:type="auto"/></w:tcPr>
        <w:p><w:r><w:t>${cell !== undefined && cell !== null ? cell : ''}</w:t></w:r></w:p>
      </w:tc>`;
    }
    xml += `</w:tr>`;
  }

  xml += `</w:tbl>`;
  return xml;
}

export async function generateDocx(templateFile: ArrayBuffer, data: any, fileName: string) {
  const zip = new PizZip(templateFile);
  
  // Pre-process the XML to remove Word's internal formatting tags that split placeholders
  // This is a more robust way to clean up Word's internal XML tags
  const xmlFiles = Object.keys(zip.files).filter(name => name.endsWith('.xml'));
  xmlFiles.forEach(fileName => {
    let content = zip.files[fileName].asText();
    
    // Clean up the content inside the [ ]
    // This handles cases where the text inside [ ] is split by XML tags
    content = content.replace(/\[([^\]]+)\]/g, (match, p1) => {
      return `[${p1.replace(/<[^>]+>/g, '')}]`;
    });

    // Change [BANGGIATRITHUEXE] to [@BANGGIATRITHUEXE] to allow raw XML injection
    content = content.replace(/\[BANGGIATRITHUEXE\]/g, '[@BANGGIATRITHUEXE]');

    zip.file(fileName, content);
  });

  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
    parser: customParser,
    // Add error handling to ignore duplicate tags caused by Word's internal formatting
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

  saveAs(out, fileName);
}
