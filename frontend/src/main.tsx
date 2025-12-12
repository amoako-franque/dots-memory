import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import "./index.css"
import App from "./App.tsx"
import { BrowserRouter } from "react-router-dom"
import { Provider } from "react-redux"
import { store } from "./store"

const savedTheme =
	localStorage.getItem("theme") ||
	(window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
if (savedTheme === "dark") {
	document.documentElement.classList.add("dark")
} else {
	document.documentElement.classList.remove("dark")
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
		<Provider store={store}>
    <BrowserRouter>
      <App />
    </BrowserRouter>
		</Provider>
	</StrictMode>
)
