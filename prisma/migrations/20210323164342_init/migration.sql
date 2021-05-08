-- CreateTable
CREATE TABLE "Scene" (
    "camera" TEXT NOT NULL,
    "timestamp" DATETIME NOT NULL,
    "path" TEXT NOT NULL,

    PRIMARY KEY ("camera", "timestamp")
);
