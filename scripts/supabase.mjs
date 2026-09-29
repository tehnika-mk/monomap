import { spawn } from 'node:child_process';
import { readFileSync } from 'node:fs';

// The hosted project ref lives in `.env` (gitignored) or the environment,
// never in package.json, so the public repo does not leak the project URL.
const SUPABASE_VERSION = '2.117.0';

function loadProjectRef() {
	if (process.env.SUPABASE_PROJECT_REF) return process.env.SUPABASE_PROJECT_REF.trim();

	try {
		const env = readFileSync(new URL('../.env', import.meta.url), 'utf8');
		const match = env.match(/^\s*SUPABASE_PROJECT_REF\s*=\s*(.+?)\s*$/m);
		if (match) return match[1].replace(/^["']|["']$/g, '');
	} catch {
		// No .env — fall through to the error below.
	}

	return '';
}

const projectRef = loadProjectRef();
if (!projectRef) {
	console.error(
		'Supabase project ref is not set.\n' +
			'Add SUPABASE_PROJECT_REF=<your-project-ref> to .env (or export it), then retry.'
	);
	process.exit(1);
}

const args = [
	'--yes',
	`supabase@${SUPABASE_VERSION}`,
	...process.argv.slice(2),
	'--project-ref',
	projectRef
];

const child = spawn('npx', args, { stdio: 'inherit', shell: true });
child.on('exit', (code) => process.exit(code ?? 1));
