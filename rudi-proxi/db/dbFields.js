'use strict';

/*
 * In this file are defined the attributes of the JSON API
 * (= mongoose db documents properties)
 */

//———————————————————————————————————————————————————————————————
// DB fields
//———————————————————————————————————————————————————————————————
exports.DB_ID = '_id';
exports.DB_V = '__v';

exports.API_METADATA_ID = 'global_id';
exports.API_ORGANIZATION_ID = 'organization_id';
exports.API_CONTACT_ID = 'contact_id';

exports.API_DATA_PRODUCER_PROPERTY = 'producer';
exports.API_DATA_CONTACTS_PROPERTY = 'contacts';
exports.API_DATA_DATES_PROPERTY = 'dataset_dates';

exports.API_METAINFO_PROPERTY = 'medatata_info';
exports.API_METAINFO_PROVIDER_PROPERTY = 'metadata_provider';
exports.API_METAINFO_CONTACTS_PROPERTY = 'metadata_contacts';
exports.API_METAINFO_DATES_PROPERTY = 'metadata_dates';

exports.API_DATES_CREATED_PROPERTY = 'created';
exports.API_DATES_EDITED_PROPERTY = 'updated';
exports.API_DATES_PUBLISHED_PROPERTY = 'published';

//———————————————————————————————————————————————————————————————
// Integration reports
//———————————————————————————————————————————————————————————————
exports.API_REPORT_ID = 'report_id';
exports.API_REPORT_RESOURCE_ID = 'resource_id';
exports.API_REPORT_STATUS = 'integration_status';

