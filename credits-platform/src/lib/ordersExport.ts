import type { Row, Worksheet } from "exceljs";

export type OrderExportInput = {
  code: string;
  label: string;
  typeDocument: string;
  active: boolean;
};

type ExportOrdersOptions = {
  sheetName: string;
  columns: string[];
  /** Linhas já achatadas: uma por produto e uma por insumo, todas com as mesmas colunas. */
  rows: string[][];
  fileName: string;
};

const HEADER_FONT = { bold: true, color: { argb: "FF334155" } };
const HEADER_FILL = { type: "pattern" as const, pattern: "solid" as const, fgColor: { argb: "FFF1F5F9" } };
const BORDER = { style: "thin" as const, color: { argb: "FFE2E8F0" } };

function styleRow(row: Row, columnCount: number, style: Partial<Pick<Row, "font" | "fill">>) {
  for (let col = 1; col <= columnCount; col++) {
    const cell = row.getCell(col);
    if (style.font) cell.font = style.font;
    if (style.fill) cell.fill = style.fill;
    cell.border = { top: BORDER, bottom: BORDER, left: BORDER, right: BORDER };
  }
}

function autoFitColumns(sheet: Worksheet, columnCount: number) {
  for (let col = 1; col <= columnCount; col++) {
    let width = 10;
    sheet.getColumn(col).eachCell({ includeEmpty: false }, (cell) => {
      width = Math.max(width, String(cell.value ?? "").length + 2);
    });
    sheet.getColumn(col).width = Math.min(width, 60);
  }
}

/**
 * Gera uma tabela plana (cabeçalho na linha 1, sem linhas mescladas ou agrupadas)
 * para que filtros, tabelas dinâmicas e fórmulas como CONT.SES funcionem direto.
 */
export async function exportOrdersToXlsx({ sheetName, columns, rows, fileName }: ExportOrdersOptions) {
  // Carregado sob demanda para não pesar no bundle inicial.
  const { default: ExcelJS } = await import("exceljs");
  const workbook = new ExcelJS.Workbook();
  workbook.created = new Date();
  const sheet = workbook.addWorksheet(sheetName);

  const headerRow = sheet.addRow(columns);
  styleRow(headerRow, columns.length, { font: HEADER_FONT, fill: HEADER_FILL });

  for (const cells of rows) {
    styleRow(sheet.addRow(cells), columns.length, {});
  }

  autoFitColumns(sheet, columns.length);
  sheet.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: columns.length } };
  sheet.views = [{ state: "frozen", ySplit: 1 }];

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
