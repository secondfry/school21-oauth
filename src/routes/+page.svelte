<script lang="ts">
  import type { PageData } from './$types';

  export let data: PageData;
</script>

<div class="container">
  <h1>OAuth Provider для студентов Школы 21</h1>
  {#if data.auth !== null}
    <a href="/api/auth/signout">Выйти</a>
    <h2>Данные сессии</h2>
    <pre>{JSON.stringify(data.auth, null, 2)}</pre>
  {:else}
    <a href="/api/auth/signin">Аутентификация</a>
  {/if}
</div>

<style lang="scss">
  .container {
    max-width: 800px;
    margin: 0 auto;
  }
</style>
