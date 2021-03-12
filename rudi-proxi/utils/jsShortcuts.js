'use strict';

exports.nowISO = () => {
  return new Date().toISOString()
}
exports.isNotEmptyArray = (anArray) => {
  return Array.isArray(anArray) && anArray.length > 0
}