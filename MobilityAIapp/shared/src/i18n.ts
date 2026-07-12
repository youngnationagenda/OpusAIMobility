/**
 * OmniRide i18n — TERRA-072
 * ───────────────────────────
 * Lightweight translation system supporting:
 *   - English (en) — default
 *   - Swahili (sw) — primary East African language
 *   - Arabic (ar)  — Middle East / North Africa
 *
 * Usage:
 *   import { t, setLocale, getLocale } from '@opusaimobility/common/i18n';
 *   t('book_ride')        // → "Book a Ride" | "Piga Buku la Safari" | "احجز رحلة"
 *   setLocale('sw');
 *   t('wallet_balance')   // → "Salio la Mkoba"
 *
 * RTL support: `isRTL()` returns true for Arabic — use to flip layout.
 */

export type Locale = 'en' | 'sw' | 'ar';

// ── Translation dictionary ────────────────────────────────────────────────────

const translations: Record<string, Record<Locale, string>> = {
  // ── Navigation ──────────────────────────────────────────────────────────────
  book_ride:           { en: 'Book a Ride',          sw: 'Piga Buku la Safari',      ar: 'احجز رحلة'          },
  order_food:          { en: 'Order Food',            sw: 'Agiza Chakula',             ar: 'اطلب طعاماً'         },
  deliveries:          { en: 'Deliveries',            sw: 'Usafirishaji',              ar: 'التوصيلات'           },
  errands:             { en: 'Errands',               sw: 'Shughuli',                  ar: 'المهام'              },
  wallet:              { en: 'Wallet',                sw: 'Mkoba',                     ar: 'المحفظة'             },
  profile:             { en: 'Profile',               sw: 'Wasifu',                    ar: 'الملف الشخصي'        },
  notifications:       { en: 'Notifications',         sw: 'Arifa',                     ar: 'الإشعارات'           },
  settings:            { en: 'Settings',              sw: 'Mipangilio',                ar: 'الإعدادات'           },
  sign_out:            { en: 'Sign Out',              sw: 'Toka',                      ar: 'تسجيل الخروج'        },
  sign_in:             { en: 'Sign In',               sw: 'Ingia',                     ar: 'تسجيل الدخول'        },
  sign_up:             { en: 'Sign Up',               sw: 'Jisajili',                  ar: 'إنشاء حساب'          },

  // ── Ride booking ────────────────────────────────────────────────────────────
  pickup_location:     { en: 'Pickup Location',       sw: 'Mahali pa Kuchukua',        ar: 'موقع الاستلام'       },
  destination:         { en: 'Destination',           sw: 'Unakoelekea',               ar: 'الوجهة'              },
  confirm_ride:        { en: 'Confirm Ride',          sw: 'Thibitisha Safari',          ar: 'تأكيد الرحلة'        },
  cancel_ride:         { en: 'Cancel Ride',           sw: 'Futa Safari',               ar: 'إلغاء الرحلة'        },
  driver_en_route:     { en: 'Driver is on the way',  sw: 'Dereva anakuja',            ar: 'السائق في الطريق'    },
  ride_completed:      { en: 'Ride Completed',        sw: 'Safari Imekamilika',         ar: 'اكتملت الرحلة'       },
  estimated_arrival:   { en: 'Estimated Arrival',     sw: 'Muda wa Kuwasili',           ar: 'وقت الوصول المقدر'   },
  scan_nearby:         { en: 'Scan Nearby Drivers',   sw: 'Tafuta Madereva Karibu',    ar: 'ابحث عن سائقين قريبين'},

  // ── Wallet & payments ───────────────────────────────────────────────────────
  wallet_balance:      { en: 'Wallet Balance',        sw: 'Salio la Mkoba',            ar: 'رصيد المحفظة'        },
  top_up:              { en: 'Top Up',                sw: 'Ongeza Pesa',               ar: 'إضافة رصيد'          },
  transfer:            { en: 'Transfer',              sw: 'Hamisha',                   ar: 'تحويل'               },
  payment_history:     { en: 'Payment History',       sw: 'Historia ya Malipo',         ar: 'سجل المدفوعات'       },
  transaction_success: { en: 'Transaction Successful',sw: 'Malipo Yamefanikiwa',        ar: 'تمت المعاملة بنجاح'  },
  insufficient_funds:  { en: 'Insufficient Funds',   sw: 'Pesa Haitoshi',             ar: 'رصيد غير كافٍ'       },

  // ── Rider dashboard ─────────────────────────────────────────────────────────
  go_online:           { en: 'Go Online',             sw: 'Ingia Mtandaoni',           ar: 'الذهاب للإنترنت'     },
  go_offline:          { en: 'Go Offline',            sw: 'Toka Mtandaoni',            ar: 'الخروج من الإنترنت'  },
  accept_mission:      { en: 'Accept Mission',        sw: 'Kubali Kazi',               ar: 'قبول المهمة'         },
  complete_mission:    { en: 'Complete Mission',      sw: 'Maliza Kazi',               ar: 'إتمام المهمة'        },
  battery_status:      { en: 'Battery Status',        sw: 'Hali ya Betri',             ar: 'حالة البطارية'       },
  swap_battery:        { en: 'Swap Battery',          sw: 'Badilisha Betri',           ar: 'استبدال البطارية'    },
  earnings_today:      { en: "Today's Earnings",      sw: 'Mapato ya Leo',             ar: 'أرباح اليوم'         },

  // ── Common UI ───────────────────────────────────────────────────────────────
  loading:             { en: 'Loading...',            sw: 'Inapakia...',               ar: 'جارٍ التحميل...'     },
  retry:               { en: 'Retry',                 sw: 'Jaribu Tena',               ar: 'أعد المحاولة'        },
  save:                { en: 'Save',                  sw: 'Hifadhi',                   ar: 'حفظ'                 },
  cancel:              { en: 'Cancel',                sw: 'Futa',                      ar: 'إلغاء'               },
  confirm:             { en: 'Confirm',               sw: 'Thibitisha',                ar: 'تأكيد'               },
  search:              { en: 'Search',                sw: 'Tafuta',                    ar: 'بحث'                 },
  no_results:          { en: 'No results found',      sw: 'Hakuna matokeo',            ar: 'لا توجد نتائج'       },
  error:               { en: 'Something went wrong',  sw: 'Hitilafu imetokea',         ar: 'حدث خطأ ما'          },
  offline_mode:        { en: 'You are offline',       sw: 'Uko nje ya mtandao',        ar: 'أنت غير متصل بالإنترنت'},
  data_syncing:        { en: 'Syncing data...',       sw: 'Inasawazisha data...',      ar: 'جارٍ مزامنة البيانات...' },

  // ── Food ordering ───────────────────────────────────────────────────────────
  add_to_cart:         { en: 'Add to Cart',           sw: 'Weka Kwenye Kikapu',        ar: 'أضف للسلة'           },
  place_order:         { en: 'Place Order',           sw: 'Weka Agizo',                ar: 'تقديم الطلب'         },
  order_tracking:      { en: 'Track Order',           sw: 'Fuatilia Agizo',            ar: 'تتبع الطلب'          },
  preparing:           { en: 'Preparing',             sw: 'Inatayarishwa',             ar: 'قيد التحضير'         },
  on_the_way:          { en: 'On the Way',            sw: 'Njiani',                    ar: 'في الطريق'           },
  delivered:           { en: 'Delivered',             sw: 'Imefikishwa',               ar: 'تم التسليم'          },

  // ── Carbon & DeFi ───────────────────────────────────────────────────────────
  carbon_credits:      { en: 'Carbon Credits',        sw: 'Mikopo ya Kaboni',          ar: 'اعتمادات الكربون'    },
  trade_credits:       { en: 'Trade Credits',         sw: 'Fanya Biashara',            ar: 'تداول الاعتمادات'    },
  eco_score:           { en: 'Eco Score',             sw: 'Alama za Mazingira',         ar: 'نقاط البيئة'         },
  asset_loan:          { en: 'Asset Loan',            sw: 'Mkopo wa Mali',             ar: 'قرض الأصول'          },
  daily_repayment:     { en: 'Daily Repayment',       sw: 'Malipo ya Kila Siku',        ar: 'السداد اليومي'       },
  loan_completed:      { en: 'Loan Fully Repaid!',    sw: 'Mkopo Umelipwa Kikamilifu!', ar: 'تم سداد القرض بالكامل!'},
};

