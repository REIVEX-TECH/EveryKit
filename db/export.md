# Getting the list out

There is no dashboard and no export button. The table is small and boring on
purpose, so `psql` is the tool.

```bash
psql "$DATABASE_URL" -c "\copy (select email, first_kit, created_at from emails order by created_at) to 'emails.csv' csv header"
```

`DATABASE_URL` is the same pooled connection string the hub uses. Neon shows it
under the project's connection details; locally it is
`postgres://everykit:everykit@localhost:5432/everykit`.

A few other things worth knowing:

```bash
# How many people, and which kit brought them
psql "$DATABASE_URL" -c "select first_kit, count(*) from emails group by first_kit order by count desc"

# Signups in the last week
psql "$DATABASE_URL" -c "select date(created_at), count(*) from emails where created_at > now() - interval '7 days' group by 1 order by 1"

# Remove someone who asked to be removed
psql "$DATABASE_URL" -c "delete from emails where email = 'someone@example.com'"
```

That last one is the whole unsubscribe process in v1. Someone emails
hello@useeverykit.com, you run the delete. Automating it is not worth building
until the volume makes it worth building.
