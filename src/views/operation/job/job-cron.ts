export type JobCronIntervalUnit = 'hour' | 'minute' | 'second';

export type JobCronMode = 'daily' | 'interval' | 'monthly' | 'weekly';

export interface JobCronConfig {
  mode: JobCronMode;
  intervalUnit?: JobCronIntervalUnit;
  intervalValue?: number;
  monthDay?: number;
  time: null | number;
  weekday?: number;
}

/**
 * 根据简单配置生成 APScheduler 使用的五段 Cron 表达式。
 *
 * :param config: 执行周期和时间配置
 * :return: Cron 表达式；配置不完整时返回空字符串
 */
export function buildJobCronExpression(config: JobCronConfig): string {
  if (
    config.mode === 'interval' &&
    config.intervalUnit &&
    config.intervalValue &&
    config.intervalValue > 0
  ) {
    if (config.intervalUnit === 'second') {
      return `*/${config.intervalValue} * * * * *`;
    }
    if (config.intervalUnit === 'minute') {
      return `*/${config.intervalValue} * * * *`;
    }
    return `0 */${config.intervalValue} * * *`;
  }
  if (config.time === null) {
    return '';
  }
  const hour = Math.floor(config.time / 60);
  const minute = config.time % 60;
  if (config.mode === 'weekly' && config.weekday !== undefined) {
    return `${minute} ${hour} * * ${config.weekday}`;
  }
  if (config.mode === 'monthly' && config.monthDay !== undefined) {
    return `${minute} ${hour} ${config.monthDay} * *`;
  }
  return config.mode === 'daily' ? `${minute} ${hour} * * *` : '';
}

/**
 * 解析简单的五段 Cron 表达式，用于编辑时回显配置。
 *
 * :param expression: APScheduler Cron 表达式
 * :return: 可识别的简单配置，无法识别时返回 null
 */
export function parseJobCronExpression(
  expression: string,
): JobCronConfig | null {
  const parts = expression.trim().split(/\s+/);
  if (parts.length === 6) {
    const [secondText, minuteText, hourText, dayText, monthText, weekdayText] =
      parts;
    if (
      secondText === undefined ||
      minuteText === undefined ||
      hourText === undefined ||
      dayText === undefined ||
      monthText === undefined ||
      weekdayText === undefined
    ) {
      return null;
    }
    const intervalMatch = /^\/(\d+)$/.exec(secondText.replace(/^\*/, ''));
    if (
      intervalMatch &&
      Number(intervalMatch[1]) >= 1 &&
      Number(intervalMatch[1]) <= 59 &&
      minuteText === '*' &&
      hourText === '*' &&
      dayText === '*' &&
      monthText === '*' &&
      weekdayText === '*'
    ) {
      return {
        intervalUnit: 'second',
        intervalValue: Number(intervalMatch[1]),
        mode: 'interval',
        time: null,
      };
    }
    return null;
  }
  if (parts.length !== 5) {
    return null;
  }
  const [minuteText, hourText, dayText, monthText, weekdayText] = parts;
  if (
    minuteText === undefined ||
    hourText === undefined ||
    dayText === undefined ||
    monthText === undefined ||
    weekdayText === undefined
  ) {
    return null;
  }
  const minuteIntervalMatch = /^\*(?:\/(\d+))$/.exec(minuteText);
  if (
    minuteIntervalMatch &&
    Number(minuteIntervalMatch[1]) >= 1 &&
    Number(minuteIntervalMatch[1]) <= 59 &&
    hourText === '*' &&
    dayText === '*' &&
    monthText === '*' &&
    weekdayText === '*'
  ) {
    return {
      intervalUnit: 'minute',
      intervalValue: Number(minuteIntervalMatch[1]),
      mode: 'interval',
      time: null,
    };
  }
  const hourIntervalMatch = /^\*(?:\/(\d+))$/.exec(hourText);
  if (
    minuteText === '0' &&
    hourIntervalMatch &&
    Number(hourIntervalMatch[1]) >= 1 &&
    Number(hourIntervalMatch[1]) <= 23 &&
    dayText === '*' &&
    monthText === '*' &&
    weekdayText === '*'
  ) {
    return {
      intervalUnit: 'hour',
      intervalValue: Number(hourIntervalMatch[1]),
      mode: 'interval',
      time: null,
    };
  }
  const minute = Number(minuteText);
  const hour = Number(hourText);
  if (
    !Number.isInteger(minute) ||
    !Number.isInteger(hour) ||
    minute < 0 ||
    minute > 59 ||
    hour < 0 ||
    hour > 23 ||
    monthText !== '*'
  ) {
    return null;
  }
  const time = hour * 60 + minute;
  if (dayText === '*' && weekdayText === '*') {
    return { mode: 'daily', time };
  }
  if (dayText === '*' && /^[0-6]$/.test(weekdayText)) {
    return { mode: 'weekly', time, weekday: Number(weekdayText) };
  }
  if (/^(?:[1-9]|[12]\d|3[01])$/.test(dayText) && weekdayText === '*') {
    return { mode: 'monthly', monthDay: Number(dayText), time };
  }
  return null;
}

const weekdayLabels = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];

/**
 * 将 Cron 中的当天分钟数格式化为时间。
 *
 * :param minutes: 当天分钟数。
 * :return: HH:mm 格式时间。
 */
function formatJobCronTime(minutes: number): string {
  const hour = Math.floor(minutes / 60)
    .toString()
    .padStart(2, '0');
  const minute = (minutes % 60).toString().padStart(2, '0');
  return `${hour}:${minute}`;
}

/**
 * 将定时任务 Cron 表达式转换为中文含义。
 *
 * :param expression: APScheduler Cron 表达式。
 * :return: Cron 中文描述。
 */
export function getJobCronDescription(expression: string): string {
  const config = parseJobCronExpression(expression);
  if (!config) {
    return expression.trim() ? '自定义计划' : '-';
  }
  if (
    config.mode === 'interval' &&
    config.intervalUnit &&
    config.intervalValue
  ) {
    const unitLabels: Record<JobCronIntervalUnit, string> = {
      hour: '小时',
      minute: '分钟',
      second: '秒',
    };
    return `每${config.intervalValue}${unitLabels[config.intervalUnit]}执行一次`;
  }
  if (config.time === null) {
    return '自定义计划';
  }
  const time = formatJobCronTime(config.time);
  if (config.mode === 'weekly' && config.weekday !== undefined) {
    return `每${weekdayLabels[config.weekday]} ${time}`;
  }
  if (config.mode === 'monthly' && config.monthDay !== undefined) {
    return `每月${config.monthDay}日 ${time}`;
  }
  return `每天 ${time}`;
}
