# Description de la métadonnée RUDI

_Description en français des différents champs d'une métadonnée RUDI_

---

| Catégorie                          | Nom du champ                              | Description                                                                  | Type                           | Format                                         | Restrictions                                         | Présence                                | Exemple                                                                                     |
| ---------------------------------- | ----------------------------------------- | ---------------------------------------------------------------------------- | ------------------------------ | ---------------------------------------------- | ---------------------------------------------------- | --------------------------------------- | ------------------------------------------------------------------------------------------- |
| Identification                     | **global_id**                             | Identifiant de la métadonnée dans RUDI                                       | texte                          | UUID v4                                        | unique dans tout RUDI                                | requis                                  | 7e730bbc-d8f5-4746-a7ee-c965717b61d1                                                        |
| Identification                     | **local_id**                              | Identifiant de la métadonnée dans le système local du producteur             | texte                          | libre                                          | unique sur le Nœud Producuteur                       | facultatif                              | 1234W34                                                                                     |
| Identification                     | **doi**                                   | Identifiant unique de la métadonnée sur internet                             | texte                          | syntaxe DOI (ISO 26324)                        | universellement unique                               | facultatif                              | 10.1007/978-3-030-29654-4                                                                   |
| Description                        | **resource_title**                        | Nom de la ressource                                                          | texte                          | libre                                          | taille max = 150 caractères                          | requis                                  | "Données de capteurs de la qualité de l'air, novembre 2020, Laënnec"                        |
| Description                        | **synopsis**                              | Courte description de la ressource                                           | texte                          | libre                                          | taille max = 150 caractères                          | requis                                  | "Données de capteurs de la qualité de l'air sur la période de novembre 2020, arrêt Laënnec" |
| Description                        | **summary**                               | Description plus précise de la ressource                                     | texte                          | libre                                          | taille max = 500 caractères                          | requis                                  | "Données de capteurs de la qualité de l'air sur la période de novembre 2020, arrêt Laënnec" |
| Classification                     | **theme**                                 | Thème le plus adapté pour classifier la ressource                            | texte                          | Terme prédéfini                                | Choix unique parmi des termes prédéfinis dans RUDI   | requis                                  | Mobilité, Transport                                                                         |
| Classification                     | **keywords**                              | Liste de mots-clés qui caractérisent la ressource                            | Liste d'éléments de type texte | Liste de termes prédéfinis                     | Choix multiple parmi des termes prédéfinis dans RUDI | requis                                  | ["vélo", "vélostar", "environnement" ]                                                      |
| Producteur de la donnée            | **producer**                              | Organisation qui a produit la donnée                                         | JSON                           | JSON de type "Organization"                    | x                                                    | requis                                  | requis                                                                                      |
| Producteur de la donnée            | **contacts**                              | Liste de personnes référentes pour la donnée                                 | Liste d'éléments de type JSON  | Liste de JSON de type "Contacts"               |                                                      | requis                                  | requis                                                                                      |
| Formats                            | **available_formats**                     | Liste des formats disponibles pour la donnée                                 | Liste d'éléments de type JSON  | Liste de JSON de type "Media"                  |                                                      | requis                                  | requis                                                                                      |
| Caractéristiques du jeu de données | **resource_languages**                    | Liste des langages disponibles dans la ressource                             | Liste termes prédéfinis        | Liste de langages parmis ceux listés dans RUDI | Choix multiple parmi des termes prédéfinis dans RUDI | facultatif                              | ["fr", "en-GB"]                                                                             |
| Caractéristiques du jeu de données | **temporal_spread**                       | Période de temps dans laquelle s'inscrivent les données                      | JSON                           | JSON (cf. lignes suivantes)                    |                                                      | facultatif                              |
| Caractéristiques du jeu de données | temporal_spread.**start_date**            | Date de départ de la période de temps dans laquelle s'inscrivent les données | Texte                          | Date + temps (ISO 8601)                        |                                                      | requis si "temporal_spread" est définie | 2021-07-20T09:10:11.234Z                                                                    |
| Caractéristiques du jeu de données | temporal_spread.**end_date**              | Date de fin de la période de temps dans laquelle s'inscrivent les données    | Texte                          | Date + temps (ISO 8601)                        |                                                      | facultatif                              | 2021-07-22T19:12:31.934Z                                                                    |
| Caractéristiques du jeu de données | **geography**                             | Localisation géographique de la donnée                                       | JSON                           |                                                |                                                      | facultatif                              |                                                                                             |
| Caractéristiques du jeu de données | geography.**bounding_box**                | Zone englobant la distribution géographique de la donnée                     | JSON                           |                                                |                                                      | requis si "geography" est définie       |                                                                                             |
| Caractéristiques du jeu de données | geography.bounding_box.**north_latitude** | Latitude nord de la zone géographique englobant les données                  | Nombre décimal                 | Latitude (ISO 6709)                            | minimum: -90, maximum: 90                            | requis si "geography" est définie       |                                                                                             |
| Caractéristiques du jeu de données | geography.bounding_box.**south_latitude** | Latitude sud de la zone géographique englobant les données                   | Nombre décimal                 | Latitude (ISO 6709)                            | minimum: -90, maximum: 90                            | requis si "geography" est définie       |                                                                                             |
| Caractéristiques du jeu de données | geography.bounding_box.**west_longitude** | Longitude ouest nord de la zone géographique englobant les données           | Nombre décimal                 | Longitude (ISO 6709)                           | minimum: -180, maximum: 180                          | requis si "geography" est définie       |                                                                                             |
| Caractéristiques du jeu de données | geography.bounding_box.**east_longitude** | Longitude nestord de la zone géographique englobant les données              | Nombre décimal                 | Longitude (ISO 6709)                           | minimum: -180, maximum: 180                          | requis si "geography" est définie       |                                                                                             |
| Caractéristiques du jeu de données | geography.**geographic_distribution**     | Distribution géographique du jeu de données                                  | JSON                           | GeoJSON (RFC-7946)                             | Projection des coordonnées = EPSG:4326/WGS 84        |
| Caractéristiques du jeu de données | geography.**projection**                  | Distribution géographique du jeu de données                                  | JSON                           | GeoJSON (RFC-7946)                             | Projection des coordonnées = EPSG:4326/WGS 84        |

