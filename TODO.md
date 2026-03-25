# todo list

- [ ] figure out how to handle decimal quantities on partial bar bottles better. sometimes the rounding throws the counts off slightly.
- [ ] need to swap out the hardcoded 1234 pin screen for actual authentication before we put this into production.
- [ ] add a csv or pdf export for the end of month variance reports. finance keeps asking for this so we probably need it soon.
- [ ] the sysco import script works fine for normal files but crashes completely if the csv header is missing a column. needs better error handling.
- [ ] fix the responsive styling on the purchasing tables. they look fine on desktop but get completely squeezed together on smaller screens and mobile.
- [ ] double check to see if we should block users from deleting items in the catalog if they are already tied to older purchase orders. maybe just mark them as archived instead so we don't break history.
- [ ] clean out the leftover console logs in the inventory counts logic.
