<script lang="ts">
  import { enhance } from '$app/forms';
  import type { PageData, ActionData } from './$types';

  let { data, form }: { data: PageData; form: ActionData } = $props();

  let showModal = $state(false);
  let nombre = $state('');

  function abrir() {
    showModal = true;
  }
  function cerrar() {
    showModal = false;
    nombre = '';
  }

  function autofocus(node: HTMLInputElement) {
    node.focus();
  }
  function autofocusEdit(node: HTMLInputElement) {
    node.focus();
    node.select();
  }

  const fmtFecha = (d: Date | string | number) =>
    new Date(d).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });

  // Edición inline del nombre del menú.
  let editingId = $state<number | null>(null);
  let editValue = $state('');
  function startEdit(m: { id: number; nombre: string }) {
    editingId = m.id;
    editValue = m.nombre;
  }
  function cancelEdit() {
    editingId = null;
    editValue = '';
  }
</script>

<svelte:window
  onkeydown={(e) => {
    if (e.key === 'Escape' && showModal) cerrar();
  }}
/>

<section class="menus">
  <header class="head">
    <h1>{data.proyecto.nombre}</h1>
    <button type="button" class="btn-nuevo" onclick={abrir}>+ Agregar Menu</button>
  </header>

  {#if data.menus.length === 0}
    <p class="vacio">Aún no hay menús. Crea el primero con “Agregar Menu”.</p>
  {:else}
    <ul class="lista">
      {#each data.menus as m (m.id)}
        <li class="item" class:editing={editingId === m.id}>
          {#if editingId === m.id}
            <form
              method="POST"
              action="?/renombrarMenu"
              class="edit-form"
              use:enhance={() => {
                return async ({ result, update }) => {
                  await update({ reset: false });
                  if (result.type === 'success') cancelEdit();
                };
              }}
            >
              <input type="hidden" name="menuId" value={m.id} />
              <input
                use:autofocusEdit
                class="edit-input"
                name="nombre"
                bind:value={editValue}
                autocomplete="off"
                onkeydown={(e) => {
                  if (e.key === 'Escape') cancelEdit();
                }}
              />
              <button type="submit" class="icon-btn save" aria-label="Guardar" title="Guardar">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
              </button>
              <button type="button" class="icon-btn" onclick={cancelEdit} aria-label="Cancelar" title="Cancelar">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </button>
            </form>
          {:else}
            <a class="item-link" href={`/menus/${m.id}`}>
              <span class="item-nombre">{m.nombre}</span>
            </a>
            {#if m.creadoEn}<span class="item-fecha">{fmtFecha(m.creadoEn)}</span>{/if}
            <button
              type="button"
              class="icon-btn edit"
              onclick={() => startEdit(m)}
              aria-label="Editar nombre"
              title="Editar nombre"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z" /></svg>
            </button>
          {/if}
        </li>
      {/each}
    </ul>
  {/if}
</section>

{#if showModal}
  <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
  <div class="overlay" onclick={cerrar}>
    <div
      class="modal"
      role="dialog"
      tabindex="-1"
      aria-modal="true"
      aria-label="Nuevo menú"
      onclick={(e) => e.stopPropagation()}
    >
      <h2>Nuevo menú</h2>
      <form
        method="POST"
        action="?/agregarMenu"
        use:enhance={() => {
          return async ({ result, update }) => {
            await update();
            if (result.type === 'success') cerrar();
          };
        }}
      >
        <input
          use:autofocus
          type="text"
          name="nombre"
          placeholder="Nombre del menú"
          bind:value={nombre}
          autocomplete="off"
        />
        {#if form?.error}<p class="error">{form.error}</p>{/if}
        <div class="acciones">
          <button type="button" class="btn-cancelar" onclick={cerrar}>Cancelar</button>
          <button type="submit" class="btn-ok">Ok</button>
        </div>
      </form>
    </div>
  </div>
{/if}

<style>
  .menus {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
  }
  .head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    flex-wrap: wrap;
  }
  h1 {
    margin: 0;
    font-size: 1.5rem;
    color: #1e293b;
  }

  .btn-nuevo {
    background: #2563eb;
    color: #fff;
    border: none;
    border-radius: 10px;
    padding: 0.6rem 1.1rem;
    font-size: 0.95rem;
    font-weight: 600;
    cursor: pointer;
    box-shadow: 0 2px 8px rgba(37, 99, 235, 0.35);
    transition: background 0.18s ease, transform 0.12s ease;
  }
  .btn-nuevo:hover {
    background: #1d4ed8;
  }
  .btn-nuevo:active {
    transform: translateY(1px);
  }

  .vacio {
    color: rgba(30, 41, 59, 0.65);
    font-size: 0.95rem;
    margin: 0;
  }

  .lista {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
  }
  .item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.85rem 1.1rem;
    background: rgba(255, 255, 255, 0.55);
    border: 1px solid rgba(0, 0, 0, 0.08);
    border-radius: 12px;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
    transition: background 0.18s ease, border-color 0.18s ease;
  }
  .item:hover {
    background: rgba(255, 255, 255, 0.8);
    border-color: rgba(37, 99, 235, 0.35);
  }
  .item.editing {
    border-color: rgba(37, 99, 235, 0.45);
    background: rgba(255, 255, 255, 0.85);
  }
  .item-link {
    flex: 1;
    min-width: 0;
    text-decoration: none;
  }
  .item-nombre {
    color: #1e293b;
    font-weight: 500;
  }
  .item-fecha {
    color: rgba(30, 41, 59, 0.55);
    font-size: 0.8rem;
    white-space: nowrap;
  }

  /* Edición inline */
  .edit-form {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    flex: 1;
    min-width: 0;
  }
  .edit-input {
    flex: 1;
    min-width: 0;
    padding: 0.4rem 0.6rem;
    font-size: 0.95rem;
    border: 1px solid rgba(37, 99, 235, 0.5);
    border-radius: 8px;
    outline: none;
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
  }
  .icon-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 2rem;
    height: 2rem;
    flex-shrink: 0;
    padding: 0;
    background: transparent;
    border: 1px solid transparent;
    border-radius: 8px;
    color: rgba(30, 41, 59, 0.45);
    cursor: pointer;
    transition: background 0.18s ease, color 0.18s ease, border-color 0.18s ease;
  }
  .icon-btn:hover {
    background: rgba(0, 0, 0, 0.06);
    color: #1e293b;
  }
  /* Lápiz de editar: azul para que sea visible como acción. */
  .icon-btn.edit {
    color: #2563eb;
    border-color: rgba(37, 99, 235, 0.25);
  }
  .icon-btn.edit:hover {
    background: rgba(37, 99, 235, 0.12);
    border-color: rgba(37, 99, 235, 0.45);
    color: #2563eb;
  }
  .icon-btn.save {
    color: #16a34a;
  }
  .icon-btn.save:hover {
    background: rgba(22, 163, 74, 0.12);
    color: #15803d;
  }

  /* Modal */
  .overlay {
    position: fixed;
    inset: 0;
    background: rgba(15, 23, 42, 0.45);
    backdrop-filter: blur(2px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 50;
    padding: 1rem;
  }
  .modal {
    width: 100%;
    max-width: 400px;
    background: #fff;
    border-radius: 16px;
    padding: 1.5rem;
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.25);
  }
  .modal h2 {
    margin: 0 0 1rem;
    font-size: 1.2rem;
    color: #1e293b;
  }
  .modal input {
    width: 100%;
    box-sizing: border-box;
    padding: 0.7rem 0.9rem;
    font-size: 1rem;
    border: 1px solid rgba(0, 0, 0, 0.18);
    border-radius: 10px;
    outline: none;
    transition: border-color 0.18s ease, box-shadow 0.18s ease;
  }
  .modal input:focus {
    border-color: #2563eb;
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15);
  }
  .error {
    color: #dc2626;
    font-size: 0.85rem;
    margin: 0.6rem 0 0;
  }
  .acciones {
    display: flex;
    justify-content: flex-end;
    gap: 0.6rem;
    margin-top: 1.25rem;
  }
  .btn-cancelar {
    background: transparent;
    color: rgba(30, 41, 59, 0.75);
    border: 1px solid rgba(0, 0, 0, 0.15);
    border-radius: 10px;
    padding: 0.55rem 1rem;
    font-size: 0.9rem;
    cursor: pointer;
    transition: background 0.18s ease;
  }
  .btn-cancelar:hover {
    background: rgba(0, 0, 0, 0.05);
  }
  .btn-ok {
    background: #16a34a;
    color: #fff;
    border: none;
    border-radius: 10px;
    padding: 0.55rem 1.4rem;
    font-size: 0.95rem;
    font-weight: 600;
    cursor: pointer;
    box-shadow: 0 2px 8px rgba(22, 163, 74, 0.35);
    transition: background 0.18s ease, transform 0.12s ease;
  }
  .btn-ok:hover {
    background: #15803d;
  }
  .btn-ok:active {
    transform: translateY(1px);
  }
</style>
