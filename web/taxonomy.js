// Разделы приложения и классификация товара по названию (LV + RU), а не по магазину:
// стиральный порошок из Maxima → «Бытовая химия», корм для собак из Rimi → «Животные».
// Текст нормализуется: нижний регистр, без диакритики (ā→a, š→s, ё→е).

export const SECTIONS = [
  { id: 'food', short: 'Еда и напитки', name: 'Еда и напитки', icon: '🍎', subs: [
    ['dairy', 'Молочное и яйца'], ['meat', 'Мясо и рыба'], ['produce', 'Овощи и фрукты'], ['bread', 'Хлеб и выпечка'],
    ['grocery', 'Бакалея'], ['sweets', 'Сладкое и снеки'], ['frozen', 'Заморозка и готовое'], ['drinks', 'Напитки'],
    ['alcohol', 'Алкоголь'], ['foodother', 'Другие продукты'],
  ] },
  { id: 'fastfood', short: 'Фастфуд, пицца', name: 'Фастфуд, пицца и кафе', icon: '🍔', subs: [['burgers', 'Бургеры'], ['pizza', 'Пицца'], ['chicken', 'Курица'], ['coffee', 'Кофе и выпечка'], ['ffother', 'Другое']] },
  { id: 'household', short: 'Химия и гигиена', name: 'Бытовая химия и гигиена', icon: '🧴', subs: [
    ['laundry', 'Стирка'], ['dishes', 'Мытьё посуды'], ['cleaning', 'Уборка'], ['paper', 'Бумага и салфетки'], ['hygiene', 'Гигиена и уход'],
  ] },
  { id: 'kids', short: 'Детям', name: 'Детям', icon: '🧸', subs: [['diapers', 'Подгузники и уход'], ['babyfood', 'Детское питание'], ['toys', 'Игрушки'], ['kidwear', 'Одежда и обувь'], ['gear', 'Коляски и автокресла'], ['kidsother', 'Другое']] },
  { id: 'beauty', short: 'Красота, аптека', name: 'Красота и аптека', icon: '💄', subs: [] },
  { id: 'home', short: 'Дом и сад', name: 'Дом, сад и ремонт', icon: '🏠', subs: [['kitchen', 'Кухня и посуда'], ['decor', 'Декор и текстиль'], ['furniture', 'Мебель'], ['garden', 'Сад'], ['diy', 'Ремонт и инструменты'], ['homeother', 'Другое']] },
  { id: 'pets', short: 'Животные', name: 'Животные', icon: '🐾', subs: [] },
  { id: 'electronics', short: 'Техника', name: 'Электроника и техника', icon: '🔌', subs: [] },
  { id: 'fashion', short: 'Одежда', name: 'Одежда и обувь', icon: '👗', subs: [] },
  { id: 'sport', short: 'Спорт', name: 'Спорт и отдых', icon: '⚽', subs: [] },
  { id: 'books', short: 'Книги', name: 'Книги и канцелярия', icon: '📚', subs: [] },
  { id: 'auto', short: 'Авто', name: 'Авто и топливо', icon: '⛽', subs: [] },
  { id: 'services', short: 'Услуги', name: 'Связь, досуг, поездки', icon: '🎟️', subs: [] },
  { id: 'catalogs', short: 'Буклеты', name: 'Буклеты акций', icon: '📖', subs: [] },
];

export const SECTION_BY_ID = Object.fromEntries(SECTIONS.map((s) => [s.id, s]));
export const subName = (sec, sub) => SECTION_BY_ID[sec]?.subs.find(([id]) => id === sub)?.[1] ?? '';

export const norm = (s) => String(s ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ё/g, 'е');

const R = (src) => new RegExp(src, 'i');

