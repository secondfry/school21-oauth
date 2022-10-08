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
    <p>
      В случае использования аутентификации по email, указывайте вашу почту в
      домене <code>student.21-school.ru</code> или <code>21-school.ru</code>.<br
      />
      К примеру, я бы указал <code>oadhesiv@student.21-school.ru</code>.
    </p>
  {/if}
  <h2>Регистрация нового OAuth клиента в виде Вашего приложения</h2>
  <p>...делается сейчас вручную, приходите в личку в Телеграме.</p>
  <hr />
  Rustam SecondFry Gubaydullin,
  <a href="https://github.com/secondfry/school21-oauth">исходники</a>,
  <a href="https://t.me/randomcoffeefrybot">участвуй в случайном кофе</a>!
</div>

<style lang="scss">
  .container {
    max-width: 800px;
    margin: 0 auto;
  }
</style>
