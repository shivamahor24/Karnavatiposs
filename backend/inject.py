import sys

with open("server.py", "r") as f:
    content = f.read()

with open("payroll_routes_snippet.py", "r") as f:
    snippet = f.read()

# Remove imports from snippet
snippet_lines = snippet.split("\n")
snippet_clean = "\n".join([l for l in snippet_lines if not (l.startswith("import ") or l.startswith("from "))])
snippet_clean = snippet_clean.replace("datetime.datetime.now()", "datetime.now()")

# Add calendar import if missing
if "import calendar" not in content:
    content = content.replace("import sys\n", "import sys\nimport calendar\n")

# Inject snippet
target = "if __name__ == \"__main__\":"
if target in content:
    content = content.replace(target, snippet_clean + "\n\n" + target)
    with open("server.py", "w") as f:
        f.write(content)
    print("Injected successfully!")
else:
    print("Target not found!")
