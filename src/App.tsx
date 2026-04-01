/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Image as ImageIcon, Upload, Copy, Check, Type, AlignJustify, Palette, Square, Download, Settings2, Globe, Layers } from 'lucide-react';

const LANGUAGE_SETS: Record<string, { simple: string; complex: string }> = {
  custom: { simple: "", complex: "" },
  general: {
    simple: "@%#*+=-:. ",
    complex: "$@B%8&WM#*oahkbdpqwmZO0QLCJUYXzcvunxrjft/\\|()1{}[]?-_+~<>i!lI;:,\"^`'. "
  },
  english: {
    simple: "WMNOabc. ",
    complex: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 "
  },
  chinese: {
    simple: "鬱國中人一 ",
    complex: "龘鬱驫繁國華中漢語人口天大一 "
  },
  japanese: {
    simple: "あいうえお ",
    complex: "あいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやゆよらりるれろわをんアイウエオ"
  },
  korean: {
    simple: "ㄱㄴㄷㄹㅁ ",
    complex: "가나다라마바사아자차카타파하ㄱㄴㄷㄹㅁㅂㅅㅇㅈㅊㅋㅌㅍㅎ "
  },
  german: {
    simple: "ÄÖÜßẞaei. ",
    complex: "ÄÖÜßẞäöüabcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 "
  },
  french: {
    simple: "éàèùçâêîôû. ",
    complex: "éàèùçâêîôûëïüABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 "
  },
  russian: {
    simple: "ШЩЖМНБВ. ",
    complex: "ШЩЖМНВБЮЯРПЛДТЦЧСУФХЬЫЪЭОКГЕАИЙЗ "
  }
};

