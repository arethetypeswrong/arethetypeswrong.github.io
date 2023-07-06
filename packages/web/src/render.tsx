import { render } from "react-dom";
import PackageForm from "./components/packageForm";

const app = document.getElementById("app");

function App() {
  return (
    <div>
      <h1>Are the types</h1>
      <PackageForm />
    </div>
  );
}

render(<App />, app);
