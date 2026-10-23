TASK: GENERATE_ITINERARY

Plan a trip with these parameters.
Destination: {destination}
Start date: {startDate}
End date: {endDate}
Number of days: {days}
Travelers: {travelers}
Budget level: {budgetLevel}
Interests: {interests}
Pace: {pace}
Language of the text: {language}
{if(hasNotes)}Traveler notes: {notes}
{endif}
Requirements:
- Return exactly {days} days, numbered 1 to {days}, with dates from {startDate} to {endDate}.
- Each day has a short title and 3 to 6 activities spread over MORNING, AFTERNOON and EVENING, ordered by time.
- Focus on the traveler's interests, but include meals at local places.
- "currency" is the ISO code of the local currency.
- Add 3 to 5 practical tips for this destination (transport, money, etiquette, safety).

{format}
