<script lang="ts">
	// UI preference only — its own localStorage key, distinct from and never
	// touching the financial data in data/state.json.
	const STORAGE_KEY = 'wjorth-theme';

	let theme = $state<'light' | 'dark' | null>(null);

	function apply(t: 'light' | 'dark' | null) {
		theme = t;
		if (t) {
			document.documentElement.setAttribute('data-theme', t);
			localStorage.setItem(STORAGE_KEY, t);
		} else {
			document.documentElement.removeAttribute('data-theme');
			localStorage.removeItem(STORAGE_KEY);
		}
	}

	$effect(() => {
		try {
			const stored = localStorage.getItem(STORAGE_KEY);
			if (stored === 'light' || stored === 'dark') {
				theme = stored;
				document.documentElement.setAttribute('data-theme', stored);
			}
		} catch {
			// localStorage unavailable — fall back silently to OS preference.
		}
	});

	function cycle() {
		if (theme === null) apply('dark');
		else if (theme === 'dark') apply('light');
		else apply(null);
	}
</script>

<button type="button" class="btn" onclick={cycle} title="Cycle theme: system → dark → light">
	{theme === null ? 'Theme: system' : theme === 'dark' ? 'Theme: dark' : 'Theme: light'}
</button>
