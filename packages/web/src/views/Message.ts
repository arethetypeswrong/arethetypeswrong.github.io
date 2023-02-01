export function Message(props: { isError?: boolean; text: string }) {
  return {
    className: props.isError ? "error" : "",
    innerHTML: props.text,
  };
}
