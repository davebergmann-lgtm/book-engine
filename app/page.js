'use client'
import React, { useState } from 'react';
import { Search, BookOpen, Headphones, Info, Import, Zap, ShieldCheck, Check } from 'lucide-react';
import { parseQuery, getBooks, importHistory } from './actions';

export default function LibrarianApp() {
  const [input, setInput] = useState("");
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hoverTip, setHoverTip] = useState(null);

  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const filters = await parseQuery(input);
      const results = await getBooks(input, filters);
      setBooks(results);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const handleUpload = async (e) => {
    const text = await e.target.files[0].text();
    const count = await importHistory(text);
    alert(`The Librarian now remembers ${count} past reads.`);
  };

  return (
    <div className="min-h-screen bg-[#fafafa] text-slate-900 font-sans p-8 md:p-24 selection:bg-black selection:text-white">
      {/* Top Nav */}
      <nav className="flex justify-between items-center mb-32">
        <span className="text-xs tracking-[0.5em] uppercase font-light">The Librarian</span>
        <label className="cursor-pointer group">
          <input type="file" className="hidden" onChange={handleUpload} accept=".csv" />
          <Import size={20} className="text-slate-300 group-hover:text-black transition-colors" />
        </label>
      </nav>

      <main className="max-w-2xl mx-auto">
        {/* Natural Language Search */}
        <form onSubmit={handleSearch} className="relative mb-24 group">
          <input 
            className="w-full bg-transparent border-b border-slate-200 py-4 text-3xl font-light focus:outline-none focus:border-black transition-all placeholder:text-slate-200"
            placeholder="Search by trope, identity, or vibe..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <button type="submit" className="absolute right-0 top-6 text-slate-300 group-hover:text-black transition-colors">
            {loading ? <div className="animate-spin h-5 w-5 border-2 border-black border-t-transparent rounded-full" /> : <Search size={24} />}
          </button>
          <p className="text-[10px] text-slate-400 mt-4 uppercase tracking-widest leading-relaxed">
            {loading ? "Consulting the archives..." : "e.g., Legal thriller from the last 5 years with a female lead"}
          </p>
        </form>

        {/* Results List */}
        <div className="space-y-16">
          {books.map((book, i) => (
            <div key={i} className="group border-b border-slate-50 pb-12 transition-all">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-2xl font-light italic mb-1">{book.title}</h2>
                  <p className="text-xs text-slate-400 uppercase tracking-widest">{book.author}</p>
                </div>
                <div className="flex gap-3">
                  <div onMouseEnter={() => setHoverTip(book.reason)} onMouseLeave={() => setHoverTip(null)} className="cursor-help text-slate-200 hover:text-black transition-colors">
                    <ShieldCheck size={20} strokeWidth={1.5} />
                  </div>
                  {book.isFirstInSeries && <Zap size={20} className="text-orange-300" title="1st in Series" />}
                </div>
              </div>

              {/* Hover Insight Area */}
              <div className={`text-xs text-slate-500 mb-8 transition-opacity ${hoverTip === book.reason ? 'opacity-100' : 'opacity-0'}`}>
                <span className="text-black font-bold mr-2">—</span> {book.reason}
              </div>

              {/* Affiliate Links */}
              <div className="flex gap-8 text-[10px] tracking-[0.2em] uppercase text-slate-400">
                <a href={`https://www.amazon.com/s?k=${book.isbn}&tag=your-id-20`} target="_blank" className="hover:text-black transition-colors">Kindle</a>
                <a href={`https://www.audible.com/search?keywords=${book.title}`} target="_blank" className="hover:text-orange-500 transition-colors">Audible</a>
                <a href={`https://bookshop.org/a/your-id/${book.isbn}`} target="_blank" className="hover:text-blue-500 transition-colors">Physical</a>
                <a href={`https://libbyapp.com/search/query-${encodeURIComponent(book.title)}`} target="_blank" className="hover:text-purple-600 transition-colors ml-auto flex items-center gap-1">
                  <BookOpen size={12} /> Libby
                </a>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}