// Порядок важен: сначала непищевое (чтобы «piena šokolāde» не ушла в молочное, а «veļas kapsulas» в еду).
const NONFOOD = [
  ['pets', null, R(String.raw`\b(sun(u|iem|s|a)|kak(u|iem|is|im)|kucen\w*|kakenu|barib\w*|dzivniek\w*|akvarij\w*|pakaisi\w*|grauzej\w*|kraukskin\w* sun|для (собак|кошек|щенков|котят|животных)|корм\b|корм для)`)],
  ['kids', 'diapers', R(String.raw`\b(autinb\w*|moony|autinbiks\w*|autinbikses|pampers|huggies|libero|mitras salvetes|подгуз)`)],
  ['kids', 'babyfood', R(String.raw`\b(biezen\w*|bernu biezen\w*|zidainu (maisijum|biezen|putr)\w*|piena maisijum\w*|hipp|semper|nestle nan|детск\w* пюре|детское питание|смесь)`)],
  ['kids', 'gear', R(String.raw`\b((?<!servesanas )ratin\w*|rati\b|knupi\w*|pudelit\w*|nuk\b|autokresl\w*|kengursom\w*|barosanas kresl\w*|gultin\w*|коляск|автокресл)`)],
  ['kids', 'toys', R(String.raw`\b(rotallie\w*|rotalu\b|lelle|lelles|lego|konstruktor\w*|puzl\w*|plisa|galda spel\w*|игрушк|кукла|конструктор)`)],
  ['household', 'laundry', R(String.raw`\b(vel\.|vel\. ?(mazg|mikst)\w*|woolite|perwoll|tesori|velas (mazg\w*|pulv\w*|kaps\w*|mikstin\w*|gel\w*|lidzekl\w*|smarzin\w*)|velas\b|mazg\.? ?pulv\w*|ariel|persil|lenor|vanish|silan|tide|bonux|traipu|стир|кондиционер для белья)`)],
  ['household', 'dishes', R(String.raw`\b(trauku (mazg\w*|maz\w*|lidz\w*)|tr\.? ?mazg\w*|tr\.?m\.?mas\w*|trauku mas\w*|finish|fairy|somat|для посуды|посудомо)`)],
  ['household', 'cleaning', R(String.raw`\b(gaisa ats\w*|airwick|ambi pur|tir\.|tir\. ?lidz\w*|tual\.|tual\. ?(tir|bloks?|poda)\w*|tualetes poda|gaisa atsv\w*|atsvaidz\w*|harpic|cif\b|bref|sano\b|kvadro|chanteclair|pink stuff|dezinfekc\w*|kalkakm\w*|pelejuma|virtuves (un tauku )?tir\w*|tirisan\w*|tiritaj\w*|tirit\w*|domestos|cillit|mr\.? ?proper|wc\b|tualetes (bloks|tiritajs)|atkritumu maisi\w*|sukl\w*|grida\w* lupat\w*|mop\w*|bros\w*|чист|уборк|мусорн)`)],
  ['household', 'paper', R(String.raw`\b(tualetes papir\w*|papira dviel\w*|salvet\w*|kabatlakatin\w*|туалетн\w* бумаг|салфет|бумажн\w* полотен)`)],
  ['household', 'hygiene', R(String.raw`\b(paladzin\w*|roku kr\w*|skuv\w*|zobu\w*|kondic\w*|kerm\.\w*|toniks|sejai|pedikir\w*|manikir\w*|matu ser\w*|loreal|l oreal|elseve|bic\b|dez\.|dezod\.|izsm\. ?dez\w*|deodor\w*|rexona|nivea|garnier|veet|durex|prezervat\w*|depilac\w*|int\. ?hig\w*|hig\. ?pak\w*|libresse|always|mut\. ?sk\w*|mutes skalo\w*|matu (veid\w*|mask\w*|sprej\w*|lak\w*)|kondicion\w*|sejas (krem\w*|zel\w*|mask\w*)|kermena krem\w*|dienas krem\w*|nakts krem\w*|serums|lupu balzam\w*|balzams (sejai|pec)\w*|krems\b|zobu (past\w*|birst\w*)|sampun\w*|dusas (zel\w*|kr\w*)|ziepes|ziep\w*|dezodor\w*|antiperspir\w*|skusan\w*|skuvekl\w*|higien\w*|tampon\w*|ieliktn\w*|vates|matu (balz\w*|kraso\w*|kondic\w*)|зубн|шампун|мыло|дезодор|гигиен|бритв|прокладк)`)],
  ['electronics', null, R(String.raw`\b(televizor\w*|austin\w*|talrun\w*|viedtalrun\w*|telefon\w*|plansetdator\w*|portativ\w* dator\w*|klepjdator\w*|monitor\w*|usb\b|ladetaj\w*|powerbank|blender\w*|tejkann\w*|tejkanna|putekl\w* sucej\w*|robots putekl\w*|fen\w*|gludekl\w*|mikrovil\w*|kafijas (automat\w*|aparat\w*)|elektrisk\w*|телевизор|наушник|смартфон|ноутбук|пылесос|чайник|утюг)`)],
  ['auto', null, R(String.raw`\b(ledus skrap\w*|autom\w*|motorell\w*|motora ell\w*|logu skidr\w*|vejstikl\w*|antifriz\w*|riepas|riepu|degviel\w*|benzins|dizeldegv\w*|autogaze|adblue|моторн\w* масл|омыва|шины|бензин|дизел)`)],
  ['beauty', null, R(String.raw`\b(uztura bagat\w*|vitamin\w*|kolagen\w*|omega|magnij\w*|витамин|коллаген|бад\b)`)],
  ['sport', null, R(String.raw`\b(piepus\w*|batut\w*|peldes\w*|peldrin\w*|glabsanas vest\w*|velosiped\w*|skrejriten\w*|trenaz\w*|sporta (inventar|pudel|soma)\w*|telts|gulammais\w*|slepes|slidas|makskere\w*|kempin\w*|велосипед|самокат|батут|палатк)`)],
  ['fashion', null, R(String.raw`\b(cibas|zekes|zekbikses|bikses|krekl\w*|jaka|jakas|cimdi|cepure|apavi|zabaki|kedas|sporta apavi|pidzam\w*|apaksvel\w*|dzemperis|kleita|svarki|носки|куртк|ботинк|кроссовк|пижам)`)],
  ['books', null, R(String.raw`\b(gramat\w*|zurnal\w*|kalendar\w*|burtnic\w*|pildspalv\w*|zimul\w*|книг|журнал|тетрад)`)],
  ['home', 'garden', R(String.raw`\b(krizantem\w*|ziedi|ziedu|rozes|tulpes|uguns vieta|gazes sildit\w*|bambusa nuj\w*|saulessarg\w*|supul\w*|supoles|gulamkresl\w*|lapa\b|bambusa lapa|darza|darzs|stadi\w*|puk(e|u|es)\b|augsne|substrat\w*|zales plavej\w*|laistis\w*|nojume|grils|grila|ogles|садов|газонокос|мангал)`)],
  ['home', 'furniture', R(String.raw`\b(divan\w*|kresl\w*|\w*galds|\w*galdi|\w*galdin\w*|skapis|plaukt\w*|komod\w*|gulta\b|gultas rami\w*|matrac\w*|mebel\w*|диван|кресл|стол\b|шкаф|матрас)`)],
  ['home', 'kitchen', R(String.raw`\b(paplate|glazu kompl\w*|servesanas ratin\w*|pann\w*|katl\w*|katlin\w*|trauku komplekt\w*|glaz(e|es)\b|kruz\w*|skivis|skivji|bloda|naz(is|i)\b|galda piederum\w*|termoss|uzglabasanas trauk\w*|cepam\w* forma|сковород|кастрюл|тарелк|кружк|нож\b)`)],
  ['home', 'decor', R(String.raw`\b(pled\w*|maksligais aug\w*|vainag\w*|davanu lent\w*|aroma\w*|dekor\w*|svece\w*|sveces|svectur\w*|difuzor\w*|egl(es|ites) (rotaj|statīv|stativ)\w*|eglei|adventes|davanu maisin\w*|uzlim\w*|virtene|lampin\w*|ziemassvetku (rotaj\w*|egl\w*)|helovin\w*|dviel(is|i)\b|gultas vel\w*|seg(a|as)\b|spilven\w*|paklaj\w*|aizkar\w*|декор|свеч|гирлянд|полотенц|постельн|подушк|одеял|ковр)`)],
  ['home', 'diy', R(String.raw`\b(stanley|skavas|merlente|markier\w*|montazas|limstien\w*|griezne\w*|rokturis|asmen\w*|aizsargkras\w*|respirator\w*|prozektor\w*|instrument\w*|urbjmasin\w*|skruvgriez\w*|zag(is|i)\b|motorzag\w*|krasa\b|kras\. ?tapet\w*|tapetes|flizes|krasas|spuldz\w*|baterij\w*|pagarinataj\w*|инструмент|дрель|лампочк|батарейк|обои|плитк)`)],
];

