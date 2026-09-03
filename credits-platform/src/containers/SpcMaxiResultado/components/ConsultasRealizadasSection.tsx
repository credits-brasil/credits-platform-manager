import type { Dispatch, SetStateAction } from "react";
import {
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatDate } from "@/utils/formatDate";

interface ConsultasRealizadasSectionProps {
  spcData: any;
  consultasExpanded: boolean;
  setConsultasExpanded: Dispatch<SetStateAction<boolean>>;
}

export function ConsultasRealizadasSection({
  spcData,
  consultasExpanded,
  setConsultasExpanded,
}: ConsultasRealizadasSectionProps) {
  const consultas =
    spcData?.["consulta-realizada"]?.["detalhe-consulta-realizada"] ?? [];

  const agora = new Date();

  const ultimos30 = consultas.filter((consulta: any) => {
    const data = new Date(consulta["data-consulta"]);
    return (
      (agora.getTime() - data.getTime()) / (1000 * 60 * 60 * 24) <= 30
    );
  }).length;

  const ultimos60 = consultas.filter((consulta: any) => {
    const data = new Date(consulta["data-consulta"]);
    return (
      (agora.getTime() - data.getTime()) / (1000 * 60 * 60 * 24) <= 60
    );
  }).length;

  const ultimos90 = consultas.filter((consulta: any) => {
    const data = new Date(consulta["data-consulta"]);
    return (
      (agora.getTime() - data.getTime()) / (1000 * 60 * 60 * 24) <= 90
    );
  }).length;

  const consultasMes = Object.values(
    consultas.reduce(
      (acc: Record<string, { mes: string; total: number }>, consulta: any) => {
        const data = new Date(consulta["data-consulta"]);

        const chave = `${String(data.getMonth() + 1).padStart(2, "0")}/${data.getFullYear()}`;

        if (!acc[chave]) {
          acc[chave] = {
            mes: chave,
            total: 0,
          };
        }

        acc[chave].total++;

        return acc;
      },
      {},
    ),
  ).sort((a, b) => {
    const [ma, aa] = a.mes.split("/");
    const [mb, ab] = b.mes.split("/");

    return (
      new Date(Number(aa), Number(ma) - 1).getTime() -
      new Date(Number(ab), Number(mb) - 1).getTime()
    );
  });

  const todasConsultas = consultas.map((consulta: any) => ({
    data: formatDate(consulta["data-consulta"]),
    associado: consulta["nome-associado"],
    entidade: consulta["nome-entidade-origem"],
    cidade: `${consulta["origem-associado"]}/${consulta["estado"]}`,
  }));

  const visibleConsultas = consultasExpanded
    ? todasConsultas
    : todasConsultas.slice(0, 5);

  return (
    <div
      id="section-consultas"
      className="mb-4 rounded-xl border border-gray-200 bg-white p-5"
    >
      <h2 className="mb-4 text-sm font-semibold text-gray-700">
        Consultas Realizadas
      </h2>

      <div className="mb-5 grid grid-cols-3 divide-x divide-gray-100 overflow-hidden rounded-xl border border-gray-100">
        {[
          { valor: ultimos30, label: "Últimos 30 dias" },
          { valor: ultimos60, label: "Últimos 60 dias" },
          { valor: ultimos90, label: "Últimos 90 dias" },
        ].map((k) => (
          <div key={k.label} className="flex flex-col items-center py-4">
            <span className="text-2xl font-bold text-gray-800">{k.valor}</span>
            <span className="mt-0.5 text-xs text-gray-400">{k.label}</span>
          </div>
        ))}
      </div>

      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-600">
        Evolução de Consultas por Mês
      </p>

      <ResponsiveContainer width="100%" height={180}>
        <ComposedChart
          data={consultasMes}
          margin={{ top: 4, right: 16, left: 0, bottom: 4 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#F3F4F6"
            vertical={false}
          />

          <XAxis
            dataKey="mes"
            tick={{ fontSize: 10, fill: "#9CA3AF" }}
            tickLine={false}
            axisLine={false}
          />

          <YAxis
            tick={{ fontSize: 10, fill: "#9CA3AF" }}
            tickLine={false}
            axisLine={false}
            width={28}
          />

          <Tooltip
            formatter={(v: number) => [v, "Consultas"]}
            labelStyle={{
              fontSize: 11,
              color: "#374151",
            }}
            contentStyle={{
              fontSize: 11,
              borderRadius: 8,
              border: "1px solid #E5E7EB",
            }}
          />

          <Line
            type="monotone"
            dataKey="total"
            stroke="#243871"
            strokeWidth={2}
            dot={{ r: 4, fill: "#243871", strokeWidth: 0 }}
            activeDot={{ r: 6 }}
          />
        </ComposedChart>
      </ResponsiveContainer>

      <div className="mt-5 border-t border-gray-100 pt-4">
        <table className="w-full table-fixed text-xs">
          <colgroup>
            <col style={{ width: "120px" }} />
            <col style={{ width: "100%" }} />
            <col style={{ width: "35%" }} />
            <col style={{ width: "35%" }} />
          </colgroup>

          <thead>
            <tr className="border-b border-gray-100">
              {[
                "Data",
                "Associado",
                "Nome da Entidade",
                "Cidade",
              ].map((h) => (
                <th
                  key={h}
                  className="pb-2 pr-4 text-left text-[10px] font-semibold uppercase tracking-wide text-gray-400 last:pr-0"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {visibleConsultas.map((r: any, i: number) => (
              <tr
                key={i}
                className="border-b border-gray-50 transition-colors hover:bg-gray-50"
              >
                <td className="whitespace-nowrap py-2.5 pr-4 text-gray-600">
                  {r.data}
                </td>

                <td className="whitespace-nowrap py-2.5 pr-4 font-medium text-gray-700">
                  {r.associado}
                </td>

                <td className="py-2.5 pr-4 text-gray-600">{r.entidade}</td>

                <td className="py-2.5 pr-4 text-gray-600">{r.cidade}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-3 flex justify-end">
          <button
            type="button"
            onClick={() => setConsultasExpanded((v) => !v)}
            className="flex items-center gap-1 text-xs font-medium transition-colors"
            style={{ color: "#243871" }}
          >
            {consultasExpanded ? "Recolher" : "Expandir"}

            <span className="text-[10px]">
              {consultasExpanded ? "▲" : "▼"}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
