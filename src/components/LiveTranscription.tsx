"use client";
import { useState, useEffect, useRef } from "react";
import { Mic, MicOff, Copy, X, Loader2, Edit3 } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  error: string;
}

interface SpeechRecognition {
  continuous: boolean;
  interimResults: boolean;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: SpeechRecognitionEvent) => void;
  start: () => void;
  stop: () => void;
}

declare global {
  interface Window {
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

function LiveTranscription() {
  const [transcription, setTranscription] = useState<string>("");
  const [summarizedText, setSummarizedText] = useState<string>("");
  const [isListening, setIsListening] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const recognition = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    if (!("webkitSpeechRecognition" in window)) {
      alert("Speech Recognition is not supported in this browser.");
      return;
    }

    recognition.current = new window.webkitSpeechRecognition();
    recognition.current.continuous = true;
    recognition.current.interimResults = false;

    recognition.current.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = Array.from(event.results)
        .map((result) => result[0].transcript)
        .join("");
      setTranscription((prev) => prev + transcript);
    };

    recognition.current.onerror = (event: SpeechRecognitionEvent) => {
      if (event.error === "no-speech") {
        console.warn("No speech detected. Restarting recognition...");
        recognition.current?.start();
      } else {
        console.error("Speech Recognition Error:", event.error);
      }
    };

    return () => {
      recognition.current?.stop();
      recognition.current = null;
    };
  }, []);

  const startListening = (): void => {
    if (!recognition.current) {
      alert("Speech recognition is not initialized properly.");
      return;
    }
    recognition.current.start();
    setIsListening(true);
  };

  const stopListening = (): void => {
    if (!recognition.current) {
      alert("Speech recognition is not initialized properly.");
      return;
    }
    recognition.current.stop();
    setIsListening(false);
  };

  const summarizeTranscription = async (): Promise<void> => {
    if (!transcription) {
      alert("No transcription available to summarize.");
      return;
    }
    setIsLoading(true);
    try {
      const response = await fetch("/api/summarizer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ meetingText: transcription }),
      });

      if (!response.ok) {
        throw new Error("Failed to summarize transcription");
      }

      const data = await response.json();
      setSummarizedText(data.summary || "No summary available.");
    } catch (error) {
      console.error("Error summarizing transcription:", error);
      setSummarizedText("Failed to summarize transcription.");
    } finally {
      setIsLoading(false);
    }
  };

  const clearTranscription = (): void => {
    setTranscription("");
    setSummarizedText("");
  };

  const copyTranscription = (): void => {
    if (!transcription) return;
    navigator.clipboard
      .writeText(transcription)
      .then(() => {
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      })
      .catch((error) => console.error("Failed to copy transcription:", error));
  };

  const toggleEditing = (): void => {
    setIsEditing((prev) => !prev);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-gray-800 shadow-2xl rounded-2xl overflow-hidden border border-gray-700">
        <div className="bg-gradient-to-r from-indigo-800 to-purple-900 p-6 text-white">
          <h1 className="text-3xl font-bold text-center flex items-center justify-center gap-3">
            <Mic className="w-10 h-10 text-indigo-300" />
            Live Meeting Transcription
          </h1>
        </div>

        <div className="p-6 space-y-4">
          <div className="flex justify-center space-x-4">
            <button
              onClick={startListening}
              disabled={isListening}
              className={`flex items-center gap-2 px-6 py-3 rounded-full font-semibold transition-all duration-300 ${
                isListening
                  ? "bg-gray-600 cursor-not-allowed text-gray-400"
                  : "bg-green-700 hover:bg-green-800 text-white hover:scale-105"
              }`}
            >
              <Mic className="w-5 h-5" />
              {isListening ? "Listening..." : "Start Listening"}
            </button>

            <button
              onClick={stopListening}
              disabled={!isListening}
              className={`flex items-center gap-2 px-6 py-3 rounded-full font-semibold transition-all duration-300 ${
                !isListening
                  ? "bg-gray-600 cursor-not-allowed text-gray-400"
                  : "bg-red-700 hover:bg-red-800 text-white hover:scale-105"
              }`}
            >
              <MicOff className="w-5 h-5" />
              Stop Listening
            </button>
          </div>

          <div className="relative bg-gray-700 border-2 border-gray-600 rounded-xl p-4 min-h-[200px]">
            {transcription ? (
              <>
                <div className="absolute top-2 right-2 flex space-x-2">
                  <button
                    onClick={copyTranscription}
                    className="text-gray-400 hover:text-indigo-400 transition"
                    title="Copy Transcription"
                  >
                    {isCopied ? (
                      <span className="text-green-500 text-sm">Copied!</span>
                    ) : (
                      <Copy className="w-5 h-5" />
                    )}
                  </button>
                  <button
                    onClick={toggleEditing}
                    className="text-gray-400 hover:text-yellow-400 transition"
                    title="Edit Transcription"
                  >
                    <Edit3 className="w-5 h-5" />
                  </button>
                  <button
                    onClick={clearTranscription}
                    className="text-gray-400 hover:text-red-400 transition"
                    title="Clear Transcription"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                {isEditing ? (
                  <textarea
                    value={transcription}
                    onChange={(e) => setTranscription(e.target.value)}
                    className="w-full h-[150px] p-2 bg-gray-800 text-gray-200 border-2 border-gray-600 rounded-md"
                  />
                ) : (
                  <p className="whitespace-pre-wrap text-gray-200 pr-12">
                    {transcription}
                  </p>
                )}
              </>
            ) : (
              <p className="text-center text-gray-500 italic">
                Your transcription will appear here...
              </p>
            )}
          </div>

          {transcription && (
            <div className="flex justify-center">
              <button
                onClick={summarizeTranscription}
                disabled={isLoading}
                className="mt-4 px-6 py-3 bg-blue-700 hover:bg-blue-800 text-white font-semibold rounded-full transition-all duration-300 flex items-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Summarizing...
                  </>
                ) : (
                  "Summarize Transcription"
                )}
              </button>
            </div>
          )}

          {summarizedText && (
            <div className="bg-gray-700 border-2 border-gray-600 rounded-xl p-4 mt-4">
              <h2 className="text-lg font-semibold mb-2 text-gray-300">
                Summarized Text:
              </h2>
              <ReactMarkdown className="prose prose-invert text-gray-200">
                {summarizedText}
              </ReactMarkdown>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default LiveTranscription;
