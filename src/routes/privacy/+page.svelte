<script lang="ts">
	import LegalPage from '$lib/components/LegalPage.svelte';
	import MarketingLayout from '$lib/components/marketing/MarketingLayout.svelte';
</script>

<svelte:head>
	<title>Privacy Policy — MonoMap</title>
	<meta name="description" content="MonoMap privacy policy. Your maps stay on your device; only anonymous analytics are collected." />
	<meta name="robots" content="index, follow" />
	<link rel="canonical" href="https://monomap.app/privacy" />
</svelte:head>

<MarketingLayout>
<LegalPage title="Privacy Policy" updated="August 2026">
	<p>
		This Privacy Policy explains what information MonoMap ("the app"), provided by Tehnika, collects
		and how it is used. It applies to the website monomap.app and the MonoMap application.
	</p>

	<h2>Your data stays on your device — unless you opt into cloud sync</h2>
	<p>
		MonoMap is a <strong>local-first</strong> application. Your mind maps, notes, settings and profile
		backups are stored <strong>in your own browser</strong> (IndexedDB and local storage). Free usage
		requires no account and nothing is sent to our servers.
	</p>
	<p>
		If you create an account and subscribe to <strong>MonoMap Pro</strong>, your maps and boards are synced
		to the cloud so you can access them across your devices. This requires us to store your account
		details and your map data on our cloud provider. You can cancel your subscription at any time; your
		local copy of your work always stays on your device.
	</p>

	<h2>Accounts and cloud data</h2>
	<p>
		When you sign up for an account, we store your email address and a secure password hash to identify
		you. With Pro, your maps and boards are stored in the cloud to enable cross-device sync, processed by
		our cloud provider under their privacy terms. Billing is handled by our payment provider (AgentaOS),
		which processes your payment details; we do not store your card number.
	</p>

	<h2>Analytics</h2>
	<p>
		We use <strong>Google Analytics</strong> to understand how the website and app are used and to improve
		them. Google Analytics collects aggregated, anonymized usage data such as page views, approximate
		location, device and browser information, and how long you spend on a page. This is processed by
		Google under <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">Google's
		Privacy Policy</a>.
	</p>
	<p>
		Google Analytics uses cookies (such as <code>_ga</code> and <code>_gid</code>) and similar
		technologies. You can opt out of Google Analytics for the web using the
		<a href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noopener noreferrer">Google Analytics
		Opt-out Browser Add-on</a>, or block analytics cookies through your browser settings.
	</p>

	<h2>What we do not collect</h2>
	<p>
		We do not collect your mind-map content unless you opt into Pro cloud sync, in which case that content
		is stored to provide the service. We do not read your notes for advertising. We do not sell your data
		to third parties. Free users provide no account and no personal data beyond anonymous analytics.
	</p>

	<h2>Cookies</h2>
	<p>
		The only cookies in use are those set by Google Analytics as described above. You can control cookies
		through your browser at any time.
	</p>

	<h2>Your rights</h2>
	<p>
		You can request access to or deletion of the personal data associated with your account at any time.
		Cancelling your Pro subscription stops cloud sync and your data remains available locally on your
		device. For anything related to your account, analytics data, or your privacy, contact us and we will
		help.
	</p>

	<h2>Changes to this policy</h2>
	<p>
		We may update this policy from time to time. Changes will be posted on this page with a new "Last
		updated" date.
	</p>

	<h2>Contact</h2>
	<p>
		MonoMap is a product by Tehnika. For any privacy questions, contact us at
		<a href="mailto:hello@tehnika.mk">hello@tehnika.mk</a> or visit
		<a href="https://www.tehnika.mk" target="_blank" rel="noopener noreferrer">tehnika.mk</a>.
	</p>
</LegalPage>
</MarketingLayout>
