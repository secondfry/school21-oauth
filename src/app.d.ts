import type { Session } from 'next-auth/core/types';

// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
// and what to do when importing types
declare global {
  declare namespace App {
    interface Locals {
      auth: Session | null;
      sessionTokenHasBeenSet: boolean | undefined;
    }
  }
}
