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

    if (months < 24) {
      return `${months} month${months === 1 ? '' : 's'}`;
    }

    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;

    if (remainingMonths > 0) {
      return `${years} year${years === 1 ? '' : 's'} ${remainingMonths} month${remainingMonths === 1 ? '' : 's'}`;
    }

    return `${years} year${years === 1 ? '' : 's'}`;
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