// -------------------------------------------------------------------------------------------------
// Internal dependencies
// -------------------------------------------------------------------------------------------------
import { Thesaurus } from './Thesaurus.js'

// -------------------------------------------------------------------------------------------------
// Enum init
// -------------------------------------------------------------------------------------------------

export const UpdateFrequency = {
  Continual: 'continual', //     Data is repeatedly and frequently updated
  Daily: 'daily', //			 Data is updated each day
  Weekly: 'weekly', //			 Data is updated on a weekly basis
  Fortnightly: 'fortnightly', // Data is updated every two weeks
  Monthly: 'monthly', //		 Data is updated each month
  Quarterly: 'quarterly', //	 Data is updated every three months
  Biannually: 'biannually', //	 Data is updated twice each year
  Annually: 'annually', //		 Data is updated every year
  AsNeeded: 'asNeeded', //		 Data is updated as deemed necessary
  Irregular: 'irregular', //	 Data is updated in intervals that are uneven in duration
  NotPlanned: 'notPlanned', //	 There are no plans to update the data
  Unknown: 'unknown', //         Frequency of maintenance for the data is not known
}

const CODE = 'updateFrequencies'

const INIT_VALUES = {
  continual: {
    en: 'Data is repeatedly and frequently updated',
    fr: 'Les données sont mises à jour de façon continue',
  },
  daily: {
    en: 'Data is updated each day',
    fr: 'Les données sont mises à jour chaque jour',
  },
  weekly: {
    en: 'Data is updated on a weekly basis',
    fr: 'Les données sont mises à jour chaque semaine',
  },
  fortnightly: {
    en: 'Data is updated every two weeks',
    fr: 'Les données sont mises à jour toutes les deux semaines',
  },
  monthly: {
    en: 'Data is updated each month',
    fr: 'Les données sont mises à jour chaque mois',
  },
  quarterly: {
    en: 'Data is updated every three months',
    fr: 'Les données sont mises à jour tous les trois mois',
  },
  biannually: {
    en: 'Data is updated twice each year',
    fr: 'Les données sont mises à jour deux fois par an',
  },
  annually: {
    en: 'Data is updated every year',
    fr: 'Les données sont mises à jour chaque année',
  },
  asNeeded: {
    en: 'Data is updated as deemed necessary',
    fr: 'Les données sont mises à jour si nécessaire',
  },
  irregular: {
    en: 'Data is updated in uneven intervals',
    fr: 'Les données sont mises à jour sans régularité',
  },
  notPlanned: {
    en: 'There are no plans to update the data',
    fr: 'Aucune mise à jour n’est prévue',
  },
  unknown: {
    en: 'Frequency of maintenance is not known',
    fr: 'La fréquence de mise à jour n’est pas connue',
  },
}

export const UpdateFrequencies = new Thesaurus(CODE, INIT_VALUES)

export const isValid = (val) => UpdateFrequencies.isValid(val)

export default UpdateFrequencies
