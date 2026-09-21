// Reads the kit's CSS custom properties at runtime so Chart.js configs stay
// in sync with light/dark mode and the manual theme toggle without a second
// source of truth. Call from browser-side chart-mounting code only.
export function readToken(name: string): string {
	if (typeof window === 'undefined') return '';
	return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

export interface ChartTheme {
	text: string;
	textMuted: string;
	border: string;
	dataPrimary: string; // pink — the primary series, per RULES.md "Data on screen"
	dataSecondary: string; // green-5 — a distinct hue; pair with a 6/6 dash pattern
	danger: string;
	success: string;
	fontMono: string;
}

export function readChartTheme(): ChartTheme {
	return {
		text: readToken('--color-text'),
		textMuted: readToken('--color-text-muted'),
		border: readToken('--color-border'),
		dataPrimary: readToken('--color-data-primary'),
		dataSecondary: readToken('--color-data-secondary'),
		danger: readToken('--color-danger'),
		success: readToken('--color-success'),
		fontMono: readToken('--font-mono')
	};
}

// A wide distinct-hue rotation for category bars/swatches — 12 of the kit's
// 14 hue families, mostly at step 5-6 for legibility. Deliberately excludes
// two: --blue-* (per RULES.md, a desaturated teal-gray "not meant to carry
// meaning," not a real hue to assign) and --red-*, which would collide with
// --color-danger's meaning elsewhere in this app (budget overspend) if a
// category happened to land on it. Purple uses step 5 rather than the pale
// 0-2 steps RULES.md flags as reading pink; every other step is the "most
// visibly [hue]" pick noted in RULES.md "Data on screen"/tint-budget notes
// where one exists (e.g. green-5 over green-6, which reads brown).
export function categoryPalette(): string[] {
	return [
		readToken('--pink-5'),
		readToken('--orange-5'),
		readToken('--goldenrod-5'),
		readToken('--yellow-6'),
		readToken('--green-5'),
		readToken('--cornflower-5'),
		readToken('--purple-5'),
		readToken('--brown-5'),
		readToken('--purple-gray-5'),
		readToken('--dark-gray-5'),
		readToken('--light-gray-6'),
		readToken('--gray-5')
	];
}

// A STABLE name -> color mapping, so the same value always gets the same
// color everywhere it's shown. Assigned by alphabetical position over the
// full known list, not by rank within one chart's current period — rank-
// based assignment (as the category chart used before) reassigns colors
// every time the top-8 ranking shifts, which defeats the point of a legend
// a reader can learn once. Generic over any string list — used for both
// categories (chart bars, transaction-table swatches) and accounts
// (transaction-table swatches), each building its own independent map so a
// category's color never collides with an account's.
export function stableColorMap(items: string[]): Record<string, string> {
	const palette = categoryPalette();
	const sorted = [...new Set(items)].sort();
	const map: Record<string, string> = {};
	sorted.forEach((item, i) => {
		map[item] = palette[i % palette.length];
	});
	return map;
}
