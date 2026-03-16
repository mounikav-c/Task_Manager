import { Eye, LockKeyhole, Mail, User } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

interface SignupPageProps {
  isLoading: boolean;
  onSignup: () => void;
  onGoogleLogin: () => void;
}

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" aria-hidden="true">
      <path fill="#EA4335" d="M12 10.2v3.9h5.4c-.2 1.3-1.5 3.9-5.4 3.9-3.2 0-5.9-2.7-5.9-6s2.7-6 5.9-6c1.8 0 3 .8 3.7 1.4l2.5-2.4C16.6 3.6 14.5 2.8 12 2.8 6.9 2.8 2.8 6.9 2.8 12S6.9 21.2 12 21.2c6.9 0 8.6-4.8 8.6-7.3 0-.5 0-.9-.1-1.3H12Z" />
      <path fill="#34A853" d="M2.8 7.3l3.2 2.4C6.8 7.8 9.1 6 12 6c1.8 0 3 .8 3.7 1.4l2.5-2.4C16.6 3.6 14.5 2.8 12 2.8c-3.9 0-7.3 2.2-9.2 5.5Z" />
      <path fill="#FBBC05" d="M12 21.2c2.4 0 4.5-.8 6-2.3l-2.8-2.3c-.8.6-1.9 1-3.2 1-3.8 0-5.1-2.6-5.4-3.8l-3.2 2.5c1.9 3.4 5.4 4.9 8.6 4.9Z" />
      <path fill="#4285F4" d="M20.6 13.9c0-.5 0-.9-.1-1.3H12v3.9h5.4c-.3 1.2-1.1 2.1-2.2 2.8l2.8 2.3c1.6-1.5 2.6-3.8 2.6-6.7Z" />
    </svg>
  );
}

