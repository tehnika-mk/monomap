const GRID_KEY = 'mindmap:grid';
const SNAP_KEY = 'mindmap:snap';

function initialPref(key: string, defaultValue: boolean): boolean {
	if (typeof localStorage !== 'undefined') {
		const stored = localStorage.getItem(key);
		if (stored !== null) return stored !== 'false';
	}
	return defaultValue;
}

class SettingsState {
	gridEnabled = $state(true);
	snapEnabled = $state(false);

	constructor() {
		this.gridEnabled = initialPref(GRID_KEY, true);
		this.snapEnabled = initialPref(SNAP_KEY, false);

		$effect.root(() => {
			$effect(() => {
				if (typeof localStorage === 'undefined') return;
				localStorage.setItem(GRID_KEY, String(this.gridEnabled));
			});
			$effect(() => {
				if (typeof localStorage === 'undefined') return;
				localStorage.setItem(SNAP_KEY, String(this.snapEnabled));
			});
		});
	}

	toggleGrid(): void {
		this.gridEnabled = !this.gridEnabled;
	}

	toggleSnap(): void {
		this.snapEnabled = !this.snapEnabled;
	}
}

export const settings = new SettingsState();
