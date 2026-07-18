import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Loader2, MailCheck } from 'lucide-react';
import AuthLayout from '../components/layout/AuthLayout';
import StarBorder from '../components/reactbits/StarBorder';
import ClickSpark from '../components/reactbits/ClickSpark';
import { signupSchema, type SignupValues } from '../lib/authSchemas';
import { signUp } from '../lib/authApi';

const inputClass =
  'w-full bg-surface border border-white/10 rounded-xl px-4 py-3 text-primary placeholder-gray-600 text-sm focus:outline-none focus:border-accent transition-colors';

const SignupPage = () => {
  const navigate = useNavigate();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignupValues>({ resolver: zodResolver(signupSchema) });

  const onSubmit = async (values: SignupValues) => {
    setSubmitError(null);
    try {
      const result = await signUp(values);

      // If Supabase returns a session immediately (email confirmation disabled)
      // navigate straight to workspace
      if (result.session) {
        navigate('/workspace');
        return;
      }

      // Otherwise Supabase sent a confirmation email — show the user
      setEmailSent(values.email);
    } catch (e) {
      setSubmitError((e as Error).message);
    }
  };

  // ─── Email confirmation pending state ─────────────────────────────────────
  if (emailSent) {
    return (
      <AuthLayout
        eyebrow="ONE MORE STEP"
        title="Check your inbox"
        footer={
          <>
            Wrong email?{' '}
            <button
              onClick={() => setEmailSent(null)}
              className="text-primary hover:text-accent transition-colors"
            >
              Go back
            </button>
          </>
        }
      >
        <div className="flex flex-col items-center text-center gap-4 py-4">
          <div className="w-14 h-14 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center">
            <MailCheck size={24} className="text-accent" />
          </div>
          <p className="text-primary/80 text-sm leading-relaxed">
            We sent a confirmation link to{' '}
            <span className="text-primary font-medium">{emailSent}</span>.
            <br />
            Click it to activate your account, then log in.
          </p>
          <Link
            to="/login"
            className="mt-2 text-sm bg-primary text-ink rounded-full px-6 py-2.5 font-medium hover:bg-white transition-colors"
          >
            Go to Log in
          </Link>
        </div>
      </AuthLayout>
    );
  }

  // ─── Signup form ──────────────────────────────────────────────────────────
  return (
    <AuthLayout
      eyebrow="GET STARTED"
      title="Create your account"
      footer={
        <>
          Already have an account?{' '}
          <Link to="/login" className="text-primary hover:text-accent transition-colors">
            Log in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <div>
          <label className="text-xs text-gray-500 block mb-1.5">Full name</label>
          <input
            type="text"
            autoComplete="name"
            className={inputClass}
            placeholder="Vaibhav Parmar"
            {...register('name')}
          />
          {errors.name && <p className="text-red-400 text-xs mt-1.5">{errors.name.message}</p>}
        </div>

        <div>
          <label className="text-xs text-gray-500 block mb-1.5">Email</label>
          <input
            type="email"
            autoComplete="email"
            className={inputClass}
            placeholder="you@college.edu"
            {...register('email')}
          />
          {errors.email && <p className="text-red-400 text-xs mt-1.5">{errors.email.message}</p>}
        </div>

        <div>
          <label className="text-xs text-gray-500 block mb-1.5">Password</label>
          <input
            type="password"
            autoComplete="new-password"
            className={inputClass}
            placeholder="At least 8 characters"
            {...register('password')}
          />
          {errors.password && (
            <p className="text-red-400 text-xs mt-1.5">{errors.password.message}</p>
          )}
        </div>

        <div>
          <label className="text-xs text-gray-500 block mb-1.5">Confirm password</label>
          <input
            type="password"
            autoComplete="new-password"
            className={inputClass}
            placeholder="••••••••"
            {...register('confirmPassword')}
          />
          {errors.confirmPassword && (
            <p className="text-red-400 text-xs mt-1.5">{errors.confirmPassword.message}</p>
          )}
        </div>

        {submitError && (
          <p className="text-red-400 text-xs bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">
            {submitError}
          </p>
        )}

        <div className="pt-2">
          <ClickSpark sparkColor="#FF5B2E" sparkCount={10} sparkRadius={16}>
            <StarBorder as="button" color="#FF5B2E" speed="4s" className="w-full group" type="submit">
              <span className="flex items-center justify-center gap-2 bg-primary text-ink rounded-full py-3 font-medium text-sm w-full">
                {isSubmitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Creating account...
                  </>
                ) : (
                  <>
                    Create account
                    <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
                  </>
                )}
              </span>
            </StarBorder>
          </ClickSpark>
        </div>
      </form>
    </AuthLayout>
  );
};

export default SignupPage;
