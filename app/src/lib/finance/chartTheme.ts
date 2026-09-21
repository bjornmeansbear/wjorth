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

// A small distinct-hue rotation for category bars, chosen from steps that
// hold up per RULES.md's tint-budget/distinctness notes (avoiding purple,
// which reads pink at pale steps, and blue, which is a desaturated teal-gray
// not meant to carry meaning).
export function categoryPalette(): string[] {
	return [
		readToken('--pink-5'),
		readToken('--goldenrod-5'),
		readToken('--green-5'),
		readToken('--cornflower-5'),
		readToken('--brown-5'),
		readToken('--purple-gray-5'),
		readToken('--dark-gray-5'),
		readToken('--light-gray-6'),
		readToken('--gray-5')
	];
}

// A STABLE category -> color mapping, so the same category always gets the
// same color everywhere (the category chart, the transaction table, ...).
// Assigned by alphabetical position over the full known category list, not
// by spend rank within one chart's current period — rank-based assignment
// (as the chart used before) reassigns colors every time the top-8 ranking
// shifts, which defeats the point of a legend a reader can learn once.
export function categoryColorMap(categories: string[]): Record<string, string> {
	const palette = categoryPalette();
	const sorted = [...new Set(categories)].sort();
	const map: Record<string, string> = {};
	sorted.forEach((cat, i) => {
		map[cat] = palette[i % palette.length];
	});
	return map;
}
