import type { Metadata } from "next";
import LoginForm from "./login-form";

export const metadata: Metadata = { title: "Admin login" };

export default function AdminLoginPage() {
  return (
    <main className="auth-page">
      <section className="auth-intro">
        <a href="/" className="auth-brand"><span className="brand-mark">HK</span><span>Hub of Knowledge<br /><small>Consultancy Firm</small></span></a>
        <div><p className="eyebrow light">Secure administration</p><h1>Understand every visit.<br />Respond to every enquiry.</h1><p>Private access to website analytics, campaigns and client messages.</p></div>
        <p className="auth-footnote">Hub of Knowledge &amp; Enlightenment Consultancy Firm Sierra Leone Limited</p>
      </section>
      <section className="auth-form-side">
        <div className="auth-card">
          <p className="eyebrow">Administrator access</p><h2>Welcome back</h2><p className="auth-copy">Enter your approved account details to continue.</p>
          <LoginForm />
          <a className="back-link" href="/">← Return to public website</a>
        </div>
      </section>
    </main>
  );
}
