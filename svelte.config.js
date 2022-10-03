import adapter from '@sveltejs/adapter-node';
import preprocess from 'svelte-preprocess';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  // Consult https://github.com/sveltejs/svelte-preprocess
  // for more information about preprocessors
  preprocess: [
    preprocess({
      scss: {
        prependData: '@use "src/variables.scss" as *;',
      },
    }),
  ],

  kit: {
    adapter: adapter(),
    alias: {
      $src: './src',
    },
    csrf: {
      // NOTE(secondfry): 2 hours down the drain
      // lost somethere in between of Docker/SvelteKit/next-auth
      // tl;dr is, for whatever reason:
      // console.log(request.headers.get('origin'), url.origin);
      // // http://127.0.0.1:5173 https://127.0.0.1:5173
      checkOrigin: false,
    },
    prerender: {
      // FIXME(secondfry): could provide dotenv into Docker build context
      // but whatever.
      enabled: false,
    },
  },
};

export default config;
