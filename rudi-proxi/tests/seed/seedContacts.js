//———————————————————————————————————————————————————————————————
// External dependancies 
//———————————————————————————————————————————————————————————————
const uuid = require('uuid')

//———————————————————————————————————————————————————————————————
// Constants
//———————————————————————————————————————————————————————————————
let NAMES
NAMES['female'] = JSON.parse(fs.readFileSync(`./lists/names-female.json`, 'utf-8')).data
NAMES['male'] = JSON.parse(fs.readFileSync(`./lists/names-male.json`, 'utf-8')).data
NAMES['surnames'] = JSON.parse(fs.readFileSync(`./lists/names-surnames.json`, 'utf-8')).data

const mailOrg = ['irisa.fr', 'univ-rennes1.fr', 'inria.fr', 'rennesmetropole.fr']

// {
//   "contact_id": "{{contId1}}",
//   "contact_name": "M. Fazo",
//   "email": "fazo@irisa.fr"
// }

//———————————————————————————————————————————————————————————————
// Fucntions
//———————————————————————————————————————————————————————————————

function pickRandom(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function generateName(gender) {
  const gender = gender || pickRandom(['male', 'female'])

  // Pick a random name from each list
  const firstName = pickRandom(NAMES[gender]);
  const lastName = pickRandom(NAMES['surnames']);

  // Use a template literal to format the full name
  return [`${firstName} ${lastName}`, firstName, lastName];
}

exports.createContact = async (nbContactsToSeed) => {
  let contact = {}
  contact['contact_id'] = uuid.v4()
  const [fullName, firstName, lastName] = generateName()
  contact['contact_name'] = fullName
  contact['email'] = `${firstName}.${lastName}@${pickRandom(mailOrg)}`
}
