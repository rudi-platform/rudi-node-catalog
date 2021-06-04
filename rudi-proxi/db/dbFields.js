'use strict'

/*
 * In this file are defined the attributes of the JSON API
 * (= mongoose db documents properties)
 */

// -----------------------------------------------------------------------------
// DB fields
// -----------------------------------------------------------------------------
exports.DB_ID = '_id'
exports.DB_V = '__v'
exports.DB_CREATE_AT = 'createdAt'
exports.DB_UPDATED_AT = 'updatedAt'
exports.DB_PUBLISHED_AT = 'publishedAt'

exports.FIELDS_TO_SKIP = [
  this.DB_ID,
  this.DB_V,
  this.DB_CREATE_AT,
  this.DB_UPDATED_AT,
  this.DB_PUBLISHED_AT,
]

// -----------------------------------------------------------------------------
// ID properties
// -----------------------------------------------------------------------------
exports.API_METADATA_ID = 'global_id'
exports.API_ORGANIZATION_ID = 'organization_id'
exports.API_CONTACT_ID = 'contact_id'
exports.API_MEDIA_ID = 'media_id'

// -----------------------------------------------------------------------------
// Metadata properties
// -----------------------------------------------------------------------------
exports.API_DATA_PRODUCER_PROPERTY = 'producer'
exports.API_DATA_CONTACTS_PROPERTY = 'contacts'
exports.API_DATA_DATES_PROPERTY = 'dataset_dates'

// -----------------------------------------------------------------------------
// Metadata properties: media
// -----------------------------------------------------------------------------
exports.API_MEDIA_PROPERTY = 'available_formats'
exports.API_MEDIA_TYPE_PROPERTY = 'media_type'

// -----------------------------------------------------------------------------
// Metadata properties: metadata info
// -----------------------------------------------------------------------------
exports.API_METAINFO_PROPERTY = 'metadata_info'
exports.API_METAINFO_PROVIDER_PROPERTY = 'metadata_provider'
exports.API_METAINFO_CONTACTS_PROPERTY = 'metadata_contacts'
exports.API_METAINFO_DATES_PROPERTY = 'metadata_dates'

// -----------------------------------------------------------------------------
// Metadata properties: geospatial
// -----------------------------------------------------------------------------
exports.API_METADATA_GEOGRAPHY_PROPERTY = 'geography'
exports.API_METADATA_GEOJSON_PROPERTY = 'geographic_distribution'
exports.API_METADATA_GEO_PROJECTION_PROPERTY = 'projection'
exports.API_METADATA_BBOX_PROPERTY = 'bounding_box'
exports.API_METADATA_BBOX_WEST = 'west_longitude'
exports.API_METADATA_BBOX_EAST = 'east_longitude'
exports.API_METADATA_BBOX_SOUTH = 'south_latitude'
exports.API_METADATA_BBOX_NORTH = 'north_latitude'

exports.API_METADATA_PERIOD_PROPERTY = 'temporal_spread'
exports.API_METADATA_START_DATE_PROPERTY = 'start_date'

// -----------------------------------------------------------------------------
// Metadata properties: access condition / licence
// -----------------------------------------------------------------------------
exports.API_METADATA_ACCESS_CONDITION = 'access_condition'
exports.API_METADATA_LICENCE = 'licence'
exports.API_METADATA_LICENCE_TYPE = 'licence_type'
exports.API_METADATA_LICENCE_LABEL = 'licence_label'
exports.API_METADATA_LICENCE_CUSTOM_LABEL = 'custom_licence_label'
exports.API_METADATA_LICENCE_CUSTOM_URI = 'custom_licence_uri'

// -----------------------------------------------------------------------------
// Dates
// -----------------------------------------------------------------------------
exports.API_DATES_CREATED_PROPERTY = 'created'
exports.API_DATES_EDITED_PROPERTY = 'updated'
exports.API_DATES_PUBLISHED_PROPERTY = 'published'

// -----------------------------------------------------------------------------
// Integration reports
// -----------------------------------------------------------------------------
exports.API_REPORT_ID = 'report_id'
exports.API_REPORT_RESOURCE_ID = 'resource_id'
exports.API_REPORT_STATUS = 'integration_status'

// -----------------------------------------------------------------------------
// SKOS
// -----------------------------------------------------------------------------
// ID properties
exports.API_SKOS_SCHEME_ID = 'scheme_id'
exports.API_SKOS_SCHEME_CODE = 'scheme_code'

exports.API_SKOS_CONCEPT_ID = 'concept_id'
exports.API_SKOS_CONCEPT_CODE = 'concept_code'
exports.API_SKOS_CONCEPT_ROLE = 'concept_role'

// Scheme fields referencing Concepts
exports.API_SCHEME_TOPS_PROPERTY = 'top_concepts'

// Concept fields referencing a Scheme
exports.API_CONCEPT_CLASS_PROPERTY = 'of_scheme'

// Concept fields referencing other Concepts
exports.API_CONCEPT_PARENTS_PROPERTY = 'broader_concepts'
exports.API_CONCEPT_CHILDREN_PROPERTY = 'narrower_concepts'
exports.API_CONCEPT_SIBLINGS_PROPERTY = 'siblings_concepts'
exports.API_CONCEPT_RELATIVE_PROPERTY = 'relative_concepts'
