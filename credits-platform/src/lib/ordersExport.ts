import type { Row, Worksheet } from "exceljs";

export type OrderExportInput = {
  code: string;
  label: string;
  typeDocument: string;
  active: boolean;
};

export type OrderExportRow = {
  /** Valores das colunas da tabela principal, na mesma ordem de `columns`. */
  cells: string[];
  /** Insumos consultados, listados logo abaixo da linha da consulta. */
  inputs: OrderExportInput[];
};

type ExportOrdersOptions = {
  sheetName: string;
  title: string;
  columns: string[];
  rows: OrderExportRow[];
  fileName: string;
};

const TITLE_FONT = { bold: true, size: 14 };
const HEADER_FONT = { bold: true, color: { argb: "FF334155" } };
const INPUT_HEADER_FONT = { bold: true, size: 9, color: { argb: "FF64748B" } };
const INPUT_FONT = { size: 9, color: { argb: "FF475569" } };
const BORDER = { style: "thin" as const, color: { argb: "FFE2E8F0" } };

const solidFill = (argb: string) => ({ type: "pattern" as const, pattern: "solid" as const, fgColor: { argb } });
const HEADER_FILL = solidFill("FFF1F5F9");
const INPUT_FILL = solidFill("FFF8FAFC");

/** Colunas das linhas de insumo; a 1ª coluna fica com o rótulo/recuo. */
const INPUT_HEADERS = ["Insumos", "Código", "Insumo", "Tipo", "Ativo"];

function styleRow(row: Row, columnCount: number, style: Partial<Pick<Row, "font" | "fill">>) {
  for (let col = 1; col <= columnCount; col++) {
    const cell = row.getCell(col);
    if (style.font) cell.font = style.font;
    if (style.fill) cell.fill = style.fill;
    cell.border = { top: BORDER, bottom: BORDER, left: BORDER, right: BORDER };
  }
}

function autoFitColumns(sheet: Worksheet, columnCount: number, skipRow: number) {
  for (let col = 1; col <= columnCount; col++) {
    let width = 10;
    sheet.getColumn(col).eachCell({ includeEmpty: false }, (cell, rowNumber) => {
      if (rowNumber === skipRow) return;
      width = Math.max(width, String(cell.value ?? "").length + 2);
    });
    sheet.getColumn(col).width = Math.min(width, 60);
  }
}

export async function exportOrdersToXlsx({ sheetName, title, columns, rows, fileName }: ExportOrdersOptions) {
  // Carregado sob demanda para não pesar no bundle inicial.
  const { default: ExcelJS } = await import("exceljs");
  const workbook = new ExcelJS.Workbook();
  workbook.created = new Date();
  const sheet = workbook.addWorksheet(sheetName, {
    // Botão de agrupar/desagrupar fica acima do grupo de insumos (na linha da consulta).
    properties: { outlineProperties: { summaryBelow: false, summaryRight: true } },
  });

  const titleRow = sheet.addRow([title]);
  titleRow.font = TITLE_FONT;

  const headerRow = sheet.addRow(columns);
  styleRow(headerRow, columns.length, { font: HEADER_FONT, fill: HEADER_FILL });
  const inputColumnCount = Math.max(columns.length, INPUT_HEADERS.length);

  for (const order of rows) {
    const orderRow = sheet.addRow(order.cells);
    styleRow(orderRow, columns.length, {});

    if (order.inputs.length === 0) continue;

    // Insumos agrupados (nível 1) para poderem ser recolhidos no Excel.
    const inputHeaderRow = sheet.addRow(INPUT_HEADERS);
    inputHeaderRow.outlineLevel = 1;
    styleRow(inputHeaderRow, inputColumnCount, { font: INPUT_HEADER_FONT, fill: INPUT_FILL });

    for (const input of order.inputs) {
      const inputRow = sheet.addRow([
        "↳",
        input.code,
        input.label,
        input.typeDocument,
        input.active ? "Ativo" : "Inativo",
      ]);
      inputRow.outlineLevel = 1;
      inputRow.getCell(1).alignment = { horizontal: "right" };
      styleRow(inputRow, inputColumnCount, { font: INPUT_FONT, fill: INPUT_FILL });
    }
  }

  autoFitColumns(sheet, inputColumnCount, titleRow.number);
  sheet.views = [{ state: "frozen", ySplit: headerRow.number }];

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
