import { getOtherer } from './other.js'

export function getName() {
  return 'name' + getOtherer()
}
