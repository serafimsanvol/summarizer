-- CreateTable
CREATE TABLE "WhisperResponse" (
    "id" TEXT NOT NULL,
    "youtubeId" TEXT NOT NULL,
    "response" TEXT NOT NULL,

    CONSTRAINT "WhisperResponse_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WhisperResponse_youtubeId_idx" ON "WhisperResponse"("youtubeId");
