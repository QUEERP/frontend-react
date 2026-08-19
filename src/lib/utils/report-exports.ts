import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface ExportColumnConfig {
  header: string;
  key: string;
}

export interface ExportTabConfig {
  title: string;
  fileName: string;
  columns: ExportColumnConfig[];
  dataMapper: (data: any) => any[];
}

export function exportReportToExcel(tabConfig: ExportTabConfig, data: any) {
  const rawData = tabConfig.dataMapper(data);
  if (!rawData || rawData.length === 0) return;

  const exportData = rawData.map(item => {
    const row: any = {};
    tabConfig.columns.forEach(col => {
      row[col.header] = item[col.key];
    });
    return row;
  });

  const worksheet = XLSX.utils.json_to_sheet(exportData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Report");
  XLSX.writeFile(workbook, tabConfig.fileName);
}

export function exportReportToPDF(tabConfig: ExportTabConfig, data: any) {
  const rawData = tabConfig.dataMapper(data);
  if (!rawData || rawData.length === 0) return;

  const doc = new jsPDF();
  const head = [tabConfig.columns.map(c => c.header)];
  const body = rawData.map(item => tabConfig.columns.map(c => String(item[c.key] || '')));

  doc.text(tabConfig.title, 14, 15);
  autoTable(doc, {
    head: head,
    body: body,
    startY: 20
  });
  doc.save(`${tabConfig.title.replace(/ /g, '_')}.pdf`);
}

export function exportAllReportToExcel(configs: ExportTabConfig[], data: any, fileName: string) {
  const workbook = XLSX.utils.book_new();
  let hasData = false;
  
  configs.forEach(tabConfig => {
    const rawData = tabConfig.dataMapper(data);
    if (!rawData || rawData.length === 0) return;

    hasData = true;
    const exportData = rawData.map(item => {
      const row: any = {};
      tabConfig.columns.forEach(col => {
        row[col.header] = item[col.key];
      });
      return row;
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    let sheetName = tabConfig.title.substring(0, 31);
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  });

  if (hasData) {
    XLSX.writeFile(workbook, fileName);
  }
}

export function exportAllReportToPDF(configs: ExportTabConfig[], data: any, fileName: string) {
  const doc = new jsPDF();
  let isFirstPage = true;
  let hasData = false;

  configs.forEach(tabConfig => {
    const rawData = tabConfig.dataMapper(data);
    if (!rawData || rawData.length === 0) return;

    hasData = true;
    if (!isFirstPage) {
      doc.addPage();
    }
    isFirstPage = false;

    const head = [tabConfig.columns.map(c => c.header)];
    const body = rawData.map(item => tabConfig.columns.map(c => String(item[c.key] || '')));

    doc.text(tabConfig.title, 14, 15);
    autoTable(doc, {
      head: head,
      body: body,
      startY: 20
    });
  });

  if (hasData) {
    doc.save(fileName);
  }
}
