import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Sparkles, Mail, Lock, User } from "lucide-react";
import { toast } from "sonner";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setSubmitting(true);
    const res = await register(email, password, name);
    setSubmitting(false);
    if (res.ok) {
      toast.success("Account created! Welcome to Habio.");
      navigate("/");
    } else {
      toast.error(res.error);
    }
  };

  return (
    <div className="min-h-screen auth-bg flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-[#EF476F] border-2 border-[#1E1E24] flex items-center justify-center" style={{ boxShadow: "4px 4px 0 0 #1E1E24" }}>
            <Sparkles className="w-6 h-6 text-white" strokeWidth={3} />
          </div>
          <span className="font-heading font-black text-3xl">Habio</span>
        </div>

        <div className="nb-card p-8">
          <h1 className="font-heading text-3xl sm:text-4xl font-black mb-2">Start your quest</h1>
          <p className="text-[#5C5C68] mb-6">Build habits. Earn coins. Unlock rewards.</p>

          <form onSubmit={onSubmit} className="space-y-4" data-testid="register-form">
            <div>
              <label className="text-xs font-bold uppercase tracking-[0.15em] text-[#5C5C68] mb-1.5 block">Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9AA0A6]" strokeWidth={2.5} />
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" className="nb-input pl-10" data-testid="register-name-input" />
              </div>
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-[0.15em] text-[#5C5C68] mb-1.5 block">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9AA0A6]" strokeWidth={2.5} />
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="nb-input pl-10" data-testid="register-email-input" />
              </div>
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-[0.15em] text-[#5C5C68] mb-1.5 block">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9AA0A6]" strokeWidth={2.5} />
                <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 chars" className="nb-input pl-10" data-testid="register-password-input" />
              </div>
            </div>

            <button type="submit" disabled={submitting} className="nb-btn nb-btn-primary w-full !py-3.5 text-base" data-testid="register-submit-btn">
              {submitting ? "Creating..." : "Create Account"}
            </button>
          </form>

          <p className="text-sm text-center mt-5 text-[#5C5C68]">
            Already have an account?{" "}
            <Link to="/login" className="font-bold text-[#EF476F] underline underline-offset-2" data-testid="go-to-login-link">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
