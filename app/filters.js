//
// For guidance on how to create filters see:
// https://prototype-kit.service.gov.uk/docs/filters
//

const govukPrototypeKit = require('govuk-prototype-kit')
const addFilter = govukPrototypeKit.views.addFilter

// Add your filters here

addFilter('removeWhiteSpace', function(text) {
    if (text !== undefined) {
        return text.replace(/\s/g, '');
    }else{
        return text;
    }
 });

 // format ear-tag
 addFilter('formatReference', function(value) {
     if (!value) {
         return '';
     }

     const cleanValue = String(value).replace(/\s+/g, '');

     return cleanValue.replace(/^(.{2})(.{6})(.{6})$/, '$1 $2 $3');
 });


 addFilter('shortDateFormat', function (value) {
   if (!value || typeof value !== 'string') {
     return value;
   }

   const parts = value.split('-');

   if (parts.length !== 3) {
     return value;
   }

   const [day, month, year] = parts;

   const monthNames = [
     'Jan',
     'Feb',
     'Mar',
     'Apr',
     'May',
     'Jun',
     'Jul',
     'Aug',
     'Sep',
     'Oct',
     'Nov',
     'Dec'
   ];

   const monthIndex = Number(month) - 1;

   if (
     !Number.isInteger(monthIndex) ||
     monthIndex < 0 ||
     monthIndex > 11
   ) {
     return value;
   }

   return `${Number(day)} ${monthNames[monthIndex]} ${year}`;
 });

 addFilter('selectedOptions', function (value) {
   if (!value) {
     return '';
   }

   const values = Array.isArray(value)
     ? value
     : [value];

   return values
     .flatMap((item) => String(item).split(','))
     .map((item) => item.trim())
     .filter((item) => {
       return item && item !== '_unchecked';
     })
     .filter((item, index, items) => {
       return items.indexOf(item) === index;
     })
     .join(' or ');
 });

addFilter('sexToLetter', function(value) {
   if (!value) {
     return '';
   }

   const sex = String(value).trim().toLowerCase();

   if (sex === 'male') {
     return 'M';
   }

   if (sex === 'female') {
     return 'F';
   }

   return value;
 });

 addFilter('fullDateFormat', function (value) {
    if (!value || typeof value !== 'string') {
      return value;
    }

    const parts = value.split('-');

    if (parts.length !== 3) {
      return value;
    }

    const [day, month, year] = parts;

    const monthNames = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December'
    ];

    const monthIndex = Number(month) - 1;

    if (
      !Number.isInteger(monthIndex) ||
      monthIndex < 0 ||
      monthIndex > 11
    ) {
      return value;
    }

    return `${Number(day)} ${monthNames[monthIndex]} ${year}`;
  });

  addFilter('animalAge', function (value) {
    if (!value || typeof value !== 'string') {
      return value;
    }

    const parts = value.split('-');

    if (parts.length !== 3) {
      return value;
    }

    const [day, month, year] = parts.map(Number);
    const dateOfBirth = new Date(year, month - 1, day);

    if (Number.isNaN(dateOfBirth.getTime())) {
      return value;
    }

    const now = new Date();

    let months = (now.getFullYear() - dateOfBirth.getFullYear()) * 12 + (now.getMonth() - dateOfBirth.getMonth());

    if (now.getDate() < dateOfBirth.getDate()) {
      months--;
    }

    if (months < 1) {
      const days = Math.floor((now - dateOfBirth) / (1000 * 60 * 60 * 24));

      return `${days} day${days === 1 ? '' : 's'}`;
    }

    if (months < 12) {
      return `${months} month${months === 1 ? '' : 's'}`;
    }

    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;

    return `${years} year${years === 1 ? '' : 's'} ${remainingMonths} month${remainingMonths === 1 ? '' : 's'}`;
  });

  addFilter('sexInitial', function (value) {
    if (!value || typeof value !== 'string') {
      return value;
    }

    if (value.toLowerCase() === 'female') {
      return 'F';
    }

    if (value.toLowerCase() === 'male') {
      return 'M';
    }

    return value;
  });



  function parseAnimalDate(value) {
    if (!value) {
      return null;
    }

    const input = String(value).trim();

    const ukMatch = input.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
    const isoMatch = input.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);

    let year;
    let month;
    let day;

    if (ukMatch) {
      day = Number(ukMatch[1]);
      month = Number(ukMatch[2]);
      year = Number(ukMatch[3]);
    } else if (isoMatch) {
      year = Number(isoMatch[1]);
      month = Number(isoMatch[2]);
      day = Number(isoMatch[3]);
    } else {
      const parsed = new Date(input);

      if (Number.isNaN(parsed.getTime())) {
        return null;
      }

      return new Date(
        parsed.getFullYear(),
        parsed.getMonth(),
        parsed.getDate()
      );
    }

    const parsed = new Date(year, month - 1, day);

    if (
      parsed.getFullYear() !== year
      || parsed.getMonth() !== month - 1
      || parsed.getDate() !== day
    ) {
      return null;
    }

    return parsed;
  }

  addFilter('animalAge', function (value, endValue){
    const dateOfBirth = parseAnimalDate(value);

    if (!dateOfBirth) {
      return '';
    }

    const endDate = endValue
      ? parseAnimalDate(endValue)
      : new Date();

    if (!endDate) {
      return '';
    }

    const comparisonDate = new Date(
      endDate.getFullYear(),
      endDate.getMonth(),
      endDate.getDate()
    );

    if (dateOfBirth > comparisonDate) {
      return '';
    }

    let years = comparisonDate.getFullYear() - dateOfBirth.getFullYear();
    let months = comparisonDate.getMonth() - dateOfBirth.getMonth();

    if (comparisonDate.getDate() < dateOfBirth.getDate()) {
      months -= 1;
    }

    if (months < 0) {
      years -= 1;
      months += 12;
    }

    if (years >= 1) {
      const yearText = years === 1
        ? '1 year'
        : years + ' years';

      if (months === 0) {
        return yearText;
      }

      const monthText = months === 1
        ? '1 month'
        : months + ' months';

      return yearText + ', ' + monthText;
    }

    if (months >= 1) {
      return months === 1
        ? '1 month'
        : months + ' months';
    }

    const millisecondsPerDay = 1000 * 60 * 60 * 24;
    const days = Math.floor(
      (comparisonDate.getTime() - dateOfBirth.getTime())
      / millisecondsPerDay
    );

    const weeks = Math.floor(days / 7);

    if (weeks < 1) {
      return 'Less than 1 week';
    }

    return weeks === 1
      ? '1 week'
      : weeks + ' weeks';
  })


