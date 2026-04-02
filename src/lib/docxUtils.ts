
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import { saveAs } from "file-saver";

export async function generateDocx(templateFile: ArrayBuffer, data: any, fileName: string) {
  const zip = new PizZip(templateFile);
  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
  });

  try {
    doc.render(data);
  } catch (error: any) {
    console.error("Error rendering docx:", error);
    throw error;
  }

  const out = doc.getZip().generate({
    type: "blob",
    mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  });

  saveAs(out, fileName);
}