export function SignupPage({ isLoading, onSignup, onGoogleLogin }: SignupPageProps) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#eef2ff] px-6 py-12">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,#fff7ed_0%,#fdf2f8_22%,#f5f3ff_48%,#eef2ff_72%,#f0f9ff_100%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_16%,rgba(251,191,36,0.28),transparent_18%),radial-gradient(circle_at_34%_12%,rgba(244,114,182,0.22),transparent_22%),radial-gradient(circle_at_76%_14%,rgba(129,140,248,0.28),transparent_24%),radial-gradient(circle_at_88%_26%,rgba(56,189,248,0.2),transparent_18%),radial-gradient(circle_at_50%_100%,rgba(168,85,247,0.14),transparent_28%)]" />
      <div className="pointer-events-none absolute inset-y-0 left-0 w-[42%] bg-[radial-gradient(circle_at_left_center,rgba(255,255,255,0.8),transparent_62%)]" />
      <div className="pointer-events-none absolute -left-24 top-14 h-[28rem] w-[28rem] rounded-full bg-fuchsia-300/30 blur-[120px]" />
      <div className="pointer-events-none absolute left-[14%] top-[12%] h-40 w-40 rounded-full border border-white/35 bg-white/15 backdrop-blur-3xl" />
      <div className="pointer-events-none absolute right-[-6rem] top-10 h-[30rem] w-[30rem] rounded-full bg-sky-300/25 blur-[130px]" />
      <div className="pointer-events-none absolute right-[12%] top-[24%] h-52 w-52 rounded-full border border-white/30 bg-white/10 backdrop-blur-3xl" />
      <div className="pointer-events-none absolute bottom-[-7rem] left-[18%] h-72 w-72 rounded-full bg-amber-200/25 blur-[120px]" />
      <div className="pointer-events-none absolute bottom-[-8rem] left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-violet-300/30 blur-[130px]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.08)_0%,rgba(255,255,255,0.28)_26%,rgba(248,250,252,0.56)_100%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.14] [background-image:linear-gradient(rgba(255,255,255,0.55)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.45)_1px,transparent_1px)] [background-size:72px_72px]" />

      <div className="relative z-10 w-full max-w-md rounded-[32px] border border-white/60 bg-[linear-gradient(135deg,rgba(255,255,255,0.54),rgba(255,255,255,0.18))] p-8 shadow-[0_40px_100px_-44px_rgba(15,23,42,0.32),0_24px_50px_-30px_rgba(79,70,229,0.24),inset_0_1px_0_rgba(255,255,255,0.88)] backdrop-blur-[30px] sm:p-10">
        <div className="pointer-events-none absolute inset-0 rounded-[32px] bg-[linear-gradient(145deg,rgba(255,255,255,0.42),rgba(255,255,255,0.08))]" />
        <div className="pointer-events-none absolute inset-x-6 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.85),transparent)]" />
        <div className="pointer-events-none absolute left-6 right-6 top-6 h-24 rounded-[24px] bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.42),transparent_72%)] opacity-80" />

        <div className="relative text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-[18px] border border-white/55 bg-[linear-gradient(135deg,rgba(255,255,255,0.44),rgba(255,255,255,0.18))] shadow-[inset_0_1px_0_rgba(255,255,255,0.95),0_18px_30px_-22px_rgba(124,58,237,0.38)] backdrop-blur-xl">
            <div className="flex h-9 w-9 items-center justify-center rounded-[14px] bg-[linear-gradient(135deg,#ff4bb3_0%,#7c3aed_58%,#4f46e5_100%)] shadow-[0_14px_24px_-16px_rgba(124,58,237,0.55)]">
              <span className="text-sm font-bold text-white">T</span>
            </div>
          </div>
          <h1 className="mt-5 text-[2.05rem] font-extrabold tracking-tight text-slate-950">Create account</h1>
          <p className="mt-2 text-sm text-slate-600">
            Sign up to get started with your workspace.
          </p>
        </div>

        <div className="relative mt-8 space-y-3">
          <label className="block">
            <div className="flex h-12 items-center gap-3 rounded-[16px] border border-white/60 bg-[linear-gradient(180deg,rgba(255,255,255,0.72),rgba(255,255,255,0.4))] px-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_16px_28px_-26px_rgba(15,23,42,0.45)] backdrop-blur-xl transition-all focus-within:border-violet-300/80 focus-within:bg-[linear-gradient(180deg,rgba(255,255,255,0.85),rgba(248,245,255,0.58))] focus-within:shadow-[0_0_0_4px_rgba(139,92,246,0.08),inset_0_1px_0_rgba(255,255,255,0.92),0_20px_30px_-26px_rgba(79,70,229,0.3)]">
              <User className="h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Full name"
                className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
              />
            </div>
          </label>

          <label className="block">
            <div className="flex h-12 items-center gap-3 rounded-[16px] border border-white/60 bg-[linear-gradient(180deg,rgba(255,255,255,0.72),rgba(255,255,255,0.4))] px-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_16px_28px_-26px_rgba(15,23,42,0.45)] backdrop-blur-xl transition-all focus-within:border-violet-300/80 focus-within:bg-[linear-gradient(180deg,rgba(255,255,255,0.85),rgba(248,245,255,0.58))] focus-within:shadow-[0_0_0_4px_rgba(139,92,246,0.08),inset_0_1px_0_rgba(255,255,255,0.92),0_20px_30px_-26px_rgba(79,70,229,0.3)]">
              <Mail className="h-4 w-4 text-slate-400" />
              <input
                type="email"
                placeholder="Work email"
                className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
              />
            </div>
          </label>

          <label className="block">
            <div className="flex h-12 items-center gap-3 rounded-[16px] border border-white/60 bg-[linear-gradient(180deg,rgba(255,255,255,0.72),rgba(255,255,255,0.4))] px-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_16px_28px_-26px_rgba(15,23,42,0.45)] backdrop-blur-xl transition-all focus-within:border-violet-300/80 focus-within:bg-[linear-gradient(180deg,rgba(255,255,255,0.85),rgba(248,245,255,0.58))] focus-within:shadow-[0_0_0_4px_rgba(139,92,246,0.08),inset_0_1px_0_rgba(255,255,255,0.92),0_20px_30px_-26px_rgba(79,70,229,0.3)]">
              <LockKeyhole className="h-4 w-4 text-slate-400" />
              <input
                type="password"
                placeholder="Create password"
                className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
              />
              <Eye className="h-4 w-4 text-slate-400" />
            </div>
          </label>

          <Button
            onClick={onSignup}
            disabled={isLoading}
            className="h-12 w-full rounded-[16px] border border-violet-400/20 bg-[linear-gradient(135deg,#6d28d9_0%,#7c3aed_52%,#4f46e5_100%)] text-sm font-semibold text-white shadow-[0_20px_36px_-20px_rgba(109,40,217,0.5),0_0_0_1px_rgba(255,255,255,0.08)_inset] transition-all hover:-translate-y-0.5 hover:brightness-105"
          >
            {isLoading ? "Creating..." : "Sign Up"}
          </Button>
        </div>

        <div className="relative mt-6 flex items-center gap-4 text-xs font-medium uppercase tracking-[0.22em] text-slate-400">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/60 to-slate-200/75" />
          <span className="tracking-[0.18em]">or</span>
          <div className="h-px flex-1 bg-gradient-to-l from-transparent via-white/60 to-slate-200/75" />
        </div>

        <div className="relative mt-6">
          <button
            type="button"
            onClick={onGoogleLogin}
            disabled={isLoading}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-[16px] border border-white/65 bg-[linear-gradient(180deg,rgba(255,255,255,0.76),rgba(255,255,255,0.5))] text-sm font-semibold text-slate-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.92),0_16px_30px_-26px_rgba(15,23,42,0.4)] backdrop-blur-xl transition-all hover:-translate-y-0.5 hover:bg-[linear-gradient(180deg,rgba(255,255,255,0.9),rgba(248,250,252,0.68))]"
          >
            <GoogleMark />
            Continue with Google
          </button>
        </div>

        <p className="relative mt-8 text-center text-sm text-slate-500">
          Already have an account?{" "}
          <Link to="/login" className="font-semibold text-indigo-600 transition-colors hover:text-indigo-500">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
