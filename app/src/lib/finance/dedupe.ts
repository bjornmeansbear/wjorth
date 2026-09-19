// Ported verbatim from v1's hashStr — a DJB2-style hash, truncated to signed
// 32-bit, prefixed 'tx_'. Collisions are possible (accepted risk, not
// cryptographic) at personal-finance-scale data volumes.
export function hashId(account: string, date: string, description: string, amount: number, flow: string): string {
	const s = `${account}|${date}|${description}|${amount}|${flow}`;
	let h = 5381;
	for (let i = 0; i < s.length; i++) {
		h = (h << 5) + h + s.charCodeAt(i);
		h = h & h;
	}
	return 'tx_' + Math.abs(h).toString(36);
}
