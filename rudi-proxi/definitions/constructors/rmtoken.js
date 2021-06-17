/* eslint-disable */

/**
 * Rennes Métropole Token exchange interface 
 *
 * @author: Laurent Morin
 * @version: 1.0.0
 */
const https = require('https');

/*
 * -------------------------------------------------
 * Token descriptor
 * -------------------------------------------------
 */

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
function RMToken(data) {
    this.valid = false;
    this.error = 'unexpected error';
    this.access_token = data['access_token'];
    this.token_type = data['token_type'];
    this.expires_in = data['expires_in'];
    this.scope = data['scope'];
    this.jti = data['jti'];

    if (`${this.token_type}`.toLowerCase().trim() != 'bearer') {
        this.error = 'Token: token type not supported '+this.token_type+' ("Bearer" supported)'; return;
    }
    if (!this.jti || !this.access_token) {
        this.error = 'Token: missing jti field or access token'; return;
    }

    // Analyze the JWT content
    const jwt = this.access_token.split('.');
    const header = JSON.parse(Buffer.from(jwt[0], 'base64').toString('utf8'));
    const payload = JSON.parse(Buffer.from(jwt[1], 'base64').toString('utf8'));
    const signature = Buffer.from(jwt[2], 'base64');

    //console.log(util.inspect(header));
    if (header.alg != 'HS256' || header.typ !='JWT') {
        this.error = 'JWT: format not supported'; return;
    }

    //console.log(util.inspect(payload));
    this.expire = new Date(payload['exp']*1000);
    this.user_name = payload['user_name'];
    this.authorities = payload['authorities'];
    this.client_id = payload['client_id'];
    this.scope = payload['scope'];
    if (this.jti != payload['jti']) {
        this.error = 'JWT: inconsistent JTI'; return;
    }

    this.valid = true;
    this.error = null;
}

/**
 * Force a new expiration value (before)
 * @param {integer} seconds - Seconds before expiration;
 */
RMToken.prototype.setExpiration = function(seconds) {
    const nexp = new Date((new Date()).getTime() + (seconds * 1000));
    if (nexp > this.expire) throw new Error('new expiration too high');
    this.expire = nexp;
}

/**
 * Check if the token is still valid
 *  Update and check if it has expired
 * @returns {boolean}        - An array [ <valid>, <error string, null if valid> ]
 */
RMToken.prototype.isValid = function() {
    if (this.valid && (this.expire < (new Date()))) {
        this.error = 'token expired ('+this.expire+')';
        this.valid = false;
    }
    return [ this.valid, this.error ];
}

/**
 * Check read access rights
 * @returns {boolean}  - read access granted
 */
RMToken.prototype.canRead = function() {
    return this.isValid() && this.scope.includes('read');
}

/**
 * Check write access rights
 * @returns {boolean}  - write access granted
 */
RMToken.prototype.canWrite = function() {
    return this.isValid() && this.scope.includes('write');
}

/**
 * Time before expiration
 * @returns {integer}  - time (seconds)
 */
RMToken.prototype.timeRemaining = function() {
    return (this.expire - (new Date())) / 1000;
}

/**
 * Token description in human readable format
 * @returns {string}  - description
 */
RMToken.prototype.toString = function() {
    return 'RM Token, type:'+ this.token_type +
        ' client:'+ this.client_id +
        ' scope:'+ this.scope +
        ' expire:'+ this.expire.toISOString();
}

/*
 * -------------------------------------------------
 * Private/Protected members
 * -------------------------------------------------
 */

/**
 * Return the access token
 * @private
 * @return {string}   - The string to used for a check request
 */
RMToken.prototype.tokenToCheck = function() {
    return this.access_token;
}

/**
 * Analyze the result of a check request,
 * @private
 * @param {object}  result - The result of a check request
 * @returns {array}        - An array [ <valid>, <error string, null if valid> ]
 */
RMToken.prototype.requestMatchToken = function(result) {
    var ok = true;
    var error = '';
    try {
        const res = JSON.parse(result);
        //console.log(res);

        const active = res['active'];
        if (!active) { ok = false; error = 'Error: token was disabled remotely'; }

        const user_name = res['user_name'];
        if (user_name != this.user_name) { ok = false; error = 'Error: invalid user name '; }

        const client_id = res['client_id'];
        if (client_id != this.client_id) { ok = false; error = 'Error: invalid client ID'; }

        const jti = res['jti'];
        if (jti != this.jti) { ok = false; error = 'Error: invalid jti ID'; }
    }
    catch (error) { ok = false; error = 'Error: analyzing token: '+error; }
    return [ ok, error ];
}

