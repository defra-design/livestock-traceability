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