import { useState } from "react";

export default function PackageForm() {
  const [packageName, setPackageName] = useState("");

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log(packageName);
  };

  return (
    <div>
      <h1>Package Form</h1>
      <form onSubmit={handleSubmit}>
        <label htmlFor="name">Name</label>
        <input value={packageName} onChange={(e) => setPackageName(e.target.value)} type="text" id="name" />
        <button type="submit">Check Package</button>
      </form>
    </div>
  );
}
