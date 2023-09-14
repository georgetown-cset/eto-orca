-- get repos we might consider relevant to AI/ML from the LF AI/ML repos and their dependents
WITH
ai_categories AS (
  SELECT
    repo_slug,
    CONCAT(Category, "-", Subcategory) AS category
  FROM
    {{ production_dataset }}.lf_ai_ml_landscape_extended
  WHERE
    (Category = "Deep Learning"
      AND Subcategory = "Framework")
    OR (Category = "Deep Learning"
      AND Subcategory = "Library")
    OR (Category = "Machine Learning"
      AND Subcategory = "Framework")
    OR (Category = "Machine Learning"
      AND Subcategory = "Library")
    OR (Category = "Natural Language Processing"
      AND Subcategory = "Natural Language Processing")
    OR (Category = "Trusted & Responsible AI"
      AND Subcategory = "Explainability")
    OR (Category = "Trusted & Responsible AI"
      AND Subcategory = "Adversarial")
    OR (Category = "Trusted & Responsible AI"
      AND Subcategory = "Bias & Fairness") ),

dep_categories AS (
  SELECT
    repo_slug,
    -1 AS depth, -- deps.dev uses 0 for direct dependencies so we'll use -1 for the base repos themselves
    category
  FROM
    ai_categories
  UNION ALL
  SELECT
    dependent.repo_slug,
    dependent.depth,
    ai_categories.category
  FROM
    ai_categories
  LEFT JOIN
    {{ production_dataset }}.lf_ai_ml_landscape_extended
    USING
      (repo_slug)
  CROSS JOIN
    UNNEST(dependents) AS dependent )

SELECT
  repo_slug,
  category,
  MIN(depth) AS depth
FROM
  dep_categories
GROUP BY
  repo_slug,
  category
