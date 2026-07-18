// Text-to-speech for Spanish exercise content, using the browser's built-in
// SpeechSynthesis API. No external service or API key needed.

export function isSpeechSupported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

export function speak(text: string, lang: string = "es-ES") {
  if (!isSpeechSupported()) return;

  // Cancel any currently playing speech so overlapping clicks don't queue up.
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang;
  utterance.rate = 0.9; // slightly slower, easier to follow for a learner
  window.speechSynthesis.speak(utterance);
}