// ── State ─────────────────────────────────────────────────────────────────────

let _currentLocale: Locale = (
  (typeof localStorage !== 'undefined' && localStorage.getItem('omniride-locale') as Locale) ||
  'en'
);

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Translate a key to the current locale.
 * Falls back to English if key/locale not found.
 */
export function t(key: string, fallback?: string): string {
  const entry = translations[key];
  if (!entry) return fallback ?? key;
  return entry[_currentLocale] ?? entry['en'] ?? fallback ?? key;
}

/**
 * Set the active locale. Persists to localStorage.
 * Also sets the HTML `dir` attribute for RTL support.
 */
export function setLocale(locale: Locale): void {
  _currentLocale = locale;
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('omniride-locale', locale);
  }
  if (typeof document !== 'undefined') {
    document.documentElement.lang = locale;
    document.documentElement.dir  = isRTL(locale) ? 'rtl' : 'ltr';
  }
}

/**
 * Get the current active locale.
 */
export function getLocale(): Locale {
  return _currentLocale;
}

/**
 * Returns true if the given (or current) locale is right-to-left.
 */
export function isRTL(locale?: Locale): boolean {
  return (locale ?? _currentLocale) === 'ar';
}

/**
 * Get all available locales with display names.
 */
export const LOCALES: { code: Locale; name: string; nativeName: string; flag: string }[] = [
  { code: 'en', name: 'English',  nativeName: 'English',   flag: '🇬🇧' },
  { code: 'sw', name: 'Swahili',  nativeName: 'Kiswahili', flag: '🇰🇪' },
  { code: 'ar', name: 'Arabic',   nativeName: 'العربية',   flag: '🇸🇦' },
];

/**
 * React hook for reactive translations.
 * Components re-render when locale changes.
 */
import { useState, useEffect, useCallback } from 'react';

export function useTranslation() {
  const [locale, setLocaleState] = useState<Locale>(_currentLocale);

  const changeLocale = useCallback((newLocale: Locale) => {
    setLocale(newLocale);
    setLocaleState(newLocale);
  }, []);

  return {
    t,
    locale,
    setLocale: changeLocale,
    isRTL:     isRTL(locale),
    locales:   LOCALES,
  };
}
