export const eventFormattedTimezone = (currentTimezone: string) => {
  if (['America/Los_Angeles', 'America/Vancouver', 'America/Tijuana'].includes(currentTimezone)) {
    return 'Pacific Time';
  }

  if (['America/Boise', 'America/Cambridge_Bay', 'America/Chihuahua', 'America/Creston', 'America/Dawson',
    'America/Dawson_Creek', 'America/Denver', 'America/Edmonton', 'America/Fort_Nelson', 'America/Hermosillo',
    'America/Inuvik', 'America/Mazatlan', 'America/Ojinaga', 'America/Phoenix', 'America/Whitehorse',
    'America/Yellowknife'].includes(currentTimezone)) {
    return 'Mountain Time';
  }

  if (['America/Atikokan', 'America/Cancun', 'America/Cayman', 'America/Detroit', 'America/Grand_Turk', 'America/Indiana/Indianapolis',
    'America/Indiana/Marengo', 'America/Indiana/Petersburg', 'America/Indiana/Vevay', 'America/Indiana/Vincennes',
    'America/Indiana/Winamac', 'America/Iqaluit', 'America/Jamaica', 'America/Kentucky/Louisville', 'America/Kentucky/Monticello',
    'America/Nassau', 'America/New_York', 'America/Nipigon', 'America/Panama', 'America/Pangnirtung', 'America/Port-au-Prince',
    'America/Santo_Domingo', 'America/Thunder_Bay',	'America/Toronto'].includes(currentTimezone)) {
    return 'Eastern Time';
  }

  const tzSplit = (currentTimezone || '').split('/', 2);
  const cityName = tzSplit.length >= 2 ? tzSplit[1].replace('_', '') : currentTimezone;
  return `${cityName} Time`;
};
