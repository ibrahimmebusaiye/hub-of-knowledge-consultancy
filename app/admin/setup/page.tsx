import SetupForm from "./setup-form";

export const metadata = { title: "Initial administrator setup" };
export default function SetupPage() { return <main className="setup-page"><section className="auth-card setup-card"><p className="eyebrow">One-time configuration</p><h2>Create the owner account</h2><p className="auth-copy">This page becomes unavailable after the first administrator is created.</p><SetupForm/></section></main>; }
