# Fixture: a shell script appending to the Journal with the sqlite3 CLI. Must fail.
sqlite3 "$HOME/.agentvibe/kernel/journal.db" "INSERT INTO events DEFAULT VALUES"
