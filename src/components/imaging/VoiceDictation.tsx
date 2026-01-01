"use client";

import { useState, useEffect, useRef } from "react";

interface VoiceDictationProps {
  onTranscript?: (text: string) => void;
  onComplete?: (text: string) => void;
}

export default function VoiceDictation({
  onTranscript,
  onComplete,
}: VoiceDictationProps) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [isSupported, setIsSupported] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Check if browser supports Web Speech API
    if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
      setIsSupported(true);
      const SpeechRecognition =
        (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();

      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.language = "en-US";

      recognitionRef.current.onresult = (event: any) => {
        let interim = "";
        let final = "";

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcriptPiece = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            final += transcriptPiece + " ";
          } else {
            interim += transcriptPiece;
          }
        }

        if (final) {
          const newTranscript = transcript + final;
          setTranscript(newTranscript);
          onTranscript?.(newTranscript);
        }

        setInterimTranscript(interim);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        if (isListening) {
          // Restart if still listening
          recognitionRef.current.start();
        }
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [transcript, isListening]);

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      setTranscript("");
      setInterimTranscript("");
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
      setInterimTranscript("");
      if (transcript) {
        onComplete?.(transcript);
      }
    }
  };

  const clearTranscript = () => {
    setTranscript("");
    setInterimTranscript("");
  };

  const insertMacro = (text: string) => {
    const newTranscript = transcript + text + " ";
    setTranscript(newTranscript);
    onTranscript?.(newTranscript);
  };

  const macros = [
    { label: "Normal", text: "The examination is within normal limits." },
    { label: "No Acute", text: "No acute findings." },
    {
      label: "Correlate",
      text: "Correlation with clinical findings is recommended.",
    },
    { label: "Follow-up", text: "Follow-up imaging is recommended." },
    { label: "Recommend", text: "Further evaluation with" },
    { label: "Comparison", text: "Compared to prior study dated" },
  ];

  if (!isSupported) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center text-gray-500">
          <p className="mb-2">
            Voice dictation is not supported in this browser.
          </p>
          <p className="text-sm">
            Please use Chrome, Edge, or Safari for voice dictation features.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex justify-between items-center">
        <h3 className="text-lg font-semibold">Voice Dictation</h3>
        <div className="flex items-center space-x-2">
          {isListening && (
            <div className="flex items-center space-x-2 text-red-600">
              <div className="animate-pulse">
                <div className="w-3 h-3 bg-red-600 rounded-full"></div>
              </div>
              <span className="text-sm font-medium">Listening...</span>
            </div>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="p-4 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center justify-center space-x-4">
          {!isListening ? (
            <button
              onClick={startListening}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                />
              </svg>
              <span>Start Dictation</span>
            </button>
          ) : (
            <button
              onClick={stopListening}
              className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center space-x-2"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z"
                />
              </svg>
              <span>Stop Dictation</span>
            </button>
          )}
          {transcript && (
            <button
              onClick={clearTranscript}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Macros */}
      <div className="p-4 border-b border-gray-200">
        <div className="text-sm font-medium text-gray-700 mb-2">
          Quick Phrases:
        </div>
        <div className="flex flex-wrap gap-2">
          {macros.map((macro) => (
            <button
              key={macro.label}
              onClick={() => insertMacro(macro.text)}
              className="px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 text-sm"
            >
              {macro.label}
            </button>
          ))}
        </div>
      </div>

      {/* Transcript Display */}
      <div className="p-4">
        <div className="min-h-[200px] max-h-[400px] overflow-y-auto">
          {transcript || interimTranscript ? (
            <p className="text-gray-900 whitespace-pre-wrap">
              {transcript}
              {interimTranscript && (
                <span className="text-gray-400">{interimTranscript}</span>
              )}
            </p>
          ) : (
            <p className="text-gray-400 text-center mt-12">
              Transcript will appear here...
            </p>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 bg-gray-50 border-t border-gray-200 text-xs text-gray-600">
        <div className="flex justify-between items-center">
          <div>
            Words: {transcript.split(" ").filter((w) => w.length > 0).length}
          </div>
          <div>Tip: Speak clearly and pause between sentences</div>
        </div>
      </div>
    </div>
  );
}
