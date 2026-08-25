export const MATERIAL_EVENT_TAGS = [
  '其他', '深深的武汉', '深深的苏州', '深深的重庆', '深深的郑州', '深深的呼和浩特',
  '深深的沈阳', '深深的贵阳', '深深的济南', '深深的台州', '深深的北京', '深深的长沙',
  '深深的常州', '深深的厦门', '深深的佛山', '五月天鸟巢', '脱友3', '北京大眼',
  '王力宏成都', '大鱼海棠晚会', 'TMEA', '北京环球', '湖州音乐节', '澳门音乐节',
  '听见你音乐盛典', '南通音乐节'
];

export const formatCardTime = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('zh-CN', {
    month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false
  }).format(date);
};
