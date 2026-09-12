import type {
  ContentSuggestion,
  ContentItem,
  GenerateContentRequest,
  GenerateContentResponse,
  Language,
  PageContent,
  PageSlug,
  RewriteRequest,
  RewriteResponse,
  SuggestRequest,
  SuggestResponse,
  Tone,
} from '@autosite/shared';

interface LocaleCopy {
  welcome: string;
  homeLine: string;
  primaryCta: string;
  featuresHeading: string;
  features: readonly [ContentItem, ContentItem, ContentItem];
  storyHeading: string;
  storyLine: string;
  valuesHeading: string;
  values: readonly [ContentItem, ContentItem, ContentItem];
  servicesHeading: string;
  servicesLine: string;
  services: readonly [ContentItem, ContentItem, ContentItem];
  contactHeading: string;
  contactLine: string;
  address: string;
  hours: string;
  contactCta: string;
  toneLines: Record<Tone, string>;
}

const LOCALES: Record<Language, LocaleCopy> = {
  en: {
    welcome: 'Welcome to',
    homeLine: 'Thoughtful quality and service, shaped around what matters to you.',
    primaryCta: 'Discover More',
    featuresHeading: 'Why choose us',
    features: [
      { title: 'Made with care', description: 'Every detail receives our full attention.' },
      { title: 'Local insight', description: 'Experience grounded in the community we serve.' },
      { title: 'Here for you', description: 'Clear, responsive support whenever you need it.' },
    ],
    storyHeading: 'Our Story',
    storyLine: 'Built from a simple belief: excellent work should feel personal.',
    valuesHeading: 'What guides us',
    values: [
      { title: 'Quality', description: 'We choose lasting value over shortcuts.' },
      { title: 'Integrity', description: 'Honest advice and transparent communication.' },
      { title: 'Community', description: 'Meaningful relationships come first.' },
    ],
    servicesHeading: 'What We Offer',
    servicesLine: 'Flexible options designed to make your next step simple.',
    services: [
      { title: 'Personal Service', description: 'A tailored experience built around your goals.' },
      { title: 'Expert Guidance', description: 'Practical answers from people who understand.' },
      { title: 'Ongoing Support', description: 'Reliable help before, during, and after.' },
    ],
    contactHeading: 'Let’s Talk',
    contactLine: 'Tell us what you have in mind—we would love to help.',
    address: '123 Main Street, Your City',
    hours: 'Monday–Friday, 9am–6pm',
    contactCta: 'Get in Touch',
    toneLines: {
      professional: 'Clear, dependable, and focused on results.',
      friendly: 'A warm welcome and helpful people await.',
      luxury: 'Exceptional details create an elevated experience.',
      casual: 'Easygoing, straightforward, and made for real life.',
      bold: 'Big ideas deserve confident action.',
      formal: 'A considered standard of service at every stage.',
      playful: 'Fresh ideas and a little delight make all the difference.',
      minimal: 'Simple. Useful. Beautifully considered.',
    },
  },
  es: {
    welcome: 'Bienvenido a',
    homeLine: 'Calidad y atención pensadas para lo que de verdad te importa.',
    primaryCta: 'Descubre más',
    featuresHeading: 'Por qué elegirnos',
    features: [
      { title: 'Hecho con cuidado', description: 'Cuidamos cada detalle de principio a fin.' },
      { title: 'Conocimiento local', description: 'Experiencia conectada con nuestra comunidad.' },
      { title: 'Estamos contigo', description: 'Apoyo claro y ágil cuando lo necesites.' },
    ],
    storyHeading: 'Nuestra historia',
    storyLine: 'Nacimos de una idea sencilla: un gran trabajo debe sentirse personal.',
    valuesHeading: 'Lo que nos guía',
    values: [
      { title: 'Calidad', description: 'Elegimos el valor duradero antes que los atajos.' },
      { title: 'Integridad', description: 'Consejos honestos y comunicación transparente.' },
      { title: 'Comunidad', description: 'Las relaciones significativas son lo primero.' },
    ],
    servicesHeading: 'Lo que ofrecemos',
    servicesLine: 'Opciones flexibles para que tu próximo paso sea sencillo.',
    services: [
      { title: 'Atención personal', description: 'Una experiencia adaptada a tus objetivos.' },
      { title: 'Asesoramiento experto', description: 'Respuestas prácticas de personas que entienden.' },
      { title: 'Apoyo continuo', description: 'Ayuda fiable antes, durante y después.' },
    ],
    contactHeading: 'Hablemos',
    contactLine: 'Cuéntanos tu idea; estaremos encantados de ayudarte.',
    address: 'Calle Principal 123, Tu Ciudad',
    hours: 'Lunes–viernes, 9:00–18:00',
    contactCta: 'Contáctanos',
    toneLines: {
      professional: 'Claridad, confianza y enfoque en resultados.',
      friendly: 'Te esperan una cálida bienvenida y un equipo cercano.',
      luxury: 'Los detalles excepcionales crean una experiencia elevada.',
      casual: 'Natural, directo y pensado para la vida real.',
      bold: 'Las grandes ideas merecen decisiones valientes.',
      formal: 'Un servicio riguroso y considerado en cada etapa.',
      playful: 'Ideas frescas y un toque de alegría marcan la diferencia.',
      minimal: 'Simple. Útil. Cuidado al detalle.',
    },
  },
  fr: {
    welcome: 'Bienvenue chez',
    homeLine: 'Une qualité et un service pensés autour de vos priorités.',
    primaryCta: 'En savoir plus',
    featuresHeading: 'Pourquoi nous choisir',
    features: [
      { title: 'Fait avec soin', description: 'Chaque détail reçoit toute notre attention.' },
      { title: 'Expertise locale', description: 'Une expérience ancrée dans notre communauté.' },
      { title: 'À vos côtés', description: 'Un accompagnement clair et réactif.' },
    ],
    storyHeading: 'Notre histoire',
    storyLine: 'Une conviction simple nous anime : l’excellence doit rester personnelle.',
    valuesHeading: 'Nos valeurs',
    values: [
      { title: 'Qualité', description: 'Nous privilégions la valeur durable.' },
      { title: 'Intégrité', description: 'Des conseils honnêtes et une communication claire.' },
      { title: 'Communauté', description: 'Les relations humaines passent avant tout.' },
    ],
    servicesHeading: 'Nos services',
    servicesLine: 'Des options souples pour avancer simplement.',
    services: [
      { title: 'Service personnalisé', description: 'Une expérience adaptée à vos objectifs.' },
      { title: 'Conseils d’experts', description: 'Des réponses concrètes par des gens qui comprennent.' },
      { title: 'Suivi continu', description: 'Une aide fiable à chaque étape.' },
    ],
    contactHeading: 'Parlons de votre projet',
    contactLine: 'Partagez votre idée, nous serons ravis de vous aider.',
    address: '123 rue Principale, Votre Ville',
    hours: 'Lundi–vendredi, 9 h–18 h',
    contactCta: 'Nous contacter',
    toneLines: {
      professional: 'Clarté, fiabilité et priorité aux résultats.',
      friendly: 'Un accueil chaleureux et une équipe attentionnée.',
      luxury: 'Des détails d’exception pour une expérience raffinée.',
      casual: 'Simple, naturel et pensé pour la vraie vie.',
      bold: 'Les grandes idées appellent des choix affirmés.',
      formal: 'Une exigence de service à chaque étape.',
      playful: 'Des idées fraîches et une touche de plaisir.',
      minimal: 'Simple. Utile. Soigneusement pensé.',
    },
  },
  de: {
    welcome: 'Willkommen bei',
    homeLine: 'Durchdachte Qualität und Service für das, was Ihnen wichtig ist.',
    primaryCta: 'Mehr entdecken',
    featuresHeading: 'Warum wir',
    features: [
      { title: 'Mit Sorgfalt', description: 'Jedes Detail erhält unsere volle Aufmerksamkeit.' },
      { title: 'Lokal erfahren', description: 'Erfahrung, die in unserer Gemeinschaft verwurzelt ist.' },
      { title: 'Für Sie da', description: 'Klare und schnelle Unterstützung.' },
    ],
    storyHeading: 'Unsere Geschichte',
    storyLine: 'Aus einer einfachen Überzeugung: Gute Arbeit sollte persönlich sein.',
    valuesHeading: 'Was uns leitet',
    values: [
      { title: 'Qualität', description: 'Dauerhafter Wert statt schneller Abkürzungen.' },
      { title: 'Integrität', description: 'Ehrlicher Rat und offene Kommunikation.' },
      { title: 'Gemeinschaft', description: 'Bedeutsame Beziehungen stehen an erster Stelle.' },
    ],
    servicesHeading: 'Unser Angebot',
    servicesLine: 'Flexible Möglichkeiten für einen einfachen nächsten Schritt.',
    services: [
      { title: 'Persönlicher Service', description: 'Ein Erlebnis passend zu Ihren Zielen.' },
      { title: 'Fachkundige Beratung', description: 'Praktische Antworten von erfahrenen Menschen.' },
      { title: 'Laufende Begleitung', description: 'Verlässliche Hilfe in jeder Phase.' },
    ],
    contactHeading: 'Sprechen wir',
    contactLine: 'Erzählen Sie uns von Ihrer Idee – wir helfen gern.',
    address: 'Hauptstraße 123, Ihre Stadt',
    hours: 'Montag–Freitag, 9–18 Uhr',
    contactCta: 'Kontakt aufnehmen',
    toneLines: {
      professional: 'Klar, verlässlich und ergebnisorientiert.',
      friendly: 'Herzlich willkommen bei einem hilfsbereiten Team.',
      luxury: 'Außergewöhnliche Details schaffen ein gehobenes Erlebnis.',
      casual: 'Locker, direkt und alltagstauglich.',
      bold: 'Große Ideen verdienen entschlossenes Handeln.',
      formal: 'Ein anspruchsvoller Service in jeder Phase.',
      playful: 'Frische Ideen und etwas Freude machen den Unterschied.',
      minimal: 'Einfach. Nützlich. Durchdacht.',
    },
  },
  pt: {
    welcome: 'Bem-vindo à',
    homeLine: 'Qualidade e atendimento pensados no que importa para você.',
    primaryCta: 'Saiba mais',
    featuresHeading: 'Por que nos escolher',
    features: [
      { title: 'Feito com cuidado', description: 'Cada detalhe recebe toda a nossa atenção.' },
      { title: 'Experiência local', description: 'Conhecimento ligado à comunidade que atendemos.' },
      { title: 'Ao seu lado', description: 'Suporte claro e ágil quando precisar.' },
    ],
    storyHeading: 'Nossa história',
    storyLine: 'Uma crença simples nos move: um ótimo trabalho deve ser pessoal.',
    valuesHeading: 'O que nos guia',
    values: [
      { title: 'Qualidade', description: 'Escolhemos valor duradouro em vez de atalhos.' },
      { title: 'Integridade', description: 'Orientação honesta e comunicação transparente.' },
      { title: 'Comunidade', description: 'Relações verdadeiras vêm em primeiro lugar.' },
    ],
    servicesHeading: 'O que oferecemos',
    servicesLine: 'Opções flexíveis para simplificar seu próximo passo.',
    services: [
      { title: 'Atendimento pessoal', description: 'Uma experiência feita para seus objetivos.' },
      { title: 'Orientação especializada', description: 'Respostas práticas de quem entende.' },
      { title: 'Suporte contínuo', description: 'Ajuda confiável em todas as etapas.' },
    ],
    contactHeading: 'Vamos conversar',
    contactLine: 'Conte sua ideia; teremos prazer em ajudar.',
    address: 'Rua Principal, 123, Sua Cidade',
    hours: 'Segunda–sexta, 9h–18h',
    contactCta: 'Entre em contato',
    toneLines: {
      professional: 'Clareza, confiança e foco em resultados.',
      friendly: 'Uma recepção calorosa e pessoas atenciosas esperam por você.',
      luxury: 'Detalhes excepcionais criam uma experiência elevada.',
      casual: 'Leve, direto e feito para a vida real.',
      bold: 'Grandes ideias merecem atitudes firmes.',
      formal: 'Um padrão cuidadoso de serviço em cada etapa.',
      playful: 'Ideias novas e um toque de alegria fazem a diferença.',
      minimal: 'Simples. Útil. Bem pensado.',
    },
  },
  it: {
    welcome: 'Benvenuti da',
    homeLine: 'Qualità e servizio pensati intorno a ciò che conta per te.',
    primaryCta: 'Scopri di più',
    featuresHeading: 'Perché sceglierci',
    features: [
      { title: 'Fatto con cura', description: 'Ogni dettaglio riceve la nostra piena attenzione.' },
      { title: 'Esperienza locale', description: 'Competenza radicata nella comunità.' },
      { title: 'Al tuo fianco', description: 'Supporto chiaro e puntuale quando serve.' },
    ],
    storyHeading: 'La nostra storia',
    storyLine: 'Una convinzione semplice: un lavoro eccellente deve essere personale.',
    valuesHeading: 'I nostri valori',
    values: [
      { title: 'Qualità', description: 'Scegliamo valore duraturo, mai scorciatoie.' },
      { title: 'Integrità', description: 'Consigli onesti e comunicazione trasparente.' },
      { title: 'Comunità', description: 'Le relazioni autentiche vengono prima di tutto.' },
    ],
    servicesHeading: 'Cosa offriamo',
    servicesLine: 'Opzioni flessibili per rendere semplice il prossimo passo.',
    services: [
      { title: 'Servizio personale', description: 'Un’esperienza costruita sui tuoi obiettivi.' },
      { title: 'Guida esperta', description: 'Risposte pratiche da chi sa ascoltare.' },
      { title: 'Supporto continuo', description: 'Aiuto affidabile in ogni fase.' },
    ],
    contactHeading: 'Parliamone',
    contactLine: 'Raccontaci la tua idea: saremo felici di aiutarti.',
    address: 'Via Principale 123, La Tua Città',
    hours: 'Lunedì–venerdì, 9–18',
    contactCta: 'Contattaci',
    toneLines: {
      professional: 'Chiarezza, affidabilità e attenzione ai risultati.',
      friendly: 'Ti aspettano un sorriso e persone disponibili.',
      luxury: 'Dettagli eccezionali per un’esperienza raffinata.',
      casual: 'Spontaneo, diretto e pensato per la vita vera.',
      bold: 'Le grandi idee meritano azioni decise.',
      formal: 'Uno standard di servizio attento in ogni fase.',
      playful: 'Idee fresche e un tocco di allegria fanno la differenza.',
      minimal: 'Semplice. Utile. Curato.',
    },
  },
  ja: {
    welcome: 'ようこそ',
    homeLine: '大切なことに寄り添う、丁寧な品質とサービスをお届けします。',
    primaryCta: '詳しく見る',
    featuresHeading: '選ばれる理由',
    features: [
      { title: '丁寧な仕事', description: '一つひとつの細部まで心を配ります。' },
      { title: '地域への理解', description: '地域に根ざした経験を生かします。' },
      { title: '安心のサポート', description: '必要なときに、分かりやすく迅速に対応します。' },
    ],
    storyHeading: '私たちの物語',
    storyLine: '優れた仕事は、人に寄り添うものであるべきだという想いから始まりました。',
    valuesHeading: '大切にしていること',
    values: [
      { title: '品質', description: '近道ではなく、長く続く価値を選びます。' },
      { title: '誠実さ', description: '正直な提案と透明な対話を大切にします。' },
      { title: 'つながり', description: '人との信頼関係を第一に考えます。' },
    ],
    servicesHeading: 'サービス',
    servicesLine: '次の一歩をシンプルにする柔軟な選択肢をご用意しています。',
    services: [
      { title: '個別サービス', description: '目標に合わせた体験を設計します。' },
      { title: '専門的なご案内', description: '経験に基づく実用的な答えをお届けします。' },
      { title: '継続サポート', description: 'あらゆる段階で頼れる支援を行います。' },
    ],
    contactHeading: 'ご相談ください',
    contactLine: 'お考えをお聞かせください。心を込めてお手伝いします。',
    address: '〇〇市メインストリート123',
    hours: '月曜〜金曜 9:00〜18:00',
    contactCta: 'お問い合わせ',
    toneLines: {
      professional: '明確で信頼できる、成果に向けた対応です。',
      friendly: '温かな笑顔と親身なチームがお迎えします。',
      luxury: '上質な細部が、特別な体験をつくります。',
      casual: '気軽で分かりやすく、毎日に自然になじみます。',
      bold: '大きなアイデアを、力強く前へ進めます。',
      formal: 'すべての段階で品格あるサービスを提供します。',
      playful: '新鮮な発想と小さな驚きを大切にします。',
      minimal: 'シンプルに。便利に。美しく。',
    },
  },
  ko: {
    welcome: '반갑습니다,',
    homeLine: '당신에게 중요한 것에 맞춘 세심한 품질과 서비스를 제공합니다.',
    primaryCta: '더 알아보기',
    featuresHeading: '선택받는 이유',
    features: [
      { title: '정성을 담아', description: '모든 세부 사항을 꼼꼼하게 살핍니다.' },
      { title: '지역 전문성', description: '지역사회에 뿌리내린 경험을 활용합니다.' },
      { title: '든든한 지원', description: '필요할 때 명확하고 빠르게 도와드립니다.' },
    ],
    storyHeading: '우리의 이야기',
    storyLine: '훌륭한 일은 개인적인 경험이어야 한다는 믿음에서 시작했습니다.',
    valuesHeading: '우리의 원칙',
    values: [
      { title: '품질', description: '지름길보다 오래가는 가치를 선택합니다.' },
      { title: '정직', description: '솔직한 조언과 투명한 소통을 지킵니다.' },
      { title: '지역사회', description: '의미 있는 관계를 가장 먼저 생각합니다.' },
    ],
    servicesHeading: '제공 서비스',
    servicesLine: '다음 단계를 쉽게 만드는 유연한 선택지입니다.',
    services: [
      { title: '맞춤 서비스', description: '목표에 맞춘 경험을 설계합니다.' },
      { title: '전문 안내', description: '이해하는 전문가가 실용적인 답을 드립니다.' },
      { title: '지속 지원', description: '모든 단계에서 믿을 수 있게 돕습니다.' },
    ],
    contactHeading: '이야기를 나눠요',
    contactLine: '아이디어를 들려주세요. 기꺼이 도와드리겠습니다.',
    address: '우리시 메인 스트리트 123',
    hours: '월요일–금요일, 09:00–18:00',
    contactCta: '문의하기',
    toneLines: {
      professional: '명확하고 신뢰할 수 있으며 결과에 집중합니다.',
      friendly: '따뜻한 환영과 친절한 사람들이 기다립니다.',
      luxury: '탁월한 디테일로 품격 있는 경험을 만듭니다.',
      casual: '편안하고 솔직하며 일상에 자연스럽습니다.',
      bold: '큰 아이디어는 과감한 실행을 만납니다.',
      formal: '모든 단계에서 격조 있는 서비스를 제공합니다.',
      playful: '신선한 아이디어와 작은 즐거움을 더합니다.',
      minimal: '단순하게. 유용하게. 세심하게.',
    },
  },
  zh: {
    welcome: '欢迎来到',
    homeLine: '用心提供品质与服务，围绕您真正在意的事情。',
    primaryCta: '了解更多',
    featuresHeading: '为什么选择我们',
    features: [
      { title: '用心打造', description: '从始至终关注每一个细节。' },
      { title: '本地经验', description: '以扎根社区的经验为您服务。' },
      { title: '始终相伴', description: '在需要时提供清晰及时的支持。' },
    ],
    storyHeading: '我们的故事',
    storyLine: '我们相信，出色的工作也应当充满人情味。',
    valuesHeading: '我们的坚持',
    values: [
      { title: '品质', description: '拒绝捷径，选择持久价值。' },
      { title: '诚信', description: '诚实建议，透明沟通。' },
      { title: '社区', description: '把真诚的关系放在第一位。' },
    ],
    servicesHeading: '我们的服务',
    servicesLine: '灵活的选择，让下一步更简单。',
    services: [
      { title: '个性化服务', description: '围绕您的目标定制体验。' },
      { title: '专业指导', description: '由懂您的团队给出实用答案。' },
      { title: '持续支持', description: '每个阶段都提供可靠帮助。' },
    ],
    contactHeading: '与我们聊聊',
    contactLine: '告诉我们您的想法，我们很乐意提供帮助。',
    address: '您的城市主街123号',
    hours: '周一至周五 9:00–18:00',
    contactCta: '联系我们',
    toneLines: {
      professional: '清晰可靠，专注于结果。',
      friendly: '温暖的欢迎和贴心的团队在等您。',
      luxury: '卓越细节，成就高品质体验。',
      casual: '轻松直接，贴近日常。',
      bold: '让大创意遇见果敢行动。',
      formal: '在每个阶段保持严谨周到的服务。',
      playful: '用新鲜创意和一点惊喜创造不同。',
      minimal: '简单。实用。精心。',
    },
  },
  nl: {
    welcome: 'Welkom bij',
    homeLine: 'Doordachte kwaliteit en service, gericht op wat voor u telt.',
    primaryCta: 'Ontdek meer',
    featuresHeading: 'Waarom voor ons kiezen',
    features: [
      { title: 'Met zorg gemaakt', description: 'Elk detail krijgt onze volle aandacht.' },
      { title: 'Lokale kennis', description: 'Ervaring geworteld in onze gemeenschap.' },
      { title: 'Voor u klaar', description: 'Duidelijke en snelle ondersteuning.' },
    ],
    storyHeading: 'Ons verhaal',
    storyLine: 'Vanuit één overtuiging: uitstekend werk hoort persoonlijk te voelen.',
    valuesHeading: 'Wat ons drijft',
    values: [
      { title: 'Kwaliteit', description: 'We kiezen blijvende waarde boven snelle routes.' },
      { title: 'Integriteit', description: 'Eerlijk advies en open communicatie.' },
      { title: 'Gemeenschap', description: 'Betekenisvolle relaties komen eerst.' },
    ],
    servicesHeading: 'Wat we bieden',
    servicesLine: 'Flexibele mogelijkheden die uw volgende stap eenvoudig maken.',
    services: [
      { title: 'Persoonlijke service', description: 'Een ervaring afgestemd op uw doelen.' },
      { title: 'Deskundig advies', description: 'Praktische antwoorden van mensen met inzicht.' },
      { title: 'Blijvende ondersteuning', description: 'Betrouwbare hulp in elke fase.' },
    ],
    contactHeading: 'Laten we praten',
    contactLine: 'Vertel ons uw idee; we helpen u graag verder.',
    address: 'Hoofdstraat 123, Uw Stad',
    hours: 'Maandag–vrijdag, 9.00–18.00',
    contactCta: 'Neem contact op',
    toneLines: {
      professional: 'Helder, betrouwbaar en gericht op resultaat.',
      friendly: 'Een warm welkom en behulpzame mensen staan klaar.',
      luxury: 'Uitzonderlijke details zorgen voor een verfijnde ervaring.',
      casual: 'Ontspannen, direct en gemaakt voor het echte leven.',
      bold: 'Grote ideeën verdienen krachtige actie.',
      formal: 'Een zorgvuldige servicestandaard in elke fase.',
      playful: 'Frisse ideeën en een beetje plezier maken het verschil.',
      minimal: 'Eenvoudig. Bruikbaar. Doordacht.',
    },
  },
};

