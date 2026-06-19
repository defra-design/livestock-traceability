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