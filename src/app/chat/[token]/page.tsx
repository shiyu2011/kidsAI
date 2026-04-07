"use client";

import { useState, useRef, useEffect, use } from "react";
import { sendMessage } from "@/lib/api-client";

interface Message {
  role: "kid" | "ai";
  content: string;
}

const PROJECTS = [
  {
    id: "volcano",
    title: "Build a Volcano",
    description: "Design an erupting volcano and learn why they explode",
    icon: "🌋",
    category: "Science",
    color: "from-red-500 to-orange-500",
    prompt: "I want to do the volcano project! Help me design and understand how volcanoes work.",
  },
  {
    id: "space-mission",
    title: "Space Mission",
    description: "Plan a mission to Mars and solve real space problems",
    icon: "🚀",
    category: "Science",
    color: "from-indigo-500 to-purple-500",
    prompt: "I want to plan a space mission to Mars! Help me figure out what we need.",
  },
  {
    id: "mystery-novel",
    title: "Mystery Story",
    description: "Write a detective story with twists and clues",
    icon: "🔍",
    category: "Writing",
    color: "from-amber-500 to-yellow-500",
    prompt: "I want to write a mystery story! Let's create a detective adventure together.",
  },
  {
    id: "game-designer",
    title: "Design a Game",
    description: "Invent your own video game with characters and levels",
    icon: "🎮",
    category: "Engineering",
    color: "from-green-500 to-emerald-500",
    prompt: "I want to design my own video game! Help me plan the characters, levels, and gameplay.",
  },
  {
    id: "robot-inventor",
    title: "Invent a Robot",
    description: "Design a robot that solves a real-world problem",
    icon: "🤖",
    category: "Engineering",
    color: "from-cyan-500 to-blue-500",
    prompt: "I want to invent a robot! Help me figure out what it should do and how it works.",
  },
  {
    id: "ocean-explorer",
    title: "Ocean Explorer",
    description: "Dive deep and discover creatures of the abyss",
    icon: "🐙",
    category: "Science",
    color: "from-blue-500 to-teal-500",
    prompt: "I want to explore the deep ocean! What weird creatures live down there?",
  },
  {
    id: "comic-book",
    title: "Create a Comic",
    description: "Build a superhero and write their origin story",
    icon: "💥",
    category: "Writing",
    color: "from-pink-500 to-rose-500",
    prompt: "I want to create a comic book superhero! Help me build their story and powers.",
  },
  {
    id: "bridge-builder",
    title: "Bridge Builder",
    description: "Engineer a bridge that can hold a truck",
    icon: "🌉",
    category: "Engineering",
    color: "from-gray-500 to-slate-500",
    prompt: "I want to design a bridge! Help me figure out how to make it super strong.",
  },
  {
    id: "time-travel",
    title: "Time Traveler",
    description: "Visit any era in history and see what life was like",
    icon: "⏰",
    category: "Explore",
    color: "from-violet-500 to-fuchsia-500",
    prompt: "I want to time travel! Let's pick a time period and explore what life was like.",
  },
];

function pickRandom<T>(arr: T[], n: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}

