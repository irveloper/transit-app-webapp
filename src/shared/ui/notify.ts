import { type SileoOptions, sileo } from "sileo";

const DEFAULT_POSITION: SileoOptions["position"] = "top-right";
type NotifyPromiseOptions = Parameters<typeof sileo.promise>[1];

function withDefaults(options: SileoOptions): SileoOptions {
  return {
    position: DEFAULT_POSITION,
    ...options,
  };
}

export const notify = {
  success(options: SileoOptions) {
    return sileo.success(withDefaults(options));
  },
  error(options: SileoOptions) {
    return sileo.error(withDefaults(options));
  },
  warning(options: SileoOptions) {
    return sileo.warning(withDefaults(options));
  },
  info(options: SileoOptions) {
    return sileo.info(withDefaults(options));
  },
  action(options: SileoOptions) {
    return sileo.action(withDefaults(options));
  },
  promise<T>(
    promise: Promise<T> | (() => Promise<T>),
    options: NotifyPromiseOptions,
  ) {
    return sileo.promise(promise, {
      ...options,
      position: options.position ?? DEFAULT_POSITION,
    });
  },
};
