
"use client";

import React, { useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useGoogleLogin } from '@/service/query/useAuth';
import { Loader2 } from 'lucide-react';

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { mutate: googleLogin, isPending } = useGoogleLogin();
  const processed = useRef(false);

  useEffect(() => {
    if (processed.current) return;
    
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');
    const savedState = sessionStorage.getItem('oauth_state');

    if (error) {
      console.error('Google Auth Error:', error);
      router.push('/login?error=' + error);
      return;
    }

    if (!code) {
      router.push('/login');
      return;
    }

    if (state !== savedState) {
      console.error('Invalid state parameter');
      // router.push('/login?error=invalid_state');
      // return;
    }

    processed.current = true;
    googleLogin({ 
      code, 
      redirectUri: window.location.origin + window.location.pathname 
    });
    
  }, [searchParams, googleLogin, router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background">
      <div className="space-y-6 text-center">
        <div className="relative">
          <div className="w-20 h-20 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
          </div>
          <div className="absolute inset-0 w-20 h-20 rounded-full border-t-2 border-primary animate-spin mx-auto" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-black tracking-tight">Authenticating...</h2>
          <p className="text-muted-foreground font-medium uppercase text-[10px] tracking-[0.2em]">Synchronizing with Google Intelligence</p>
        </div>
      </div>
    </div>
  );
}
