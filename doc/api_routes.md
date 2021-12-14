# Routes in RUDI Producer node API

## Redirected routes

- `GET /api`
- `GET /api/v1`
- `GET /resources`
- `GET /resources/*`
- `PUT /resources/*`

## No authentification required

- `GET /api/version`
- `GET /api/admin/hash`
- `GET /api/admin/apphash`
- `GET /api/admin/env`

## Portal authentification required

- `GET /api/v1/resources`
  - Access a list of metadata
  - Optional parameters bellow can refine this request
- `GET /api/v1/resources/:id`
  - Access one identified metadata
- `PUT /resources/:id/report`
  - Create or modify an integration report for the identified resource
- `PUT /api/v1/resources/:id/report`
  - Create or modify an integration report for the identified resource
- `GET /api/v1/resources/:id/report`
  - List the integration reports for the resource
- `GET /api/v1/resources/:id/report/:irid`
  - Access one identified report for an identified resource

### Optional parameters:

- `limit` (default = 100, max = 500): the maximum number of metadata in the result set
- `offset` (default = 0): the number of metadata to skip before starting to collect the result set
- `fields`: comma-separated properties that are kept for displaying the elements of the result set
- `sort_by`: comma-separated properties used to order the metadata in the result set, ordered by decreasing priority. A minus sign before the field name means metadata will be sorted by decreasing values over this particular field
- `updated_after`: shortcut to list the metadata updated after a given date
- `updated_before`: shortcut to list the metadata updated before a given date

## Rudi prod authentification required, action on objects

- `POST /api/admin/:object`
  - Create object ( = resources | organization | contact | report)
- `PUT /api/admin/:object`
  - Create or update object
- `GET /api/admin/:object`
  - Access a list of objects of a given type (= resources | organization | contact | report)
  - Optional parameters bellow can refine this request
- `GET /api/admin/:object/:id`
  - Access one identified object
- `DELETE /api/admin/:object/:id`
  - Delete one identified object
- `DELETE /api/admin/:object`
  - Delete a list of objects
  - Optional parameters bellow can refine this request
  - if no parameter is provided, confirm=true should be at least mentioned to confirm the suppression of all objects of the rudi node
- `POST /api/admin/:object/deletion`
  - Delete a list of identified objects
  - Body of the request must be an array of uuid of the objects to be deleted
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

### Optional parameters:

- `limit` (default = 100, max = 500): the maximum number of metadata in the result set
- `offset` (default = 0): the number of metadata to skip before starting to collect the result set
- `fields`: Comma-separated properties that are kept for displaying the elements of the result set
- `sort_by`: comma-separated properties used to order the metadata in the result set, ordered by decreasing priority. A minus sign before the field name means metadata will be sorted by decreasing values over this particular field
- `count_by`: the number of metadata to skip before starting to collect the result set
- `group_by`: the one property to be used for grouping and counting the metadata
- `updated_after`: Shortcut to list the metadata updated after a given date
- `updated_before`: Shortcut to list the metadata updated before a given date

## Rudi prod authentification + app driven actions

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
- `GET /api/admin/logs`
- `GET /api/admin/logs/:lines`
- `GET /api/admin/db`
- `DELETE /api/admin/db/:object`
- `DELETE /api/admin/db`

- `GET /api/admin/:object/:id`
- `DELETE /api/admin/:object/:id`
- `DELETE /api/admin/:object`

- `POST /api/admin/:object/deletion`
- `GET /api/admin/:object/unlinked`
- `POST /api/admin/:object/:id/report`
- `PUT /api/admin/:object/:id/report`
- `GET /api/admin/:object/:id/report`
- `GET /api/admin/:object/:id/report/:irid`
- `GET /api/admin/:object/report`
- `DELETE /api/admin/:object/:id/report/:irid`
- `DELETE /api/admin/:object/:id/report`
- `POST /api/admin/:object/:id/report/deletion`
- `GET /api/admin/enum`
- `GET /api/admin/enum/:code`
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
- `GET /api/admin/hash`
- `GET /api/admin/apphash`
- `GET /api/admin/nv`
- `GET /api/admin/env`
- `GET /api/admin/logs`
- `GET /api/admin/logs/:lines`
- `GET /api/admin/db`
- `DELETE /api/admin/db`
- `GET /api/admin/test`
