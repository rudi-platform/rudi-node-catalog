// const log = require('../utils/logging')



let METADATA_MOCKUP = {
  "temporal_spread": {
    "start_date": "2021-02-12T10:33:15.000Z"
  },
  "geography": {
    "bounding_box": {
      "west_longitude": -1.677803,
      "east_longitude": -1.677803,
      "north_latitude": 48.112834,
      "south_latitude": 48.112834
    }
  },
  "dataset_size": {},
  "medatata_info": {
    "metadata_contact": []
  },
  "contacts": [{
      "_id": "602e420b0bd88b1dc5490f6e",
      "contact_id": "0ea7d773-0cb4-4149-b444-8ac53439816b",
      "contact_name": "M. Fazo Gres",
      "email": "fazo@irisa.fr",
      "__v": 0
    },
    {
      "_id": "602e420d0bd88b1dc5490f6f",
      "contact_id": "50e2c58a-3b50-4fc0-bd27-82e88cb3e878",
      "contact_name": "Mme. Feya",
      "email": "feya@irisa.fr",
      "__v": 0
    }
  ],
  "available_formats": [],
  "resource_languages": [
    "fr"
  ],
  "storage_status": [],
  "_id": "602fc7a45af6665f3154f6b2",
  "global_id": "62763948-0033-403a-a083-64dce70c6044",
  "local_id": "testingID 4 lg",
  "doi": "10.1007/s00223-003-0070-444",
  "resource_title": "Test de RUDI en local 4444",
  "abstract": [{
    "lang": "fr",
    "text": "Courte description de RUDI en local 4444"
  }],
  "summary": [{
    "lang": "fr",
    "text": "Mon résumé chg 4"
  }],
  "theme": "oceans",
  "keywords": [{
      "_id": "602fc7a45af6665f3154f6b3",
      "skos_context": []
    },
    {
      "_id": "602fc7a45af6665f3154f6b4",
      "skos_context": []
    }
  ],
  "producer": {
    "_id": "602cda86700a260c91d52a06",
    "organization_id": "68763948-0033-403a-a083-64dce70c6044",
    "organization_name": "IRISA",
    "organization_address": "Campus de Beaulieu, 263 avenue du Général Leclerc, Bâtiment 12 F, allée Jean Perrin, 35042 RENNES Cedex",
    "titi": ['care', 'for'],
    "ragoudou": {
      "doudou": "le ragoût",
      "demon": "doudou"
    },
    "__v": 0
  }
}

function mutingFun() {
  METADATA_MOCKUP['geography'] = 'panpan'
  // log.d('mutingFun', METADATA_MOCKUP)
  return METADATA_MOCKUP
}

test('muting function', () => {
  expect(mutingFun()['geography'])
    .toBe('panpan')
})

function mutingFun2() {
  METADATA_MOCKUP = mutingFun();
  return METADATA_MOCKUP
}

test('muting function2', () => {
  expect(mutingFun2()['geography'])
    .toBe('panpan')
})

function getProducer() {
  return METADATA_MOCKUP['producer']
}

test('no spread provider', () => {
  expect(getProducer()._id)
    .toEqual("602cda86700a260c91d52a06")
})

function getSpreadProducer() {
  let meztadata = {...METADATA_MOCKUP}
  let producer = meztadata.producer
  
  return producer.ragoudou
}


test('spread provider', () => {
  expect(getSpreadProducer())
    .toEqual({
      "doudou": "le ragoût",
      "demon": "doudou"
    })
})