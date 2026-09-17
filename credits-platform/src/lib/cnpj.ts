import { useQuery } from "@tanstack/react-query";
import axios from "axios";

export interface CnpjPropsType {
  taxId: string;
  company: {
    name: string;
    members: { person: { name: string } }[];
  };
  phones: { area: string; number: string }[];
  emails: { address: string }[];
  address: {
    city: string;
    country: { id: number; name: string };
    details: string;
    district: string;
    number: string;
    state: string;
    street: string;
    zip: string;
  };
}

export const useCNPJServices = (cnpj: string) => ({
  search: useQuery<CnpjPropsType | null>({
    queryKey: ["search-cnpj", cnpj],
    queryFn: async () => {
      if (cnpj.length !== 14) {
        return null;
      }

      const { data } = await axios.get<CnpjPropsType>(
        `https://open.cnpja.com/office/${cnpj}`,
      );

      return data;
    },
    enabled: !!cnpj && cnpj.length === 14,
  }),
});