/**
 * Parse the provided token
 * 
 * @private
 * @param   {string}    token   - the raw token from the HTTP request
 * @param   {function}  resolve - promise resolution
 * @param   {function}  reject  - reject resolution
 * @returns {object}            - A token descriptor
 */
RMToken.parseToken = function(token, resolve, reject) {
    try {
        const data = JSON.parse(token);
        const rmt = new RMToken(data);
        const [ valid, error ] = rmt.isValid();
        if (!valid) reject('Error: '+error);
        resolve(rmt);
    }
    catch(error) { reject('Error: malformed token: '+error+': '+token); }
};

/*
 * -------------------------------------------------
 * Token manager
 * -------------------------------------------------
 */

/**
 * A basic interface for Rennes Métropole Token Management.
 *
 * The configuration used:
 * @class 
 * @param {object}  portal - The http/s option structure with :
     host:   The host IP address,
     port:   The host port,
     login:  the user login,
     passw : the user password'
 * @param {string}   agent  - A string describing the resquested agent.
 * @param {integer}  expire - A new expiration value, must be lower than the original.
 */
function RMTokenManager(portal, agent, expire) {
    this.portal = portal;
    this.agent = agent;
    this.expire = (expire === undefined) ? -1 : expire;
    this.tokenList = {};
    this.timers = [];
}

/**
 * Close the token manager, clean remaining tokens.
 */
RMTokenManager.prototype.close = function() {
    for (i in this.timers) {
        const timer = this.timers[i];
        clearTimeout(timer);
    }
    this.tokenList = {};
}

/**
 * Performs an HTPP request generating a token.
 * @param   {string}    user_id  - Any string representing a client. Only used locally for token binding.
 * @param   {string}    mode     - A 3 character string Unix file permission format (rwx).
 *                                 https://www.tutorialspoint.com/unix/unix-file-permission.htm
 * @returns {promise}            - A promise returning the token and the return code
 */
RMTokenManager.prototype.generateToken = function(user_id, permission) {
    var scope = [];
    if (permission[0] == 'r') scope.push('read');
    if (permission[1] == 'w') scope.push('write');
    user_id = this.sanitize(user_id);

    /* The user has already a valid token */
    if (user_id in this.tokenList) {
        const rmt = this.tokenList[user_id];
        console.log('Found: '+rmt);
        if (rmt.isValid()) {
            console.log('Valid !');
            return new Promise(function(resolve, reject) { resolve(rmt); });
        }
    }

    const body = this.getTokenBody(user_id, scope);
    const options = this.getTokenOptions(body);

    return new Promise(function(resolve, reject) {
        const req = https.request(this.options, function(res) {
            res.user_id = this.user_id;
            res.mdata = '';
            res.on('data', function(d)  { res.mdata += d; }.bind({res:res}));
            res.on('close', function(d) {
                res.mdata = Buffer.from(res.mdata,'utf8').toString();
                if (res.statusCode == 200) this.context.addToken(res.user_id, res.mdata, resolve, reject);
                else if (res.mdata)        reject('Error: unexpected request answer: '+res.statusCode+ ': '+res.mdata);
                else                       reject('Error: unexpected request answer: '+res.statusCode);
            }.bind({res:res,context:this.context}));
        }.bind({user_id:this.user_id,context:this.context}));
        req.write(this.body);
        req.on('error', reject);
        req.end()
    }.bind({body:body,user_id:user_id,options:options,context:this}));
}

/**
 * Performs an HTPP request checking a token.
 * @param   {object}  rmtoken  - A RM token descriptor
 * @returns {promise}          - A promise returning the token and the return code
 */
