### BQ Results Top 100 Stored in Temporary Table dc5_funder_100

Low hanging fruit: clean string from anything in partnehsis and afterwards, easy regex attack.

A long fix

The proposed solution is to go through SQL first in Bigquery, not going through pandas - using Excel to explore for now...

Merge based on names - unless it is something patently vague such as "Office of Science" or "Ministry of Education" can simply combine

So for something like  

National Natural Science Foundation of China - China
National Natural Science Foundation of China (NSFC)	
NSFC
National Science Foundation of China
国家自然科学基金

If anything is in this set, normalize to a standard name.
If can match long names - China, United Kingdom, etc to abbreviations, that would also cut down a lot. 

Centers for Disease Control and Prevention - United States	
Centers for Disease Control & Prevention - USA
in
https://sciencemap.cset.tech/cluster/79315.html


Have something that does country abbreviations and should get quite a lot of good matches killed off.

Russian Foundation for Basic Research - Russia
Russian Foundation for Basic Research (RFBR)
https://sciencemap.cset.tech/cluster/27795.html


Swiss National Science Foundation - Switzerland	
Swiss National Science Foundation (SNF)
https://sciencemap.cset.tech/cluster/52373.html

More ideas off the top of my head:



The goal is to merge all of them into one, so, needs to be a two-step process to deduplicate.

Probably best to have a single 

Go through maybe 200-300 or so, create a master lookup file, will get rid of 90% of the problems.

Basically of the clusters,


https://opendata.stackexchange.com/questions/115/are-there-any-good-libraries-available-for-doing-normalization-of-company-names

https://docs.openrefine.org/


Look through all that have a (something in parenthesis) towards the end and create something that kills that off.
