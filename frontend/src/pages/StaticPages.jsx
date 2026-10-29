import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

export function PrivacyPage() {
  const { t } = useTranslation();
  return (
    <article className="container privacy-policy py-5">
      <h1 className="mb-3">{t("static.privacyTitle")}</h1>
      <p className="text-muted">{t("static.privacyIntro")}</p>
      <section className="mt-4">
        <h2>{t("static.privacy")}</h2>
        <h3 className="h5 mt-3">{t("static.infoUsed")}</h3>
        <p>{t("static.infoUsedText")}</p>
        <h3 className="h5 mt-3">{t("static.howUsed")}</h3>
        <p>{t("static.howUsedText")}</p>
        <h3 className="h5 mt-3">{t("static.thirdParty")}</h3>
        <p>{t("static.thirdPartyText")}</p>
        <h3 className="h5 mt-3">{t("static.moderationPrivacyTitle")}</h3>
        <p>{t("static.moderationPrivacyText")}</p>
        <h3 className="h5 mt-3">{t("static.cookies")}</h3>
        <p>{t("static.cookiesText")}</p>
        <h3 className="h5 mt-3">{t("static.policyUpdates")}</h3>
        <p>{t("static.policyUpdatesText")}</p>
      </section>
      <section className="mt-5">
        <h2>{t("static.community")}</h2>
        <ol>
          <li>{t("static.beRespectful")}</li>
          <li>{t("static.noHarm")}</li>
          <li>{t("static.imageRights")}</li>
          <li>{t("static.privateInfo")}</li>
          <li>{t("static.noSpam")}</li>
          <li>{t("static.verify")}</li>
          <li>{t("static.categoryFit")}</li>
          <li>{t("static.moderationRule")}</li>
        </ol>
        <p>{t("static.policyFooter")}</p>
      </section>
    </article>
  );
}

export function NotFoundPage() {
  const { t } = useTranslation();
  return <div className="container py-5"><h1>{t("static.notFound")}</h1><p>{t("static.notFoundText")}</p><Link to="/feed">{t("common.returnHome")}</Link></div>;
}
