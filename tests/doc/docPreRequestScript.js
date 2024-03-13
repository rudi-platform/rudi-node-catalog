const DEBUG_LVL = 2
const TRACE = DEBUG_LVL > 3
const DEBUG = DEBUG_LVL > 2
const ERROR = DEBUG_LVL > 1

const WAIT_TIME = 50
const TOKEN_DURATION_S = 4147200

const NO_PORTAL_MSG = 'No portal connected'
pm.collectionVariables.set('noPortalMsg', NO_PORTAL_MSG)
let skipPortalConnection

log = {
  e: (fun, msg = '', arg = '') => {
    if (ERROR) console.error(`E (${fun}) ERROR: ${msg} ${arg}`)
  },
  d: (fun, msg = '', arg = '') => {
    if (DEBUG) console.log(`D (${fun}) ${msg} ${arg}`)
  },
  t: (fun, msg = '<', arg = '') => {
    if (TRACE) console.log(`T (${fun}) ${msg} ${arg}`)
  },
}

const initStoredVar = (name, defaultVal) => {
  const fun = 'initStoredVar'
  const storedVal = pm.variables.get(name)
  if (!storedVal) {
    log.t(fun, 'No value stored for', name)
    pm.variables.set(name, defaultVal)
  }
  // log.t('[initStoredVar] val for ' + name + ' is: ' + storedVal || defaultVal)
  return storedVal || defaultVal
}

const API_TOKEN_NAME = initStoredVar('apiTokenName', 'apiJwt')
const PORTAL_TOKEN_NAME = initStoredVar('portalTokenName', 'portalJwt')

const ADMIN_URL = pm.variables.get('apiUrl') + '/api/admin'

log.t('const', 'API_TOKEN_NAME:', API_TOKEN_NAME)
log.t('const', 'PORTAL_TOKEN_NAME:', PORTAL_TOKEN_NAME)
log.t('const', 'ADMIN_URL:', ADMIN_URL)

