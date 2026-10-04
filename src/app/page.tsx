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
  
  const [selectedStory, setSelectedStory] = useState<any>(null);

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
      if (res.ok) {
        setMessages(data);
      } else {
        setError(`Erreur: ${data.error} - ${data.details || ''}`);
      }
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
      if (res.ok) {
        setStories(data);
      } else {
        setError(`Erreur: ${data.error} - ${data.details || ''}`);
      }
    } catch (err) {
      setError("Erreur réseau");
    }
    setLoading(false);
  };
  
  const openStory = (story: any) => {
    if (story.items && story.items.length > 0) {
      // Pour pouvoir relire, on donne toujours accès à la première (ou on pourrait chercher la non-lue)
      // On sélectionne le premier item avec les informations de l'utilisateur
      setSelectedStory({ ...story.items[0], user: story.user });
    } else {
      alert("Cette story est vide ou a expiré.");
    }
  };

  const closeStory = () => {
    setSelectedStory(null);
  };

  if (!isLogged) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black p-4 text-white">
        <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-xl shadow-lg w-full max-w-md">
          <h1 className="text-3xl font-bold text-center text-white mb-6 font-serif italic">InstaFocus</h1>
          <p className="text-zinc-400 mb-6 text-sm text-center">
            Connectez-vous avec votre <b>sessionid</b> pour accéder à vos messages sans le feed.
          </p>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-300">Cookie sessionid</label>
              <input
                type="password"
                value={sessionId}
                onChange={(e) => setSessionId(e.target.value)}
                className="mt-1 block w-full rounded-md bg-zinc-800 border-zinc-700 text-white shadow-sm p-3 focus:border-white focus:ring-white"
                placeholder="Ex: 12345678%3A..."
                required
              />
            </div>
            <button type="submit" className="w-full bg-white text-black p-3 rounded-md font-bold hover:bg-gray-200 transition-colors">
              Se connecter
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-black text-white relative">
      <header className="bg-black border-b border-zinc-800 p-4 flex justify-between items-center sticky top-0 z-10">
        <h1 className="text-xl font-bold text-white font-serif italic">InstaFocus</h1>
        <button onClick={handleLogout} className="text-sm text-zinc-400 hover:text-white transition-colors">
          Déconnexion
        </button>
      </header>

      <div className="flex bg-black border-b border-zinc-800">
        <button
          onClick={() => setActiveTab("messages")}
          className={`flex-1 py-3 text-center font-semibold text-sm transition-colors ${
            activeTab === "messages" ? "border-b-2 border-white text-white" : "text-zinc-500"
          }`}
        >
          Messages
        </button>
        <button
          onClick={() => setActiveTab("stories")}
          className={`flex-1 py-3 text-center font-semibold text-sm transition-colors ${
            activeTab === "stories" ? "border-b-2 border-white text-white" : "text-zinc-500"
          }`}
        >
          Stories
        </button>
      </div>

      <main className="flex-1 overflow-y-auto p-4">
        {loading && <p className="text-center text-zinc-500 mt-4">Chargement...</p>}
        {error && (
          <div className="bg-red-900/50 border border-red-800 text-red-200 p-4 rounded-md mt-4 text-xs font-mono break-all whitespace-pre-wrap">
            {error}
          </div>
        )}
        
        {activeTab === "messages" && messages?.inbox?.threads && (
          <div className="space-y-4">
            {messages.inbox.threads.map((thread: any) => (
              <div key={thread.thread_id} className="flex items-center p-3 bg-zinc-900 rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer">
                <img
                  src={thread.users[0]?.profile_pic_url || "/default-avatar.png"}
                  alt="avatar"
                  className="w-14 h-14 rounded-full mr-4 bg-zinc-800 border border-zinc-700"
                  referrerPolicy="no-referrer"
                />
                <div className="flex-1 overflow-hidden">
                  <h3 className="font-semibold text-white truncate">
                    {thread.thread_title || thread.users[0]?.username}
                  </h3>
                  <p className={`text-sm truncate mt-1 ${thread.read_state ? 'text-zinc-500' : 'text-white font-bold'}`}>
                    {thread.last_permanent_item?.text || "Nouveau message"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === "stories" && stories?.tray && (
          <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-4">
            {stories.tray.map((story: any) => {
              // Vérifie si la story a été entièrement vue
              // "seen" contient le timestamp du dernier item vu. S'il est égal ou supérieur au dernier, tout est vu.
              const isSeen = story.seen >= story.latest_reel_media;
              
              return (
                <div key={story.id} onClick={() => openStory(story)} className="flex flex-col items-center cursor-pointer">
                  <div className={`w-16 h-16 rounded-full p-[2px] mb-1 hover:scale-105 transition-transform ${isSeen ? 'bg-zinc-700' : 'bg-gradient-to-tr from-yellow-500 via-red-500 to-fuchsia-600'}`}>
                    <img
                      src={story.user?.profile_pic_url || "/default-avatar.png"}
                      alt="avatar"
                      className="w-full h-full rounded-full border-2 border-black object-cover bg-zinc-800"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <span className={`text-xs truncate w-full text-center mt-1 ${isSeen ? 'text-zinc-500' : 'text-zinc-300'}`}>
                    {story.user?.username}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Modal Story Viewer */}
      {selectedStory && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col">
          <div className="flex justify-between items-center p-4 absolute top-0 w-full z-10 bg-gradient-to-b from-black/60 to-transparent">
            <div className="flex items-center">
              <img 
                src={selectedStory.user?.profile_pic_url} 
                className="w-8 h-8 rounded-full border border-zinc-700 mr-2" 
                referrerPolicy="no-referrer"
              />
              <span className="font-bold text-white drop-shadow-md">{selectedStory.user?.username}</span>
            </div>
            <button onClick={closeStory} className="text-white text-4xl font-bold hover:text-gray-300 drop-shadow-md pb-1">
              &times;
            </button>
          </div>
          
          <div className="flex-1 flex items-center justify-center bg-zinc-950 relative">
            {selectedStory.video_versions ? (
              <video 
                src={selectedStory.video_versions[0]?.url} 
                className="max-h-full max-w-full object-contain"
                autoPlay 
                controls 
                referrerPolicy="no-referrer"
              />
            ) : (
              <img 
                src={selectedStory.image_versions2?.candidates[0]?.url} 
                className="max-h-full max-w-full object-contain"
                alt="Story"
                referrerPolicy="no-referrer"
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
