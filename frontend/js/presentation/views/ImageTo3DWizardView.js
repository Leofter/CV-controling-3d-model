const slots = [
  ['front', 'Vista frontal', '0°', true], ['right', 'Lateral direita', '90°', false], ['back', 'Vista traseira', '180°', false], ['left', 'Lateral esquerda', '270°', false], ['top', 'Vista superior', '45°', false],
];

export class ImageTo3DWizardView {
  constructor(root) { this.root = root; this.dialog = null; }

  open({ onGenerate }) {
    this.close(); this.dialog = document.createElement('div'); this.dialog.className = 'modal-backdrop';
    this.dialog.innerHTML = `<section class="modal wizard-modal" role="dialog" aria-modal="true" aria-label="Criar modelo por imagem">
      <div class="modal-header"><div><p class="eyebrow">ASSISTENTE DE CAPTURA</p><h2>Da cultura para o 3D.</h2></div><button class="icon-button" data-close aria-label="Fechar">×</button></div>
      <p class="wizard-lead">Fotografe o objeto com luz uniforme e fundo contrastante. A vista frontal é obrigatória; os demais ângulos deixam o resultado mais completo.</p>
      <form data-form><div class="capture-slots">${slots.map(([key, label, angle, required]) => `<label class="capture-slot" data-slot="${key}"><input type="file" accept="image/png,image/jpeg,image/webp" name="${key}" ${required ? 'required' : ''}><span class="slot-icon">＋</span><strong>${label}</strong><small>${angle} · ${required ? 'Obrigatório' : key === 'top' ? 'Opcional' : 'Recomendado'}</small></label>`).join('')}</div>
      <div class="wizard-fields"><label>Nome do modelo<input name="name" required maxlength="100" placeholder="ex.: Cacau Baiano #01"></label><label>Categoria<select name="category"><option value="fruit">Fruta</option><option value="plant">Planta</option><option value="seed">Semente</option><option value="seedling">Muda</option><option value="other">Outros</option></select></label></div>
      <div class="progress-area" data-progress hidden><div class="progress-line"><span></span></div><p data-progress-text>Preparando imagens…</p></div><div class="wizard-footer"><p>O modelo será centralizado e escalado para interação natural.</p><button class="button run" type="submit">Gerar modelo 3D com IA</button></div></form>
    </section>`;
    this.root.append(this.dialog); this.dialog.querySelector('[data-close]').addEventListener('click', () => this.close());
    this.dialog.querySelectorAll('[data-slot]').forEach((slot) => slot.querySelector('input').addEventListener('change', () => slot.classList.toggle('has-file', Boolean(slot.querySelector('input').files[0]))));
    this.dialog.querySelector('[data-form]').addEventListener('submit', async (event) => {
      event.preventDefault(); const form = new FormData(event.currentTarget); const images = Object.fromEntries(slots.map(([key]) => [key, form.get(key)]).filter(([, file]) => file instanceof File && file.size));
      const setProgress = this._createProgress();
      try { await onGenerate({ name: form.get('name'), category: form.get('category'), images, setProgress }); } catch (error) { setProgress(error.message, true); }
    });
  }

  _createProgress() {
    const area = this.dialog.querySelector('[data-progress]'); const text = this.dialog.querySelector('[data-progress-text]'); const bar = area.querySelector('span');
    area.hidden = false; bar.style.width = '18%'; text.textContent = 'Removendo fundo e normalizando as imagens…';
    return (message, error = false) => { bar.style.width = error ? '100%' : '100%'; bar.classList.toggle('error', error); text.textContent = message; };
  }
  close() { this.dialog?.remove(); this.dialog = null; }
}
