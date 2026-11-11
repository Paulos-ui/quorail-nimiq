type BalanceReader = {
  isConsensusEstablished(): Promise<boolean>;
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
export async function readWalletBalance(
  provider: BalanceReader,
  address: string,
): Promise<number> {
  const synced = await readTimeout(
    provider.isConsensusEstablished(),
    "Wallet network check",
  );
  if (synced !== true)
    throw new Error(
      "Nimiq Pay is not connected to the network. If the wallet says Server not available, reconnect there first, then refresh here. Your balance is unavailable, not zero.",
    );
  const value = await readTimeout(
    provider.getBalance(address),
    "Wallet balance lookup",
  );
  if (!Number.isSafeInteger(value) || value < 0)
    throw new Error(
      "Nimiq Pay returned an invalid balance. Update the wallet and try Refresh.",
    );
  return value;
}
