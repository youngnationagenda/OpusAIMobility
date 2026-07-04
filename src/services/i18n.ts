
import { Language } from '../types';

const translations = {
  en: {
    welcome: 'Welcome back',
    rides: 'Rides',
    food: 'Food',
    send: 'Send',
    fix: 'Fix',
    history: 'History',
    account: 'Account',
    whereTo: 'Where to?',
    confirm: 'Confirm',
    bookNow: 'Book Now',
    searching: 'Searching for your ride...',
    parcel: 'Send a Parcel',
    mechanics: 'Nearby Mechanics',
  },
  es: {
    welcome: 'Bienvenido de nuevo',
    rides: 'Viajes',
    food: 'Comida',
    send: 'Enviar',
    fix: 'Reparar',
    history: 'Historial',
    account: 'Cuenta',
    whereTo: '¿A dónde vas?',
    confirm: 'Confirmar',
    bookNow: 'Reservar Ahora',
    searching: 'Buscando tu viaje...',
    parcel: 'Enviar un paquete',
    mechanics: 'Mecánicos cercanos',
  },
  fr: {
    welcome: 'Bon retour',
    rides: 'Courses',
    food: 'Nourriture',
    send: 'Envoyer',
    fix: 'Réparer',
    history: 'Activité',
    account: 'Compte',
    whereTo: 'Où allez-vous ?',
    confirm: 'Confirmer',
    bookNow: 'Réserver',
    searching: 'Recherche de votre course...',
    parcel: 'Envoyer un colis',
    mechanics: 'Mécaniciens à proximité',
  },
  zh: {
    welcome: '欢迎回来',
    rides: '打车',
    food: '美食',
    send: '寄送',
    fix: '维修',
    history: '历史记录',
    account: '账户',
    whereTo: '去哪儿？',
    confirm: '确认',
    bookNow: '立即预订',
    searching: '正在为您寻找车辆...',
    parcel: '寄送包裹',
    mechanics: '附近的维修店',
  }
};

export const t = (key: keyof typeof translations['en'], lang: Language = 'en') => {
  return translations[lang]?.[key] || translations['en'][key];
};
