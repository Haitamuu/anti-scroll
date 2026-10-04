"use client";

import { useState, useEffect } from "react";

export default function Home() {
  const [sessionId, setSessionId] = useState("");
  const [isLogged, setIsLogged] = useState(false);
  const [activeTab, setActiveTab] = useState("messages");
  const [messages, setMessages] = useState<any>(null);
  const [stories, setStories] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const stored = localStorage.getItem("ig_sessionid");
    if (stored) {
      setSessionId(stored);
      setIsLogged(true);
    }
  }, []);

  useEffect(() => {
    if (isLogged) {
      if (activeTab === "messages" && !messages) fetchMessages();
      if (activeTab === "stories" && !stories) fetchStories();
    }
  }, [activeTab, isLogged]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (sessionId.trim()) {
      localStorage.setItem("ig_sessionid", sessionId.trim());
      setIsLogged(true);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("ig_sessionid");
    setSessionId("");
    setIsLogged(false);
    setMessages(null);
    setStories(null);
  };

  const fetchMessages = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/messages", {
        headers: { "x-ig-session": sessionId },
      });
      const data = await res.json();
      if (res.ok) setMessages(data);
      else setError(data.error || "Erreur lors de la récupération des messages");
    } catch (err) {
      setError("Erreur réseau");
    }
    setLoading(false);
  };

  const fetchStories = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/stories", {
        headers: { "x-ig-session": sessionId },
      });
      const data = await res.json();
      if (res.ok) setStories(data);
      else setError(data.error || "Erreur lors de la récupération des stories");
    } catch (err) {
      setError("Erreur réseau");
    }
    setLoading(false);
  };

  if (!isLogged) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-md">
          <h1 className="text-3xl font-bold text-center text-pink-600 mb-6">InstaFocus</h1>
          <p className="text-gray-500 mb-6 text-sm text-center">
            Connectez-vous en utilisant votre <b>sessionid</b> Instagram pour voir vos messages et stories sans le feed.
          </p>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Cookie sessionid</label>
              <input
                type="password"
                value={sessionId}
                onChange={(e) => setSessionId(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-3 border focus:border-pink-500 focus:ring-pink-500"
                placeholder="Ex: 12345678%3A..."
                required
              />
            </div>
            <button type="submit" className="w-full bg-pink-600 text-white p-3 rounded-md font-semibold hover:bg-pink-700">
              Se connecter
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50 text-gray-900">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 p-4 flex justify-between items-center sticky top-0 z-10">
        <h1 className="text-xl font-bold text-pink-600">InstaFocus</h1>
        <button onClick={handleLogout} className="text-sm text-gray-500 hover:text-gray-800">
          Déconnexion
        </button>
      </header>

      {/* Tabs */}
      <div className="flex bg-white border-b border-gray-200">
        <button
          onClick={() => setActiveTab("messages")}
          className={`flex-1 py-3 text-center font-medium text-sm transition-colors ${
            activeTab === "messages" ? "border-b-2 border-pink-600 text-pink-600" : "text-gray-500"
          }`}
        >
          Messages
        </button>
        <button
          onClick={() => setActiveTab("stories")}
          className={`flex-1 py-3 text-center font-medium text-sm transition-colors ${
            activeTab === "stories" ? "border-b-2 border-pink-600 text-pink-600" : "text-gray-500"
          }`}
        >
          Stories
        </button>
      </div>

      {/* Content */}
      <main className="flex-1 overflow-y-auto p-4">
        {loading && <p className="text-center text-gray-500 mt-4">Chargement...</p>}
        {error && <p className="text-center text-red-500 mt-4">{error}</p>}
        
        {/* Messages View */}
        {activeTab === "messages" && messages?.inbox?.threads && (
          <div className="space-y-4">
            {messages.inbox.threads.map((thread: any) => (
              <div key={thread.thread_id} className="flex items-center p-3 bg-white rounded-lg shadow-sm">
                <img
                  src={thread.users[0]?.profile_pic_url || "/default-avatar.png"}
                  alt="avatar"
                  className="w-12 h-12 rounded-full mr-4 bg-gray-200"
                />
                <div className="flex-1 overflow-hidden">
                  <h3 className="font-semibold text-gray-900 truncate">
                    {thread.thread_title || thread.users[0]?.username}
                  </h3>
                  <p className="text-sm text-gray-500 truncate">
                    {thread.last_permanent_item?.text || "Nouveau message"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Stories View */}
        {activeTab === "stories" && stories?.tray && (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
            {stories.tray.map((story: any) => (
              <div key={story.id} className="flex flex-col items-center">
                <div className="w-16 h-16 rounded-full p-[2px] bg-gradient-to-tr from-yellow-400 to-pink-600 mb-1">
                  <img
                    src={story.user?.profile_pic_url || "/default-avatar.png"}
                    alt="avatar"
                    className="w-full h-full rounded-full border-2 border-white object-cover bg-white"
                  />
                </div>
                <span className="text-xs text-gray-700 truncate w-full text-center">
                  {story.user?.username}
                </span>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
