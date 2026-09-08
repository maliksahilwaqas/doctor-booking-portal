import type { SessionName } from "@/types/database.types";

export interface LocationVM {
  id: string;
  name: string;
  area: string;
  session: SessionName;
  days: number[];
  fromMin: number;
  toMin: number;
  slotMin: number;
  fee: number;
  followUpFee: number;
  detail: string;
}
