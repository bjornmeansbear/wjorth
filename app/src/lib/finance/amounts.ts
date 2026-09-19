// Ported verbatim from v1.
export function parseAmount(raw: string | number | null | undefined): number {
	if (raw === null || raw === undefined) return 0;
	let s = String(raw).trim();
	if (s === '') return 0;
	let neg = false;
	if (s.charAt(0) === '(' && s.charAt(s.length - 1) === ')') {
		neg = true;
		s = s.slice(1, -1);
	}
	if (s.charAt(0) === '-') neg = true;
	s = s.replace(/[^0-9.]/g, '');
	const n = parseFloat(s);
	if (isNaN(n)) return 0;
	return neg ? -n : n;
}

export function fmtMoney(n: number): string {
	const neg = n < 0;
	const v = Math.abs(n);
	const s = '$' + v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
	return neg ? '-' + s : s;
}
