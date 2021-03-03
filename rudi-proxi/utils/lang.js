const {DEFAULT_LANG} = require(`../routes/apiUrl`)

let currentLanguage = DEFAULT_LANG

exports.setLanguage = (lang) => {
  if (lang == currentLanguage) return

  if ('' == lang) throw new Error(`No language was provided`)

  currentLanguage = lang
}
exports.getLanguage = _ => {
  return currentLanguage
}