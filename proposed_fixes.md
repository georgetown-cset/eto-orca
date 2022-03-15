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

### Week of 3/7/2022

Based on last issue: 

 Do a word count over the stuff in the parentheses/after the hyphen. Report on distribution and on contents of outliers with largest number of words.

 Create beam pipeline to cleanup the funding strings (Jennifer will find a repo as an example)

 Write a query that can be used to create a table mapping abbreviations/stuff in parentheses to the non-abbreviated string (as well as some kind of filter or check for abbreviations with multiple expanded forms) - e.g. given the string National Natural Science Foundation of China (NSFC), we can map "NSFC" to "National Natural Science Foundation of China" in this table, and then (assuming NSFC is mapped to no other strings in our corpus), normalize "NSFC" to "National Natural Science Foundation of China".

 Once you have a cleaned up table, for each funding inst report on number of other insts that are above a few similarity thresholds (from fuzzywuzzy or simple word overlap or...), as well as your impressions of how many of these are true duplicates based on examining (say) 10 institutions' matches. We are trying to (a) surface some other simple heuristics we could apply to clean up the data (for example, I suspect there are some abbreviations like "Inst" and "Univ" that could get cleaned up) and (b) get a sense of how large a manual cleanup effort would be

 Jennifer to point Jerod to a table mapping en to foreign language
 