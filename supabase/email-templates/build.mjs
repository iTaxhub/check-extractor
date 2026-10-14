#!/usr/bin/env node
/**
 * Builds and applies Kyriq's Supabase auth email templates.
 *
 *   node supabase/email-templates/build.mjs          # write .html files only
 *   node supabase/email-templates/build.mjs --apply  # also PATCH the project
 *
 * WHY THIS EXISTS: every auth email was Supabase's built-in default — a bare
 * <h2> and a naked link, no Kyriq anywhere — and because site_url was still
 * http://localhost:3000, the reset-password link pointed at localhost for real
 * users. The link host is fixed by site_url; this fixes the branding, and keeps
 * it in git rather than as dashboard state nobody can review or restore.
 *
 * EMAIL HTML IS NOT WEB HTML. The constraints that shape what follows:
 *   - Tables for layout. Gmail/Outlook do not lay out flex or grid.
 *   - Inline styles only. <style> blocks get stripped.
 *   - PNG, never SVG, for the logo: Gmail and Outlook do not render SVG, so
 *     brand/kyriq-logo.svg would be an empty box. The 360x149 PNG is served at
 *     116x48 so it stays sharp on retina.
 *   - Explicit width/height/border on every img, or Outlook invents its own.
 *   - Images are blocked by default for many recipients, so alt text carries
 *     the brand and nothing load-bearing lives in an image.
 *   - The raw URL is repeated as text under the button, because a button that
 *     does not render leaves the recipient with no way through.
 *   - Explicit light background: some clients force-invert an unstyled body.
 */
import { writeFileSync, mkdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, '..', '..');
const APP = 'https://kyriq.com';
const BRAND = '#6366f1';
const INK = '#1e2235';
const SOFT = '#5b6478';
const HAIR = '#e6e8ee';

/** One shell so every email looks like the same product. */
const shell = ({ preheader, heading, body, cta, url, footnote }) => `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light">
<title>${heading}</title>
</head>
<body style="margin:0;padding:0;background:#f4f5f8;">
<!-- Preheader: the grey line clients show next to the subject. Hidden in body. -->
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${preheader}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f4f5f8;">
<tr><td align="center" style="padding:32px 16px;">
  <table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0" style="width:560px;max-width:100%;background:#ffffff;border:1px solid ${HAIR};border-radius:14px;">
    <tr><td style="padding:32px 32px 24px 32px;">
      <a href="${APP}" style="text-decoration:none;">
        <img src="${APP}/brand/kyriq-logo.png" alt="Kyriq" width="116" height="48"
             style="display:block;border:0;outline:none;text-decoration:none;width:116px;height:48px;">
      </a>
    </td></tr>
    <tr><td style="padding:0 32px;">
      <h1 style="margin:0 0 14px 0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:21px;line-height:1.3;font-weight:700;color:${INK};">${heading}</h1>
      <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:15px;line-height:1.6;color:${SOFT};">${body}</div>
    </td></tr>
${cta ? `    <tr><td style="padding:26px 32px 6px 32px;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
        <td align="center" bgcolor="${BRAND}" style="border-radius:9px;">
          <a href="${url}" style="display:inline-block;padding:13px 26px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:9px;">${cta}</a>
        </td>
      </tr></table>
    </td></tr>
    <tr><td style="padding:16px 32px 0 32px;">
      <p style="margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:12px;line-height:1.6;color:#8b93a7;">
        If the button does not work, paste this into your browser:<br>
        <span style="color:${BRAND};word-break:break-all;">${url}</span>
      </p>
    </td></tr>
` : ''}
    <tr><td style="padding:26px 32px 30px 32px;">
      <div style="border-top:1px solid ${HAIR};padding-top:18px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:12px;line-height:1.6;color:#8b93a7;">
        ${footnote || 'If you did not expect this email you can safely ignore it.'}
      </div>
    </td></tr>
  </table>
  <div style="padding:18px 8px 0 8px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:11px;line-height:1.6;color:#9aa1b3;">
    Kyriq &middot; check reconciliation for QuickBooks Online<br>
    <a href="${APP}" style="color:#9aa1b3;">kyriq.com</a>
  </div>
</td></tr>
</table>
</body>
</html>`;

/* Supabase template variables: {{ .ConfirmationURL }}, {{ .Token }},
   {{ .Email }}, {{ .NewEmail }}, {{ .OldEmail }}, {{ .SiteURL }}. */
