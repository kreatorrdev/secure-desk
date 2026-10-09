import { AuthShell } from "@/components/auth-shell";
import { ConfirmForm, ResendForm } from "@/components/auth-forms";
export const dynamic = "force-dynamic";
export default async function ConfirmPage({ searchParams }: PageProps<"/auth/confirm">) {
  const params = await searchParams;
  const tokenHash = typeof params.token_hash === "string" ? params.token_hash : "";
  const valid = params.type === "email" && /^[A-Za-z0-9_-]{20,256}$/.test(tokenHash);
  return <AuthShell title={valid ? "Confirm your email" : "Confirmation link unavailable"} description={valid ? "Choose the button below to confirm your email and continue to your request status." : "This link is incomplete or invalid. Request a new confirmation email."}>
    {valid && <ConfirmForm tokenHash={tokenHash} />}
    <details className="mt-7 border-t border-slate-200 pt-5" open={!valid}><summary className="cursor-pointer text-sm font-medium">Request a new confirmation</summary><ResendForm /></details>
  </AuthShell>;
}
