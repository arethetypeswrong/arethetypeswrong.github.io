import JSONView from "@andrewbranch/json-view";
import type { Analysis } from "@arethetypeswrong/core";
import { useEffect, useRef } from "react";

export default function Details({ analysis }: { analysis: Analysis }) {
  const details = new JSONView("Details", { analysis: analysis });
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.innerHTML = "";
      ref.current.appendChild(details.dom);
    }
  }, [analysis]);

  return <div ref={ref} id="details"></div>;
}
