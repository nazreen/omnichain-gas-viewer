import type { Context, Config } from "@netlify/functions"
import { supportedChains } from "./api";

export default async (req: Request, context: Context) => {
    return new Response(JSON.stringify(supportedChains))
}

export const config: Config = {
    path: "/chains"
};