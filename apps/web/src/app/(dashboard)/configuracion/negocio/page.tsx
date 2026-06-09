"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Save, CheckCircle, AlertCircle, ChevronDown, Camera } from "lucide-react";
import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/top-bar";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/client";

const CATEGORIES = ["Peluquería / Salón de Belleza", "Barbería", "Spa / Centro de Estética", "Nail Bar", "Otro"];

const PERU_GEO: Record<string, Record<string, string[]>> = {
  "Amazonas": {
    "Chachapoyas": ["Chachapoyas", "Asunción", "Balsas", "Cheto", "Chiliquín", "Chuquibamba", "Granada", "Huancas", "La Jalca", "Leimebamba", "Levanto", "Magdalena", "Mariscal Castilla", "Molinopampa", "Montevideo", "Olleros", "Quinjalca", "San Francisco de Daguas", "San Isidro de Maino", "Soloco", "Sonche"],
    "Bagua": ["Bagua", "Carmen de la Frontera", "Copallín", "El Parco", "Imaza", "La Peca"],
    "Bongará": ["Jumbilla", "Chisquilla", "Churuja", "Corosha", "Cuispes", "Florida", "Jazán", "Recta", "San Carlos", "Shipasbamba", "Valera", "Yambrasbamba"],
    "Condorcanqui": ["Nieva", "El Cenepa", "Río Santiago"],
    "Luya": ["Lamud", "Camporredondo", "Cocabamba", "Colcamar", "Conila", "Inguilpata", "Longuita", "Lonya Chico", "Luya", "Luya Viejo", "María", "Ocalli", "Ocumal", "Pisuquia", "Providencia", "San Cristóbal", "San Francisco del Yeso", "San Jerónimo", "San Juan de Lopecancha", "Santa Catalina", "Santo Tomás", "Tingo", "Trita"],
    "Rodríguez de Mendoza": ["San Nicolás", "Chirimoto", "Cochamal", "Huambo", "Limabamba", "Longar", "Mariscal Benavides", "Milpuc", "Omia", "Santa Rosa", "Totoras", "Vista Alegre"],
    "Utcubamba": ["Bagua Grande", "Cajaruro", "Cumba", "El Milagro", "Jamalca", "Lonya Grande", "Yamón"],
  },
  "Áncash": {
    "Huaraz": ["Huaraz", "Cochabamba", "Colcabamba", "Huanchay", "Independencia", "Jangas", "La Libertad", "Lichía", "Pampas Chico", "Pampas Grande", "Pariacoto", "Pira", "Tarica"],
    "Santa": ["Chimbote", "Cáceres del Perú", "Coishco", "Macate", "Moro", "Nepeña", "Samanco", "Santa", "Vinzos"],
    "Casma": ["Casma", "Buena Vista Alta", "Comandante Noel", "Yaután"],
    "Huarmey": ["Huarmey", "Cochapetí", "Culebras", "Huayán", "Malvas"],
    "Carhuaz": ["Carhuaz", "Acopampa", "Amashca", "Anta", "Ataquero", "Marcará", "Pampas", "San Miguel de Aco", "Shilla", "Tinco", "Yungar"],
    "Yungay": ["Yungay", "Cascapara", "Mancos", "Matacoto", "Quillo", "Ranrahirca", "Shupluy", "Yanama"],
    "Recuay": ["Recuay", "Catac", "Cotaparaco", "Huayllapampa", "Llacllin", "Pampas Chico", "Pampas Grande", "Pátap", "Punta Callán", "Tapacocha", "Ticapampa"],
    "Huari": ["Huari", "Anra", "Cajay", "Chavin de Huantar", "Huacachi", "Huacchis", "Huachis", "Huantar", "Masin", "Paucas", "Ponto", "Rahuapampa", "Rapayan", "San Marcos", "San Pedro de Chana", "Uco"],
    "Bolognesi": ["Chiquian", "Abelardo Pardo Lezameta", "Antonio Raymondi", "Aquia", "Cajacay", "Canis", "Colquioc", "Huallanca", "Huasta", "Huayllacayán", "La Primavera", "Mangas", "Pacllon", "San Miguel de Corpanqui", "Ticllos"],
    "Pallasca": ["Cabana", "Bolognesi", "Conchucos", "Huacaschuque", "Huandoval", "Lacabamba", "Llapo", "Pallasca", "Pampas", "Santa Rosa", "Tauca"],
    "Sihuas": ["Sihuas", "Acobamba", "Alfonso Ugarte", "Cashapampa", "Chingalpo", "Huayllabamba", "Quiches", "Ragash", "San Juan", "Sicsibamba"],
    "Corongo": ["Corongo", "Aco", "Bambas", "Cusca", "La Pampa", "Pampas", "Yanac"],
    "Pomabamba": ["Pomabamba", "Huaylán", "Parobamba", "Quinuabamba"],
    "Ocros": ["Ocros", "Acas", "Cajamarquilla", "Carhuapampa", "Cochas", "Congas", "Llipa", "San Cristóbal de Raján", "San Pedro", "Santiago de Chilcas"],
    "Mariscal Luzuriaga": ["Piscobamba", "Casca", "Eleazar Guzmán Barrón", "Fidel Olivas Escudero", "Llumpa", "Lucma", "Musga"],
    "Antonio Raymondi": ["Llamellín", "Aczo", "Chaccho", "Chingas", "Mirgas", "San Juan de Rontoy"],
    "Asunción": ["Chacas", "Acochaca"],
    "Carlos F. Fitzcarrald": ["San Luis", "Mato", "Pautas", "Rayan"],
    "Huaylas": ["Caraz", "Huallanca", "Huata", "Huaylas", "Mato", "Pamparomas", "Pueblo Libre", "Santa Cruz", "Santo Toribio", "Yuracmarca"],
    "Aija": ["Aija", "Coris", "Huacllán", "La Merced", "Succha"],
  },
  "Apurímac": {
    "Abancay": ["Abancay", "Chacoche", "Circa", "Curahuasi", "Huanipaca", "Lambrama", "Pichirhua", "San Pedro de Cachora", "Tamburco"],
    "Andahuaylas": ["Andahuaylas", "Andarapa", "Chiara", "Huancarama", "Huancaray", "Huayana", "Kishuara", "Pacobamba", "Pacucha", "Pampachiri", "Pomacocha", "San Antonio de Cachi", "San Jerónimo", "San Miguel de Chaccrampa", "Santa María de Chicmo", "Talavera", "Tumay Huaraca", "Turpo", "Kaquiabamba", "José María Arguedas"],
    "Antabamba": ["Antabamba", "El Oro", "Huaquirca", "Juan Espinoza Medrano", "Oropesa", "Pachaconas", "Sabaino"],
    "Aymaraes": ["Chalhuanca", "Capaya", "Caraybamba", "Chapimarca", "Colcabamba", "Cotaruse", "Ihuayllo", "Justo Apu Sahuaraura", "Lucre", "Pocohuanca", "San Juan de Chaquibamba", "Sañayca", "Soraya", "Tapairihua", "Tintay", "Toraya", "Yanaca"],
    "Cotabambas": ["Tambobamba", "Coyllurqui", "Cotabambas", "Haquira", "Mara", "Challhuahuacho"],
    "Chincheros": ["Chincheros", "Anco-Huallo", "Cocharcas", "Huaccana", "Ocobamba", "Ongoy", "Uranmarca", "Ranracancha"],
    "Grau": ["Chuquibambilla", "Curpahuasi", "Gamarra", "Huayllati", "Mamara", "Micaela Bastidas", "Pataypampa", "Progreso", "San Antonio", "Santa Rosa", "Turpay", "Vilcabamba", "Virundo", "Curasco"],
  },
  "Arequipa": {
    "Arequipa": ["Arequipa", "Alto Selva Alegre", "Cayma", "Cerro Colorado", "Characato", "Chiguata", "Jacobo Hunter", "La Joya", "Mariano Melgar", "Miraflores", "Mollebaya", "Paucarpata", "Pocsi", "Polobaya", "Quequeña", "Sabandía", "Sachaca", "San Juan de Siguas", "San Juan de Tarucani", "Santa Isabel de Siguas", "Santa Rita de Siguas", "Socabaya", "Tiabaya", "Uchumayo", "Vitor", "Yanahuara", "Yarabamba", "Yura", "José Luis Bustamante y Rivero"],
    "Camaná": ["Camaná", "José María Quimper", "Mariscal Cáceres", "Nicolás de Piérola", "Ocoña", "Quilca", "Samuel Pastor"],
    "Caravelí": ["Caravelí", "Acarí", "Atico", "Atiquipa", "Bella Unión", "Cahuacho", "Chala", "Chaparra", "Huanuhuanu", "Jaqui", "Lomas", "Quicacha", "Yauca"],
    "Castilla": ["Aplao", "Andagua", "Ayo", "Chachas", "Chilcaymarca", "Choco", "Huancarqui", "Machaguay", "Orcopampa", "Pampacolca", "Tipán", "Uñón", "Uraca", "Viraco"],
    "Caylloma": ["Chivay", "Achoma", "Cabanaconde", "Callalli", "Caylloma", "Coporaque", "Huambo", "Huanca", "Ichupampa", "Lari", "Lluta", "Maca", "Madrigal", "San Antonio de Chuca", "Sibayo", "Tapay", "Tisco", "Tuti", "Yanque", "Majes"],
    "Condesuyos": ["Chuquibamba", "Andaray", "Cayarani", "Chichas", "Iray", "Río Grande", "Salamanca", "Yanaquihua"],
    "Islay": ["Mollendo", "Cocachacra", "Dean Valdivia", "Islay", "Mejía", "Punta de Bombón"],
    "La Unión": ["Cotahuasi", "Alca", "Charcana", "Huaynacotas", "Pampamarca", "Puyca", "Quechualla", "Sayla", "Tauria", "Tomepampa", "Toro"],
  },
  "Ayacucho": {
    "Huamanga": ["Ayacucho", "Acocro", "Acos Vinchos", "Carmen Alto", "Chiara", "Ocros", "Pacaycasa", "Quinua", "San José de Ticllas", "San Juan Bautista", "Santiago de Pischa", "Socos", "Tambillo", "Vinchos", "Jesús Nazareno", "Andrés Avelino Cáceres Dorregaray"],
    "Cangallo": ["Cangallo", "Chuschi", "Los Morochucos", "María Parado de Bellido", "Paras", "Totos"],
    "Huanta": ["Huanta", "Ayahuanco", "Huamanguilla", "Iguaín", "Luricocha", "Santillana", "Sivia", "Llochegua", "Canayre", "Uchuraccay", "Pucacolpa", "Chaca"],
    "La Mar": ["San Miguel", "Anco", "Ayna", "Chilcas", "Chungui", "Luis Carranza", "Santa Rosa", "Tambo", "Samugari", "Anchihuay"],
    "Lucanas": ["Puquio", "Aucara", "Cabana", "Carmen Salcedo", "Chaviña", "Chipao", "Huac-Huas", "Laramate", "Leoncio Prado", "Llauta", "Lucanas", "Ocaña", "Otoca", "Saisa", "San Cristóbal", "San Juan", "San Pedro", "San Pedro de Palco", "Sancos", "Santa Ana de Huaycahuacho", "Santa Lucía"],
    "Parinacochas": ["Coracora", "Chumpi", "Coronel Castañeda", "Pacapausa", "Pullo", "Puyusca", "San Francisco de Ravacayco", "Upahuacho"],
    "Huanca Sancos": ["Sancos", "Carapo", "Sacsamarca", "Santiago de Lucanamarca"],
    "Páucar del Sara Sara": ["Pausa", "Colta", "Corculla", "Lampa", "Marcabamba", "Oyolo", "Pararca", "San Javier de Alpabamba", "San José de Ushua", "Sara Sara"],
    "Sucre": ["Querobamba", "Belén", "Chalcos", "Chilcayoc", "Huacaña", "Morcolla", "Paico", "San Salvador de Quije", "Santiago de Paucaray", "Soras"],
    "Víctor Fajardo": ["Huancapi", "Alcamenca", "Apongo", "Asquipata", "Canaria", "Cayara", "Colca", "Huamanquiquia", "Huancaraylla", "Huaya", "Sarhua", "Vilcanchos"],
    "Vilcas Huamán": ["Vilcas Huamán", "Accomarca", "Carhuanca", "Concepción", "Huambalpa", "Independencia", "Saurama", "Vischongo"],
  },
  "Cajamarca": {
    "Cajamarca": ["Cajamarca", "Asunción", "Chetilla", "Cospan", "Encañada", "Jesús", "Llacanora", "Los Baños del Inca", "Magdalena", "Matara", "Namora", "San Juan"],
    "Cajabamba": ["Cajabamba", "Cachachi", "Condebamba", "Sitacocha"],
    "Celendín": ["Celendín", "Chumuch", "Cortegana", "Huasmin", "Jorge Chávez", "José Gálvez", "Miguel Iglesias", "Oxamarca", "Sorochuco", "Sucre", "Utco", "La Libertad de Pallán"],
    "Chota": ["Chota", "Anguía", "Chadin", "Chiguirip", "Chimban", "Choropampa", "Cochabamba", "Conchan", "Huambos", "Lajas", "Llama", "Miracosta", "Paccha", "Pion", "Querocoto", "San Juan de Licupis", "Tacabamba", "Tocmoche", "Chalamarca"],
    "Contumazá": ["Contumazá", "Chilete", "Cupisnique", "Guzmango", "San Benito", "Santa Cruz de Toledo", "Tantarica", "Yonán"],
    "Cutervo": ["Cutervo", "Callayuc", "Choros", "Cujillo", "La Ramada", "Pimpingos", "Querocotillo", "San Andrés de Cutervo", "San Juan de Cutervo", "San Luis de Lucma", "Santa Cruz", "Santo Domingo de la Capilla", "Santo Tomás", "Socota", "Toribio Casanova"],
    "Hualgayoc": ["Bambamarca", "Chugur", "Hualgayoc"],
    "Jaén": ["Jaén", "Bellavista", "Chontali", "Colasay", "Huabal", "Las Pirias", "Pomahuaca", "Pucará", "Sallique", "San Felipe", "San José del Alto", "Santa Rosa"],
    "San Ignacio": ["San Ignacio", "Chirinos", "Huarango", "La Coipa", "Namballe", "San José de Lourdes", "Tabaconas"],
    "San Marcos": ["Pedro Gálvez", "Chancay", "Eduardo Villanueva", "Gregorio Pita", "Ichocan", "José Manuel Quiroz", "José Sabogal"],
    "San Miguel": ["San Miguel", "Bolívar", "Calquis", "Catilluc", "El Prado", "La Florida", "Llapa", "Nanchoc", "Niepos", "San Gregorio", "San Silvestre de Cochan", "Tongod", "Unión Agua Blanca"],
    "San Pablo": ["San Pablo", "San Bernardino", "San Luis", "Tumbadén"],
    "Santa Cruz": ["Santa Cruz", "Andabamba", "Catache", "Chancaybaños", "La Esperanza", "Ninabamba", "Pulan", "Saucepampa", "Sexi", "Uticyacu", "Yauyucán"],
  },
  "Callao": {
    "Callao": ["Bellavista", "Callao", "Carmen de la Legua Reynoso", "La Perla", "La Punta", "Mi Perú", "Ventanilla"],
  },
  "Cusco": {
    "Cusco": ["Cusco", "Ccorca", "Poroy", "San Jerónimo", "San Sebastián", "Santiago", "Saylla", "Wanchaq"],
    "Acomayo": ["Acomayo", "Acopia", "Acos", "Mosoc Llacta", "Pomacanchi", "Rondocan", "Sangarará"],
    "Anta": ["Anta", "Ancahuasi", "Cachimayo", "Chinchaypujio", "Huarocondo", "Limatambo", "Mollepata", "Pucyura", "Zurite"],
    "Calca": ["Calca", "Coya", "Lamay", "Lares", "Pisac", "San Salvador", "Taray", "Yanatile"],
    "Canas": ["Yanaoca", "Checca", "Kunturkanki", "Langui", "Layo", "Pampamarca", "Quehue", "Túpac Amaru"],
    "Canchis": ["Sicuani", "Checacupe", "Combapata", "Marangani", "Pitumarca", "San Pablo", "San Pedro", "Tinta"],
    "Chumbivilcas": ["Santo Tomás", "Capacmarca", "Chamaca", "Colquemarca", "Livitaca", "Llusco", "Quiñota", "Velille"],
    "Espinar": ["Espinar", "Condoroma", "Coporaque", "Ocoruro", "Pallpata", "Pichigua", "Suyckutambo", "Alto Pichigua"],
    "La Convención": ["Quillabamba", "Echarate", "Huayopata", "Maranura", "Ocobamba", "Quellouno", "Kimbiri", "Santa Ana", "Vilcabamba", "Pichari", "Inkawasi", "Villa Kintiarina", "Villa Virgen"],
    "Paruro": ["Paruro", "Accha", "Ccapi", "Colcha", "Huanoquite", "Omacha", "Paccaritambo", "Pillpinto", "Yaurisque"],
    "Paucartambo": ["Paucartambo", "Caicay", "Challabamba", "Colquepata", "Huancarani", "Kosñipata"],
    "Quispicanchi": ["Urcos", "Andahuaylillas", "Camanti", "Ccarhuayo", "Ccatca", "Cusipata", "Huaro", "Lucre", "Marcapata", "Ocongate", "Oropesa", "Quiquijana"],
    "Urubamba": ["Urubamba", "Chinchero", "Huayllabamba", "Machupicchu", "Maras", "Ollantaytambo", "Yucay"],
  },
  "Huancavelica": {
    "Huancavelica": ["Huancavelica", "Acobambilla", "Acoria", "Conayca", "Cuenca", "Huachocolpa", "Huayllahuara", "Izcuchaca", "Laria", "Manta", "Mariscal Cáceres", "Moya", "Nuevo Occoro", "Palca", "Pilchaca", "Vilca", "Yauli", "Ascensión", "Huando"],
    "Acobamba": ["Acobamba", "Andabamba", "Anta", "Caja", "Marcas", "Paucara", "Pomacocha", "Rosario"],
    "Angaraes": ["Lircay", "Anchonga", "Callanmarca", "Ccochaccasa", "Chincho", "Congalla", "Huanca-Huanca", "Huayllay Grande", "Julcamarca", "San Antonio de Antaparco", "Santo Tomás de Pata", "Secclla"],
    "Castrovirreyna": ["Castrovirreyna", "Arma", "Aurahua", "Capillas", "Chupamarca", "Cocas", "Huachos", "Huamatambo", "Mollepampa", "San Juan", "Santa Ana", "Tantara", "Ticrapo"],
    "Churcampa": ["Churcampa", "Anco", "Chinchihuasi", "El Carmen", "La Merced", "Locroja", "Paucarbamba", "San Miguel de Mayocc", "San Pedro de Coris", "Pachamarca", "Cosme"],
    "Huaytará": ["Huaytará", "Ayaví", "Córdova", "Huayacundo Arma", "Laramarca", "Ocoyo", "Pilpichaca", "Querco", "Quito-Arma", "San Antonio de Cusicancha", "San Francisco de Sangayaico", "San Isidro", "Santiago de Chocorvos", "Santiago de Quirahuara", "Santo Domingo de Capillas", "Tambo"],
    "Tayacaja": ["Pampas", "Acostambo", "Acraquia", "Ahuaycha", "Colcabamba", "Daniel Hernández", "Huachocolpa", "Huaribamba", "Ñahuimpuquio", "Pazos", "Quishuar", "Salcabamba", "Salcahuasi", "San Marcos de Rocchac", "Surcubamba", "Tintay Puncu", "Quichuas", "Andaymarca", "Roble", "Pichos", "Santiago de Tucuma"],
  },
  "Huánuco": {
    "Huánuco": ["Huánuco", "Amarilis", "Chinchao", "Churubamba", "Margos", "Quisqui", "San Francisco de Cayran", "San Pedro de Chaulán", "Santa María del Valle", "Yarumayo", "Pillco Marca", "Yacus"],
    "Ambo": ["Ambo", "Cayna", "Colpas", "Conchamarca", "Huacar", "San Francisco", "San Rafael", "Tomay Kichwa"],
    "Dos de Mayo": ["La Unión", "Chuquis", "Marías", "Pachas", "Quivilla", "Ripan", "Shunqui", "Sillapata", "Yanas"],
    "Huacaybamba": ["Huacaybamba", "Canchabamba", "Cochabamba", "Pinra"],
    "Huamalíes": ["Llata", "Arancay", "Chavín de Pariarca", "Jacas Grande", "Jircan", "Miraflores", "Monzón", "Punchao", "Puños", "Singa", "Tantamayo"],
    "Leoncio Prado": ["Rupa-Rupa", "Daniel Alomía Robles", "Hermilio Valdizán", "José Crespo y Castillo", "Luyando", "Mariano Dámaso Beraún", "Pucayacu", "Castillo Grande", "Pueblo Nuevo", "Santo Domingo de Anda"],
    "Marañón": ["Huacrachuco", "Cholon", "San Buenaventura", "La Morada", "Santa Rosa de Alto Yanajanca"],
    "Pachitea": ["Panao", "Chaglla", "Molino", "Umari"],
    "Puerto Inca": ["Puerto Inca", "Codo del Pozuzo", "Honoria", "Tournavista", "Yuyapichis"],
    "Lauricocha": ["Jesús", "Baños", "Jivia", "Queropalca", "Rondos", "San Francisco de Asís", "San Miguel de Cauri"],
    "Yarowilca": ["Chavinillo", "Cahuac", "Chacabamba", "Aparicio Pomares", "Jacas Chico", "Obas", "Pampamarca", "Choras"],
  },
  "Ica": {
    "Ica": ["Ica", "La Tinguiña", "Los Aquijes", "Ocucaje", "Pachacútec", "Parcona", "Pueblo Nuevo", "Salas", "San José de Los Molinos", "San Juan Bautista", "Santiago", "Subtanjalla", "Tate", "Yauca del Rosario"],
    "Chincha": ["Chincha Alta", "Alto Larán", "Chavín", "Chincha Baja", "El Carmen", "Grocio Prado", "Pueblo Nuevo", "San Juan de Yanac", "San Pedro de Huacarpana", "Sunampe", "Tambo de Mora"],
    "Nasca": ["Nasca", "Changuillo", "El Ingenio", "Marcona", "Vista Alegre"],
    "Palpa": ["Palpa", "Llipata", "Río Grande", "Santa Cruz", "Tibillo"],
    "Pisco": ["Pisco", "Huancano", "Humay", "Independencia", "Paracas", "San Andrés", "San Clemente", "Túpac Amaru Inca"],
  },
  "Junín": {
    "Huancayo": ["Huancayo", "Carhuacallanga", "Chacapampa", "Chicche", "Chilca", "Chongos Alto", "Chupuro", "Colca", "Cullhuas", "El Tambo", "Huacrapuquio", "Hualhuas", "Huancan", "Huasicancha", "Huayucachi", "Ingenio", "Pariahuanca", "Pilcomayo", "Pucará", "Quichuay", "Quilcas", "San Agustín", "San Jerónimo de Tunán", "Saño", "Sapallanga", "Sicaya", "Santo Domingo de Acobamba", "Viques"],
    "Chanchamayo": ["La Merced", "Perené", "Pichanaqui", "San Luis de Shuaro", "San Ramón", "Vitoc"],
    "Chupaca": ["Chupaca", "Ahuac", "Chongos Bajo", "Huachac", "Huamancaca Chico", "San Juan de Iscos", "San Juan de Jarpa", "Tres de Diciembre", "Yanacancha"],
    "Concepción": ["Concepción", "Aco", "Andamarca", "Chambara", "Cochas", "Comas", "Heroínas Toledo", "Manzanares", "Mariscal Castilla", "Matahuasi", "Mito", "Nueve de Julio", "Orcotuna", "San José de Quero", "Santa Rosa de Ocopa"],
    "Jauja": ["Jauja", "Acolla", "Apata", "Ataura", "Canchayllo", "Curicaca", "El Mantaro", "Huamalí", "Huaripampa", "Huertas", "Janjaillo", "Julcán", "Leonor Ordóñez", "Llocllapampa", "Marco", "Masma", "Masma Chicche", "Molinos", "Monobamba", "Muqui", "Muquiyauyo", "Paca", "Paccha", "Pancan", "Parco", "Pomacancha", "Ricran", "San Lorenzo", "San Pedro de Chunán", "Sausa", "Sincos", "Tunan Marca", "Yauli", "Yauyos"],
    "Junín": ["Junín", "Carhuamayo", "Ondores", "Ulcumayo"],
    "Satipo": ["Satipo", "Coviriali", "Llaylla", "Mazamari", "Pampa Hermosa", "Pangoa", "Río Negro", "Río Tambo", "Vizcatán del Ene"],
    "Tarma": ["Tarma", "Acobamba", "Huaricolca", "Huasahuasi", "La Unión", "Palca", "Palcamayo", "San Pedro de Cajas", "Tapo"],
    "Yauli": ["La Oroya", "Chacapalpa", "Huay-Huay", "Marcapomacocha", "Morococha", "Paccha", "Santa Bárbara de Carhuacayán", "Santa Rosa de Sacco", "Suitucancha", "Yauli"],
  },
  "La Libertad": {
    "Trujillo": ["Trujillo", "El Porvenir", "Florencia de Mora", "Huanchaco", "La Esperanza", "Laredo", "Moche", "Poroto", "Salaverry", "Simbal", "Victor Larco Herrera"],
    "Ascope": ["Ascope", "Chicama", "Chocope", "Guadalupito", "Macabi Bajo", "Razuri", "Santiago de Cao", "Casa Grande"],
    "Bolívar": ["Bolívar", "Bambamarca", "Condormarca", "Longotea", "Uchumarca", "Ucuncha"],
    "Chepén": ["Chepén", "Pacanga", "Pueblo Nuevo"],
    "Julcán": ["Julcán", "Calamarca", "Carabamba", "Huaso"],
    "Otuzco": ["Otuzco", "Agallpampa", "Charat", "Huaranchal", "La Cuesta", "Mache", "Paranday", "Salpo", "Sinsicap", "Usquil"],
    "Pacasmayo": ["San Pedro de Lloc", "Guadalupe", "Jequetepeque", "Pacasmayo", "San José"],
    "Pataz": ["Tayabamba", "Buldibuyo", "Chillia", "Huaylillas", "Huancaspata", "Huayo", "Ongón", "Parcoy", "Pataz", "Pías", "Santiago de Challas", "Taurija", "Urpay"],
    "Sánchez Carrión": ["Huamachuco", "Chugay", "Cochorco", "Curgos", "Marcabal", "Sanagoran", "Sarin", "Sartimbamba"],
    "Santiago de Chuco": ["Santiago de Chuco", "Angasmarca", "Cachicadan", "Mollebamba", "Mollepata", "Quiruvilca", "Santa Cruz de Chuca", "Sitabamba"],
    "Gran Chimú": ["Cascas", "Lucma", "Marmot", "Sayapullo"],
    "Virú": ["Virú", "Chao", "Guadalupito"],
  },
  "Lambayeque": {
    "Chiclayo": ["Chiclayo", "Chongoyape", "Eten", "Eten Puerto", "José Leonardo Ortiz", "La Victoria", "Lagunas", "Monsefú", "Nueva Arica", "Oyotún", "Picsi", "Pimentel", "Reque", "Santa Rosa", "Saña", "Cayaltí", "Pátapo", "Pomalca", "Pucalá", "Tumán"],
    "Ferreñafe": ["Ferreñafe", "Cañaris", "Incahuasi", "Manuel Antonio Mesones Muro", "Pitipo", "Pueblo Nuevo"],
    "Lambayeque": ["Lambayeque", "Chóchope", "Illimo", "Jayanca", "Mochumí", "Mórrope", "Motupe", "Olmos", "Pacora", "Salas", "San José", "Túcume"],
  },
  "Lima": {
    "Lima": ["Barranco", "Breña", "Carabayllo", "Chaclacayo", "Chorrillos", "Cieneguilla", "Comas", "El Agustino", "Independencia", "Jesús María", "La Molina", "La Victoria", "Lima", "Lince", "Los Olivos", "Lurigancho", "Lurín", "Magdalena del Mar", "Pueblo Libre", "Miraflores", "Pachacámac", "Pucusana", "Punta Hermosa", "Punta Negra", "Rímac", "San Bartolo", "San Borja", "San Isidro", "San Juan de Lurigancho", "San Juan de Miraflores", "San Luis", "San Martín de Porres", "San Miguel", "Santa Anita", "Santa María del Mar", "Santa Rosa", "Santiago de Surco", "Surquillo", "Villa El Salvador", "Villa María del Triunfo"],
    "Barranca": ["Barranca", "Ámbar", "Iloca", "Miramar", "Puerto Supe", "Supe"],
    "Cajatambo": ["Cajatambo", "Copa", "Gorgor", "Huancapón", "Manas"],
    "Canta": ["Canta", "Arahuay", "Huamantanga", "Huaros", "Lachaqui", "San Buenaventura", "Santa Rosa de Quives"],
    "Cañete": ["San Vicente de Cañete", "Asia", "Calango", "Cerro Azul", "Chilca", "Coayllo", "Imperial", "Lunahuaná", "Mala", "Nuevo Imperial", "Pacarán", "Quilmaná", "San Antonio", "San Luis", "Santa Cruz de Flores", "Zúñiga"],
    "Huaral": ["Huaral", "Atavillos Alto", "Atavillos Bajo", "Aucallama", "Chancay", "Ihuarí", "Lampián", "Pacaraos", "San Miguel de Acos", "Santa Cruz de Andamarca", "Sumbilca", "Veintisiete de Noviembre"],
    "Huarochirí": ["Matucana", "Antioquia", "Callahuanca", "Carampoma", "Chicla", "Cuenca", "Huachupampa", "Huanza", "Huarochirí", "Lahuaytambo", "Langa", "Laraos", "Mariatana", "Ricardo Palma", "San Andrés de Tupicocha", "San Antonio", "San Damián", "San Juan de Iris", "San Juan de Tantaranche", "San Lorenzo de Quinti", "San Mateo", "San Mateo de Otao", "San Pedro de Casta", "San Pedro de Huancayre", "Sangallaya", "Santa Cruz de Cocachacra", "Santa Eulalia", "Santiago de Anchucaya", "Santiago de Tuna", "Santo Domingo de los Olleros", "Surco"],
    "Huaura": ["Huacho", "Ambar", "Caleta de Carquín", "Checras", "Hualmay", "Huaura", "Leoncio Prado", "Paccho", "Santa Leonor", "Santa María", "Sayan", "Vegueta"],
    "Oyón": ["Oyón", "Andajes", "Caujul", "Cochamarca", "Navan", "Pachangara"],
    "Yauyos": ["Yauyos", "Alis", "Allauca", "Ayaviri", "Azángaro", "Cacra", "Carania", "Catahuasi", "Chocos", "Cochas", "Colonia", "Hongos", "Huampara", "Huancaya", "Huangáscar", "Huantán", "Huañec", "Laraos", "Lincha", "Madean", "Miraflores", "Omas", "Putinza", "Quinches", "Quinocay", "San Joaquín", "San Pedro de Pilas", "Tanta", "Tauripampa", "Tomas", "Tupe", "Viñac", "Vitis"],
  },
  "Loreto": {
    "Maynas": ["Iquitos", "Alto Nanay", "Fernando Lores", "Indiana", "Las Amazonas", "Mazan", "Napo", "Punchana", "Torres Causana", "Belén", "San Juan Bautista"],
    "Alto Amazonas": ["Yurimaguas", "Balsapuerto", "Jeberos", "Lagunas", "Santa Cruz", "Teniente César López Rojas"],
    "Loreto": ["Nauta", "Parinari", "Tigre", "Trompeteros", "Urarinas"],
    "Mariscal Ramón Castilla": ["Ramón Castilla", "Pebas", "Yavari", "San Pablo"],
    "Requena": ["Requena", "Alto Tapiche", "Capelo", "Emilio San Martín", "Maquia", "Puinahua", "Saquena", "Soplin", "Tapiche", "Jenaro Herrera", "Yaquerana"],
    "Ucayali": ["Contamana", "Inahuaya", "Padre Márquez", "Pampa Hermosa", "Sarayacu", "Vargas Guerra"],
    "Datem del Marañón": ["San Lorenzo", "Barranca", "Cahuapanas", "Manseriche", "Morona", "Pastaza"],
    "Putumayo": ["San Antonio del Estrecho", "Huiririma", "Putumayo", "Rosa Panduro", "Teniente Manuel Clavero", "Yaguas"],
  },
  "Madre de Dios": {
    "Tambopata": ["Tambopata", "Inambari", "Las Piedras", "Laberinto"],
    "Manu": ["Manu", "Fitzcarrald", "Madre de Dios", "Huepetuhe"],
    "Tahuamanu": ["Iñapari", "Iberia", "Tahuamanu"],
  },
  "Moquegua": {
    "Mariscal Nieto": ["Moquegua", "Carumas", "Cuchumbaya", "Samegua", "San Cristóbal", "Torata"],
    "General Sánchez Cerro": ["Omate", "Chojata", "Coalaque", "Ichuña", "La Capilla", "Lloque", "Matalaque", "Puquina", "Quinistaquillas", "Ubinas", "Yunga"],
    "Ilo": ["Ilo", "El Algarrobal", "Pacocha"],
  },
  "Pasco": {
    "Pasco": ["Chaupimarca", "Huachón", "Huariaca", "Huayllay", "Ninacaca", "Pallanchacra", "Paucartambo", "San Francisco de Asís de Yarusyacán", "Simon Bolívar", "Ticlacayán", "Tinyahuarco", "Vicco", "Yanacancha"],
    "Daniel Alcides Carrión": ["Yanahuanca", "Chacayán", "Goyllarisquizga", "Paucar", "San Pedro de Pillao", "Santa Ana de Tusi", "Tapuc", "Vilcabamba"],
    "Oxapampa": ["Oxapampa", "Chontabamba", "Huancabamba", "Palcazu", "Pozuzo", "Puerto Bermúdez", "Villa Rica", "Constitución"],
  },
  "Piura": {
    "Piura": ["Piura", "Castilla", "Catacaos", "Cura Mori", "El Tallan", "La Arena", "La Unión", "Las Lomas", "Tambo Grande", "Veintiseis de Octubre"],
    "Ayabaca": ["Ayabaca", "Frias", "Jililí", "Lagunas", "Montero", "Pacaipampa", "Paimas", "Sapillica", "Sicchez", "Suyo"],
    "Huancabamba": ["Huancabamba", "Canchaque", "El Carmen de la Frontera", "Huarmaca", "Lalaquiz", "San Miguel del Faique", "Sondor", "Sondorillo"],
    "Morropón": ["Chulucanas", "Buenos Aires", "Chalaco", "La Matanza", "Morropón", "Salitral", "San Juan de Bigote", "Santa Catalina de Mossa", "Santo Domingo", "Yamango"],
    "Paita": ["Paita", "Amotape", "Arenal", "Colan", "La Huaca", "Tamarindo", "Vichayal"],
    "Sullana": ["Sullana", "Bellavista", "Ignacio Escudero", "Lancones", "Marcavelica", "Miguel Checa", "Querecotillo", "Salitral"],
    "Talara": ["Pariñas", "El Alto", "La Brea", "Lobitos", "Los Órganos", "Máncora"],
    "Sechura": ["Sechura", "Bellavista de la Unión", "Bernal", "Cristo Nos Valga", "Vice", "Rinconada Llicuar"],
  },
  "Puno": {
    "Puno": ["Puno", "Acora", "Amantani", "Atuncolla", "Capachica", "Chucuito", "Coata", "Huata", "Mañazo", "Paucarcolla", "Pichacani", "Platería", "San Antonio", "Tiquillaca", "Vilque"],
    "Azángaro": ["Azángaro", "Achaya", "Arapa", "Asillo", "Caminaca", "Chupa", "José Domingo Choquehuanca", "Muñani", "Potoni", "Saman", "San Antón", "San José", "San Juan de Salinas", "Santiago de Pupuja", "Tirapata"],
    "Carabaya": ["Macusani", "Ajoyani", "Ayapata", "Coasa", "Corani", "Crucero", "Ituata", "Ollachea", "San Gabán", "Usicayos"],
    "Chucuito": ["Juli", "Desaguadero", "Huacullani", "Kelluyo", "Pisacoma", "Pomata", "Zepita"],
    "El Collao": ["Ilave", "Capazo", "Pilcuyo", "Santa Rosa", "Conduriri"],
    "Huancané": ["Huancané", "Cojata", "Huatasani", "Inchupalla", "Pusi", "Rosaspata", "Taraco", "Vilque Chico"],
    "Lampa": ["Lampa", "Cabanilla", "Calapuja", "Nicasio", "Ocuviri", "Palca", "Paratía", "Pucará", "Santa Lucía", "Vilavila"],
    "Melgar": ["Ayaviri", "Antauta", "Cupi", "Llalli", "Macari", "Nuñoa", "Orurillo", "Santa Rosa", "Umachiri"],
    "Moho": ["Moho", "Conima", "Huayrapata", "Tilali"],
    "San Antonio de Putina": ["Putina", "Ananea", "Pedro Vilca Apaza", "Quilcapuncu", "Sina"],
    "San Román": ["Juliaca", "Cabana", "Cabanillas", "Caracoto", "San Miguel"],
    "Sandia": ["Sandia", "Cuyocuyo", "Limbani", "Patambuco", "Phara", "Quiaca", "San Juan del Oro", "Yanahuaya", "Alto Inambari", "San Pedro de Putina Punco"],
    "Yunguyo": ["Yunguyo", "Anapia", "Copani", "Cuturapi", "Ollaraya", "Tinicachi", "Unicachi"],
  },
  "San Martín": {
    "Moyobamba": ["Moyobamba", "Calzada", "Habana", "Jepelacio", "Soritor", "Yantalo"],
    "Bellavista": ["Bellavista", "Alto Biavo", "Bajo Biavo", "Huallaga", "San Pablo", "San Rafael"],
    "El Dorado": ["San José de Sisa", "Alto Biavo", "Agua Blanca", "San Martín", "Santa Rosa"],
    "Huallaga": ["Saposoa", "Alto Saposoa", "El Eslabón", "Piscoyacu", "Sacanche", "Tingo de Saposoa"],
    "Lamas": ["Lamas", "Alonso de Alvarado", "Barranquita", "Caynarachi", "Cuñumbuqui", "Pinto Recodo", "Rumisapa", "San Roque de Cumbaza", "Shanao", "Tabalosos", "Zapatero"],
    "Mariscal Cáceres": ["Juanjuí", "Campanilla", "Huicungo", "Pachiza", "Pajarillo"],
    "Picota": ["Picota", "Buenos Aires", "Caspizapa", "Pilluana", "Pucacaca", "San Cristóbal", "San Hilarión", "Shamboyacu", "Tingo de Ponaza", "Tres Unidos"],
    "Rioja": ["Rioja", "Awajún", "Elías Soplin Vargas", "Nueva Cajamarca", "Pardo Miguel", "Posic", "San Fernando", "Yorongos", "Yuracyacu"],
    "San Martín": ["Tarapoto", "Alberto Leveau", "Cacatachi", "Chazuta", "Chipurana", "El Porvenir", "Huimbayoc", "Juan Guerra", "La Banda de Shilcayo", "Morales", "Papaplaya", "San Antonio", "Sauce", "Shapaja"],
    "Tocache": ["Tocache", "Nuevo Progreso", "Pólvora", "Shunte", "Uchiza"],
  },
  "Tacna": {
    "Tacna": ["Tacna", "Alto de la Alianza", "Calana", "Ciudad Nueva", "Inclán", "Pachia", "Palca", "Pocollay", "Sama", "Coronel Gregorio Albarracín Lanchipa", "La Yarada Los Palos"],
    "Candarave": ["Candarave", "Cairani", "Camilaca", "Curibaya", "Huanuara", "Quilahuani"],
    "Jorge Basadre": ["Locumba", "Ilabaya", "Ite"],
    "Tarata": ["Tarata", "Héroe Albarracín", "Estique", "Estique-Pampa", "Sitajara", "Susapaya", "Tarucachi", "Ticaco"],
  },
  "Tumbes": {
    "Tumbes": ["Tumbes", "Corrales", "La Cruz", "Pampas de Hospital", "San Jacinto", "San Juan de la Virgen"],
    "Contralmirante Villar": ["Zorritos", "Casitas", "Canoas de Punta Sal"],
    "Zarumilla": ["Zarumilla", "Aguas Verdes", "Matapalo", "Papayal"],
  },
  "Ucayali": {
    "Coronel Portillo": ["Callería", "Campoverde", "Iparia", "Masisea", "Yarinacocha", "Nueva Requena", "Manantay"],
    "Atalaya": ["Raymondi", "Sepahua", "Tahuania", "Yurúa"],
    "Padre Abad": ["Padre Abad", "Irazola", "Curimaná", "Neshuya", "Alexander Von Humboldt"],
    "Purús": ["Purus"],
  },
};

