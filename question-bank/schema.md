# Question schema (YAML)

Each category file in `categories/` contains:

```yaml
version: 1
category: <string>
questions:
  - id: <string>                # stable id, e.g. PD-001
    difficulty: <easy|medium|hard>
    prompt: <string>            # what the interviewer asks
    what_good_looks_like:       # scoring rubric (bullet list strings)
      - <string>
    answer:
      structure:                # how to structure the response
        - <string>
      sample: <string>          # a strong example answer (concise but complete)
    follow_ups:                 # typical probing follow-ups
      - <string>
    variants:                   # optional: alternate prompt phrasings
      - <string>
```

## Conventions

- **Sample answers** are written as if you are speaking live in an interview: structured, explicit trade-offs, clear metrics.
- **Rubrics** are designed to be used for self-scoring (0/1/2 per bullet if you want).
- **Follow-ups** include both “drill-down” and “curveball” probes.

