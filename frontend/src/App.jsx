import React, { useState, useEffect } from 'react';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

// DATA & HELPER FUNCTIONS
const categories = ['Top Stories', 'Politics', 'Business', 'Technology', 'Sports', 'Entertainment'];

const getApiCategory = (cat) => {
  switch(cat) {
    case 'Top Stories': return 'general';
    case 'Politics': return 'nation'; 
    case 'Business': return 'business';
    case 'Technology': return 'technology';
    case 'Sports': return 'sports';
    case 'Entertainment': return 'entertainment';
    default: return 'general';
  }
};

const getAvatarColor = (name) => {
  const colors = [
    'from-rose-400 to-rose-600',
    'from-blue-400 to-blue-600',
    'from-emerald-400 to-emerald-600',
    'from-amber-400 to-amber-600',
    'from-violet-400 to-violet-600',
    'from-fuchsia-400 to-fuchsia-600',
    'from-cyan-400 to-cyan-600'
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

// SKELETON COMPONENT
const NewsSkeleton = () => (
  <div className="bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm flex flex-col h-full transition-colors duration-300">
    <div className="h-36 animate-shimmer dark:bg-slate-800"></div>
    <div className="p-4 flex-1 flex flex-col">
      <div className="h-5 animate-shimmer dark:bg-slate-800 rounded-md w-3/4 mb-3"></div>
      <div className="h-5 animate-shimmer dark:bg-slate-800 rounded-md w-full mb-4"></div>
      <div className="h-3 animate-shimmer dark:bg-slate-800 rounded-md w-full mb-2"></div>
      <div className="h-3 animate-shimmer dark:bg-slate-800 rounded-md w-5/6 mb-5"></div>
      <div className="mt-auto pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
        <div className="h-6 animate-shimmer dark:bg-slate-800 rounded-md w-16"></div>
        <div className="flex gap-2">
          <div className="h-6 animate-shimmer dark:bg-slate-800 rounded-md w-12"></div>
          <div className="h-6 animate-shimmer dark:bg-slate-800 rounded-full w-6"></div>
        </div>
      </div>
    </div>
  </div>
);

export default function App() {
  const [activeCategory, setActiveCategory] = useState('Top Stories');
  const [articles, setArticles] = useState([]);
  const [viewMode, setViewMode] = useState('home'); 
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [refreshTrigger, setRefreshTrigger] = useState(0); 
  const [lastUpdated, setLastUpdated] = useState(''); 
  const [searchQuery, setSearchQuery] = useState('');
  const [submittedQuery, setSubmittedQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [summary, setSummary] = useState('');
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [savedUrls, setSavedUrls] = useState([]);
  const [savedArticlesList, setSavedArticlesList] = useState([]); 
  const [sharedArticlesList, setSharedArticlesList] = useState([]); 
  const [heroInputUrl, setHeroInputUrl] = useState('');
  
  const [isNavVisible, setIsNavVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  // AUTH STATES
  const [isLoggedIn, setIsLoggedIn] = useState(() => localStorage.getItem('isLoggedIn') === 'true');
  const [currentUser, setCurrentUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('user')) || null; } catch { return null; }
  });
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMessage, setAuthMessage] = useState('');
  const [authMode, setAuthMode] = useState('signup'); 
  
  const [authName, setAuthName] = useState('');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState('');
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const [isCopied, setIsCopied] = useState(false);

  const [adminStats, setAdminStats] = useState(null);

  useEffect(() => {
    localStorage.setItem('isLoggedIn', isLoggedIn);
    if(currentUser) {
      localStorage.setItem('user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('user');
    }
  }, [isLoggedIn, currentUser]);

  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) return savedTheme === 'dark';
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const GNEWS_API_KEY = import.meta.env.VITE_GNEWS_API_KEY; 

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY && currentScrollY > 120) setIsNavVisible(false);
      else setIsNavVisible(true);
      setLastScrollY(currentScrollY);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  const handleCategoryChange = (cat) => {
    setIsSearching(false); setSubmittedQuery(''); setViewMode('home'); 
    setActiveCategory(cat); setArticles([]); setPage(1); 
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true); setSubmittedQuery(searchQuery);
    setViewMode('home'); setActiveCategory(''); setArticles([]); setPage(1);
    setRefreshTrigger(prev => prev + 1); 
  };

  const clearSearch = () => {
    setSearchQuery(''); setSubmittedQuery(''); setIsSearching(false);
    setViewMode('home'); handleCategoryChange('Top Stories');
  };

  const handleRefresh = () => {
    setArticles([]); setPage(1); setRefreshTrigger(prev => prev + 1); 
  };

  const handleLoadMore = () => setPage(prev => prev + 1);

  useEffect(() => {
    fetch(`${BACKEND_URL}/api/interactions`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          const savedItems = data.filter(item => item.isSaved || item.action === 'save');
          setSavedUrls(savedItems.map(item => item.url));
          setSavedArticlesList(savedItems); 

          const sharedItems = data.filter(item => item.isShared || item.action === 'share');
          setSharedArticlesList(sharedItems);
        }
      }).catch(err => console.error("Backend error:", err));
  }, []);

  useEffect(() => {
    const fetchNews = async () => {
      if (viewMode === 'saved' || viewMode === 'shared' || viewMode === 'admin') return; 
      page === 1 ? setIsLoading(true) : setIsLoadingMore(true);
      try {
        let url = `${BACKEND_URL}/api/news?page=${page}`;
        if (isSearching && submittedQuery) {
          url += `&q=${submittedQuery}`;
        } else {
          url += `&category=${getApiCategory(activeCategory || 'Top Stories')}`;
        }
        
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.articles) {
          page === 1 ? setArticles(data.articles) : setArticles(prev => [...prev, ...data.articles]);
          if(page === 1) setLastUpdated(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
        } else {
          if (page === 1) setArticles([]);
        }
      } catch (error) { 
        console.error("News error:", error); 
        if (page === 1) setArticles([]); 
      }
      finally { setIsLoading(false); setIsLoadingMore(false); }
    };
    fetchNews();
  }, [activeCategory, page, refreshTrigger, viewMode, isSearching, submittedQuery]);

  const generateSummary = async (article) => {
    setIsSummarizing(true); setSummary(''); 
    try {
      const response = await fetch(`${BACKEND_URL}/api/summarize`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ articleUrl: article.url, title: article.title, description: article.description })
      });
      const data = await response.json();
      if (data.summary) {
        setSummary(data.summary.replace(/\*/g, '').trim());
        if (article.title === "Analyzing Custom URL..." && data.scrapedTitle) {
          setSelectedArticle(prev => ({ ...prev, title: data.scrapedTitle, image: data.scrapedImage || prev.image }));
        }
      }
    } catch { setSummary("Network Error: Backend not running."); }
    finally { setIsSummarizing(false); }
  };

  const openModal = (article) => {
    setSelectedArticle(article); setIsModalOpen(true);
    document.body.style.overflow = 'hidden'; generateSummary(article);
  };

  const closeModal = () => {
    setIsModalOpen(false); setSelectedArticle(null); setSummary(''); 
    document.body.style.overflow = 'auto';
  };

  const handleHeroSummarize = () => {
    if (!heroInputUrl.trim()) return alert("Please enter a valid article URL to summarize.");
    openModal({ title: "Analyzing Custom URL...", url: heroInputUrl, image: "", description: "" });
    setHeroInputUrl(''); 
  };

  const openAuthModal = (mode = 'signup', message = '') => {
    setAuthMode(mode);
    setAuthMessage(message);
    setAuthError('');
    setAuthEmail(''); setAuthPassword(''); setAuthName(''); 
    setShowPassword(false);
    setIsPasswordFocused(false);
    setIsAuthModalOpen(true);
    setIsMenuOpen(false);
  };

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');
    if (!authEmail || !authPassword || (authMode === 'signup' && !authName)) {
      setAuthError("Please fill in all fields.");
      return;
    }
    
    setIsAuthLoading(true);
    const endpoint = authMode === 'signup' ? '/api/auth/signup' : '/api/auth/login';
    const payload = authMode === 'signup' 
      ? { name: authName, email: authEmail, password: authPassword } 
      : { email: authEmail, password: authPassword };
      
    try {
      const response = await fetch(`${BACKEND_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      if (response.ok) {
        localStorage.setItem('token', data.token);
        setCurrentUser(data.user);
        setIsLoggedIn(true);
        setIsAuthModalOpen(false);
        setAuthName(''); setAuthEmail(''); setAuthPassword('');
      } else {
        let cleanError = data.message || "Authentication failed!";
        cleanError = cleanError.replace('❌', '').trim();
        if(cleanError.includes('Password galat hai')) cleanError = 'Incorrect password.';
        if(cleanError.includes('database mein nahi mili')) cleanError = 'Email address not found.';
        if(cleanError.includes('pehle se database mein hai')) cleanError = 'An account with this email already exists.';
        setAuthError(cleanError);
      }
    } catch (error) {
      console.error("Authentication Error:", error); 
      setAuthError("Cannot connect to server. Check backend.");
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleLogout = () => {
    setIsLoggingOut(true);
    setTimeout(() => {
      localStorage.removeItem('token');
      localStorage.removeItem('isLoggedIn');
      localStorage.removeItem('user');
      setIsLoggedIn(false);
      setCurrentUser(null);
      setIsMenuOpen(false);
      setIsLoggingOut(false);
      window.location.reload(); 
    }, 800); 
  };

  const handleInteraction = async (e, article, action) => {
    e.stopPropagation(); 
    const url = article.url;
    if (action === 'save') {
      const isAlreadySaved = savedUrls.includes(url);
      if (!isLoggedIn && !isAlreadySaved && savedUrls.length >= 5) {
        openAuthModal('signup', "Sign up to save unlimited articles");
        return; 
      }
      setSavedUrls(prev => isAlreadySaved ? prev.filter(u => u !== url) : [...prev, url]);
      setSavedArticlesList(prev => prev.find(a => a.url === url) ? prev.filter(a => a.url !== url) : [...prev, article]);
    }
    try {
      await fetch(`${BACKEND_URL}/api/interactions`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: article.url, title: article.title, image: article.image, description: article.description, action: action })
      });
    } catch (err) { console.error("Database error", err); }
  };

  const handleShare = async (e, article) => {
    e.stopPropagation(); 
    if (isLoggedIn) {
      setSharedArticlesList(prev => prev.find(a => a.url === article.url) ? prev : [article, ...prev]);
      try {
        await fetch(`${BACKEND_URL}/api/interactions`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: article.url, title: article.title, image: article.image, description: article.description, action: 'share' })
        });
      } catch (err) { console.error("Database error", err); }
    }
    if (navigator.share) {
      try { await navigator.share({ title: article.title, text: `Check out this news on Glance:\n${article.title}`, url: article.url }); } catch (error) { console.log("Sharing cancelled", error); }
    } else { navigator.clipboard.writeText(article.url); alert("News link copied to clipboard."); }
  };

  const displayArticles = viewMode === 'saved' ? savedArticlesList : (viewMode === 'shared' ? sharedArticlesList : articles);

  return (
    <div className="min-h-screen bg-[#f0f5f5] dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans selection:bg-cyan-200 dark:selection:bg-cyan-900 w-full relative transition-colors duration-300">
      
      {isMenuOpen && (
        <div className="fixed inset-0 z-[110] bg-transparent cursor-default" onClick={() => setIsMenuOpen(false)}></div>
      )}

      <header className={`sticky top-0 z-[120] w-full transition-transform duration-300 ease-in-out ${isNavVisible ? 'translate-y-0' : '-translate-y-full'}`}>
        <nav className="bg-[#f0f5f5]/95 dark:bg-slate-950/95 backdrop-blur-md shadow-sm transition-colors duration-300">
          <div className="border-b border-slate-300/60 dark:border-slate-800/60">
            <div className="max-w-6xl mx-auto px-4 md:px-6 py-3 flex flex-row items-center justify-between gap-4">
              
              <h1 onClick={clearSearch} className="cursor-pointer text-3xl font-black tracking-tight text-slate-950 dark:text-white shrink-0 hover:opacity-80 transition-opacity">
                Glance
              </h1>

              <div className="flex-1 flex justify-center px-2">
                <form onSubmit={handleSearch} className="relative w-full max-w-lg min-w-0 group">
                  <input 
                    type="text" 
                    placeholder="Search topics, keywords or headlines..." 
                    value={searchQuery} 
                    onChange={(e) => setSearchQuery(e.target.value)} 
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-full py-2 pl-10 pr-4 text-sm font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:border-cyan-500 dark:focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100 dark:focus:ring-cyan-900 transition-all shadow-sm" 
                  />
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4 absolute left-3.5 top-2.5 text-slate-400 dark:text-slate-500 group-focus-within:text-cyan-600 dark:group-focus-within:text-cyan-400 transition-colors">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                  </svg>
                </form>
              </div>

              <div className="relative shrink-0">
                
                {/* VIP ADMIN AVATAR LOGIC */}
                {isLoggedIn && currentUser?.name ? (
                  <div className="relative inline-block">
                    <button 
                      title={`${currentUser.name}\n${currentUser.email}`}
                      onClick={() => setIsMenuOpen(!isMenuOpen)} 
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-black text-lg shadow-md hover:shadow-lg hover:scale-105 active:scale-95 transition-all z-50 cursor-pointer bg-gradient-to-br ${
                        currentUser.role === 'admin' 
                        ? 'from-amber-400 to-amber-600 ring-2 ring-amber-300 dark:ring-amber-500 ring-offset-2 dark:ring-offset-slate-950' 
                        : getAvatarColor(currentUser.name)
                      }`}
                    >
                      {currentUser.name.charAt(0).toUpperCase()}
                    </button>
                    {/* Crown Badge for Admin */}
                    {currentUser.role === 'admin' && (
                      <div className="absolute -top-1.5 -right-1.5 bg-white dark:bg-slate-800 rounded-full p-0.5 shadow-sm z-50 text-[11px] leading-none pointer-events-none" title="Admin">
                        👑
                      </div>
                    )}
                  </div>
                ) : (
                  <button 
                    onClick={() => setIsMenuOpen(!isMenuOpen)} 
                    className={`p-1.5 rounded-xl transition-all duration-200 relative z-50 cursor-pointer ${isMenuOpen ? 'bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white scale-95 shadow-inner' : 'hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'}`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor" className="w-6 h-6">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                    </svg>
                  </button>
                )}

                {isMenuOpen && (
                  <div className="absolute right-0 top-full mt-3 w-56 bg-white/90 dark:bg-slate-900/95 backdrop-blur-xl border border-white dark:border-slate-800 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.2)] dark:shadow-black/50 rounded-2xl p-1.5 z-50 flex flex-col origin-top-right transition-all animate-in fade-in zoom-in-95 duration-200">
                    
                    {isLoggedIn && currentUser?.name && (
                       <div className="px-3.5 py-3 mb-1.5 bg-cyan-50/50 dark:bg-slate-800/50 rounded-xl border border-cyan-100/50 dark:border-slate-700/50 flex flex-col justify-center">
                         <div className="flex items-center justify-between mb-0.5">
                           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Logged in as</p>
                           {currentUser.role === 'admin' && <span className="text-[10px] font-bold text-amber-600 bg-amber-100 dark:bg-amber-900/40 px-1.5 py-0.5 rounded text-center leading-none">ADMIN</span>}
                         </div>
                         <p className="text-[14px] font-black text-slate-800 dark:text-white truncate leading-tight">{currentUser.name}</p>
                         <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 truncate mt-0.5">{currentUser.email}</p>
                       </div>
                    )}

                    <button onClick={() => { setIsSearching(false); setViewMode('saved'); setIsMenuOpen(false); }} className="cursor-pointer flex items-center justify-between w-full text-left px-3.5 py-2.5 text-[13px] font-bold text-slate-700 dark:text-slate-200 hover:bg-cyan-50 dark:hover:bg-slate-800 hover:text-cyan-700 dark:hover:text-cyan-400 rounded-xl transition-all group">
                      <span className="flex items-center gap-3">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-slate-400 dark:text-slate-500 group-hover:text-cyan-500 transition-colors">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
                        </svg>
                        Saved News
                      </span>
                      {savedUrls.length > 0 && <span className="bg-cyan-600 text-white text-[10px] px-2 py-0.5 rounded-full shadow-sm">{savedUrls.length}</span>}
                    </button>
                    
                    <button onClick={() => { 
                        if (!isLoggedIn) {
                          openAuthModal('login', "Want to keep track of what you've shared? Login to see your personal share history!");
                        } else {
                          setIsSearching(false); setViewMode('shared'); setIsMenuOpen(false); 
                        }
                      }} 
                      className="cursor-pointer flex items-center justify-between w-full text-left px-3.5 py-2.5 text-[13px] font-bold text-slate-700 dark:text-slate-200 hover:bg-cyan-50 dark:hover:bg-slate-800 hover:text-cyan-700 dark:hover:text-cyan-400 rounded-xl transition-all group mt-0.5">
                      <span className="flex items-center gap-3">
                        <span className={`text-lg leading-none transition-all ${!isLoggedIn ? 'text-slate-400 group-hover:text-rose-500' : 'grayscale opacity-70 group-hover:grayscale-0 group-hover:opacity-100'}`}>
                          {isLoggedIn ? '🔗' : '🔒'}
                        </span> 
                        Shared News
                      </span>
                      {isLoggedIn && sharedArticlesList.length > 0 && <span className="bg-indigo-500 text-white text-[10px] px-2 py-0.5 rounded-full shadow-sm">{sharedArticlesList.length}</span>}
                    </button>

                    {isLoggedIn && currentUser?.role === 'admin' && (
                      <button onClick={async () => {
                          try {
                            const res = await fetch(`${BACKEND_URL}/api/admin/stats`);
                            const data = await res.json();
                            setAdminStats(data);
                            setViewMode('admin');
                            setIsSearching(false);
                            setIsMenuOpen(false);
                          } catch(e) { console.error("Admin fetch error:", e); }
                        }}
                        className="cursor-pointer flex items-center justify-between w-full text-left px-3.5 py-2.5 text-[13px] font-bold text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-xl transition-all group mt-0.5"
                      >
                        <span className="flex items-center gap-3">
                          <span className="text-lg leading-none">👑</span> Admin Dashboard
                        </span>
                      </button>
                    )}
                    
                    {!isLoggedIn && (
                      <button onClick={() => openAuthModal('signup', '')} className="cursor-pointer flex items-center gap-3 w-full text-left px-3.5 py-2.5 text-[13px] font-bold text-slate-700 dark:text-slate-200 hover:bg-cyan-50 dark:hover:bg-slate-800 hover:text-cyan-700 dark:hover:text-cyan-400 rounded-xl transition-all group mt-0.5">
                        <span className="text-lg leading-none grayscale opacity-70 group-hover:grayscale-0 group-hover:opacity-100 transition-all">👤</span> 
                        Login / Sign up
                      </button>
                    )}
                    
                    <div className="h-px bg-slate-100/80 dark:bg-slate-800/80 my-1.5 mx-2"></div>
                    
                    <button 
                      onClick={() => { setIsDarkMode(!isDarkMode); setIsMenuOpen(false); }} 
                      className="cursor-pointer flex items-center gap-3 w-full text-left px-3.5 py-2.5 text-[13px] font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-all mb-0.5"
                    >
                      <span className="text-lg leading-none text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300">
                        {isDarkMode ? '☀️' : '🌙'}
                      </span> 
                      Theme: {isDarkMode ? 'Light' : 'Dark'}
                    </button>

                    {isLoggedIn && (
                      <button 
                        onClick={handleLogout} 
                        disabled={isLoggingOut}
                        className={`flex items-center gap-3 w-full text-left px-3.5 py-2.5 text-[13px] font-bold rounded-xl transition-all mt-0.5 ${isLoggingOut ? 'text-slate-400 cursor-wait bg-slate-50 dark:bg-slate-800/50' : 'cursor-pointer text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10'}`}
                      >
                        {isLoggingOut ? (
                           <>
                             <div className="w-4 h-4 border-2 border-slate-300 border-t-slate-500 rounded-full animate-spin"></div>
                             Logging out...
                           </>
                        ) : (
                           <>
                             <span className="text-lg leading-none">👋</span> Logout
                           </>
                        )}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="max-w-6xl mx-auto px-4 md:px-6 py-2 flex items-center md:justify-center gap-2 overflow-x-auto scrollbar-hide min-w-0">
            {categories.map((cat) => (
              <button key={cat} onClick={() => handleCategoryChange(cat)}
                className={`cursor-pointer whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-300 shrink-0 ${activeCategory === cat && viewMode === 'home' && !isSearching ? 'bg-cyan-700 text-white shadow-sm' : 'bg-white/60 dark:bg-slate-900/60 text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 hover:text-cyan-700 dark:hover:text-cyan-400'}`}
              >
                {cat}
              </button>
            ))}
          </div>
        </nav>
      </header>

      {/* HERO SECTION */}
      {viewMode === 'home' && !isSearching && (
        /* min-h ensures the feed stays below the fold */
        <div className="relative z-10 border-b border-slate-300/50 dark:border-slate-800/50 transition-colors duration-300 min-h-[calc(100vh-140px)] flex flex-col">
          
          {/*Added some extra gap*/}
          <div className="max-w-4xl mx-auto pt-12 pb-10 px-6 text-center w-full">
            <h2 className="text-4xl md:text-5xl font-black mb-4 text-slate-950 dark:text-white tracking-tight leading-tight">Read Less <br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-slate-800 dark:from-slate-200 to-cyan-600 dark:to-cyan-400">Understand More</span></h2>
            <p className="text-slate-600 dark:text-slate-400 mb-8 text-base md:text-lg max-w-xl mx-auto font-medium leading-relaxed">Drop any news link below to get an instant AI summary</p>
            
            {/*A balanced search bar */}
            <div className="relative group max-w-xl mx-auto shadow-lg shadow-slate-300/50 dark:shadow-black/50 rounded-2xl bg-white/90 dark:bg-slate-900/90 p-1 border border-slate-300 dark:border-slate-700 hover:border-cyan-400 dark:hover:border-cyan-500 transition-colors z-20">
              <input 
                type="text" 
                value={heroInputUrl} 
                onChange={(e) => setHeroInputUrl(e.target.value)} 
                placeholder="Paste article URL here" 
                className="w-full bg-transparent py-3.5 pl-6 pr-32 focus:outline-none text-slate-900 dark:text-slate-100 text-sm font-medium z-10 relative" 
              />
              <button 
                onClick={handleHeroSummarize} 
                className="cursor-pointer absolute right-1.5 top-1.5 bottom-1.5 bg-slate-900 dark:bg-slate-800 hover:bg-cyan-600 dark:hover:bg-cyan-600 text-white px-6 rounded-xl font-bold transition-colors flex items-center gap-2 text-xs z-20"
              >
                Summarize ✨
              </button>
            </div>
          </div>

          {/* Spacer to push the news feed out of sight */}
          <div className="flex-1"></div>
        </div>
      )}

      {/* NEWS FEED / DASHBOARD SECTION */}
      <main className="max-w-6xl mx-auto mt-8 px-6 pb-20 relative z-10">
        <div className="flex items-center mb-6 gap-4">
          <h3 className="text-xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight flex items-center gap-3 transition-colors duration-300">
            {viewMode === 'admin' ? '👑 Admin Dashboard' : (viewMode === 'saved' ? 'Your Saved Articles' : (viewMode === 'shared' ? 'Your Shared Articles' : (isSearching ? `Results for: "${submittedQuery}"` : activeCategory)))}
            {(isSearching || viewMode === 'saved' || viewMode === 'shared' || viewMode === 'admin') && <button onClick={clearSearch} className="cursor-pointer text-xs font-bold text-rose-500 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 px-3 py-1.5 rounded-lg transition-colors">✕ Back Feed</button>}
          </h3>
          {viewMode === 'home' && !isSearching && (
            <div className="flex items-center gap-2">
              <button onClick={handleRefresh} className="cursor-pointer text-slate-400 dark:text-slate-500 hover:text-cyan-600 dark:hover:text-cyan-400 hover:bg-cyan-50 dark:hover:bg-slate-800 p-1.5 rounded-full transition-colors active:scale-90" title="Refresh News">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                </svg>
              </button>
              {lastUpdated && <span className="text-xs font-medium text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-900 px-2 py-1 rounded-md hidden sm:block">Updated: {lastUpdated}</span>}
            </div>
          )}
          <div className="h-px flex-1 bg-slate-300/80 dark:bg-slate-800/80 transition-colors duration-300"></div>
        </div>
        
        {viewMode === 'admin' && adminStats ? (
          <div className="max-w-4xl mx-auto py-8">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
               <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm text-center transform hover:-translate-y-1 transition-transform">
                 <div className="w-16 h-16 bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">👥</div>
                 <h4 className="text-4xl font-black text-slate-900 dark:text-white mb-1">{adminStats.users}</h4>
                 <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Total Users</p>
               </div>
               <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm text-center transform hover:-translate-y-1 transition-transform">
                 <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">🔖</div>
                 <h4 className="text-4xl font-black text-slate-900 dark:text-white mb-1">{adminStats.saves}</h4>
                 <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Saved Articles</p>
               </div>
               <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm text-center transform hover:-translate-y-1 transition-transform">
                 <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">🔗</div>
                 <h4 className="text-4xl font-black text-slate-900 dark:text-white mb-1">{adminStats.shares}</h4>
                 <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Shared Articles</p>
               </div>
            </div>
          </div>
        ) : isLoading && viewMode === 'home' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">{Array(8).fill(0).map((_, i) => <NewsSkeleton key={i} />)}</div>
        ) : (
          <>
            {displayArticles.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 px-4 text-center bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-300 dark:border-slate-700 shadow-sm mx-auto max-w-2xl mt-4 relative z-10 transition-colors duration-300">
                <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 ${
                  viewMode === 'saved' ? 'bg-slate-50 dark:bg-slate-800' :
                  viewMode === 'shared' ? 'bg-indigo-50 dark:bg-indigo-500/10' :
                  'bg-rose-50 dark:bg-rose-500/10' 
                }`}>
                  {viewMode === 'saved' ? (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10 text-slate-400 dark:text-slate-500"><path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" /></svg>
                  ) : viewMode === 'shared' ? (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10 text-indigo-400 dark:text-indigo-500"><path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" /></svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10 text-rose-500 dark:text-rose-400"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                  )}
                </div>
                
                <h3 className="text-2xl font-black text-slate-800 dark:text-white mb-2 tracking-tight">
                  {viewMode === 'saved' ? 'No saved articles yet' : (viewMode === 'shared' ? 'No shared articles yet' : 'No results found')}
                </h3>
                
                <p className="text-slate-500 dark:text-slate-400 font-medium max-w-md mb-8 leading-relaxed">
                  {viewMode === 'saved' ? 'Your reading list is empty. Click the bookmark icon on any news card to save it here for later.' : 
                   viewMode === 'shared' ? 'You haven\'t shared any articles yet. Share interesting news with others and keep track of them here.' : 
                   'We couldn\'t load the latest stories right now. Please try refreshing the feed in a few moments.'}
                </p>
                
                {viewMode === 'saved' || viewMode === 'shared' ? (
                  <button onClick={clearSearch} className="cursor-pointer px-8 py-3 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-xl font-bold hover:bg-cyan-600 dark:hover:bg-cyan-500 transition-colors shadow-md text-sm">Explore Home Feed</button>
                ) : (
                  <button onClick={handleRefresh} className="cursor-pointer px-8 py-3 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-bold hover:border-cyan-600 dark:hover:border-cyan-500 hover:text-cyan-700 dark:hover:text-cyan-400 transition-colors shadow-sm text-sm">Try Refreshing ↻</button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 relative z-10">
                {displayArticles.map((article, index) => {
                  const isSaved = savedUrls.includes(article.url);
                  return (
                    <div key={index} onClick={() => openModal(article)} className="cursor-pointer bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group flex flex-col z-10">
                      <div className="h-36 bg-slate-200/60 dark:bg-slate-800/60 relative overflow-hidden group-hover:bg-cyan-50/50 dark:group-hover:bg-slate-800 transition-colors">
                        <img src={article.image || 'https://via.placeholder.com/400x200?text=No+Image'} alt={article.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                      </div>
                      <div className="p-4 flex-1 flex flex-col pointer-events-none">
                        <h4 className="font-bold text-base mb-2 text-slate-950 dark:text-slate-100 group-hover:text-cyan-700 dark:group-hover:text-cyan-400 transition-colors line-clamp-2 leading-snug tracking-tight">{article.title}</h4>
                        <p className="text-slate-600 dark:text-slate-400 text-sm line-clamp-2 mb-4 flex-1 leading-relaxed">{article.description}</p>
                        <div className="flex items-center justify-between mt-auto pt-3 border-t border-slate-200/80 dark:border-slate-800/80 pointer-events-auto">
                          <button onClick={(e) => handleShare(e, article)} className="text-slate-500 dark:text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 flex items-center gap-1.5 text-xs font-bold transition-colors transform hover:scale-105 active:scale-95 cursor-pointer bg-slate-100 dark:bg-slate-800 hover:bg-cyan-50 dark:hover:bg-slate-700 px-2.5 py-1.5 rounded-lg z-10 relative">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
                            </svg>
                            Share
                          </button>
                          <button onClick={(e) => handleInteraction(e, article, 'save')} className={`transition-colors transform hover:scale-110 active:scale-90 cursor-pointer z-10 relative ${isSaved ? 'text-cyan-600 dark:text-cyan-400' : 'text-slate-400 dark:text-slate-500 hover:text-cyan-600 dark:hover:text-cyan-400'}`} title={isSaved ? "Remove Bookmark" : "Save Article"}>
                            <svg xmlns="http://www.w3.org/2000/svg" fill={isSaved ? "currentColor" : "none"} viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            
            {viewMode === 'home' && displayArticles.length > 0 && !isSearching && (
              <div className="flex justify-center mt-12 mb-4 relative z-10">
                <button 
                  onClick={handleLoadMore} 
                  disabled={isLoadingMore} 
                  className={`bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 px-8 py-3 rounded-full font-bold transition-all duration-300 flex items-center gap-2 ${isLoadingMore ? 'opacity-70 cursor-not-allowed' : 'hover:border-cyan-600 dark:hover:border-cyan-500 hover:text-cyan-700 dark:hover:text-cyan-400 hover:shadow-md cursor-pointer'}`}
                >
                  {isLoadingMore ? 'Fetching...' : 'Load More News ↓'}
                </button>
              </div>
            )}
          </>
        )}
      </main>

      {/* MODALS (Summary) */}
      {isModalOpen && selectedArticle && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm transition-opacity">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-5 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
              <h3 className="font-bold text-slate-800 dark:text-white tracking-tight">Article Overview</h3>
              <button onClick={closeModal} className="cursor-pointer text-slate-400 dark:text-slate-500 hover:text-rose-500 dark:hover:text-rose-400 bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-full w-8 h-8 flex items-center justify-center transition-colors">✕</button>
            </div>
            <div className="p-6 overflow-y-auto">
              <img src={selectedArticle.image || 'https://via.placeholder.com/600x300?text=No+Image'} alt="news" className="w-full h-48 sm:h-64 object-cover rounded-2xl mb-5 shadow-sm" />
              <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-6 leading-tight tracking-tight">{selectedArticle.title}</h2>
              <div className="p-5 bg-gradient-to-br from-cyan-50 to-white dark:from-slate-800 dark:to-slate-900 rounded-2xl border border-cyan-100 dark:border-slate-700 mb-6 relative transition-colors duration-300">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-bold text-cyan-800 dark:text-cyan-400 flex items-center gap-2"><span>✨</span> Glance AI Summary</h4>
                  
                  {/*UPGRADED COPY BUTTON WITH FEEDBACK */}
                  {!isSummarizing && summary && (
                    <button 
                      onClick={() => { 
                        navigator.clipboard.writeText(summary); 
                        setIsCopied(true);
                        setTimeout(() => setIsCopied(false), 2000);
                      }} 
                      className={`cursor-pointer flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1.5 rounded-lg transition-all duration-300 ${
                        isCopied 
                        ? 'bg-emerald-500 text-white shadow-md' 
                        : 'text-cyan-700 dark:text-cyan-300 bg-cyan-100/50 dark:bg-cyan-900/30 hover:bg-cyan-100 dark:hover:bg-cyan-900/50'
                      }`}
                    >
                      {isCopied ? (
                        <>
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-3 h-3 animate-in zoom-in duration-300">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                          </svg>
                          Copied!
                        </>
                      ) : (
                        'Copy'
                      )}
                    </button>
                  )}
                </div>

                {isSummarizing ? (
                  <div className="flex flex-col items-center justify-center py-10">
                    <div className="flex space-x-2 mb-5">
                      <div className="w-3 h-3 bg-cyan-600 dark:bg-cyan-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                      <div className="w-3 h-3 bg-cyan-600 dark:bg-cyan-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                      <div className="w-3 h-3 bg-cyan-600 dark:bg-cyan-500 rounded-full animate-bounce"></div>
                    </div>
                    <div className="text-cyan-700 dark:text-cyan-400 font-black text-sm tracking-widest uppercase animate-pulse flex items-center gap-2">
                      AI is reading the news
                      <span className="flex space-x-1">
                        <span className="animate-[ping_1.5s_infinite] inline-flex h-1.5 w-1.5 rounded-full bg-cyan-400"></span>
                      </span>
                    </div>
                    <p className="text-slate-400 dark:text-slate-500 text-[11px] mt-3 font-bold italic">Generating your Glance summary...</p>
                  </div>
                ) : (
                  <div className="text-slate-700 dark:text-slate-300 leading-relaxed font-medium whitespace-pre-wrap text-sm md:text-base">
                    {summary}
                  </div>
                )}
              </div>
              <a href={selectedArticle.url} target="_blank" rel="noreferrer" className="inline-block w-full text-center bg-slate-900 dark:bg-cyan-600 text-white px-8 py-3 rounded-xl text-sm font-bold hover:bg-cyan-600 dark:hover:bg-cyan-500 transition-colors shadow-md">Read Full Article</a>
            </div>
          </div>
        </div>
      )}

      {/* COMPACT PREMIUM AUTH MODAL */}
      {isAuthModalOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-[360px] overflow-hidden shadow-2xl transition-colors duration-300 border border-slate-100 dark:border-slate-800 p-5 text-center relative zoom-in-95 animate-in">
            <button onClick={() => setIsAuthModalOpen(false)} className="absolute top-3 right-3 cursor-pointer text-slate-400 hover:text-rose-500 bg-slate-50 dark:bg-slate-800 rounded-full w-7 h-7 flex items-center justify-center transition-colors">✕</button>
            <div className="w-10 h-10 bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400 rounded-xl flex items-center justify-center mx-auto mb-2 transform rotate-3">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 -rotate-3">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
              </svg>
            </div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white mb-1 tracking-tight">{authMode === 'signup' ? 'Join Glance' : 'Welcome Back'}</h2>
            <p className="text-slate-500 dark:text-slate-400 text-[12px] font-medium mb-4 leading-snug px-1">{authMessage || (authMode === 'signup' ? "Create a free account to save unlimited articles" : "Log in to access your saved articles")}</p>

            {authError && (
              <div className="bg-rose-50 dark:bg-rose-500/10 text-rose-500 dark:text-rose-400 text-[11px] px-3 py-2 rounded-lg mb-3 font-semibold border border-rose-100 dark:border-rose-500/20 text-left flex items-start gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5 mt-0.5 shrink-0"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" /></svg>
                <span>{authError}</span>
              </div>
            )}

            <form onSubmit={handleAuthSubmit} className="space-y-2">
              <button type="button" className="w-full flex items-center justify-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 px-4 py-2 rounded-xl text-xs font-bold hover:shadow-md transition-all">
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Continue with Google
              </button>
              
              <div className="flex items-center gap-2 py-0.5"><div className="h-px bg-slate-200 dark:bg-slate-700 flex-1"></div><span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">OR</span><div className="h-px bg-slate-200 dark:bg-slate-700 flex-1"></div></div>
              
              {authMode === 'signup' && (
                <input type="text" placeholder="Full Name" value={authName} onChange={(e) => setAuthName(e.target.value)} required className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-cyan-500 text-slate-900 dark:text-white" />
              )}
              
              <input type="email" placeholder="Email" value={authEmail} onChange={(e) => setAuthEmail(e.target.value)} required className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-cyan-500 text-slate-900 dark:text-white" />
              
              <div className="relative w-full">
                <input 
                  type={showPassword ? "text" : "password"} 
                  placeholder="Password" 
                  value={authPassword} 
                  onChange={(e) => setAuthPassword(e.target.value)} 
                  onFocus={() => setIsPasswordFocused(true)}
                  onBlur={() => setIsPasswordFocused(false)}
                  required 
                  minLength={8} 
                  autoComplete="off"
                  className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-300 dark:border-slate-700 rounded-xl pl-3 pr-10 py-2 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-cyan-500 text-slate-900 dark:text-white" 
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)} 
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-cyan-600 transition-colors cursor-pointer"
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" /></svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  )}
                </button>
              </div>
              
              {authMode === 'signup' && isPasswordFocused && (
                <p className="text-[10px] text-slate-400 dark:text-slate-500 text-left px-1 mt-1 leading-tight transition-opacity duration-300">
                  Password must be at least 8 characters, including a number and a special symbol (!@#).
                </p>
              )}

              <button type="submit" disabled={isAuthLoading} className="w-full bg-slate-900 dark:bg-cyan-600 text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-md hover:bg-cyan-500 transition-colors cursor-pointer disabled:opacity-50 mt-1">
                {isAuthLoading ? '...' : (authMode === 'signup' ? 'Sign Up' : 'Log In')}
              </button>
            </form>
            <div className="mt-3 text-[12px] font-medium text-slate-500 dark:text-slate-400">
              {authMode === 'signup' ? (<>Already have an account? <span onClick={() => {setAuthMode('login'); setAuthError('');}} className="text-cyan-600 dark:text-cyan-400 hover:underline cursor-pointer">Log in</span></>) : (<>Don't have an account? <span onClick={() => {setAuthMode('signup'); setAuthError('');}} className="text-cyan-600 dark:text-cyan-400 hover:underline cursor-pointer">Sign up</span></>)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}