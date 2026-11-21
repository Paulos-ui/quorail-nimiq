# Quorail V5 identity + AI upgrade

- `.nim` lookup uses Pigeon's public community registry via `/api/nim-name`, not an official Nimiq naming standard.
- Add commitments with a registered name or a valid NQ address. Name is resolved server-side and the NQ address is saved. The name is preserved as local display metadata in `note`.
- Immediately before wallet submission, Quorail rechecks that the name still maps to the saved recipient; failure or changes block payment. User must review the full address in Nimiq Pay.
- Name registration is **not** included. Users register through the Pigeon application. This integration supports mainnet names only. No keys are held by Quorail.
- Existing receipts and payment flows remain address-based. Quorail AI answers use the safer formatting improvements from the previous V5 foundation.
- External Pigeon API response availability cannot be guaranteed; lookups fail closed. Test with a known registered mainnet name in Nimiq Pay before production launch.
- Do not publish wallet recovery phrases, `.env` files or API secrets.
