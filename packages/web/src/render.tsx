import { render } from "react-dom";

const app = document.getElementById("app");

function App() {
  return (
    <div>
      <h1>Hello, world!</h1>
    </div>
  );
}

render(<App />, app);
