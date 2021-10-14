/**
 * Rennes Métropole Token exchange interface
 *
 * @author: Laurent Morin, Olivier Martineau
 * @version: 1.0.0
 */
'use strict'

const mod = 'tokenMgmt'

// ------------------------------------------------------------------------------------------------
// External dependancies
// ------------------------------------------------------------------------------------------------
import https from 'https'

// ------------------------------------------------------------------------------------------------
// Internal dependancies
// ------------------------------------------------------------------------------------------------
import log from '../../utils/logging'
import utils from '../../utils/jsUtils'

// ------------------------------------------------------------------------------------------------
// Internal objects
// ------------------------------------------------------------------------------------------------
import { RMToken } from './RMToken'
import { UUIDv4 } from './UUIDv4'
import { httpGet, httpPost } from '../../utils/httpReq'

/*
 * -----------------------------------------------------------------------------
 * Token manager
 * -----------------------------------------------------------------------------
 */

/** http/s option structure */
interface Portal {
  /** Host IP address             */ host: string
  /** Host port                   */ port: BigInt
  /** Path to request a new token */ path_request: string
  /** Path to check a new token   */ path_check: string
  /** User login                  */ login: string
  /** User password               */ passw: string
}

/**
 * A basic interface for Rennes Métropole Token Management.
 */
export class RMTokenManager {
  protected portal: Portal
  protected agent: string
  protected tokenList: Map<UUIDv4, RMToken>
  protected timers: NodeJS.Timeout[]

  /**
   * A basic interface for Rennes Métropole Token Management.
   *
   * The configuration used:
   * @class 
   * @param {Portal}  portal - The http/s option structure with :
       host:   The host IP address,
       port:   The host port,
       login:  the user login,
       passw : the user password'
   * @param {string}  agent  - A string describing the resquested agent.
   */
  RMTokenManager(portal: Portal, agent: string) {
    this.portal = portal
    this.agent = agent
    this.tokenList = new Map<UUIDv4, RMToken>()
    this.timers = []
  }

  /**
   * Close the token manager, clean remaining tokens.
   */
  // public close() {
  //   for (const timer in this.timers) {
  //     clearTimeout(timer)
  //   }
  //   this.tokenList = {}
  // }

  /**
   * Performs an HTPP request asking the Portal to generate a new token.
   */
  async getToken(userId: UUIDv4): Promise<RMToken> {
    const fun = 'getToken'
    const localToken = await this.getLocalToken(userId)
    log.d(mod, fun, 'Requesting a new token')
    const newToken = await this.requestNewPortalToken(userId, localToken.jwt.payload.scope) // TODO: simplify acces to scope!
    this.tokenList.set(userId, newToken)
    return newToken
  }

  /**
   * Retrieve a local token
   */
  protected async getLocalToken(userId: UUIDv4): Promise<RMToken> {
    const fun = 'getLocalToken'
    const localToken = this.tokenList.get(userId)
    if (!!localToken) {
      log.d(mod, fun, `The user already has a token: ${localToken}`)
      if (localToken.isValid) {
        log.d(mod, fun, `Local token hasn't expired yet`)
        const isTokenOK = await this.checkTokenByPortal(localToken)
        if (isTokenOK) {
          log.d(mod, fun, `Local token validated by the Portal`)
          return localToken
        } else {
          const errMsg = 'Token invalidated by the Portal'
          log.d(mod, fun, errMsg)
          localToken.error = errMsg
          // TODO: remove token from local list?
        }
      } else {
        log.d(mod, fun, `Local token is not valid: ${localToken.error}`)
        // TODO: remove token from local list?
      }
    } else {
      log.d(mod, fun, `The user has no local token yet`)
    }
    return null
  }

