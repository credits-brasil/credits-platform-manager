/**
 * Protocol with credits-platform's consultation viewer (`/visualizar-consulta`), which renders a
 * stored order with the same result page operators see. It runs inside an iframe in
 * `ConsultationReportDialog`. Mirrors credits-platform's `src/lib/consultationViewer.ts`:
 * change both together.
 *
 * 1. viewer → manager  `credits:viewer-ready`          the viewer is listening
 * 2. manager → viewer  `credits:consultation-snapshot` the order to render (payload below)
 * 3. viewer → manager  `credits:viewer-rendered`       the report is on screen
 *    viewer → manager  `credits:viewer-error`          the payload could not be rendered
 *
 * The client app only accepts messages from origins listed in its `VITE_MANAGER_ORIGINS`.
 */
export const VIEWER_MESSAGE = {
  ready: "credits:viewer-ready",
  snapshot: "credits:consultation-snapshot",
  rendered: "credits:viewer-rendered",
  error: "credits:viewer-error",
} as const;

const CONSULTATION_VIEWER_PATH = "/visualizar-consulta";

/** Base URL of the credits-platform client app, e.g. `https://app.example.com`. */
const CLIENT_APP_URL = String(import.meta.env.VITE_CLIENT_APP_URL ?? "").trim().replace(/\/+$/, "");

export interface ConsultationViewerPayload {
  productName: string;
  document: string;
  typeDocument: "CPF" | "CNPJ";
  insumos: string[];
  consultedAt: string;
  result: unknown;
  /** Checked by the viewer when `result` holds no report data. */
  json?: unknown;
}

/** The order fields the report needs (a subset of the Orders page `Order`). */
export interface ReportOrder {
  status: "PROCESS" | "SUCCESS" | "FAILED";
  product_name: string;
  document: string;
  typeDocument: "CPF" | "CNPJ";
  createdAt: string;
  inputCodes?: string[];
  inputDetails?: Array<{ code: string }>;
  result?: unknown | null;
  json?: unknown | null;
}

/**
 * Successful orders with stored data. The viewer decides whether that data is a report
 * and shows an error with the received format when it isn't.
 */
export function hasReportData(order: ReportOrder): boolean {
  return order.status === "SUCCESS" && (order.result != null || order.json != null);
}

export function buildViewerPayload(order: ReportOrder): ConsultationViewerPayload {
  const insumos = order.inputDetails?.length
    ? order.inputDetails.map((detail) => String(detail.code))
    : (order.inputCodes ?? []).map(String);

  return {
    productName: order.product_name,
    document: order.document,
    typeDocument: order.typeDocument,
    insumos,
    consultedAt: order.createdAt,
    result: order.result,
    json: order.json,
  };
}

/** Viewer URL and the origin its messages must come from; null when the env var is missing or invalid. */
export function getViewerLocation(): { url: string; origin: string } | null {
  if (!CLIENT_APP_URL) return null;
  try {
    const url = `${CLIENT_APP_URL}${CONSULTATION_VIEWER_PATH}`;
    return { url, origin: new URL(url).origin };
  } catch {
    return null;
  }
}
