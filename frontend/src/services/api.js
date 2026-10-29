import i18n from "../i18n.js";

const errorKeys = {
  "Incorrect username or password.": "error.incorrectCredentials",
  "An account with this email already exists.": "error.emailExists",
  "That email or username is already in use.": "error.accountExists",
  "That username is already in use.": "error.usernameExists",
  "Username must be at least 6 characters long.": "error.usernameShort",
  "Username is required.": "error.usernameRequired",
  "Email is required.": "error.emailRequired",
  "You have already posted today. Come back tomorrow to post again.": "error.postedToday",
  "This post may contain content that cannot be published.": "error.moderationProhibited",
  "Remove private or identifying information before publishing.": "error.moderationPrivateInfo",
  "This post may not fit the selected category. Please review it.": "error.moderationCategoryMismatch",
  "This post needs changes before it can be published. Please review it.": "error.moderationReview",
  "Post safety checks are temporarily unavailable. Please try again later.": "error.moderationUnavailable",
  "Upload a PNG or JPEG image.": "error.imageType",
  "The uploaded image is not a valid PNG or JPEG.": "error.imageInvalid",
  "Your account could not be verified.": "error.accountUnavailable",
  "No posts are available in this category yet.": "error.noPosts",
  "Post not found.": "error.postNotFound",
  "Comment not found.": "error.commentNotFound",
  "You must be logged in to perform this action.": "error.loginRequired",
  "You don't have access to perform this action.": "error.noAccess",
  "You can only update your own profile.": "error.notYourProfile",
  "Choose a supported language.": "error.languageUnsupported",
  "User is unknown.": "error.unknownUser",
  "News API is not configured.": "error.newsNotConfigured",
  "News is temporarily unavailable.": "error.newsUnavailable",
  "News translation is temporarily unavailable.": "error.newsTranslationUnavailable",
  "API route not found.": "error.apiNotFound",
};

export async function api(path, options = {}) {
  const headers = new Headers(options.headers || {});
  let body = options.body;

  if (body && !(body instanceof FormData) && typeof body !== "string") {
    headers.set("Content-Type", "application/json");
    body = JSON.stringify(body);
  }

  let response;
  try {
    response = await fetch(`/api${path}`, {
      ...options,
      headers,
      body,
      credentials: "include",
    });
  } catch {
    throw new Error(i18n.t("common.connectFailed"));
  }
  const contentType = response.headers.get("content-type") || "";
  const data = contentType.includes("application/json")
    ? await response.json()
    : { error: await response.text() };

  if (!response.ok) {
    if (data.code === "POST_MODERATION") {
      const reasonKeys = {
        prohibited_content: "moderation.prohibited",
        private_information: "moderation.privateInformation",
        category_mismatch: "moderation.categoryMismatch",
        uncertain: "moderation.review",
      };
      const fieldNames = {
        title: i18n.t("editor.titleLabel"),
        description: i18n.t("editor.description"),
        info: i18n.t("editor.info"),
        image: i18n.t("editor.uploadImage"),
        category: i18n.t("editor.category"),
        post: i18n.t("moderation.wholePost"),
      };
      const fields = (data.fieldsToFix || []).map(field => fieldNames[field] || field).join(", ");
      throw new Error(i18n.t(reasonKeys[data.reasonCode] || "moderation.review", { fields }));
    }
    const key = errorKeys[data.error];
    const message = key
      ? i18n.t(key)
      : i18n.t("common.serverError");
    throw new Error(message);
  }

  return data;
}
