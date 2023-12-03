import { shallowEqual } from "./shallowEqual";

export function updateView<T extends Element, Props extends object>(
  element: T,
  view: (props: Props) => Partial<T>,
  props: Props,
) {
  let lastProps: Props | undefined;
  if (!lastProps || !shallowEqual(lastProps, props)) {
    lastProps = props;
    Object.assign(element, view(props));
  }
}
