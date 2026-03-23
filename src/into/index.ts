import type { Transducer } from "../types/index.ts";
import { transduce } from "../transduce/index.ts";

/**
 * Transduce `from` into a target array.
 */
export function into<A, B>(to: B[], xform: Transducer<A, B>, from: Iterable<A>): B[] {
  return transduce(
    xform,
    (acc: B[], x: B) => {
      acc.push(x);
      return acc;
    },
    to,
    from,
  );
}