type Business = {
  name: string;
  type: string;
  ruc: string | null;
  phone: string | null;
  address: string | null;
  timezone: string;
  logoUrl: string | null;
};

export default function NegocioConfigPage() {
  const qc = useQueryClient();
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  const [name, setName] = useState("");
  const [type, setType] = useState("");
  const [customType, setCustomType] = useState("");
  const [ruc, setRuc] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [department, setDepartment] = useState("Lima");
  const [province, setProvince] = useState("Lima");
  const [district, setDistrict] = useState("Miraflores");
  const [initialized, setInitialized] = useState(false);

  const { data: settings, isLoading: loading, isError } = useQuery<{ business: Business }>({
    queryKey: ["settings"],
    queryFn: () => apiFetch<{ business: Business }>("/settings"),
    staleTime: 0,
    retry: 2,
  });

  useEffect(() => {
    if (settings?.business && !initialized) {
      const business = settings.business;
      setName(business.name);
      const isKnown = CATEGORIES.slice(0, -1).includes(business.type);
      if (isKnown) {
        setType(business.type);
      } else {
        setType("Otro");
        setCustomType(business.type ?? "");
      }
      setRuc(business.ruc ?? "");
      setPhone(business.phone ?? "");
      if (business.logoUrl) setLogoPreview(business.logoUrl);
      setAddress(business.address ?? "");
      const parts = (business.timezone ?? "Lima|Lima|Miraflores").split("|");
      setDepartment(parts[0] ?? "Lima");
      setProvince(parts[1] ?? "Lima");
      setDistrict(parts[2] ?? "Miraflores");
      setInitialized(true);
    }
  }, [settings, initialized]);

  const saveMutation = useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      apiFetch("/settings/business", { method: "PATCH", body: JSON.stringify(body) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["settings"] });
      qc.invalidateQueries({ queryKey: ["me"] });
      setFeedback({ type: "success", msg: "Cambios guardados correctamente" });
      setTimeout(() => setFeedback(null), 3000);
    },
    onError: () => setFeedback({ type: "error", msg: "Error al guardar. Intenta de nuevo." }),
  });

  function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoFile(file);
    const reader = new FileReader();
    reader.onload = () => setLogoPreview(reader.result as string);
    reader.readAsDataURL(file);
  }

  async function handleSave() {
    const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

    // Si hay un archivo nuevo, subirlo primero
    if (logoFile) {
      setUploadingLogo(true);
      try {
        const form = new FormData();
        form.append("logo", logoFile);
        const res = await fetch(`${API_URL}/settings/logo`, {
          method: "POST",
          credentials: "include",
          body: form,
        });
        if (!res.ok) {
          const d = await res.json().catch(() => ({}));
          setFeedback({ type: "error", msg: d.error ?? "Error al subir el logo." });
          return;
        }
        const { logoUrl } = await res.json();
        setLogoPreview(logoUrl);
        setLogoFile(null);
      } catch {
        setFeedback({ type: "error", msg: "No se pudo subir el logo." });
        return;
      } finally {
        setUploadingLogo(false);
      }
    }

    saveMutation.mutate({
      name,
      type: type === "Otro" ? (customType.trim() || "Otro") : type,
      ruc: ruc || undefined,
      phone: phone || undefined,
      address: address || undefined,
      timezone: `${department}|${province}|${district}`,
    });
  }

  const saving = saveMutation.isPending || uploadingLogo;

  const inputClass = "w-full bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)] rounded-lg px-3 py-2.5 text-body-md text-[var(--color-on-surface)] focus:outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 transition-all placeholder:text-[var(--color-outline-variant)]";
  const labelClass = "block text-[11px] font-semibold text-[var(--color-on-surface-variant)] uppercase tracking-wider mb-1";

  const provinces = PERU_GEO[department] ?? {};
  const districts = provinces[province] ?? [];

  if (loading) return (
    <>
      <Sidebar activePath="/configuracion" />
      <main className="flex-1 ml-64 flex items-center justify-center bg-[var(--color-background)]">
        <div className="w-8 h-8 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
      </main>
    </>
  );

  if (isError || !settings?.business) return (
    <>
      <Sidebar activePath="/configuracion" />
      <main className="flex-1 ml-64 flex items-center justify-center bg-[var(--color-background)]">
        <div className="text-center space-y-3">
          <p className="text-body-md text-[var(--color-on-surface-variant)]">No se pudieron cargar los datos del negocio.</p>
          <button onClick={() => window.location.reload()}
            className="px-4 py-2 bg-[var(--color-primary)] text-[var(--color-on-primary)] rounded-lg text-label-md font-semibold">
            Reintentar
          </button>
        </div>
      </main>
    </>
  );

  return (
    <>
      <Sidebar activePath="/configuracion" />
      <main className="flex-1 ml-64 flex flex-col h-full bg-[var(--color-background)] overflow-hidden">
        <TopBar />
        <div className="flex-1 overflow-y-auto pt-16" style={{ scrollbarWidth: "thin" }}>
          <div className="max-w-2xl mx-auto px-6 py-6 space-y-6">

            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Link href="/configuracion" className="p-2 text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container-high)] rounded-full transition-colors">
                  <ArrowLeft size={20} strokeWidth={1.5} />
                </Link>
                <h1 className="text-headline-sm font-semibold text-[var(--color-on-surface)]">Datos del Negocio</h1>
              </div>
              <button onClick={handleSave} disabled={saving}
                className="flex items-center gap-2 bg-[var(--color-primary)] text-[var(--color-on-primary)] text-label-md font-semibold uppercase tracking-wider px-4 py-2.5 rounded-lg hover:bg-[var(--color-on-primary-fixed-variant)] transition-colors disabled:opacity-60">
                <Save size={14} strokeWidth={2} />
                {saving ? "Guardando..." : "Guardar"}
              </button>
            </div>

            {feedback && (
              <div className={`flex items-center gap-2 rounded-lg px-4 py-3 text-body-md border ${feedback.type === "success" ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-[var(--color-error-container)]/30 border-[var(--color-error-container)] text-[var(--color-error)]"}`}>
                {feedback.type === "success" ? <CheckCircle size={16} strokeWidth={1.5} /> : <AlertCircle size={16} strokeWidth={1.5} />}
                {feedback.msg}
              </div>
            )}

            {/* Perfil del Negocio */}
            <section className="bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)] rounded-xl p-5 space-y-4">
              <h2 className="text-headline-sm font-semibold text-[var(--color-on-surface)]">Perfil del Negocio</h2>

              {/* Logo */}
              <div className="flex flex-col items-center gap-2">
                <div className="relative group cursor-pointer" onClick={() => logoInputRef.current?.click()}>
                  {logoPreview ? (
                    <img src={logoPreview} alt="Logo" className="w-20 h-20 rounded-full object-cover border border-[var(--color-outline-variant)]" />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-[var(--color-surface-container)] border border-[var(--color-outline-variant)] flex items-center justify-center text-headline-sm font-bold text-[var(--color-primary)]">
                      {name.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div className="absolute inset-0 rounded-full bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera size={20} className="text-white" strokeWidth={1.5} />
                  </div>
                </div>
                <button type="button" onClick={() => logoInputRef.current?.click()}
                  className="text-label-md font-semibold text-[var(--color-primary)] hover:underline">
                  Cambiar Logo
                </button>
                <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
              </div>

              <div className="space-y-3">
                <div>
                  <label className={labelClass}>Nombre del Negocio</label>
                  <input value={name} onChange={(e) => setName(e.target.value)} className={inputClass} placeholder="Nombre del negocio" />
                </div>
                <div>
                  <label className={labelClass}>Categoría</label>
                  <div className="relative">
                    <select value={type} onChange={(e) => { setType(e.target.value); if (e.target.value !== "Otro") setCustomType(""); }}
                      className={`${inputClass} appearance-none pr-8 cursor-pointer`}>
                      {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <ChevronDown size={16} strokeWidth={1.5} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-outline)] pointer-events-none" />
                  </div>
                  {type === "Otro" && (
                    <input
                      value={customType}
                      onChange={(e) => setCustomType(e.target.value)}
                      className={`${inputClass} mt-2`}
                      placeholder="Escribe el tipo de negocio..."
                      autoFocus
                    />
                  )}
                </div>
              </div>
            </section>

            {/* Información de Contacto */}
            <section className="bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)] rounded-xl p-5 space-y-4">
              <h2 className="text-headline-sm font-semibold text-[var(--color-on-surface)]">Información de Contacto</h2>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>RUC</label>
                    <input value={ruc} onChange={(e) => setRuc(e.target.value.replace(/\D/g, "").slice(0, 11))}
                      className={inputClass} maxLength={11} />
                  </div>
                  <div>
                    <label className={labelClass}>Número de Teléfono</label>
                    <input value={phone} onChange={(e) => setPhone(e.target.value)} className={inputClass} />
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Dirección</label>
                  <textarea value={address} onChange={(e) => setAddress(e.target.value)} rows={2}
                    className={`${inputClass} resize-none`} placeholder="" />
                </div>
              </div>
            </section>

            {/* Localización */}
            <section className="bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)] rounded-xl p-5 space-y-4">
              <h2 className="text-headline-sm font-semibold text-[var(--color-on-surface)]">Localización</h2>
              <div className="space-y-3">

                {/* Departamento */}
                <div>
                  <label className={labelClass}>Departamento</label>
                  <div className="relative">
                    <select
                      value={department}
                      onChange={(e) => {
                        const dep = e.target.value;
                        const firstProv = Object.keys(PERU_GEO[dep] ?? {})[0] ?? "";
                        const firstDist = PERU_GEO[dep]?.[firstProv]?.[0] ?? "";
                        setDepartment(dep);
                        setProvince(firstProv);
                        setDistrict(firstDist);
                      }}
                      className={`${inputClass} appearance-none pr-8 cursor-pointer`}>
                      {Object.keys(PERU_GEO).sort().map((dep) => (
                        <option key={dep} value={dep}>{dep}</option>
                      ))}
                    </select>
                    <ChevronDown size={16} strokeWidth={1.5} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-outline)] pointer-events-none" />
                  </div>
                </div>

                {/* Provincia */}
                <div>
                  <label className={labelClass}>Provincia</label>
                  <div className="relative">
                    <select
                      value={province}
                      onChange={(e) => {
                        const prov = e.target.value;
                        const firstDist = PERU_GEO[department]?.[prov]?.[0] ?? "";
                        setProvince(prov);
                        setDistrict(firstDist);
                      }}
                      className={`${inputClass} appearance-none pr-8 cursor-pointer`}>
                      {Object.keys(provinces).map((prov) => (
                        <option key={prov} value={prov}>{prov}</option>
                      ))}
                    </select>
                    <ChevronDown size={16} strokeWidth={1.5} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-outline)] pointer-events-none" />
                  </div>
                </div>

                {/* Distrito */}
                <div>
                  <label className={labelClass}>Distrito</label>
                  <div className="relative">
                    <select
                      value={district}
                      onChange={(e) => setDistrict(e.target.value)}
                      className={`${inputClass} appearance-none pr-8 cursor-pointer`}>
                      {districts.map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                    <ChevronDown size={16} strokeWidth={1.5} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-outline)] pointer-events-none" />
                  </div>
                </div>

              </div>
            </section>

            <button onClick={handleSave} disabled={saving}
              className="w-full bg-[var(--color-primary)] text-[var(--color-on-primary)] text-headline-sm font-semibold py-4 rounded-xl hover:bg-[var(--color-on-primary-fixed-variant)] transition-colors shadow-md disabled:opacity-60 active:scale-[0.98] mb-4">
              {saving ? "Guardando..." : "Guardar Cambios"}
            </button>
          </div>
        </div>
      </main>
    </>
  );
}
