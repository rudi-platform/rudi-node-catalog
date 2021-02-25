let currentLanguage = 'en'
exports.setLanguage = (lang) => {
  if (lang == currentLanguage) return

  if ('' == lang) throw new Error(`No language was provided`)

  currentLanguage = lang
}
exports.getLanguage = _ => {
  return currentLanguage
}