export function PackageInfo(props: { name?: string; version?: string }) {
  if (!props.name || !props.version) {
    return { className: "display-none" };
  }
  return {
    className: "",
    innerHTML: `
      ${props.name} v${props.version}
      <small>
        (<a href="https://npmjs.com/${props.name}">npm</a>,
        <a href="https://unpkg.com/browse/${props.name}@${props.version}/">unpkg</a>)
      </small>`,
  };
}