const TEMPLATES = {
  recovery: {
    subject: 'Reset your Kyriq password',
    html: shell({
      preheader: 'Reset your Kyriq password. This link expires in 60 minutes.',
      heading: 'Reset your password',
      body: '<p style="margin:0;">Someone asked to reset the password for your Kyriq account. Choose a new one with the button below. The link expires in 60 minutes and can be used once.</p>',
      cta: 'Choose a new password',
      url: '{{ .ConfirmationURL }}',
      footnote: 'If you did not ask for a password reset, ignore this email &mdash; your password stays as it is.',
    }),
  },
  confirmation: {
    subject: 'Confirm your Kyriq account',
    html: shell({
      preheader: 'Confirm your email to finish setting up Kyriq.',
      heading: 'Confirm your email',
      body: '<p style="margin:0;">Welcome to Kyriq. Confirm this address to finish setting up your account and start reconciling checks against QuickBooks Online.</p>',
      cta: 'Confirm my email',
      url: '{{ .ConfirmationURL }}',
    }),
  },
  invite: {
    subject: 'You have been invited to Kyriq',
    html: shell({
      preheader: 'Accept your invitation to join a firm on Kyriq.',
      heading: 'You have been invited to Kyriq',
      body: '<p style="margin:0;">You have been invited to join a firm on Kyriq, where your team reconciles checks against QuickBooks Online together. Accept below to set up your account.</p>',
      cta: 'Accept the invitation',
      url: '{{ .ConfirmationURL }}',
      footnote: 'If you were not expecting an invitation, you can ignore this email.',
    }),
  },
  magic_link: {
    subject: 'Your Kyriq sign-in link',
    html: shell({
      preheader: 'Your single-use link to sign in to Kyriq.',
      heading: 'Sign in to Kyriq',
      body: '<p style="margin:0;">Use the button below to sign in. The link works once and expires shortly.</p>',
      cta: 'Sign in to Kyriq',
      url: '{{ .ConfirmationURL }}',
      footnote: 'If you did not try to sign in, ignore this email and consider changing your password.',
    }),
  },
  email_change: {
    subject: 'Confirm your new Kyriq email address',
    html: shell({
      preheader: 'Confirm the new email address for your Kyriq account.',
      heading: 'Confirm your new email address',
      body: '<p style="margin:0;">You asked to change the email on your Kyriq account from <strong>{{ .Email }}</strong> to <strong>{{ .NewEmail }}</strong>. Confirm to make the change.</p>',
      cta: 'Confirm the change',
      url: '{{ .ConfirmationURL }}',
      footnote: 'If you did not request this, ignore this email and your address will not change.',
    }),
  },
  password_changed_notification: {
    subject: 'Your Kyriq password was changed',
    html: shell({
      preheader: 'The password on your Kyriq account has just been changed.',
      heading: 'Your password was changed',
      body: '<p style="margin:0;">The password for <strong>{{ .Email }}</strong> was just changed. If that was you, nothing more to do.</p>',
      footnote: 'If this was not you, reset your password immediately and contact us.',
    }),
  },
  email_changed_notification: {
    subject: 'Your Kyriq email address was changed',
    html: shell({
      preheader: 'The email address on your Kyriq account has changed.',
      heading: 'Your email address was changed',
      body: '<p style="margin:0;">The address on your Kyriq account changed from <strong>{{ .OldEmail }}</strong> to <strong>{{ .Email }}</strong>.</p>',
      footnote: 'If this was not you, contact us straight away.',
    }),
  },
};

mkdirSync(HERE, { recursive: true });
for (const [name, t] of Object.entries(TEMPLATES)) {
  writeFileSync(join(HERE, `${name}.html`), t.html, 'utf8');
  console.log(`  wrote ${name}.html  (${t.html.length} bytes)  subject: ${t.subject}`);
}

if (!process.argv.includes('--apply')) {
  console.log('\nFiles written. Re-run with --apply to push them to Supabase.');
  process.exit(0);
}

const tokLine = readFileSync(join(REPO, '.env.local'), 'utf8')
  .split(/\r?\n/).find((l) => l.startsWith('SUPABASE_ACCESS_TOKEN='));
if (!tokLine) throw new Error('SUPABASE_ACCESS_TOKEN missing from .env.local');
const TOKEN = tokLine.split('=').slice(1).join('=').trim().replace(/^["']|["']$/g, '');
const PROJECT = 'yqbmzerdagqevjdwhlwh';

const payload = { site_url: APP, uri_allow_list: `${APP}/**,http://localhost:3080/**` };
for (const [name, t] of Object.entries(TEMPLATES)) {
  payload[`mailer_subjects_${name}`] = t.subject;
  payload[`mailer_templates_${name}_content`] = t.html;
}

const res = await fetch(`https://api.supabase.com/v1/projects/${PROJECT}/config/auth`, {
  method: 'PATCH',
  headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
  body: JSON.stringify(payload),
});
const out = await res.json();
if (!res.ok) {
  console.error('\nPATCH failed', res.status, out);
  process.exit(1);
}
console.log(`\nApplied. site_url=${out.site_url}`);
for (const name of Object.keys(TEMPLATES)) {
  const html = out[`mailer_templates_${name}_content`] || '';
  const subj = out[`mailer_subjects_${name}`] || '';
  console.log(`  ${/kyriq-logo\.png/.test(html) ? 'branded' : 'NOT BRANDED'}  ${name}  "${subj}"`);
}
