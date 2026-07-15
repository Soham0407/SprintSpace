import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Loader2 } from 'lucide-react';
import AuthLayout from '../components/layout/AuthLayout';
import StarBorder from '../components/reactbits/StarBorder';
import ClickSpark from '../components/reactbits/ClickSpark';
import { loginSchema, type LoginValues } from '../lib/authSchemas';

const inputClass =
  'w-full bg-surface border border-white/10 rounded-xl px-4 py-3 text-primary placeholder-gray-600 text-sm focus:outline-none focus:border-accent transition-colors';

const LoginPage = () => {
  const navigate = useNavigate();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (_values: LoginValues) => {
    setSubmitError(null);
    // No backend wired up yet — simulate the round-trip so the form,
    // loading state, and redirect all behave like the real thing will.
    await new Promise((resolve) => setTimeout(resolve, 900));
    navigate('/workspace');
  };

  return (
    <AuthLayout
      eyebrow="WELCOME BACK"
      title="Log in to your workspace"
      footer={
        <>
          Don&apos;t have an account?{' '}
          <Link to="/signup" className="text-primary hover:text-accent transition-colors">
            Sign up
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
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
            autoComplete="current-password"
            className={inputClass}
            placeholder="••••••••"
            {...register('password')}
          />
          {errors.password && (
            <p className="text-red-400 text-xs mt-1.5">{errors.password.message}</p>
          )}
        </div>

        <div className="flex items-center justify-between text-xs text-gray-500 pt-1">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" className="accent-accent" {...register('remember')} />
            Remember me
          </label>
          <button type="button" className="hover:text-primary transition-colors">
            Forgot password?
          </button>
        </div>

        {submitError && <p className="text-red-400 text-xs">{submitError}</p>}

        <div className="pt-2">
          <ClickSpark sparkColor="#FF5B2E" sparkCount={10} sparkRadius={16}>
            <StarBorder as="button" color="#FF5B2E" speed="4s" className="w-full group" type="submit">
              <span className="flex items-center justify-center gap-2 bg-primary text-ink rounded-full py-3 font-medium text-sm w-full">
                {isSubmitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Logging in...
                  </>
                ) : (
                  <>
                    Log in
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

export default LoginPage;
