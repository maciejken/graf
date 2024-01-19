import { companiesPrefix } from "../../constants.ts";
import { Company } from "../../types.ts";
import { getDatabase } from "../dbService.ts";

const db = getDatabase();

export async function getCompanyById(id: string): Promise<Company | null> {
  return (await db.get<Company>([companiesPrefix, id])).value;
}
