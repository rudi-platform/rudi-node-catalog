/**
 * Position on the South / North meridian
 */
exports.Latitude = {
  type: Number,
  min: -90,
  max: 90,
}

/**
 * Position around the equator
 */
exports.Longitude = {
  type: Number,
  min: -180,
  max: 180,
}

/**
 * 2D position on the globe
 */
exports.GpsCoordinates = {
  latitude: this.Latitude,
  longitude: this.Longitude,
}
