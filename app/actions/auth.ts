'use server';

import { cookies } from 'next/headers';
import { Resend } from 'resend';

// Initialize Resend
const resend = new Resend('re_EGScgPr2_Ak8qHYEmLerExUutzCfBFoGH');

export async function loginAction(formData: FormData) {
  const username = formData.get('username') as string;
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if ((!username && !email) || !password) {
    return { error: 'Username/Email and password are required' };
  }

  const identifier = username || email;

  // Set auth cookie
  cookies().set('auth-token', identifier, { 
    path: '/',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 7 // 1 week
  });

  return { success: true };
}

export async function signupAction(formData: FormData) {
  const username = formData.get('username') as string;
  const password = formData.get('password') as string;
  const email = formData.get('email') as string;

  if (!username || !password || !email) {
    return { error: 'Username, email and password are required' };
  }

  // Send welcome email via Resend
  try {
    await resend.emails.send({
      from: 'CallHub <onboarding@resend.dev>',
      to: email,
      subject: 'Welcome to CallHub!',
      html: `<p>Hi ${username}, welcome to CallHub!</p>`
    });
  } catch (e) {
    console.error('Failed to send email:', e);
  }

  // Set auth cookie
  cookies().set('auth-token', username, { 
    path: '/',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 7 // 1 week
  });

  return { success: true };
}

export async function logoutAction() {
  cookies().delete('auth-token');
  return { success: true };
}