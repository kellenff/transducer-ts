import type { Transducer } from "../types/index.ts";
import { into } from "../into/index.ts";

/**
 * Eagerly apply a transducer to a collection and return a new array.
 */
export function sequence<A, B>(xform: Transducer<A, B>, coll: Iterable<A>): B[] {
  return into([], xform, coll);
}
