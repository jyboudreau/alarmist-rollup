// Circular dependency, to test rollup warnings.
import { getOther } from './other.js'

export function getName () {
  return 'name' + getOther()
}
