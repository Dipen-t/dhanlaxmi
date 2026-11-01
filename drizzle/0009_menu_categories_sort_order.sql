ALTER TABLE "menu_categories" ADD COLUMN "sort_order" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
UPDATE "menu_categories" AS mc
SET "sort_order" = ranked.rn - 1
FROM (
  SELECT
    mc2."menu_id",
    mc2."category_id",
    row_number() OVER (
      PARTITION BY mc2."menu_id"
      ORDER BY dc."sort_order" ASC, dc."id" ASC
    ) AS rn
  FROM "menu_categories" mc2
  INNER JOIN "dish_categories" dc ON dc."id" = mc2."category_id"
) AS ranked
WHERE mc."menu_id" = ranked."menu_id"
  AND mc."category_id" = ranked."category_id";
