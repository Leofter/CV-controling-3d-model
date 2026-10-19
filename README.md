# e-Agro 3D Studio

Aplicação para catálogo, criação e manipulação por gestos de modelos agrícolas 3D. A implementação nova vive em `frontend/` e `backend/`; o playground original foi mantido na raiz como referência histórica.

## Rodar localmente

Use somente este comando na raiz do projeto:

```bash
./eagro.sh start
```

Ele cria o ambiente Python em `backend/.venv` quando necessário, instala as dependências na primeira execução, inicia FastAPI e serve o frontend pela mesma URL. Abra `http://127.0.0.1:8080`.

Para encerrar completamente o programa e seu servidor:

```bash
./eagro.sh stop
```

Para consultar o estado: `./eagro.sh status`. Permita câmera e microfone quando o navegador solicitar. Por padrão, `EAGRO_GENERATOR=procedural`: o backend gera uma malha orgânica colorida baseada na imagem para testar todo o fluxo sem GPU, API externa ou chave. Para selecionar outro adapter, defina `EAGRO_GENERATOR=local` ou `cloud`; o último exige `EAGRO_3D_API_URL` e `EAGRO_3D_API_KEY`.

## Estrutura

- `backend/src/domain`: entidades e interfaces de negócio.
- `backend/src/application`: casos de uso de listagem, upload e imagem-para-3D.
- `backend/src/infrastructure`: Rembg/Pillow, geradores 3D, Trimesh e armazenamento local.
- `backend/src/presentation`: API FastAPI e composição das dependências.
- `frontend/js`: estado, orquestração, adaptadores Three.js/MediaPipe/voz/API e views.

---

# 3D Model Playground (referência original)

Control 3D models using hand gestures and voice commands in real-time.

An interactive web app built with threejs, mediapipe computer vision, web speech API, and rosebud AI.

- Say "drag", "rotate", "scale", or "animate" to change the interaction mode
- Pinch fingers to control the 3D model
- Drag/drop a new 3D model onto the page to import it (GLB/GLTF format)

[Video](https://youtu.be/_I1E44Fp1Es?si=lR2otqR_-ZGdIGXT) | [Live Demo](https://collidingscopes.github.io/3d-model-playground/)

## Requirements

- Modern web browser with WebGL support
- Camera / microphone access

## Technologies

- **Three.js** for 3D rendering
- **MediaPipe** for hand tracking and gesture recognition
- **Web Speech API** for speech recognition
- **HTML5 Canvas** for visual feedback
- **JavaScript** for real-time interaction

## Setup for Development

```bash
# Clone this repository
git clone https://github.com/collidingScopes/3d-model-playground

# Navigate to the project directory
cd 3d-model-playground

# Serve with your preferred method (example using Python)
python -m http.server
```

Then navigate to `http://localhost:8080` in your browser.

## License

MIT License

## Credits

https://github.com/collidingScopes/3d-model-playground
