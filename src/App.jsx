import React, { useState, useEffect } from "react";

const colors = {
  light: {
    bg: "bg-gradient-to-br from-blue-50 via-white to-blue-100",
    text: "text-gray-900",
    card: "bg-white",
    border: "border-gray-200",
    button: "bg-blue-600 text-white hover:bg-blue-700",
  },
  dark: {
    bg: "bg-gradient-to-br from-gray-900 via-gray-800 to-gray-700",
    text: "text-gray-100",
    card: "bg-gray-800",
    border: "border-gray-700",
    button: "bg-yellow-400 text-gray-900 hover:bg-yellow-500",
  },
};

function App() {
  const [darkMode, setDarkMode] = useState(() =>
    window.matchMedia("(prefers-color-scheme: dark)").matches
  );

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  const theme = darkMode ? colors.dark : colors.light;

  return (
    <div className={`min-h-screen ${theme.bg} transition-colors duration-500`}>
      <header className={`flex items-center justify-between px-6 py-4 shadow ${theme.card} ${theme.border} border-b`}> 
        <h1 className={`text-2xl font-bold ${theme.text}`}>Hostel Swap</h1>
        <button
          onClick={() => setDarkMode((d) => !d)}
          className={`px-4 py-2 rounded transition ${theme.button} focus:outline-none`}
        >
          {darkMode ? "Switch to Day" : "Switch to Night"}
        </button>
      </header>
      <main className="max-w-3xl mx-auto p-6 flex flex-col gap-8">
        <section className={`rounded-xl shadow-lg p-6 ${theme.card} ${theme.border} border`}> 
          <h2 className={`text-xl font-semibold mb-2 ${theme.text}`}>Welcome!</h2>
          <p className="text-gray-500 dark:text-gray-300">
            This is a responsive, modern website with a day/night theme switcher. No 3D animations, just clean color grading and modular design.
          </p>
        </section>
        <section className={`rounded-xl shadow-lg p-6 ${theme.card} ${theme.border} border`}> 
          <h2 className={`text-xl font-semibold mb-2 ${theme.text}`}>Responsive Demo</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-blue-100 dark:bg-gray-700 text-blue-900 dark:text-blue-200">Card 1</div>
            <div className="p-4 rounded-lg bg-blue-50 dark:bg-gray-600 text-blue-800 dark:text-blue-100">Card 2</div>
          </div>
        </section>
      </main>
      <footer className={`text-center py-4 ${theme.text}`}>© {new Date().getFullYear()} Hostel Swap</footer>
    </div>
  );
}

export default App; 