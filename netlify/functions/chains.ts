import type { Context, Config } from "@netlify/functions"
import { supportedChains } from "./api";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default async (_req: Request, _context: Context) => {
    return new Response(JSON.stringify(supportedChains))
}

export const config: Config = {
    path: "/chains"
};