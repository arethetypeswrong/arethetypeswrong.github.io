import { render } from "react-dom";
import Main from "./components/main";

const app = document.getElementById("app");

function App() {
  return <Main />;
}

render(<App />, app);
