import * as moment from 'moment';

export class PeriodsModel {
  constructor(periodEndDates) {
    const ranges = periodEndDates.map((date, index) => ({
      startDate: 
        index === (periodEndDates.length -1) ? moment('2020-11-01').subtract(2, 'minute').format('YYYY-MM-DD HH:mm:ss') :
          moment(periodEndDates[index + 1]).subtract(2, 'minute').format('YYYY-MM-DD HH:mm:ss'),
      endDate: moment(date).format('YYYY-MM-DD HH:mm:ss')
    }));
    ranges.unshift({
      startDate: moment(periodEndDates[0]).subtract(2, 'minute').format('YYYY-MM-DD HH:mm:ss'),
      endDate: moment().endOf('day').format('YYYY-MM-DD HH:mm:ss')
    });
    return ranges;
  }
}