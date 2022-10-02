<script lang="ts">
  import type { PageData } from './$types';

  export let data: PageData;
</script>

<div class="container">
  <h1>OAuth Provider для студентов Школы 21</h1>
  {#if data.auth !== null}
    <pre>{JSON.stringify(data.auth, null, 2)}</pre>
  {:else}
    <a href="/api/auth/signin/42-school">Авторизоваться через Интру</a>
  {/if}
</div>

<style lang="scss">
  .container {
    max-width: 800px;
    margin: 0 auto;
  }
</style>
