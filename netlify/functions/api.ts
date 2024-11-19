import type { Context, Config } from "@netlify/functions"
import { Network, Alchemy } from "alchemy-sdk";

type AlchemyClients = {
    [network in Network]: Alchemy;
};

const API_KEY = process.env.API_KEY;
if (!API_KEY) throw new Error("Missing API key");

const alchemyClients: Partial<AlchemyClients> = {

    [Network.ETH_SEPOLIA]: new Alchemy({ apiKey: API_KEY, network: Network.ETH_SEPOLIA }),
    [Network.OPT_SEPOLIA]: new Alchemy({ apiKey: API_KEY, network: Network.OPT_SEPOLIA }),
    [Network.BASE_SEPOLIA]: new Alchemy({ apiKey: API_KEY, network: Network.BASE_SEPOLIA }),
    [Network.MATIC_MUMBAI]: new Alchemy({ apiKey: API_KEY, network: Network.MATIC_MUMBAI }),
} as const;

export const supportedChains = Object.keys(alchemyClients);

interface Balances {
    [network: string]: string;
}


async function getBalances(address: string): Promise<Balances> {
    const networks = Object.keys(alchemyClients) as Array<keyof typeof alchemyClients>;

    // Map each network to a promise that fetches the balance
    const balancePromises = networks.map(async (network) => {
        const client = alchemyClients[network];
        if (!client) {
            return { network, balance: 'Client not found' }; // Placeholder, adjust based on your error handling
        }
        try {
            const rawBalance = await client.core.getBalance(address);
            const formattedBalance = rawBalance.toString(); // Formatting balance
            return { network, balance: formattedBalance };
        } catch (error) {
            console.error(`Failed to get balance for network ${network}:`, error.message);
            return { network, error: true, balance: '0' }; // Placeholder for error
        }
    });

    // Wait for all promises to resolve
    const results = await Promise.all(balancePromises);

    // Convert array of results back into an object
    const balances: Balances = results.reduce((acc, { network, balance, error }) => {
        acc[network] = { balance, error };
        return acc;
    }, {});

    return balances;
}

export default async (req: Request, context: Context) => {
    const balances = await getBalances(context.params.address); // Use the caching version
    return new Response(JSON.stringify(balances));
}

export const config: Config = {
    path: "/api/:address"
};