  /**
   * Performs an HTPP request asking the Portal to generate a new token.
   */
  async requestNewPortalToken(userId: UUIDv4, scope: string[]): Promise<RMToken> {
    const fun = 'requestNewPortalToken'
    try {
      const portalUrl = `${this.portal.host}/${this.portal.path_request}`

      const body =
        `grant_type=password` +
        `&scope=${scope.join('+')}` +
        `&client_id=${userId}` +
        `&username=${this.portal.login}` +
        `&password=${this.portal.passw}`

      const basicAuth = utils.toBase64(`${this.portal.login}:${this.portal.passw}`)
      const options = {
        headers: {
          Authorization: `Basic ${basicAuth}`,
          'User-Agent': this.agent,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
      const portalResponse = await httpPost(portalUrl, body, options)

      if (portalResponse.status === 200) {
        const newToken = new RMToken(portalResponse.data)
        return newToken
      } else {
        const errMsg = `Portal couldn't deliver a token`
        log.w(mod, fun, errMsg)
        throw new Error(errMsg)
      }
    } catch (err) {
      const errMsg = `Portal couldn't deliver a token: ${err}`
      log.w(mod, fun, errMsg)
      throw new Error(errMsg)
    }
  }

  /**
   * Performs an HTPP request checking a token.
   * @param   {RMToken}  rmToken  - A RM token descriptor
   * @returns {promise}          - A promise returning the token and the return code
   */
  public async checkTokenByPortal(rmToken: RMToken): Promise<any> {
    const fun = 'checkTokenByPortal'
    log.d(mod, fun, ``)
    try {
      const requestUrl = `${this.portal.host}/${this.portal.path_check}?token=${rmToken.jwtString}`
      // log.d(mod, fun, requestUrl)
      const portalResponse = await httpGet(requestUrl)

      if (portalResponse.status === 200) {
        log.v(mod, fun, `RUDI Portal validated the token`)
        return portalResponse.data
      } else {
        const errMsg = `Portal invalidated the token: ${portalResponse.data}`
        log.w(mod, fun, errMsg)
        throw new Error(errMsg)
      }
    } catch (err) {
      log.w(mod, fun, err)
      throw err
    }
  }

  /*
   * -------------------------------------------------
   * Private members
   * -------------------------------------------------
   */

  /**
   * Add a new raw token from a request
   *
   * The manager keeps in cache generated tokens.
   * A timer is set to clean-up when the token has expired.
   *
   * @private
   * @param   {string}    user_id  - the user attached to the request
   * @param   {string}    data     - the raw token data
   * @param   {function}  resolve  - promise resolution
   * @param   {function}  reject   - reject resolution
   * @returns {object}             - A token descriptor
   */
  public addToken(user_id: string, data: string, resolve, reject) {
    data = this.sanitize(data)
    RMToken.parseToken(
      data,
      function (rmt) {
        this.context.tokenList[user_id] = rmt
        if (this.context.expire > 0) rmt.setExpiration(this.context.expire)
        const remain = rmt.timeRemaining()
        const timer = setTimeout(
          function () {
            // NOT THREAD SAFE
            if (user_id in this.context.tokenList) {
              delete this.context.tokenList[user_id]
            }
          }.bind({ context: this.context }),
          remain * 1000
        )
        this.context.timers.push(timer)
        resolve(rmt)
      }.bind({ context: this }),
      reject
    )
  }

  /**
   * Clean a string used in HTTP transactions.
   * @private
   * @param   {string}    input  - raw string
   * @param   {string}    mode   - encoding (base64, uuid or undefined)
   * @returns {string}           - cleaner string
   */
  public sanitize(input: string, mode?: string): string {
    const nocode = /[\000-\041\177]/g
    const base64 = /[^\w+/=_.-]/g
    const hexa = /[^a-f0-9-]/gi
    if (mode === undefined) {
      input = input.replace(nocode, '').slice(0, 512)
    } else if (mode === 'base64') {
      input = input.replace(base64, '').slice(0, 1024)
    } else if (mode === 'uuid') {
      input = input.replace(hexa, '').slice(0, 32 + 4)
    } else throw new Error('unsupported mode in sanitize: ' + mode)
    return input
  }

  /**
   * Generates the request options for an HTPP request checking a token.
   * @private
   * @param {string}    token - the token to be checked
   */
  public checkTokenOptions(rmToken: RMToken) {
    const token = rmToken.jwtString
    return {
      hostname: this.portal.host,
      port: this.portal.port,

      path: `/oauth/check_token?token=${token}`,
      method: 'GET',
      headers: {
        'User-Agent': this.agent,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    }
  }

  /* class RMTokenManager ---------------------------------------------^^^--- */
}

/* ----------------------------------[ EOF ]--------------------------------- */
