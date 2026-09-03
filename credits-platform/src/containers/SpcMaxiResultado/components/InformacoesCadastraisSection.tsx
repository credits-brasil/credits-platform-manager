import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { CopyButton } from "@/components/ui/copy-button";
import { formatCNPJ } from "@/utils/formatCNPJ";
import { formatCPF } from "@/utils/formatCPF";
import { formatCEP } from "@/utils/formatCEP";
import { formatDate } from "@/utils/formatDate";
import { formatPhone } from "@/utils/formatPhone";

type InformacoesCadastraisSectionProps = {
  spcData: any;
  body: Array<{
    endereco?: string;
    email?: string;
    telefone?: string;
    celular?: string;
  }>;
};

export function InformacoesCadastraisSection({
  spcData,
  body,
}: InformacoesCadastraisSectionProps) {
  return (
    <div
      id="section-cadastrais"
      className="bg-white rounded-xl border border-gray-200 p-5 mb-4"
    >
      <h2 className="text-sm font-semibold text-gray-700 mb-2">
        Informações Cadastrais
      </h2>

      <Accordion type="multiple" className="w-full">
        <AccordionItem value="dados-pessoais" className="border-gray-100">
          <AccordionTrigger className="text-sm font-medium text-gray-700 hover:no-underline py-3">
            Dados Cadastral
          </AccordionTrigger>
          <AccordionContent>
            <div className="grid grid-cols-3 gap-x-8 gap-y-4 pt-1 pb-2">
              {[
                {
                  label: spcData?.consumidor?.cpf
                    ? "Nome completo"
                    : "Razão Social",
                  value: spcData?.consumidor?.cpf
                    ? spcData?.consumidor?.nome
                    : spcData?.consumidor?.["razao-social"],
                },
                {
                  label: spcData?.consumidor?.cpf ? "CPF" : "CNPJ",
                  value: spcData?.consumidor?.cpf
                    ? formatCPF(spcData?.consumidor?.cpf)
                    : formatCNPJ(spcData?.consumidor?.cnpj),
                },
                {
                  label: spcData?.consumidor?.cpf
                    ? "Data de nascimento"
                    : "Data de fundação",
                  value: spcData?.consumidor?.cpf
                    ? formatDate(spcData?.consumidor?.["data-nascimento"])
                    : formatDate(spcData?.consumidor?.["data-fundacao"]),
                },
                ...(spcData?.consumidor?.cpf
                  ? [
                      { label: "Sexo", value: spcData?.consumidor?.sexo },
                      {
                        label: "Nacionalidade",
                        value: !Boolean(
                          spcData?.consumidor?.["pessoa-estrangeira"],
                        )
                          ? "Estrangeira"
                          : "Brasileira",
                      },
                      {
                        label: "Nome da mãe",
                        value: spcData?.consumidor?.["nome-mae"] ?? "-",
                      },
                      {
                        label: "Nome do pai",
                        value: spcData?.consumidor?.["nome-pai"] ?? "-",
                      },
                      {
                        label: "RG",
                        value: spcData?.consumidor?.["numero-rg"]
                          ? `${spcData?.consumidor?.["numero-rg"]} SSP/SP`
                          : "-",
                      },
                    ]
                  : [
                      {
                        label: "Nome Comercial",
                        value: spcData?.consumidor?.["nome-comercial"] ?? "-",
                      },
                      {
                        label: "CNAE",
                        value:
                          spcData?.consumidor?.["atividade-economica-principal"]
                            ?.code ??
                          spcData?.["atividade-empresa"]?.[
                            "detalhe-atividade-empresa"
                          ]?.["ramo-atividade"]?.code,
                      },
                      {
                        label: "Descrição do CNAE",
                        value:
                          spcData?.consumidor?.["atividade-economica-principal"]
                            ?.description ??
                          spcData?.["atividade-empresa"]?.[
                            "detalhe-atividade-empresa"
                          ]?.["ramo-atividade"]?.description,
                      },
                      {
                        label: "Natureza Jurídica",
                        value: (() => {
                          const naturezaJuridica =
                            spcData?.consumidor?.["natureza-juridica"];
                          const descricao = naturezaJuridica?.description;
                          const code = naturezaJuridica?.code;

                          if (descricao && code)
                            return `${descricao} (${code})`;
                          return descricao ?? code ?? "-";
                        })(),
                      },
                    ]),
              ].map((f) => {
                const COPYABLE_FIELDS = new Set([
                  "Nome completo",
                  "Razão Social",
                  "Nome Comercial",
                  "CPF",
                  "CNPJ",
                  "CNAE",
                  "Descrição do CNAE",
                ]);
                return (
                  <div key={f.label}>
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-0.5">
                      {f.label}
                    </p>

                    <div className="flex items-center gap-2">
                      <p className="text-sm text-gray-800">{f.value || "–"}</p>

                      {COPYABLE_FIELDS.has(f.label) && f.value && (
                        <CopyButton
                          value={String(f.value)}
                          title={`Copiar ${f.label}`}
                          className="shrink-0 text-gray-400 transition-colors hover:cursor-pointer hover:text-[#243871]"
                        />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem
          value="contato-endereco"
          className="border-gray-100 last:border-b-0"
        >
          <AccordionTrigger className="text-sm font-medium text-gray-700 hover:no-underline py-3">
            Contato e Endereço
          </AccordionTrigger>

          <AccordionContent>
            <div className="grid grid-cols-3 gap-x-8 gap-y-4 pt-1 pb-2">
              {[
                {
                  label: "Telefone principal",
                  value: spcData?.consumidor?.cpf
                    ? formatPhone(spcData?.consumidor?.["telefone-celular"])
                    : formatPhone(spcData?.consumidor?.telefone),
                },
                ...(spcData?.consumidor?.cpf
                  ? [
                      {
                        label: "Telefone secundário",
                        value: formatPhone(
                          spcData?.consumidor?.["telefone-residencial"],
                        ),
                      },
                    ]
                  : []),
                { label: "E-mail", value: spcData?.consumidor?.email },
                {
                  label: "CEP",
                  value: formatCEP(spcData?.consumidor?.endereco?.cep),
                },
                {
                  label: "Logradouro",
                  value: `${spcData?.consumidor?.endereco?.logradouro}, ${spcData?.consumidor?.endereco?.numero} — ${spcData?.consumidor?.endereco?.complemento}`,
                },
                {
                  label: "Bairro",
                  value: spcData?.consumidor?.endereco?.bairro,
                },
                {
                  label: "Cidade",
                  value: spcData?.consumidor?.endereco?.cidade,
                },
                {
                  label: "Estado",
                  value: spcData?.consumidor?.endereco?.estado,
                },
                { label: "País", value: "Brasil" },
              ].map((f) => (
                <div key={f.label}>
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-0.5">
                    {f.label}
                  </p>

                  <div className="flex items-center gap-2">
                    <p className="text-sm text-gray-800">{f.value}</p>

                    {[
                      "Telefone principal",
                      "Telefone secundário",
                      "E-mail",
                      "CEP",
                      "Logradouro",
                    ].includes(f.label) &&
                      f.value && (
                        <CopyButton
                          value={String(f.value)}
                          title={`Copiar ${f.label}`}
                          className="text-gray-400 hover:text-[#243871] transition-colors hover:cursor-pointer"
                        />
                      )}
                  </div>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem
          value="dados-adicionais-contato-spc-brasil"
          className="border-gray-100 last:border-b-0"
        >
          <AccordionTrigger className="text-sm font-medium text-gray-700 hover:no-underline py-3">
            Dados Adicionais de Contato - SPC Brasil
          </AccordionTrigger>

          <AccordionContent>
            <div className="mt-5 border-t border-gray-100 pt-4">
              <table className="w-full text-xs table-fixed">
                <thead>
                  <tr className="border-b border-gray-100">
                    {["Endereço", "Email", "Tel. fixo", "Tel. Celular"].map(
                      (h) => (
                        <th
                          key={h}
                          className="text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wide pb-2 pr-4 last:pr-0"
                        >
                          {h}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>

                <tbody>
                  {body.map((row, index) => (
                    <tr
                      key={index}
                      className="border-b border-gray-50 transition-colors hover:bg-gray-50"
                    >
                      <td className="py-2.5 pr-4 text-sm text-gray-800 break-words">
                        {row.endereco}
                      </td>

                      <td className="py-2.5 pr-4 text-sm text-gray-800">
                        {row.email}
                      </td>

                      <td className="py-2.5 pr-4 text-sm text-gray-800 whitespace-nowrap">
                        {row.telefone}
                      </td>

                      <td className="py-2.5 pr-4 text-sm text-gray-800 whitespace-nowrap">
                        {row.celular}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </AccordionContent>
        </AccordionItem>

        {spcData?.consumidor?.cpf ? (
          <></>
        ) : (
          <>
            <AccordionItem
              value="atividades-economicas-secundarias-spc-brasil"
              className="border-gray-100"
            >
              <AccordionTrigger className="text-sm font-medium text-gray-700 hover:no-underline py-3">
                Atividades Econômicas Secundarias - SPC Brasil
              </AccordionTrigger>

              <AccordionContent>
                <div className="mt-5 border-t border-gray-100 pt-4">
                  <table className="w-full text-xs table-fixed">
                    <colgroup>
                      <col style={{ width: "100px" }}/>
                      <col style={{ width: "100%" }} />
                    </colgroup>

                    <thead>
                      <tr className="border-b border-gray-100">
                        {["CNAE", "DESCRIÇÃO CNAE"].map((h) => (
                          <th
                            key={h}
                            className="text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wide pb-2 pr-4 last:pr-0"
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>

                    <tbody>
                      {spcData?.["atividade-empresa"]?.[
                        "detalhe-atividade-empresa"
                      ]?.["atividades-economicas-secundarias"].map(
                        (row: any, index: number) => (
                          <tr
                            key={index}
                            className="border-b border-gray-50 transition-colors hover:bg-gray-50"
                          >
                            <td className="py-2.5 pr-4 text-sm text-gray-800 break-words">
                              {row.code}
                            </td>

                            <td className="py-2.5 pr-4 text-sm text-gray-800">
                              {row.description}
                            </td>
                          </tr>
                        ),
                      )}
                    </tbody>
                  </table>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem
              value="administrador-spc-brasil"
              className="border-gray-100 last:border-b-0"
            >
              <AccordionTrigger className="text-sm font-medium text-gray-700 hover:no-underline py-3">
                Administrador - SPC Brasil
              </AccordionTrigger>

              <AccordionContent>
                <div className="mt-5 border-t border-gray-100 pt-4">
                  <table className="w-full text-xs table-fixed">
                    <thead>
                      <tr className="border-b border-gray-100">
                        {[
                          "Nome",
                          "Documento",
                          "Cargo",
                          "Tipo Relacionamento",
                          "Data Entrada",
                        ].map((h) => (
                          <th
                            key={h}
                            className="text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wide pb-2 pr-4 last:pr-0"
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>

                    <tbody>
                      {(spcData?.administrador?.["detalhe-administrador"] ?? [])
                        .filter((row: any) => row)
                        .map((row: any, index: number) => {
                          const documento = String(row?.documento ?? "");
                          const documentoFormatado =
                            documento.length === 11
                              ? formatCPF(documento)
                              : documento || "-";

                          return (
                            <tr
                              key={index}
                              className="border-b border-gray-50 transition-colors hover:bg-gray-50"
                            >
                              <td className="py-2.5 pr-4 text-sm text-gray-800 break-words">
                                {row?.nome ?? "-"}
                              </td>

                              <td className="py-2.5 pr-4 text-sm text-gray-800 whitespace-nowrap">
                                {documentoFormatado}
                              </td>

                              <td className="py-2.5 pr-4 text-sm text-gray-800 whitespace-nowrap">
                                {row?.["cargo-administracao"] ?? "-"}
                              </td>

                              <td className="py-2.5 pr-4 text-sm text-gray-800 whitespace-nowrap">
                                {row?.["tipo-relacionamento"] ?? "-"}
                              </td>

                              <td className="py-2.5 pr-4 text-sm text-gray-800 whitespace-nowrap">
                                {formatDate(row?.["data-entrada"]) || "-"}
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </AccordionContent>
            </AccordionItem>
          </>
        )}
      </Accordion>
    </div>
  );
}
