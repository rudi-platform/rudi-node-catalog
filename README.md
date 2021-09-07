RUDI producer node: API module - The interface module between RUDI Portal and internal Rudi Producer node services
==================================================================================================================

This module offers a RESTful interface to access RUDI metadata publically exposed on the RUDI Producer node.
It also makes it possible to upload metadata from another module such as the Producer node manager (https://gitlab.aqmo.org/rudidev/rudi-console-proxy)

* * *

xxx

### List of features

The Media driver provides :
* A definition of the RUDI metadata that is compatible with the definition (https://app.swaggerhub.com/apis/OlivierMartineau/RUDI-PRODUCER)
* A public API for fetching metadata 
* A private API for creating, accessing, updating and deleting metadata.

### Current deployment
- **test**: environment used to test that the current code can be executed on a distant node
- **shared**: environment used to ensure the compatibility with the other modules of the RUDI Producer node
- **release**: environment used to ensure the compatibility with Rennes Métropole's RUDI Portal. This version is the one to be deployed.

#### Public API

- **GET /api/v1/resources**: returns a list of all the public resources on the Producer node
- **GET /api/v1/resources/:id**
- **PUT /api/v1/resources/:id/report**
- **GET /api/v1/resources/:id/report**
- **GET /api/v1/resources/:id/report/:irid**

Optional parameters: 
- **limit** (default = 100, max = 500): the maximum number of  metadata in the result set    
- **offset** (default = 0): the number of metadata to skip before starting to collect the result set 
- **fields**: Comma-separated properties that are kept for displaying the elements of the result set
- **sort_by**: comma-separated properties used to order the metadata in the result set, ordered by decreasing priority. A minus sign before the field name means metadata will be sorted by decreasing values over this particular field
- **count_by**: the number of metadata to skip before starting to collect the result set  
- **group_by**: the one property to be used for grouping and counting the metadata
- **updated_after**: 
- **updated_before**
    - use:
        GET /api/v1/resources?limit=30&offset=3

#### Configuration
Configuration files can be found in the **"0-ini" directory**.
**"0-ini/conf_default.ini"**: default configuration and use examples
**"0-ini/conf_custom.ini"**: user configuration, to be created.

**Security profiles**
In the configuration file it is possible to activate the flag **"security.should_control_private_requests"**.
When this flag is true, JWT from incoming requests are controlled 

In the configuration file, the parameter **"security.profiles"** indicates the path where is located the security file.

The security "profiles" are defined each by a section whose **name** reflects the **"sub"** payload field in the JWT
In this section, 
- **pub_key** indicates the path where is stored the public key associated with the subject
- **routes[]** indicates the name of a route that is allowed for the user (see "0-ini/profiles.ini" file for a list of route names)

#### Security
**Required header fields for RUDI JWT**
- **alg**: the JWT algorithm (preferably "EdDSA"). It must correspond to the algorithm used to create the private key used to generate this token signature (preferably ed25519).
**Required payload fields for RUDI JWT**
- **exp**: desired expiration date in Epoch seconds
- **sub**: a recognized "profile" configuration.
- **req_mtd**: the http method used in the request
- **req_url**: the URL of the request

**Optional payload fields for RUDI JWT**
- **jti** (jwt identifier): a UUIDv4 identifying this JSON web token
- **iat** (issued at): date of the generation of the token in Epoch seconds
- **client_id**: an identifier for the logged user requesting the resource

**Test files**
In **"tests/env-rudi-*.postman_environment.json** the value for the key **"cryptoJwtUrl"** should be replaced with the valid address of the client/crypto module
