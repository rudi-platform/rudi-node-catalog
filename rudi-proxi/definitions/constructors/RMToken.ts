/**
 * Rennes Métropole Token description
 *
 * @author: Laurent Morin, Olivier Martineau
 * @version: 1.0.0
 */
import { decodeBase64 } from '../../utils/jsUtils'
import { UUIDv4 } from './UUIDv4'

/*
 * -------------------------------------------------
 * Token descriptor
 * -------------------------------------------------
 */

/**
 * A basic token descriptor, as delivered by Rudi Portal when requesting a new token
 * @class
 * Expected structure :
 *
 * @field {string}  access_token   - A JWT.
 * @field {string}  token_type     - Currently only "bearer" is known
 * @field {integer} expires_in     - Number of seconds before expiration,
 * @field {string}  scope          - Access rights, currently ony "read"
 * @field {string}  jti            - An UUID, semantic unknown, changes between requests
 */
export interface RMTokenInfo {
  access_token: string // a JWT
  token_type: string // 'bearer'
  expires_in: number // period of time in Epoch seconds
  scope: string // 'read'
  jti: UUIDv4 // JWT identifier
}

export interface JWTHeader {
  alg: string // Hash algorithm ('HS256')
  typ: string // 'JWT'
}

export interface JWTPayload {
  exp: number
  user_name: string
  authorities: string[]
  jti: UUIDv4
  client_id: UUIDv4
  scope: string[]
}

/**
 * A basic token descriptor.
 * @class
 * Expected structure :
 *
 * @field {string}  access_token   - A JWT.
 * @field {string}  token_type     - Currently only "bearer" is known
 * @field {integer} expires_in     - Number of seconds before expiration,
 * @field {string}  scope          - Access rights, currently ony "read"
 * @field {string}  jti            - An UUID, semantic unknown, changes between requests
 *
 * Extra services expected in the future.
 *
 * @param {object}  data - Source structure
 */
export class RMToken {
  // RUDI Portal infos (encapsulating JWT)
  tokenInfo: RMTokenInfo

  jwt: {
    header: JWTHeader
    payload: JWTPayload
    signature: string
  }

  // Validation
  protected errorDescription: string

  /**
   * Creates a RMToken from the information transmitted from the RUDI Portal
   * @param data
   * @returns
   */
  constructor(data: RMTokenInfo) {
    this.errorDescription = 'unexpected error'
    try {
      this.tokenInfo = data

      if (this.tokenInfo.token_type.toLowerCase().trim() != 'bearer') {
        this.errorDescription =
          'Token: token type not supported ' + this.tokenInfo.token_type + ' ("Bearer" supported)'
        return
      }
      if (!this.tokenInfo.jti || !this.tokenInfo.access_token) {
        this.errorDescription = 'Token: missing jti field or access token'
        return
      }

      // Analyze the JWT content
      const jwt = this.tokenInfo.access_token.split('.')
      const header = JSON.parse(decodeBase64(jwt[0]))
      const payload = JSON.parse(decodeBase64(jwt[1]))
      const signature = jwt[2] // Buffer.from(jwt[2], 'base64')

      //console.log(util.inspect(header));
      if (header.alg != 'HS256' || header.typ != 'JWT') {
        this.errorDescription = 'JWT: format not supported'
        return
      }
      this.jwt.header = header as JWTHeader
      this.jwt.payload = payload as JWTPayload
      // TODO: check signature !
      this.jwt.signature = signature

      if (this.tokenInfo.jti !== this.jwt.payload['jti']) {
        this.errorDescription = 'JWT: inconsistent JTI'
        return
      }

      // Everything OK, no error was found
      this.errorDescription = null
    } catch (err) {}
  }

  /**
   * Return the access token
   * @return {string}   - The JWT token string used for a check request
   */
  get jwtString(): string {
    return this.tokenInfo.access_token
  }

  get expirationTime(): number {
    return this.jwt.payload.exp
  }

  get expirationDate(): Date {
    return new Date(this.expirationTime * 1000)
  }

  get error(): string {
    if (this.errorDescription === null && this.expirationDate < new Date()) {
      this.errorDescription = 'token expired (' + this.expirationDate + ')'
    }
    return this.errorDescription
  }

  set error(errMsg: string) {
    if (this.error === null) this.errorDescription = errMsg
  }

  /**
   * Check if the token is still valid
   *  Update and check if it has expired
   * @returns  An array [ <valid>, <error string, null if valid> ]
   *
   */
  get isValid(): boolean {
    return this.error === null
  }

  /**
   * Check read access rights
   * @returns {boolean}  - read access granted
   */
  canRead(): boolean {
    return this.isValid && this.tokenInfo.scope.includes('read')
  }

  /**
   * Check write access rights
   * @returns {boolean}  - write access granted
   */
  canWrite(): boolean {
    return this.isValid && this.tokenInfo.scope.includes('write')
  }

  /**
   * Time before expiration
   * @returns {number}  - time in seconds
   */
  get timeRemaining(): number {
    return this.expirationTime - new Date().getSeconds()
  }

  /**
   * Token description in human readable format
   * @returns {string}  - description
   */
  public toString(): string {
    return (
      'RM Token,' +
      ' type:' +
      this.tokenInfo.token_type +
      ' client:' +
      this.jwt.payload.client_id +
      ' scope:' +
      this.tokenInfo.scope +
      ' expiration date:' +
      this.expirationDate.toISOString()
    )
  }

  /*
   * -------------------------------------------------
   * Private/Protected members
   * -------------------------------------------------
   */

  /**
   * Analyze the result of a check request by Rudi Portal
   * @private
   * @param {string}  result - The result object of a check request (as a string)
   * @returns {array}        - An array [ <valid>, <error string, null if valid> ]
   */
  public requestMatchToken(result: string): Array<any> {
    var ok = true
    var error = ''
    /* 
    {
      "error": "invalid_token",
      "error_description": "Token has expired"
    }
    {
    "error": "invalid_token",
    "error_description": "Cannot convert access token to JSON"
    }
    */

    try {
      const res = JSON.parse(result)
      //console.log(res);

      const active = res['active']
      if (!active) {
        ok = false
        error = 'Error: token was disabled remotely'
      }

      const user_name = res['user_name']
      if (user_name != this.jwt.payload.user_name) {
        ok = false
        error = 'Error: invalid user name '
      }

      const client_id = res['client_id']
      if (client_id != this.jwt.payload.client_id) {
        ok = false
        error = 'Error: invalid client ID'
      }

      const jti = res['jti']
      if (jti != this.tokenInfo.jti) {
        ok = false
        error = 'Error: invalid jti ID'
      }
    } catch (error) {
      ok = false
      error = 'Error: analyzing token: ' + error
    }
    return [ok, error]
  }

  /**
   * Parse the token information delivered by the Rudi Portal
   *
   * @private
   * @param   {string}    token   - the raw token from the HTTP request
   * @param   {function}  resolve - promise resolution
   * @param   {function}  reject  - reject resolution
   * @returns {RMToken}            - A token descriptor
   */
  static parseToken(tokenStr: string, resolve, reject) {
    try {
      const tokenObj = JSON.parse(tokenStr)
      const rmt = new RMToken(tokenObj)
      if (!rmt.isValid) reject('Error: ' + rmt.error)
      resolve(rmt)
    } catch (error) {
      reject('Error: malformed token: ' + error + ': ' + tokenStr)
    }
  }
}

/* -------------------------------------------------------------------- */
