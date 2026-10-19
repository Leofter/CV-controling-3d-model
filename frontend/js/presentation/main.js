import { AppStateController } from '../application/AppStateController.js';
import { PlaygroundOrchestrator } from '../application/PlaygroundOrchestrator.js';
import { SceneManager } from '../infrastructure/threejs/SceneManager.js';
import { ModelLoader } from '../infrastructure/threejs/ModelLoader.js';
import { TransformController } from '../infrastructure/threejs/TransformController.js';
import { HandTrackerService } from '../infrastructure/mediapipe/HandTrackerService.js';
import { VoiceCommandService } from '../infrastructure/speech/VoiceCommandService.js';
import { AgroBackendClient } from '../infrastructure/api/AgroBackendClient.js';
import { HomeView } from './views/HomeView.js';
import { ModelLibraryModal } from './views/ModelLibraryModal.js';
import { ImageTo3DWizardView } from './views/ImageTo3DWizardView.js';

const homeView = new HomeView(document.querySelector('#app'));
const state = new AppStateController();
const transformController = new TransformController();
let orchestrator;
const handTracker = new HandTrackerService({ container: homeView.elements.camera, onGesture: (gesture) => orchestrator?.onGesture(gesture) });
const voiceService = new VoiceCommandService({
  onCommand: (mode) => orchestrator?.setMode(mode),
  onTranscript: (transcript) => homeView.showVoice(transcript),
});

orchestrator = new PlaygroundOrchestrator({
  state, sceneManager: new SceneManager(homeView.elements.scene), modelLoader: new ModelLoader(), transformController,
  handTracker, voiceService, backendClient: new AgroBackendClient(), homeView,
  libraryModal: new ModelLibraryModal(document.body), wizardView: new ImageTo3DWizardView(document.body),
});
orchestrator.initialize();
