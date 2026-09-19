import { differenceInCalendarDays, format, parseISO, startOfWeek } from 'date-fns';

// v1 bug #1: 2-digit years always became 20YY (1/1/49 -> 2049, not 1949).
// Fix: a fixed pivot at 50, NOT relative to "today" — a pivot tied to the
// current year would make the exact same CSV import resolve to a different
// date depending on when you happened to run the import, which is bad for a
// tool meant to accumulate years of historical statements.
export function resolveTwoDigitYear(yy: number, pivot = 50): number {
	return yy < pivot ? 2000 + yy : 1900 + yy;
}

function pad2(n: number): string {
	return String(n).padStart(2, '0');
}

// v1 bug #2: the loose Date.parse fallback converted through
// Date.toISOString(), which can shift a local calendar date by a day near
// midnight in negative-UTC-offset timezones (true for any US timezone).
// Fix: read the parsed date's local getters directly instead of
// round-tripping through UTC.
export function parseImportDate(raw: string | null | undefined): string | null {
	if (!raw) return null;
	const s = String(raw).trim();
	if (!s) return null;

	// MM/DD/YYYY or M/D/YY, anchored at start; trailing text is ignored.
	const slash = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);
	if (slash) {
		const [, moStr, daStr, yrStr] = slash;
		const year = yrStr.length === 2 ? resolveTwoDigitYear(Number(yrStr)) : Number(yrStr);
		const month = Number(moStr);
		const day = Number(daStr);
		const iso = `${year}-${pad2(month)}-${pad2(day)}`;
		const check = new Date(year, month - 1, day);
		if (!isNaN(check.getTime())) return iso;
	}

	// YYYY-MM-DD, anchored at start.
	const dashed = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
	if (dashed) {
		const [, yr, mo, da] = dashed;
		return `${yr}-${pad2(Number(mo))}-${pad2(Number(da))}`;
	}

	// Loose fallback — local calendar getters, never toISOString().
	const parsed = new Date(s);
	if (!isNaN(parsed.getTime())) {
		return `${parsed.getFullYear()}-${pad2(parsed.getMonth() + 1)}-${pad2(parsed.getDate())}`;
	}

	return null;
}

// Both operate on YYYY-MM-DD date-only strings via date-fns, so calendar
// math never depends on the local/UTC subtlety of native Date parsing.
export function diffCalendarDays(a: string, b: string): number {
	return differenceInCalendarDays(parseISO(a), parseISO(b));
}

export function mondayOf(dateStr: string): string {
	return format(startOfWeek(parseISO(dateStr), { weekStartsOn: 1 }), 'yyyy-MM-dd');
}

export function yearOf(dateStr: string): string {
	return dateStr.slice(0, 4);
}
