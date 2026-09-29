import {
	supabase,
	supabaseConfigured,
	isPro,
	toAppUser,
	type AppUser,
	type PaidTier,
	type Profile
} from '$lib/supabase';
import { displayName as formatDisplayName, initials as formatInitials } from '$lib/utils/name';
import {
	EXISTING_ACCOUNT_MESSAGE,
	isAlreadyRegisteredError,
	isExistingAccount
} from '$lib/utils/auth';
import { toasts } from '$lib/stores/toasts.svelte';
import { clearLocalData } from '$lib/utils/reset';

export class AuthState {
	user = $state<AppUser | null>(null);
	profile = $state<Profile | null>(null);
	initialized = $state(false);
	recovery = $state(false);
	error = $state('');
	notice = $state('');
	pendingUpgrade = $state(false);
	pendingUpgradeTier = $state<PaidTier>('pro');

	get signedIn(): boolean {
		return this.user !== null;
	}

	get pro(): boolean {
		return isPro(this.profile);
	}

	// Friendly name for the sidebar and account window, with an email fallback.
	get displayName(): string {
		return formatDisplayName(this.user);
	}

	get initials(): string {
		return formatInitials(this.user);
	}

	async init(): Promise<void> {
		// Register the listener first so a PASSWORD_RECOVERY event triggered by
		// the recovery-link URL hash is not missed.
		supabase.auth.onAuthStateChange((event, session) => {
			if (event === 'PASSWORD_RECOVERY') {
				this.recovery = true;
			}
			if (session?.user) {
				this.user = toAppUser(session.user);
				void this.refreshProfile();
			} else {
				this.user = null;
				this.profile = null;
			}
		});

		const { data } = await supabase.auth.getSession();
		if (data.session?.user) {
			this.user = toAppUser(data.session.user);
			await this.refreshProfile();
		}
		this.initialized = true;
	}

	async refreshProfile(): Promise<void> {
		if (!this.user) return;
		try {
			const { data, error } = await supabase
				.from('profiles')
				.select('*')
				.eq('user_id', this.user.id)
				.single();
			if (!error && data) {
				this.profile = data as Profile;
			} else if (!error) {
				// Profile row missing (should be auto-created); synthesize a free one.
				this.profile = {
					user_id: this.user.id,
					email: this.user.email,
					first_name: this.user.firstName,
					last_name: this.user.lastName,
					country: this.user.country,
					plan: 'free',
					agentaos_subscription_id: null,
					current_period_end: null,
					cancel_at_period_end: false,
					updated_at: new Date().toISOString()
				};
			}
		} catch {
			// Offline or transient; keep whatever we have.
		}
	}

	async signUp(input: {
		email: string;
		password: string;
		firstName: string;
		lastName: string;
		country: string;
	}): Promise<boolean> {
		this.error = '';
		this.notice = '';
		if (!supabaseConfigured) {
			this.error = 'Cloud accounts are not configured in this build.';
			return false;
		}
		const redirectTo = `${window.location.origin}/workspace`;
		const { data, error } = await supabase.auth.signUp({
			email: input.email,
			password: input.password,
			options: {
				emailRedirectTo: redirectTo,
				data: {
					first_name: input.firstName.trim(),
					last_name: input.lastName.trim(),
					country: input.country
				}
			}
		});
		if (error || !data.user) {
			this.error = isAlreadyRegisteredError(error?.message)
				? EXISTING_ACCOUNT_MESSAGE
				: error?.message ?? 'Could not create account.';
			return false;
		}
		if (isExistingAccount(data.user)) {
			// Supabase hides existing emails behind a fake user with no identities;
			// surface the honest message instead of "account created".
			this.error = EXISTING_ACCOUNT_MESSAGE;
			return false;
		}
		if (!data.session) {
			// Email confirmation is enabled: the account was created but the user
			// must click the confirmation link before signing in. This is a
			// success, not an error, so the modal closes with a clear notice.
			this.notice = 'Account created. Check your inbox to confirm your email, then sign in.';
			toasts.push(this.notice, 'info');
			return true;
		}
		this.user = toAppUser(data.user);
		await this.refreshProfile();
		toasts.push('Account created');
		return true;
	}

