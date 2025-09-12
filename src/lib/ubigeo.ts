
export const provinces = [
  "Amazonas", "Ancash", "Apurimac", "Arequipa", "Ayacucho", "Cajamarca",
  "Callao", "Cusco", "Huancavelica", "Huanuco", "Ica", "Junin",
  "La Libertad", "Lambayeque", "Lima", "Loreto", "Madre de Dios",
  "Moquegua", "Pasco", "Piura", "Puno", "San Martin", "Tacna",
  "Tumbes", "Ucayali"
];

const districtsByProvince: Record<string, string[]> = {
  "Lima": [
    "Ancón", "Ate", "Barranco", "Breña", "Carabayllo", "Chaclacayo", "Chorrillos",
    "Cieneguilla", "Comas", "El Agustino", "Independencia", "Jesús María", "La Molina",
    "La Victoria", "Lima", "Lince", "Los Olivos", "Lurigancho", "Lurín",
    "Magdalena del Mar", "Miraflores", "Pachacámac", "Pucusana", "Pueblo Libre",
    "Puente Piedra", "Punta Hermosa", "Punta Negra", "Rímac", "San Bartolo",
    "San Borja", "San Isidro", "San Juan de Lurigancho", "San Juan de Miraflores",
    "San Luis", "San Martín de Porres", "San Miguel", "Santa Anita",
    "Santa María del Mar", "Santa Rosa", "Santiago de Surco", "Surquillo", "Villa El Salvador",
    "Villa María del Triunfo"
  ],
  "Arequipa": [
    "Arequipa", "Alto Selva Alegre", "Cayma", "Cerro Colorado", "Characato", "Chiguata",
    "Jacobo Hunter", "José Luis Bustamante y Rivero", "La Joya", "Mariano Melgar",
    "Miraflores", "Mollebaya", "Paucarpata", "Pocsi", "Polobaya", "Quequeña",
    "Sabandía", "Sachaca", "San Juan de Siguas", "San Juan de Tarucani", "Santa Isabel de Siguas",
    "Santa Rita de Siguas", "Socabaya", "Tiabaya", "Uchumayo", "Vítor", "Yanahuara", "Yarabamba", "Yura"
  ],
  "Callao": [
    "Callao", "Bellavista", "Carmen de la Legua Reynoso", "La Perla", "La Punta", "Ventanilla", "Mi Perú"
  ],
  "Cusco": [
    "Cusco", "Ccorca", "Poroy", "San Jerónimo", "San Sebastián", "Santiago", "Saylla", "Wanchaq"
  ],
  "La Libertad": [
    "Trujillo", "El Porvenir", "Florencia de Mora", "Huanchaco", "La Esperanza", "Laredo",
    "Moche", "Poroto", "Salaverry", "Simbal", "Víctor Larco Herrera"
  ],
  "Amazonas": ["Chachapoyas", "Asunción", "Balsas", "Cheto", "Chiliquín", "Chuquibamba", "Granada", "Huancas", "La Jalca", "Leimebamba", "Levanto", "Magdalena", "Mariscal Castilla", "Molinopampa", "Montevideo", "Olleros", "Quinjalca", "San Francisco de Daguas", "San Isidro de Maino", "Soloco", "Sonche"],
  "Ancash": ["Huaraz", "Cochabamba", "Colcabamba", "Huanchay", "Independencia", "Jangas", "La Libertad", "Olleros", "Pampas Grande", "Pariacoto", "Pira", "Tarica"],
  "Apurimac": ["Abancay", "Chacoche", "Circa", "Curahuasi", "Huanipaca", "Lambrama", "Pichirhua", "San Pedro de Cachora", "Tamburco"],
  "Ayacucho": ["Huamanga", "Acocro", "Acos Vinchos", "Carmen Alto", "Chiara", "Jesús Nazareno", "Ocros", "Pacaycasa", "Quinua", "San José de Ticllas", "San Juan Bautista", "Santiago de Pischa", "Socos", "Tambillo", "Vinchos"],
  "Cajamarca": ["Cajamarca", "Asunción", "Chetilla", "Cospán", "Encañada", "Jesús", "Llacanora", "Los Baños del Inca", "Magdalena", "Matara", "Namora", "San Juan"],
  "Huancavelica": ["Huancavelica", "Acobambilla", "Acoria", "Conayca", "Cuenca", "Huachocolpa", "Huayllahuara", "Izcuchaca", "Laria", "Manta", "Mariscal Cáceres", "Moya", "Nuevo Occoro", "Palca", "Pilchaca", "Vilca", "Yauli"],
  "Huanuco": ["Huanuco", "Amarilis", "Chinchao", "Churubamba", "Margos", "Pillco Marca", "Quisqui", "San Francisco de Cayrán", "San Pedro de Chaulán", "Santa María del Valle", "Yarumayo"],
  "Ica": ["Ica", "La Tinguiña", "Los Aquijes", "Ocucaje", "Pachacutec", "Parcona", "Pueblo Nuevo", "Salas", "San José de los Molinos", "San Juan Bautista", "Santiago", "Subtanjalla", "Tate", "Yauca del Rosario"],
  "Junin": ["Huancayo", "Carhuacallanga", "Chacapampa", "Chicche", "Chilca", "Chongos Alto", "Chupuro", "Colca", "Cullhuas", "El Tambo", "Huacrapuquio", "Hualhuas", "Huancán", "Huasicancha", "Huayucachi", "Ingenio", "Pariahuanca", "Pilcomayo", "Pucará", "Quichuay", "Quilcas", "San Agustín de Cajas", "San Jerónimo de Tunán", "San Pedro de Saño", "Santo Domingo de Acobamba", "Sapallanga", "Sicaya", "Viques"],
  "Lambayeque": ["Chiclayo", "Chongoyape", "Eten", "Eten Puerto", "José Leonardo Ortiz", "La Victoria", "Lagunas", "Monsefú", "Nueva Arica", "Oyotún", "Picsi", "Pimentel", "Pomalca", "Pucalá", "Reque", "Santa Rosa", "Saña", "Cayaltí", "Patapo", "Túman"],
  "Loreto": ["Maynas", "Alto Nanay", "Belén", "Fernando Lores", "Indiana", "Iquitos", "Las Amazonas", "Mazan", "Napo", "Punchana", "Putumayo", "Torres Causana", "San Juan Bautista"],
  "Madre de Dios": ["Tambopata", "Inambari", "Las Piedras", "Laberinto"],
  "Moquegua": ["Mariscal Nieto", "Carumas", "Cuchumbaya", "Moquegua", "Samegua", "San Cristóbal", "Torata"],
  "Pasco": ["Pasco", "Chaupimarca", "Huachón", "Huariaca", "Huayllay", "Ninacaca", "Pallanchacra", "Paucartambo", "San Francisco de Asís de Yarusyacán", "Simón Bolívar", "Ticlacayán", "Tinyahuarco", "Vicco", "Yanacancha"],
  "Piura": ["Piura", "Castilla", "Catacaos", "Cura Mori", "El Tallán", "La Arena", "La Unión", "Las Lomas", "Tambo Grande", "Veintiséis de Octubre"],
  "Puno": ["Puno", "Acora", "Amantaní", "Atuncolla", "Capachica", "Chucuito", "Coata", "Huata", "Mañazo", "Paucarcolla", "Pichacani", "Platería", "San Antonio", "Tiquillaca", "Vilque"],
  "San Martin": ["Moyobamba", "Calzada", "Habana", "Jepelacio", "Soritor", "Yantaló"],
  "Tacna": ["Tacna", "Alto de la Alianza", "Calana", "Ciudad Nueva", "Coronel Gregorio Albarracín Lanchipa", "Inclán", "Pachía", "Palca", "Pocollay", "Sama", "La Yarada los Palos"],
  "Tumbes": ["Tumbes", "Corrales", "La Cruz", "Pampas de Hospital", "San Jacinto", "San Juan de la Virgen"],
  "Ucayali": ["Coronel Portillo", "Callería", "Campoverde", "Iparía", "Masisea", "Yarinacocha", "Nueva Requena", "Manantay"],
};

export const getDistrictsByProvince = (province: string): string[] | undefined => {
  return districtsByProvince[province];
}
