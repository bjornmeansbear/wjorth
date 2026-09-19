// Ported verbatim from v1. A rough merchant fingerprint used for both
// recurring-charge grouping and the category-learning loop.
export function normalizeMerchant(desc: string): string {
	return desc
		.toLowerCase()
		.replace(/[0-9]/g, '')
		.replace(/[^a-z\s]/g, '')
		.trim()
		.split(/\s+/)
		.filter(Boolean)
		.slice(0, 2)
		.join(' ');
}
