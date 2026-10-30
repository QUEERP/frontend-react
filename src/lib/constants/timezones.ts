export interface TimezoneOption {
  value: string;
  label: string;
}

export const COMMON_TIMEZONES: TimezoneOption[] = [
  {
    "value": "UTC",
    "label": "(UTC+00:00) UTC / Greenwich Mean Time"
  },
  {
    "value": "GMT",
    "label": "(UTC+00:00) GMT - London, Dublin, Lisbon"
  },
  {
    "value": "CET",
    "label": "(UTC+01:00) CET - Berlin, Paris, Rome, Madrid, Amsterdam"
  },
  {
    "value": "EET",
    "label": "(UTC+02:00) EET - Cairo, Athens, Bucharest, Helsinki"
  },
  {
    "value": "AST",
    "label": "(UTC+03:00) AST / MSK - Riyadh, Kuwait, Moscow, Nairobi"
  },
  {
    "value": "IRST",
    "label": "(UTC+03:30) IRST - Tehran"
  },
  {
    "value": "GST",
    "label": "(UTC+04:00) GST - Dubai, Abu Dhabi, Muscat"
  },
  {
    "value": "AFT",
    "label": "(UTC+04:30) AFT - Kabul"
  },
  {
    "value": "PKT",
    "label": "(UTC+05:00) PKT - Karachi, Islamabad, Tashkent"
  },
  {
    "value": "IST",
    "label": "(UTC+05:30) IST - India (Mumbai, New Delhi, Kolkata)"
  },
  {
    "value": "NPT",
    "label": "(UTC+05:45) NPT - Kathmandu"
  },
  {
    "value": "BST",
    "label": "(UTC+06:00) BST - Dhaka, Almaty"
  },
  {
    "value": "MMT",
    "label": "(UTC+06:30) MMT - Yangon"
  },
  {
    "value": "ICT",
    "label": "(UTC+07:00) ICT - Bangkok, Jakarta, Hanoi"
  },
  {
    "value": "CST_CN",
    "label": "(UTC+08:00) CST / SGT / HKT - Singapore, Beijing, Hong Kong, Perth"
  },
  {
    "value": "JST",
    "label": "(UTC+09:00) JST / KST - Tokyo, Seoul"
  },
  {
    "value": "ACST",
    "label": "(UTC+09:30) ACST - Adelaide, Darwin"
  },
  {
    "value": "AEST",
    "label": "(UTC+10:00) AEST - Sydney, Melbourne, Brisbane"
  },
  {
    "value": "NFT",
    "label": "(UTC+11:00) SBR - Solomon Islands, New Caledonia"
  },
  {
    "value": "NZST",
    "label": "(UTC+12:00) NZST - Auckland, Wellington, Fiji"
  },
  {
    "value": "TOT",
    "label": "(UTC+13:00) TOT - Tonga, Nuku'alofa"
  },
  {
    "value": "LINT",
    "label": "(UTC+14:00) LINT - Kiritimati, Line Islands"
  },
  {
    "value": "AZOT",
    "label": "(UTC-01:00) AZOT - Azores, Cape Verde"
  },
  {
    "value": "GST_BR",
    "label": "(UTC-02:00) Mid-Atlantic"
  },
  {
    "value": "BRT",
    "label": "(UTC-03:00) BRT / ART - Sao Paulo, Buenos Aires"
  },
  {
    "value": "NST",
    "label": "(UTC-03:30) NST - Newfoundland"
  },
  {
    "value": "AST_US",
    "label": "(UTC-04:00) AST - Atlantic Time (Canada), Santiago, Caracas"
  },
  {
    "value": "EST",
    "label": "(UTC-05:00) EST - Eastern Time (US & Canada), New York, Toronto"
  },
  {
    "value": "CST",
    "label": "(UTC-06:00) CST - Central Time (US & Canada), Chicago, Mexico City"
  },
  {
    "value": "MST",
    "label": "(UTC-07:00) MST - Mountain Time (US & Canada), Denver, Phoenix"
  },
  {
    "value": "PST",
    "label": "(UTC-08:00) PST - Pacific Time (US & Canada), Los Angeles, Vancouver"
  },
  {
    "value": "AKST",
    "label": "(UTC-09:00) AKST - Alaska"
  },
  {
    "value": "HST",
    "label": "(UTC-10:00) HST - Hawaii"
  },
  {
    "value": "SST",
    "label": "(UTC-11:00) SST - Midway Island, American Samoa"
  },
  {
    "value": "BIT",
    "label": "(UTC-12:00) BIT - Baker Island"
  }
];

