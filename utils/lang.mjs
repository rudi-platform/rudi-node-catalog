import { DEFAULT_LANG } from '../config/confApi.mjs'

let currentLanguage = DEFAULT_LANG

export const setLanguage = (lang) => {
  if (lang === currentLanguage) return

  if (lang === '') throw new Error(`No language was provided`)

  currentLanguage = lang
}
export const getLanguage = () => {
  return currentLanguage
}
