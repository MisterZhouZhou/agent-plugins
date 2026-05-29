# Pagination

## Use for

Paginated lists, infinite scrolling and keeping previous data visible.

## Guidance

- Include pagination and filter values in the query key.
- Use placeholder data or framework-supported previous-data behavior to reduce flicker.
- Keep infinite query page params explicit.

## Checks

- Empty state and end-of-list state are distinct.
- Sort/filter changes reset or validate the current page.