const FOOD = [
  ['sweets', R(String.raw`\b(sok\.\w*|saldum\w*|zefir\w*|sokolad\w*|konfekt\w*|cepum\w*|vafel\w*|kuk(a|as|ina)\b|torte|tortes|saldejum\w*|cipsi|cips\w*|uzkod\w*|drazej\w*|batonin\w*|marmelad\w*|zelejkonf\w*|popkorn\w*|grauzdin\w*|riekst\w*|\w*riekst\w*|pistacij\w*|karamel\w*|biskvit\w*|pudin\w*|pikas|krekeri|krekers|пралин|шоколад|конфет|печень|вафл|торт|морожен|чипс|орех|батончик|снек)`)],
  ['bread', R(String.raw`\b(\w*maiz\w*|baranc\w*|barank\w*|rikas|maize|maizes|maizite\w*|rupjmaiz\w*|saldskabmaiz\w*|bulcin\w*|kruasan\w*|smalkmaiz\w*|tortilj\w*|batons|lavas\w*|pita|bageti|baget\w*|grauzdmaiz\w*|kliņģer\w*|klinger\w*|pīrāg\w*|pirag\w*|хлеб|булоч|круасс|батон|лаваш|пирог)`)],
  ['dairy', R(String.raw`\b(jog\.\w*|rjazenk\w*|raudz\.\w*|pieni|kremsier\w*|piens|piena\b|piena (produkt|dzer)\w*|pienu|krejum\w*|kefir\w*|jogurt\w*|biezpien\w*|sier(s|a|i|u)\b|sierin\w*|sviest\w*|olas|ola\b|mocarell\w*|mozzarell\w*|rikot\w*|maskarpon\w*|panin\w*|rugusp\w*|lakto\w*|молок|молочн|сыр|йогурт|творог|сметан|сливк|кефир|яйц|сливочн\w* масл)`)],
  ['meat', R(String.raw`\b(ikri|surimi|salami|doktordesa|\w*desa|gala|galas|cuk(as|u|gala)\w*|liellop\w*|vist(as|u|a)\b|vistas|cal(a|u|i|is)\b|titar\w*|fileja|filejas|krutin\w*|skink\w*|desa|desas|des\.|cisin\w*|sardel\w*|bekon\w*|karbonad\w*|ribin\w*|spārnin\w*|sparnin\w*|stilbin\w*|malta gala|zivs|zivju|zivis|las(is|a|i)\b|silk\w*|skumbrij\w*|menc\w*|tunc\w*|garnel\w*|sprot\w*|kotlet\w*|pelmen\w*|grildesin\w*|kupati|steiks|ribas|desin\w*|kupinat\w*|vitinat\w*|мяс|рыб|колбас|курин|куриц|свин|говя|филе|лосос|сельд|фарш|сосиск|ветчин|бекон|креветк)`)],
  ['alcohol', R(String.raw`\b(alus|alum|vins|vina|vini|degvin\w*|viskij\w*|whisky|konjak\w*|brendij\w*|rums|dzins|gin\b|sidrs|sidra|likier\w*|liker\w*|melnais balzams|rigas balzams|sampanietis|prosecco|dzirkstos\w*|tekila|vermut\w*|пиво|вино|водк|виски|коньяк|сидр|ликер|шампанск)`)],
  ['drinks', R(String.raw`\b(energ\. ?dz\w*|sula|sulas|nektar\w*|udens|limonad\w*|kafija|kafijas|kafij\w*|teja|tejas|kakao|dzeriens|dzer\.|energij\w*|kvass|coca|pepsi|fanta|sprite|smutij\w*|сок|вода|кофе|чай|какао|напит|лимонад|энергет)`)],
  ['produce', R(String.raw`\b(salatu maisijum\w*|abol\w*|bumbier\w*|banan\w*|apelsin\w*|mandarin\w*|citron\w*|laim\w*|greipfrut\w*|vinog\w*|kartupel\w*|burkan\w*|sipol\w*|kiplok\w*|kapost\w*|gurk\w*|tomat\w*|paprik\w*|salat(i|s|a)\b|romiesu|biet\w*|kirb\w*|senes|sampinjon\w*|avokado|kivi|ananas\w*|granatabol\w*|hurm\w*|ogas|zemen\w*|mellen\w*|dzerven\w*|aven\w*|cukini|baklazan\w*|brokol\w*|ziedkapost\w*|zalumi|dill\w*|petersil\w*|яблок|банан|картоф|морков|овощ|фрукт|помидор|томат|огур|лук\b|капуст|ягод|апельсин|мандарин)`)],
  ['frozen', R(String.raw`\b(saldet\w*|pica|picas|lazanj\w*|gatav(a|s|ie|o)\b|zupa|zupas|ediens|maltite|salati ar|заморож|пицц|лазань|суп\b|готов)`)],
  ['grocery', R(String.raw`\b(milti|miltu|cukurs|sals\b|riss|risi|griki|griku|makaron\w*|spaget\w*|pasta|auzu|auzas|parslas|musli|granola|brok\. ?pars\w*|brokastu pars\w*|ella|ellas|olivell\w*|etik\w*|kecup\w*|majonez\w*|sinep\w*|merce|merces|garsvi\w*|medus|ievarijum\w*|dzem\w*|konserv\w*|pupin\w*|zirn\w*|kukuruz\w*|buljon\w*|putraim\w*|sekl\w*|мука|сахар|рис\b|греч|макарон|спагет|масло подсолн|оливков|соус|кетчуп|майонез|консерв|мёд|мед\b|варень|хлопья|фасоль|специ)`)],
];

