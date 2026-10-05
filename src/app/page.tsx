"use client";

import { useState, useEffect } from "react";

export default function Home() {
  const [sessionId, setSessionId] = useState("");
  const [isLogged, setIsLogged] = useState(false);
  const [stories, setStories] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  const [selectedStory, setSelectedStory] = useState<{storyId: string, user: any, items: any[], currentIndex: number} | null>(null);
  const [storyLoading, setStoryLoading] = useState(false);
  const [isLiking, setIsLiking] = useState(false);

  const [localSeen, setLocalSeen] = useState<Record<string, number>>({});

  useEffect(() => {
    const stored = localStorage.getItem("ig_sessionid");
    if (stored) {
      setSessionId(stored);
      setIsLogged(true);
    }
    const storedSeen = localStorage.getItem("insta_seen");
    if (storedSeen) {
      setLocalSeen(JSON.parse(storedSeen));
    }
  }, []);

  useEffect(() => {
    if (isLogged && !stories) {
      fetchStories();
    }
  }, [isLogged]);

  // Si on est sur le dernier item d'une story, on la marque comme "vue" localement (et on sauvegarde)
  useEffect(() => {
    if (selectedStory && selectedStory.items.length > 0) {
      if (selectedStory.currentIndex === selectedStory.items.length - 1) {
        if (stories && stories.tray) {
          const updatedTray = stories.tray.map((s: any) => {
            if (s.id === selectedStory.storyId) {
              const newSeenVal = Math.max(s.seen || 0, s.latest_reel_media);
              
              setLocalSeen(prev => {
                const updated = { ...prev, [s.id]: newSeenVal };
                localStorage.setItem("insta_seen", JSON.stringify(updated));
                return updated;
              });

              return { ...s, seen: newSeenVal };
            }
            return s;
          });
          setStories({ ...stories, tray: updatedTray });
        }
      }
    }
  }, [selectedStory?.currentIndex]);

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
    setStories(null);
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
  
  const openStory = async (story: any) => {
    setStoryLoading(true);
    try {
      const res = await fetch(`/api/stories/media?id=${story.id}`, {
        headers: { "x-ig-session": sessionId },
      });
      const data = await res.json();
      
      if (!res.ok) {
        alert("Erreur serveur : " + JSON.stringify(data));
      } else if (data.reels && data.reels[story.id] && data.reels[story.id].items.length > 0) {
        const items = data.reels[story.id].items;
        let startIndex = 0;
        for (let i = 0; i < items.length; i++) {
          if (items[i].taken_at > story.seen) {
            startIndex = i;
            break;
          }
        }
        setSelectedStory({ storyId: story.id, user: story.user, items: items, currentIndex: startIndex });
      } else {
        alert("Cette story est vide ou a expiré.");
      }
    } catch (err) {
      alert("Erreur de connexion pour charger la story.");
    }
    setStoryLoading(false);
  };

  const closeStory = () => {
    setSelectedStory(null);
  };

  const nextStoryItem = () => {
    if (selectedStory) {
      if (selectedStory.currentIndex < selectedStory.items.length - 1) {
        setSelectedStory({ ...selectedStory, currentIndex: selectedStory.currentIndex + 1 });
      } else {
        closeStory(); // Fin de la story
      }
    }
  };

  const prevStoryItem = () => {
    if (selectedStory) {
      if (selectedStory.currentIndex > 0) {
        setSelectedStory({ ...selectedStory, currentIndex: selectedStory.currentIndex - 1 });
      } else {
        closeStory();
      }
    }
  };

  const handleLike = async () => {
    if (!selectedStory || isLiking) return;
    
    const currentItem = selectedStory.items[selectedStory.currentIndex];
    const mediaId = currentItem.id;
    const currentlyLiked = currentItem.has_liked;

    if (currentlyLiked) {
      alert("Retirer un J'aime n'est pas encore supporté ici.");
      return;
    }

    // Protection anti-spam : on bloque le bouton pendant la requête et on force un délai humain
    setIsLiking(true);

    // Mise à jour de l'UI immédiatement (optimiste)
    const newItems = [...selectedStory.items];
    newItems[selectedStory.currentIndex] = { ...currentItem, has_liked: true };
    setSelectedStory({ ...selectedStory, items: newItems });
    
    try {
      const res = await fetch("/api/stories/like", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-ig-session": sessionId
        },
        body: JSON.stringify({ mediaId })
      });
      
      const resData = await res.json();
      
      if (!res.ok || resData.status !== "ok") {
        console.error("Like error:", resData);
        // Si erreur, on annule l'interface
        newItems[selectedStory.currentIndex] = { ...currentItem, has_liked: false };
        setSelectedStory({ ...selectedStory, items: newItems });
        alert(`Échec du like. IG dit : ${resData.message || resData.error || 'Erreur inconnue'}\nDétails : ${JSON.stringify(resData).substring(0, 100)}`);
      }
    } catch (err) {
      console.error(err);
      newItems[selectedStory.currentIndex] = { ...currentItem, has_liked: false };
      setSelectedStory({ ...selectedStory, items: newItems });
    }
    
    // On libère le bouton après 1 seconde minimum pour éviter le spam
    setTimeout(() => {
      setIsLiking(false);
    }, 1000);
  };

  const handleReply = (e: React.FormEvent) => {
    e.preventDefault();
    alert("Bientôt disponible...");
  };

  if (!isLogged) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-black p-4 text-white">
        <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-xl shadow-lg w-full max-w-sm">
          <h1 className="text-4xl font-bold text-center text-white mb-2 font-serif italic">InstaFocus</h1>
          <p className="text-zinc-400 mb-8 text-sm text-center">
            Vos Stories, sans distractions.
          </p>
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <input
                type="password"
                value={sessionId}
                onChange={(e) => setSessionId(e.target.value)}
                className="block w-full rounded-lg bg-zinc-800 border-zinc-700 text-white shadow-sm p-4 text-base focus:border-white focus:ring-white outline-none"
                placeholder="Cookie sessionid"
                required
              />
            </div>
            <button type="submit" className="w-full bg-white text-black p-4 rounded-lg font-bold text-lg active:scale-95 transition-transform">
              Connexion
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[100dvh] bg-black text-white relative">
      <header className="bg-black pt-safe px-4 py-3 flex justify-between items-center sticky top-0 z-10">
        <h1 className="text-2xl font-bold text-white font-serif italic">InstaFocus</h1>
        <button onClick={handleLogout} className="text-sm font-semibold text-zinc-400 active:text-white">
          Quitter
        </button>
      </header>

      <main className="flex-1 overflow-y-auto pb-safe scrollbar-hide">
        {loading && (
          <div className="flex justify-center mt-10">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          </div>
        )}
        
        {error && (
          <div className="bg-red-900/50 text-red-200 p-4 m-4 rounded-lg text-xs font-mono break-all whitespace-pre-wrap">
            {error}
          </div>
        )}

        {stories?.tray && (
          <>
            {storyLoading && (
              <div className="fixed inset-0 z-40 bg-black/50 flex flex-col items-center justify-center text-white backdrop-blur-sm">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-white mb-4"></div>
                <p className="font-semibold">Chargement...</p>
              </div>
            )}
            
            <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-x-2 gap-y-6 p-2 mt-2">
              {stories.tray.map((story: any) => {
                const actualSeen = Math.max(story.seen || 0, localSeen[story.id] || 0);
                const isSeen = actualSeen >= story.latest_reel_media;
                const isBesties = story.has_besties_media;
                
                let ringClass = "bg-gradient-to-tr from-yellow-500 via-red-500 to-fuchsia-600";
                if (isSeen) {
                  ringClass = "bg-zinc-700";
                } else if (isBesties) {
                  ringClass = "bg-green-500";
                }
                
                return (
                  <div key={story.id} onClick={() => openStory(story)} className="flex flex-col items-center active:scale-95 transition-transform select-none">
                    <div className={`w-[72px] h-[72px] rounded-full p-[3px] mb-1 ${ringClass}`}>
                      <img
                        src={story.user?.profile_pic_url || "/default-avatar.png"}
                        alt="avatar"
                        className="w-full h-full rounded-full border-4 border-black object-cover bg-zinc-800"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <span className={`text-[11px] truncate w-full text-center px-1 ${isSeen ? 'text-zinc-500' : 'text-zinc-200'}`}>
                      {story.user?.username}
                    </span>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </main>

      {/* Modal Story Viewer (Style Instagram Mobile) */}
      {selectedStory && selectedStory.items[selectedStory.currentIndex] && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col pt-safe pb-safe">
          
          {/* Barres de progression */}
          <div className="absolute top-safe left-0 w-full z-20 flex space-x-1 px-2 pt-2">
            {selectedStory.items.map((_, idx) => (
              <div key={idx} className="flex-1 h-[2px] bg-white/30 rounded-full overflow-hidden">
                <div 
                  className={`h-full bg-white transition-all duration-200 ${idx < selectedStory.currentIndex ? 'w-full' : idx === selectedStory.currentIndex ? 'w-1/2' : 'w-0'}`} 
                />
              </div>
            ))}
          </div>

          {/* En-tête (Utilisateur + Bouton fermer) */}
          <div className="flex justify-between items-center p-4 absolute top-safe w-full z-20 bg-gradient-to-b from-black/60 to-transparent mt-2">
            <div className="flex items-center">
              <img 
                src={selectedStory.user?.profile_pic_url} 
                className="w-8 h-8 rounded-full border border-zinc-700 mr-2" 
                referrerPolicy="no-referrer"
              />
              <span className="font-bold text-white drop-shadow-md text-sm">{selectedStory.user?.username}</span>
              <span className="text-zinc-300 text-xs ml-2 drop-shadow-md">
                {Math.round((Date.now()/1000 - selectedStory.items[selectedStory.currentIndex].taken_at) / 3600)}h
              </span>
            </div>
            <button onClick={closeStory} className="text-white text-3xl font-bold active:text-gray-400 drop-shadow-md pl-4">
              &times;
            </button>
          </div>
          
          {/* Zones de clic invisibles pour naviguer */}
          <div className="absolute inset-0 z-10 flex">
            <div className="w-[30%] h-full" onClick={prevStoryItem} />
            <div className="w-[70%] h-full" onClick={nextStoryItem} />
          </div>

          {/* Contenu de la story (Media pleine hauteur mobile) */}
          <div className="flex-1 flex items-center justify-center bg-black relative w-full h-full overflow-hidden rounded-xl">
            {selectedStory.items[selectedStory.currentIndex].video_versions && selectedStory.items[selectedStory.currentIndex].video_versions.length > 0 ? (
              <video 
                src={selectedStory.items[selectedStory.currentIndex].video_versions[0]?.url} 
                className="h-full w-full object-cover pointer-events-none"
                autoPlay 
                playsInline
                onEnded={nextStoryItem}
              />
            ) : (
              <img 
                src={selectedStory.items[selectedStory.currentIndex].image_versions2?.candidates[0]?.url} 
                className="h-full w-full object-cover pointer-events-none"
                alt="Story"
                referrerPolicy="no-referrer"
              />
            )}
          </div>

          {/* Barre du bas : Répondre et Liker */}
          <div className="absolute bottom-safe w-full p-4 z-20 bg-gradient-to-t from-black/80 to-transparent flex items-center space-x-4 mb-2">
            <form onSubmit={handleReply} className="flex-1">
              <input 
                type="text" 
                placeholder={`Envoyer un message...`}
                className="w-full bg-transparent border border-white/70 rounded-full py-3 px-5 text-white text-base focus:outline-none focus:border-white transition-colors placeholder-white/70 backdrop-blur-sm"
              />
            </form>
            <button onClick={handleLike} className="text-white active:scale-75 transition-transform p-1">
              {selectedStory.items[selectedStory.currentIndex].has_liked ? (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="red" className="w-8 h-8">
                  <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                </svg>
              )}
            </button>
            <button className="text-white active:scale-75 transition-transform p-1">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 transform rotate-[-45deg] -translate-y-1">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
