import { createRoot } from "react-dom/client";
import Main from "./components/main";
import { RouterProvider, createBrowserRouter } from "react-router-dom";
import React from "react";

const app = document.getElementById("app");
if (!app) {
  throw new Error("No app element, can not render the app. Add an element with id='app' to the body.");
}

function App() {
  const router = createBrowserRouter([{ path: "/", action: () => <Main />, Component: Main }]);

  return (
    <React.StrictMode>
      <RouterProvider router={router} />
    </React.StrictMode>
  );
}

createRoot(app).render(<App />);