RMTokenManager.prototype.checkToken = function(rmtok) {
    return new Promise(function(resolve, reject) {
        const [ valid, error ] = this.rmtok.isValid();
        if (!valid) reject(error);
        const token = this.rmtok.tokenToCheck();
        const options = this.context.checkTokenOptions(token);

        const req = https.request(options, function(res) {
            res.mdata = '';
            res.on('data', function(d)  { res.mdata += d; }.bind({res:res}));
            res.on('close', function(d) {
                if (res.statusCode == 200) {
                    res.mdata = this.sanitize(res.mdata);
                    const [ ok, error ] = this.rmtok.requestMatchToken(res.mdata);
                    if (ok) resolve(this.rmtok);
                    else reject(error);
                }
                else reject('Error: unexpected request answer: '+res.statusCode);
            }.bind({res:res, rmtok:this.rmtok,sanitize:this.sanitize}));
        }.bind({rmtok:this.rmtok,sanitize:this.context.sanitize}));
        req.on('error', reject);
        req.end()
    }.bind({rmtok:rmtok, context:this}));
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
RMTokenManager.prototype.addToken = function(user_id, data, resolve, reject) {
    data = this.sanitize(data);
    RMToken.parseToken(data, function(rmt) {
        this.context.tokenList[user_id] = rmt;
        if (this.context.expire > 0) rmt.setExpiration(this.context.expire);
        const remain = rmt.timeRemaining();
        const timer = setTimeout(function() { // NOT THREAD SAFE
            if (user_id in this.context.tokenList) {
                delete this.context.tokenList[user_id];
            }
        }.bind({context:this.context}), remain * 1000);
        this.context.timers.push(timer);
        resolve(rmt);
    }.bind({context:this}), reject);
}

/**
 * Clean a string used in HTTP transactions.
 * @private
 * @param   {string}    input  - raw string
 * @returns {string}           - cleaner string
 */
RMTokenManager.prototype.sanitize = function(input, mode) {
    const nocode = /[\000-\041\177]/g;
    const base64 = /[^\w+/=_.-]/g;
    const hexa = /[^a-fA-F0-9-]/g;
    if      (mode === undefined) { input = input.replace(nocode,'').slice(0,512); }
    else if (mode === 'base64')  { input = input.replace(base64,'').slice(0,1024); }
    else if (mode === 'uuid')    { input = input.replace(hexa,'').slice(0,32+4); }
    else throw new Error('unsupported mode in sanitize: '+mode);
    return input;
}

/**
 * Generates the request options for an HTPP request checking a token.
 * @private
 * @param {string}    token - the token to be checked
 */
RMTokenManager.prototype.checkTokenOptions = function(token) {
    token = this.sanitize(token, 'base64');
    return {
        hostname: this.portal.host,
        port: this.portal.port,
        auth: this.portal.login + ':' + this.portal.passw,
        rejectUnauthorized: false,

        path: '/oauth/check_token?token=' + token,
        method: 'GET',
        headers: {
            'User-Agent': this.agent,
            'Content-Type': 'application/x-www-form-urlencoded',
        }
    };
}

/**
 * Generates the request options for an HTPP request generating a token.
 * @private
 * @param {string}    body - The request body 
 * @returns {object}       - The HTTP option object
 */
RMTokenManager.prototype.getTokenOptions = function(body) {
    return {
        hostname: this.portal.host,
        port: this.portal.port,
        auth: this.portal.login + ':' + this.portal.passw,
        rejectUnauthorized: false,

        path: '/oauth/token',
        method: 'POST',
        headers: {
            'User-Agent': this.agent,
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': Buffer.byteLength(body)
        },
    };
}

/**
 * Generates the body for an HTPP request generating a token.
 * @private
 * @param {string}    user_id - A user id, currently ignored
 * @param {string}    scope   - A permission set
 * @returns {string}          - The HTTP body value
 */
RMTokenManager.prototype.getTokenBody = function(user_id, scope) {
    var scopeStr = scope.length ? scope[0] : '';
    for (i=1; i < scope.length; i++) { scopeStr += '+' + scope[i]; }
    
    return 'grant_type=password'+
        '&username='+this.portal.login+
        '&password='+this.portal.passw+
        '&scope='+scopeStr+
        '&client_id='+this.portal.login;
}

/* -------------------------------------------------------------------- */
module.exports = RMTokenManager;

/*
 * --------------------------------------------------------------------
 *  Basic test
 * --------------------------------------------------------------------
 */

if (typeof require !== 'undefined' && require.main === module) {
    const util = require('util');
    const portal = {
        host:   '194.2.68.170',
        port:   443,
        login:  '31f2e946-dcc0-4a41-8e5f-02b74cd2560a',
        passw : 'iR1s4@123'
    };
    const agent = 'RudiMedia/1.0';
    const rmMng = new RMTokenManager(portal, agent, 30);

    const tokenCycle = function(user, rmMng, errfct, done)  {
        rmMng.generateToken(user, 'r--').then(function(rmtok) {
            rmMng.checkToken(rmtok).then(function(result) {
                done(rmtok);
            }, errfct);
        }, errfct);
    }

    const errfct = function(error)  {
        console.log('Error testing a token: : '+error);
    }
    tokenCycle('toto', rmMng, errfct, function(tok){
        console.log('Check ok, remaining: '+ tok.timeRemaining() + 's');
        console.log(tok);
    });

    setTimeout(function() {
        tokenCycle('toto', rmMng, errfct, function(tok){
            console.log('Check ok, remaining: '+ tok.timeRemaining() + 's');
            console.log(tok);
        });
    }, 20 * 1000);

    setTimeout(function() {
        tokenCycle('toto', rmMng, errfct, function(tok){
            console.log('Check ok, remaining: '+ tok.timeRemaining() + 's');
            console.log(tok);
            rmMng.close();
        });
    }, 40 * 1000);
}
