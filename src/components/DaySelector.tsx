import React, { useMemo, useCallback } from 'react';
import { Text, View, StyleSheet } from 'react-native';
import dayjs from 'dayjs';
import { useCalendarContext } from '../CalendarContext';
import Day, { EmptyDay } from './Day';
import {
  getParsedDate,
  getMonthDays,
  getWeekdaysMin,
  getDaysInMonth,
  areDatesOnSameDay,
  isDateBetween,
  getDate,
  getFormated,
} from '../utils';

const DaySelector = () => {
  const {
    mode,
    date,
    startDate,
    endDate,
    dates,
    currentDate,
    onSelectDate,
    displayFullDays,
    minDate,
    maxDate,
    disabledDates,
    firstDayOfWeek,
    theme,
    height,
  } = useCalendarContext();

  const { year, month, hour, minute } = getParsedDate(currentDate);

  const daysGrid = useMemo(
    () => {
      const today = dayjs().format('YYYY-MM-DD');

      const { fullDaysInMonth } = getDaysInMonth(
        currentDate,
        displayFullDays,
        firstDayOfWeek
      );

      return getMonthDays(
        currentDate,
        displayFullDays,
        minDate,
        maxDate,
        firstDayOfWeek,
        disabledDates
      ).map((day, index) => {
        if (day) {
          let leftCrop = day.dayOfMonth === 1;
          let rightCrop = day.dayOfMonth === fullDaysInMonth;

          const isFirstDayOfMonth = day.dayOfMonth === 1;
          const isLastDayOfMonth =
            (day?.dayOfMonth || 0) - ((day?.dayOfMonth || 0) - day.day) ===
            fullDaysInMonth;

          const isToday = areDatesOnSameDay(day.date, today);
          let inRange = false;
          let isSelected = false;

          if (mode === 'range') {
            rightCrop = false;
            const selectedStartDay = areDatesOnSameDay(
              dayjs(day.date, { jalali: dayjs.isJalali() }),
              startDate
            );
            const selectedEndDay = areDatesOnSameDay(
              dayjs(day.date, { jalali: dayjs.isJalali() }),
              endDate
            );
            isSelected = selectedStartDay || selectedEndDay;
            inRange = isDateBetween(
              dayjs(day.date, { jalali: dayjs.isJalali() }),
              {
                startDate,
                endDate,
              }
            );
            if (selectedStartDay) {
              leftCrop = true;
            }
            if (selectedEndDay) {
              rightCrop = true;
            }
            if (index % 7 === 0 && !selectedStartDay) {
              leftCrop = false;
            }

            if (index % 7 === 6 && !selectedEndDay) {
              rightCrop = false;
            }

            if (
              (isFirstDayOfMonth && selectedEndDay) ||
              (isLastDayOfMonth && selectedStartDay) ||
              dayjs(startDate).format('DDMMYYYY') ===
                dayjs(endDate).format('DDMMYYYY')
            ) {
              inRange = false;
            }
          } else if (mode === 'multiple') {
            const safeDates = dates || [];
            isSelected = safeDates.some((d) =>
              areDatesOnSameDay(
                dayjs(day.date, { jalali: dayjs.isJalali() }),
                d
              )
            );

            const yesterday = dayjs(day.date, { jalali: dayjs.isJalali() }).add(
              -1,
              'day'
            );
            const tomorrow = dayjs(day.date, { jalali: dayjs.isJalali() }).add(
              1,
              'day'
            );

            const yesterdaySelected = safeDates.some((d) =>
              areDatesOnSameDay(d, yesterday)
            );
            const tomorrowSelected = safeDates.some((d) =>
              areDatesOnSameDay(d, tomorrow)
            );

            if (isSelected) {
              if (tomorrowSelected && yesterdaySelected) {
                inRange = true;
              }
              if (tomorrowSelected && !yesterdaySelected) {
                inRange = true;
                leftCrop = true;
              }

              if (yesterdaySelected && !tomorrowSelected) {
                inRange = true;
                rightCrop = true;
              }

              if (isFirstDayOfMonth && !tomorrowSelected) {
                inRange = false;
              }

              if (isLastDayOfMonth && !yesterdaySelected) {
                inRange = false;
              }

              if (inRange && !leftCrop && !rightCrop) {
                isSelected = false;
              }
            }
          } else if (mode === 'single') {
            isSelected = areDatesOnSameDay(
              dayjs(day.date, { jalali: dayjs.isJalali() }),
              date
            );
          }

          return {
            ...day,
            isToday,
            isSelected,
            inRange,
            leftCrop,
            rightCrop,
          };
        } else {
          return null;
        }
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      mode,
      month,
      year,
      displayFullDays,
      firstDayOfWeek,
      minDate,
      maxDate,
      disabledDates,
      date,
      startDate,
      endDate,
      dates,
    ]
  );

  const handleSelectDate = useCallback(
    (date: string) => {
      const newDate = getDate(date).hour(hour).minute(minute);

      onSelectDate(getFormated(newDate));
    },
    [onSelectDate, hour, minute]
  );

  return (
    <View style={styles.container} testID="day-selector">
      <View
        style={[styles.weekDaysContainer, theme?.weekDaysContainerStyle]}
        testID="week-days"
      >
        {getWeekdaysMin(firstDayOfWeek)?.map((item, index) => (
          <View key={index} style={styles.weekDayCell}>
            <Text style={theme?.weekDaysTextStyle}>{item}</Text>
          </View>
        ))}
      </View>
      <View style={styles.daysContainer} testID="days">
        {daysGrid?.map((day, index) => {
          return day ? (
            <Day
              key={index}
              date={day.date}
              text={day.text}
              disabled={day.disabled}
              isCurrentMonth={day.isCurrentMonth}
              theme={theme}
              isToday={day.isToday}
              isSelected={day.isSelected}
              inRange={day.inRange}
              leftCrop={day.leftCrop}
              rightCrop={day.rightCrop}
              onSelectDate={handleSelectDate}
              height={height}
            />
          ) : (
            <EmptyDay key={index} height={height} />
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 5,
    width: '100%',
  },
  weekDaysContainer: {
    width: '100%',
    flexDirection: 'row',
    paddingBottom: 10,
    paddingTop: 5,
    marginBottom: 10,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderColor: '#E5E5E5',
  },
  weekDayCell: {
    width: '14.2%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  daysContainer: {
    flex: 1,
    width: '100%',
    height: '100%',
    flexWrap: 'wrap',
    flexDirection: 'row',
    alignContent: 'flex-start',
  },
});

export default DaySelector;
