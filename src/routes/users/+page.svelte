<script lang="ts">
  import { enhance } from '$app/forms';
  import Avatar from '$lib/Avatar.svelte';
  import type { PageData, ActionData } from './$types';

  let { data, form }: { data: PageData; form: ActionData } = $props();
  const meId = $derived(data.user?.id ?? -1);

  function fmt(d: Date | string | number) {
    return new Date(d).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' });
  }
</script>

<section class="wrap">
  <h1>Usuarios</h1>
  <p class="lead">Quiénes pueden entrar al sistema. Da de alta desde aquí.</p>

  <ul class="lista">
    {#each data.users as u (u.id)}
      <li class="item">
        <div class="left">
          <Avatar username={u.username} size={38} />
          <div class="info">
            <span class="name">
              {u.username}
              {#if u.isAdmin}<span class="admin-badge">admin</span>{/if}
              {#if u.id === meId}<span class="you">tú</span>{/if}
            </span>
            <span class="meta">desde {fmt(u.creadoEn)}</span>
          </div>
        </div>
        {#if u.id !== meId}
          <form
            method="POST"
            action="?/delete"
            use:enhance={() => {
              return async ({ result, update }) => {
                await update();
              };
            }}
          >
            <input type="hidden" name="userId" value={u.id} />
            <button
              class="btn danger sm"
              type="submit"
              onclick={(e) => {
                if (!confirm(`¿Borrar al usuario "${u.username}"? Perderá el acceso.`)) e.preventDefault();
              }}
            >
              Borrar
            </button>
          </form>
        {/if}
      </li>
    {/each}
  </ul>
  {#if form?.deleteError}<span class="err" role="alert">{form.deleteError}</span>{/if}

  <div class="add">
    <h2>Agregar usuario</h2>
    <form method="POST" action="?/create" use:enhance>
      <div class="fields">
        <input name="username" type="text" placeholder="Usuario" value={form?.username ?? ''} autocomplete="off" />
        <input name="password" type="password" placeholder="Contraseña (mín. 4)" autocomplete="new-password" />
        <button class="btn primary" type="submit">Agregar</button>
      </div>
      <label class="chk"><input type="checkbox" name="isAdmin" /> Administrador (puede gestionar usuarios y negocios)</label>
      {#if form?.createError}<span class="err" role="alert">{form.createError}</span>{/if}
    </form>
  </div>
</section>

<style>
  .wrap {
    max-width: 640px;
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }
  h1 {
    margin: 0.5rem 0 0;
    font-size: 1.5rem;
    color: #1e293b;
  }
  .lead {
    color: rgba(30, 41, 59, 0.6);
    margin: 0 0 1rem;
    font-size: 0.9rem;
  }
  .lista {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  .item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    padding: 0.8rem 1.1rem;
    background: rgba(255, 255, 255, 0.55);
    border: 1px solid rgba(0, 0, 0, 0.08);
    border-radius: 12px;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
  }
  .left {
    display: flex;
    align-items: center;
    gap: 0.7rem;
  }
  .info {
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
  }
  .name {
    font-weight: 600;
    color: #1e293b;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  .you {
    font-size: 0.66rem;
    font-weight: 700;
    text-transform: uppercase;
    color: #1d4ed8;
    background: rgba(37, 99, 235, 0.12);
    border-radius: 999px;
    padding: 0.1rem 0.45rem;
  }
  .admin-badge {
    font-size: 0.66rem;
    font-weight: 700;
    text-transform: uppercase;
    color: #15803d;
    background: rgba(22, 163, 74, 0.12);
    border: 1px solid rgba(22, 163, 74, 0.3);
    border-radius: 999px;
    padding: 0.1rem 0.45rem;
  }
  .meta {
    font-size: 0.78rem;
    color: rgba(30, 41, 59, 0.55);
  }
  .add {
    margin-top: 1.5rem;
    padding-top: 1.3rem;
    border-top: 1px solid rgba(0, 0, 0, 0.08);
  }
  .add h2 {
    font-size: 0.95rem;
    font-weight: 700;
    color: #1e293b;
    margin: 0 0 0.8rem;
  }
  .fields {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
  }
  .chk {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    margin-top: 0.7rem;
    font-size: 0.85rem;
    color: rgba(30, 41, 59, 0.75);
  }
  .chk input {
    accent-color: #2563eb;
  }
  input[type='text'],
  input[type='password'] {
    font: inherit;
    font-size: 1rem;
    color: #1e293b;
    background: #ffffff;
    border: 1px solid rgba(0, 0, 0, 0.18);
    border-radius: 10px;
    padding: 0.55rem 0.75rem;
    flex: 1;
    min-width: 140px;
    box-sizing: border-box;
  }
  input:focus {
    outline: none;
    border-color: #2563eb;
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15);
  }
  .btn {
    font: inherit;
    font-weight: 600;
    padding: 0.55rem 1.1rem;
    border-radius: 10px;
    border: 1px solid transparent;
    cursor: pointer;
  }
  .btn.sm {
    padding: 0.4rem 0.8rem;
    font-size: 0.82rem;
  }
  .btn.primary {
    background: #2563eb;
    color: #ffffff;
  }
  .btn.primary:hover {
    background: #1d4ed8;
  }
  .btn.danger {
    background: transparent;
    border-color: rgba(220, 38, 38, 0.4);
    color: #dc2626;
  }
  .btn.danger:hover {
    background: rgba(220, 38, 38, 0.08);
  }
  .err {
    display: block;
    margin-top: 0.5rem;
    font-size: 0.8rem;
    color: #dc2626;
  }
</style>