const REGEX_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const REGEX_JWT = /^[\w-]+\.[\w-]+\.([\w-]+={0,3})$/
const REGEX_API_VERSION = /^[0-9]+\.[0-9]+(\.[0-9]+)?[a-z]*$/
const REGEX_URI =
  /^(https?|ftp):\/\/([\w-]+(\.[\w-]+)+|(:[0-9]+)?)([\w.,@?^=%&amp;:\/~+#-]*[\w@?^=%&amp;\/~+#-])?$/
const REGEX_GIT_HASH_SHORT = /^[a-z0-9]{7}/

const regexCheck = (regex, str) => (str ? regex.exec(`${str}`) : regex)
match = {
  uuid: (str) => regexCheck(REGEX_UUID, str),
  jwt: (str) => regexCheck(REGEX_JWT, str),
  version: (str) => regexCheck(REGEX_API_VERSION, str),
  uri: (str) => regexCheck(REGEX_URI, str),
  gitHash: (str) => regexCheck(REGEX_GIT_HASH_SHORT, str),
}

error = {
  throwNotFound: (msg) => {
    throw { statusCode: 404, name: 'NotFound', message: msg }
  },
}

time = {
  now: () => new Date().toISOString(),
  nowEpochMS: () => new Date().getTime(),
  nowEpochS: () => _.floor(new Date().getTime() / 1000),
  timezone: () => new Date().getTimezoneOffset(),
  wait: (delayMs, doSomething) => {
    log.t('wait', `Waiting ${delayMs / 1000}s...`)
    setTimeout(
      doSomething
        ? doSomething
        : () => {
            log.t('wait', `Waited ${delayMs / 1000}s`)
          },
      delayMs
    )
  },
}
codec = {
  streamToString: (data) => data?.stream?.toString('utf8'),

  fromBase64: (data) => Buffer.from(data, 'base64')?.toString('utf-8'),

  fromBase64Url: (base64UrlStr) => {
    const fun = 'fromBase64Url'
    log.t(fun)
    if (!base64UrlStr) return ''
    //        log.d('base64UrlStr: ' + base64UrlStr)
    //        log.d('base64UrlStr.length: ' + base64UrlStr.length)
    const paddedStr =
      base64UrlStr.length % 4 == 0
        ? base64UrlStr
        : base64UrlStr + '===='.substring(base64UrlStr.length % 4)
    // log.d('paddedStr: ' + paddedStr)
    const base64Str = paddedStr.replace('_', '/').replace('-', '+')
    // log.d('base64Str: ' + base64Str)
    return codec.fromBase64(base64Str)
  },
}

rand = {
  get: (randName) => pm.collectionVariables.replaceIn(randName),

  uuid: () => rand.get('{{$randomUUID}}'),

  pickInList: (list) => list[_.random(0, list.length - 1)],

  pick: (listName) => rand.pickInList(pm.collectionVariables.get(listName)),

  initVal: (field) => {
    const val = pm.collectionVariables.get(field)
    if (val) return val
    const randVal = rand.uuid()
    pm.collectionVariables.set(field, randVal, 'string')
    return randVal
  },

  getContactEmail: (contactName) =>
    `${contactName
      .replace(/(Miss|(Ms|Mrs|Mr|Dr)\.)\s|'Jr\.'/gi, '')
      .toLowerCase()
      .replace(/\s+|\.\./g, '.')
      .replace(/^\.+|\.+$|\'+/g, '')}@irisa.fr`,

  randomize: (field) => {
    const randVal = rand.uuid()
    pm.collectionVariables.set(field, randVal)
    return randVal
  },
}

secu = {
  isTokenValid: (tokenName) => {
    const fun = 'isTokenValid'
    log.t(fun, tokenName)
    const token = pm.collectionVariables.get(tokenName)
    // console.log('typeof token: ' + typeof token)
    if (!token || typeof token !== 'string') {
      log.d(fun, 'Token ' + tokenName + ' is invalid: ', JSON.stringify(token))
      return false
    }
    // log.d('splitting token: ' + token)
    const jwtBodyEncoded = token.split('.')[1]
    // log.d('split token: ' + jwtBodyEncoded)

    const jwtBody = JSON.parse(codec.fromBase64Url(jwtBodyEncoded))
    // log.d('decoded body: ' + jwtBody)
    if (!jwtBody.exp) {
      log.d(fun, 'No expiration time was found')
      return false
    }
    // log.d('is token valid?')
    const isValid = jwtBody.exp > time.nowEpochS()
    log.d(fun, tokenName + ' is ' + (isValid ? '' : 'not ') + 'valid')
    return isValid
  },

  renewApiToken: (tokenName, next) => {
    const fun = 'renewApiToken'
    log.t(fun)
    const reqUrl = pm.variables.get('cryptoJwtUrl') + '/forge'
    // log.d('reqUrl: ' + reqUrl)
    const reqNewToken = {
      url: reqUrl,
      method: 'POST',
      header: { 'Content-Type': 'application/json' },
      body: {
        mode: 'raw',
        raw: JSON.stringify({
          exp: time.nowEpochS() + TOKEN_DURATION_S,
          jti: rand.get('{{$randomUUID}}'),
          sub: pm.variables.get('pmClientName') || 'rudi_api_pm',
          client_id: pm.variables.get('pm_client_id') || 'pm',
          req_mtd: 'all',
          req_url: 'all',
        }),
      },
    }
    return new Promise((resolve, reject) => {
      pm.sendRequest(reqNewToken, (err, res) => {
        if (err || res.code > 399 || res.statusCode > 399) {
          log.e(fun, `'Crypto' module unreachable on ${reqUrl}`)
          return reject(`Crypto module unreachable on ${reqUrl}`)
          // error.throwNotFound(`Crypto module unreachable on ${reqUrl}`)
        }
        const token = codec.streamToString(res)
        log.d('rudiProdToken : ' + token)
        try {
          pm.expect(res).to.have.property('code', 200)
          pm.expect(token).to.match(/^\w+\.\w+\.[\w\-=]+$/)
        } catch (err) {
          console.error('[renewApiToken]: ' + err)
          return reject('[renewApiToken]: ' + err)
          // throw new Error('[renewApiToken]: ' + err)
        }
        pm.collectionVariables.set(tokenName, token)
        log.d(fun, 'API token stored')

        if (next) return resolve(next(token))
        return resolve(token)
      })
    })
  },

  renewPortalToken: (tokenName, rudiProdToken) => {
    const fun = 'renewPortalToken'
    log.t(fun)
    if (pm.collectionVariables.get('skipPortalConnection'))
      return new Promise((resolve, reject) => resolve(NO_PORTAL_MSG))
    const reqUrl = ADMIN_URL + '/portal/token'
    // log.d('reqUrl: ' + reqUrl)
    const reqNewToken = {
      url: reqUrl,
      method: 'GET',
      header: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + rudiProdToken,
      },
    }
    return new Promise((resolve, reject) => {
      pm.sendRequest(reqNewToken, (err, res) => {
        if (err) {
          log.e(fun, 'RUDI API unreachable on', reqUrl)
          // error.throwNotFound(`RUDI API unreachable on ${reqUrl}`)
          return reject(`RUDI API unreachable on ${reqUrl}`)
        }
        try {
          pm.expect(res).to.have.property('code', 200)
        } catch (error) {
          log.e(fun, codec.streamToString(res), error)
          //log.d('[renewPortalToken] Response to Postman req: ' + codec.streamToString(res))
          return reject('[renewPortalToken]: ' + codec.streamToString(res))
          // throw new Error('[renewPortalToken]: ' + codec.streamToString(res))
        }
        //log.d('renewPortalToken res: ' + JSON.stringify(res))
        resStr = codec.streamToString(res)
        log.d(fun, 'response:', resStr)
        if (resStr == NO_PORTAL_MSG) {
          log.d(fun, 'No portal connection')

          pm.collectionVariables.set('skipPortalConnection', true)
          return resolve(NO_PORTAL_MSG)
        }
        const token = JSON.parse(codec.streamToString(res))?.access_token
        log.d(fun, 'Portal token:', token)
        try {
          pm.expect(token).to.match(/^\w+\.\w+\.[\w\-=]+$/)
        } catch (error) {
          log.e(fun, codec.streamToString(res), error)
          //log.d('[renewPortalToken] Response to Postman req: ' + codec.streamToString(res))
          return reject('[renewPortalToken]: ' + codec.streamToString(res))
          // throw new Error('[renewPortalToken]: ' + codec.streamToString(res))
        }

        pm.collectionVariables.set(tokenName, token)
        log.d(fun, 'Portal token stored')
        return resolve(token)
      })
    })
  },

  getRudiProdToken: async (next) => {
    log.t('-- getRudiProdToken --')
    const tokenName = API_TOKEN_NAME
    if (!secu.isTokenValid(tokenName)) await secu.renewApiToken(tokenName, next)
    else if (next) next(pm.collectionVariables.get(tokenName))
    log.t('API token stored')
    return pm.collectionVariables.get(tokenName)
  },

  getPortalToken: async (apiToken) => {
    log.t('-- getPortalToken --')
    if (pm.collectionVariables.get('skipPortalConnection')) return NO_PORTAL_MSG
    const tokenName = PORTAL_TOKEN_NAME
    if (!secu.isTokenValid(tokenName)) await secu.renewPortalToken(tokenName, apiToken)
    log.t('Portal token stored')
    if (pm.collectionVariables.get('skipPortalConnection')) return NO_PORTAL_MSG
    return pm.collectionVariables.get(tokenName)
  },
}

const fun = 'init'
const init = async () => {
  let rudiProdToken
  try {
    rudiProdToken = await secu.getRudiProdToken()
    log.t(fun, 'rudiProd token Received')
  } catch (e) {
    log.e(fun, 'Failed to get rudiProd token', `${e}`)
  }
  skipPortalConnection = pm.collectionVariables.get('skipPortalConnection')
  log.t(fun, 'skipPortalConnection:', skipPortalConnection)
  if (rudiProdToken && !skipPortalConnection) {
    try {
      portalToken = await secu.getPortalToken(rudiProdToken)
      if (portalToken == NO_PORTAL_MSG) log.d(fun, NO_PORTAL_MSG)
      else log.d(fun, 'Portal token received')
    } catch (e) {
      log.e(fun, 'Failed to get portal token', `${e}`)
    }
  }
}

init()
time.wait(WAIT_TIME, () => log.t(fun, 'Pre-request Scripts loaded'))
