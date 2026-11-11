Whole cattle movement v2 - movement on and off shared templates

Installation
- Replace your existing record-full-movement-v2.js route file with the one here.
- Copy the HTML files into app/views/evolution/record-full-movement-v2/.
- Keep your existing review subfolder and other project pages; nothing needs to move.
- README.txt is just an explanation and does not go into the views folder.

Movement off
movement-type -> start-off -> add-method -> animals -> movement-date
-> previous-destinations -> location lookup / confirm-destination
-> check-answers -> submit -> confirmation

Movement on
movement-type -> start-on -> previous-destinations
-> location lookup / confirm-destination -> add-method
-> animals -> movement-date -> check-answers -> submit -> confirmation

- The same Nunjucks pages display appropriate wording for either direction.
- Most shared templates use: {% set isOn = data['rfm-movement-type'] == 'on' %}
- The existing field name 'destination' is reused for the location lookup;
  on movements, its value is the sending location until submission.
- On submission, 'sender' is the selected location and 'destination' is Oakfield Farm
  for on movements. This makes the generated movements table show 'On from ...'.
- The select-from-holding option is hidden and its routes guarded for on movements.
- Location lookup and upload remain simulated for prototype research.
- No additional GET route variables are needed for direction-based content.
- The optional property field has been removed from postcode lookup because
  the current lookup route searches by postcode only.

Changes are limited to the routing and shared HTML. The example location data,
review proposal journey, and other static screens are otherwise retained.

Suggested quick test
1. Start an off movement; ensure it still asks for a destination after the date.
2. Start an on movement; select Hilltop Farm as the sending location.
3. Confirm location, add an ear tag manually or simulate an upload.
4. Enter the arrival date, check Moving from / Moving to, then submit.
5. Check generated movements list says 'On from 56/312/0056'.
