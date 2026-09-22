import type { Catalogue } from './catalogue'

/**
 * Everything this product says, in Spanish.
 *
 * Typed against English's shape, so a name English holds and this does not is a
 * compile error rather than a blank somebody finds on a screen. What is in here
 * and what is not is stated once, at the top of `english.ts`.
 *
 * WRITTEN IMPERSONALLY
 *
 * The Spanish never addresses the person reading it: an infinitive or a `se`
 * form, never `ingresá` or `ingresa`. That is a voice decision rather than a
 * grammatical one — it reads naturally to anybody on a trip rather than to one
 * country, and it is what most of the English already does. Where the English
 * names the person (`Enter your password.`) the Spanish states the fact instead
 * (`Falta la contraseña.`), because an infinitive with a possessive in it is
 * addressing somebody after all.
 *
 * NUMBERS WRITTEN INTO A SENTENCE FOLLOW THE LANGUAGE
 *
 * `2000`, not `2,000` or `2.000`: Spanish writes no thousands separator at four
 * digits, which is the same rule a price follows and for the same reason.
 */
export const SPANISH: Catalogue = {
  // ── Signing in and signing up ────────────────────────────────────────────
  'email.invalid': 'Ingresar un email válido.',
  'password.missing': 'Falta la contraseña.',
  'password.tooShort': 'Usar al menos 8 caracteres.',
  'password.needsLetter': 'Incluir al menos una letra.',
  'password.needsNumber': 'Incluir al menos un número.',
  'password.repeatMissing': 'Repetir la contraseña.',
  'password.mismatch': 'Las dos contraseñas tienen que coincidir.',

  // ── Authentication failures, by the code the service gave ────────────────
  'auth.invalidCredentials': 'Ese email y esa contraseña no corresponden a ninguna cuenta.',
  'auth.emailTaken': 'Ya hay una cuenta con ese email.',
  'auth.weakPassword': 'Esa contraseña es demasiado débil. Probar con una más larga.',
  'auth.emailNotConfirmed': 'Esa cuenta todavía no está confirmada.',
  'auth.rateLimited': 'Demasiados intentos. Esperar un momento y volver a intentar.',
  'auth.signupDisabled': 'Por ahora no se aceptan cuentas nuevas.',
  'auth.generic': 'Algo salió mal. Volver a intentar.',

  // ── Trips ────────────────────────────────────────────────────────────────
  'trip.needsName': 'Un viaje necesita un nombre.',
  'trip.nameTooLong': 'El nombre de un viaje puede tener 120 caracteres como máximo.',
  'trip.startMalformed': 'Una fecha de inicio se escribe así: 2026-04-03.',
  'trip.endMalformed': 'Una fecha de fin se escribe así: 2026-04-03.',
  'trip.endBeforeStart': 'La fecha de fin no puede ser anterior a la de inicio.',
  'trip.loadFailed': 'No se pudieron cargar los viajes.',
  'trip.createFailed': 'No se pudo crear ese viaje.',
  'trip.saveFailed': 'No se pudo guardar ese viaje.',

  // ── Cities ───────────────────────────────────────────────────────────────
  'city.needsName': 'Una ciudad necesita un nombre.',
  'city.nameTooLong': 'El nombre de una ciudad puede tener 120 caracteres como máximo.',
  'city.nameEmpty': 'Falta el nombre de la ciudad.',
  'city.nameTaken': (v: { name: string }) => `Este viaje ya tiene una ciudad llamada “${v.name}”.`,
  'city.loadFailed': 'No se pudieron cargar las ciudades de este viaje.',
  'city.saveFailed': 'No se pudo guardar esta ciudad.',
  'city.deleteFailed': 'No se pudo quitar esta ciudad.',

  // ── Where a place gets filed ─────────────────────────────────────────────
  'cityClaim.filedUnder': (v: { city: string }) =>
    `Queda en ${v.city}, que es donde está este lugar.`,
  'cityClaim.several': (v: { cities: string }) =>
    `Hay más de una ciudad lo bastante cerca como para contenerlo: ${v.cities}. Elegir una.`,
  'cityClaim.none': 'No está cerca de ninguna ciudad de este viaje. Elegir una, o dejarlo sin asignar.',
  'cityClaim.noneButNamed': (v: { place: string }) =>
    `No está cerca de ninguna ciudad de este viaje. Este lugar está en ${v.place}.`,

  // ── Places ───────────────────────────────────────────────────────────────
  'place.needsName': 'Un lugar necesita un nombre.',
  'place.nameTooLong': 'Un nombre puede tener 200 caracteres como máximo.',
  'place.noteTooLong': 'Una nota puede tener 2000 caracteres como máximo.',
  'place.linkMalformed': 'Un enlace se escribe así: https://example.com.',
  'place.linkTooLong': 'Un enlace puede tener 2000 caracteres como máximo.',
  'place.cityNotOnList': 'Elegir una ciudad de la lista.',
  'place.priceNegative': 'Un precio no puede ser menor que cero.',
  'place.priceNegativeWithFree':
    'Un precio no puede ser menor que cero. Para un lugar que no cuesta nada, activar Gratis.',
  'place.localPriceNeedsCurrency': 'Un precio local necesita la moneda en la que está.',
  'place.dayMalformed': 'Un día se escribe así: 2026-04-03.',
  'place.lastDayMalformed': 'Un último día se escribe así: 2026-04-03.',
  'place.lastDayNeedsFirst': 'Un último día necesita un día desde el que empezar.',
  'place.lastDayBeforeFirst': 'El último día tiene que ser posterior al día.',
  'place.spanTooLong': 'Un lugar no puede planearse para más de un año. Revisar el año.',
  'place.loadFailed': 'No se pudieron cargar los lugares de este viaje.',
  'place.saveFailed': 'No se pudo guardar este lugar.',
  'place.deleteFailed': 'No se pudo quitar este lugar.',
  'place.conflict':
    'Alguien más cambió este lugar mientras se estaba editando. No se perdió nada de lo escrito: al abrirlo de nuevo se ve su versión.',
  'place.typeUnknown': 'Tipo de marcador desconocido.',

  // ── Opening hours ────────────────────────────────────────────────────────
  'hours.needsADay': 'Elegir al menos un día en que abre.',
  'hours.needsOneRange': 'Cada día abierto necesita un horario.',
  'hours.rangesDiffer': 'Todos los días abiertos necesitan el mismo horario.',
  'hours.needsBothTimes': 'Ingresar las dos horas.',
  'hours.timeMalformed': 'Escribir las horas así: 09:00.',

  // ── A second currency on a city ──────────────────────────────────────────
  'currency.malformed': 'Una moneda es un código de tres letras, como JPY.',
  'currency.alreadyDollars': 'Los dólares estadounidenses ya son el primer precio.',

  // ── The people on a trip ─────────────────────────────────────────────────
  'member.needsDisplayName': 'Ingresar el nombre que se muestra en este viaje.',
  'member.displayNameTooLong': 'Un nombre puede tener 60 caracteres como máximo.',
  'member.loadFailed': 'No se pudieron cargar las personas de este viaje.',
  'member.inviteFailed': 'No se pudo agregar a esa persona.',
  'member.duplicate': 'Ya hay alguien con ese email en este viaje.',
  'member.removeFailed': 'No se pudo retirar esa invitación.',
  'member.alreadyClaimed':
    'Se sumó mientras esta lista estaba abierta, así que su invitación ya es una membresía y no se retiró.',
  'member.takeBackLabel': 'Retirar',
  'member.takeBackConfirm': 'Retirarla',
  'member.takeBackDecline': 'Cancelar',
  'member.takeBackQuestion': (v: { name: string }) => `¿Retirar la invitación de ${v.name}?`,
  'member.takeBackConsequence': (v: { email: string }) =>
    `${v.email} sale del viaje. Nada más cambia, y se puede volver a invitar a esa dirección.`,

  // ── Who wants to go where, and what has been seen ────────────────────────
  'interest.loadFailed': 'No se pudo cargar quién quiere ir a dónde.',
  'interest.saveFailed': 'No se pudo guardar eso.',
  'visited.saveFailed': 'No se pudo cambiar si este lugar fue visitado.',

  // ── What an empty field on a place's card says ───────────────────────────
  'empty.day': 'Sin día todavía',
  'empty.note': 'Sin nota todavía',
  'empty.link': 'Sin enlace todavía',
  'empty.hours': 'Sin horario todavía',
  'empty.city': 'Sin asignar',

  // ── Days, and a stretch of them ──────────────────────────────────────────
  'days.stretch': (v: { days: string }) => v.days,
  'days.from': (v: { day: string }) => `Desde el ${v.day}`,
  'days.until': (v: { day: string }) => `Hasta el ${v.day}`,
  'days.runPosition': (v: { index: number; total: number }) => `Día ${v.index} de ${v.total}`,

  // ── A price ──────────────────────────────────────────────────────────────
  'price.free': 'Gratis',
  'price.amounts': (v: { amounts: string }) => v.amounts,

  // ── Opening hours, as the form and the card word them ────────────────────
  'hours.openEveryDay': 'Abre todos los días',
  'hours.openOn': (v: { days: string }) => `Abre ${v.days}`,
  'hours.openAllDay': 'Abre todo el día',
  'hours.closesNextDay': (v: { time: string }) => `Cierra a las ${v.time} del día siguiente`,
  'hours.everyDay': 'Todos los días',
  'hours.days': (v: { days: string }) => v.days,
  'hours.closed': 'Cerrado',
  'hours.allDay': '24 horas',
  'hours.between': (v: { open: string; close: string }) => `${v.open}–${v.close}`,

  // ── Finding a place by name ──────────────────────────────────────────────
  'search.unavailable': 'La búsqueda de lugares no está disponible en este momento.',

  // ── What each thing the map is built from does ───────────────────────────
  'credit.openstreetmap': 'Los datos del mapa, aportados por su comunidad.',
  'credit.openmaptiles': 'El esquema en el que se empaquetan los datos.',
  'credit.openfreemap': 'Sirve las teselas, sin costo y sin cuenta.',
  'credit.maplibre': 'Dibuja el mapa en la pantalla.',

  // ── What a marker's type is called ───────────────────────────────────────
  'markerType.place': 'Lugar',
  'markerType.temple': 'Templo',
  'markerType.culture': 'Cultura',
  'markerType.nature': 'Naturaleza',
  'markerType.food': 'Comida',
  'markerType.shopping': 'Compras',
  'markerType.stay': 'Alojamiento',
  'markerType.transport': 'Transporte',


  // ── Words used across the product ─────────────────────────────────────────

  'app.name': 'pinpoint',
  'app.description': 'Un mapa para marcar lugares.',
  'common.cancel': 'Cancelar',
  'common.close': 'Cerrar',
  'common.save': 'Guardar',
  'common.saving': 'Guardando…',
  'common.creating': 'Creando…',
  'common.back': 'Volver',
  'common.backToMap': 'Volver al mapa',
  'common.done': 'Listo',
  'common.remove': 'Quitar',
  'common.discard': 'Descartar',
  'common.edit': 'Editar',
  'common.settings': 'Ajustes',

  // ── Signing in, the account, settings and the shells around every screen ──

  'common.tryAgain': 'Reintentar',

  'auth.email': 'Email',
  'auth.password': 'Contraseña',
  'auth.repeatPassword': 'Repetir contraseña',
  'auth.signIn': 'Iniciar sesión',
  'auth.signingIn': 'Iniciando sesión…',
  'auth.createAnAccount': 'Crear una cuenta',
  'auth.createAccount': 'Crear cuenta',
  'auth.creatingAccount': 'Creando cuenta…',
  'auth.invitedHint':
    'Si hubo una invitación, usar la dirección a la que llegó — es lo que vincula la cuenta con el viaje.',
  'auth.noAccountYet': '¿Todavía sin cuenta?',
  'auth.createOne': 'Crear una',
  'auth.haveAccount': '¿Ya con cuenta?',

  'account.label': 'Cuenta',
  'account.signedIn': 'Sesión iniciada',
  'account.signOut': 'Cerrar sesión',

  'settings.documentTitle': 'Ajustes · pinpoint',
  'settings.signedInAs': 'Sesión iniciada como',
  'settings.loadingAccount': 'Cargando la cuenta',
  'settings.noAddress': 'Esta cuenta no tiene dirección',
  'settings.appearance': 'Apariencia',
  'settings.language': 'Idioma',
  'settings.followDevice': 'Según el dispositivo',
  'appearance.systemNote': 'Cambia con la apariencia del sistema',
  'appearance.light': 'Claro',
  'appearance.lightNote': 'Siempre el fondo claro',
  'appearance.dark': 'Oscuro',
  'appearance.darkNote': 'Siempre el fondo oscuro',
  'language.systemNote': 'Usa el idioma configurado en el dispositivo',
  'language.english': 'English',
  'language.englishNote': 'Siempre en inglés',
  'language.spanish': 'Español',
  'language.spanishNote': 'Siempre en español',

  'loading.map': 'Cargando el mapa…',
  'loading.trip': 'Cargando el viaje…',
  'error.mapFailed': 'Algo falló al cargar el mapa.',
  'map.noPlacesYet': 'Todavía no hay lugares guardados en este viaje.',
  'calendar.noTrip': 'No hay ningún viaje del que mostrar un calendario.',

  'priceField.label': 'Precio',
  'priceField.blankHint': 'Dejar en blanco si no se sabe.',
  'priceField.blankHintEither': 'Dejar un importe en blanco si no se sabe.',
  'priceField.inDollars': 'Precio en dólares estadounidenses',
  'priceField.inCurrency': (v) => `Precio en ${v.currency}`,

  'dayField.spokenEmpty': (v) => `${v.label}, sin día todavía`,
  'dayField.spokenDay': (v) => `${v.label}, ${v.day}`,
  'dayField.clear': (v) => `Borrar ${v.label.toLowerCase()}`,

  'credits.title': 'Sobre este mapa',
  'credits.blurb': 'Cuatro proyectos, ninguno nuestro.',
  'credits.spoken': (v) => `${v.name}. ${v.does}`,

  // ── A place: its form, its card, its pin ──────────────────────────────────

  'common.editNamed': (v: { name: string }) => `Editar ${v.name}`,
  'common.removeNamed': (v: { name: string }) => `Quitar ${v.name}`,
  'common.opensInBrowser': 'Se abre en el navegador',

  'placeField.name': 'Nombre',
  'placeField.type': 'Tipo',
  'placeField.city': 'Ciudad',
  'placeField.day': 'Día',
  'placeField.until': 'Hasta',
  'placeField.hours': 'Horario',
  'placeField.note': 'Nota',
  'placeField.link': 'Enlace',
  'placeField.whoWantsToGo': 'Quién quiere ir',
  'placeField.visited': 'Visitado',

  'placeForm.namePlaceholder': '¿Cómo se llama este lugar?',
  'placeForm.notePlaceholder': '¿Por qué vale la pena ir?',
  'placeForm.linkPlaceholder': 'https://…',
  'placeForm.newCityOption': '+ Nueva ciudad…',
  'placeForm.newCityChip': '+ Nueva ciudad',
  'placeForm.dayHint': 'Qué día del viaje se planea ir. Dejarlo vacío para decidirlo después.',
  'placeForm.moreThanOneDay': '+ Más de un día',
  'placeForm.untilHint': 'El último día planeado. Borrarlo para volver a un solo día.',
  'placeForm.createOffered': (v: { name: string }) => `Crear ${v.name}`,
  'placeForm.newCityName': 'Nombre de la nueva ciudad',
  'placeForm.newCityPlaceholder': 'Kioto',
  'placeForm.newCityCurrencyHint': (v: { city: string; currency: string }) =>
    `Los lugares de ${v.city} tienen un campo de precio en ${v.currency} junto a los dólares.`,
  'placeForm.newCityCurrencyHintUnnamed': (v: { currency: string }) =>
    `Los lugares de esta ciudad tienen un campo de precio en ${v.currency} junto a los dólares.`,
  'placeForm.createCityFailed': 'No se pudo crear esa ciudad.',
  'placeForm.localPriceHint': (v: { currency: string; city: string }) =>
    `${v.currency} es la moneda de ${v.city}. Escribir el precio tal como se vio; no se convierte nada.`,
  'placeForm.localPriceClearedUnfiled': (v: { amount: string }) =>
    `Dejar este lugar sin ciudad borra el precio de ${v.amount} guardado.`,
  'placeForm.localPriceClearedMoved': (v: { city: string; amount: string }) =>
    `Pasarlo a ${v.city} borra el precio de ${v.amount} guardado para este lugar.`,
  'placeForm.discardQuestion': '¿Descartar lo escrito?',
  'placeForm.discardCapture': 'El lugar encontrado en el mapa también se descarta.',
  'placeForm.discardEdit': 'Los cambios en este lugar no se guardan.',
  'placeForm.save': 'Guardar lugar',
  'placeForm.sheetHeight': 'Altura del panel',
  'placeForm.sheetHalf': 'Media pantalla',
  'placeForm.sheetFull': 'Casi pantalla completa',
  'placeForm.adjustPosition': 'Ajustar la posición en el mapa',
  'placeForm.removeQuestion': '¿Quitar este lugar?',
  'placeForm.remove': 'Quitar este lugar',

  'placeCard.removeQuestionQuoted': (v: { name: string }) => `¿Quitar “${v.name}”?`,
  'placeCard.removeQuestion': (v: { name: string }) => `¿Quitar ${v.name}?`,
  'placeCard.cannotBeUndone': 'No se puede deshacer.',
  'placeCard.othersHere': '← Otros en este punto',
  'placeCard.hidden':
    'Ya está guardado en este viaje. El filtro lo oculta, así que no se dibuja en el mapa.',
  'placeGroup.count': (v: { count: number }) => `${v.count} lugares aquí`,
  'placeGroup.note':
    'Comparten las mismas coordenadas, así que acercar el mapa no los separa. No se movió nada: elegir uno.',

  'pin.label': (v: { name: string; type: string }) => `${v.name} (${v.type})`,
  'pin.draft': 'El lugar que se está agregando',

  'hoursField.empty': 'Dejar vacío si no se sabe. Elegir los días que abre para agregar el horario.',
  'hoursField.opens': 'Abre',
  'hoursField.closes': 'Cierra',
  'hoursField.to': 'a',

  'currencyField.label': 'Segunda moneda',
  'currencyField.none': 'Ninguna',
  'currencyField.searchPlaceholder': 'Ninguna · buscar por nombre o código',
  'currencyField.searchPlaceholderShort': 'Buscar por nombre o código',
  'currencyField.search': 'Buscar monedas',
  'currencyField.noMatch': 'Ninguna moneda coincide.',
  'currencyField.noneHint': 'Dejar en Ninguna si los precios aquí son solo en dólares estadounidenses.',
  'currencyField.chooseLabel': 'Segunda moneda: ninguna. Elegir una',
  'currencyField.changeLabel': (v: { currency: string }) =>
    `Segunda moneda: ${v.currency}. Cambiarla`,

  // First person on the reader's own row, where the English says `You`: the
  // row is labelled from the reader's side, as its buttons already are
  // (`Not for me`), and a second-person Spanish would address the reader.
  'interest.you': 'Yo',
  'interest.wantToGo': 'Quiero ir',
  'interest.notForMe': 'No es para mí',
  'interest.wantsToGo': 'Quiere ir',
  'interest.notForThem': 'No le interesa',
  'interest.undecided': 'Sin decidir',
  'interest.youWantToGo': 'Quiero ir',
  'interest.notForYou': 'No me interesa',
  'interest.youHaveNotSaid': 'Todavía sin responder',
  'visited.on': '✓ Visitado',
  'visited.mark': 'Marcar visitado',

  // ── Trips, cities and the people on a trip ────────────────────────────────

  'common.clear': 'Borrar',
  'common.name': 'Nombre',
  'common.dismissMessage': 'Descartar este mensaje',
  'common.dismissesMessage': 'Descarta este mensaje',

  'trip.menuName': 'Viaje',
  'trip.trips': 'Viajes',
  'trip.currentNote': 'Abierto',
  'trip.rowLabel': (v) => `${v.name}, ${v.dates}`,
  'trip.renameThis': 'Renombrar este viaje',
  'trip.rename': 'Renombrar',
  'trip.name': 'Nombre del viaje',
  'trip.dates': 'Fechas del viaje',
  'trip.datesNone': 'Ninguna',
  'trip.datesSet': 'Definidas',
  'trip.startDate': 'Fecha de inicio',
  'trip.endDate': 'Fecha de fin',
  'trip.datesHint':
    'Las dos son opcionales. Solo deciden en qué día se abre el calendario.',
  'trip.people': 'Personas',
  'trip.new': 'Nuevo viaje',
  'trip.newNote':
    'Un viaje es un mapa compartido, aparte de este. Nada de aquí pasa al nuevo.',
  'trip.archiveThis': 'Archivar este viaje',
  'trip.archive': 'Archivar viaje',
  'trip.archiving': 'Archivando…',
  'trip.archiveNamed': (v) => `Archivar ${v.name}`,
  'trip.archiveHint': 'Guarda el viaje aparte. No se borra nada y se puede restaurar.',
  'trip.archivedTrips': 'Viajes archivados',
  'trip.archivedLooking': 'Buscando…',
  'trip.showArchived': 'Ver viajes archivados',
  'trip.showingArchived': 'Cargando…',
  'trip.archived': 'Archivados',
  'trip.nothingArchived': 'No hay nada archivado.',
  'trip.restoreNote': 'No se borró nada. Al restaurar un viaje vuelve todo lo que tenía.',
  'trip.restore': 'Restaurar',
  'trip.restoring': 'Restaurando…',
  'trip.restoreNamed': (v) => `Restaurar ${v.name}`,

  'tripSetup.title': 'Empezar un viaje',
  'tripSetup.lead':
    'Un viaje es un mapa compartido. Todas las personas que se agregan ven los mismos lugares.',
  'tripSetup.expectingQuestion': '¿Falta un viaje de otra persona?',
  'tripSetup.expectingAnswer':
    'Se agrega a las personas por su dirección de email, y el viaje aparece al iniciar sesión con esa misma dirección. Si no aparece, conviene comprobar que la dirección de la cuenta sea la que se agregó, y pedir que revisen las personas del viaje: quien todavía no se unió figura ahí con la dirección con la que se lo agregó.',
  'tripSetup.nameLabel': '¿Cómo se llama el viaje?',
  'tripSetup.namePlaceholder': 'Japón 2026',
  'tripSetup.displayNameLabel': '¿Con qué nombre aparecer en el viaje?',
  'tripSetup.displayNamePlaceholder': 'El nombre, como lo dirían los demás',
  'tripSetup.create': 'Crear viaje',

  'people.you': 'Yo',
  'people.notJoined': (v) => `todavía sin unirse · ${v.email}`,
  'people.takeBackNamed': (v) => `Retirar la invitación de ${v.name}`,
  'people.inviteHint':
    'Al agregar a alguien, queda en el viaje de inmediato. No se envía nada: hay que avisarle, y el viaje aparece cuando inicia sesión con esta dirección.',
  'people.email': 'Email',
  'people.namePlaceholder': 'El nombre que tendrá en este viaje',
  'people.emailPlaceholder': 'La dirección con la que iniciará sesión',
  'people.add': 'Agregar al viaje',
  'people.adding': 'Agregando…',

  'city.menuName': 'Ciudad',
  'city.cities': 'Ciudades',
  'city.workingOn': 'Trabajando en',
  'city.allPlaces': 'Todos los lugares',
  'city.unassigned': 'Sin asignar',
  'city.placeCount': (v) => (v.count === 1 ? '1 lugar' : `${v.count} lugares`),
  'city.allPlacesMeta': (v) =>
    `${v.count === 1 ? '1 lugar' : `${v.count} lugares`} · todo el viaje`,
  'city.none':
    'Todavía no hay ciudades. Se pueden nombrar los destinos, o crear una al guardar un lugar.',
  'city.new': 'Nueva ciudad…',
  'city.newHint': 'Agrega una ciudad a este viaje',
  'city.create': 'Crear ciudad',
  'city.editNamed': (v) => `Editar ${v.name}`,
  'city.pickNamed': (v) => `${v.name}. Trabajar en esta ciudad`,
  'city.currencyHint': (v) =>
    `Los lugares de ${v.city === '' ? 'esta ciudad' : v.city} tienen un campo de precio en ${v.currency} junto a los dólares.`,
  'city.remove': 'Quitar ciudad',
  'city.changeCurrency': 'Cambiar',
  'city.removeQuestionQuoted': (v) => `¿Quitar “${v.name}”?`,
  'city.removeQuestion': (v) => `¿Quitar ${v.name}?`,
  'city.removeCurrencyQuestionQuoted': (v) => `¿Quitar ${v.currency} de “${v.name}”?`,
  'city.removeCurrencyQuestion': (v) => `¿Quitar ${v.currency} de ${v.name}?`,
  'city.changeCurrencyQuestionQuoted': (v) => `¿Cambiar “${v.name}” a ${v.currency}?`,
  'city.changeCurrencyQuestion': (v) => `¿Cambiar ${v.name} a ${v.currency}?`,
  'city.currencyRemovedConsequence': (v) =>
    v.count === 1
      ? `1 lugar de ${v.name} tiene un precio en ${v.currency}. Lo va a perder. Su precio en USD se mantiene.`
      : `${v.count} lugares de ${v.name} tienen un precio en ${v.currency}. Lo van a perder. Sus precios en USD se mantienen.`,
  'city.currencyChangedConsequence': (v) =>
    v.count === 1
      ? `1 lugar de ${v.name} tiene un precio en ${v.currency}. Lo va a perder, no se convierte. Su precio en USD se mantiene.`
      : `${v.count} lugares de ${v.name} tienen un precio en ${v.currency}. Lo van a perder, no se convierte. Sus precios en USD se mantienen.`,
  'city.removeConsequence': (v) => {
    if (v.places === 0) return 'No tiene lugares.'
    const unassigned =
      v.places === 1
        ? '1 lugar va a quedar sin asignar. No se borra.'
        : `${v.places} lugares van a quedar sin asignar. No se borran.`
    if (v.local === 0) return unassigned
    return `${unassigned} ${localLoss(v)}`
  },
  'city.removeConsequenceStays': (v) => {
    if (v.places === 0) return 'No hay nada en ella.'
    const stays =
      v.places === 1
        ? '1 lugar sigue en el viaje y queda sin asignar.'
        : `${v.places} lugares siguen en el viaje y quedan sin asignar.`
    if (v.local === 0) return stays
    return `${stays} ${localLoss(v)}`
  },

  // ── The map, finding a place, and the filter ──────────────────────────────

  'map.zoom': 'Zoom',
  'map.zoomIn': 'Acercar',
  'map.zoomOut': 'Alejar',
  'map.reread': 'Volver a leer todo',
  'map.loading': 'Cargando el mapa',
  'map.placesHere': (v) => `${v.count} lugares aquí`,
  'map.placeOfType': (v) => `${v.name} (${v.type})`,
  'map.draftPin': 'Lugar nuevo, sin guardar',
  'map.draftPinHint': 'Arrastrar para ajustar y luego guardar',
  'map.styleFailed': 'No se pudo cargar el mapa',
  'map.styleFailedDetail': (v) =>
    `Los datos de los lugares están bien — ${v.reason}. Los lugares guardados siguen aquí; solo falta el mapa que va debajo.`,
  'map.styleFailedReason': 'no se pudo cargar el estilo del mapa',
  'map.styleRefused': (v) => `el servicio de mapas respondió ${v.status}`,
  'map.credits': 'Créditos de los datos del mapa',
  'map.creditsHint': 'Abre los proyectos con los que se hizo este mapa',

  'map.tools': 'Herramientas del viaje',
  'map.searchTool': 'Buscar',
  'map.closeSearch': 'Cerrar la búsqueda',
  'map.dropPin': '+ Colocar un pin',
  'map.dropPinShort': 'Colocar',
  'map.dropPinHint': 'Colocar un pin en el mapa',
  'map.dropBanner':
    'Hacer clic en el mapa donde está el lugar. El pin se puede arrastrar después.',
  'map.sightHint': 'Mover el mapa hasta dejar el lugar bajo el anillo.',
  'map.useSpot': 'Usar este punto',
  'map.otherViewCalendar': 'Calendario',
  'map.backToCalendar': '← Volver al calendario',
  'map.cityHintAll': 'Todos los lugares. Elegir una ciudad para trabajar',
  'map.cityHint': (v) => `${v.name}. Cambiar la ciudad de trabajo`,
  'map.editPlaceTitle': 'Editar este lugar',
  'map.savePlaceTitle': 'Guardar este lugar',

  'map.dismiss': 'Descartar',
  'map.noMatches': (v) =>
    `Ningún lugar coincide con este filtro. El viaje todavía tiene ${v.count} ${v.count === 1 ? 'lugar' : 'lugares'}.`,
  'map.noMatchesTap': (v) =>
    `Ningún lugar coincide con este filtro. El viaje todavía tiene ${v.count} ${v.count === 1 ? 'lugar' : 'lugares'} — tocar para quitarlo.`,
  'map.matchesOutOfView': (v) =>
    `${v.count} ${v.count === 1 ? 'lugar coincide' : 'lugares coinciden'}, ninguno a la vista.`,
  'map.matchesOutOfViewTap': (v) =>
    `${v.count} ${v.count === 1 ? 'lugar coincide' : 'lugares coinciden'}, ninguno a la vista — tocar para ${v.count === 1 ? 'mostrarlo' : 'mostrarlos'}.`,
  'map.showMatches': (v) => (v.count === 1 ? 'Mostrarlo' : 'Mostrarlos'),

  'map.rereadFailed': 'No se pudo volver a leer el viaje. Revisar la conexión.',
  'map.saveCityFailed': 'No se pudo guardar esa ciudad.',
  'map.removeCityFailed': 'No se pudo quitar esa ciudad.',
  'tripActions.renameFailed': 'No se pudo renombrar este viaje.',
  'tripActions.datesFailed': 'No se pudieron guardar estas fechas.',
  'tripActions.archiveFailed': 'No se pudo archivar este viaje.',
  'tripActions.restoreFailed': 'No se pudo restaurar este viaje.',

  'search.label': 'Buscar un lugar',
  'search.placeholder': 'Buscar un lugar…',
  'search.searching': 'Buscando…',
  'search.announceSearching': 'Buscando lugares',
  'search.intro':
    'Buscar un sitio por su nombre. Si no aparece —y los lugares pequeños, nuevos o con nombre local a menudo no aparecen—, cerrar esto y colocar un pin.',
  'search.failed': (v) => `${v.reason} Igual se puede agregar un lugar colocando un pin.`,
  'search.empty': 'Sin resultados. Probar con menos palabras, o colocar un pin.',
  'search.distance': (v) => `${v.distance} km`,

  'filter.name': 'Filtro',
  'filter.hint': 'Filtrar este viaje',
  'filter.hintNarrowed': 'Filtrar este viaje. Hay lugares ocultos',
  'filter.questionSpoken': (v) => `${v.name}. ${v.said}`,
  'filter.wantedBy': 'Quién quiere ir',
  'filter.wantedByHeading': 'Lugares que quieren todos ellos',
  'filter.everyone': 'Todos',
  'filter.anyone': 'Cualquiera',
  'filter.nobodyAnswered': 'Nadie respondió todavía',
  'filter.nobodyAnsweredSaid': 'Nadie respondió',
  'filter.kind': 'Tipo de lugar',
  'filter.kindHeading': 'Lugares de cualquiera de estos',
  'filter.anyKind': 'Cualquier tipo',
  'filter.day': 'Día',
  'filter.dayHeading': 'Lugares en cualquiera de estos días',
  'filter.anyDay': 'Cualquier día',
  'filter.noDay': 'Sin día',
  'filter.noDays': 'Todavía no hay nada planeado para ningún día.',
  'filter.unfiled': 'Sin ciudad asignada',
  'filter.hideVisited': 'Ocultar visitados',
  'filter.clear': 'Quitar el filtro',
  'filter.clearShort': 'Quitar',
  'filter.listOne': (v) => v.word,
  'filter.listAnd': (v) => `${v.head} y ${v.last}`,

  // ── The calendar ──────────────────────────────────────────────────────────

  'calendar.loading': 'Cargando el calendario',
  'calendar.views': 'Calendario',
  'calendar.days': 'Días',
  'calendar.noDayYet': 'Sin día',
  'calendar.waitingCountSpoken': (v: { count: number }) =>
    v.count === 1 ? ', 1 lugar' : `, ${v.count} lugares`,
  'calendar.noDayYetCounted': (v: { count: number }) =>
    v.count === 1 ? 'Sin día, 1 lugar' : `Sin día, ${v.count} lugares`,
  'calendar.nothingWaiting': 'No queda nada sin día.',
  'calendar.cityGroup': (v: { city: string; count: number }) => `${v.city} · ${v.count}`,
  'calendar.nothingPlanned': 'Nada planeado.',
  'calendar.previousDay': 'Día anterior',
  'calendar.nextDay': 'Día siguiente',
  'calendar.previousDayTo': (v: { day: string }) => `Día anterior, ${v.day}`,
  'calendar.nextDayTo': (v: { day: string }) => `Día siguiente, ${v.day}`,
  'calendar.dayField': 'Día',
  'calendar.visited': 'Visitado',
  'calendar.visitedPill': 'VISITADO',
  'calendar.placeRowSpoken': (v: { name: string; run: string; visited: number }) =>
    [v.name, v.run === '' ? null : v.run, v.visited ? 'visitado' : null]
      .filter((part) => part !== null)
      .join(', '),
  'calendar.tripButton': (v: { name: string }) => `${v.name}. Cambiar o gestionar viajes`,
  'calendar.tripButtonWaiting': 'Viaje',
  'calendar.menu': 'Menú',
  'calendar.otherViewMap': 'Mapa',
  'calendar.viewOnMap': 'Ver en el mapa',
  'calendar.editPlace': 'Editar lugar',
  'calendar.removeFailed': 'No se pudo quitar ese lugar.',
}

/**
 * The local-price half of a city's removal, in Spanish.
 *
 * Its own function because Spanish words it by the count of places losing a
 * price alone, where English leads with `It` for a city of one place.
 */
function localLoss(v: { places: number; local: number; currency: string }): string {
  if (v.places === 1) return `Pierde su precio en ${v.currency}; su precio en USD se mantiene.`
  return v.local === 1
    ? `1 de ellos pierde su precio en ${v.currency}; su precio en USD se mantiene.`
    : `${v.local} de ellos pierden su precio en ${v.currency}; sus precios en USD se mantienen.`
}
