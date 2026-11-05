import type { Cell, Worksheet } from "exceljs";

export type OrderExportInput = {
  code: string;
  label: string;
  typeDocument: string;
  active: boolean;
};

export type OrderExportRow = {
  /** Valores das colunas da tabela principal, na mesma ordem de `columns`. */
  cells: string[];
  /** Identificação da consulta exibida na subtabela de insumos. */
  product: string;
  document: string;
  protocol: string;
  inputs: OrderExportInput[];
};

type ExportOrdersOptions = {
  sheetName: string;
  title: string;
  columns: string[];
  /** Cabeçalho da última coluna da tabela principal, que linka para os insumos. */
  inputsColumn: string;
  rows: OrderExportRow[];
  fileName: string;
};

const HEADER_FILL = "FFF1F5F9";
const TITLE_FONT = { bold: true, size: 14 };
const HEADER_FONT = { bold: true, color: { argb: "FF334155" } };
const LINK_FONT = { color: { argb: "FF2563EB" }, underline: true };
const BORDER = { style: "thin" as const, color: { argb: "FFE2E8F0" } };

const INPUT_COLUMNS = ["Consulta", "Produto", "Documento", "Protocolo", "Código", "Insumo", "Tipo", "Ativo"];

function styleHeaderRow(sheet: Worksheet, rowNumber: number, columnCount: number) {
  const row = sheet.getRow(rowNumber);
  for (let col = 1; col <= columnCount; col++) {
    const cell = row.getCell(col);
    cell.font = HEADER_FONT;
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: HEADER_FILL } };
    cell.border = { top: BORDER, bottom: BORDER, left: BORDER, right: BORDER };
  }
}

/**
 * Link interno via fórmula HYPERLINK: o `hyperlink` nativo do exceljs grava o
 * destino como relação externa, que o Excel não resolve para células da planilha.
 */
function setInternalLink(cell: Cell, sheetName: string, text: string, target: string) {
  const escape = (value: string) => value.replace(/"/g, '""');
  cell.value = {
    formula: `HYPERLINK("#'${escape(sheetName)}'!${target}","${escape(text)}")`,
    result: text,
  };
  cell.font = LINK_FONT;
}

export async function exportOrdersToXlsx({
  sheetName,
  title,
  columns,
  inputsColumn,
  rows,
  fileName,
}: ExportOrdersOptions) {
  // Carregado sob demanda para não pesar no bundle inicial.
  const { default: ExcelJS } = await import("exceljs");
  const workbook = new ExcelJS.Workbook();
  workbook.created = new Date();
  const sheet = workbook.addWorksheet(sheetName);

  const mainColumns = [...columns, inputsColumn];
  const inputsColumnIndex = mainColumns.length;

  // Layout: título, cabeçalho da tabela principal, linhas, 2 linhas em branco,
  // título da subtabela, cabeçalho da subtabela, linhas de insumos.
  const mainHeaderRow = 2;
  const firstMainRow = mainHeaderRow + 1;
  const inputsTitleRow = firstMainRow + rows.length + 2;
  const inputsHeaderRow = inputsTitleRow + 1;

  sheet.getCell(1, 1).value = title;
  sheet.getCell(1, 1).font = TITLE_FONT;

  sheet.getRow(mainHeaderRow).values = mainColumns;
  styleHeaderRow(sheet, mainHeaderRow, mainColumns.length);

  sheet.getCell(inputsTitleRow, 1).value = "Insumos consultados";
  sheet.getCell(inputsTitleRow, 1).font = TITLE_FONT;
  sheet.getRow(inputsHeaderRow).values = INPUT_COLUMNS;
  styleHeaderRow(sheet, inputsHeaderRow, INPUT_COLUMNS.length);

  let nextInputRow = inputsHeaderRow + 1;

  rows.forEach((row, index) => {
    const mainRowNumber = firstMainRow + index;
    sheet.getRow(mainRowNumber).values = row.cells;

    const linkCell = sheet.getCell(mainRowNumber, inputsColumnIndex);
    if (row.inputs.length === 0) {
      linkCell.value = "-";
      return;
    }

    setInternalLink(
      linkCell,
      sheetName,
      `Ver insumos (${row.inputs.length})`,
      `A${nextInputRow}`,
    );

    row.inputs.forEach((input) => {
      const inputRow = sheet.getRow(nextInputRow);
      inputRow.values = [
        "",
        row.product,
        row.document,
        row.protocol,
        input.code,
        input.label,
        input.typeDocument,
        input.active ? "Ativo" : "Inativo",
      ];
      setInternalLink(inputRow.getCell(1), sheetName, `Linha ${mainRowNumber}`, `A${mainRowNumber}`);
      nextInputRow++;
    });
  });

  // Largura das colunas baseada no maior conteúdo (limitada para não estourar).
  const widestColumn = Math.max(mainColumns.length, INPUT_COLUMNS.length);
  for (let col = 1; col <= widestColumn; col++) {
    let width = 10;
    sheet.getColumn(col).eachCell({ includeEmpty: false }, (cell, rowNumber) => {
      if (rowNumber === 1 || rowNumber === inputsTitleRow) return;
      const value = cell.value;
      const text =
        typeof value === "object" && value && "result" in value ? String(value.result) : String(value ?? "");
      width = Math.max(width, text.length + 2);
    });
    sheet.getColumn(col).width = Math.min(width, 60);
  }

  sheet.views = [{ state: "frozen", ySplit: mainHeaderRow }];

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