// --- Main Application Component ---
function MainApp() {
  const [dateStr, setDateStr] = useState("");
  const [language, setLanguage] = useState("custom");
  const [complexity, setComplexity] = useState<"simple" | "complex">("simple");
  
  // Advanced Settings
  const [asciiStyle, setAsciiStyle] = useState<"density" | "sequential">("density");
  const [useColor, setUseColor] = useState(true);
  const [bgColor, setBgColor] = useState<"black" | "white">("black");
  const [numCols, setNumCols] = useState(150);
  
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [asciiText, setAsciiText] = useState<string | null>(null);
  const [asciiImageSrc, setAsciiImageSrc] = useState<string | null>(null);
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setImageSrc(event.target?.result as string);
        setAsciiText(null);
        setAsciiImageSrc(null);
      };
      reader.readAsDataURL(file);
    }
  };

  // Optimized ASCII Generation Algorithm (Block Averaging & Color Support)
  const generateAscii = (
    imgSrc: string,
    customString: string,
    lang: string,
    comp: "simple" | "complex",
    style: "density" | "sequential",
    colorEnabled: boolean,
    background: "black" | "white",
    columns: number
  ): Promise<{ text: string; dataUrl: string }> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "Anonymous";
      img.onload = () => {
        // ... (rest of the logic remains similar but uses the new character source)
        // 1. Read original image data
        const inCanvas = document.createElement('canvas');
        inCanvas.width = img.width;
        inCanvas.height = img.height;
        const inCtx = inCanvas.getContext('2d');
        if (!inCtx) return reject(new Error("No canvas context"));
        
        inCtx.fillStyle = "white";
        inCtx.fillRect(0, 0, img.width, img.height);
        inCtx.drawImage(img, 0, 0);
        const imgData = inCtx.getImageData(0, 0, img.width, img.height).data;

        const cellWidth = img.width / columns;
        const scale = 2;
        const cellHeight = cellWidth * scale;
        const numRows = Math.floor(img.height / cellHeight);

        const outCanvas = document.createElement('canvas');
        const charWidth = 8;
        const charHeight = charWidth * scale;
        outCanvas.width = charWidth * columns;
        outCanvas.height = charHeight * numRows;
        const outCtx = outCanvas.getContext('2d');
        if (!outCtx) return reject(new Error("No canvas context"));

        outCtx.fillStyle = background;
        outCtx.fillRect(0, 0, outCanvas.width, outCanvas.height);
        outCtx.font = `bold ${charHeight * 0.8}px monospace`;
        outCtx.textAlign = "center";
        outCtx.textBaseline = "middle";

        // 4. Prepare characters
        let charSource = "";
        if (lang === "custom") {
          charSource = customString;
        } else {
          charSource = LANGUAGE_SETS[lang][comp];
          // If user also provided a custom string, append it for more variety
          if (customString.trim()) {
            charSource += customString;
          }
        }

        const rawChars = charSource.replace(/\s/g, '').split('');
        const uniqueChars = Array.from(new Set(rawChars));
        if (uniqueChars.length === 0) uniqueChars.push('#');
        const seqChars = rawChars.length > 0 ? rawChars : ['#'];

        // Density calculation
        const charDensities = uniqueChars.map(char => {
          const cCanvas = document.createElement('canvas');
          cCanvas.width = 20; cCanvas.height = 20;
          const cCtx = cCanvas.getContext('2d')!;
          cCtx.font = '16px monospace';
          cCtx.fillStyle = "black";
          cCtx.fillText(char, 2, 16);
          const cData = cCtx.getImageData(0, 0, 20, 20).data;
          let count = 0;
          for (let i = 3; i < cData.length; i += 4) {
            if (cData[i] > 0) count++;
          }
          return { char, density: count };
        });

        charDensities.sort((a, b) => a.density - b.density);
        const sortedChars = charDensities.map(c => c.char);
        const palette = [' ', '.', ...sortedChars];

        let textOutput = '';
        let seqIndex = 0;

        for (let i = 0; i < numRows; i++) {
          for (let j = 0; j < columns; j++) {
            const startY = Math.floor(i * cellHeight);
            const endY = Math.min(Math.floor((i + 1) * cellHeight), img.height);
            const startX = Math.floor(j * cellWidth);
            const endX = Math.min(Math.floor((j + 1) * cellWidth), img.width);

            let rSum = 0, gSum = 0, bSum = 0, count = 0;
            for (let y = startY; y < endY; y++) {
              for (let x = startX; x < endX; x++) {
                const offset = (y * img.width + x) * 4;
                rSum += imgData[offset];
                gSum += imgData[offset + 1];
                bSum += imgData[offset + 2];
                count++;
              }
            }

            if (count === 0) count = 1;
            const r = Math.floor(rSum / count);
            const g = Math.floor(gSum / count);
            const b = Math.floor(bSum / count);
            const brightness = (0.299 * r + 0.587 * g + 0.114 * b);

            let char = ' ';
            if (style === 'density') {
              const paletteIndex = Math.floor((brightness / 255) * (palette.length - 1));
              if (background === "black") {
                char = palette[paletteIndex];
              } else {
                char = palette[palette.length - 1 - paletteIndex];
              }
            } else {
              const threshold = background === "black" ? 50 : 200;
              const isFilled = background === "black" ? brightness > threshold : brightness < threshold;
              if (isFilled) {
                char = seqChars[seqIndex % seqChars.length];
                seqIndex++;
              }
            }

            textOutput += char;
            if (char !== ' ') {
              outCtx.fillStyle = colorEnabled ? `rgb(${r},${g},${b})` : (background === "black" ? "white" : "black");
              outCtx.fillText(char, j * charWidth + charWidth / 2, i * charHeight + charHeight / 2);
            }
          }
          textOutput += '\n';
        }

        resolve({
          dataUrl: outCanvas.toDataURL('image/jpeg', 0.95),
          text: textOutput
        });
      };
      img.onerror = () => reject(new Error("Failed to load image for ASCII conversion"));
      img.src = imgSrc;
    });
  };

  const handleProcess = async () => {
    if (!dateStr.trim() && language === "custom") {
      setError("Please enter a date or text to use for the ASCII characters, or select a language preset.");
      return;
    }

    if (!imageSrc) {
      setError("No image available to process. Please upload an image first.");
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const result = await generateAscii(imageSrc, dateStr, language, complexity, asciiStyle, useColor, bgColor, numCols);
      setAsciiText(result.text);
      setAsciiImageSrc(result.dataUrl);

    } catch (err: any) {
      console.error(err);
      setError(err.message || "An error occurred during processing.");
    } finally {
      setIsProcessing(false);
    }
  };

  const copyToClipboard = () => {
    if (asciiText) {
      navigator.clipboard.writeText(asciiText);
      showToast("ASCII Text copied to clipboard!");
    }
  };

  const downloadImage = () => {
    if (asciiImageSrc) {
      const a = document.createElement('a');
      a.href = asciiImageSrc;
      a.download = `ascii-image-${Date.now()}.jpg`;
      a.click();
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-cyan-900/50 pb-12">
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-slate-900 border border-cyan-500/30 text-cyan-50 px-4 py-3 rounded-lg shadow-[0_0_15px_rgba(6,182,212,0.2)] flex items-center gap-2 animate-in fade-in slide-in-from-top-4">
          <Check className="w-4 h-4 text-cyan-400" />
          <span className="text-sm font-medium">{toast}</span>
        </div>
      )}

      <header className="border-b border-cyan-900/50 bg-slate-950/80 p-6 sticky top-0 z-10 backdrop-blur-xl shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
        <div className="max-w-7xl mx-auto flex items-center gap-3">
          <div className="bg-cyan-500/20 p-2 rounded-lg shadow-[0_0_10px_rgba(6,182,212,0.3)]">
            <Sparkles className="text-cyan-400 w-5 h-5 drop-shadow-[0_0_5px_rgba(34,211,238,0.8)]" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 drop-shadow-[0_0_10px_rgba(34,211,238,0.3)]">Image-to-ASCII Studio</h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-8 mt-4">
        
        {/* Controls Sidebar */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-6 shadow-[0_8px_32px_rgba(0,0,0,0.4)] backdrop-blur-md relative overflow-hidden">
            <div className="absolute -top-24 -left-24 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>
            
            {/* Inputs */}
            <div className="space-y-4 relative z-10">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Upload Photo</label>
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full bg-slate-950/50 border border-slate-700 border-dashed rounded-xl px-4 py-8 text-sm text-slate-400 hover:text-cyan-300 hover:border-cyan-500/50 hover:bg-cyan-950/20 transition-all flex flex-col items-center gap-2 group"
                >
                  <ImageIcon className="w-6 h-6 group-hover:drop-shadow-[0_0_8px_rgba(34,211,238,0.8)] transition-all" />
                  {imageSrc ? "Change Image" : "Click to select an image"}
                </button>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Character Set</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <select
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all appearance-none"
                    >
                      <option value="custom">Custom Only</option>
                      <option value="general">General (Standard)</option>
                      <option value="english">English</option>
                      <option value="chinese">Chinese</option>
                      <option value="japanese">Japanese</option>
                      <option value="korean">Korean</option>
                      <option value="german">German</option>
                      <option value="french">French</option>
                      <option value="russian">Russian</option>
                    </select>
                  </div>
                  <button
                    onClick={() => setComplexity(complexity === "simple" ? "complex" : "simple")}
                    className={`px-4 rounded-xl border transition-all flex items-center gap-2 text-xs font-bold ${
                      complexity === "complex" ? "bg-cyan-500/20 border-cyan-500/50 text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.2)]" : "bg-slate-950 border-slate-800 text-slate-400"
                    }`}
                    title="Toggle Complexity"
                  >
                    <Layers className="w-4 h-4" />
                    {complexity === "simple" ? "Simple" : "Complex"}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Date / Month (Optional if Language selected)</label>
                <input
                  type="text"
                  value={dateStr}
                  onChange={(e) => setDateStr(e.target.value)}
                  placeholder="e.g., 28/09"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all shadow-inner"
                />
              </div>
            </div>

            {/* Advanced Settings */}
            <div className="pt-4 border-t border-slate-800 space-y-4 relative z-10">
              <h3 className="text-sm font-semibold text-cyan-500/80 uppercase tracking-wider flex items-center gap-2">
                <Settings2 className="w-4 h-4" /> Settings
              </h3>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">ASCII Style</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setAsciiStyle("density")}
                    className={`py-2 px-3 rounded-lg flex items-center justify-center gap-2 text-xs font-medium transition-all border ${
                      asciiStyle === "density" ? "bg-cyan-500/20 border-cyan-500/50 text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.2)]" : "bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800 hover:border-cyan-500/30"
                    }`}
                  >
                    <Type className="w-3 h-3" /> Density Map
                  </button>
                  <button
                    onClick={() => setAsciiStyle("sequential")}
                    className={`py-2 px-3 rounded-lg flex items-center justify-center gap-2 text-xs font-medium transition-all border ${
                      asciiStyle === "sequential" ? "bg-cyan-500/20 border-cyan-500/50 text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.2)]" : "bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800 hover:border-cyan-500/30"
                    }`}
                  >
                    <AlignJustify className="w-3 h-3" /> Sequential
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Color Mode</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setUseColor(true)}
                    className={`py-2 px-3 rounded-lg flex items-center justify-center gap-2 text-xs font-medium transition-all border ${
                      useColor ? "bg-cyan-500/20 border-cyan-500/50 text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.2)]" : "bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800 hover:border-cyan-500/30"
                    }`}
                  >
                    <Palette className="w-3 h-3" /> Colored
                  </button>
                  <button
                    onClick={() => setUseColor(false)}
                    className={`py-2 px-3 rounded-lg flex items-center justify-center gap-2 text-xs font-medium transition-all border ${
                      !useColor ? "bg-cyan-500/20 border-cyan-500/50 text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.2)]" : "bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800 hover:border-cyan-500/30"
                    }`}
                  >
                    <Square className="w-3 h-3" /> Monochrome
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Background</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setBgColor("black")}
                    className={`py-2 px-3 rounded-lg flex items-center justify-center gap-2 text-xs font-medium transition-all border ${
                      bgColor === "black" ? "bg-cyan-500/20 border-cyan-500/50 text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.2)]" : "bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800 hover:border-cyan-500/30"
                    }`}
                  >
                    <div className="w-3 h-3 bg-black border border-slate-600 rounded-sm" /> Dark
                  </button>
                  <button
                    onClick={() => setBgColor("white")}
                    className={`py-2 px-3 rounded-lg flex items-center justify-center gap-2 text-xs font-medium transition-all border ${
                      bgColor === "white" ? "bg-cyan-500/20 border-cyan-500/50 text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.2)]" : "bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800 hover:border-cyan-500/30"
                    }`}
                  >
                    <div className="w-3 h-3 bg-white border border-slate-400 rounded-sm" /> Light
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium text-slate-300">Resolution (Columns)</label>
                  <span className="text-xs text-cyan-500 font-mono bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">{numCols}</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="300"
                  step="10"
                  value={numCols}
                  onChange={(e) => setNumCols(parseInt(e.target.value))}
                  className="w-full accent-cyan-500"
                />
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm relative z-10">
                {error}
              </div>
            )}

            <button
              onClick={handleProcess}
              disabled={isProcessing || !imageSrc}
              className="w-full py-3.5 px-4 bg-cyan-500 text-cyan-950 font-bold rounded-xl hover:bg-cyan-400 hover:shadow-[0_0_25px_rgba(34,211,238,0.6)] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none transition-all shadow-[0_0_15px_rgba(34,211,238,0.3)] flex items-center justify-center gap-2 relative z-10"
            >
              {isProcessing ? (
                <>
                  <div className="w-4 h-4 border-2 border-cyan-950/30 border-t-cyan-950 rounded-full animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Convert to ASCII
                </>
              )}
            </button>
          </div>

          {/* Original Image Preview */}
          {imageSrc && (
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-3 shadow-[0_8px_32px_rgba(0,0,0,0.4)] backdrop-blur-md">
              <h3 className="text-sm font-medium text-slate-400">Original Image</h3>
              <div className="rounded-xl overflow-hidden border border-slate-800 bg-slate-950 aspect-square flex items-center justify-center relative group">
                <img src={imageSrc} alt="Original" className="w-full h-full object-contain relative z-10" />
              </div>
            </div>
          )}
        </div>

        {/* Output Area */}
        <div className="lg:col-span-8">
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.4)] backdrop-blur-md flex flex-col h-full min-h-[600px] relative">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-500/10 rounded-full blur-[100px] pointer-events-none"></div>
            
            <div className="bg-slate-800/50 border-b border-slate-800 p-4 flex items-center justify-between relative z-10">
              <h2 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-cyan-500" />
                Rendered Output
              </h2>
              {asciiImageSrc && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={copyToClipboard}
                    className="flex items-center gap-2 text-xs font-medium bg-slate-800/80 hover:bg-slate-700 text-cyan-300 py-1.5 px-3 rounded-lg transition-all border border-cyan-500/30 hover:border-cyan-400 hover:shadow-[0_0_15px_rgba(34,211,238,0.3)] backdrop-blur-sm"
                  >
                    <Copy className="w-3 h-3" /> Copy Text
                  </button>
                  <button
                    onClick={downloadImage}
                    className="flex items-center gap-2 text-xs font-medium bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 py-1.5 px-3 rounded-lg transition-all border border-cyan-500/50 hover:border-cyan-400 hover:shadow-[0_0_20px_rgba(34,211,238,0.4)] backdrop-blur-sm"
                  >
                    <Download className="w-3 h-3" /> Download Image
                  </button>
                </div>
              )}
            </div>
            
            <div className={`flex-1 p-6 overflow-auto flex items-center justify-center relative z-10 ${bgColor === 'white' ? 'bg-white' : 'bg-[#050505]'}`}>
              {asciiImageSrc ? (
                <img 
                  src={asciiImageSrc} 
                  alt="ASCII Art" 
                  className="max-w-full h-auto object-contain shadow-2xl rounded-sm"
                />
              ) : (
                <div className="text-center space-y-4 text-slate-500">
                  <div className="w-16 h-16 border border-slate-700 border-dashed rounded-2xl flex items-center justify-center mx-auto bg-slate-800/30">
                    <Type className="w-6 h-6 opacity-50" />
                  </div>
                  <p className="text-sm">Your ASCII art will appear here</p>
                </div>
              )}
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}

export default function App() {
  return <MainApp />;
}