export default function ChatPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const [projects, setProjects] = useState<typeof PROJECTS>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [sessionEnded, setSessionEnded] = useState(false);
  const [sessionEndMessage, setSessionEndMessage] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  // Load session history on mount
  useEffect(() => {
    setProjects(pickRandom(PROJECTS, 6));

    fetch(`/api/chat/history?token=${token}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.messages && data.messages.length > 0) {
          setMessages(data.messages);
          if (data.ended) {
            setSessionEnded(true);
            setSessionEndMessage("This session has ended. Ask your parent to start a new one!");
          }
        }
      })
      .catch(() => {
        // Ignore — just show empty chat
      })
      .finally(() => setHistoryLoaded(true));
  }, [token]);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      setSpeechSupported(true);
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let transcript = "";
        for (let i = 0; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setInput(transcript);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  function toggleListening() {
    if (!recognitionRef.current) return;
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setInput("");
      recognitionRef.current.start();
      setIsListening(true);
    }
  }

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!isStreaming) inputRef.current?.focus();
  }, [isStreaming]);

  function handleSuggestion(text: string) {
    setInput(text);
    inputRef.current?.focus();
  }

  function handleProject(prompt: string) {
    setInput(prompt);
    // Auto-send after a tick so the input is set
    setTimeout(() => {
      const fakeEvent = { key: "Enter", shiftKey: false, preventDefault: () => {} };
      handleKeyDown(fakeEvent as React.KeyboardEvent);
    }, 50);
  }

  async function handleSend() {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    }
    const trimmed = input.trim();
    if (!trimmed || isStreaming || sessionEnded) return;

    const userMessage: Message = { role: "kid", content: trimmed };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsStreaming(true);

    // Add empty AI message for streaming
    setMessages((prev) => [...prev, { role: "ai", content: "" }]);

    await sendMessage(
      trimmed,
      token,
      (content) => {
        setMessages((prev) => {
          const updated = [...prev];
          const last = updated[updated.length - 1];
          if (last.role === "ai") {
            updated[updated.length - 1] = { ...last, content: last.content + content };
          }
          return updated;
        });
      },
      () => {
        setIsStreaming(false);
      },
      (error) => {
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            role: "ai",
            content: `Oops! Something went wrong. Let's try again. (${error})`,
          };
          return updated;
        });
        setIsStreaming(false);
      },
      (endMsg) => {
        setSessionEnded(true);
        setSessionEndMessage(endMsg);
        setIsStreaming(false);
      }
    );
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  if (!historyLoaded) {
    return (
      <div className="flex flex-col h-screen bg-gray-50 items-center justify-center">
        <div className="animate-pulse text-gray-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3">
        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
          K
        </div>
        <div>
          <h1 className="font-semibold text-gray-900">SeanSean</h1>
          <p className="text-xs text-gray-500">Your AI learning buddy</p>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-2xl mx-auto space-y-4">
          {messages.length === 0 && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
                K
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Hey! I&apos;m SeanSean
              </h2>
              <p className="text-gray-500 mb-6 max-w-md mx-auto">
                Pick a project to start, or just ask me anything!
              </p>

              {/* Project Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg mx-auto mb-6">
                {projects.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => handleProject(p.prompt)}
                    className="bg-white border border-gray-200 rounded-xl p-4 text-left hover:shadow-md hover:border-gray-300 transition group"
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 bg-gradient-to-br ${p.color} rounded-lg flex items-center justify-center text-white text-lg flex-shrink-0`}>
                        {p.icon}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900 text-sm group-hover:text-blue-600 transition">
                          {p.title}
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5">{p.description}</div>
                        <div className="text-[10px] text-gray-400 mt-1 uppercase tracking-wider">{p.category}</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              {/* Or just chat */}
              <p className="text-xs text-gray-400 mb-2">or ask anything:</p>
              <div className="flex flex-wrap justify-center gap-2">
                {pickRandom([
                  { label: "Why is the sky blue?", icon: "🌤️" },
                  { label: "Tell me a weird fact", icon: "🧪" },
                  { label: "Help me with math", icon: "🔢" },
                  { label: "What lives in the deep ocean?", icon: "🐙" },
                ], 3).map((s) => (
                  <button
                    key={s.label}
                    onClick={() => handleSuggestion(s.label)}
                    className="px-3 py-1.5 bg-white border border-gray-200 rounded-full text-xs text-gray-600 hover:bg-blue-50 hover:border-blue-300 transition flex items-center gap-1.5"
                  >
                    <span>{s.icon}</span>
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === "kid" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  msg.role === "kid"
                    ? "bg-blue-600 text-white"
                    : "bg-white border border-gray-200 text-gray-900"
                }`}
              >
                {msg.role === "ai" && (
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-5 h-5 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-[10px] font-bold">
                      K
                    </div>
                    <span className="text-xs text-gray-400 font-medium">SeanSean</span>
                  </div>
                )}
                <p className="whitespace-pre-wrap text-sm leading-relaxed">
                  {msg.content}
                  {isStreaming && i === messages.length - 1 && msg.role === "ai" && (
                    <span className="inline-block w-1.5 h-4 bg-blue-500 animate-pulse ml-0.5 align-text-bottom" />
                  )}
                </p>
              </div>
            </div>
          ))}

          {sessionEnded && (
            <div className="text-center py-6">
              <div className="bg-green-50 border border-green-200 rounded-2xl p-6 max-w-md mx-auto">
                <p className="text-green-800 font-medium">{sessionEndMessage}</p>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      {!sessionEnded && (
        <div className="bg-white border-t border-gray-200 px-4 py-3">
          <div className="max-w-2xl mx-auto flex gap-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={isListening ? "Listening... speak now!" : "Ask me anything... or tap the mic!"}
              rows={1}
              disabled={isStreaming}
              className={`flex-1 resize-none px-4 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 text-sm disabled:opacity-50 ${
                isListening ? "border-red-400 bg-red-50" : "border-gray-300"
              }`}
            />
            {speechSupported && (
              <button
                onClick={toggleListening}
                disabled={isStreaming}
                className={`px-3 py-2 rounded-xl transition ${
                  isListening
                    ? "bg-red-500 text-white animate-pulse hover:bg-red-600"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                } disabled:opacity-50 disabled:cursor-not-allowed`}
                title={isListening ? "Stop listening" : "Talk to SeanSean"}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="w-5 h-5"
                >
                  <path d="M8.25 4.5a3.75 3.75 0 117.5 0v8.25a3.75 3.75 0 11-7.5 0V4.5z" />
                  <path d="M6 10.5a.75.75 0 01.75.75v1.5a5.25 5.25 0 1010.5 0v-1.5a.75.75 0 011.5 0v1.5a6.751 6.751 0 01-6 6.709v2.291h3a.75.75 0 010 1.5h-7.5a.75.75 0 010-1.5h3v-2.291a6.751 6.751 0 01-6-6.709v-1.5A.75.75 0 016 10.5z" />
                </svg>
              </button>
            )}
            <button
              onClick={handleSend}
              disabled={isStreaming || !input.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="w-5 h-5"
              >
                <path d="M3.105 2.289a.75.75 0 00-.826.95l1.414 4.925A1.5 1.5 0 005.135 9.25h6.115a.75.75 0 010 1.5H5.135a1.5 1.5 0 00-1.442 1.086l-1.414 4.926a.75.75 0 00.826.95 28.896 28.896 0 0015.293-7.154.75.75 0 000-1.115A28.897 28.897 0 003.105 2.289z" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