'projection':
description:
Cartographic projection used in the data.
EPSG codes highly recommended.
type: string
default: 'WGS 84'
example: 'WGS 84 (EPSG:4326)'

# 'RGF93/Lambert-93 (EPSG:2154)'

# 'RGF93/CC48 (EPSG:3948)'

#TODO: 'Projection' thesaurus

#——————————————————————————
'dataset_size':
description: Indicative total size of the data
type: object
properties:
#......................
'numbers_of_records':  
type: integer
minimum: 0
#......................
'number_of_fields':
type: integer
minimum: 0

#——————————————————————————
'dataset_dates':
allOf:

- description: Dates of the actions performed on the data (creation, publishing, update, deletion...)
  type: object
- $ref: '#/components/schemas/ReferenceDates'

#——————————————————————————
'storage_status':
description: >-
Status of the storage of the dataset
Metadata can exist without the data

- online = data are published and available
- archived = data are not immediately available, access is not automatic
- unavailable = data were deleted
  type: string
  enum: [online, archived, unavailable]

# !SKOS!

#—•—•—•—•—•—•—•—•—•—•—•—•—•

# ACCESS CONSTRAINTS

#——————————————————————————
'access_condition':
description: >
Access restrictions for the use of data in the form of licence,
confidentiality, terms of service, habilitation or required rights,
economical model. Default is open licence.
#TODO: to be defined. Possible redundencies with other fields!
type: object
required:

- licence
  properties:
  #......................
  'confidentiality':
  description: Restriction level for the resource
  type: object
  properties:
  'restricted_access':
  description: >
  True if the dataset has a restricted access.
  False for open data
  type: boolean
  'gdpr_sensitive':
  description: >
  True if the dataset embeds personal data
  type: boolean
  #......................
  'licence':
  $ref: '#/components/schemas/Licence'
#......................
'usage_constraint':
description: >
Describes how constrained is the use of the resource
type: array
items:
$ref: '#/components/schemas/DictionaryEntry'
  example:
  [
  {
  "lang": "fr",
  "text": "Usage libre sous réserve des mentions obligatoires sur tout document de diffusion"
  }
  ]
  #......................
  'bibliographical_reference':
  description: >
  Information that MUST be cited every time the data is used,
  most likely a BibTeX entry
  type: array
  items:
  $ref: '#/components/schemas/DictionaryEntry'
#......................
'mandatory_mention':
description: >
Mention that must be cited verbatim in every publication that
makes use of the data
type: array
items:
$ref: '#/components/schemas/DictionaryEntry'
  minItems: 1
  example:
  [
  {
  "lang": "fr-FR",
  "text": "Source: Région Bretagne"
  }
  ]
  #......................
  'access_constraint':
  type: array
  items:
  $ref: '#/components/schemas/DictionaryEntry'
#......................
'other_constraints':
type: array
items:
$ref: '#/components/schemas/DictionaryEntry'
  example:
  [
  {
  "lang": "fr",
  "text": "Pas de restriction d'accès public"
  }
  ]
  #—•—•—•—•—•—•—•—•—•—•—•—•—•

# METADATA INFO

#——————————————————————————
'metadata_info':
description: Metadata on the metadata
type: object
required:

- api_version
  properties:
  #......................
  'api_version':
  type: string
  pattern: '([0-9]{1,2}\.){2}[0-9]{1,2}[a-z]\*'
  #......................
  'metadata_dates':
  $ref: '#/components/schemas/ReferenceDates'
  #......................
  'metadata_provider':
  allOf:
- description:
  Description of the organization that produced the metadata
  type: object
- $ref: '#/components/schemas/Organization'
#......................
'metadata_contacts':
description: 
Addresses to get further information on the metadata
type: array
items:
$ref: '#/components/schemas/Contact'

#---------------------------------------------------------------------------
'Organization': # Organization
description:
Entity that produced the data or provided the associated metadata
type: object
required:

- organization_id
- organization_name
  properties:
  #——————————————————————————
  'organization_id':
  description: Unique identifier of the organization in RUDI system
  type: string
  format: uuid
  #——————————————————————————
  'organization_name':
  description: Updated offical name of the organization
  type: string
  #——————————————————————————
  'organization_address':
  description: Updated offical postal address of the organization
  type: string
