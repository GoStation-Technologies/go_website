# Hosted submissions on gostation.sa

Public form server functions on gostation.sa forward to:
`https://org-story-weaver.lovable.app/api/public/submissions`

The forwarding adapter uses the standard publishable client, preserving the caller's Bearer session for **Send Test Email**. This is a Lovable-hosted TanStack endpoint, not a new Edge Function. Public forms remain anonymous, schema-validated submissions; a publishable key identifies the app, not an authenticated visitor. Test sends verify the caller with Auth and check the existing `super_admin` role before reading saved settings or sending email.

## Deployment order

1. Publish this version on Lovable so the hosted endpoint is available.
2. Redeploy the latest source to gostation.sa using the existing deployment workflow.
3. Keep `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` configured on the VPS for existing staff-session middleware. These are public configuration, not service-role credentials.
4. Test each live form and Send Test Email while signed in as a super-admin.

The VPS does **not** need `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, or `LOVABLE_API_KEY` for this pipeline. Those stay in hosted execution. Do not point the fixed hosted URL at gostation.sa: that would loop.

Existing saved recipients, enabled switches, CC, visitor Reply-To, private attachment links and the locked `GoStation | قوستيشن <noreply@gostation.sa>` sender are unchanged. Submission references are returned even when notification delivery fails. Email delivery diagnostics are returned only for authenticated test sends.

Fleet/corporate enquiries currently use the Contact page, so they follow the contact pipeline and notification settings. Leasing, acquisitions and investor enquiries are forwarded as well to avoid leaving sibling submission paths dependent on a VPS service-role key.

This change does not migrate the separate SMS/OTP admin sign-in pipeline or other unrelated privileged features. Its existing missing-secret response remains a controlled 503, not a startup crash.