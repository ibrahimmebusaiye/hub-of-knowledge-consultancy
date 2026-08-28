import PasswordForm from "@/components/password-form";
export const metadata = { title: "Settings" };
export default function SettingsPage() { return <><header className="topbar"><div><p className="eyebrow">Account security</p><h1>Settings</h1><p className="subtitle">Update your administrator password and active sessions.</p></div></header><section className="panel settings-panel"><div className="panel-head"><div><h2>Change password</h2><p className="panel-note">Use at least 12 characters and avoid reused passwords.</p></div></div><PasswordForm/></section></>; }
