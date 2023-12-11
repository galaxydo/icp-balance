import cors from 'https://deno.land/x/edge_cors/src/cors.ts'

const ROSETTA_URL = 'https://rosetta-api.internetcomputer.org';
const NET_ID = {
  blockchain: 'Internet Computer',
  network: '00000000000000020101',
};

async function rosettaPost(endpoint: string, body: any) {
  const response = await fetch(`${ROSETTA_URL}${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Error: ${response.status} ${error.message}`);
  }

  return await response.json();
}

async function getICPBalance(accountId: string) {
  const body = {
    network_identifier: NET_ID,
    account_identifier: {
      address: accountId,
    },
  };

  try {
    const { balances } = await rosettaPost('/account/balance', body);
    const [{ value, currency }] = balances;
    return {
      value,
      decimals: currency.decimals,
      currency: currency.symbol,
    };
  } catch (error) {
    console.error('Failed to get ICP balance:', error);
    return { value: '0', decimals: 0, currency: 'ICP' };
  }
}

Deno.serve( async (req: Request) => {
    const params = new URL(req.url).searchParams;
    const accountId = params.get('accountId');

    if (!accountId) throw 'should provide ?accountId='

    const it = await getICPBalance(accountId);
    const xit = BigInt(it.value);

    const [ixit, uxit] = [
      xit / BigInt(it.decimals * 10**8),
      xit.toString().padStart(8, '0')
    ];

    const zit = `${ixit}.${uxit} ${it.currency}`;

    return cors(
        req,
        new Response(zit)
    );
});
