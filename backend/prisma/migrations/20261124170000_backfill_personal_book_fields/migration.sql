UPDATE "UserBook" AS user_book
SET "isFavorite" = TRUE
WHERE EXISTS (
  SELECT 1
  FROM "Favorite" AS favorite
  WHERE favorite."userId" = user_book."userId"
    AND favorite."bookId" = user_book."bookId"
);

UPDATE "UserBook" AS user_book
SET
  "rating" = review."rating",
  "comment" = review."comment"
FROM "Review" AS review
WHERE review."userId" = user_book."userId"
  AND review."bookId" = user_book."bookId";
