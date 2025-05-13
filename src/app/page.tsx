import { redirect } from 'next/navigation';

export default function HomePage() {
  // Redirect to the dashboard, as it's the main entry point after login.
  // In a real app, you might have a landing page here or auth checks.
  redirect('/dashboard');
}
