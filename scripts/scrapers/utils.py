import os

OUTPUT_PARENT = os.path.join("..", "..", "input_data")
GH_LINK_REGEX = (
    r"(?i)(https?:..)?github.com/[A-Za-z0-9-_.]+/[A-Za-z0-9-_.]*[A-Za-z0-9-_]"
)
