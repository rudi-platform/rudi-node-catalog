# Public routes in RUDI Producer node API

These routes are accessible from the internet, and especially the Portal:

- `GET /api/v1/resources`
    - returns a list of all the public resources on the Producer node
    - use of the optional parameters bellow can refine such request
- `GET /api/v1/resources/:id`
    - returns the metadata for the identified resource
- `PUT /api/v1/resources/:id/report` 
    - create or modify an integration report for the identified resource
- `GET /api/v1/resources/:id/report` 
    - lists the integration reports for the resource
- `GET /api/v1/resources/:id/report/:irid` 
    - accesses one identified report for an identified resource

### Optional parameters:
- `limit` (default = 100, max = 500): the maximum number of  metadata in the result set    
- `offset` (default = 0): the number of metadata to skip before starting to collect the result set 
- `fields`: Comma-separated properties that are kept for displaying the elements of the result set
- `sort_by`: comma-separated properties used to order the metadata in the result set, ordered by decreasing priority. A minus sign before the field name means metadata will be sorted by decreasing values over this particular field
- `count_by`: the number of metadata to skip before starting to collect the result set  
- `group_by`: the one property to be used for grouping and counting the metadata
- `updated_after`: Shortcut to list the metadata updated after a given date
- `updated_before`: Shortcut to list the metadata updated before a given date
