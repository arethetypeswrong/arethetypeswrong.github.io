import type { Analysis } from "@arethetypeswrong/core";

export default function Details({ analysis }: { analysis: Analysis }) {
  return (
    <div id="details">
      <pre>{JSON.stringify(analysis)}</pre>
    </div>
  );
}
