import moment from 'moment';

export class DateHelper {
  static formatDate(date: Date): string {
    return moment(date).format('DD/MM/YYYY');
  }

  static formatHoursMinutes(date: Date): string {
    return moment(date).format('hh:mm');
  }
}
