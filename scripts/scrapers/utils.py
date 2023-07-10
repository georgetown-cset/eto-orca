import os

OUTPUT_SCRAPER_PARENT = os.path.join("..", "..", "input_data")
OUTPUT_WEBSITE_PARENT = os.path.join("..", "..", "repo_lists")
GH_LINK_REGEX = (
    r"(?i)(https?:..)?github.com/([A-Za-z0-9-_.]+/[A-Za-z0-9-_.]*[A-Za-z0-9-_])"
)
