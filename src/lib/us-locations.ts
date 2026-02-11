// US States and sample counties for targeting
export const US_STATES = [
  "Alabama","Alaska","Arizona","Arkansas","California","Colorado","Connecticut","Delaware","Florida","Georgia",
  "Hawaii","Idaho","Illinois","Indiana","Iowa","Kansas","Kentucky","Louisiana","Maine","Maryland",
  "Massachusetts","Michigan","Minnesota","Mississippi","Missouri","Montana","Nebraska","Nevada","New Hampshire","New Jersey",
  "New Mexico","New York","North Carolina","North Dakota","Ohio","Oklahoma","Oregon","Pennsylvania","Rhode Island","South Carolina",
  "South Dakota","Tennessee","Texas","Utah","Vermont","Virginia","Washington","West Virginia","Wisconsin","Wyoming"
];

// Top counties by state (subset for common targeting)
export const STATE_COUNTIES: Record<string, string[]> = {
  "California": ["Los Angeles","San Diego","Orange","Riverside","San Bernardino","Santa Clara","Alameda","Sacramento","San Francisco","Fresno"],
  "Texas": ["Harris","Dallas","Tarrant","Bexar","Travis","Collin","Denton","Hidalgo","Fort Bend","El Paso"],
  "Florida": ["Miami-Dade","Broward","Palm Beach","Hillsborough","Orange","Duval","Pinellas","Lee","Polk","Brevard"],
  "New York": ["Kings","Queens","New York","Suffolk","Bronx","Nassau","Westchester","Erie","Monroe","Richmond"],
  "Colorado": ["Denver","El Paso","Arapahoe","Jefferson","Adams","Douglas","Larimer","Boulder","Weld","Mesa"],
  "Illinois": ["Cook","DuPage","Lake","Will","Kane","McHenry","Winnebago","Madison","St. Clair","Champaign"],
  "Pennsylvania": ["Philadelphia","Allegheny","Montgomery","Bucks","Delaware","Lancaster","Chester","York","Berks","Lehigh"],
  "Ohio": ["Franklin","Cuyahoga","Hamilton","Summit","Montgomery","Lucas","Stark","Butler","Warren","Lorain"],
  "Georgia": ["Fulton","Gwinnett","Cobb","DeKalb","Chatham","Clayton","Cherokee","Henry","Forsyth","Hall"],
  "North Carolina": ["Mecklenburg","Wake","Guilford","Forsyth","Cumberland","Durham","Buncombe","Gaston","New Hanover","Cabarrus"],
};

// Fallback for states not in the map
export function getCounties(state: string): string[] {
  return STATE_COUNTIES[state] || ["All Counties"];
}
