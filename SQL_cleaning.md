# Science Map Deduplication

### Overview

The deduplication process considers unique rows and attempts to reduce duplicates based on the most common heuristics and spelling conventions. It does not attempt to correct spelling errors nor match opinionated ways of expressing a funder name. Further deduplication is done using parentheses, the rest is done on ASCII-compliant strings, and everything else is normalized using a light, relatively safe string cleaning process. 

### Process

This process was optimized based on common matches, not sparse funders for which there may only be a scattering in total. The initial exploration was done, and finally on with at least 10 instances.

### Preprocessing

`funders` for `science_map` is based on `gcp-cset-projects.science_map_v2.dc5_funder_latest`.
The table has 17 million rows for a total of 1.71GB.

Without taking the sum over `NP_funder`, and instead counting by cluster appearances, I select unique `funder` values with their respective counts into a new table `cset_intern_jms727.dc5_funder_distinct`. This table has 4,783,566 distinct rows.

The top 10k rows are put in `cset_intern_jms727.dc5_funder_distinct_small` for experimentation.

```
SELECT
  DISTINCT funder,
  country,
  COUNT(*) AS count
FROM
  `gcp-cset-projects.cset_intern_jms727.dc5_funder_latest`
GROUP BY
  funder,
  country
ORDER BY
  count DESC
```

Looking at the top 10k funder rows in order, we see commmon patterns emerge.

__Capitalization error:__
```
"Double First-Class" University Project
"Double First-Class" University project
```
__&/and substitution error__
```
"Cooperative Research Program for Agriculture Science & Technology Development" Rural Development Administration, Republic of Korea
"Cooperative Research Program for Agriculture Science and Technology Development" Rural Development Administration, Republic of Korea
```
__Naming, Translation Conventions, including country reference__
```
973 Program
973 Program of China
973 Project
973 program
973 project
973计划
```
__Acronym, country references__
```
Agencia Nacional de Promocion Cientifica y Tecnologica
Agencia Nacional de Promocion Cientifica y Tecnologica, Argentina
Agencia Nacional de Promocion Cientifica y Tecnologica (ANPCyT)
```

Note that non-unique rows are still filtered separately by the presence or nonpresence of `country` values.

Based on this initial review and an exploration of selections of the complete dataset (`LIKE 'B%'`, etc), I decided to start with seom basic cleaning.

### Basic Cleaning

The first things to note in the dataset are:

- low hanging fruit: easy substitution deduplication (& -> and, Centre -> Center)
- there are vast numbers of typos that expand the dataset
- (add more)

The cleaning process is US and China centered, as these are the primary countries of interest.

Based on a preliminary review the following critical whitespace-sensitive replacements were made:

```
& -> and
Chinese -> China
"UK " -> "United Kingdom "
"U.S." -> "United States"
"US " -> "United States "
```

After this process, the following secondary replacements were __deleted__:

```
"(.*?)supported\sby\sthe\s"
"^supported\sby\s"
"^the\s"
```

And leading/trailing whitespace and quotations were trimmed.

This process is easily manipulable. For example, if we decide to also make a common replacement of Centre -> Center or P/program -> P/project, we can easily add another SQL `REPLACE()` wrapper.

I then add boolean columns to indicate whether a string was ASCII-compliant and had more than 3 words.

I now carefully attack special cases. I begin by matching acronyms to funders.

### Acronym to Funder
`acronym_to_funder.sql -> gcp-cset-projects.cset_intern_jms727.acronym_to_funder`

Based on the initial exploration, the vast majority of correct funders with parentheses have the country or funder acronym inside the parentheses.

This cleaning process begins with the basic replacements we made above and attempts to create a matcher from acronyms to funders, where they exist. This allows us to match the following:

```
Agencia Nacional de Promocion Cientifica y Tecnologica
Agencia Nacional de Promocion Cientifica y Tecnologica (ANPCyT)
```

Using regex, I extract and make uppercase all results inside parentheses, filtering on ASCII-compliant strings only. Next, using the table `cset_intern_jms727.countries`, I remove those where the string inside the parentheses is simply a country name.

There are some acronyms which are clearly not matchable. For example, `Arachidonic Acid (AA)` is clearly an incorrectly extracted funder. This problem of incorrectly extracted/typos can be limited by filtering on those with multiple `count` instances. At the end of this process, there are "acronyms" which are one letter or contain two sequences separated by whitespace. These are removed.

At this point, there are acronyms with multiple _correct_ matches. The purpose of matching acronyms to funders is to get the correct funder when the `funder` column has the acronym in question. The most common match is usually the correct one. Using `ROW_NUMBER()`, I chose to drop the rest which are often different spelling conventions or less common.


(Do another query to get exact number of reduced matches)

### Clean without Parentheses

`clean_wo_parentheses.sql -> gcp-cset-projects.cset_intern_jms727.clean_wo_parentheses`

This process makes a moderately risky choice of clearing all characters not in `[^a-zA-Z0-9\s\-]` over all ASCII-only strings. Because of this, we only select the 

Additionally, this demonstrates the iterative process that can be used across overlapping strings, where we combine in the next step.

(the final ROW_NUMBER() helps us note which ones have a funder with both a listed country and `null` in country)

Example:
```
"100 Talents Plan" of Hubei Province
100 Talents Plan of Hebei Province
100 talents plan of Hebei Province
```

are all normalized to `100 TALENTS PLAN OF HEBEI PROVINCE`.


### Combine

`preliminary_results.sql`

Applies the above process into columns and adds the most rudimentary cleaning process described earlier.

### Final Results

`final_matcher.sql -> gcp-cset-projects.cset_intern_jms727.final_matcher`

Takes the first match by order of importance: acronym_match, parentheses_match, otherwise_cleaned.


### Limitations

MINISTRY OF HIGHER EDUCATION, for example, not aggregated by country.
Unfortunately no way to fix while keeping heuristics unless done manually
But still achieves the main point of normalizing the string only section
  

### Potential Further Steps

More manual replacements can be made by adding into the final cleaning process a matcher from Chinese strings to their appropriate English translations - ideally, before the rest of the cleaning process to further cut down on duplicates.


A package like `fuzzywuzzy` _may_ be able to correctly resolve these issues.

There are many, many good examples for why two strings may be mismatched and resolvable using `fuzzywuzzy`: from typos to translation quirks such as center and centre. Doing so requires introducing very strict rules: minimum string length, word count, etc.

There are two potential issues: the possible combinations of millions of unique funders makes it difficult to run on resource constraints. Therefore, it would be best to go through the top funders by count first.

The main problem is strings with levenshtein distance that are close to each other but functionally different.

Further exploration is needed to address these issues.
