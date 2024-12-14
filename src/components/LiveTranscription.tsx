"use client";
import { useState, useEffect, useRef } from "react";
import {
  Mic,
  MicOff,
  Copy,
  X,
  Loader2,
  Edit3,
  Smartphone,
  Zap,
} from "lucide-react";
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
  const [activeTab, setActiveTab] = useState<"transcription" | "summary">(
    "transcription"
  );
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
      <div className="w-full max-w-md sm:max-w-2xl bg-gray-800 shadow-2xl rounded-3xl overflow-hidden border border-gray-700 transform transition-all duration-300 hover:scale-[1.02]">
        {/* Gradient Header with Responsive Layout */}
        <div className="bg-gradient-to-r from-indigo-800 to-purple-900 p-4 sm:p-6 text-white ">
          <h1 className="text-2xl sm:text-3xl font-bold text-center flex items-center justify-center gap-3">
            <Mic className="w-8 h-8 sm:w-10 sm:h-10 text-indigo-300" />
            Live Meeting Transcription
          </h1>
        </div>

        {/* Mobile-Friendly Tabs */}
        <div className="flex border-b border-gray-700">
          <button
            onClick={() => setActiveTab("transcription")}
            className={`flex-1 flex items-center justify-center p-3 space-x-2 ${
              activeTab === "transcription"
                ? "bg-indigo-900 text-white"
                : "bg-gray-800 text-gray-400 hover:bg-gray-700"
            }`}
          >
            <Smartphone className="w-5 h-5" />
            <span className="hidden sm:inline">Transcription</span>
          </button>
          <button
            onClick={() => setActiveTab("summary")}
            className={`flex-1 flex items-center justify-center p-3 space-x-2 ${
              activeTab === "summary"
                ? "bg-indigo-900 text-white"
                : "bg-gray-800 text-gray-400 hover:bg-gray-700"
            }`}
          >
            <Zap className="w-5 h-5" />
            <span className="hidden sm:inline">Summary</span>
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-4">
          {/* Listening Controls - Now Stacked on Mobile */}
          <div className="flex flex-col sm:flex-row justify-center space-y-2 sm:space-y-0 sm:space-x-4">
            <button
              onClick={startListening}
              disabled={isListening}
              className={`w-full sm:w-auto flex items-center justify-center gap-2 px-4 sm:px-6 py-2 sm:py-3 rounded-full font-semibold transition-all duration-300 ${
                isListening
                  ? "bg-gray-600 cursor-not-allowed text-gray-400"
                  : "bg-green-700 hover:bg-green-800 text-white hover:scale-105"
              }`}
            >
              <Mic className="w-4 h-4 sm:w-5 sm:h-5" />
              {isListening ? "Listening..." : "Start Listening"}
            </button>

            <button
              onClick={stopListening}
              disabled={!isListening}
              className={`w-full sm:w-auto flex items-center justify-center gap-2 px-4 sm:px-6 py-2 sm:py-3 rounded-full font-semibold transition-all duration-300 ${
                !isListening
                  ? "bg-gray-600 cursor-not-allowed text-gray-400"
                  : "bg-red-700 hover:bg-red-800 text-white hover:scale-105"
              }`}
            >
              <MicOff className="w-4 h-4 sm:w-5 sm:h-5" />
              Stop Listening
            </button>
          </div>

          {/* Conditional Rendering Based on Active Tab */}
          {activeTab === "transcription" && (
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
                    <p className="whitespace-pre-wrap text-gray-200 pr-12 max-h-[300px] overflow-y-auto">
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
          )}

          {activeTab === "summary" && (
            <div className="bg-gray-700 border-2 border-gray-600 rounded-xl p-4">
              {summarizedText ? (
                <ReactMarkdown className="prose prose-invert text-gray-200 max-h-[300px] overflow-y-auto">
                  {summarizedText}
                </ReactMarkdown>
              ) : (
                <p className="text-center text-gray-500 italic">
                  No summary available. Generate a summary first.
                </p>
              )}
            </div>
          )}

          {/* Summarize Button - Centered and Full Width on Mobile */}
          {transcription && activeTab === "transcription" && (
            <div className="flex justify-center">
              <button
                onClick={summarizeTranscription}
                disabled={isLoading}
                className="w-full sm:w-auto mt-4 px-6 py-3 bg-blue-700 hover:bg-blue-800 text-white font-semibold rounded-full transition-all duration-300 flex items-center justify-center gap-2"
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
        </div>
      </div>
    </div>
  );
}

export default LiveTranscription;
