export const categories = [
  "Fitness",
  "Lifestyle",
  "Research",
  "Music",
  "Art",
  "Education",
  "Finance",
  "Other"
] as const;

export const acceptedUploadTypes = [
  "video/mp4",
  "video/quicktime",
  "audio/mpeg",
  "audio/wav",
  "image/jpeg",
  "image/png",
  "image/gif",
  "application/pdf",
  "text/plain",
  "text/markdown",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "text/csv",
  "application/json"
];

export const maxUploadBytes = 100 * 1024 * 1024;
