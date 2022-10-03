import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ cookies, locals: { auth } }) => {
  const cookieReturn = cookies.get('return');
  console.log(cookieReturn);
  if (cookieReturn) {
    cookies.delete('return');
    throw redirect(307, cookieReturn);
  }

  return {
    auth,
  };
};
