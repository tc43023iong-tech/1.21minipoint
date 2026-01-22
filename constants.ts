
import { ScoreAction } from './types';

export const POKEMON_COUNT = 500;

export const POSITIVE_ACTIONS: ScoreAction[] = [
  { label: '積極參與', labelEn: 'good participation', value: 1, icon: '🌟' },
  { label: '專心上課', labelEn: 'well focused', value: 1, icon: '📖' },
  { label: '認真學習', labelEn: 'diligent learning', value: 1, icon: '✏️' },
  { label: '安靜吃飯', labelEn: 'quiet eating', value: 1, icon: '🍱' },
  { label: '配合做課間操', labelEn: 'participating in exercises', value: 1, icon: '🤸' },
  { label: '尊重容老師！', labelEn: 'respect miss iong!', value: 3, icon: '💖' },
  { label: '你太讓容老師高興了😊！', labelEn: 'you made miss iong so happy! 😊', value: 5, icon: '🌈' },
  { label: '你簡直太棒了🥳👍！', labelEn: 'you are simply amazing 🥳👍!', value: 10, icon: '🏆' },
];

export const NEGATIVE_ACTIONS: ScoreAction[] = [
  { label: '態度欠佳', labelEn: 'bad attitude', value: -1, icon: '💢' },
  { label: '過於吵鬧', labelEn: 'noisy', value: -1, icon: '📢' },
  { label: '離開座位', labelEn: 'leaving seat', value: -1, icon: '🪑' },
  { label: '不專心', labelEn: 'not paying attention', value: -1, icon: '💭' },
  { label: '課上聊天', labelEn: 'chatting in class', value: -1, icon: '💬' },
  { label: '對容老師無禮', labelEn: 'disrespectful to miss iong', value: -3, icon: '🚫' },
  { label: '你太令容老師失望了😢！', labelEn: 'you disappointed miss iong! 😢', value: -5, icon: '🥀' },
  { label: '你太過分/離譜了😡！', labelEn: 'you have gone too far 😡!', value: -10, icon: '🔥' },
];

// Classes Data Construction
const STUDENTS_4B = [
  "陳沁儀", "陳信豪", "周詩蕎", "鄭瑩瑩", "鄭泓昊", "蔣沁妍", "甘子賢", "關子謙", "謝欣晏", "黃楚堯", 
  "黃翰皓", "容毓俊", "李可欣", "陸皆橋", "馬超芸", "麥嘉俐", "牟智杰", "潘思涵", "蕭珈睿", "黃一進", 
  "王美琳", "趙梓琳", "趙慕辰"
];

const STUDENTS_5B = [
  "歐陽卓軒", "陳至濠", "謝穎琳", "鄭智泓", "鄭澳因", "陳靜妍", "陳浩", "霍菁", "黃羲辰", "郭芷晴",
  "林安娜", "劉樂澄", "李梓樂", "李天恩", "梁康妮", "梁語翹", "梁智中", "梁賢正", "梁伽藍", "梁凱嵐",
  "劉一鳴", "盧紫君", "呂建羲", "馬梓倫", "吳子軒", "吳梓浩", "吳穎詩", "彭賢信", "施泓軒", "蕭昊恩",
  "蘇健羽", "田浩成", "唐敏裕", "黃浩藍"
];

const STUDENTS_4C = [
  "曾子朗", "鄭翊翔", "陳梓晴", "許芝霖", "康安娜", "胡栩豪", "黃璐媛", "黃詩皓", "嚴穎兒", "林晉毅",
  "林雅妍", "林寶堅", "李凱聰", "梁語穎", "龍紀潼", "盧航俊", "盧俊俐", "莫芷晴", "歐陽健豐", "邱佳茵",
  "余樂恆", "鍾倬民", "鍾倬承"
];

// Note: #16 林曉棟 has left the class. We use null to preserve the original IDs for others.
const STUDENTS_3B = [
  "陳芷柔", "陳沛詩", "鄭穎彤", "張晉熙", "朱善恆", "馮子陽", "傅玥寧", "高宇皓", "何梓瑤", "何金霏",
  "何冠奇", "黃欣彤", "黎芷楹", "黎子滔", "林子洋", null, "雷翊權", "李祤軒", "梁子泓", "梁皓宸", 
  "梁依晴", "廖巧澄", "駱峻霆", "伍嘉豪", "蕭家軒", "譚灝楊", "丁子皓", "黃芊諭", "王美樂", "許君豪", 
  "周海嵐", "朱麗媛"
];

const createClass = (id: string, name: string, studentNames: (string | null)[]) => ({
  id,
  name,
  students: studentNames.map((name, index) => {
    if (name === null) return null;
    return {
      id: index + 1,
      name,
      points: 0,
      pokemonId: Math.floor(Math.random() * POKEMON_COUNT) + 1,
      plusPoints: 0,
      minusPoints: 0
    };
  }).filter(s => s !== null) as any[]
});

export const INITIAL_CLASSES = [
  createClass('3B_ENG', '三乙 英文 (3B English)', STUDENTS_3B),
  createClass('3B_PTH', '三乙 普通話 (3B Mandarin)', STUDENTS_3B),
  createClass('4B_PTH', '四乙 普通話 (4B Mandarin)', STUDENTS_4B),
  createClass('4B_ENG', '四乙 英文 (4B English)', STUDENTS_4B),
  createClass('4C_PTH', '四丙 普通話 (4C Mandarin)', STUDENTS_4C),
  createClass('4C_GM', '四丙 公民 (4C Civics)', STUDENTS_4C),
  createClass('5B_PTH', '五乙 普通話 (5B Mandarin)', STUDENTS_5B),
];

// Helper to get Pokemon names
export const POKEMON_NAMES: Record<number, { zh: string, en: string }> = {
  1: { zh: '妙蛙種子', en: 'Bulbasaur' },
  2: { zh: '妙蛙草', en: 'Ivysaur' },
  3: { zh: '妙蛙花', en: 'Venusaur' },
  4: { zh: '小火龍', en: 'Charmander' },
  5: { zh: '火恐龍', en: 'Charmeleon' },
  6: { zh: '噴火龍', en: 'Charizard' },
  7: { zh: '傑尼龜', en: 'Squirtle' },
  8: { zh: '卡咪龜', en: 'Wartortle' },
  9: { zh: '水箭龜', en: 'Blastoise' },
  10: { zh: '綠毛蟲', en: 'Caterpie' },
  11: { zh: '鐵甲蛹', en: 'Metapod' },
  12: { zh: '巴大蝶', en: 'Butterfree' },
  25: { zh: '皮卡丘', en: 'Pikachu' },
};
