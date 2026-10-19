export class ModelLibraryModal {
  constructor(root) { this.root = root; this.dialog = null; }

  open(models, activeModel, handlers) {
    this.close();
    this.dialog = document.createElement('div');
    this.dialog.className = 'modal-backdrop';
    this.dialog.innerHTML = `<section class="modal library-modal" role="dialog" aria-modal="true" aria-label="Biblioteca de modelos">
      <div class="modal-header"><div><p class="eyebrow">CATÁLOGO</p><h2>Modelos agrícolas</h2></div><button class="icon-button" data-close aria-label="Fechar">×</button></div>
      <div class="library-tools"><label class="upload-button">Subir modelo 3D <input type="file" accept=".glb,.gltf" data-upload hidden></label><p>Arquivos GLB ou GLTF serão centralizados e normalizados automaticamente.</p></div>
      <div class="model-grid" data-grid>${models.length ? models.map((model) => card(model, activeModel)).join('') : '<div class="empty-library">O catálogo ainda está vazio.<br>Envie um GLB/GLTF ou crie por imagem.</div>'}</div>
      <form class="upload-form" data-upload-form hidden><input name="name" placeholder="Nome do modelo" required maxlength="100"><select name="category"><option value="fruit">Fruta</option><option value="plant">Planta</option><option value="seed">Semente</option><option value="seedling">Muda</option><option value="machinery">Maquinário</option><option value="other">Outros</option></select><button class="button run" type="submit">Salvar no catálogo</button></form>
    </section>`;
    this.root.append(this.dialog);
    this.dialog.querySelector('[data-close]').addEventListener('click', () => this.close());
    this.dialog.addEventListener('click', (event) => { if (event.target === this.dialog) this.close(); });
    this.dialog.querySelector('[data-grid]').addEventListener('click', (event) => { const cardElement = event.target.closest('[data-model-id]'); if (cardElement) handlers.onSelect(cardElement.dataset.modelId); });
    const upload = this.dialog.querySelector('[data-upload]'); const form = this.dialog.querySelector('[data-upload-form]');
    upload.addEventListener('change', () => { form.hidden = !upload.files[0]; if (upload.files[0]) form.querySelector('[name="name"]').value = upload.files[0].name.replace(/\.(glb|gltf)$/i, ''); });
    form.addEventListener('submit', async (event) => { event.preventDefault(); const data = new FormData(form); await handlers.onUpload({ file: upload.files[0], name: data.get('name'), category: data.get('category') }); });
  }

  close() { this.dialog?.remove(); this.dialog = null; }
}

function card(model, active) {
  const thumbnail = model.thumbnailUrl ? `<img src="${model.thumbnailUrl}" alt="">` : `<span>${({ fruit: '🍊', plant: '🌿', seed: '◉', seedling: '🌱', machinery: '⚙' })[model.category] || '◈'}</span>`;
  return `<button class="model-card ${active?.id === model.id ? 'selected' : ''}" data-model-id="${model.id}"><div class="model-thumbnail">${thumbnail}</div><span class="model-category">${model.category}</span><strong>${escapeHtml(model.name)}</strong><small>${model.source === 'image-ai' ? 'Gerado por imagem' : 'Modelo enviado'}</small></button>`;
}
function escapeHtml(value) { const element = document.createElement('span'); element.textContent = value; return element.innerHTML; }
