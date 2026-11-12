type BalanceReader = {
  listAccounts(): Promise<string[]>;
  getBalance(address: string): Promise<number>;
};
// Timeouts are for read-only calls. Never wrap a payment submission with this helper.
export async function readTimeout<T>(
  operation: Promise<T>,
  label: string,
  ms = 12000,
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      operation,
      new Promise<never>((_, reject) => {
        timer = setTimeout(
          () =>
            reject(
              new Error(
                `${label} timed out. Check Nimiq Pay's connection, then try Refresh. No payment was sent by this check.`,
              ),
            ),
          ms,
        );
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}
// listAccounts exposes the stable wallet identity followed by its current HTLC.
// Never sum these addresses: incoming funds at the identity are pending top-ups.
export async function readWalletSnapshot(
  provider: BalanceReader,
  address: string,
) {
  const normalize = (v: string) => v.replace(/\s/g, "").toUpperCase();
  for (let attempt = 0; attempt < 3; attempt++) {
    const accounts = await readTimeout(
      provider.listAccounts(),
      "Wallet accounts",
    );
    if (!accounts[0] || normalize(accounts[0]) !== normalize(address))
      throw new Error(
        "The wallet account changed. Disconnect and reconnect before paying.",
      );
    const source = accounts[1];
    const value = source
      ? await readTimeout(
          provider.getBalance(source),
          "Wallet balance lookup",
          35000,
        )
      : 0;
    if (!Number.isSafeInteger(value) || value < 0)
      throw new Error(
        "Nimiq Pay returned an invalid balance. Update the wallet and try Refresh.",
      );
    const after = await readTimeout(provider.listAccounts(), "Wallet accounts");
    if (after[0] !== accounts[0] || after[1] !== source) continue;
    if (source && value === 0 && attempt < 2) {
      await new Promise((resolve) => setTimeout(resolve, 300));
      continue;
    }
    return {
      balance: value,
      source: source || accounts[0],
      wallet: accounts[0],
    };
  }
  throw new Error(
    "Nimiq Pay is replacing its payment account. Refresh in a moment. No payment was sent.",
  );
}
export async function readWalletBalance(
  provider: BalanceReader,
  address: string,
): Promise<number> {
  return (await readWalletSnapshot(provider, address)).balance;
}
