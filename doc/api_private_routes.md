# Public routes in RUDI Producer node API

These routes are accessible from the internet, and especially the Portal:

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
    - if no parameter is provided, confirm=true should be at leasrt mentioned to confirm the suppression of all objects of the 
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

### Optional parameters:
- `limit` (default = 100, max = 500): the maximum number of  metadata in the result set    
- `offset` (default = 0): the number of metadata to skip before starting to collect the result set 
- `fields`: Comma-separated properties that are kept for displaying the elements of the result set
- `sort_by`: comma-separated properties used to order the metadata in the result set, ordered by decreasing priority. A minus sign before the field name means metadata will be sorted by decreasing values over this particular field
- `count_by`: the number of metadata to skip before starting to collect the result set  
- `group_by`: the one property to be used for grouping and counting the metadata
- `updated_after`: Shortcut to list the metadata updated after a given date
- `updated_before`: Shortcut to list the metadata updated before a given date
