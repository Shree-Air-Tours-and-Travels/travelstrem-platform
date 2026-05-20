# Controller Migration Examples

## Customer Shell Hero

Before: `heroController` assembled title, labels, and structure by hand.

After:

```js
const hero = await Hero.findOne().sort({ createdAt: -1 });
const page = pageDefinitionService.buildPageResponse("customer-shell/home", {
  injectData: hero ? {
    title: hero.title,
    description: hero.description
  } : undefined
});
return res.json(page);
```

## Tours Remote Details

```js
const page = pageDefinitionService.buildPageResponse("tours-remote/details", {
  injectData: {
    title: tour.title,
    tour,
    tours: [tour]
  }
});
return res.json(page);
```

Use `GET /api/pages/customer-shell/home` and `GET /api/pages/tours-remote/listing` as canonical render-only examples.
