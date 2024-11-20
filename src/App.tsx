import { useState, useMemo, useEffect } from 'react'
import { formatEther } from 'viem'
import axios from 'axios';

enum COMPONENT_STATES {
  INITIAL,
  LOADING,
  LOADED
}

interface Balances {
  [network: string]: {
    balance: string;
    error?: boolean;
  };
}

type SupportedChains = string[]


function App() {
  const [balances, setBalances] = useState<Balances | undefined>(undefined);
  const [address, setAddress] = useState<string>('');
  const [supportedChains, setSupportedChains] = useState<SupportedChains>([]);
  const [componentState, setComponentState] = useState<COMPONENT_STATES>(COMPONENT_STATES.INITIAL);

  useEffect(() => {
    axios.get('/chains').then((res) => setSupportedChains(res.data));
  }, []);

  useEffect(() => {
    const savedAddress = localStorage.getItem('address');
    if (savedAddress) {
      setAddress(savedAddress);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('address', address);
  }, [address]);

  async function getBalances(address: string): Promise<void> {
    setComponentState(COMPONENT_STATES.LOADING);
    const res = await axios.get(`api/${address}`);
    setBalances(res.data);
    setComponentState(COMPONENT_STATES.LOADED);
  }

  const parsedBalances = useMemo<Balances | undefined>(() => {
    if (!balances) return;
    const parsedBalances: Balances = {};

    Object.keys(balances).forEach((key) => {
      parsedBalances[key] = { ...balances[key], balance: formatEther(BigInt(balances[key].balance)) };
    });
    return parsedBalances;
  },
    [balances]);


  return (
    <div className='flex flex-col items-center p-10'>
      <h1 className="text-3xl font-bold underline mb-6">Omnichain Testnet Gas Viewer</h1>
      <section>
        <p className='mb-6'>Enter an address below to see its balances across multiple testnets.</p>
        {/* <label htmlFor="address">Address: </label> */}
        <div className='flex'>

          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Enter address"
            className='border border-black p-2 m-2 mb-6 w-[500px]'
            maxLength={42}
            onKeyDown={(e) => e.key === 'Enter' && getBalances(address)}
          />
          <button className='border border-black p-2 m-2 h-10 w-[150px]' onClick={() => getBalances(address)}>Get Balances</button>
        </div>
      </section>
      <div className='text-center my-4'>
        <h3 className='text-xl font-semibold'>You can view balances on the following testnets:</h3>
        <div className='flex flex-wrap justify-center mt-2'>
          {supportedChains.map((chain) => (
            <span key={chain} className='bg-blue-200 text-blue-800 text-sm font-semibold mr-2 mb-2 px-3 py-1 rounded-full'>
              {chain}
            </span>
          ))}
        </div>
      </div>
      <section className='my-6'>
        <div hidden={componentState != COMPONENT_STATES.LOADING}>
          Loading...
        </div>
        <div hidden={[COMPONENT_STATES.INITIAL, COMPONENT_STATES.LOADING].includes(componentState)}>
          <h2 className='text-2xl font-bold text-center'>Balances</h2>
          <div className='overflow-x-auto'>
            <table className='min-w-full border-collapse border border-gray-300'>
              <thead>
                <tr>
                  <th className='border border-gray-300 p-2'>Network</th>
                  <th className='border border-gray-300 p-2'>Balance</th>
                </tr>
              </thead>
              <tbody>
                {parsedBalances && Object.keys(parsedBalances).map((key) => (
                  <tr key={key}>
                    <td className='border border-gray-300 p-2'>{key}</td>
                    <td className='border border-gray-300 p-2'>{parsedBalances[key].balance}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
      <section className='text-center'>
        <p>Created by <a href="https://twitter.com/0xNazreen">@0xNazreen</a></p>
        <p>Want to see more chains supported ? <a href="https://twitter.com/0xNazreen"> Reach out via Twitter</a></p>
      </section>
    </div>
  )
}

export default App
