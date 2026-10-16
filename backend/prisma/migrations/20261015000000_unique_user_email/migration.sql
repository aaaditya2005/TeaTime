UPDATE "User"
SET "email" = LOWER(BTRIM("email"));

CREATE UNIQUE INDEX "User_email_key" ON "User"("email");