	// Updates the display name and country stored in auth user metadata.
	async updateProfile(input: {
		firstName: string;
		lastName: string;
		country: string;
	}): Promise<boolean> {
		this.error = '';
		if (!supabaseConfigured) {
			this.error = 'Cloud accounts are not configured in this build.';
			return false;
		}
		if (!this.user) {
			this.error = 'You are not signed in.';
			return false;
		}
		const { data, error } = await supabase.auth.updateUser({
			data: {
				first_name: input.firstName.trim(),
				last_name: input.lastName.trim(),
				country: input.country
			}
		});
		if (error || !data.user) {
			this.error = error?.message ?? 'Could not save your profile.';
			return false;
		}
		this.user = toAppUser(data.user);
		toasts.push('Profile updated');
		return true;
	}

	async signIn(email: string, password: string): Promise<boolean> {
		this.error = '';
		this.notice = '';
		if (!supabaseConfigured) {
			this.error = 'Cloud accounts are not configured in this build.';
			return false;
		}
		const { data, error } = await supabase.auth.signInWithPassword({ email, password });
		if (error || !data.user) {
			this.error = error?.message ?? 'Could not sign in.';
			return false;
		}
		this.user = toAppUser(data.user);
		await this.refreshProfile();
		toasts.push('Signed in');
		return true;
	}

	// Sends a password-reset email. Returns true on success (an email was sent).
	async resetPassword(email: string): Promise<boolean> {
		this.error = '';
		if (!supabaseConfigured) {
			this.error = 'Cloud accounts are not configured in this build.';
			return false;
		}
		const redirectTo = `${window.location.origin}/workspace`;
		const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
		if (error) {
			this.error = error.message ?? 'Could not send a reset link.';
			return false;
		}
		return true;
	}

	// Completes a password reset after following the recovery link. On success
	// the recovery flag is cleared and the new session is active.
	async updatePassword(password: string): Promise<boolean> {
		this.error = '';
		const { error } = await supabase.auth.updateUser({ password });
		if (error) {
			this.error = error.message ?? 'Could not update your password.';
			return false;
		}
		this.recovery = false;
		return true;
	}

	async signOut(): Promise<void> {
		await supabase.auth.signOut();
		this.user = null;
		this.profile = null;
		toasts.push('Signed out', 'info');
	}

	// Permanently delete the account and all cloud data. The Edge Function
	// cancels any active subscription first and aborts if that fails, then
	// deletes the auth user (child rows cascade). On success the local device
	// data is wiped; the caller reloads.
	async deleteAccount(): Promise<boolean> {
		this.error = '';
		if (!supabaseConfigured) {
			this.error = 'Cloud accounts are not configured in this build.';
			return false;
		}
		try {
			const { error } = await supabase.functions.invoke('delete-account', { method: 'POST' });
			if (error) {
				let message = error.message ?? 'Could not delete account.';
				const context = (error as { context?: Response }).context;
				if (context && typeof context.json === 'function') {
					try {
						const body = await context.json();
						if (body?.error) message = body.error;
					} catch {
						/* keep the generic message */
					}
				}
				this.error = message;
				return false;
			}
			await clearLocalData();
			try {
				await supabase.auth.signOut({ scope: 'local' });
			} catch {
				/* the session is already invalid after deletion */
			}
			this.user = null;
			this.profile = null;
			return true;
		} catch (err) {
			this.error = err instanceof Error ? err.message : 'Could not delete account.';
			return false;
		}
	}

	async startCheckout(
		tier: PaidTier = 'pro',
		plan: 'monthly' | 'annual' = 'annual',
		currency: 'EUR' | 'USD' = 'EUR'
	): Promise<string | null> {
		try {
			const { data, error } = await supabase.functions.invoke('create-checkout', {
				body: {
					tier,
					plan,
					currency,
					successUrl: window.location.origin + '/workspace',
					cancelUrl: window.location.href
				}
			});
			if (error) {
				this.error = error.message ?? 'Could not start checkout.';
				return null;
			}
			return data?.checkoutUrl ?? null;
		} catch (err) {
			this.error = err instanceof Error ? err.message : 'Could not start checkout.';
			return null;
		}
	}

	// Cancels at the end of the current paid period (no refund, access kept
	// until then). Returns the resulting period end ISO date, or null on error.
	async cancelSubscription(): Promise<string | null> {
		this.error = '';
		try {
			const { data, error } = await supabase.functions.invoke('billing-cancel', {});
			if (error) {
				this.error = error.message ?? 'Could not cancel subscription.';
				return null;
			}
			await this.refreshProfile();
			return data?.currentPeriodEnd ?? null;
		} catch (err) {
			this.error = err instanceof Error ? err.message : 'Could not cancel subscription.';
			return null;
		}
	}
}

export const auth = new AuthState();
