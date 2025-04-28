# RUDI producer proxy API module: access to Producer node resources metadata

_This module offers a RESTful interface to access the RUDI metadata publically exposed on the RUDI Producer node.
It also makes it possible to upload metadata from another module such as the Producer node manager (https://gitlab.aqmo.org/rudidev/rudi-console-proxy)_

##### Author: Olivier Martineau (community@rudi-univ-rennes1.fr)

---

## List of features

The API module provides :

- A definition of the RUDI metadata that is compatible with the definition (https://app.swaggerhub.com/apis/OlivierMartineau/RUDI-PRODUCER)
- An external API for fetching open-data metadata (public and accessible without any authentication)
- An internal API for creating, accessing, updating and deleting metadata (https://app.swaggerhub.com/apis/OlivierMartineau/RudiProducer-InternalAPI)

---

## Public API

_See https://app.swaggerhub.com/apis/OlivierMartineau/RUDI-PRODUCER/ for further information_

**Use example:**

> GET https://data-rudi.org/api/v1/resources?limit=10&fields=global_id,resource_title&updated_after=2021-07

---

## Redirected routes

- `GET /api` -> `GET /api/v1/resources`
- `GET /api/v1` -> `GET /api/v1/resources`
- `GET /resources` -> `GET /api/v1/resources`
- `GET /resources/*` -> `GET /api/v1/resources/*`

## No authentication required

- `GET /api/version`
- `GET /api/admin/hash`
- `GET /api/admin/apphash`
- `GET /api/admin/env`
- `GET /api/v1/resources`
- `GET /api/v1/resources/:id`

## Portal authentication required

- `PUT /resources/*`-> `PUT /api/v1/resources/*`
- `PUT /resources/:id/report`
- `PUT /api/v1/resources/:id/report`
- `GET /api/v1/resources/:id/report`
- `GET /api/v1/resources/:id/report/:irid`

## Rudi prod authentication required, action on objects

- `POST /api/admin/:object`
- `PUT /api/admin/:object`
- `GET /api/admin/:object`
- `GET /api/admin/:object/:id`
- `DELETE /api/admin/:object/:id`
- `DELETE /api/admin/:object`
- `POST /api/admin/:object/deletion`
- `GET /api/admin/:object/unlinked`
- `GET /api/admin/:object/search`
- `GET /api/admin/search`
- `POST /api/admin/:object/:id/reports`
- `PUT /api/admin/:object/:id/reports`
- `GET /api/admin/:object/:id/reports`
- `GET /api/admin/:object/:id/reports/:irid`
- `GET /api/admin/:object/reports`
- `DELETE /api/admin/:object/:id/reports/:irid`
- `DELETE /api/admin/:object/:id/reports`
- `POST /api/admin/:object/:id/reports/deletion`

## Rudi prod authentication + app driven actions

- `GET /api/admin/nv`
- `GET /api/admin/enum`
- `GET /api/admin/enum/:code`
- `GET /api/admin/enum/:code/:lang`
- `GET /api/admin/licences`
- `GET /api/admin/licence_codes`
- `POST /api/admin/licences/init`
- `POST /api/admin/resources/init`
- `GET /api/admin/id_generation`
- `GET /api/admin/portal/token`
- `GET /api/admin/portal/token/check`
- `GET /api/admin/portal/resources/:id`
- `POST /api/admin/portal/resources/:id`
- `DELETE /api/admin/portal/resources/:id`
- `POST /api/admin/portal/resources/send`
- `GET /api/admin/logs`
- `GET /api/admin/logs/:lines`
- `GET /api/admin/logs/search`
- `GET /api/admin/db`
- `DELETE /api/admin/db/:object`
- `DELETE /api/admin/db`
- `GET /api/admin/check/node/url`
- `GET /api/admin/check/portal/url`
- `GET /api/admin/check/portal/resources`
- `GET /api/admin/check/portal/ids`

---

## Configuration

Configuration files can be found in the **"0-ini" directory**.

- `0-ini/conf_default.ini`: default configuration and use examples
- `0-ini/conf_custom.ini`: user configuration, to be created (if defined, the value of the path variable `RUDI_API_USER_CONF` is taken as the full path of the custom INI file)

**`Security` section**
When the flag `should_control_private_requests` is true, JWT from incoming requests are controlled.

The parameter `profiles` indicates the path where is located the security file.

This security file defines the "profiles" for each client that can connect on the internal side of the API.
They are defined each by a section whose **name** reflects the `sub` payload field in the JWT.

In this section,

- `pub_key` indicates the path where is stored the public key associated with the subject
- `routes[]` indicates the name of a route that is allowed for the user (see "0-ini/profiles.ini" file for a list of route names)

---

## Security

### Required header fields for RUDI JWT

- `alg`: the JWT algorithm (preferably "EdDSA"). It must correspond to the algorithm used to create the private key used to generate this token signature (preferably ed25519).

### Required payload fields for RUDI JWT

- `exp`: desired expiration date in Epoch seconds
- `sub`: a recognized "profile" configuration.
- `req_mtd`: the http method used in the request
- `req_url`: the URL of the request

### Optional payload fields for RUDI JWT

- `jti` (jwt identifier): a UUIDv4 identifying this JSON web token
- `iat` (issued at): date of the generation of the token in Epoch seconds
- `client_id`: an identifier for the logged user requesting the resource

### Example CURL requests:

- `$USR`: login that has been transmitted to communicate with the token server
- `$PWD`: password that has been transmitted to communicate with the token server
- `$DATE`: Epoch date in seconds, e.g. now+1200 to get a token that is valid for 20mn
- `$SUB`: The value set for the robot/harvester in the file `rudi_proxy.ini` for `token_server_subject` and associated to a private key (e.g. `rudi_token`)
- `$MTD`: HTTP method for the request to the API (`GET` | `POST` | `PUT` | `DELETE`)
- `$URL`: URL of the request to the API (e.g.: `/api/admin/resources``)
- `$CID`: client ID, the way you wish identify the sender of the request (e.g. 'PostmanRobot')
- `$NODE`: URL of the producer node (e.g.: `https://rm.fenix.rudi-univ-rennes1.fr`)

```sh
# Create a token
JWT=`curl -X POST --user $USR:$PWD -H 'Content-Type: application/json' -d "{\"exp\":$DATE,\"sub\":\"$SUB\",\"req_mtd\":\"$MTD\",\"req_url\":\"$URL\",\"client_id\":\"$CID\"}" $NODE/crypto/jwt/forge`

# Check a token
curl -X POST --user $USR:$PWD -H 'Content-Type: application/json' -d "\"$JWT\"" $NODE/crypto/jwt/check

# Send the request to the API
curl -X $MTD -H "Authorization: Bearer $JWT" ${NODE}${URL}
```

---

## Commit process

Two commit processes types are ongoing parallely:

1. MediaFile
   Each MediaFile get uploaded to the Media module: the upload status determines if the MediaFile status is set to commited.
   More technically speaking, in case of success

   - `available_formats[i].file_storage_status` is set to `available`
   - `available_formats[i].file_status_update` is updated

2. Metadata
   If all the media were set as available, the metadata is sent to the portal and its status set to `pending`.
   If at least one upload fails to be committed, the metadata is set as `unavailable` and the user has to re-upload
   the file for the status to be updated anew.

## Verification process

Each MediaFile will be periodically checked.

If the file is found, the field `available_formats[i].media_dates.verified` is updated.
If `available_formats[i].storage_status` was set to `nonexistant` or `missing`, it is set to `available` and `available_formats[i].status_update` date is updated.

If the file is not found and `available_formats[i].storage_status === 'available'`, then `available_formats[i].storage_status` is set to `missing` and `available_formats[i].status_update` date is updated.

---

## Test files

In `tests/env-rudi-*.postman_environment.json` the value for the key `cryptoJwtUrl` should be replaced with the valid address of the client/crypto module. See [Tests documentation.md](tests/Tests_documentation.md) for further details

---

## Installation

The

---

## Getting started locally

To get started locally with the catalog, follow these instructions. You'll need `node` and `npm` installed.

### Create a MongoDB Database

The rudi-node catalog interfaces with a MongoDB Database to store __metadatas__. To use the catalog locally - for dev per example; you need to install MongoDB.

> https://www.mongodb.com/docs/manual/installation/

Once MongoDB is installed and started, you'll need its url. It should looks like `mongodb://127.0.0.1:27017`- you can find it by running `mongosh` in a terminal.

See next step to paste the url in config file.

### Set up config files :

Copy-paste, rename and modify if you wish the two following files :

conf_default.ini > conf_custom.ini

portal_conf_default.ini > portal_conf_custom.ini

Copy paste the base url of your MongoDB database in the [`conf_custom.ini`](0-ini/conf_custom.ini) file (replace with your own):

```ini
[database]

db_connection_uri: mongodb://127.0.0.1:27017
```

See [Configuration](#configuration) for more details.

### Run the rudinode-catalog

Now, everything should be set up; you can start the rudinode-catalog by running :

```bash
npm run start
```

The rudinode-catalog should now be locally accessible.

Notice that for the next times, you only have to run this command to start it.

> tip : execute `npm run` in bash to see all available shortcuts