const STOP_WORDS = new Set([
  'in',
  'at',
  'for',
  'with',
  'that',
  'who',
  'serving',
  'offering',
  'specializing',
  'specialising',
  'based',
]);

const deriveBusinessName = (brief: string): string => {
  const compact = brief.replace(/\s+/g, ' ').trim();
  const isAscii = [...compact].every((character) => character.codePointAt(0)! <= 127);
  if (!isAscii) {
    return compact.slice(0, 28).replace(/[.!?,;:]+$/u, '') || 'AutoSite';
  }

  const words = compact
    .replace(/[^a-zA-Z0-9'& -]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
  const stopIndex = words.findIndex((word) => STOP_WORDS.has(word.toLowerCase()));
  const usefulWords = words.slice(0, stopIndex < 0 ? 5 : Math.max(stopIndex, 1)).slice(0, 5);
  const title = usefulWords
    .map((word) =>
      word === '&'
        ? word
        : `${word.charAt(0).toUpperCase()}${word.slice(1).toLowerCase()}`,
    )
    .join(' ');

  return title.length > 0 ? title : 'AutoSite';
};

const withTone = (heading: string, tone: Tone): string => {
  if (tone === 'bold') {
    return `${heading}!`;
  }
  return heading;
};

const cloneItems = (
  items: readonly [ContentItem, ContentItem, ContentItem],
): ContentItem[] => items.map((item) => ({ ...item }));

const generatePage = (
  page: PageSlug,
  businessName: string,
  tone: Tone,
  copy: LocaleCopy,
): PageContent => {
  switch (page) {
    case 'home':
      return {
        sections: [
          {
            type: 'hero',
            heading: withTone(`${copy.welcome} ${businessName}`, tone),
            subheading: `${copy.homeLine} ${copy.toneLines[tone]}`,
            cta_text: copy.primaryCta,
          },
          {
            type: 'features',
            heading: copy.featuresHeading,
            items: cloneItems(copy.features),
          },
        ],
      };
    case 'about':
      return {
        sections: [
          {
            type: 'hero',
            heading: withTone(copy.storyHeading, tone),
            subheading: `${businessName}: ${copy.storyLine} ${copy.toneLines[tone]}`,
          },
          {
            type: 'features',
            heading: copy.valuesHeading,
            items: cloneItems(copy.values),
          },
        ],
      };
    case 'services':
      return {
        sections: [
          {
            type: 'hero',
            heading: withTone(copy.servicesHeading, tone),
            subheading: `${copy.servicesLine} ${copy.toneLines[tone]}`,
            cta_text: copy.contactCta,
          },
          {
            type: 'services',
            heading: copy.servicesHeading,
            items: cloneItems(copy.services),
          },
        ],
      };
    case 'contact':
      return {
        sections: [
          {
            type: 'hero',
            heading: withTone(copy.contactHeading, tone),
            subheading: copy.contactLine,
            cta_text: copy.contactCta,
          },
          {
            type: 'contact',
            heading: copy.contactHeading,
            subheading: `${copy.contactLine} ${copy.toneLines[tone]}`,
            address: copy.address,
            phone: '(555) 123-4567',
            hours: copy.hours,
            cta_text: copy.contactCta,
          },
        ],
      };
  }
};

export const generateContent = (
  request: GenerateContentRequest,
): GenerateContentResponse => {
  const copy = LOCALES[request.language];
  const businessName = deriveBusinessName(request.brief);
  const pages: Partial<Record<PageSlug, PageContent>> = {};

  for (const page of [...new Set(request.pages)]) {
    pages[page] = generatePage(page, businessName, request.tone, copy);
  }

  const tokensUsed = Math.ceil(
    (request.brief.length + JSON.stringify(pages).length) / 4,
  );

  return { pages, tokens_used: tokensUsed };
};

const TONE_OPENERS: Record<Tone, string> = {
  professional: 'With clarity and confidence,',
  friendly: 'With a warm welcome,',
  luxury: 'With an elevated attention to detail,',
  casual: 'Simply put,',
  bold: 'Make no mistake:',
  formal: 'With considered care,',
  playful: 'Here is the delightful part:',
  minimal: 'Simply:',
};

const ensureSentence = (value: string): string =>
  /[.!?]$/u.test(value) ? value : `${value}.`;

export const rewriteContent = (request: RewriteRequest): RewriteResponse => {
  const normalized = request.text.replace(/\s+/gu, ' ').trim();
  const instruction = request.instruction.toLowerCase();
  const limit = /short|concise|brief|condense/u.test(instruction) ? 24 : 60;
  const words = normalized.split(' ');
  const clipped = words.slice(0, limit).join(' ');
  const sentence =
    words.length > limit
      ? `${clipped.replace(/[.!?]+$/u, '')}…`
      : ensureSentence(clipped);
  const rewritten = `${TONE_OPENERS[request.tone]} ${sentence}`;

  return {
    rewritten,
    tokens_used: Math.ceil(
      (request.text.length + request.instruction.length + rewritten.length) / 4,
    ),
  };
};

const SECTION_LABELS: Record<SuggestRequest['section_type'], string> = {
  hero: 'Welcome',
  features: 'Why Choose Us',
  services: 'What We Offer',
  contact: 'Let’s Connect',
};

const SECTION_CTAS: Record<SuggestRequest['section_type'], readonly [string, string, string]> = {
  hero: ['Discover More', 'Get Started', 'Explore Today'],
  features: ['See the Difference', 'Learn More', 'Why Choose Us'],
  services: ['View Services', 'Find Your Fit', 'See What We Do'],
  contact: ['Get in Touch', 'Start a Conversation', 'Contact Us'],
};

export const suggestContent = (request: SuggestRequest): SuggestResponse => {
  const context = deriveBusinessName(request.context);
  const normalizedContext = request.context.replace(/\s+/gu, ' ').trim();
  const label = SECTION_LABELS[request.section_type];
  const ctas = SECTION_CTAS[request.section_type];
  const suggestions: ContentSuggestion[] = [
    {
      heading: `${label} to ${context}`,
      subheading: `Thoughtful experiences shaped around ${normalizedContext}`,
      cta_text: ctas[0],
    },
    {
      heading: `${context}, Made for You`,
      subheading: 'Clear value, personal service, and details that matter',
      cta_text: ctas[1],
    },
    {
      heading: `A Better Way to Experience ${context}`,
      subheading: 'Quality and care come together at every step',
      cta_text: ctas[2],
    },
  ];

  return { suggestions };
};
