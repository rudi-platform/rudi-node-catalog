# Postman tests: the documentation

## Prerequisites

To run the tests, you'll most likely need the `rudi-crypto` module to be running in the same environment as where the tests are run (possibly on your machine).
You'll also need a private key to be present on every environment you wish to test, and the API module to be configured to accept this key as a new profile. This is explicited in the "Setting up Postman / Newman tests for other environments" part.

## Tests description

The tests of each collection are usually meant to be executed sequentially.
For instance, organization and contact-related tests have to be executed before resources/metadata tests are run.

| Test collection name                         | Description                                                                                                                                                                                    |
| -------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `rudi-soft-checks.postman_collection.json`   | These non-intrusive tests can be executed on every environment, including production environment. Every object created by the test is tagged with a stamp and removed at the end of the tests. |
| `rudi-sanity-checks.postman_collection.json` | This test collection is meant to be used with `test` environment only. It executes some deep checks that are not suitable for running environments.                                            |

## Environment variable collections for tests

Here are the environment variable collections used for each dev environment.

| Collection name                            | Associated environment name | Environment URL                   |
| ------------------------------------------ | :-------------------------: | --------------------------------- |
| `env-rudi-public.postman_environment.json` |           Release           | https://data-rudi.aqmo.org        |
| `env-rudi-shared.postman_environment.json` |           Shared            | https://shared-rudi.aqmo.org      |
| `env-rudi-test.postman_environment.json`   |            Test             | https://shared-rudi.aqmo.org/test |

To test other environment such as production one, you need to alter one of these variable environments (prefereably the `release` one).
The detail of the variables to alter is given bellow.

## Variables: details

| Variable name    | Description                                                                                                                         | Example value                                |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------- |
| `cryptoJwtUrl`   | The URL of the 'crypto' module that delivers the JWT to access the internal API (`/api/admin/`).                                    | http://127.0.0.1:4444/crypto/jwt             |
| `pm_client_name` | The identifer that is used in the JWT. The name should be appear in the custom `profiles.ini` configuration file of the API module. | rudi_api_pm                                  |
| `apiUrl`         | The URL of the API module for this environment.                                                                                     | https://shared-rudi.aqmo.org                 |
| `pmBackUrl`      | The URL of the promanager back-end. This is not used in these tests, so you can just discard this variable.                         | https://admin-rudi.aqmo.org/prodmanager-test |
| `portalBaseUrl`  | The URL of the portal associated with this environment. This is not used in these tests and can be discarded too.                   | http://rudi.qualif.open-groupe.com           |
| `env`            | The type of server. It is normally acessible through `/api/admin/env`, and should equal 'release' for production environments.      | release \| shared \| test                    |
| `db`             | URL suffix to be used in `test` environment only. No need for change.                                                               | "db" (test env) \| "nodb" (env ≠ test)       |

### Setting up Postman / Newman tests for other environments

Those are the variables you usually need to set to create tests for a new environment:

- `apiUrl` : the base URL for the API module.
- `cryptoJwtUrl`: most likely stays set to `http://127.0.0.1:4040/crypto/jwt` if you run a local JWT `crypto` module.
- `pm_client_name`: set it to the username associated to your public key in the custom `profiles.ini` on the API side.

Example conf in the custom `profiles.ini` on the API side:

```ini
[my_user_name]
pub_key=./0-ssh/my_user_name.pub
routes[]="all"

```

Conf in the custom `profiles.ini` on the crypto module side:

```ini
[my_user]
pub_key=./0-ssh/my_user_name.pub
prv_key=./0-ssh/my_user_name.prv

```

### Code of pre-request scripts

When you run a test collection, a "pre-request script" is run before sending the request (see code bellow).
It is used as a library for post-request scripts, and it also initalizes variables such as the tokens needed to call the API.

````js
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

    getContactEmail: (contactName) => `${
      contactName
        .replace(/(Miss|(Ms|Mrs|Mr|Dr)\.)\s|'Jr\.'/gi, '')
        .toLowerCase()
        .replace(/\s+|\.\./g, '.')
        .replace(/^\.+|\.+$|\'+/g, '')
        }@irisa.fr`,

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
                    'sub': pm.variables.get('pm_client_name') || 'rudi_api_pm',
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

secu.getRudiProdToken(secu.getPortalToken)
```

````
