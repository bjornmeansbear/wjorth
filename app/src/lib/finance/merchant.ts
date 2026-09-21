// Common bank/card-processor boilerplate that precedes the actual merchant
// name in many real statement exports — e.g. "PURCHASE AUTHORIZED ON 06/13
// SHAKE SHACK ...". Left in place, v1's original "first 2 words" fingerprint
// grabs the boilerplate itself ("purchase authorized") instead of the
// merchant, which collides across nearly every transaction in a ledger that
// uses this format — a real, confirmed bug, not a hypothetical edge case.
//
// Real exports pad these fields to a fixed width ("RECURRING PAYMENT
// <30 spaces> AUTHORIZED ON <3 spaces> 09/17 ..."), so every gap between
// boilerplate words must be \s+ (one or more), never a literal single
// space — a literal space here silently fails to match and reintroduces
// the same bug. Longest/most-specific patterns first so a more specific
// prefix isn't shadowed by a shorter, more general one (e.g. bare
// "purchase" must not eat the "purchase authorized on ..." case first).
const BOILERPLATE_PREFIXES = [
	/^recurring\s+payment\s+authorized\s+on\s+\d{1,2}\/\d{1,2}\s+/i,
	/^purchase\s+authorized\s+on\s+\d{1,2}\/\d{1,2}\s+/i,
	/^business\s+to\s+business\s+ach\s+/i,
	/^purchase\s+/i
];

// Payment-processor prefixes that precede the real merchant name on card
// transactions (Square, Toast, and similar POS aggregators) — e.g.
// "SQ *SHAKE SHACK", "TST* FADENSO", "FSP*UNION CR...". Same failure mode
// as the boilerplate above: the fingerprint grabs the processor tag, not
// the merchant, for every business that happens to use that processor.
const PROCESSOR_PREFIXES = [/^sq\s*\*\s*/i, /^tst\s*\*\s*/i, /^fsp\s*\*\s*/i];

function stripPrefixes(desc: string): string {
	let s = desc;
	for (const pattern of BOILERPLATE_PREFIXES) {
		if (pattern.test(s)) {
			s = s.replace(pattern, '');
			break;
		}
	}
	for (const pattern of PROCESSOR_PREFIXES) {
		if (pattern.test(s)) {
			s = s.replace(pattern, '');
			break;
		}
	}
	return s;
}

// A rough merchant fingerprint used for both recurring-charge grouping and
// the category-learning loop.
export function normalizeMerchant(desc: string): string {
	return stripPrefixes(desc)
		.toLowerCase()
		.replace(/[0-9]/g, '')
		.replace(/[^a-z\s]/g, '')
		.trim()
		.split(/\s+/)
		.filter(Boolean)
		.slice(0, 2)
		.join(' ');
}
