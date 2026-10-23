// Plain data shared by server and client admin components

export const statusOptions = [
  { value: "live", label: "Live" },
  { value: "in-progress", label: "In progress" },
  { value: "archived", label: "Archived" },
];

// The admin's own light/dark choice (see scheme-toggle.tsx). The script runs in
// <head> so a saved choice applies before first paint.
export const schemeKey = "admin-scheme";
export const schemeScript = `try{var s=localStorage.getItem("${schemeKey}");if(s==="light"||s==="dark")document.documentElement.dataset.scheme=s}catch(e){}`;
