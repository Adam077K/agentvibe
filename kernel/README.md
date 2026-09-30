# kernel/ — `avk`

The Kernel's Go module (docs/vision-v3/09a-ENGINEERING.md §2). Protected base (09a §14).

Check it, from the repository root:

```sh
go -C kernel test -count=1 ./...
```

That runs `avk-boundary` against the real tree and the negative fixtures that prove each check fails:

- every module in the build is stdlib or listed in `ALLOWED_MODULES`, and none is `replace`d;
- non-test Go source stays at or under 8,000 lines (`-max-lines`);
- no source file outside `kernel/` names the Journal (`internal/journal.Path`).

`-count=1` is required: a cached pass would not rescan the repository. For readable findings:
`go -C kernel run ./cmd/avk-boundary` (exit 0 clean · 1 finding · 2 could not check).
