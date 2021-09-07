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