const FOOD_STORE_CATS = new Set(['groceries']);
const MIXED_STORE_CATS = new Set(['groceries', 'home', 'other']);
const STORE_TO_SECTION = {
  groceries: 'food', kids: 'kids', beauty: 'beauty', home: 'home', pets: 'pets', electronics: 'electronics', fashion: 'fashion',
  sport: 'sport', books: 'books', auto: 'auto', fastfood: 'fastfood', fun: 'services', delivery: 'fastfood', telecom: 'electronics',
  travel: 'services', other: 'services',
};

/** → { sec, sub } */
export function classify(c) {
  if (c.kind === 'catalog') return { sec: 'catalogs', sub: '' };
  const hay = ` ${norm(`${c.title} ${c.brand ?? ''} ${c.titleRu ?? ''}`).replace(/[^a-z0-9а-я.%]+/g, ' ')} `;
  const storeSec = STORE_TO_SECTION[c.category] ?? 'services';
  // Специализированные магазины (аптеки, детские, зоо…) — раздел магазина, но внутри уточняем подраздел
  // Фастфуд/кафе (и еда на заправках Circle K) — подраздел по сети и тексту
  const ffText = /\b(burger\w*|hotdog\w*|hot dog|vrap\w*|kafij\w*|maltit\w*|smalkmaiz\w*|kruasan\w*|pica|picas|picu|nuget\w*|sparnin\w*|kombo|combo)\b/;
  if (c.category === 'fastfood' || (c.category === 'auto' && c.kind !== 'price' && ffText.test(hay))) {
    const st = norm(c.store);
    let sub = 'ffother';
    if (/pizza|pica|lulu/.test(st) || /\b(pica|picas|picu|pizza)\b/.test(hay)) sub = 'pizza';
    else if (/kfc/.test(st) || /\b(sparnin\w*|nuget\w*|vistin\w*)\b/.test(hay)) sub = 'chicken';
    else if (/burger|mcdonald|hesburger/.test(st) || /\bburger\w*\b/.test(hay)) sub = 'burgers';
    else if (/caffeine|coffee|kafej/.test(st) || /\b(kafij\w*|kruasan\w*|smalkmaiz\w*)\b/.test(hay)) sub = 'coffee';
    return { sec: 'fastfood', sub };
  }
  if (!MIXED_STORE_CATS.has(c.category)) {
    if (storeSec === 'kids') {
      for (const [sec, sub, re] of NONFOOD) if (sec === 'kids' && re.test(hay)) return { sec, sub };
      if (/\b(apgerb\w*|bodij\w*|kombinezon\w*|metel\w*|zabak\w*|dzemper\w*|bikses|legingi|cepure|zekes|kurpes|sandales|kreklin\w*|jaka)\b/.test(hay)) return { sec: 'kids', sub: 'kidwear' };
      return { sec: 'kids', sub: 'kidsother' };
    }
    return { sec: storeSec, sub: '' };
  }
  for (const [sec, sub, re] of NONFOOD) if (re.test(hay)) return { sec, sub: sub ?? '' };
  if (FOOD_STORE_CATS.has(c.category) || c.category === 'other') {
    for (const [sub, re] of FOOD) if (re.test(hay)) return { sec: 'food', sub };
    if (c.category === 'groceries') return { sec: 'food', sub: 'foodother' };
  }
  if (storeSec === 'home') return { sec: 'home', sub: 'homeother' };
  return { sec: storeSec, sub: '' };
}
