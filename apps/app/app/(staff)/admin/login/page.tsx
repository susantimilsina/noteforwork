import { redirect } from 'next/navigation';

/** Old admin sign-in URL → shared staff sign-in. */
export default function OldAdminLogin() {
  redirect('/staff/login');
}
