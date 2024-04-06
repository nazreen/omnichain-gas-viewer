import type { Context, Config } from "@netlify/functions"
import { Network, Alchemy } from "alchemy-sdk";

interface CacheBalanceEntry {
    timestamp: number;
    balance: string;
}

interface Cache {
    [address: string]: {
        [network: string]: CacheBalanceEntry
    }
}

const cache: Cache = {};

function readFromCache(address: string, network: string): CacheBalanceEntry | undefined {
    return cache[address]?.[network];
}

function writeToCache(address: string, network: string, balance: string) {
    if (!cache[address]) {
        cache[address] = {};
    }
    cache[address][network] = {
        timestamp: Date.now(),
        balance
    };
}

async function getBalanceWithCache(address: string, network: string): Promise<string> {
    const now = Date.now();
    const oneMinute = 60000; // 60,000 milliseconds
    const cacheEntry = readFromCache(address, network);
    const cacheValid = cacheEntry && (now - cacheEntry.timestamp < oneMinute && cache.data);
    // Check if the cache is valid
    if (cacheValid) {
        console.log("Using cached data");
        return cacheEntry.balance; // Return cached data if it's less than a minute old
    } else {
        console.log("Fetching new data");
        // Fetch new data
        const balance = await getBalance(address, network);

        if (!balance) {
            throw new Error("Failed to fetch balance");
        }

        writeToCache(address, network, balance);

        return balance;
    }
}



type AlchemyClients = {
    [network in Network]: Alchemy;
};

const API_KEY = process.env.API_KEY;

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


const address = "0x3a92924f2c8aAA64E7AEF846f73C0463A2f54173";

async function getBalance(address: string, network: string): Promise<string | undefined> {
    const client = alchemyClients[network];
    if (!client) return;
    const rawBalance = await client.core.getBalance(address); // Assuming getBalance returns a Promise
    const formattedBalance = rawBalance.toString(); // Assuming formatEther takes the balance and formats it
    return formattedBalance
}

async function getBalances(): Promise<Balances> {
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
            console.error(`Failed to get balance for network ${network}:`, error);
            return { network, balance: 'Error fetching balance' }; // Placeholder for error
        }
    });

    // Wait for all promises to resolve
    const results = await Promise.all(balancePromises);

    // Convert array of results back into an object
    const balances: Balances = results.reduce((acc, { network, balance }) => {
        acc[network] = balance;
        return acc;
    }, {});

    return balances;
}

export default async (req: Request, context: Context) => {
    const balances = await getBalances(); // Use the caching version
    return new Response(JSON.stringify(balances));
}

export const config: Config = {
    path: "/api"
};