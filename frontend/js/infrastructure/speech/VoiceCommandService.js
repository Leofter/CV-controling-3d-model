const commands = new Map([
  ['arrastar', 'drag'], ['arraste', 'drag'], ['drag', 'drag'],
  ['girar', 'rotate'], ['rotação', 'rotate'], ['rotacao', 'rotate'], ['rotate', 'rotate'],
  ['escala', 'scale'], ['aumentar', 'scale'], ['scale', 'scale'],
  ['animar', 'animate'], ['animação', 'animate'], ['animacao', 'animate'], ['animate', 'animate'],
]);

export class VoiceCommandService {
  constructor({ onCommand, onTranscript = () => {}, language = 'pt-BR' }) {
    this.onCommand = onCommand; this.onTranscript = onTranscript; this.language = language;
    this.recognition = null; this.enabled = false;
  }

  get supported() { return Boolean(window.SpeechRecognition || window.webkitSpeechRecognition); }

  start() {
    if (!this.supported || this.enabled) return false;
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    this.recognition = new Recognition();
    this.recognition.lang = this.language; this.recognition.continuous = true; this.recognition.interimResults = true;
    this.recognition.onresult = (event) => {
      const transcript = Array.from(event.results).slice(event.resultIndex).map((item) => item[0].transcript).join(' ').toLowerCase();
      this.onTranscript(transcript);
      if ([...event.results].some((result, index) => index >= event.resultIndex && result.isFinal)) {
        const command = [...commands.entries()].find(([phrase]) => transcript.includes(phrase))?.[1];
        if (command) this.onCommand(command);
      }
    };
    this.recognition.onend = () => { if (this.enabled) try { this.recognition.start(); } catch (_) {} };
    this.enabled = true;
    try { this.recognition.start(); return true; } catch (_) { this.enabled = false; return false; }
  }

  stop() { this.enabled = false; this.recognition?.stop(); }
}
