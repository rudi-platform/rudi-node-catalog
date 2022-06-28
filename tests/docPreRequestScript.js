const TRACE = false
const DEBUG = false

const TOKEN_DURATION_S = 1200

const initStoredVar = (name, defaultVal) => {
    const storedVal = pm.variables.get(name)
    if (!storedVal) pm.variables.set(name, defaultVal)
    return storedVal || defaultVal
}

const API_TOKEN_NAME = initStoredVar('apiTokenName', 'apiJwt')
const PORTAL_TOKEN_NAME = initStoredVar('portalTokenName', 'portalJwt')

const ADMIN_URL = pm.variables.get('apiUrl') + '/api/admin'

log = {
    d: (msg) => { if (DEBUG || TRACE) console.log(msg) },
    t: (msg) => { if (TRACE) console.log(msg) }
}

log.t('API_TOKEN_NAME: ' + API_TOKEN_NAME)
log.t('PORTAL_TOKEN_NAME: ' + PORTAL_TOKEN_NAME)
log.t('ADMIN_URL: ' + ADMIN_URL)

time = {
    now: () => new Date().toISOString(),
    nowEpochS: () => _.floor(new Date().getTime() / 1000),
    timezone: () => new Date().getTimezoneOffset(),
}
codec = {
    streamToString: (data) => data?.stream?.toString('utf8'),

    fromBase64: (data) => Buffer.from(data, 'base64')?.toString('utf-8'),

    fromBase64Url: (base64UrlStr) => {
        log.t('-- base64UrlStr --')
        if (!base64UrlStr) return ''
        //        log.d('base64UrlStr: ' + base64UrlStr)
        //        log.d('base64UrlStr.length: ' + base64UrlStr.length)
        const paddedStr = (base64UrlStr.length % 4 == 0)
            ? base64UrlStr
            : base64UrlStr + "====".substring(base64UrlStr.length % 4);
        // log.d('paddedStr: ' + paddedStr)
        const base64Str = paddedStr
            .replace("_", "/")
            .replace("-", "+");
        // log.d('base64Str: ' + base64Str)
        return codec.fromBase64(base64Str);
    },

    streamToUtf8: (data) => data?.stream?.toString('utf8')

};

rand = {
    get: (randName) => pm.collectionVariables.replaceIn(randName),

    uuid: () => rand.get('{{$randomUUID}}'),

    pickInList: (list) => list[_.random(0, list.length - 1)],

    pick: (listName) => rand.pickInList(pm.collectionVariables.get(listName)),

    initVal: (field) => {
        const val = pm.collectionVariables.get(field);
        if (val) return val;
        const randVal = rand.get('{{$randomUUID}}');
        pm.collectionVariables.set(field, randVal);
        return randVal;
    },

    getContactEmail: (contactName) => `${contactName
        .replace(/(Miss|(Ms|Mrs|Mr|Dr)\.)\s+|'Jr\.'/gi, '')
        .toLowerCase()
        .replace(/\s+|\.\./g, '.')
        .replace(/^\.+|\.+$|\'+/g, '')
        }@irisa.fr`,
    //'
    randomize: (field) => {
        const randVal = rand.uuid();
        pm.collectionVariables.set(field, randVal);
        return randVal;
    },

};

secu = {

    isTokenValid: (tokenName) => {
        log.t('-- is ' + tokenName + ' Valid --')
        const token = pm.collectionVariables.get(tokenName)
        // console.log('typeof token: ' + typeof token)
        if (!token || typeof token !== 'string') {
            log.d('Token ' + tokenName + ' is invalid: ' + JSON.stringify(token))
            return false
        }
        // log.d('splitting token: ' + token)
        const jwtBodyEncoded = token.split('.')[1]
        // log.d('split token: ' + jwtBodyEncoded)

        const jwtBody = JSON.parse(codec.fromBase64Url(jwtBodyEncoded))
        // log.d('decoded body: ' + jwtBody)
        if (!jwtBody.exp) {
            log.d('No expiration time was found')
            return false
        }
        // log.d('is token valid?')
        const isValid = jwtBody.exp > time.nowEpochS()
        // log.d(tokenName + ' is ' + (isValid ? '' : 'not ') + 'valid')
        return isValid
    },

    renewApiToken: async (tokenName, next) => {
        log.t('-- renewApiToken --')
        const reqUrl = pm.variables.get('cryptoJwtUrl') + '/forge'
        // log.d('reqUrl: ' + reqUrl)
        const reqNewToken = {
            url: reqUrl,
            method: 'POST',
            header: { "Content-Type": "application/json" },
            body: {
                mode: 'raw',
                raw: JSON.stringify({
                    'exp': time.nowEpochS() + TOKEN_DURATION_S,
                    'jti': rand.get('{{$randomUUID}}'),
                    'sub': pm.variables.get('pmClientName') || 'rudi_api_pm',
                    'client_id': pm.variables.get('pm_client_id') || 'pm',
                    'req_mtd': 'all',
                    'req_url': 'all'
                })
            }
        }
        pm.sendRequest(reqNewToken, (err, res) => {
            if (err) {
                console.error('[renewApiToken] Crypto module most likely not running: ' + JSON.stringify(err))
                throw ('Crypto module most likely not running')
            }
            const token = codec.streamToUtf8(res)
            // log.d('rudiProdToken : ' + token)
            try {
                pm.expect(res).to.have.property('code', 200);
            } catch (err) {
                console.error('[renewApiToken]: ' + err)
                throw new Error('[renewApiToken]: ' + err)
            }
            pm.expect(token).to.match(/^\w+\.\w+\.[\w\-=]+$/)
            pm.collectionVariables.set(tokenName, token)
            log.d('API token stored')

            if (next) next(token)
            //return token
        })
    },

    renewPortalToken: async (tokenName, rudiProdToken) => {
        log.t('-- renewPortalToken --')
        const reqUrl = ADMIN_URL + '/portal/token'
        // log.d('reqUrl: ' + reqUrl)
        const reqNewToken = {
            url: reqUrl,
            method: 'GET',
            header: {
                'Content-Type': "application/json",
                'Authorization': 'Bearer ' + rudiProdToken
            },
        }
        pm.sendRequest(reqNewToken, (err, res) => {
            if (err) throw err
            try {
                pm.expect(res).to.have.property('code', 200);
            } catch (error) {
                console.error('[renewPortalToken]: ' + error)
                throw new Error('[renewPortalToken]: ' + error)
            }
            //log.d('renewPortalToken res: ' + JSON.stringify(res))
            const token = JSON.parse(codec.streamToUtf8(res)).access_token
            //const token = res.json()
            log.d('Portal token: ' + token)

            pm.expect(token).to.match(/^\w+\.\w+\.[\w\-=]+$/)
            pm.collectionVariables.set(tokenName, token)
            log.d('Portal token stored')

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
        const tokenName = PORTAL_TOKEN_NAME
        if (!secu.isTokenValid(tokenName)) await secu.renewPortalToken(tokenName, apiToken)
        log.t('Portal token stored')
        return pm.collectionVariables.get(tokenName)
    }

}

secu.getRudiProdToken()