export const ALL_TIMEZONES: TimezoneOption[] = [
  {
    "value": "Pacific/Midway",
    "label": "(UTC-11:00) Pacific/Midway"
  },
  {
    "value": "Pacific/Niue",
    "label": "(UTC-11:00) Pacific/Niue"
  },
  {
    "value": "Pacific/Pago_Pago",
    "label": "(UTC-11:00) Pacific/Pago Pago"
  },
  {
    "value": "Pacific/Honolulu",
    "label": "(UTC-10:00) Pacific/Honolulu"
  },
  {
    "value": "Pacific/Rarotonga",
    "label": "(UTC-10:00) Pacific/Rarotonga"
  },
  {
    "value": "Pacific/Tahiti",
    "label": "(UTC-10:00) Pacific/Tahiti"
  },
  {
    "value": "Pacific/Marquesas",
    "label": "(UTC-09:30) Pacific/Marquesas"
  },
  {
    "value": "America/Adak",
    "label": "(UTC-09:00) America/Adak"
  },
  {
    "value": "Pacific/Gambier",
    "label": "(UTC-09:00) Pacific/Gambier"
  },
  {
    "value": "America/Anchorage",
    "label": "(UTC-08:00) America/Anchorage"
  },
  {
    "value": "America/Juneau",
    "label": "(UTC-08:00) America/Juneau"
  },
  {
    "value": "America/Metlakatla",
    "label": "(UTC-08:00) America/Metlakatla"
  },
  {
    "value": "America/Nome",
    "label": "(UTC-08:00) America/Nome"
  },
  {
    "value": "America/Sitka",
    "label": "(UTC-08:00) America/Sitka"
  },
  {
    "value": "America/Yakutat",
    "label": "(UTC-08:00) America/Yakutat"
  },
  {
    "value": "Pacific/Pitcairn",
    "label": "(UTC-08:00) Pacific/Pitcairn"
  },
  {
    "value": "America/Creston",
    "label": "(UTC-07:00) America/Creston"
  },
  {
    "value": "America/Dawson",
    "label": "(UTC-07:00) America/Dawson"
  },
  {
    "value": "America/Dawson_Creek",
    "label": "(UTC-07:00) America/Dawson Creek"
  },
  {
    "value": "America/Fort_Nelson",
    "label": "(UTC-07:00) America/Fort Nelson"
  },
  {
    "value": "America/Hermosillo",
    "label": "(UTC-07:00) America/Hermosillo"
  },
  {
    "value": "America/Los_Angeles",
    "label": "(UTC-07:00) America/Los Angeles"
  },
  {
    "value": "America/Mazatlan",
    "label": "(UTC-07:00) America/Mazatlan"
  },
  {
    "value": "America/Phoenix",
    "label": "(UTC-07:00) America/Phoenix"
  },
  {
    "value": "America/Tijuana",
    "label": "(UTC-07:00) America/Tijuana"
  },
  {
    "value": "America/Vancouver",
    "label": "(UTC-07:00) America/Vancouver"
  },
  {
    "value": "America/Whitehorse",
    "label": "(UTC-07:00) America/Whitehorse"
  },
  {
    "value": "America/Bahia_Banderas",
    "label": "(UTC-06:00) America/Bahia Banderas"
  },
  {
    "value": "America/Belize",
    "label": "(UTC-06:00) America/Belize"
  },
  {
    "value": "America/Boise",
    "label": "(UTC-06:00) America/Boise"
  },
  {
    "value": "America/Cambridge_Bay",
    "label": "(UTC-06:00) America/Cambridge Bay"
  },
  {
    "value": "America/Chihuahua",
    "label": "(UTC-06:00) America/Chihuahua"
  },
  {
    "value": "America/Ciudad_Juarez",
    "label": "(UTC-06:00) America/Ciudad Juarez"
  },
  {
    "value": "America/Costa_Rica",
    "label": "(UTC-06:00) America/Costa Rica"
  },
  {
    "value": "America/Denver",
    "label": "(UTC-06:00) America/Denver"
  },
  {
    "value": "America/Edmonton",
    "label": "(UTC-06:00) America/Edmonton"
  },
  {
    "value": "America/El_Salvador",
    "label": "(UTC-06:00) America/El Salvador"
  },
  {
    "value": "America/Guatemala",
    "label": "(UTC-06:00) America/Guatemala"
  },
  {
    "value": "America/Inuvik",
    "label": "(UTC-06:00) America/Inuvik"
  },
  {
    "value": "America/Managua",
    "label": "(UTC-06:00) America/Managua"
  },
  {
    "value": "America/Merida",
    "label": "(UTC-06:00) America/Merida"
  },
  {
    "value": "America/Mexico_City",
    "label": "(UTC-06:00) America/Mexico City"
  },
  {
    "value": "America/Monterrey",
    "label": "(UTC-06:00) America/Monterrey"
  },
  {
    "value": "America/Regina",
    "label": "(UTC-06:00) America/Regina"
  },
  {
    "value": "America/Swift_Current",
    "label": "(UTC-06:00) America/Swift Current"
  },
  {
    "value": "America/Tegucigalpa",
    "label": "(UTC-06:00) America/Tegucigalpa"
  },
  {
    "value": "Pacific/Galapagos",
    "label": "(UTC-06:00) Pacific/Galapagos"
  },
  {
    "value": "America/Bogota",
    "label": "(UTC-05:00) America/Bogota"
  },
  {
    "value": "America/Cancun",
    "label": "(UTC-05:00) America/Cancun"
  },
  {
    "value": "America/Cayman",
    "label": "(UTC-05:00) America/Cayman"
  },
  {
    "value": "America/Chicago",
    "label": "(UTC-05:00) America/Chicago"
  },
  {
    "value": "America/Coral_Harbour",
    "label": "(UTC-05:00) America/Coral Harbour"
  },
  {
    "value": "America/Eirunepe",
    "label": "(UTC-05:00) America/Eirunepe"
  },
  {
    "value": "America/Guayaquil",
    "label": "(UTC-05:00) America/Guayaquil"
  },
  {
    "value": "America/Indiana/Knox",
    "label": "(UTC-05:00) America/Indiana/Knox"
  },
  {
    "value": "America/Indiana/Tell_City",
    "label": "(UTC-05:00) America/Indiana/Tell City"
  },
  {
    "value": "America/Jamaica",
    "label": "(UTC-05:00) America/Jamaica"
  },
  {
    "value": "America/Lima",
    "label": "(UTC-05:00) America/Lima"
  },
  {
    "value": "America/Matamoros",
    "label": "(UTC-05:00) America/Matamoros"
  },
  {
    "value": "America/Menominee",
    "label": "(UTC-05:00) America/Menominee"
  },
  {
    "value": "America/North_Dakota/Beulah",
    "label": "(UTC-05:00) America/North Dakota/Beulah"
  },
  {
    "value": "America/North_Dakota/Center",
    "label": "(UTC-05:00) America/North Dakota/Center"
  },
  {
    "value": "America/North_Dakota/New_Salem",
    "label": "(UTC-05:00) America/North Dakota/New Salem"
  },
  {
    "value": "America/Ojinaga",
    "label": "(UTC-05:00) America/Ojinaga"
  },
  {
    "value": "America/Panama",
    "label": "(UTC-05:00) America/Panama"
  },
  {
    "value": "America/Rankin_Inlet",
    "label": "(UTC-05:00) America/Rankin Inlet"
  },
  {
    "value": "America/Resolute",
    "label": "(UTC-05:00) America/Resolute"
  },
  {
    "value": "America/Rio_Branco",
    "label": "(UTC-05:00) America/Rio Branco"
  },
  {
    "value": "America/Winnipeg",
    "label": "(UTC-05:00) America/Winnipeg"
  },
  {
    "value": "Pacific/Easter",
    "label": "(UTC-05:00) Pacific/Easter"
  },
  {
    "value": "America/Anguilla",
    "label": "(UTC-04:00) America/Anguilla"
  },
  {
    "value": "America/Antigua",
    "label": "(UTC-04:00) America/Antigua"
  },
  {
    "value": "America/Aruba",
    "label": "(UTC-04:00) America/Aruba"
  },
  {
    "value": "America/Barbados",
    "label": "(UTC-04:00) America/Barbados"
  },
  {
    "value": "America/Blanc-Sablon",
    "label": "(UTC-04:00) America/Blanc-Sablon"
  },
  {
    "value": "America/Boa_Vista",
    "label": "(UTC-04:00) America/Boa Vista"
  },
  {
    "value": "America/Campo_Grande",
    "label": "(UTC-04:00) America/Campo Grande"
  },
  {
    "value": "America/Caracas",
    "label": "(UTC-04:00) America/Caracas"
  },
  {
    "value": "America/Cuiaba",
    "label": "(UTC-04:00) America/Cuiaba"
  },
  {
    "value": "America/Curacao",
    "label": "(UTC-04:00) America/Curacao"
  },
  {
    "value": "America/Detroit",
    "label": "(UTC-04:00) America/Detroit"
  },
  {
    "value": "America/Dominica",
    "label": "(UTC-04:00) America/Dominica"
  },
  {
    "value": "America/Grand_Turk",
    "label": "(UTC-04:00) America/Grand Turk"
  },
  {
    "value": "America/Grenada",
    "label": "(UTC-04:00) America/Grenada"
  },
  {
    "value": "America/Guadeloupe",
    "label": "(UTC-04:00) America/Guadeloupe"
  },
  {
    "value": "America/Guyana",
    "label": "(UTC-04:00) America/Guyana"
  },
  {
    "value": "America/Havana",
    "label": "(UTC-04:00) America/Havana"
  },
  {
    "value": "America/Indiana/Marengo",
    "label": "(UTC-04:00) America/Indiana/Marengo"
  },
  {
    "value": "America/Indiana/Petersburg",
    "label": "(UTC-04:00) America/Indiana/Petersburg"
  },
  {
    "value": "America/Indiana/Vevay",
    "label": "(UTC-04:00) America/Indiana/Vevay"
  },
  {
    "value": "America/Indiana/Vincennes",
    "label": "(UTC-04:00) America/Indiana/Vincennes"
  },
  {
    "value": "America/Indiana/Winamac",
    "label": "(UTC-04:00) America/Indiana/Winamac"
  },
  {
    "value": "America/Indianapolis",
    "label": "(UTC-04:00) America/Indianapolis"
  },
  {
    "value": "America/Iqaluit",
    "label": "(UTC-04:00) America/Iqaluit"
  },
  {
    "value": "America/Kentucky/Monticello",
    "label": "(UTC-04:00) America/Kentucky/Monticello"
  },
  {
    "value": "America/Kralendijk",
    "label": "(UTC-04:00) America/Kralendijk"
  },
  {
    "value": "America/La_Paz",
    "label": "(UTC-04:00) America/La Paz"
  },
  {
    "value": "America/Louisville",
    "label": "(UTC-04:00) America/Louisville"
  },
  {
    "value": "America/Lower_Princes",
    "label": "(UTC-04:00) America/Lower Princes"
  },
  {
    "value": "America/Manaus",
    "label": "(UTC-04:00) America/Manaus"
  },
  {
    "value": "America/Marigot",
    "label": "(UTC-04:00) America/Marigot"
  },
  {
    "value": "America/Martinique",
    "label": "(UTC-04:00) America/Martinique"
  },
  {
    "value": "America/Montserrat",
    "label": "(UTC-04:00) America/Montserrat"
  },
  {
    "value": "America/Nassau",
    "label": "(UTC-04:00) America/Nassau"
  },
  {
    "value": "America/New_York",
    "label": "(UTC-04:00) America/New York"
  },
  {
    "value": "America/Port_of_Spain",
    "label": "(UTC-04:00) America/Port of Spain"
  },
  {
    "value": "America/Port-au-Prince",
    "label": "(UTC-04:00) America/Port-au-Prince"
  },
  {
    "value": "America/Porto_Velho",
    "label": "(UTC-04:00) America/Porto Velho"
  },
  {
    "value": "America/Puerto_Rico",
    "label": "(UTC-04:00) America/Puerto Rico"
  },
  {
    "value": "America/Santo_Domingo",
    "label": "(UTC-04:00) America/Santo Domingo"
  },
  {
    "value": "America/St_Barthelemy",
    "label": "(UTC-04:00) America/St Barthelemy"
  },
  {
    "value": "America/St_Kitts",
    "label": "(UTC-04:00) America/St Kitts"
  },
  {
    "value": "America/St_Lucia",
    "label": "(UTC-04:00) America/St Lucia"
  },
  {
    "value": "America/St_Thomas",
    "label": "(UTC-04:00) America/St Thomas"
  },
  {
    "value": "America/St_Vincent",
    "label": "(UTC-04:00) America/St Vincent"
  },
  {
    "value": "America/Toronto",
    "label": "(UTC-04:00) America/Toronto"
  },
  {
    "value": "America/Tortola",
    "label": "(UTC-04:00) America/Tortola"
  },
  {
    "value": "America/Araguaina",
    "label": "(UTC-03:00) America/Araguaina"
  },
  {
    "value": "America/Argentina/La_Rioja",
    "label": "(UTC-03:00) America/Argentina/La Rioja"
  },
  {
    "value": "America/Argentina/Rio_Gallegos",
    "label": "(UTC-03:00) America/Argentina/Rio Gallegos"
  },
  {
    "value": "America/Argentina/Salta",
    "label": "(UTC-03:00) America/Argentina/Salta"
  },
  {
    "value": "America/Argentina/San_Juan",
    "label": "(UTC-03:00) America/Argentina/San Juan"
  },
  {
    "value": "America/Argentina/San_Luis",
    "label": "(UTC-03:00) America/Argentina/San Luis"
  },
  {
    "value": "America/Argentina/Tucuman",
    "label": "(UTC-03:00) America/Argentina/Tucuman"
  },
  {
    "value": "America/Argentina/Ushuaia",
    "label": "(UTC-03:00) America/Argentina/Ushuaia"
  },
  {
    "value": "America/Asuncion",
    "label": "(UTC-03:00) America/Asuncion"
  },
  {
    "value": "America/Bahia",
    "label": "(UTC-03:00) America/Bahia"
  },
  {
    "value": "America/Belem",
    "label": "(UTC-03:00) America/Belem"
  },
  {
    "value": "America/Buenos_Aires",
    "label": "(UTC-03:00) America/Buenos Aires"
  },
  {
    "value": "America/Catamarca",
    "label": "(UTC-03:00) America/Catamarca"
  },
  {
    "value": "America/Cayenne",
    "label": "(UTC-03:00) America/Cayenne"
  },
  {
    "value": "America/Cordoba",
    "label": "(UTC-03:00) America/Cordoba"
  },
  {
    "value": "America/Coyhaique",
    "label": "(UTC-03:00) America/Coyhaique"
  },
  {
    "value": "America/Fortaleza",
    "label": "(UTC-03:00) America/Fortaleza"
  },
  {
    "value": "America/Glace_Bay",
    "label": "(UTC-03:00) America/Glace Bay"
  },
  {
    "value": "America/Goose_Bay",
    "label": "(UTC-03:00) America/Goose Bay"
  },
  {
    "value": "America/Halifax",
    "label": "(UTC-03:00) America/Halifax"
  },
  {
    "value": "America/Jujuy",
    "label": "(UTC-03:00) America/Jujuy"
  },
  {
    "value": "America/Maceio",
    "label": "(UTC-03:00) America/Maceio"
  },
  {
    "value": "America/Mendoza",
    "label": "(UTC-03:00) America/Mendoza"
  },
  {
    "value": "America/Moncton",
    "label": "(UTC-03:00) America/Moncton"
  },
  {
    "value": "America/Montevideo",
    "label": "(UTC-03:00) America/Montevideo"
  },
  {
    "value": "America/Paramaribo",
    "label": "(UTC-03:00) America/Paramaribo"
  },
  {
    "value": "America/Punta_Arenas",
    "label": "(UTC-03:00) America/Punta Arenas"
  },
  {
    "value": "America/Recife",
    "label": "(UTC-03:00) America/Recife"
  },
  {
    "value": "America/Santarem",
    "label": "(UTC-03:00) America/Santarem"
  },
  {
    "value": "America/Santiago",
    "label": "(UTC-03:00) America/Santiago"
  },
  {
    "value": "America/Sao_Paulo",
    "label": "(UTC-03:00) America/Sao Paulo"
  },
  {
    "value": "America/Thule",
    "label": "(UTC-03:00) America/Thule"
  },
  {
    "value": "Antarctica/Palmer",
    "label": "(UTC-03:00) Antarctica/Palmer"
  },
  {
    "value": "Antarctica/Rothera",
    "label": "(UTC-03:00) Antarctica/Rothera"
  },
  {
    "value": "Atlantic/Bermuda",
    "label": "(UTC-03:00) Atlantic/Bermuda"
  },
  {
    "value": "Atlantic/Stanley",
    "label": "(UTC-03:00) Atlantic/Stanley"
  },
  {
    "value": "America/St_Johns",
    "label": "(UTC-02:30) America/St Johns"
  },
  {
    "value": "America/Godthab",
    "label": "(UTC-02:00) America/Godthab"
  },
  {
    "value": "America/Miquelon",
    "label": "(UTC-02:00) America/Miquelon"
  },
  {
    "value": "America/Noronha",
    "label": "(UTC-02:00) America/Noronha"
  },
  {
    "value": "America/Scoresbysund",
    "label": "(UTC-02:00) America/Scoresbysund"
  },
  {
    "value": "Atlantic/South_Georgia",
    "label": "(UTC-02:00) Atlantic/South Georgia"
  },
  {
    "value": "Atlantic/Azores",
    "label": "(UTC-01:00) Atlantic/Azores"
  },
  {
    "value": "Atlantic/Cape_Verde",
    "label": "(UTC-01:00) Atlantic/Cape Verde"
  },
  {
    "value": "Africa/Abidjan",
    "label": "(UTC+00:00) Africa/Abidjan"
  },
  {
    "value": "Africa/Accra",
    "label": "(UTC+00:00) Africa/Accra"
  },
  {
    "value": "Africa/Bamako",
    "label": "(UTC+00:00) Africa/Bamako"
  },
  {
    "value": "Africa/Banjul",
    "label": "(UTC+00:00) Africa/Banjul"
  },
  {
    "value": "Africa/Bissau",
    "label": "(UTC+00:00) Africa/Bissau"
  },
  {
    "value": "Africa/Conakry",
    "label": "(UTC+00:00) Africa/Conakry"
  },
  {
    "value": "Africa/Dakar",
    "label": "(UTC+00:00) Africa/Dakar"
  },
  {
    "value": "Africa/Freetown",
    "label": "(UTC+00:00) Africa/Freetown"
  },
  {
    "value": "Africa/Lome",
    "label": "(UTC+00:00) Africa/Lome"
  },
  {
    "value": "Africa/Monrovia",
    "label": "(UTC+00:00) Africa/Monrovia"
  },
  {
    "value": "Africa/Nouakchott",
    "label": "(UTC+00:00) Africa/Nouakchott"
  },
  {
    "value": "Africa/Ouagadougou",
    "label": "(UTC+00:00) Africa/Ouagadougou"
  },
  {
    "value": "Africa/Sao_Tome",
    "label": "(UTC+00:00) Africa/Sao Tome"
  },
  {
    "value": "America/Danmarkshavn",
    "label": "(UTC+00:00) America/Danmarkshavn"
  },
  {
    "value": "Antarctica/Troll",
    "label": "(UTC+00:00) Antarctica/Troll"
  },
  {
    "value": "Atlantic/Canary",
    "label": "(UTC+00:00) Atlantic/Canary"
  },
  {
    "value": "Atlantic/Faeroe",
    "label": "(UTC+00:00) Atlantic/Faeroe"
  },
  {
    "value": "Atlantic/Madeira",
    "label": "(UTC+00:00) Atlantic/Madeira"
  },
  {
    "value": "Atlantic/Reykjavik",
    "label": "(UTC+00:00) Atlantic/Reykjavik"
  },
  {
    "value": "Atlantic/St_Helena",
    "label": "(UTC+00:00) Atlantic/St Helena"
  },
  {
    "value": "Europe/Dublin",
    "label": "(UTC+00:00) Europe/Dublin"
  },
  {
    "value": "Europe/Guernsey",
    "label": "(UTC+00:00) Europe/Guernsey"
  },
  {
    "value": "Europe/Isle_of_Man",
    "label": "(UTC+00:00) Europe/Isle of Man"
  },
  {
    "value": "Europe/Jersey",
    "label": "(UTC+00:00) Europe/Jersey"
  },
  {
    "value": "Europe/Lisbon",
    "label": "(UTC+00:00) Europe/Lisbon"
  },
  {
    "value": "Europe/London",
    "label": "(UTC+00:00) Europe/London"
  },
  {
    "value": "Africa/Algiers",
    "label": "(UTC+01:00) Africa/Algiers"
  },
  {
    "value": "Africa/Bangui",
    "label": "(UTC+01:00) Africa/Bangui"
  },
  {
    "value": "Africa/Brazzaville",
    "label": "(UTC+01:00) Africa/Brazzaville"
  },
  {
    "value": "Africa/Casablanca",
    "label": "(UTC+01:00) Africa/Casablanca"
  },
  {
    "value": "Africa/Ceuta",
    "label": "(UTC+01:00) Africa/Ceuta"
  },
  {
    "value": "Africa/Douala",
    "label": "(UTC+01:00) Africa/Douala"
  },
  {
    "value": "Africa/El_Aaiun",
    "label": "(UTC+01:00) Africa/El Aaiun"
  },
  {
    "value": "Africa/Kinshasa",
    "label": "(UTC+01:00) Africa/Kinshasa"
  },
  {
    "value": "Africa/Lagos",
    "label": "(UTC+01:00) Africa/Lagos"
  },
  {
    "value": "Africa/Libreville",
    "label": "(UTC+01:00) Africa/Libreville"
  },
  {
    "value": "Africa/Luanda",
    "label": "(UTC+01:00) Africa/Luanda"
  },
  {
    "value": "Africa/Malabo",
    "label": "(UTC+01:00) Africa/Malabo"
  },
  {
    "value": "Africa/Ndjamena",
    "label": "(UTC+01:00) Africa/Ndjamena"
  },
  {
    "value": "Africa/Niamey",
    "label": "(UTC+01:00) Africa/Niamey"
  },
  {
    "value": "Africa/Porto-Novo",
    "label": "(UTC+01:00) Africa/Porto-Novo"
  },
  {
    "value": "Africa/Tunis",
    "label": "(UTC+01:00) Africa/Tunis"
  },
  {
    "value": "Arctic/Longyearbyen",
    "label": "(UTC+01:00) Arctic/Longyearbyen"
  },
  {
    "value": "Europe/Amsterdam",
    "label": "(UTC+01:00) Europe/Amsterdam"
  },
  {
    "value": "Europe/Andorra",
    "label": "(UTC+01:00) Europe/Andorra"
  },
  {
    "value": "Europe/Belgrade",
    "label": "(UTC+01:00) Europe/Belgrade"
  },
  {
    "value": "Europe/Berlin",
    "label": "(UTC+01:00) Europe/Berlin"
  },
  {
    "value": "Europe/Bratislava",
    "label": "(UTC+01:00) Europe/Bratislava"
  },
  {
    "value": "Europe/Brussels",
    "label": "(UTC+01:00) Europe/Brussels"
  },
  {
    "value": "Europe/Budapest",
    "label": "(UTC+01:00) Europe/Budapest"
  },
  {
    "value": "Europe/Busingen",
    "label": "(UTC+01:00) Europe/Busingen"
  },
  {
    "value": "Europe/Copenhagen",
    "label": "(UTC+01:00) Europe/Copenhagen"
  },
  {
    "value": "Europe/Gibraltar",
    "label": "(UTC+01:00) Europe/Gibraltar"
  },
  {
    "value": "Europe/Ljubljana",
    "label": "(UTC+01:00) Europe/Ljubljana"
  },
  {
    "value": "Europe/Luxembourg",
    "label": "(UTC+01:00) Europe/Luxembourg"
  },
  {
    "value": "Europe/Madrid",
    "label": "(UTC+01:00) Europe/Madrid"
  },
  {
    "value": "Europe/Malta",
    "label": "(UTC+01:00) Europe/Malta"
  },
  {
    "value": "Europe/Monaco",
    "label": "(UTC+01:00) Europe/Monaco"
  },
  {
    "value": "Europe/Oslo",
    "label": "(UTC+01:00) Europe/Oslo"
  },
  {
    "value": "Europe/Paris",
    "label": "(UTC+01:00) Europe/Paris"
  },
  {
    "value": "Europe/Podgorica",
    "label": "(UTC+01:00) Europe/Podgorica"
  },
  {
    "value": "Europe/Prague",
    "label": "(UTC+01:00) Europe/Prague"
  },
  {
    "value": "Europe/Rome",
    "label": "(UTC+01:00) Europe/Rome"
  },
  {
    "value": "Europe/San_Marino",
    "label": "(UTC+01:00) Europe/San Marino"
  },
  {
    "value": "Europe/Sarajevo",
    "label": "(UTC+01:00) Europe/Sarajevo"
  },
  {
    "value": "Europe/Skopje",
    "label": "(UTC+01:00) Europe/Skopje"
  },
  {
    "value": "Europe/Stockholm",
    "label": "(UTC+01:00) Europe/Stockholm"
  },
  {
    "value": "Europe/Tirane",
    "label": "(UTC+01:00) Europe/Tirane"
  },
  {
    "value": "Europe/Vaduz",
    "label": "(UTC+01:00) Europe/Vaduz"
  },
  {
    "value": "Europe/Vatican",
    "label": "(UTC+01:00) Europe/Vatican"
  },
  {
    "value": "Europe/Vienna",
    "label": "(UTC+01:00) Europe/Vienna"
  },
  {
    "value": "Europe/Warsaw",
    "label": "(UTC+01:00) Europe/Warsaw"
  },
  {
    "value": "Europe/Zagreb",
    "label": "(UTC+01:00) Europe/Zagreb"
  },
  {
    "value": "Europe/Zurich",
    "label": "(UTC+01:00) Europe/Zurich"
  },
  {
    "value": "Africa/Blantyre",
    "label": "(UTC+02:00) Africa/Blantyre"
  },
  {
    "value": "Africa/Bujumbura",
    "label": "(UTC+02:00) Africa/Bujumbura"
  },
  {
    "value": "Africa/Cairo",
    "label": "(UTC+02:00) Africa/Cairo"
  },
  {
    "value": "Africa/Gaborone",
    "label": "(UTC+02:00) Africa/Gaborone"
  },
  {
    "value": "Africa/Harare",
    "label": "(UTC+02:00) Africa/Harare"
  },
  {
    "value": "Africa/Johannesburg",
    "label": "(UTC+02:00) Africa/Johannesburg"
  },
  {
    "value": "Africa/Juba",
    "label": "(UTC+02:00) Africa/Juba"
  },
  {
    "value": "Africa/Khartoum",
    "label": "(UTC+02:00) Africa/Khartoum"
  },
  {
    "value": "Africa/Kigali",
    "label": "(UTC+02:00) Africa/Kigali"
  },
  {
    "value": "Africa/Lubumbashi",
    "label": "(UTC+02:00) Africa/Lubumbashi"
  },
  {
    "value": "Africa/Lusaka",
    "label": "(UTC+02:00) Africa/Lusaka"
  },
  {
    "value": "Africa/Maputo",
    "label": "(UTC+02:00) Africa/Maputo"
  },
  {
    "value": "Africa/Maseru",
    "label": "(UTC+02:00) Africa/Maseru"
  },
  {
    "value": "Africa/Mbabane",
    "label": "(UTC+02:00) Africa/Mbabane"
  },
  {
    "value": "Africa/Tripoli",
    "label": "(UTC+02:00) Africa/Tripoli"
  },
  {
    "value": "Africa/Windhoek",
    "label": "(UTC+02:00) Africa/Windhoek"
  },
  {
    "value": "Asia/Beirut",
    "label": "(UTC+02:00) Asia/Beirut"
  },
  {
    "value": "Asia/Famagusta",
    "label": "(UTC+02:00) Asia/Famagusta"
  },
  {
    "value": "Asia/Gaza",
    "label": "(UTC+02:00) Asia/Gaza"
  },
  {
    "value": "Asia/Hebron",
    "label": "(UTC+02:00) Asia/Hebron"
  },
  {
    "value": "Asia/Jerusalem",
    "label": "(UTC+02:00) Asia/Jerusalem"
  },
  {
    "value": "Asia/Nicosia",
    "label": "(UTC+02:00) Asia/Nicosia"
  },
  {
    "value": "Europe/Athens",
    "label": "(UTC+02:00) Europe/Athens"
  },
  {
    "value": "Europe/Bucharest",
    "label": "(UTC+02:00) Europe/Bucharest"
  },
  {
    "value": "Europe/Chisinau",
    "label": "(UTC+02:00) Europe/Chisinau"
  },
  {
    "value": "Europe/Helsinki",
    "label": "(UTC+02:00) Europe/Helsinki"
  },
  {
    "value": "Europe/Kaliningrad",
    "label": "(UTC+02:00) Europe/Kaliningrad"
  },
  {
    "value": "Europe/Kiev",
    "label": "(UTC+02:00) Europe/Kiev"
  },
  {
    "value": "Europe/Mariehamn",
    "label": "(UTC+02:00) Europe/Mariehamn"
  },
  {
    "value": "Europe/Riga",
    "label": "(UTC+02:00) Europe/Riga"
  },
  {
    "value": "Europe/Sofia",
    "label": "(UTC+02:00) Europe/Sofia"
  },
  {
    "value": "Europe/Tallinn",
    "label": "(UTC+02:00) Europe/Tallinn"
  },
  {
    "value": "Europe/Vilnius",
    "label": "(UTC+02:00) Europe/Vilnius"
  },
  {
    "value": "Africa/Addis_Ababa",
    "label": "(UTC+03:00) Africa/Addis Ababa"
  },
  {
    "value": "Africa/Asmera",
    "label": "(UTC+03:00) Africa/Asmera"
  },
  {
    "value": "Africa/Dar_es_Salaam",
    "label": "(UTC+03:00) Africa/Dar es Salaam"
  },
  {
    "value": "Africa/Djibouti",
    "label": "(UTC+03:00) Africa/Djibouti"
  },
  {
    "value": "Africa/Kampala",
    "label": "(UTC+03:00) Africa/Kampala"
  },
  {
    "value": "Africa/Mogadishu",
    "label": "(UTC+03:00) Africa/Mogadishu"
  },
  {
    "value": "Africa/Nairobi",
    "label": "(UTC+03:00) Africa/Nairobi"
  },
  {
    "value": "Antarctica/Syowa",
    "label": "(UTC+03:00) Antarctica/Syowa"
  },
  {
    "value": "Asia/Aden",
    "label": "(UTC+03:00) Asia/Aden"
  },
  {
    "value": "Asia/Amman",
    "label": "(UTC+03:00) Asia/Amman"
  },
  {
    "value": "Asia/Baghdad",
    "label": "(UTC+03:00) Asia/Baghdad"
  },
  {
    "value": "Asia/Bahrain",
    "label": "(UTC+03:00) Asia/Bahrain"
  },
  {
    "value": "Asia/Damascus",
    "label": "(UTC+03:00) Asia/Damascus"
  },
  {
    "value": "Asia/Kuwait",
    "label": "(UTC+03:00) Asia/Kuwait"
  },
  {
    "value": "Asia/Qatar",
    "label": "(UTC+03:00) Asia/Qatar"
  },
  {
    "value": "Asia/Riyadh",
    "label": "(UTC+03:00) Asia/Riyadh"
  },
  {
    "value": "Europe/Istanbul",
    "label": "(UTC+03:00) Europe/Istanbul"
  },
  {
    "value": "Europe/Kirov",
    "label": "(UTC+03:00) Europe/Kirov"
  },
  {
    "value": "Europe/Minsk",
    "label": "(UTC+03:00) Europe/Minsk"
  },
  {
    "value": "Europe/Moscow",
    "label": "(UTC+03:00) Europe/Moscow"
  },
  {
    "value": "Europe/Simferopol",
    "label": "(UTC+03:00) Europe/Simferopol"
  },
  {
    "value": "Europe/Volgograd",
    "label": "(UTC+03:00) Europe/Volgograd"
  },
  {
    "value": "Indian/Antananarivo",
    "label": "(UTC+03:00) Indian/Antananarivo"
  },
  {
    "value": "Indian/Comoro",
    "label": "(UTC+03:00) Indian/Comoro"
  },
  {
    "value": "Indian/Mayotte",
    "label": "(UTC+03:00) Indian/Mayotte"
  },
  {
    "value": "Asia/Tehran",
    "label": "(UTC+03:30) Asia/Tehran"
  },
  {
    "value": "Asia/Baku",
    "label": "(UTC+04:00) Asia/Baku"
  },
  {
    "value": "Asia/Dubai",
    "label": "(UTC+04:00) Asia/Dubai"
  },
  {
    "value": "Asia/Muscat",
    "label": "(UTC+04:00) Asia/Muscat"
  },
  {
    "value": "Asia/Tbilisi",
    "label": "(UTC+04:00) Asia/Tbilisi"
  },
  {
    "value": "Asia/Yerevan",
    "label": "(UTC+04:00) Asia/Yerevan"
  },
  {
    "value": "Europe/Astrakhan",
    "label": "(UTC+04:00) Europe/Astrakhan"
  },
  {
    "value": "Europe/Samara",
    "label": "(UTC+04:00) Europe/Samara"
  },
  {
    "value": "Europe/Saratov",
    "label": "(UTC+04:00) Europe/Saratov"
  },
  {
    "value": "Europe/Ulyanovsk",
    "label": "(UTC+04:00) Europe/Ulyanovsk"
  },
  {
    "value": "Indian/Mahe",
    "label": "(UTC+04:00) Indian/Mahe"
  },
  {
    "value": "Indian/Mauritius",
    "label": "(UTC+04:00) Indian/Mauritius"
  },
  {
    "value": "Indian/Reunion",
    "label": "(UTC+04:00) Indian/Reunion"
  },
  {
    "value": "Asia/Kabul",
    "label": "(UTC+04:30) Asia/Kabul"
  },
  {
    "value": "Antarctica/Mawson",
    "label": "(UTC+05:00) Antarctica/Mawson"
  },
  {
    "value": "Antarctica/Vostok",
    "label": "(UTC+05:00) Antarctica/Vostok"
  },
  {
    "value": "Asia/Almaty",
    "label": "(UTC+05:00) Asia/Almaty"
  },
  {
    "value": "Asia/Aqtau",
    "label": "(UTC+05:00) Asia/Aqtau"
  },
  {
    "value": "Asia/Aqtobe",
    "label": "(UTC+05:00) Asia/Aqtobe"
  },
  {
    "value": "Asia/Ashgabat",
    "label": "(UTC+05:00) Asia/Ashgabat"
  },
  {
    "value": "Asia/Atyrau",
    "label": "(UTC+05:00) Asia/Atyrau"
  },
  {
    "value": "Asia/Dushanbe",
    "label": "(UTC+05:00) Asia/Dushanbe"
  },
  {
    "value": "Asia/Karachi",
    "label": "(UTC+05:00) Asia/Karachi"
  },
  {
    "value": "Asia/Oral",
    "label": "(UTC+05:00) Asia/Oral"
  },
  {
    "value": "Asia/Qostanay",
    "label": "(UTC+05:00) Asia/Qostanay"
  },
  {
    "value": "Asia/Qyzylorda",
    "label": "(UTC+05:00) Asia/Qyzylorda"
  },
  {
    "value": "Asia/Samarkand",
    "label": "(UTC+05:00) Asia/Samarkand"
  },
  {
    "value": "Asia/Tashkent",
    "label": "(UTC+05:00) Asia/Tashkent"
  },
  {
    "value": "Asia/Yekaterinburg",
    "label": "(UTC+05:00) Asia/Yekaterinburg"
  },
  {
    "value": "Indian/Kerguelen",
    "label": "(UTC+05:00) Indian/Kerguelen"
  },
  {
    "value": "Indian/Maldives",
    "label": "(UTC+05:00) Indian/Maldives"
  },
  {
    "value": "Asia/Calcutta",
    "label": "(UTC+05:30) Asia/Calcutta"
  },
  {
    "value": "Asia/Colombo",
    "label": "(UTC+05:30) Asia/Colombo"
  },
  {
    "value": "Asia/Katmandu",
    "label": "(UTC+05:45) Asia/Katmandu"
  },
  {
    "value": "Asia/Bishkek",
    "label": "(UTC+06:00) Asia/Bishkek"
  },
  {
    "value": "Asia/Dhaka",
    "label": "(UTC+06:00) Asia/Dhaka"
  },
  {
    "value": "Asia/Omsk",
    "label": "(UTC+06:00) Asia/Omsk"
  },
  {
    "value": "Asia/Thimphu",
    "label": "(UTC+06:00) Asia/Thimphu"
  },
  {
    "value": "Asia/Urumqi",
    "label": "(UTC+06:00) Asia/Urumqi"
  },
  {
    "value": "Indian/Chagos",
    "label": "(UTC+06:00) Indian/Chagos"
  },
  {
    "value": "Asia/Rangoon",
    "label": "(UTC+06:30) Asia/Rangoon"
  },
  {
    "value": "Indian/Cocos",
    "label": "(UTC+06:30) Indian/Cocos"
  },
  {
    "value": "Antarctica/Davis",
    "label": "(UTC+07:00) Antarctica/Davis"
  },
  {
    "value": "Asia/Bangkok",
    "label": "(UTC+07:00) Asia/Bangkok"
  },
  {
    "value": "Asia/Barnaul",
    "label": "(UTC+07:00) Asia/Barnaul"
  },
  {
    "value": "Asia/Hovd",
    "label": "(UTC+07:00) Asia/Hovd"
  },
  {
    "value": "Asia/Jakarta",
    "label": "(UTC+07:00) Asia/Jakarta"
  },
  {
    "value": "Asia/Krasnoyarsk",
    "label": "(UTC+07:00) Asia/Krasnoyarsk"
  },
  {
    "value": "Asia/Novokuznetsk",
    "label": "(UTC+07:00) Asia/Novokuznetsk"
  },
  {
    "value": "Asia/Novosibirsk",
    "label": "(UTC+07:00) Asia/Novosibirsk"
  },
  {
    "value": "Asia/Phnom_Penh",
    "label": "(UTC+07:00) Asia/Phnom Penh"
  },
  {
    "value": "Asia/Pontianak",
    "label": "(UTC+07:00) Asia/Pontianak"
  },
  {
    "value": "Asia/Saigon",
    "label": "(UTC+07:00) Asia/Saigon"
  },
  {
    "value": "Asia/Tomsk",
    "label": "(UTC+07:00) Asia/Tomsk"
  },
  {
    "value": "Asia/Vientiane",
    "label": "(UTC+07:00) Asia/Vientiane"
  },
  {
    "value": "Indian/Christmas",
    "label": "(UTC+07:00) Indian/Christmas"
  },
  {
    "value": "Antarctica/Casey",
    "label": "(UTC+08:00) Antarctica/Casey"
  },
  {
    "value": "Asia/Brunei",
    "label": "(UTC+08:00) Asia/Brunei"
  },
  {
    "value": "Asia/Hong_Kong",
    "label": "(UTC+08:00) Asia/Hong Kong"
  },
  {
    "value": "Asia/Irkutsk",
    "label": "(UTC+08:00) Asia/Irkutsk"
  },
  {
    "value": "Asia/Kuala_Lumpur",
    "label": "(UTC+08:00) Asia/Kuala Lumpur"
  },
  {
    "value": "Asia/Kuching",
    "label": "(UTC+08:00) Asia/Kuching"
  },
  {
    "value": "Asia/Macau",
    "label": "(UTC+08:00) Asia/Macau"
  },
  {
    "value": "Asia/Makassar",
    "label": "(UTC+08:00) Asia/Makassar"
  },
  {
    "value": "Asia/Manila",
    "label": "(UTC+08:00) Asia/Manila"
  },
  {
    "value": "Asia/Shanghai",
    "label": "(UTC+08:00) Asia/Shanghai"
  },
  {
    "value": "Asia/Singapore",
    "label": "(UTC+08:00) Asia/Singapore"
  },
  {
    "value": "Asia/Taipei",
    "label": "(UTC+08:00) Asia/Taipei"
  },
  {
    "value": "Asia/Ulaanbaatar",
    "label": "(UTC+08:00) Asia/Ulaanbaatar"
  },
  {
    "value": "Australia/Perth",
    "label": "(UTC+08:00) Australia/Perth"
  },
  {
    "value": "Australia/Eucla",
    "label": "(UTC+08:45) Australia/Eucla"
  },
  {
    "value": "Asia/Chita",
    "label": "(UTC+09:00) Asia/Chita"
  },
  {
    "value": "Asia/Dili",
    "label": "(UTC+09:00) Asia/Dili"
  },
  {
    "value": "Asia/Jayapura",
    "label": "(UTC+09:00) Asia/Jayapura"
  },
  {
    "value": "Asia/Khandyga",
    "label": "(UTC+09:00) Asia/Khandyga"
  },
  {
    "value": "Asia/Pyongyang",
    "label": "(UTC+09:00) Asia/Pyongyang"
  },
  {
    "value": "Asia/Seoul",
    "label": "(UTC+09:00) Asia/Seoul"
  },
  {
    "value": "Asia/Tokyo",
    "label": "(UTC+09:00) Asia/Tokyo"
  },
  {
    "value": "Asia/Yakutsk",
    "label": "(UTC+09:00) Asia/Yakutsk"
  },
  {
    "value": "Pacific/Palau",
    "label": "(UTC+09:00) Pacific/Palau"
  },
  {
    "value": "Australia/Darwin",
    "label": "(UTC+09:30) Australia/Darwin"
  },
  {
    "value": "Antarctica/DumontDUrville",
    "label": "(UTC+10:00) Antarctica/DumontDUrville"
  },
  {
    "value": "Asia/Ust-Nera",
    "label": "(UTC+10:00) Asia/Ust-Nera"
  },
  {
    "value": "Asia/Vladivostok",
    "label": "(UTC+10:00) Asia/Vladivostok"
  },
  {
    "value": "Australia/Brisbane",
    "label": "(UTC+10:00) Australia/Brisbane"
  },
  {
    "value": "Australia/Lindeman",
    "label": "(UTC+10:00) Australia/Lindeman"
  },
  {
    "value": "Pacific/Guam",
    "label": "(UTC+10:00) Pacific/Guam"
  },
  {
    "value": "Pacific/Port_Moresby",
    "label": "(UTC+10:00) Pacific/Port Moresby"
  },
  {
    "value": "Pacific/Saipan",
    "label": "(UTC+10:00) Pacific/Saipan"
  },
  {
    "value": "Pacific/Truk",
    "label": "(UTC+10:00) Pacific/Truk"
  },
  {
    "value": "Australia/Adelaide",
    "label": "(UTC+10:30) Australia/Adelaide"
  },
  {
    "value": "Australia/Broken_Hill",
    "label": "(UTC+10:30) Australia/Broken Hill"
  },
  {
    "value": "Antarctica/Macquarie",
    "label": "(UTC+11:00) Antarctica/Macquarie"
  },
  {
    "value": "Asia/Magadan",
    "label": "(UTC+11:00) Asia/Magadan"
  },
  {
    "value": "Asia/Sakhalin",
    "label": "(UTC+11:00) Asia/Sakhalin"
  },
  {
    "value": "Asia/Srednekolymsk",
    "label": "(UTC+11:00) Asia/Srednekolymsk"
  },
  {
    "value": "Australia/Hobart",
    "label": "(UTC+11:00) Australia/Hobart"
  },
  {
    "value": "Australia/Lord_Howe",
    "label": "(UTC+11:00) Australia/Lord Howe"
  },
  {
    "value": "Australia/Melbourne",
    "label": "(UTC+11:00) Australia/Melbourne"
  },
  {
    "value": "Australia/Sydney",
    "label": "(UTC+11:00) Australia/Sydney"
  },
  {
    "value": "Pacific/Bougainville",
    "label": "(UTC+11:00) Pacific/Bougainville"
  },
  {
    "value": "Pacific/Efate",
    "label": "(UTC+11:00) Pacific/Efate"
  },
  {
    "value": "Pacific/Guadalcanal",
    "label": "(UTC+11:00) Pacific/Guadalcanal"
  },
  {
    "value": "Pacific/Kosrae",
    "label": "(UTC+11:00) Pacific/Kosrae"
  },
  {
    "value": "Pacific/Noumea",
    "label": "(UTC+11:00) Pacific/Noumea"
  },
  {
    "value": "Pacific/Ponape",
    "label": "(UTC+11:00) Pacific/Ponape"
  },
  {
    "value": "Asia/Anadyr",
    "label": "(UTC+12:00) Asia/Anadyr"
  },
  {
    "value": "Asia/Kamchatka",
    "label": "(UTC+12:00) Asia/Kamchatka"
  },
  {
    "value": "Pacific/Fiji",
    "label": "(UTC+12:00) Pacific/Fiji"
  },
  {
    "value": "Pacific/Funafuti",
    "label": "(UTC+12:00) Pacific/Funafuti"
  },
  {
    "value": "Pacific/Kwajalein",
    "label": "(UTC+12:00) Pacific/Kwajalein"
  },
  {
    "value": "Pacific/Majuro",
    "label": "(UTC+12:00) Pacific/Majuro"
  },
  {
    "value": "Pacific/Nauru",
    "label": "(UTC+12:00) Pacific/Nauru"
  },
  {
    "value": "Pacific/Norfolk",
    "label": "(UTC+12:00) Pacific/Norfolk"
  },
  {
    "value": "Pacific/Tarawa",
    "label": "(UTC+12:00) Pacific/Tarawa"
  },
  {
    "value": "Pacific/Wake",
    "label": "(UTC+12:00) Pacific/Wake"
  },
  {
    "value": "Pacific/Wallis",
    "label": "(UTC+12:00) Pacific/Wallis"
  },
  {
    "value": "Antarctica/McMurdo",
    "label": "(UTC+13:00) Antarctica/McMurdo"
  },
  {
    "value": "Pacific/Apia",
    "label": "(UTC+13:00) Pacific/Apia"
  },
  {
    "value": "Pacific/Auckland",
    "label": "(UTC+13:00) Pacific/Auckland"
  },
  {
    "value": "Pacific/Enderbury",
    "label": "(UTC+13:00) Pacific/Enderbury"
  },
  {
    "value": "Pacific/Fakaofo",
    "label": "(UTC+13:00) Pacific/Fakaofo"
  },
  {
    "value": "Pacific/Tongatapu",
    "label": "(UTC+13:00) Pacific/Tongatapu"
  },
  {
    "value": "Pacific/Chatham",
    "label": "(UTC+13:45) Pacific/Chatham"
  },
  {
    "value": "Pacific/Kiritimati",
    "label": "(UTC+14:00) Pacific/Kiritimati"
  }
];

export const TIMEZONE_GROUPS = [
  {
    group: "Popular Time Zones",
    options: COMMON_TIMEZONES
  },
  {
    group: "All World Time Zones (By UTC Offset)",
    options: ALL_TIMEZONES
  }
];

export const TIMEZONE_OPTIONS: TimezoneOption[] = [
  ...COMMON_TIMEZONES,
  ...ALL_TIMEZONES.filter(tz => !COMMON_TIMEZONES.some(c => c.value === tz.value))
];

export default ALL_TIMEZONES;
