
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
